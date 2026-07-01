"""
Portal models — Accountant + Client document-collection workflow.

Architecture notes:
  - AccountantClientProfile is the accountant's view of a client. It can exist
    before the client has a TaxWijs account (client_user is nullable).
  - TaxEngagement is one tax-year case/file per client.
  - DocumentRequest is what the accountant needs from the client.
  - ClientDocument is the uploaded file attached to a request.
  - ExtractedIncome / ExtractedExpense are candidate rows created by AI
    extraction — they NEVER affect calculations until an accountant approves them.
  - ChecklistItem drives the readiness score.
  - AccountantAction are AI/rule-generated next-step cards for the accountant.
  - PortalAuditLog is the immutable event trail.
"""

from django.db import models
from django.conf import settings


class Firm(models.Model):
    """
    A tax advisory firm — groups accountants and their clients under one entity.
    One firm can have many accountants. Each client engagement belongs to the firm.
    """
    name = models.CharField(max_length=200)
    kvk_number = models.CharField(max_length=20, blank=True)
    contact_email = models.EmailField(blank=True)
    subscription_plan = models.CharField(
        max_length=20,
        choices=[("free", "Free"), ("professional", "Professional"), ("firm", "Firm")],
        default="free"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "portal_firms"
        ordering = ["name"]

    def __str__(self):
        return self.name


class AccountantClientProfile(models.Model):
    CLIENT_TYPE_CHOICES = [
        ("employee", "Employee"),
        ("zzp",      "ZZP / Freelancer"),
        ("expat",    "Expat"),
        ("dga",      "DGA / Director"),
        ("other",    "Other / Unknown"),
    ]
    LANGUAGE_CHOICES = [
        ("nl", "Nederlands"),
        ("en", "English"),
        ("fa", "فارسی"),
    ]
    STATUS_CHOICES = [
        ("invited",      "Invited"),
        ("active",       "Active"),
        ("collecting",   "Collecting documents"),
        ("in_review",    "In review"),
        ("ready",        "Ready to file"),
        ("completed",    "Completed"),
        ("archived",     "Archived"),
        ("deactivated",  "Deactivated"),
    ]

    accountant_user  = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="portal_clients"
    )
    client_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="portal_profiles"
    )
    email        = models.EmailField()
    first_name   = models.CharField(max_length=100, blank=True)
    last_name    = models.CharField(max_length=100, blank=True)
    company_name = models.CharField(max_length=200, blank=True)
    client_type  = models.CharField(max_length=20, choices=CLIENT_TYPE_CHOICES, default="other")
    preferred_language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default="nl")
    phone        = models.CharField(max_length=30, blank=True)
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default="invited")
    tax_year     = models.PositiveIntegerField(default=2026)
    notes        = models.TextField(blank=True)
    # Client self-service profile fields
    address_street   = models.CharField(max_length=200, blank=True)
    address_city     = models.CharField(max_length=100, blank=True)
    address_postcode = models.CharField(max_length=20,  blank=True)
    bsn_enc          = models.TextField(blank=True, help_text="AES-256-GCM encrypted BSN. Use encryption.encrypt_bsn() to write.")
    kvk_number       = models.CharField(max_length=20,  blank=True)
    btw_number       = models.CharField(max_length=30,  blank=True)
    birth_date       = models.DateField(null=True, blank=True)
    # Disconnect / 30-day grace period
    deactivated_at       = models.DateTimeField(null=True, blank=True)
    scheduled_deletion_at = models.DateTimeField(null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "portal_client_profiles"
        ordering = ["-created_at"]
        unique_together = [("accountant_user", "client_user")]
        constraints = [
            models.UniqueConstraint(
                fields=["accountant_user", "email"],
                name="unique_client_email_per_accountant",
            )
        ]

    def __str__(self):
        name = f"{self.first_name} {self.last_name}".strip() or self.email
        return f"{name} ({self.client_type})"

    @property
    def display_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email


class TaxEngagement(models.Model):
    ENGAGEMENT_TYPE_CHOICES = [
        ("income_tax",     "Income Tax Return"),
        ("vat",            "VAT / BTW"),
        ("annual_accounts","Annual Accounts"),
        ("payroll",        "Payroll"),
        ("advisory",       "Advisory"),
    ]
    STATUS_CHOICES = [
        ("draft",           "Draft"),
        ("collecting",      "Collecting"),
        ("waiting_client",  "Waiting for client"),
        ("needs_review",    "Needs review"),
        ("ready_to_file",   "Ready to file"),
        ("filed",           "Filed"),
        ("completed",       "Completed"),
        ("blocked",         "Blocked"),
    ]
    RISK_CHOICES = [
        ("low",    "Low"),
        ("medium", "Medium"),
        ("high",   "High"),
    ]

    accountant     = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="engagements_as_accountant"
    )
    client_profile = models.ForeignKey(
        AccountantClientProfile, on_delete=models.CASCADE,
        related_name="engagements"
    )
    firm = models.ForeignKey(
        Firm, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="engagements"
    )
    tax_year          = models.PositiveIntegerField(default=2026)
    engagement_type   = models.CharField(max_length=30, choices=ENGAGEMENT_TYPE_CHOICES, default="income_tax")
    status            = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    deadline_date     = models.DateField(null=True, blank=True)
    readiness_score   = models.PositiveIntegerField(default=0)
    ready_to_file     = models.BooleanField(default=False)
    accountant_confirmed = models.BooleanField(default=False)
    missing_items_count = models.PositiveIntegerField(default=0)
    risk_level        = models.CharField(max_length=10, choices=RISK_CHOICES, default="low")
    summary_json      = models.JSONField(null=True, blank=True)
    readiness_updated_at = models.DateTimeField(null=True, blank=True)
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "portal_engagements"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.client_profile} / {self.tax_year} ({self.engagement_type})"


