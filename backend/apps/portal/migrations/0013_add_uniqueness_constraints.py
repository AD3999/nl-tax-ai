from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("portal", "0012_accountantclientprofile_unique_pair"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Unique email per accountant (email-based clients, not user-linked)
        migrations.AddConstraint(
            model_name="accountantclientprofile",
            constraint=models.UniqueConstraint(
                fields=["accountant_user", "email"],
                name="unique_client_email_per_accountant",
            ),
        ),
        # Prevent duplicate document requests from idempotent engine runs
        migrations.AddConstraint(
            model_name="documentrequest",
            constraint=models.UniqueConstraint(
                fields=["engagement", "stable_key"],
                condition=models.Q(stable_key__gt=""),
                name="unique_document_request_stable_key",
            ),
        ),
        # Prevent duplicate checklist items from idempotent engine runs
        migrations.AddConstraint(
            model_name="checklistitem",
            constraint=models.UniqueConstraint(
                fields=["engagement", "stable_key"],
                condition=models.Q(stable_key__gt=""),
                name="unique_checklist_item_stable_key",
            ),
        ),
    ]
