from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("portal", "0015_fix_task_type_choices"),
    ]

    operations = [
        migrations.AddField(
            model_name="invitation",
            name="message",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AlterField(
            model_name="invitation",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("accepted", "Accepted"),
                    ("expired", "Expired"),
                    ("cancelled", "Cancelled"),
                    ("declined", "Declined"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
    ]