class DocumentRequest(models.Model):
    REQUEST_TYPE_CHOICES = [
        ("identity",    "Identity"),
        ("income",      "Income"),
        ("expense",     "Expense"),
        ("bank",        "Bank statement"),
        ("payroll",     "Payroll"),
        ("mortgage",    "Mortgage"),
        ("pension",     "Pension / lijfrente"),
        ("investment",  "Investment"),
        ("property",    "Property / WOZ"),
        ("business",    "Business"),
        ("vat",         "VAT / BTW"),
        ("contract",    "Contract"),
        ("other",       "Other"),
    ]
    STATUS_CHOICES = [
        ("open",               "Open"),
        ("uploaded",           "Uploaded"),
        ("partially_uploaded", "Partially uploaded"),
        ("needs_review",       "Needs review"),
        ("accepted",           "Accepted"),
        ("rejected",           "Rejected"),
        ("waived",             "Waived"),
    ]
    CREATED_BY_CHOICES = [
        ("accountant",   "Accountant"),
        ("rule_engine",  "Rule engine"),
        ("ai_suggestion","AI suggestion"),
    ]

    engagement     = models.ForeignKey(
        TaxEngagement, on_delete=models.CASCADE, related_name="document_requests"
    )
    client_profile = models.ForeignKey(
        AccountantClientProfile, on_delete=models.CASCADE,
        related_name="document_requests"
    )
    title          = models.CharField(max_length=200)
    description    = models.TextField(blank=True)
    request_type   = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES, default="other")
    required       = models.BooleanField(default=True)
    status         = models.CharField(max_length=30, choices=STATUS_CHOICES, default="open")
    due_date       = models.DateField(null=True, blank=True)
    ai_generated   = models.BooleanField(default=False)
    created_by     = models.CharField(max_length=20, choices=CREATED_BY_CHOICES, default="accountant")
    stable_key     = models.CharField(max_length=100, blank=True, db_index=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "portal_document_requests"
        ordering = ["required", "created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["engagement", "stable_key"],
                condition=models.Q(stable_key__gt=""),
                name="unique_document_request_stable_key",
            )
        ]

    def __str__(self):
        return f"{self.title} ({self.status})"


