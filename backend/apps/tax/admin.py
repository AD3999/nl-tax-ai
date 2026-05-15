from django.contrib import admin
from .models import TaxProfile

@admin.register(TaxProfile)
class TaxProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "tax_year", "annual_revenue_zzp", "updated_at"]
