from rest_framework import serializers
from .models import (
    AccountantClientProfile, TaxEngagement, DocumentRequest,
    ClientDocument, ExtractedIncome, ExtractedExpense,
    ChecklistItem, AccountantAction, PortalAuditLog,
    ReminderLog, PortalMessage,
)


class AccountantClientProfileSerializer(serializers.ModelSerializer):
    display_name = serializers.ReadOnlyField()
    engagement_count = serializers.SerializerMethodField()
    latest_readiness = serializers.SerializerMethodField()

    def get_engagement_count(self, obj):
        return obj.engagements.count()

    def get_latest_readiness(self, obj):
        eng = obj.engagements.order_by("-created_at").first()
        return eng.readiness_score if eng else None

    class Meta:
        model = AccountantClientProfile
        fields = [
            "id", "email", "first_name", "last_name", "company_name",
            "client_type", "preferred_language", "phone", "status",
            "tax_year", "notes", "display_name", "engagement_count",
            "latest_readiness", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "display_name", "engagement_count", "latest_readiness"]


class TaxEngagementSerializer(serializers.ModelSerializer):
    client_profile_display = serializers.SerializerMethodField()

    def get_client_profile_display(self, obj):
        return str(obj.client_profile)

    class Meta:
        model = TaxEngagement
        fields = [
            "id", "accountant", "client_profile", "client_profile_display",
            "tax_year", "engagement_type", "status", "deadline_date",
            "readiness_score", "missing_items_count", "risk_level",
            "summary_json", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "accountant", "readiness_score", "missing_items_count",
            "risk_level", "created_at", "updated_at", "client_profile_display",
        ]


class DocumentRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentRequest
        fields = [
            "id", "engagement", "client_profile", "title", "description",
            "request_type", "required", "status", "due_date",
            "ai_generated", "created_by", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ClientDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    class Meta:
        model = ClientDocument
        fields = [
            "id", "engagement", "client_profile", "document_request",
            "uploaded_by", "original_filename", "user_title", "user_note", "file_url",
            "mime_type", "file_size", "document_type", "processing_status",
            "extracted_json", "confidence_score", "review_notes",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "uploaded_by", "original_filename", "mime_type", "file_size",
            "processing_status", "extracted_json", "confidence_score",
            "created_at", "updated_at",
        ]


class ClientDocumentUploadSerializer(serializers.ModelSerializer):
    """Handles the multipart file upload."""
    class Meta:
        model = ClientDocument
        fields = ["engagement", "client_profile", "document_request", "file", "user_title", "user_note"]

    def validate_file(self, value):
        if value.size > ClientDocument.MAX_FILE_SIZE:
            raise serializers.ValidationError(
                f"File too large. Maximum size is {ClientDocument.MAX_FILE_SIZE // (1024*1024)} MB."
            )
        allowed = ClientDocument.ALLOWED_MIME_TYPES
        if value.content_type not in allowed:
            raise serializers.ValidationError(
                f"File type '{value.content_type}' is not allowed. "
                f"Allowed types: PDF, JPEG, PNG, HEIC, CSV, XLSX."
            )
        return value


class ExtractedIncomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExtractedIncome
        fields = [
            "id", "engagement", "client_profile", "source_document",
            "income_type", "description", "gross_amount", "tax_withheld",
            "period_start", "period_end", "currency", "review_status",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ExtractedExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExtractedExpense
        fields = [
            "id", "engagement", "client_profile", "source_document",
            "expense_category", "description", "amount_gross", "amount_net",
            "vat_amount", "business_use_percentage", "expense_date",
            "supplier_name", "review_status", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = [
            "id", "engagement", "client_profile", "title", "description",
            "category", "required", "status", "source", "priority",
            "stable_key", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "stable_key", "source", "created_at", "updated_at"]


class AccountantActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountantAction
        fields = [
            "id", "engagement", "client_profile", "title", "body",
            "action_type", "priority", "status", "source",
            "metadata_json", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "stable_key", "source", "created_at", "updated_at"]


class PortalAuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.SerializerMethodField()

    def get_actor_email(self, obj):
        return obj.actor_user.email if obj.actor_user else None

    class Meta:
        model = PortalAuditLog
        fields = [
            "id", "actor_user", "actor_email", "action",
            "entity_type", "entity_id", "before_json", "after_json", "created_at",
        ]
        read_only_fields = fields


class ReminderLogSerializer(serializers.ModelSerializer):
    sent_by_email = serializers.SerializerMethodField()
    client_name   = serializers.SerializerMethodField()

    def get_sent_by_email(self, obj):
        return obj.sent_by.email if obj.sent_by else None

    def get_client_name(self, obj):
        return obj.client_profile.display_name

    class Meta:
        model = ReminderLog
        fields = [
            "id", "engagement", "client_profile", "client_name",
            "sent_by", "sent_by_email", "reminder_type", "channel",
            "subject", "body", "delivered", "created_at",
        ]
        read_only_fields = ["id", "sent_by", "sent_by_email", "client_name", "created_at"]


class PortalMessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.SerializerMethodField()
    sender_name  = serializers.SerializerMethodField()
    is_own       = serializers.SerializerMethodField()

    def get_sender_email(self, obj):
        return obj.sender.email

    def get_sender_name(self, obj):
        name = f"{obj.sender.first_name} {obj.sender.last_name}".strip()
        return name or obj.sender.email

    def get_is_own(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.sender_id == request.user.id
        return False

    class Meta:
        model = PortalMessage
        fields = [
            "id", "engagement", "client_profile", "sender", "sender_email",
            "sender_name", "is_own", "body", "is_read", "read_at", "created_at",
        ]
        read_only_fields = [
            "id", "sender", "sender_email", "sender_name", "is_own",
            "is_read", "read_at", "created_at",
        ]