class ClientDocument(models.Model):
    DOC_TYPE_CHOICES = [
        ("unknown",            "Unknown"),
        ("receipt",            "Receipt"),
        ("invoice",            "Invoice"),
        ("jaaropgave",         "Jaaropgave"),
        ("payslip",            "Payslip"),
        ("bank_statement",     "Bank statement"),
        ("mortgage_statement", "Mortgage statement"),
        ("pension_statement",  "Pension statement"),
        ("kvk_extract",        "KVK extract"),
        ("vat_report",         "VAT / BTW report"),
        ("contract",           "Contract"),
        ("id_document",        "ID document"),
        ("tax_letter",         "Tax letter"),
        ("other",              "Other"),
    ]
    PROCESSING_STATUS_CHOICES = [
        ("uploaded",           "Uploaded"),
        ("processing",         "Processing"),
        ("extracted",          "Extracted"),
        ("extraction_failed",  "Extraction failed"),
        ("needs_review",       "Needs review"),
        ("approved",           "Approved"),
        ("rejected",           "Rejected"),
    ]

    ALLOWED_MIME_TYPES = [
        "application/pdf",
        "image/jpeg", "image/jpg", "image/png",
        "image/heic", "image/heif",  # iPhone formats
        "image/webp",
        "text/csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
    ]
    MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

    engagement        = models.ForeignKey(
        TaxEngagement, on_delete=models.CASCADE, related_name="documents"
    )
    client_profile    = models.ForeignKey(
        AccountantClientProfile, on_delete=models.CASCADE, related_name="documents"
    )
    document_request  = models.ForeignKey(
        DocumentRequest, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="documents"
    )
    checklist_item    = models.ForeignKey(
        "ChecklistItem", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="client_documents"
    )
    uploaded_by       = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="portal_uploads"
    )
    original_filename = models.CharField(max_length=255)
    user_title        = models.CharField(max_length=200, blank=True)
    user_note         = models.TextField(blank=True)
    file              = models.FileField(upload_to="portal/documents/%Y/%m/")
    mime_type         = models.CharField(max_length=100, blank=True)
    file_size         = models.PositiveIntegerField(default=0)
    document_type     = models.CharField(max_length=30, choices=DOC_TYPE_CHOICES, default="unknown")
    processing_status = models.CharField(max_length=20, choices=PROCESSING_STATUS_CHOICES, default="uploaded")
    extracted_json    = models.JSONField(null=True, blank=True)
    confidence_score  = models.FloatField(null=True, blank=True)
    review_notes      = models.TextField(blank=True)
    # GDPR: documents older than this date may be purged by the retention management command
    retention_expires_at = models.DateField(null=True, blank=True)
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "portal_documents"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.original_filename} ({self.processing_status})"


class ExtractedIncome(models.Model):
    INCOME_TYPE_CHOICES = [
        ("salary",         "Salary"),
        ("zzp_revenue",    "ZZP revenue"),
        ("dividend",       "Dividend"),
        ("benefit",        "Benefit / uitkering"),
        ("foreign_income", "Foreign income"),
        ("other",          "Other"),
    ]
    REVIEW_STATUS_CHOICES = [
        ("candidate", "Candidate (not yet approved)"),
        ("approved",  "Approved"),
        ("rejected",  "Rejected"),
        ("manual",    "Manually entered"),
    ]

    engagement       = models.ForeignKey(TaxEngagement, on_delete=models.CASCADE, related_name="income_items")
    client_profile   = models.ForeignKey(AccountantClientProfile, on_delete=models.CASCADE, related_name="income_items")
    source_document  = models.ForeignKey(ClientDocument, on_delete=models.SET_NULL, null=True, blank=True, related_name="extracted_income")
    income_type      = models.CharField(max_length=20, choices=INCOME_TYPE_CHOICES, default="other")
    description      = models.CharField(max_length=255, blank=True)
    gross_amount     = models.DecimalField(max_digits=12, decimal_places=2)
    tax_withheld     = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    period_start     = models.DateField(null=True, blank=True)
    period_end       = models.DateField(null=True, blank=True)
    currency         = models.CharField(max_length=3, default="EUR")
    review_status    = models.CharField(max_length=20, choices=REVIEW_STATUS_CHOICES, default="candidate")
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "portal_extracted_income"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.income_type} €{self.gross_amount} ({self.review_status})"


