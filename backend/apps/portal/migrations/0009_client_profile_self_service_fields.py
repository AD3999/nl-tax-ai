from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("portal", "0008_clientdocument_checklist_item"),
    ]

    operations = [
        migrations.AddField(
            model_name="accountantclientprofile",
            name="address_street",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="accountantclientprofile",
            name="address_city",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="accountantclientprofile",
            name="address_postcode",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="accountantclientprofile",
            name="bsn",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="accountantclientprofile",
            name="kvk_number",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="accountantclientprofile",
            name="btw_number",
            field=models.CharField(blank=True, max_length=30),
        ),
        migrations.AddField(
            model_name="accountantclientprofile",
            name="birth_date",
            field=models.DateField(blank=True, null=True),
        ),
    ]
