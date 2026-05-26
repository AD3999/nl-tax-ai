from django.urls import path

from .views import (
    IBFieldsView,
    Phase2RetrieveView,
    TaxProfileView,
    TaxRuleListView,
    TaxRuleDetailView,
    TaxRuleImportView,
    AdminStatsView,
)

urlpatterns = [
    path("profile/", TaxProfileView.as_view(), name="tax-profile"),
    path("phase2/retrieve/", Phase2RetrieveView.as_view(), name="phase2-retrieve"),
    path("ib/fields/", IBFieldsView.as_view(), name="ib-fields"),

    # Admin tax rules CRUD
    path("rules/", TaxRuleListView.as_view(), name="tax-rule-list"),
    path("rules/import/", TaxRuleImportView.as_view(), name="tax-rule-import"),
    path("rules/<str:rule_id>/", TaxRuleDetailView.as_view(), name="tax-rule-detail"),

    # Admin stats dashboard
    path("admin/stats/", AdminStatsView.as_view(), name="admin-stats"),
]
