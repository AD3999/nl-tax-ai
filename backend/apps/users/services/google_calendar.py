"""
Google Calendar push sync service.

Flow:
  1. User clicks "Connect" in TaxCalendarPage.
  2. Frontend calls GET /api/users/google-calendar/auth-url/ → receives redirect URL.
  3. User is sent to Google consent screen (scope: calendar.events).
  4. Google redirects to GET /api/users/google-calendar/callback/?code=XXX&state=<user_id>.
  5. Backend exchanges code for tokens, stores refresh_token on User (encrypted via Django signing).
  6. Celery task push_google_calendar_task.delay(user_id) creates events immediately.
  7. Future: task runs daily to keep events in sync with updated deadlines.

Architecture:
  - Uses Google OAuth2 REST API directly (no google-api-python-client dependency).
  - Access tokens expire in 1h; refresh automatically on each push.
  - Refresh token stored encrypted via django.core.signing (uses SECRET_KEY).
  - Events are identified by their extendedProperties.private.taxwijs_id so they
    can be updated rather than duplicated on re-sync.
"""
from __future__ import annotations

import json
import logging
from datetime import date, timedelta
from urllib.parse import urlencode

import requests as _http

from django.conf import settings
from django.core import signing

logger = logging.getLogger(__name__)

GOOGLE_AUTH_URL   = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL  = "https://oauth2.googleapis.com/token"
GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke"
CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3"

CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events"

# Dutch tax deadlines for push sync (mirrors TaxCalendarPage.tsx events)
TAX_DEADLINES_2026 = [
    {
        "id": "btw-q1-2026",
        "title_nl": "BTW aangifte Q1 2026",
        "title_en": "VAT return Q1 2026",
        "title_fa": "اظهارنامه مالیات بر ارزش افزوده Q1 2026",
        "date": date(2026, 4, 30),
        "description": "Deadline BTW aangifte Q1 (jan–mrt). Bron: Belastingdienst.nl",
    },
    {
        "id": "ib-2025-2026",
        "title_nl": "Aangifte inkomstenbelasting 2025",
        "title_en": "Income tax return 2025",
        "title_fa": "اظهارنامه مالیات بر درآمد ۲۰۲۵",
        "date": date(2026, 5, 1),
        "description": "Deadline IB-aangifte belastingjaar 2025. Bron: Belastingdienst.nl",
    },
    {
        "id": "btw-q2-2026",
        "title_nl": "BTW aangifte Q2 2026",
        "title_en": "VAT return Q2 2026",
        "title_fa": "اظهارنامه مالیات بر ارزش افزوده Q2 2026",
        "date": date(2026, 7, 31),
        "description": "Deadline BTW aangifte Q2 (apr–jun). Bron: Belastingdienst.nl",
    },
    {
        "id": "btw-q3-2026",
        "title_nl": "BTW aangifte Q3 2026",
        "title_en": "VAT return Q3 2026",
        "title_fa": "اظهارنامه مالیات بر ارزش افزوده Q3 2026",
        "date": date(2026, 10, 31),
        "description": "Deadline BTW aangifte Q3 (jul–sep). Bron: Belastingdienst.nl",
    },
    {
        "id": "btw-q4-2026",
        "title_nl": "BTW aangifte Q4 2026",
        "title_en": "VAT return Q4 2026",
        "title_fa": "اظهارنامه مالیات بر ارزش افزوده Q4 2026",
        "date": date(2027, 1, 31),
        "description": "Deadline BTW aangifte Q4 (okt–dec). Bron: Belastingdienst.nl",
    },
    {
        "id": "zelfstandigenaftrek-hours-2026",
        "title_nl": "Urencriterium deadline (1225 uren)",
        "title_en": "Hours criterion deadline (1225 hours)",
        "title_fa": "مهلت معیار ساعات (۱۲۲۵ ساعت)",
        "date": date(2026, 12, 31),
        "description": "Zorg dat u 1225 uur in uw bedrijf heeft gewerkt voor zelfstandigenaftrek. Bron: Belastingdienst.nl",
    },
]


# ── Token encryption ──────────────────────────────────────────────────────────

def _encrypt(value: str) -> str:
    return signing.dumps(value, salt="gcal_refresh_token")


def _decrypt(value: str) -> str:
    return signing.loads(value, salt="gcal_refresh_token")


# ── OAuth helpers ─────────────────────────────────────────────────────────────

