"""
Central helper for creating in-app Notification records + firing Web Push.

Usage:
    from apps.users.notification_utils import create_notification
    create_notification(
        user=client_user,
        notif_type="message_received",
        title="New message from your accountant",
        body="You have a new message regarding your 2026 tax file.",
        action_url="/client/messages",
        metadata={"engagement_id": 42},
    )

Both channels (in-app DB record and Web Push) are fired here so callers
never have to import push_utils directly.
"""
from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


def create_notification(
    user,
    notif_type: str,
    title: str,
    body: str = "",
    action_url: str = "",
    metadata: dict | None = None,
) -> None:
    """
    Create an in-app Notification record for `user` and fire a Web Push.
    Silently swallows all errors — notification failure must never break the
    primary action that triggered it.
    """
    notif = None
    try:
        from .models import Notification
        notif = Notification.objects.create(
            user=user,
            notification_type=notif_type,
            title=title,
            body=body,
            action_url=action_url or "",
            metadata=metadata,
        )
    except Exception as exc:
        logger.error("create_notification DB write failed for user %s: %s", getattr(user, "pk", "?"), exc)

    # Push to WebSocket channel layer (best-effort; never blocks the caller)
    if notif:
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f"notifications_{user.id}",
                    {
                        "type": "notification.message",
                        "data": {
                            "id":                notif.id,
                            "notification_type": notif.notification_type,
                            "title":             notif.title,
                            "body":              notif.body,
                            "action_url":        notif.action_url,
                            "is_read":           False,
                            "created_at":        notif.created_at.isoformat(),
                        },
                    },
                )
        except Exception as exc:
            logger.debug("WebSocket push skipped for user %s: %s", getattr(user, "pk", "?"), exc)

    try:
        from .push_utils import send_push_notification
        send_push_notification(user, title, body, url=action_url or "/")
    except Exception as exc:
        logger.error("create_notification push failed for user %s: %s", getattr(user, "pk", "?"), exc)
