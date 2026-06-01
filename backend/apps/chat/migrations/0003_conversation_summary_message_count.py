from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="conversation",
            name="summary",
            field=models.CharField(blank=True, max_length=300),
        ),
        migrations.AddField(
            model_name="conversation",
            name="message_count",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
