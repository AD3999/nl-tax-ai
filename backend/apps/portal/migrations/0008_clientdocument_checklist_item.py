from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("portal", "0007_checklist_meta_value"),
    ]

    operations = [
        migrations.AddField(
            model_name="clientdocument",
            name="checklist_item",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="client_documents",
                to="portal.checklistitem",
            ),
        ),
    ]
