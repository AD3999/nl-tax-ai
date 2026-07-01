"""
ZZP-only hard pivot — narrows user_type to 'zzp' only.
Data migration: sets any non-zzp user_type to 'zzp'.
"""
from django.db import migrations, models


def set_all_users_zzp(apps, schema_editor):
    User = apps.get_model("users", "User")
    User.objects.exclude(user_type="zzp").update(user_type="zzp")


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0014_add_accountant_access_request"),
    ]

    operations = [
        migrations.RunPython(set_all_users_zzp, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="user",
            name="user_type",
            field=models.CharField(
                choices=[("zzp", "ZZP / Freelancer")],
                default="zzp",
                max_length=20,
            ),
        ),
    ]
