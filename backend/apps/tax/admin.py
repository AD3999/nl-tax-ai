from django.contrib import admin
from .models import TaxProfile, TaxRule, RuleTestCase, ChecklistTemplate


@admin.register(TaxProfile)
class TaxProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "tax_year", "annual_revenue_zzp", "updated_at"]
    raw_id_fields = ["user"]


@admin.register(TaxRule)
class TaxRuleAdmin(admin.ModelAdmin):
    list_display = ["rule_id", "topic", "year", "verification_status", "version", "shadow_mode", "effective_until"]
    list_filter = ["verification_status", "year", "shadow_mode", "result_type"]
    search_fields = ["rule_id", "topic", "plain_nl", "plain_en"]
    readonly_fields = ["created_at", "updated_at"]
    raw_id_fields = ["created_by", "approved_by"]
    fieldsets = (
        ("Identity", {"fields": ("rule_id", "year", "topic", "category", "user_types", "tags")}),
        ("Condition / Result", {"fields": ("condition_summary", "result_type", "result_value", "result_unit", "result_formula", "notes")}),
        ("Multilingual Text", {"fields": ("plain_nl", "plain_en", "plain_fa")}),
        ("AI / RAG", {"fields": ("ai_prompt_hint",)}),
        ("Source + Verification", {"fields": ("source_url", "verification_status", "effective_from", "effective_until", "supersedes")}),
        ("Versioning", {"fields": ("version", "shadow_mode", "created_by", "approved_by", "approved_at")}),
        ("Timestamps", {"fields": ("created_at", "updated_at", "updated_by")}),
    )

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user.username
        if not obj.created_by_id:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(RuleTestCase)
class RuleTestCaseAdmin(admin.ModelAdmin):
    list_display = ["name", "rule", "passed", "last_run_at", "created_at"]
    list_filter = ["passed"]
    search_fields = ["name", "rule__rule_id"]
    raw_id_fields = ["rule"]
    readonly_fields = ["actual_output", "passed", "last_run_at", "created_at"]


@admin.register(ChecklistTemplate)
class ChecklistTemplateAdmin(admin.ModelAdmin):
    list_display = ["user_type", "year", "version", "is_active", "approved_at", "created_at"]
    list_filter = ["user_type", "year", "is_active"]
    raw_id_fields = ["created_by"]
    readonly_fields = ["created_at", "updated_at"]
