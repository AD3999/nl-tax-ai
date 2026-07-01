"""
Add is_active to TaxReminder and archive non-ZZP rows.
"""
from django.db import migrations, models


def archive_non_zzp_reminders(apps, schema_editor):
    TaxReminder = apps.get_model("users", "TaxReminder")
    for reminder in TaxReminder.objects.all():
        user_types = reminder.user_types or []
        if user_types and "zzp" not in user_types:
            reminder.is_active = False
            reminder.save(update_fields=["is_active"])


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0015_zzp_only_hard_pivot"),
    ]

    operations = [
        migrations.AddField(
            model_name="taxreminder",
            name="is_active",
            field=models.BooleanField(default=True),
        ),
        migrations.RunPython(archive_non_zzp_reminders, migrations.RunPython.noop),
    ]
