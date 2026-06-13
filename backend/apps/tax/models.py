import json
from django.db import models
from django.conf import settings


class TaxProfile(models.Model):
    """
    Stores the user's tax intake data.
    Populated via the Phase 5 intake flow.
    Used as input to the Phase 3 calculator.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tax_profile"
    )
    tax_year = models.PositiveIntegerField(default=2026)

    # Income
    annual_revenue_zzp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    business_expenses = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    employment_income = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    hours_per_year = models.PositiveIntegerField(null=True, blank=True)

    # Profile
    years_as_entrepreneur = models.PositiveIntegerField(default=0)
    is_starter = models.BooleanField(default=False)
    has_partner = models.BooleanField(default=False)
    partner_income = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    children_under_12 = models.PositiveIntegerField(default=0)

    # Assets
    rent_per_month = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    net_assets_box3 = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Special situations
    has_company_bv = models.BooleanField(default=False)
    uses_30pct_ruling = models.BooleanField(default=False)
    pension_contribution = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    kia_investments = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    single_client_percentage = models.PositiveIntegerField(null=True, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tax_profiles"


class TaxRule(models.Model):
    """
    A single Dutch tax rule — stored in the database and editable by admins.
    Mirrors the structure of phase1/data/seed/tax_rules_2026.json.
    """
    STATUS_CHOICES = [
        ("verified", "Verified"),
        ("pending_review", "Pending Review"),
        ("draft", "Draft"),
    ]
    RESULT_TYPE_CHOICES = [
        ("rate", "Rate"), ("amount", "Amount"), ("threshold", "Threshold"),
        ("risk", "Risk"), ("deadline", "Deadline"), ("boolean", "Boolean"),
    ]

    # Identity
    rule_id = models.CharField(max_length=50, unique=True)
    year = models.PositiveIntegerField(default=2026)
    topic = models.CharField(max_length=100)
    category = models.CharField(max_length=100, blank=True)
    user_types = models.JSONField(default=list)
    tags = models.JSONField(default=list)

    # Condition / result
    condition_summary = models.TextField(blank=True)
    result_type = models.CharField(max_length=20, choices=RESULT_TYPE_CHOICES, default="amount")
    result_value = models.FloatField(null=True, blank=True)
    result_unit = models.CharField(max_length=20, blank=True)
    result_formula = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    # Multilingual plain text
    plain_nl = models.TextField(blank=True)
    plain_en = models.TextField(blank=True)
    plain_fa = models.TextField(blank=True)

    # AI / RAG
    ai_prompt_hint = models.TextField(blank=True)

    # Source + verification
    source_url = models.URLField(max_length=500, blank=True)
    verification_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")

    # Date range
    effective_from = models.DateField(null=True, blank=True)
    effective_until = models.DateField(null=True, blank=True)
    supersedes = models.CharField(max_length=50, blank=True)

    # Versioning + approval workflow
    version = models.PositiveIntegerField(default=1)
    shadow_mode = models.BooleanField(
        default=False,
        help_text="Run scenarios against this rule silently before making it live."
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="rules_created"
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="rules_approved"
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=150, blank=True)

    class Meta:
        db_table = "tax_rules"
        ordering = ["year", "rule_id"]

    def __str__(self):
        return f"{self.rule_id} ({self.year})"

    @classmethod
    def import_from_json(cls, path: str, replace: bool = False):
        """Import rules from a Phase 1 seed JSON file."""
        with open(path, encoding="utf-8") as f:
            rules = json.load(f)
        created, updated = 0, 0
        for r in rules:
            condition = r.get("condition", {})
            result = r.get("result", {})
            defaults = {
                "year": r.get("year", 2026),
                "topic": r.get("topic", ""),
                "category": r.get("category", ""),
                "user_types": r.get("user_types", []),
                "tags": r.get("tags", []),
                "condition_summary": str(condition),
                "result_type": result.get("type", "amount"),
                "result_value": float(result["value"]) if isinstance(result.get("value"), (int, float)) else None,
                "result_unit": result.get("unit", ""),
                "result_formula": result.get("formula", ""),
                "notes": result.get("notes", ""),
                "plain_nl": r.get("plain_nl", ""),
                "plain_en": r.get("plain_en", ""),
                "plain_fa": r.get("plain_fa", ""),
                "ai_prompt_hint": r.get("ai_prompt_hint", ""),
                "source_url": r.get("source_url", ""),
                "verification_status": r.get("verification_status", "draft"),
                "effective_from": r.get("effective_from"),
                "effective_until": r.get("effective_until"),
                "supersedes": r.get("supersedes", ""),
            }
            obj, was_created = cls.objects.update_or_create(rule_id=r["id"], defaults=defaults)
            if was_created:
                created += 1
            else:
                updated += 1
        return created, updated


class RuleTestCase(models.Model):
    """
    Automated test case for a single TaxRule.
    Every verified rule must have at least one passing test case.
    Test cases run in CI and after any rule change.
    """
    rule = models.ForeignKey(TaxRule, on_delete=models.CASCADE, related_name="test_cases")
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    input_data = models.JSONField(help_text="e.g. {'profit': 50000, 'hours': 1400}")
    expected_output = models.JSONField(help_text="e.g. {'eligible': true, 'deduction': 1200}")
    actual_output = models.JSONField(null=True, blank=True)
    passed = models.BooleanField(null=True, blank=True)
    last_run_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tax_rule_test_cases"
        ordering = ["rule__rule_id", "name"]

    def __str__(self):
        status = "✓" if self.passed else ("✗" if self.passed is False else "?")
        return f"{self.rule.rule_id} / {self.name} [{status}]"


class ChecklistTemplate(models.Model):
    """
    Template for generating per-engagement checklists.
    One template per (user_type, year). Items stored as JSON.
    Versioned — new version drafted each September for next tax year.
    """
    user_type = models.CharField(max_length=20)
    year = models.PositiveIntegerField(default=2026)
    version = models.PositiveIntegerField(default=1)
    items = models.JSONField(
        default=list,
        help_text="List of {slug, category, label_nl, label_en, label_fa, priority, description_*} dicts"
    )
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="checklist_templates_created"
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tax_checklist_templates"
        unique_together = [("user_type", "year", "version")]
        ordering = ["user_type", "-year", "-version"]

    def __str__(self):
        return f"Checklist template: {self.user_type} / {self.year} v{self.version}"
