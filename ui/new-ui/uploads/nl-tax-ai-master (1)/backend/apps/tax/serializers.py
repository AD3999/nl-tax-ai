from rest_framework import serializers
from .models import TaxProfile, TaxRule


class TaxProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxProfile
        exclude = ["user"]
        read_only_fields = ["updated_at"]


class TaxRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxRule
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]

    def validate_rule_id(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("rule_id is required.")
        return value.strip().upper()