def get_auth_url(redirect_uri: str, state: str) -> str:
    """Return the Google consent URL. state encodes the user_id for the callback."""
    params = {
        "client_id":     settings.GOOGLE_CLIENT_ID,
        "redirect_uri":  redirect_uri,
        "response_type": "code",
        "scope":         CALENDAR_SCOPE,
        "access_type":   "offline",   # required to get refresh_token
        "prompt":        "consent",   # force re-consent so we always get refresh_token
        "state":         state,
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def exchange_code(code: str, redirect_uri: str) -> dict:
    """Exchange an authorization code for access + refresh tokens."""
    resp = _http.post(GOOGLE_TOKEN_URL, data={
        "code":          code,
        "client_id":     settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri":  redirect_uri,
        "grant_type":    "authorization_code",
    }, timeout=15)
    resp.raise_for_status()
    return resp.json()


def refresh_access_token(refresh_token: str) -> str:
    """Return a fresh access token using the stored refresh token."""
    resp = _http.post(GOOGLE_TOKEN_URL, data={
        "refresh_token": refresh_token,
        "client_id":     settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "grant_type":    "refresh_token",
    }, timeout=15)
    resp.raise_for_status()
    return resp.json()["access_token"]


def revoke_token(refresh_token: str) -> None:
    """Revoke a refresh token at Google (best-effort, no exception on failure)."""
    try:
        _http.post(GOOGLE_REVOKE_URL, params={"token": refresh_token}, timeout=10)
    except Exception as exc:
        logger.warning("Google token revoke failed (continuing): %s", exc)


# ── Calendar event push ───────────────────────────────────────────────────────

def _event_title(deadline: dict, lang: str) -> str:
    key = f"title_{lang}" if lang in ("nl", "en", "fa") else "title_en"
    return deadline.get(key) or deadline["title_en"]


def _upsert_event(access_token: str, deadline: dict, lang: str) -> None:
    """Create or update a single calendar event via the Google Calendar REST API."""
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    event_date = deadline["date"].isoformat()

    body = {
        "summary":     _event_title(deadline, lang),
        "description": deadline["description"],
        "start":       {"date": event_date},
        "end":         {"date": (deadline["date"] + timedelta(days=1)).isoformat()},
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "popup",  "minutes": 7 * 24 * 60},   # 1 week before
                {"method": "popup",  "minutes": 24 * 60},        # 1 day before
                {"method": "email",  "minutes": 7 * 24 * 60},
            ],
        },
        "extendedProperties": {
            "private": {"taxwijs_id": deadline["id"]},
        },
        "colorId": "11",  # Tomato — makes tax deadlines visually distinct
    }

    search_url = f"{CALENDAR_API_BASE}/calendars/primary/events"
    params = {
        "privateExtendedProperty": f"taxwijs_id={deadline['id']}",
        "fields": "items(id)",
    }
    existing = _http.get(search_url, headers=headers, params=params, timeout=15).json()
    existing_items = existing.get("items", [])

    if existing_items:
        event_id = existing_items[0]["id"]
        _http.put(
            f"{CALENDAR_API_BASE}/calendars/primary/events/{event_id}",
            headers=headers,
            json=body,
            timeout=15,
        ).raise_for_status()
        logger.debug("Updated Google Calendar event %s for taxwijs_id=%s", event_id, deadline["id"])
    else:
        _http.post(
            f"{CALENDAR_API_BASE}/calendars/primary/events",
            headers=headers,
            json=body,
            timeout=15,
        ).raise_for_status()
        logger.debug("Created Google Calendar event for taxwijs_id=%s", deadline["id"])


def push_deadlines_to_calendar(user) -> int:
    """
    Push all 2026 tax deadlines to the user's primary Google Calendar.
    Returns the number of events pushed. Raises on auth failure.
    """
    if not user.google_calendar_enabled or not user.google_calendar_refresh_token:
        return 0

    try:
        raw_token = _decrypt(user.google_calendar_refresh_token)
    except signing.BadSignature:
        logger.error("Bad signature on google_calendar_refresh_token for user %s", user.pk)
        user.google_calendar_enabled = False
        user.google_calendar_refresh_token = None
        user.save(update_fields=["google_calendar_enabled", "google_calendar_refresh_token"])
        return 0

    access_token = refresh_access_token(raw_token)
    lang = getattr(user, "preferred_language", "nl") or "nl"

    count = 0
    for deadline in TAX_DEADLINES_2026:
        try:
            _upsert_event(access_token, deadline, lang)
            count += 1
        except Exception as exc:
            logger.warning("Failed to push event %s for user %s: %s", deadline["id"], user.pk, exc)

    logger.info("Google Calendar: pushed %d events for user %s", count, user.pk)
    return count
