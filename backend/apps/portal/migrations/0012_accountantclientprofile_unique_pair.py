from django.conf import settings
from django.db import migrations


def deduplicate_profiles(apps, schema_editor):
    """
    Keep only the most-recently-created row for each (accountant_user_id, client_user_id) pair.
    Required before adding the unique constraint because the production DB may already
    contain duplicate pairings (e.g. self-managed profiles created more than once).
    """
    AccountantClientProfile = apps.get_model("portal", "AccountantClientProfile")
    seen = set()
    # Order newest-first so the first time we see a key we keep the newest, delete the rest.
    for profile in AccountantClientProfile.objects.order_by(
        "accountant_user_id", "client_user_id", "-created_at"
    ):
        key = (profile.accountant_user_id, profile.client_user_id)
        if key in seen:
            profile.delete()
        else:
            seen.add(key)


class Migration(migrations.Migration):
    # Must run outside a single transaction so RunPython (which fires row-level
    # triggers on delete) commits before AlterUniqueTogether issues ALTER TABLE.
    # PostgreSQL raises ObjectInUse if pending trigger events exist when ALTER TABLE runs.
    atomic = False

    dependencies = [
        ("portal", "0011_encrypt_bsn_field"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(deduplicate_profiles, migrations.RunPython.noop),
        migrations.AlterUniqueTogether(
            name="accountantclientprofile",
            unique_together={("accountant_user", "client_user")},
        ),
    ]
