from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("portal", "0009_client_profile_self_service_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="accountantclientprofile",
            name="status",
            field=models.CharField(
                choices=[
                    ("invited",     "Invited"),
                    ("active",      "Active"),
                    ("collecting",  "Collecting documents"),
                    ("in_review",   "In review"),
                    ("ready",       "Ready to file"),
                    ("completed",   "Completed"),
                    ("archived",    "Archived"),
                    ("deactivated", "Deactivated"),
                ],
                default="invited",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="accountantclientprofile",
            name="deactivated_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="accountantclientprofile",
            name="scheduled_deletion_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
