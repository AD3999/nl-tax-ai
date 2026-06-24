from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("portal", "0014_add_action_unique_constraint_and_task_type"),
    ]

    operations = [
        migrations.AlterField(
            model_name="checklistitem",
            name="task_type",
            field=models.CharField(
                choices=[("document", "Document upload"), ("info", "Information entry")],
                default="document",
                help_text="document = requires file upload; info = requires text/number entry",
                max_length=20,
            ),
        ),
    ]
