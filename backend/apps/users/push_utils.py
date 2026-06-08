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
        logger.debug("VAPID_PRIVATE_KEY not set — skipping push for user %s", user.pk)
        return

    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.warning("pywebpush not installed — pip install pywebpush")
        return

    payload = json.dumps({"title": title, "body": body, "url": url})
    vapid_claims = {"sub": f"mailto:{_VAPID_CLAIMS_EMAIL}"}
    to_delete = []

    for sub in user.push_subscriptions.all():
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
        except WebPushException as exc:
            resp = exc.response
            if resp is not None and resp.status_code in (404, 410):
                to_delete.append(sub.pk)
            else:
                logger.warning("Push failed for sub %s: %s", sub.pk, exc)
        except Exception as exc:
            logger.warning("Unexpected push error for sub %s: %s", sub.pk, exc)

    if to_delete:
        from .models import PushSubscription
        PushSubscription.objects.filter(pk__in=to_delete).delete()
