"""
Portal Celery tasks — background jobs for the accountant/client portal.

Configured in settings.py via CELERY_BEAT_SCHEDULE.
Run with: celery -A config worker -l info
"""
import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_document_task(self, document_id: int):
    """
    Run OCR + AI extraction on an uploaded ClientDocument.
    Called asynchronously after file upload to avoid blocking the HTTP response.
    """
    try:
        from apps.portal.models import ClientDocument
        from apps.portal.services.document_extraction import extract_from_document

        doc = ClientDocument.objects.get(pk=document_id)
        if doc.processing_status != "uploaded":
            logger.info("Document %d already processed (%s), skipping.", document_id, doc.processing_status)
            return

        doc.processing_status = "processing"
        doc.save(update_fields=["processing_status"])

        result = extract_from_document(doc)
        logger.info("Document %d extracted: type=%s confidence=%.2f",
                    document_id, result.get("document_type"), result.get("confidence", 0))
    except Exception as exc:
        logger.error("process_document_task failed for document %d: %s", document_id, exc)
        # On final retry exhaustion, mark document as extraction_failed so the
        # accountant can see it in the UI rather than it silently staying "uploaded".
        if self.request.retries >= self.max_retries:
            try:
                from apps.portal.models import ClientDocument
                ClientDocument.objects.filter(
                    pk=document_id, processing_status="processing"
                ).update(processing_status="extraction_failed")
                logger.warning("Document %d marked extraction_failed after %d retries.",
                               document_id, self.max_retries)
            except Exception:
                pass
        else:
            self.retry(exc=exc, countdown=60)


@shared_task
def send_portal_email_task(user_id: int, subject: str, body: str):
    """
    Send an email notification to user if they have email_enabled=True.
    Queued asynchronously so it never blocks the primary action.
    """
    try:
        from django.contrib.auth import get_user_model
        from django.core.mail import send_mail
        from django.conf import settings

        User = get_user_model()
        user = User.objects.select_related("notification_prefs").get(pk=user_id)
        prefs = getattr(user, "notification_prefs", None)

        if not prefs or not prefs.email_enabled:
            logger.debug("Email skipped for user %d — email_enabled is False.", user_id)
            return

        if not user.email:
            logger.debug("Email skipped for user %d — no email address.", user_id)
            return

        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@taxwijs.nl")
        send_mail(
            subject=subject,
            message=body,
            from_email=from_email,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info("Portal email sent to user %d: %s", user_id, subject)
    except Exception as exc:
        logger.error("send_portal_email_task failed for user %d: %s", user_id, exc)


@shared_task
def send_pending_reminders_task():
    """
    Periodic task: scan for engagements with overdue checklist items
    and create ReminderLog entries for accountants to review.
    Does NOT send emails — creates in-app records that appear in the inbox.
    """
    from apps.portal.models import TaxEngagement, ChecklistItem, ReminderLog
    from django.db.models import Q

    today = timezone.now().date()
    processed = 0

    # Find engagements with open required items that haven't had a reminder in 7 days
    engagements = TaxEngagement.objects.filter(
        status__in=("collecting", "waiting_client")
    ).select_related("client_profile", "accountant")

    for eng in engagements:
        recent_reminder = ReminderLog.objects.filter(
            engagement=eng,
            created_at__gte=timezone.now() - timezone.timedelta(days=7),
        ).exists()
        if recent_reminder:
            continue

        missing = ChecklistItem.objects.filter(
            engagement=eng,
            required=True,
            status__in=("todo", "waiting_client", "rejected"),
        ).count()

        if missing > 0:
            ReminderLog.objects.create(
                engagement=eng,
                client_profile=eng.client_profile,
                sent_by=None,  # System-generated
                reminder_type="deadline",
                channel="in_app",
                subject=f"Auto: {missing} item(s) still missing for {eng.client_profile.display_name}",
                body=f"Engagement {eng.id} has {missing} unresolved checklist items.",
                delivered=False,
            )
            processed += 1

    logger.info("send_pending_reminders_task: created %d reminder logs.", processed)
    return {"created": processed}


@shared_task
def purge_expired_documents_task():
    """
    GDPR retention: delete ClientDocument files (and DB rows) where retention_expires_at has passed.
    Runs once a day. Only affects documents with an explicit expiry date set.
    """
    from apps.portal.models import ClientDocument

    today = timezone.now().date()
    expired = ClientDocument.objects.filter(retention_expires_at__lte=today)
    count = expired.count()

    for doc in expired:
        try:
            doc.file.delete(save=False)
        except Exception:
            pass
        doc.delete()

    logger.info("purge_expired_documents_task: purged %d documents.", count)
    return {"purged": count}
