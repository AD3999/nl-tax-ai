from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("portal", "0013_add_uniqueness_constraints"),
    ]

    operations = [
        # Add task_type field to ChecklistItem
        migrations.AddField(
            model_name="checklistitem",
            name="task_type",
            field=models.CharField(
                choices=[("document", "Document upload"), ("info", "Information / answer")],
                default="document",
                max_length=20,
            ),
        ),
        # Add unique constraint to AccountantAction (engagement, stable_key) where stable_key non-empty
        migrations.AddConstraint(
            model_name="accountantaction",
            constraint=models.UniqueConstraint(
                condition=models.Q(stable_key__gt=""),
                fields=["engagement", "stable_key"],
                name="unique_action_per_engagement_stable_key",
            ),
        ),
    ]
