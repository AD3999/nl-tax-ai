from django.utils import timezone
from rest_framework import serializers
from .models import (
    AccountantClientProfile, TaxEngagement, DocumentRequest,
    ClientDocument, ExtractedIncome, ExtractedExpense,
    ChecklistItem, AccountantAction, PortalAuditLog,
    ReminderLog, PortalMessage,
)


def _detect_mime_from_bytes(file) -> str | None:
    """Detect MIME type from file magic bytes. Returns None if undetermined (e.g. CSV)."""
    header = file.read(16)
    file.seek(0)
    if header[:4] == b'%PDF':
        return 'application/pdf'
    if header[:3] == b'\xff\xd8\xff':
        return 'image/jpeg'
    if header[:8] == b'\x89PNG\r\n\x1a\n':
        return 'image/png'
    if header[:4] == b'RIFF' and header[8:12] == b'WEBP':
        return 'image/webp'
    if header[:4] == b'PK\x03\x04':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    if header[:8] == b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1':
        return 'application/vnd.ms-excel'
    if header[4:8] == b'ftyp':
        brand = header[8:12]
        if brand in (b'heic', b'heis', b'heim', b'heix', b'hevc', b'hevx', b'mif1', b'msf1'):
            return 'image/heic'
        if brand in (b'heif', b'avif'):
            return 'image/heif'
    return None


class AccountantClientProfileSerializer(serializers.ModelSerializer):
    display_name        = serializers.ReadOnlyField()
    engagement_count    = serializers.SerializerMethodField()
    latest_readiness    = serializers.SerializerMethodField()
    latest_missing_count = serializers.SerializerMethodField()
    latest_risk_level   = serializers.SerializerMethodField()
    # full_name is a virtual field: read = first_name + last_name, write = split on first space
    full_name           = serializers.SerializerMethodField()
    # tax_type is the client-facing alias for client_type
    tax_type            = serializers.SerializerMethodField()
    # days remaining before deactivated profile is permanently deleted
    days_until_deletion = serializers.SerializerMethodField()
    # Write-only: accepts plain BSN, encrypts it. Never returns decrypted value.
    bsn        = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # Read-only: tells frontend whether a BSN has been stored (without exposing the value).
    bsn_is_set = serializers.SerializerMethodField()
    accountant_display  = serializers.SerializerMethodField()

    latest_engagement_status = serializers.SerializerMethodField()
    latest_engagement_id     = serializers.SerializerMethodField()

    def get_latest_engagement_status(self, obj):
        eng = obj.engagements.order_by("-created_at").first()
        return eng.status if eng else None

    def get_latest_engagement_id(self, obj):
        eng = obj.engagements.order_by("-created_at").first()
        return eng.id if eng else None

    def get_engagement_count(self, obj):
        return obj.engagements.count()

    def get_latest_readiness(self, obj):
        eng = obj.engagements.order_by("-created_at").first()
        return eng.readiness_score if eng else None

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_tax_type(self, obj):
        return obj.client_type

    def get_days_until_deletion(self, obj):
        if obj.scheduled_deletion_at is None:
            return None
        delta = obj.scheduled_deletion_at - timezone.now()
        return max(0, delta.days)

    def get_bsn_is_set(self, obj):
        return bool(obj.bsn_enc)

    def get_latest_missing_count(self, obj):
        eng = obj.engagements.order_by("-created_at").first()
        return eng.missing_items_count if eng else 0

    def get_latest_risk_level(self, obj):
        eng = obj.engagements.order_by("-created_at").first()
        return eng.risk_level if eng else "low"

    def get_accountant_display(self, obj):
        user = obj.accountant_user
        if user and (not obj.client_user_id or user.id != obj.client_user_id):
            profile = getattr(user, "accountant_profile", None)
            return {
                "name": user.get_full_name() or user.email,
                "email": user.email,
                "is_verified": getattr(profile, "is_verified", False),
            }
        return None

    def validate(self, data):
        request = self.context.get("request")
        email = data.get("email", "")
        if request and email and not self.instance:
            if AccountantClientProfile.objects.filter(
                accountant_user=request.user, email__iexact=email
            ).exists():
                raise serializers.ValidationError(
                    {"email": "A client with this email already exists in your portal."}
                )
        return data

    def to_internal_value(self, data):
        data = data.copy()
        # full_name → first_name + last_name before DRF validation
        full_name = data.pop("full_name", None)
        if full_name is not None:
            parts = str(full_name).strip().split(" ", 1)
            data["first_name"] = parts[0]
            data["last_name"]  = parts[1] if len(parts) > 1 else ""
        # tax_type → client_type before DRF validation
        tax_type = data.pop("tax_type", None)
        if tax_type is not None:
            data["client_type"] = tax_type
        # bsn → bsn_enc (encrypt before storing)
        bsn_plain = data.pop("bsn", None)
        if bsn_plain is not None and str(bsn_plain).strip():
            try:
                from .encryption import encrypt_bsn
                data["bsn_enc"] = encrypt_bsn(str(bsn_plain))
            except EnvironmentError:
                # BSN_ENCRYPTION_KEY not configured — refuse to store plaintext
                raise serializers.ValidationError(
                    {"bsn": "BSN storage is not configured on this server. Contact your administrator."}
                )
        elif bsn_plain == "":
            data["bsn_enc"] = ""
        return super().to_internal_value(data)

    class Meta:
        model = AccountantClientProfile
        fields = [
            "id", "email", "first_name", "last_name", "full_name", "company_name",
            "client_type", "tax_type", "preferred_language", "phone", "status",
            "tax_year", "notes", "display_name", "engagement_count", "latest_readiness",
            "latest_missing_count", "latest_risk_level", "latest_engagement_status",
            "latest_engagement_id", "accountant_display",
            "address_street", "address_city", "address_postcode",
            "bsn", "bsn_is_set", "kvk_number", "btw_number", "birth_date",
            "deactivated_at", "scheduled_deletion_at", "days_until_deletion",
            "client_user",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "created_at", "updated_at", "display_name",
            "engagement_count", "latest_readiness", "latest_missing_count",
            "latest_risk_level", "accountant_display",
            "full_name", "tax_type",
            "deactivated_at", "scheduled_deletion_at", "days_until_deletion",
            "bsn_enc", "bsn_is_set",
        ]


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
    file_url    = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()
    file_name   = serializers.CharField(source="original_filename", read_only=True)
    uploaded_at = serializers.DateTimeField(source="created_at", read_only=True)
    status      = serializers.CharField(source="processing_status", read_only=True)

    def get_file_url(self, obj):
        if obj.file:
            return f"/api/portal/documents/{obj.id}/file/"
        return None

    def get_client_name(self, obj):
        return obj.client_profile.display_name

    class Meta:
        model = ClientDocument
        fields = [
            "id", "engagement", "client_profile", "document_request",
            "uploaded_by", "original_filename", "file_name", "user_title", "user_note",
            "file_url", "client_name", "uploaded_at", "status",
            "mime_type", "file_size", "document_type", "processing_status",
            "extracted_json", "confidence_score", "review_notes",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "uploaded_by", "original_filename", "file_name", "client_name",
            "uploaded_at", "status", "mime_type", "file_size",
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
        detected_mime = _detect_mime_from_bytes(value)
        # Use server-detected MIME; fall back to client-declared type only for formats
        # without reliable magic bytes (CSV). This prevents MIME-type spoofing.
        mime_to_use = detected_mime or value.content_type
        allowed = ClientDocument.ALLOWED_MIME_TYPES
        if mime_to_use not in allowed:
            raise serializers.ValidationError(
                "File type is not allowed. Allowed types: PDF, JPEG, PNG, HEIC, WEBP, CSV, XLSX."
            )
        # Override with server-detected value so the view never stores client-supplied type
        value.content_type = mime_to_use
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
            "stable_key", "meta_value", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "stable_key", "source", "created_at", "updated_at"]


class AccountantActionSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    description = serializers.CharField(source="body", read_only=True)
    due_date    = serializers.SerializerMethodField()

    def get_client_name(self, obj):
        return obj.client_profile.display_name

    def get_due_date(self, _obj):
        return None

    class Meta:
        model = AccountantAction
        fields = [
            "id", "engagement", "client_profile", "client_name",
            "title", "body", "description",
            "action_type", "priority", "status", "source",
            "due_date", "metadata_json", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "stable_key", "source", "client_name", "description", "due_date", "created_at", "updated_at"]


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
    client_name  = serializers.SerializerMethodField()
    is_own       = serializers.SerializerMethodField()

    def get_sender_email(self, obj):
        return obj.sender.email

    def get_sender_name(self, obj):
        name = f"{obj.sender.first_name} {obj.sender.last_name}".strip()
        return name or obj.sender.email

    def get_client_name(self, obj):
        return obj.client_profile.display_name

    def get_is_own(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.sender_id == request.user.id
        return False

    class Meta:
        model = PortalMessage
        fields = [
            "id", "engagement", "client_profile", "sender", "sender_email",
            "sender_name", "client_name", "is_own", "body", "is_read", "read_at", "created_at",
        ]
        read_only_fields = [
            "id", "sender", "sender_email", "sender_name", "is_own",
            "is_read", "read_at", "created_at",
        ]