class ExtractedExpense(models.Model):
    EXPENSE_CATEGORY_CHOICES = [
        ("laptop",      "Laptop / computer"),
        ("phone",       "Phone"),
        ("internet",    "Internet"),
        ("software",    "Software / subscriptions"),
        ("travel",      "Travel"),
        ("car",         "Car"),
        ("office",      "Office"),
        ("home_office", "Home office"),
        ("training",    "Training / courses"),
        ("accountant",  "Accountant / bookkeeping"),
        ("marketing",   "Marketing"),
        ("insurance",   "Insurance"),
        ("pension",     "Pension / lijfrente"),
        ("equipment",   "Equipment"),
        ("meal",        "Meal / entertainment"),
        ("other",       "Other"),
    ]
    REVIEW_STATUS_CHOICES = [
        ("candidate", "Candidate (not yet approved)"),
        ("approved",  "Approved"),
        ("rejected",  "Rejected"),
        ("manual",    "Manually entered"),
    ]

    engagement              = models.ForeignKey(TaxEngagement, on_delete=models.CASCADE, related_name="expense_items")
    client_profile          = models.ForeignKey(AccountantClientProfile, on_delete=models.CASCADE, related_name="expense_items")
    source_document         = models.ForeignKey(ClientDocument, on_delete=models.SET_NULL, null=True, blank=True, related_name="extracted_expenses")
    expense_category        = models.CharField(max_length=20, choices=EXPENSE_CATEGORY_CHOICES, default="other")
    description             = models.CharField(max_length=255, blank=True)
    amount_gross            = models.DecimalField(max_digits=12, decimal_places=2)
    amount_net              = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    vat_amount              = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    business_use_percentage = models.PositiveIntegerField(null=True, blank=True)
    expense_date            = models.DateField(null=True, blank=True)
    supplier_name           = models.CharField(max_length=200, blank=True)
    review_status           = models.CharField(max_length=20, choices=REVIEW_STATUS_CHOICES, default="candidate")
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "portal_extracted_expenses"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.expense_category} €{self.amount_gross} ({self.review_status})"


class ChecklistItem(models.Model):
    STATUS_CHOICES = [
        ("todo",          "To do"),
        ("waiting_client","Waiting for client"),
        ("uploaded",      "Uploaded"),
        ("answered",      "Answered"),
        ("needs_review",  "Needs review"),
        ("accepted",      "Accepted"),
        ("rejected",      "Rejected"),
        ("waived",        "Waived"),
    ]
    SOURCE_CHOICES = [
        ("template",    "Template"),
        ("accountant",  "Accountant"),
        ("rule_engine", "Rule engine"),
        ("ai",          "AI suggestion"),
    ]
    PRIORITY_CHOICES = [
        ("low",    "Low"),
        ("medium", "Medium"),
        ("high",   "High"),
    ]

    engagement     = models.ForeignKey(TaxEngagement, on_delete=models.CASCADE, related_name="checklist_items")
    client_profile = models.ForeignKey(AccountantClientProfile, on_delete=models.CASCADE, related_name="checklist_items")
    title          = models.CharField(max_length=200)
    description    = models.TextField(blank=True)
    category       = models.CharField(max_length=50, blank=True)
    required       = models.BooleanField(default=True)
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default="todo")
    source         = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="template")
    priority       = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="medium")
    # stable_key prevents duplicate creation when the engine runs multiple times
    stable_key     = models.CharField(max_length=100, blank=True, db_index=True)
    # meta_value stores client-entered text (KVK number, BTW number, etc.)
    meta_value     = models.TextField(blank=True)
    task_type      = models.CharField(
        max_length=20,
        choices=[("document", "Document upload"), ("info", "Information entry")],
        default="document",
        help_text="document = requires file upload; info = requires text/number entry",
    )
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "portal_checklist_items"
        ordering = ["-required", "priority", "created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["engagement", "stable_key"],
                condition=models.Q(stable_key__gt=""),
                name="unique_checklist_item_stable_key",
            )
        ]

    def __str__(self):
        return f"{self.title} ({self.status})"


