from django.db import models
from django.conf import settings


class Subscription(models.Model):
    """
    Billing subscription for a firm or individual accountant.
    Stub in v1.0 — no active paywalls. Populated when billing goes live.
    """
    PLAN_CHOICES = [
        ("free", "Free"),
        ("professional", "Professional"),
        ("firm", "Firm"),
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("trialing", "Trialing"),
        ("past_due", "Past Due"),
        ("cancelled", "Cancelled"),
        ("incomplete", "Incomplete"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="subscriptions", null=True, blank=True
    )
    firm = models.ForeignKey(
        "portal.Firm", on_delete=models.CASCADE,
        related_name="subscriptions", null=True, blank=True
    )
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="free")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    stripe_subscription_id = models.CharField(max_length=100, blank=True, db_index=True)
    stripe_customer_id = models.CharField(max_length=100, blank=True)
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    cancel_at_period_end = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "billing_subscriptions"
        ordering = ["-created_at"]

    def __str__(self):
        entity = self.firm or self.user
        return f"{entity} — {self.plan} ({self.status})"


class Invoice(models.Model):
    """
    Billing invoice. Generated monthly by Stripe webhook or manually by admin.
    """
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("open", "Open"),
        ("paid", "Paid"),
        ("uncollectible", "Uncollectible"),
        ("void", "Void"),
    ]

    subscription = models.ForeignKey(
        Subscription, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="invoices"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="invoices"
    )
    firm = models.ForeignKey(
        "portal.Firm", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="invoices"
    )
    stripe_invoice_id = models.CharField(max_length=100, blank=True, db_index=True)
    amount_due = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="EUR")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    invoice_pdf_url = models.URLField(blank=True)
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "billing_invoices"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Invoice {self.stripe_invoice_id or self.pk} — €{self.amount_due} ({self.status})"


class UsageRecord(models.Model):
    """
    Per-request usage tracking (AI chat, calculator calls, document OCR).
    Used for rate limiting and future metered billing.
    """
    FEATURE_CHOICES = [
        ("chat", "AI Chat"),
        ("calculator", "Tax Calculator"),
        ("checker", "Deduction Checker"),
        ("ocr", "Document OCR"),
        ("rag", "RAG Retrieval"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="usage_records"
    )
    subscription = models.ForeignKey(
        Subscription, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="usage_records"
    )
    feature = models.CharField(max_length=30, choices=FEATURE_CHOICES)
    quantity = models.PositiveIntegerField(default=1)
    metadata = models.JSONField(null=True, blank=True, help_text="e.g. tokens used, doc size")
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "billing_usage_records"
        ordering = ["-recorded_at"]
        indexes = [
            models.Index(fields=["user", "feature", "-recorded_at"]),
        ]

    def __str__(self):
        return f"{self.feature} × {self.quantity} — user {self.user_id}"
