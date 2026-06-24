import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0013_accountantclient_disconnect_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="AccountantAccessRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("full_name", models.CharField(max_length=200)),
                ("firm_name", models.CharField(blank=True, max_length=200)),
                ("kvk_number", models.CharField(blank=True, max_length=20)),
                ("designation", models.CharField(
                    choices=[("RB", "RB"), ("AA", "AA"), ("RA", "RA"), ("other", "Other")],
                    default="other",
                    max_length=10,
                )),
                ("motivation", models.TextField(blank=True)),
                ("status", models.CharField(
                    choices=[("pending", "Pending review"), ("approved", "Approved"), ("rejected", "Rejected")],
                    default="pending",
                    max_length=20,
                )),
                ("reviewed_by", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="reviewed_access_requests",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "db_table": "accountant_access_requests",
                "ordering": ["-created_at"],
            },
        ),
    ]
