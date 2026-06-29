from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Add "answered" to ChecklistItem.status choices.
    This is a metadata-only change — no DB schema alteration required
    since status is a free-form CharField. The migration is kept for
    consistency so Django's migration graph reflects the choices update.
    """

    dependencies = [
        ("portal", "0013_add_uniqueness_constraints"),
    ]

    operations = [
        migrations.AlterField(
            model_name="checklistitem",
            name="status",
            field=models.CharField(
                choices=[
                    ("todo", "To do"),
                    ("waiting_client", "Waiting for client"),
                    ("uploaded", "Uploaded"),
                    ("answered", "Answered"),
                    ("needs_review", "Needs review"),
                    ("accepted", "Accepted"),
                    ("rejected", "Rejected"),
                    ("waived", "Waived"),
                ],
                default="todo",
                max_length=20,
            ),
        ),
    ]
