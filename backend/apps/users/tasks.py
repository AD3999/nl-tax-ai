"""
Smart Calendar / Reminder Engine — Celery periodic tasks.

Schedule (defined in config/celery.py beat_schedule):
  - daily_btw_reminder     — every day 08:00 Amsterdam, checks BTW deadlines
  - daily_ib_reminder      — every day 08:00 Amsterdam, checks IB deadline
  - monthly_reserve        — 1st of each month 09:00 Amsterdam
  - rule_change_notify     — every day 09:30 Amsterdam

Delivery:
  Phase now  : in-app (logged + alert generated on next dashboard load)
  Phase A    : email  (set email_enabled=True + SMTP in settings)
  Phase B    : WhatsApp via Twilio
  Phase C    : SMS / iCal export

To run locally:  celery -A config worker -B -l info
On Railway:      add a second service with command: celery -A config worker -B -l info
                 (requires REDIS_URL env var pointing to a Railway Redis service)
"""

import logging
from celery import shared_task
from datetime import date, timedelta

logger = logging.getLogger("taxwijs.reminders")


# ── Helpers ────────────────────────────────────────────────────────────────────

def _send_inapp(user, title: str, body: str, category: str = "deadline") -> None:
    """Create an in-app Notification DB record and log it."""
    from .models import Notification
    try:
        notif_type_map = {
            "deadline": "system",
            "cashflow": "system",
            "rule_change": "system",
        }
        Notification.objects.create(
            user=user,
            notification_type=notif_type_map.get(category, "system"),
            title=title,
            body=body,
        )
    except Exception as exc:
        logger.warning("[IN-APP FAILED] user=%s error=%s", user.pk, exc)
    logger.info("[IN-APP] user=%s category=%s title=%s", user.pk, category, title)


def _send_email(user, subject: str, body: str) -> None:
    """Phase A: email delivery via SMTP. Requires EMAIL_HOST in settings."""
    from django.conf import settings
    if not getattr(settings, "EMAIL_HOST", ""):
        logger.debug("[EMAIL SKIPPED — no EMAIL_HOST] user=%s subject=%s", user.pk, subject)
        return
    try:
        from django.core.mail import send_mail
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info("[EMAIL SENT] user=%s subject=%s", user.pk, subject)
    except Exception as exc:
        logger.warning("[EMAIL FAILED] user=%s error=%s", user.pk, exc)


def _get_users_with_prefs(channel: str):
    """Yields (user, prefs) for all users who have that channel enabled."""
    from .models import NotificationPreference
    for prefs in NotificationPreference.objects.select_related("user").filter(**{channel: True}):
        if prefs.user.intake_profile:
            yield prefs.user, prefs


def _days_until(target: date) -> int:
    return (target - date.today()).days


# ── Tasks ──────────────────────────────────────────────────────────────────────

@shared_task(name="users.send_btw_reminders")
def send_btw_reminders():
    """
    Checks all BTW quarterly deadlines and notifies users within their lead window.
    Runs daily — idempotent (checks date each time).
    """
    today = date.today()
    year = today.year
    deadlines = [
        (date(year, 4, 30),  "BTW Q1", "Q1 VAT return", "اظهارنامه BTW Q1"),
        (date(year, 7, 31),  "BTW Q2", "Q2 VAT return", "اظهارنامه BTW Q2"),
        (date(year, 10, 31), "BTW Q3", "Q3 VAT return", "اظهارنامه BTW Q3"),
        (date(year + 1, 1, 31), "BTW Q4", "Q4 VAT return", "اظهارنامه BTW Q4"),
    ]

    notified = 0
    for user, prefs in _get_users_with_prefs("inapp_enabled"):
        profile = user.intake_profile or {}
        user_type = profile.get("user_type", "")
        if user_type not in ("zzp", "dga"):
            continue
        lang = user.preferred_language or "nl"
        lead = prefs.reminder_lead_days or 7

        for dl_date, title_nl, title_en, title_fa in deadlines:
            days_left = _days_until(dl_date)
            if days_left < 0 or days_left > lead:
                continue

            title = {"nl": title_nl, "en": title_en, "fa": title_fa}.get(lang, title_en)
            body = {
                "nl": f"De deadline voor {title_nl} is over {days_left} dag(en) op {dl_date.strftime('%d %B')}.",
                "en": f"The {title_en} deadline is in {days_left} day(s) on {dl_date.strftime('%d %B')}.",
                "fa": f"مهلت {title_fa} در {days_left} روز دیگر، در تاریخ {dl_date.strftime('%d %B')} است.",
            }.get(lang, f"{title_en} due in {days_left} days.")

            _send_inapp(user, title, body, "deadline")
            if prefs.email_enabled and prefs.email_btw:
                _send_email(user, f"TaxWijs: {title}", body)
            notified += 1

    logger.info("[BTW REMINDERS] notified=%d", notified)
    return {"notified": notified}


