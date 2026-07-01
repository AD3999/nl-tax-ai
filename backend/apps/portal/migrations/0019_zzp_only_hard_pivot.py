"""
ZZP-only hard pivot — narrows client_type to 'zzp' only.
Data migration: sets any non-zzp client_type to 'zzp'.
"""
from django.db import migrations, models


def set_all_clients_zzp(apps, schema_editor):
    AccountantClientProfile = apps.get_model("portal", "AccountantClientProfile")
    AccountantClientProfile.objects.exclude(client_type="zzp").update(client_type="zzp")


class Migration(migrations.Migration):

    dependencies = [
        ("portal", "0018_portalmessage_is_system"),
    ]

    operations = [
        migrations.RunPython(set_all_clients_zzp, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="accountantclientprofile",
            name="client_type",
            field=models.CharField(
                choices=[("zzp", "ZZP / Freelancer")],
                default="zzp",
                max_length=20,
            ),
        ),
    ]