class AccountantAction(models.Model):
    ACTION_TYPE_CHOICES = [
        ("request_document",  "Request document"),
        ("review_document",   "Review document"),
        ("check_deduction",   "Check deduction"),
        ("send_reminder",     "Send reminder"),
        ("review_risk",       "Review risk"),
        ("approve_extraction","Approve extraction"),
        ("prepare_filing",    "Prepare filing"),
    ]
    PRIORITY_CHOICES = [
        ("low",    "Low"),
        ("medium", "Medium"),
        ("high",   "High"),
    ]
    STATUS_CHOICES = [
        ("open",      "Open"),
        ("done",      "Done"),
        ("dismissed", "Dismissed"),
    ]
    SOURCE_CHOICES = [
        ("rule_engine", "Rule engine"),
        ("ai",          "AI"),
        ("manual",      "Manual"),
    ]

    engagement     = models.ForeignKey(TaxEngagement, on_delete=models.CASCADE, related_name="actions")
    client_profile = models.ForeignKey(AccountantClientProfile, on_delete=models.CASCADE, related_name="actions")
    title          = models.CharField(max_length=200)
    body           = models.TextField(blank=True)
    action_type    = models.CharField(max_length=30, choices=ACTION_TYPE_CHOICES, default="request_document")
    priority       = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="medium")
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    source         = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="rule_engine")
    metadata_json  = models.JSONField(null=True, blank=True)
    stable_key     = models.CharField(max_length=100, blank=True, db_index=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "portal_accountant_actions"
        ordering = ["-priority", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["engagement", "stable_key"],
                condition=models.Q(stable_key__gt=""),
                name="unique_action_per_engagement_stable_key",
            )
        ]

    def __str__(self):
        return f"{self.title} ({self.status})"


class PortalAuditLog(models.Model):
    actor_user     = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="portal_audit_logs"
    )
    accountant     = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="portal_accountant_logs"
    )
    client_profile = models.ForeignKey(
        AccountantClientProfile, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="audit_logs"
    )
    engagement     = models.ForeignKey(
        TaxEngagement, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="audit_logs"
    )
    action         = models.CharField(max_length=100)
    entity_type    = models.CharField(max_length=50, blank=True)
    entity_id      = models.CharField(max_length=50, blank=True)
    before_json    = models.JSONField(null=True, blank=True)
    after_json     = models.JSONField(null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "portal_audit_logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} by {self.actor_user_id} @ {self.created_at:%Y-%m-%d %H:%M}"


class ReminderLog(models.Model):
    """
    Tracks every reminder sent from an accountant to a client, with delivery status.
    Distinct from TaxReminder (tax-calendar deadlines); this is a per-engagement audit trail.
    """
    REMINDER_TYPE_CHOICES = [
        ("document_request", "Document request"),
        ("deadline",         "Deadline reminder"),
        ("status_update",    "Status update"),
        ("custom",           "Custom"),
    ]
    CHANNEL_CHOICES = [
        ("push",   "Push notification"),
        ("email",  "Email"),
        ("in_app", "In-app"),
    ]

    engagement     = models.ForeignKey(
        TaxEngagement, on_delete=models.CASCADE, related_name="reminder_logs"
    )
    client_profile = models.ForeignKey(
        AccountantClientProfile, on_delete=models.CASCADE, related_name="reminder_logs"
    )
    sent_by        = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="sent_reminders"
    )
    reminder_type  = models.CharField(max_length=30, choices=REMINDER_TYPE_CHOICES, default="custom")
    channel        = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default="in_app")
    subject        = models.CharField(max_length=200)
    body           = models.TextField(blank=True)
    delivered      = models.BooleanField(default=False)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table  = "portal_reminder_logs"
        ordering  = ["-created_at"]

    def __str__(self):
        return f"{self.reminder_type} → {self.client_profile} @ {self.created_at:%Y-%m-%d %H:%M}"