@shared_task(name="users.send_ib_reminder")
def send_ib_reminder():
    """
    Checks IB return deadline (1 May) and notifies users within their lead window.
    """
    today = date.today()
    ib_deadline = date(today.year, 5, 1)
    days_left = _days_until(ib_deadline)

    if days_left < 0 or days_left > 60:
        return {"skipped": True, "reason": "outside window"}

    notified = 0
    for user, prefs in _get_users_with_prefs("inapp_enabled"):
        lang = user.preferred_language or "nl"
        lead = prefs.reminder_lead_days or 14
        if days_left > lead:
            continue

        title = {"nl": "IB-aangifte 2025 vervalt binnenkort", "en": "IB return 2025 due soon", "fa": "مهلت اظهارنامه مالیات بر درآمد ۲۰۲۵ نزدیک است"}.get(lang)
        body = {
            "nl": f"Uw inkomstenbelasting aangifte voor 2025 is op {ib_deadline.strftime('%d %B')}. Nog {days_left} dag(en).",
            "en": f"Your 2025 income tax return is due on {ib_deadline.strftime('%d %B')}. {days_left} day(s) left.",
            "fa": f"اظهارنامه مالیات بر درآمد ۲۰۲۵ تا تاریخ {ib_deadline.strftime('%d %B')} است. {days_left} روز مانده",
        }.get(lang)

        _send_inapp(user, title, body, "deadline")
        if prefs.email_enabled and prefs.email_ib:
            _send_email(user, f"TaxWijs: {title}", body)
        notified += 1

    logger.info("[IB REMINDER] days_left=%d notified=%d", days_left, notified)
    return {"notified": notified, "days_left": days_left}


@shared_task(name="users.send_monthly_reserve_reminder")
def send_monthly_reserve_reminder():
    """
    Runs on the 1st of each month. Reminds users to set aside their monthly tax reserve.
    """
    today = date.today()
    if today.day != 1:
        return {"skipped": True, "reason": "not 1st of month"}

    notified = 0
    for user, prefs in _get_users_with_prefs("inapp_enabled"):
        if not prefs.email_reserve and not prefs.inapp_enabled:
            continue
        profile = user.intake_profile or {}
        user_type = profile.get("user_type", "")
        if user_type not in ("zzp", "dga"):
            continue
        lang = user.preferred_language or "nl"

        # Try to get reserve from last known calculation
        reserve = 0
        try:
            from apps.calculator.engine import calculate
            result = calculate(profile)
            reserve = result.get("result", {}).get("monthly_reserve_needed", 0) or 0
        except Exception:
            pass

        if reserve <= 0:
            continue

        month_name = today.strftime("%B")
        title = {"nl": f"Zet €{reserve:,.0f} opzij voor {month_name}", "en": f"Set aside €{reserve:,.0f} for {month_name}", "fa": f"€{reserve:,.0f} برای {month_name} کنار بگذارید"}.get(lang)
        body = {
            "nl": f"Op basis van uw profiel is de aanbevolen maandelijkse belastingreserve €{reserve:,.0f}. Zet dit bedrag opzij om verrassingen te vermijden.",
            "en": f"Based on your profile, the recommended monthly tax reserve is €{reserve:,.0f}. Setting this aside now prevents year-end surprises.",
            "fa": f"بر اساس پروفایل شما، ذخیره مالیات ماهانه پیشنهادی €{reserve:,.0f} است. همین الان کنار بگذارید.",
        }.get(lang)

        _send_inapp(user, title, body, "cashflow")
        if prefs.email_enabled and prefs.email_reserve:
            _send_email(user, f"TaxWijs: {title}", body)
        notified += 1

    logger.info("[MONTHLY RESERVE] notified=%d", notified)
    return {"notified": notified}


