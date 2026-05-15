from rest_framework import serializers
from .models import CalculationResult


class CalculationResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalculationResult
        fields = ["id", "tax_year", "total_tax_due", "effective_rate", "monthly_reserve", "result", "created_at"]
        read_only_fields = fields
