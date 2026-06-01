import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0006_useritemstate"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="tax_memory",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name="AccountantProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("firm_name", models.CharField(blank=True, max_length=200)),
                ("client_limit", models.PositiveIntegerField(default=10)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="accountant_profile",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={"db_table": "accountant_profiles"},
        ),
        migrations.CreateModel(
            name="AccountantClient",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nickname", models.CharField(blank=True, max_length=100)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("accountant", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="clients",
                    to="users.accountantprofile",
                )),
                ("client_user", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="accountant_links",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={"db_table": "accountant_clients"},
        ),
        migrations.CreateModel(
            name="EmailCapture",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("email", models.EmailField(max_length=254)),
                ("user_type", models.CharField(blank=True, max_length=20)),
                ("source_page", models.CharField(default="landing", max_length=80)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"db_table": "email_captures"},
        ),
        migrations.CreateModel(
            name="TaxReminder",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title_nl", models.CharField(max_length=200)),
                ("title_en", models.CharField(max_length=200)),
                ("title_fa", models.CharField(max_length=200)),
                ("description_nl", models.TextField(blank=True)),
                ("description_en", models.TextField(blank=True)),
                ("description_fa", models.TextField(blank=True)),
                ("category", models.CharField(max_length=30, choices=[
                    ("income_tax","Income Tax"), ("vat","VAT / BTW"), ("payroll","Payroll"),
                    ("corporate_tax","Corporate Tax"), ("dividend_tax","Dividend Tax"),
                    ("toeslagen","Toeslagen"), ("provisional_assessment","Voorlopige Aanslag"),
                    ("box3","Box 3"), ("expat","Expat"), ("admin","Admin"),
                    ("documents","Documents"), ("zzp_admin","ZZP Admin"), ("dga","DGA"),
                ])),
                ("user_types", models.JSONField(default=list)),
                ("tax_year", models.PositiveIntegerField(default=2026)),
                ("due_date", models.DateField()),
                ("recurrence", models.CharField(max_length=20, null=True, blank=True, choices=[
                    ("monthly","Monthly"), ("quarterly","Quarterly"), ("yearly","Yearly"), ("custom","Custom"),
                ])),
                ("reminder_offsets", models.JSONField(default=list)),
                ("source_url", models.URLField(blank=True)),
                ("source_status", models.CharField(max_length=20, default="official", choices=[
                    ("official","Official Belastingdienst source"), ("estimated","Estimated / typical date"), ("user_defined","User-defined"),
                ])),
                ("verification_status", models.CharField(max_length=20, default="verified", choices=[
                    ("draft","Draft"), ("pending_review","Pending review"), ("verified","Verified"), ("expired","Expired"),
                ])),
                ("action_type", models.CharField(max_length=30, default="review_deadline", choices=[
                    ("file_return","File return"), ("pay_tax","Pay tax"), ("update_income","Update income estimate"),
                    ("upload_document","Upload document"), ("check_eligibility","Check eligibility"),
                    ("review_rule","Review rule"), ("book_consultation","Book consultation"),
                    ("log_hours","Log hours"), ("log_expenses","Log expenses"), ("review_deadline","Review deadline"),
                ])),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"db_table": "tax_reminders", "ordering": ["due_date"]},
        ),
    ]
