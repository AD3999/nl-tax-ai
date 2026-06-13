from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, NotificationPreference, TaxYearSnapshot,
    AccountantProfile, AccountantClient, AccountantInvitation,
    PushSubscription, EmailCapture, TaxReminder, UserItemState,
    FeatureFlag, DataSubjectRequest, Notification,
    AccountantListing, AccountantReview,
)


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ["email", "username", "role", "plan", "preferred_language", "is_active", "date_joined"]
    list_filter = ["role", "plan", "preferred_language", "is_active"]
    search_fields = ["email", "username", "first_name", "last_name"]
    fieldsets = UserAdmin.fieldsets + (
        ("TaxWijs", {"fields": ("role", "plan", "preferred_language", "tax_year", "stripe_customer_id")}),
    )


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ["user", "email_enabled", "whatsapp_enabled", "sms_enabled"]
    raw_id_fields = ["user"]


@admin.register(TaxYearSnapshot)
class TaxYearSnapshotAdmin(admin.ModelAdmin):
    list_display = ["user", "tax_year", "is_final", "created_at"]
    list_filter = ["tax_year", "is_final"]
    raw_id_fields = ["user"]
    readonly_fields = ["created_at"]


@admin.register(AccountantProfile)
class AccountantProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "firm_name", "kvk_number", "designation", "is_verified", "client_limit"]
    list_filter = ["designation", "is_verified"]
    search_fields = ["user__email", "firm_name", "kvk_number"]
    raw_id_fields = ["user"]


@admin.register(AccountantClient)
class AccountantClientAdmin(admin.ModelAdmin):
    list_display = ["accountant", "client_user", "nickname"]
    raw_id_fields = ["accountant", "client_user"]


@admin.register(AccountantInvitation)
class AccountantInvitationAdmin(admin.ModelAdmin):
    list_display = ["accountant", "invited_email", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["invited_email"]
    raw_id_fields = ["accountant", "client_user"]


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ["user", "created_at"]
    raw_id_fields = ["user"]
    readonly_fields = ["created_at"]


@admin.register(EmailCapture)
class EmailCaptureAdmin(admin.ModelAdmin):
    list_display = ["email", "user_type", "source_page", "created_at"]
    list_filter = ["user_type", "source_page"]
    search_fields = ["email"]
    readonly_fields = ["created_at"]


@admin.register(TaxReminder)
class TaxReminderAdmin(admin.ModelAdmin):
    list_display = ["title_nl", "category", "due_date", "recurrence"]
    list_filter = ["category", "recurrence"]
    search_fields = ["title_nl", "title_en"]


@admin.register(UserItemState)
class UserItemStateAdmin(admin.ModelAdmin):
    list_display = ["user", "item_type", "item_id", "state", "snoozed_until"]
    list_filter = ["item_type", "state"]
    raw_id_fields = ["user"]


@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ["key", "is_enabled", "rollout_percentage", "updated_by", "updated_at"]
    list_filter = ["is_enabled"]
    search_fields = ["key", "description"]
    raw_id_fields = ["updated_by"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(DataSubjectRequest)
class DataSubjectRequestAdmin(admin.ModelAdmin):
    list_display = ["user_email", "request_type", "status", "submitted_at", "due_date", "fulfilled_at"]
    list_filter = ["request_type", "status"]
    search_fields = ["user_email"]
    raw_id_fields = ["user", "fulfilled_by"]
    readonly_fields = ["submitted_at"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["user", "notification_type", "title", "is_read", "created_at"]
    list_filter = ["notification_type", "is_read"]
    search_fields = ["user__email", "title"]
    raw_id_fields = ["user"]
    readonly_fields = ["created_at"]


@admin.register(AccountantListing)
class AccountantListingAdmin(admin.ModelAdmin):
    list_display = ["display_name", "accountant", "verified_accountant", "rating", "review_count", "is_active", "accepts_new_clients"]
    list_filter = ["verified_accountant", "is_active", "accepts_new_clients"]
    search_fields = ["display_name", "accountant__email"]
    raw_id_fields = ["accountant"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(AccountantReview)
class AccountantReviewAdmin(admin.ModelAdmin):
    list_display = ["listing", "reviewer", "rating", "is_anonymous", "is_approved", "submitted_at"]
    list_filter = ["is_approved", "rating"]
    raw_id_fields = ["listing", "reviewer", "approved_by"]
    readonly_fields = ["submitted_at"]
