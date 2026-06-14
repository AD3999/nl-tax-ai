from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('portal', '0006_db1_rule_engine_billing_gdpr_marketplace'),
    ]

    operations = [
        migrations.AddField(
            model_name='checklistitem',
            name='meta_value',
            field=models.TextField(blank=True, default=''),
            preserve_default=False,
        ),
    ]
