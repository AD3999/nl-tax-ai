from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0011_db1_rule_engine_billing_gdpr_marketplace'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='google_calendar_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='google_calendar_refresh_token',
            field=models.TextField(blank=True, null=True),
        ),
    ]
