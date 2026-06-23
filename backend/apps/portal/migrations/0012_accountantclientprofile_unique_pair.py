from django.conf import settings
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("portal", "0011_encrypt_bsn_field"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="accountantclientprofile",
            unique_together={("accountant_user", "client_user")},
        ),
    ]
