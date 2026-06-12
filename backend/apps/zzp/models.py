"""
ZZP Daily Workspace models.

Architecture:
  - ZZP clients track their own revenue, expenses, hours, and mileage year-round.
  - Each entry belongs to the ZZP user and optionally links to a TaxEngagement.
  - AccountantReviewEvent records every accept/reject/needs_more_info decision
    the accountant makes on any ZZP entry.
  - AI never approves entries — all review_status changes go through the accountant.
"""

from django.db import models
from django.conf import settings


class ZZPRevenueEntry(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ("unpaid",  "Unpaid"),
        ("paid",    "Paid"),
        ("overdue", "Overdue"),
        ("partial", "Partially paid"),
    ]
    VAT_RATE_CHOICES = [
        (0,  "0% (exempt / KOR)"),
        (9,  "9% (reduced)"),
        (21, "21% (standard)"),
    ]

    user             = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="zzp_revenue"
    )
    engagement       = models.ForeignKey(
        "portal.TaxEngagement", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="zzp_revenue"
    )
    date             = models.DateField()
    description      = models.CharField(max_length=255)
    client_name      = models.CharField(max_length=200, blank=True)
    invoice_number   = models.CharField(max_length=100, blank=True)
    amount_excl_vat  = models.DecimalField(max_digits=12, decimal_places=2)
    vat_rate         = models.PositiveSmallIntegerField(choices=VAT_RATE_CHOICES, default=21)
    vat_amount       = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_incl_vat  = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_status   = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default="unpaid")
    payment_date     = models.DateField(null=True, blank=True)
    invoice_file     = models.FileField(upload_to="zzp/invoices/%Y/%m/", null=True, blank=True)
    year             = models.PositiveSmallIntegerField(default=2026)
    quarter          = models.PositiveSmallIntegerField(default=1)
    notes            = models.TextField(blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "zzp_revenue_entries"
        ordering = ["-date", "-created_at"]

    def save(self, *args, **kwargs):
        self.vat_amount     = self.amount_excl_vat * self.vat_rate / 100
        self.amount_incl_vat = self.amount_excl_vat + self.vat_amount
        if self.date:
            self.year    = self.date.year
            self.quarter = (self.date.month - 1) // 3 + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Revenue {self.date} — €{self.amount_excl_vat} ({self.client_name or 'unknown'})"


class ZZPExpenseEntry(models.Model):
    CATEGORY_CHOICES = [
        ("laptop",      "Laptop / computer"),
        ("phone",       "Phone"),
        ("internet",    "Internet"),
        ("software",    "Software / subscriptions"),
        ("travel",      "Travel"),
        ("car",         "Car"),
        ("office",      "Office supplies"),
        ("home_office", "Home office"),
        ("training",    "Training / courses"),
        ("accountant",  "Accountant / bookkeeping"),
        ("marketing",   "Marketing"),
        ("insurance",   "Insurance"),
        ("pension",     "Pension / lijfrente"),
        ("equipment",   "Equipment / tools"),
        ("meal",        "Meal / entertainment"),
        ("other",       "Other"),
    ]
    VAT_RATE_CHOICES = [
        (0,  "0%"),
        (9,  "9%"),
        (21, "21%"),
    ]

    user                 = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="zzp_expenses"
    )
    engagement           = models.ForeignKey(
        "portal.TaxEngagement", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="zzp_expenses"
    )
    date                 = models.DateField()
    description          = models.CharField(max_length=255)
    category             = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default="other")
    supplier_name        = models.CharField(max_length=200, blank=True)
    amount_gross         = models.DecimalField(max_digits=12, decimal_places=2)
    vat_rate             = models.PositiveSmallIntegerField(choices=VAT_RATE_CHOICES, default=21)
    vat_amount           = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_net           = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    business_use_pct     = models.PositiveSmallIntegerField(default=100)  # 0–100
    deductible_amount    = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    receipt_file         = models.FileField(upload_to="zzp/receipts/%Y/%m/", null=True, blank=True)
    year                 = models.PositiveSmallIntegerField(default=2026)
    quarter              = models.PositiveSmallIntegerField(default=1)
    notes                = models.TextField(blank=True)
    created_at           = models.DateTimeField(auto_now_add=True)
    updated_at           = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "zzp_expense_entries"
        ordering = ["-date", "-created_at"]

    def save(self, *args, **kwargs):
        self.vat_amount       = self.amount_gross * self.vat_rate / 100
        self.amount_net       = self.amount_gross - self.vat_amount
        self.deductible_amount = self.amount_net * self.business_use_pct / 100
        if self.date:
            self.year    = self.date.year
            self.quarter = (self.date.month - 1) // 3 + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Expense {self.date} — €{self.amount_gross} ({self.category})"


class ZZPHoursEntry(models.Model):
    user        = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="zzp_hours"
    )
    date        = models.DateField()
    hours       = models.DecimalField(max_digits=5, decimal_places=2)
    description = models.CharField(max_length=255)
    client_name = models.CharField(max_length=200, blank=True)
    year        = models.PositiveSmallIntegerField(default=2026)
    week        = models.PositiveSmallIntegerField(default=1)
    notes       = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    URENCRITERIUM = 1225  # hours/year required for zelfstandigenaftrek

    class Meta:
        db_table = "zzp_hours_entries"
        ordering = ["-date"]

    def save(self, *args, **kwargs):
        if self.date:
            self.year = self.date.year
            self.week = self.date.isocalendar()[1]
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Hours {self.date} — {self.hours}h ({self.description[:40]})"


class ZZPMileageEntry(models.Model):
    user          = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="zzp_mileage"
    )
    date          = models.DateField()
    from_location = models.CharField(max_length=255)
    to_location   = models.CharField(max_length=255)
    km            = models.DecimalField(max_digits=8, decimal_places=1)
    purpose       = models.CharField(max_length=255)
    is_business   = models.BooleanField(default=True)
    year          = models.PositiveSmallIntegerField(default=2026)
    notes         = models.TextField(blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    RATE_PER_KM = 0.23  # €0.23/km Dutch standard reimbursement

    class Meta:
        db_table = "zzp_mileage_entries"
        ordering = ["-date"]

    def save(self, *args, **kwargs):
        if self.date:
            self.year = self.date.year
        super().save(*args, **kwargs)

    @property
    def deductible_amount(self):
        return float(self.km) * self.RATE_PER_KM if self.is_business else 0

    def __str__(self):
        return f"Mileage {self.date} — {self.km}km ({self.from_location} → {self.to_location})"


class AccountantReviewEvent(models.Model):
    """
    Records every time an accountant reviews a ZZP entry (revenue / expense / hours / mileage).
    Uses a loose entry_type + entry_id reference instead of GenericForeignKey for simplicity.
    """
    STATUS_CHOICES = [
        ("pending",        "Pending review"),
        ("accepted",       "Accepted"),
        ("rejected",       "Rejected"),
        ("needs_more_info","Needs more information"),
    ]
    ENTRY_TYPE_CHOICES = [
        ("revenue",  "Revenue entry"),
        ("expense",  "Expense entry"),
        ("hours",    "Hours entry"),
        ("mileage",  "Mileage entry"),
    ]

    reviewer   = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="zzp_reviews"
    )
    client     = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="zzp_review_events", null=True, blank=True
    )
    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPE_CHOICES)
    entry_id   = models.PositiveIntegerField()
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    note       = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "zzp_accountant_review_events"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Review {self.entry_type}#{self.entry_id} → {self.status} by {self.reviewer_id}"
