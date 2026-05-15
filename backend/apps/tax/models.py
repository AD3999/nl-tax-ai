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
