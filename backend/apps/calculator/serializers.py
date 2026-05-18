from rest_framework import serializers
from .models import CalculationResult


class CalculatorInputSerializer(serializers.Serializer):
    user_type          = serializers.ChoiceField(choices=["zzp", "employee", "expat", "dga"])
    year               = serializers.IntegerField(default=2026)

    # Income
    annual_revenue_zzp = serializers.FloatField(required=False, allow_null=True)
    employment_income  = serializers.FloatField(required=False, allow_null=True)
    business_expenses  = serializers.FloatField(required=False, allow_null=True, default=0)

    # Work profile
    hours_per_year        = serializers.IntegerField(required=False, allow_null=True)
    years_as_entrepreneur = serializers.IntegerField(required=False, default=0)
    is_starter            = serializers.BooleanField(required=False, default=False)
    aow_age               = serializers.BooleanField(required=False, default=False)

    # Personal
    has_partner      = serializers.BooleanField(required=False, default=False)
    partner_income   = serializers.FloatField(required=False, allow_null=True)
    children_under_12 = serializers.IntegerField(required=False, default=0)

    # Assets
    net_assets_box3  = serializers.FloatField(required=False, default=0)
    savings_fraction = serializers.FloatField(required=False, default=0.0,
                                              help_text="0=all investments, 1=all savings")
    box2_dividend    = serializers.FloatField(required=False, default=0)

    # Deductions
    pension_contribution = serializers.FloatField(required=False, default=0)
    kia_investments      = serializers.FloatField(required=False, default=0)

    # Housing (for toeslag hints)
    rent_per_month = serializers.FloatField(required=False, allow_null=True)

    # 30% ruling (expats)
    uses_30pct_ruling = serializers.BooleanField(required=False, default=False)
    ruling_year       = serializers.IntegerField(required=False, default=1,
                                                 help_text="Which year of the 30% ruling (1-5)")

    # Wet DBA
    single_client_percentage = serializers.FloatField(required=False, allow_null=True)

    def validate(self, data):
        user_type = data["user_type"]
        if user_type == "zzp" and not data.get("annual_revenue_zzp"):
            raise serializers.ValidationError(
                {"annual_revenue_zzp": "Required for user_type=zzp"}
            )
        if user_type in ("employee", "expat", "dga") and not data.get("employment_income"):
            raise serializers.ValidationError(
                {"employment_income": "Required for user_type=employee/expat/dga"}
            )
        return data


class CalculationResultSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CalculationResult
        fields = ["id", "tax_year", "total_tax_due", "effective_rate",
                  "monthly_reserve", "result", "created_at"]
        read_only_fields = fields
