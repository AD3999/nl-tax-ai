from rest_framework import serializers
from .models import (
    ZZPRevenueEntry, ZZPExpenseEntry, ZZPHoursEntry,
    ZZPMileageEntry, AccountantReviewEvent,
)


class ZZPRevenueEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model  = ZZPRevenueEntry
        fields = [
            "id", "date", "description", "client_name", "invoice_number",
            "amount_excl_vat", "vat_rate", "vat_amount", "amount_incl_vat",
            "payment_status", "payment_date", "invoice_file",
            "year", "quarter", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "vat_amount", "amount_incl_vat", "year", "quarter", "created_at", "updated_at"]


class ZZPExpenseEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model  = ZZPExpenseEntry
        fields = [
            "id", "date", "description", "category", "supplier_name",
            "amount_gross", "vat_rate", "vat_amount", "amount_net",
            "business_use_pct", "deductible_amount", "receipt_file",
            "year", "quarter", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "vat_amount", "amount_net", "deductible_amount", "year", "quarter", "created_at", "updated_at"]


class ZZPHoursEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model  = ZZPHoursEntry
        fields = [
            "id", "date", "hours", "description", "client_name",
            "year", "week", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "year", "week", "created_at", "updated_at"]


class ZZPMileageEntrySerializer(serializers.ModelSerializer):
    deductible_amount = serializers.ReadOnlyField()

    class Meta:
        model  = ZZPMileageEntry
        fields = [
            "id", "date", "from_location", "to_location", "km",
            "purpose", "is_business", "deductible_amount",
            "year", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "deductible_amount", "year", "created_at", "updated_at"]


class AccountantReviewEventSerializer(serializers.ModelSerializer):
    reviewer_email = serializers.SerializerMethodField()

    def get_reviewer_email(self, obj):
        return obj.reviewer.email

    class Meta:
        model  = AccountantReviewEvent
        fields = [
            "id", "reviewer", "reviewer_email", "client", "entry_type",
            "entry_id", "status", "note", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "reviewer", "reviewer_email", "created_at", "updated_at"]
