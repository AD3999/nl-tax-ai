from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("portal", "0017_merge_answered_status_and_invitation_branch"),
    ]

    operations = [
        migrations.AddField(
            model_name="portalmessage",
            name="is_system",
            field=models.BooleanField(default=False),
        ),
    ]
