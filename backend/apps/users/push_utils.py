"""
Web Push notification utilities.

Uses VAPID (Voluntary Application Server Identification) via pywebpush.
Required environment variables:
  VAPID_PRIVATE_KEY  — base64url-encoded VAPID private key (EC P-256)
  VAPID_PUBLIC_KEY   — base64url-encoded VAPID public key (served to frontend)
  VAPID_CLAIMS_EMAIL — contact email embedded in VAPID JWT claim

Generate a key pair once:
  python -c "from py_vapid import Vapid; v=Vapid(); v.generate_keys(); print('PRIVATE:', v.private_pem().decode()); print('PUBLIC:', v.public_key)"
"""
from __future__ import annotations

import json
import logging
import os

logger = logging.getLogger(__name__)

_VAPID_PRIVATE_KEY  = os.environ.get("VAPID_PRIVATE_KEY", "")
_VAPID_CLAIMS_EMAIL = os.environ.get("VAPID_CLAIMS_EMAIL", "admin@taxwijs.nl")
VAPID_PUBLIC_KEY    = os.environ.get("VAPID_PUBLIC_KEY", "")


def send_push_notification(user, title: str, body: str, url: str = "/") -> None:
    """
    Send a Web Push notification to all registered devices for `user`.
    Silently skips if VAPID keys are not configured (dev environments).
    Automatically removes expired/invalid subscriptions (HTTP 404/410).
    """
    if not _VAPID_PRIVATE_KEY:
        logger.warning(
            "VAPID_PRIVATE_KEY not set — push skipped for user %s. "
            "Set VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_CLAIMS_EMAIL in env.",
            user.pk,
        )
        return

    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.error("pywebpush not installed — run: pip install pywebpush")
        return

    subs = list(user.push_subscriptions.all())
    if not subs:
        logger.info("No push subscriptions for user %s — user must enable notifications first", user.pk)
        return

    payload = json.dumps({"title": title, "body": body, "url": url})
    vapid_claims = {"sub": f"mailto:{_VAPID_CLAIMS_EMAIL}"}
    to_delete = []

    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=payload,
                vapid_private_key=_VAPID_PRIVATE_KEY,
                vapid_claims=vapid_claims,
            )
            logger.info("Push sent to user %s sub %s", user.pk, sub.pk)
        except WebPushException as exc:
            resp = exc.response
            if resp is not None and resp.status_code in (404, 410):
                to_delete.append(sub.pk)
                logger.info("Stale subscription %s removed (HTTP %s)", sub.pk, resp.status_code)
            else:
                status = resp.status_code if resp is not None else "no-response"
                logger.error("Push FAILED for sub %s (HTTP %s): %s", sub.pk, status, exc)
        except Exception as exc:
            logger.error("Unexpected push error for sub %s: %s", sub.pk, exc)

    if to_delete:
        from .models import PushSubscription
        PushSubscription.objects.filter(pk__in=to_delete).delete()


def check_vapid_config() -> dict:
    return {
        "vapid_configured": bool(_VAPID_PRIVATE_KEY and VAPID_PUBLIC_KEY),
        "public_key_set": bool(VAPID_PUBLIC_KEY),
        "private_key_set": bool(_VAPID_PRIVATE_KEY),
        "claims_email": _VAPID_CLAIMS_EMAIL,
    }
