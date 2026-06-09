"""
Management command: test_push

Usage from Railway Console:
    python manage.py test_push --email user@example.com

Shows exactly what's happening:
  - Is VAPID configured?
  - Does the user exist?
  - How many push subscriptions does the user have?
  - Does pywebpush actually deliver?
"""

import os
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Test push notification delivery to a user by email"

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True, help="Email of target user")

    def handle(self, *args, **options):
        from apps.users.models import User, PushSubscription

        email = options["email"]

        # 1 — Check VAPID configuration
        private_key = os.environ.get("VAPID_PRIVATE_KEY", "")
        public_key  = os.environ.get("VAPID_PUBLIC_KEY", "")
        claims_email = os.environ.get("VAPID_CLAIMS_EMAIL", "")

        self.stdout.write("\n=== VAPID configuration ===")
        self.stdout.write(f"  VAPID_PRIVATE_KEY : {'SET (' + str(len(private_key)) + ' chars)' if private_key else 'NOT SET ❌'}")
        self.stdout.write(f"  VAPID_PUBLIC_KEY  : {'SET (' + str(len(public_key)) + ' chars)' if public_key else 'NOT SET ❌'}")
        self.stdout.write(f"  VAPID_CLAIMS_EMAIL: {claims_email or 'NOT SET ❌'}")

        if not private_key:
            raise CommandError("VAPID_PRIVATE_KEY is not set — push will never work.")

        # 2 — Find user
        self.stdout.write(f"\n=== User: {email} ===")
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise CommandError(f"No user found with email '{email}'.")
        self.stdout.write(f"  Found: pk={user.pk}  role={user.role}")

        # 3 — Check subscriptions
        subs = list(PushSubscription.objects.filter(user=user))
        self.stdout.write(f"\n=== Push subscriptions: {len(subs)} ===")
        if not subs:
            self.stdout.write(self.style.WARNING(
                "  No subscriptions! The user must click 'Enable notifications' in their dashboard first."
            ))
            return

        for s in subs:
            self.stdout.write(f"  Sub {s.pk}: endpoint={s.endpoint[:60]}...")

        # 4 — Attempt delivery
        self.stdout.write("\n=== Sending test push ===")
        from apps.users.push_utils import send_push_notification
        send_push_notification(
            user,
            title="TaxWijs test",
            body="This is a test push notification from the server.",
            url="/dashboard",
        )
        self.stdout.write(self.style.SUCCESS("  send_push_notification() completed — check logs above for errors."))