@shared_task(name="users.send_rule_change_notifications")
def send_rule_change_notifications():
    """
    Checks for tax rules updated in the past 24 hours and notifies affected users.
    Runs daily.
    """
    from django.utils import timezone
    try:
        from apps.tax.models import TaxRule
    except ImportError:
        return {"skipped": True, "reason": "TaxRule model not found"}

    since = timezone.now() - timedelta(hours=25)  # 25h to catch any timing edge
    new_rules = list(TaxRule.objects.filter(
        verification_status="verified",
        updated_at__gte=since,
    ))
    if not new_rules:
        return {"skipped": True, "reason": "no new rules"}

    notified = 0
    for user, prefs in _get_users_with_prefs("inapp_enabled"):
        if not prefs.email_rule_change and not prefs.inapp_enabled:
            continue
        profile = user.intake_profile or {}
        user_type = profile.get("user_type", "")
        lang = user.preferred_language or "nl"

        relevant = [r for r in new_rules if not r.user_types or user_type in (r.user_types or [])]
        if not relevant:
            continue

        for rule in relevant[:3]:
            topic = rule.topic or rule.rule_id
            title = {"nl": f"Belastingregel gewijzigd: {topic}", "en": f"Tax rule updated: {topic}", "fa": f"قانون مالیاتی به‌روز شد: {topic}"}.get(lang)
            body = (rule.plain_nl if lang == "nl" else rule.plain_fa if lang == "fa" else rule.plain_en or "")[:300]
            _send_inapp(user, title, body, "rule_change")
            if prefs.email_enabled and prefs.email_rule_change:
                _send_email(user, f"TaxWijs: {title}", body)
            notified += 1

    logger.info("[RULE CHANGES] rules=%d notified=%d", len(new_rules), notified)
    return {"new_rules": len(new_rules), "notified": notified}


# ── Google Calendar push sync ─────────────────────────────────────────────────

@shared_task(bind=True, max_retries=3)
def push_google_calendar_task(self, user_id: int):
    """Push all 2026 tax deadline events to the user's Google Calendar."""
    from django.contrib.auth import get_user_model
    from apps.users.services.google_calendar import push_deadlines_to_calendar

    User = get_user_model()
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        logger.warning("[GCAL] User %d not found", user_id)
        return

    try:
        count = push_deadlines_to_calendar(user)
        logger.info("[GCAL] Pushed %d events for user %d", count, user_id)
        return {"pushed": count}
    except Exception as exc:
        logger.error("[GCAL] Failed for user %d: %s", user_id, exc)
        self.retry(exc=exc, countdown=120)


@shared_task
def sync_all_google_calendars_task():
    """Daily task: push events for all users who have Google Calendar sync enabled."""
    from django.contrib.auth import get_user_model
    from apps.users.services.google_calendar import push_deadlines_to_calendar

    User = get_user_model()
    users = User.objects.filter(google_calendar_enabled=True, is_active=True)
    total = 0
    for user in users:
        try:
            push_deadlines_to_calendar(user)
            total += 1
        except Exception as exc:
            logger.warning("[GCAL] Sync failed for user %d: %s", user.pk, exc)

    logger.info("[GCAL] Daily sync complete — %d users synced", total)
    return {"synced": total}
