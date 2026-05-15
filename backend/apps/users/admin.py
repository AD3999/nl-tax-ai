from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ["email", "username", "user_type", "preferred_language", "is_active"]
    list_filter = ["user_type", "preferred_language"]
    fieldsets = UserAdmin.fieldsets + (
        ("Tax profile", {"fields": ("user_type", "preferred_language", "tax_year")}),
    )
