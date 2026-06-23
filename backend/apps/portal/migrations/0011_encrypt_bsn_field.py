from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("portal", "0010_client_profile_deactivation_fields"),
    ]

    operations = [
        migrations.RenameField(
            model_name="accountantclientprofile",
            old_name="bsn",
            new_name="bsn_enc",
        ),
        migrations.AlterField(
            model_name="accountantclientprofile",
            name="bsn_enc",
            field=models.TextField(
                blank=True,
                help_text="AES-256-GCM encrypted BSN. Use encryption.encrypt_bsn() to write.",
            ),
        ),
    ]
