"""
Add is_active to TaxRule and archive non-ZZP rows.
"""
from django.db import migrations, models


def archive_non_zzp_rules(apps, schema_editor):
    TaxRule = apps.get_model("tax", "TaxRule")
    for rule in TaxRule.objects.all():
        user_types = rule.user_types or []
        if user_types and "zzp" not in user_types:
            rule.is_active = False
            rule.save(update_fields=["is_active"])


class Migration(migrations.Migration):

    dependencies = [
        ("tax", "0004_db1_rule_engine_billing_gdpr_marketplace"),
    ]

    operations = [
        migrations.AddField(
            model_name="taxrule",
            name="is_active",
            field=models.BooleanField(default=True),
        ),
        migrations.RunPython(archive_non_zzp_rules, migrations.RunPython.noop),
    ]
