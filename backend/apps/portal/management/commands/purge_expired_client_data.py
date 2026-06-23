"""
Management command: purge_expired_client_data

Permanently deletes AccountantClientProfile records whose 30-day grace
period has expired after a client disconnected from their accountant.

Cascade deletes via ON DELETE CASCADE automatically removes:
  TaxEngagement, DocumentRequest, ClientDocument, ExtractedIncome,
  ExtractedExpense, ChecklistItem, AccountantAction, PortalAuditLog,
  ReminderLog, PortalMessage, ReadinessSnapshot, ExtractedField

Run daily via cron or Celery beat:
  python manage.py purge_expired_client_data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.portal.models import AccountantClientProfile


class Command(BaseCommand):
    help = "Delete deactivated client profiles whose 30-day retention window has expired."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be deleted without deleting anything.",
        )

    def handle(self, *args, **options):
        now = timezone.now()
        expired_qs = AccountantClientProfile.objects.filter(
            status="deactivated",
            scheduled_deletion_at__lte=now,
        )
        count = expired_qs.count()

        if count == 0:
            self.stdout.write("No expired client profiles to purge.")
            return

        if options["dry_run"]:
            self.stdout.write(f"[DRY RUN] Would delete {count} expired client profile(s):")
            for p in expired_qs.values("id", "email", "scheduled_deletion_at"):
                self.stdout.write(f"  - id={p['id']} email={p['email']} expired={p['scheduled_deletion_at']}")
            return

        expired_qs.delete()
        self.stdout.write(
            self.style.SUCCESS(f"Purged {count} expired client profile(s) and all related data.")
        )