class PortalMessage(models.Model):
    """
    In-app messages between accountant and client within an engagement.
    Provides the /client/messages and accountant inbox messaging thread.
    """
    engagement     = models.ForeignKey(
        TaxEngagement, on_delete=models.CASCADE, related_name="messages"
    )
    client_profile = models.ForeignKey(
        AccountantClientProfile, on_delete=models.CASCADE, related_name="messages"
    )
    sender         = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="portal_messages_sent"
    )
    body           = models.TextField()
    is_read        = models.BooleanField(default=False)
    is_system      = models.BooleanField(default=False)
    read_at        = models.DateTimeField(null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "portal_messages"
        ordering = ["created_at"]

    def __str__(self):
        return f"msg from {self.sender_id} @ {self.created_at:%Y-%m-%d %H:%M}"


class ReadinessSnapshot(models.Model):
    """
    Immutable snapshot of a readiness score calculation.
    Written every time the readiness engine recalculates.
    Used for trend analysis and audit trail.
    """
    engagement = models.ForeignKey(TaxEngagement, on_delete=models.CASCADE, related_name="readiness_snapshots")
    score = models.FloatField()
    doc_score = models.FloatField()
    checklist_score = models.FloatField()
    verification_score = models.FloatField()
    accountant_review_score = models.FloatField()
    ready_to_file = models.BooleanField(default=False)
    trigger_event = models.CharField(max_length=100, blank=True)
    computed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "portal_readiness_snapshots"
        ordering = ["-computed_at"]

    def __str__(self):
        return f"Engagement {self.engagement_id} — score {self.score:.0f} @ {self.computed_at:%Y-%m-%d %H:%M}"


class ExtractedField(models.Model):
    """
    A single field extracted from a document by OCR + Claude.
    Replaces the extracted_json blob for granular accountant review.
    """
    STATUS_CHOICES = [
        ("candidate", "Candidate"),
        ("accepted", "Accepted"),
        ("corrected", "Corrected"),
        ("rejected", "Rejected"),
    ]

    document = models.ForeignKey(ClientDocument, on_delete=models.CASCADE, related_name="extracted_fields")
    field_name = models.CharField(max_length=100)
    raw_value = models.TextField(blank=True, help_text="As OCR read it")
    normalized_value = models.TextField(blank=True, help_text="Cleaned value (e.g., '48500.00')")
    confidence = models.FloatField(default=0.0)
    bounding_box = models.JSONField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="candidate")
    corrected_value = models.TextField(blank=True, help_text="Accountant's correction")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "portal_extracted_fields"
        ordering = ["document", "field_name"]
        unique_together = [("document", "field_name")]

    def __str__(self):
        return f"{self.document_id} / {self.field_name} = {self.normalized_value} ({self.status})"


class Invitation(models.Model):
    """
    Token-based invitation from accountant to client (or vice versa from marketplace).
    Expires after 7 days. Accepting auto-creates a TaxEngagement.
    """
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("expired", "Expired"),
        ("cancelled", "Cancelled"),
        ("declined", "Declined"),
    ]

    sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="invitations_sent"
    )
    client_email = models.EmailField()
    client_name = models.CharField(max_length=200, blank=True)
    message = models.TextField(blank=True, default="")
    client_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="invitations_received"
    )
    engagement = models.ForeignKey(
        TaxEngagement, on_delete=models.SET_NULL, null=True, blank=True, related_name="invitation"
    )
    tax_year = models.PositiveIntegerField(default=2026)
    token = models.CharField(max_length=64, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "portal_invitations"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Invitation to {self.client_email} ({self.status})"


# ── Signals ───────────────────────────────────────────────────────────────────

from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=ChecklistItem)
def _update_missing_count_on_checklist_change(sender, instance, **kwargs):
    """Keep TaxEngagement.missing_items_count in sync whenever a ChecklistItem is saved."""
    try:
        eng = instance.engagement
        missing = ChecklistItem.objects.filter(
            engagement=eng,
            required=True,
            status__in=("todo", "waiting_client", "rejected"),
        ).count()
        TaxEngagement.objects.filter(pk=eng.pk).update(missing_items_count=missing)
    except Exception:
        pass
