from rest_framework import serializers
from .models import CalculationResult


class CalculatorInputSerializer(serializers.Serializer):
    year = serializers.IntegerField(default=2026)

    # Income (ZZP only)
    annual_revenue_zzp = serializers.FloatField(required=True)
    business_expenses  = serializers.FloatField(required=False, allow_null=True, default=0)

    # Work profile
    hours_per_year        = serializers.IntegerField(required=False, allow_null=True)
    years_as_entrepreneur = serializers.IntegerField(required=False, default=0)
    is_starter            = serializers.BooleanField(required=False, default=False)
    aow_age               = serializers.BooleanField(required=False, default=False)

    # Personal
    has_partner       = serializers.BooleanField(required=False, default=False)
    partner_income    = serializers.FloatField(required=False, allow_null=True)
    children_under_12 = serializers.IntegerField(required=False, default=0)

    # Assets (Box 3 — universal, not DGA-specific)
    net_assets_box3  = serializers.FloatField(required=False, default=0)
    savings_fraction = serializers.FloatField(required=False, default=0.0,
                                              help_text="0=all investments, 1=all savings")

    # Deductions
    pension_contribution = serializers.FloatField(required=False, default=0)
    kia_investments      = serializers.FloatField(required=False, default=0)

    # Housing (for toeslag hints)
    rent_per_month = serializers.FloatField(required=False, allow_null=True)

    # Wet DBA
    single_client_percentage = serializers.FloatField(required=False, allow_null=True)


class CalculationResultSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CalculationResult
        fields = ["id", "tax_year", "total_tax_due", "effective_rate",
                  "monthly_reserve", "result", "created_at"]
        read_only_fields = fields
