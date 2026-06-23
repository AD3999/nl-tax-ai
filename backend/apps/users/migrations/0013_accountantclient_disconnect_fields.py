from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0012_google_calendar_sync"),
    ]

    operations = [
        migrations.AddField(
            model_name="accountantclient",
            name="status",
            field=models.CharField(
                choices=[("active", "Active"), ("deactivated", "Deactivated")],
                default="active",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="accountantclient",
            name="deactivated_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
