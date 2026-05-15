from django.contrib import admin
from .models import CalculationResult

@admin.register(CalculationResult)
class CalculationResultAdmin(admin.ModelAdmin):
    list_display = ["user", "tax_year", "total_tax_due", "effective_rate", "created_at"]
    readonly_fields = ["input_snapshot", "result"]
