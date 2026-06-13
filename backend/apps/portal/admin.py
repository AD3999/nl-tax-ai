from django.contrib import admin
from .models import (
    Firm, AccountantClientProfile, TaxEngagement, DocumentRequest,
    ClientDocument, ExtractedIncome, ExtractedExpense,
    ChecklistItem, AccountantAction, PortalAuditLog,
    ReminderLog, PortalMessage, ReadinessSnapshot, ExtractedField, Invitation,
)


@admin.register(Firm)
class FirmAdmin(admin.ModelAdmin):
    list_display = ["name", "kvk_number", "contact_email", "subscription_plan", "is_active", "created_at"]
    list_filter = ["subscription_plan", "is_active"]
    search_fields = ["name", "kvk_number", "contact_email"]


@admin.register(AccountantClientProfile)
class AccountantClientProfileAdmin(admin.ModelAdmin):
    list_display = ["display_name", "email", "client_type", "status", "tax_year", "accountant_user"]
    list_filter = ["client_type", "status", "tax_year", "preferred_language"]
    search_fields = ["email", "first_name", "last_name", "company_name"]
    raw_id_fields = ["accountant_user", "client_user"]


@admin.register(TaxEngagement)
class TaxEngagementAdmin(admin.ModelAdmin):
    list_display = ["client_profile", "tax_year", "engagement_type", "status", "readiness_score", "risk_level"]
    list_filter = ["status", "engagement_type", "risk_level", "tax_year"]
    search_fields = ["client_profile__email", "client_profile__first_name", "client_profile__last_name"]
    raw_id_fields = ["accountant", "client_profile"]


@admin.register(DocumentRequest)
class DocumentRequestAdmin(admin.ModelAdmin):
    list_display = ["title", "client_profile", "request_type", "required", "status"]
    list_filter = ["status", "request_type", "required"]
    raw_id_fields = ["engagement", "client_profile"]


@admin.register(ClientDocument)
class ClientDocumentAdmin(admin.ModelAdmin):
    list_display = ["original_filename", "client_profile", "document_type", "processing_status", "file_size"]
    list_filter = ["document_type", "processing_status"]
    raw_id_fields = ["engagement", "client_profile", "document_request", "uploaded_by"]


@admin.register(ExtractedIncome)
class ExtractedIncomeAdmin(admin.ModelAdmin):
    list_display = ["income_type", "gross_amount", "review_status", "client_profile"]
    list_filter = ["income_type", "review_status"]
    raw_id_fields = ["engagement", "client_profile", "source_document"]


@admin.register(ExtractedExpense)
class ExtractedExpenseAdmin(admin.ModelAdmin):
    list_display = ["expense_category", "amount_gross", "review_status", "client_profile"]
    list_filter = ["expense_category", "review_status"]
    raw_id_fields = ["engagement", "client_profile", "source_document"]


@admin.register(ChecklistItem)
class ChecklistItemAdmin(admin.ModelAdmin):
    list_display = ["title", "client_profile", "status", "required", "priority", "source"]
    list_filter = ["status", "required", "priority", "source"]
    raw_id_fields = ["engagement", "client_profile"]


@admin.register(AccountantAction)
class AccountantActionAdmin(admin.ModelAdmin):
    list_display = ["title", "client_profile", "action_type", "priority", "status", "source"]
    list_filter = ["action_type", "status", "priority", "source"]
    raw_id_fields = ["engagement", "client_profile"]


@admin.register(PortalAuditLog)
class PortalAuditLogAdmin(admin.ModelAdmin):
    list_display = ["action", "actor_user", "entity_type", "entity_id", "created_at"]
    list_filter = ["action", "entity_type"]
    raw_id_fields = ["actor_user", "accountant", "client_profile", "engagement"]

    def has_add_permission(self, request):
        return False  # audit logs are immutable

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(ReminderLog)
class ReminderLogAdmin(admin.ModelAdmin):
    list_display = ["reminder_type", "channel", "sent_by", "client_profile", "delivered", "created_at"]
    list_filter = ["reminder_type", "channel", "delivered"]
    raw_id_fields = ["engagement", "client_profile", "sent_by"]


@admin.register(PortalMessage)
class PortalMessageAdmin(admin.ModelAdmin):
    list_display = ["sender", "client_profile", "is_read", "created_at"]
    list_filter = ["is_read"]
    raw_id_fields = ["engagement", "client_profile", "sender"]


@admin.register(ReadinessSnapshot)
class ReadinessSnapshotAdmin(admin.ModelAdmin):
    list_display = ["engagement", "score", "ready_to_file", "trigger_event", "computed_at"]
    list_filter = ["ready_to_file"]
    raw_id_fields = ["engagement"]
    readonly_fields = ["computed_at"]

    def has_change_permission(self, request, obj=None):
        return False  # snapshots are immutable


@admin.register(ExtractedField)
class ExtractedFieldAdmin(admin.ModelAdmin):
    list_display = ["document", "field_name", "confidence", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["field_name", "raw_value"]
    raw_id_fields = ["document"]
    readonly_fields = ["created_at"]


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ["client_email", "sent_by", "status", "tax_year", "expires_at", "accepted_at"]
    list_filter = ["status", "tax_year"]
    search_fields = ["client_email", "client_name", "token"]
    raw_id_fields = ["sent_by", "client_user", "engagement"]
    readonly_fields = ["token", "created_at"]
