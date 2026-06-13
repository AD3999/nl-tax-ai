from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0005_user_ib_guide_answers_user_simulation_state_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserItemState",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("item_type", models.CharField(choices=[("alert", "Alert"), ("action", "Action")], max_length=10)),
                ("item_id", models.CharField(max_length=120)),
                ("state", models.CharField(choices=[("open", "Open"), ("done", "Done"), ("dismissed", "Dismissed"), ("snoozed", "Snoozed")], default="open", max_length=20)),
                ("snoozed_until", models.DateField(blank=True, null=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="item_states",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"db_table": "user_item_states"},
        ),
        migrations.AlterUniqueTogether(
            name="useritemstate",
            unique_together={("user", "item_type", "item_id")},
        ),
    ]
