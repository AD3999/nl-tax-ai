from django.contrib import admin
from .models import Subscription, Invoice, UsageRecord


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ["__str__", "plan", "status", "stripe_subscription_id", "current_period_end", "cancel_at_period_end"]
    list_filter = ["plan", "status", "cancel_at_period_end"]
    search_fields = ["user__email", "firm__name", "stripe_subscription_id", "stripe_customer_id"]
    raw_id_fields = ["user", "firm"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ["stripe_invoice_id", "status", "amount_due", "amount_paid", "currency", "period_start", "paid_at"]
    list_filter = ["status", "currency"]
    search_fields = ["stripe_invoice_id", "user__email", "firm__name"]
    raw_id_fields = ["subscription", "user", "firm"]
    readonly_fields = ["created_at"]


@admin.register(UsageRecord)
class UsageRecordAdmin(admin.ModelAdmin):
    list_display = ["user", "feature", "quantity", "recorded_at"]
    list_filter = ["feature"]
    search_fields = ["user__email"]
    raw_id_fields = ["user", "subscription"]
    readonly_fields = ["recorded_at"]

    def has_change_permission(self, request, obj=None):
        return False  # usage records are immutable
