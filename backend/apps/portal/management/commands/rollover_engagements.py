"""
Django management command: rollover_engagements

Run on January 1 each year (via Celery beat or cron) to create new-year
engagements for all clients whose previous-year engagement was filed.

Usage:
    python manage.py rollover_engagements
    python manage.py rollover_engagements --from-year 2026 --to-year 2027 --dry-run
"""
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = "Create new-year engagements for all clients with a filed previous-year engagement."

    def add_arguments(self, parser):
        current_year = timezone.now().year
        parser.add_argument("--from-year", type=int, default=current_year - 1,
                            help="Tax year to roll over from (default: last year)")
        parser.add_argument("--to-year", type=int, default=current_year,
                            help="Tax year to roll over to (default: current year)")
        parser.add_argument("--dry-run", action="store_true",
                            help="Preview without creating any records")

    def handle(self, *args, **options):
        from apps.portal.models import TaxEngagement, AccountantClientProfile
        from apps.portal.services.accountant_checklists import create_checklist_for_engagement
        from apps.users.notification_utils import create_notification

        from_year = options["from_year"]
        to_year   = options["to_year"]
        dry_run   = options["dry_run"]

        if to_year <= from_year:
            self.stderr.write("--to-year must be greater than --from-year")
            return

        self.stdout.write(
            f"Engagement rollover: {from_year} → {to_year}"
            + (" (DRY RUN)" if dry_run else "")
        )

        filed_engagements = TaxEngagement.objects.filter(
            tax_year=from_year,
            status="filed",
        ).select_related("client_profile", "accountant")

        created = 0
        skipped = 0

        for old_eng in filed_engagements:
            profile = old_eng.client_profile

            # Skip deactivated / archived profiles
            if profile.status not in ("active",):
                skipped += 1
                continue

            # Skip if a new-year engagement already exists
            if TaxEngagement.objects.filter(
                accountant=old_eng.accountant,
                client_profile=profile,
                tax_year=to_year,
            ).exists():
                skipped += 1
                continue

            if dry_run:
                self.stdout.write(
                    f"  [DRY RUN] Would create {to_year} engagement for "
                    f"{profile.display_name} (accountant: {old_eng.accountant.email})"
                )
                created += 1
                continue

            new_eng = TaxEngagement.objects.create(
                accountant=old_eng.accountant,
                client_profile=profile,
                tax_year=to_year,
                engagement_type=old_eng.engagement_type,
                status="collecting",
            )

            try:
                create_checklist_for_engagement(new_eng)
            except Exception as exc:
                self.stderr.write(
                    f"  WARNING: checklist generation failed for "
                    f"{profile.display_name}: {exc}"
                )

            # Notify accountant
            try:
                create_notification(
                    user       = old_eng.accountant,
                    notif_type = "system",
                    title      = f"New {to_year} engagement created for {profile.display_name}",
                    body       = (
                        f"A new {to_year} tax engagement has been automatically created. "
                        "Review and collect documents when ready."
                    ),
                    action_url = "/accountant/portal",
                    metadata   = {"engagement_id": new_eng.id, "event": "year_rollover"},
                )
            except Exception:
                pass

            created += 1
            self.stdout.write(
                f"  Created {to_year} engagement for {profile.display_name}"
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone: {created} engagement(s) created, {skipped} skipped."
            )
        )
