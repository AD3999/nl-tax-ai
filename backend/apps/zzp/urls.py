from django.urls import path
from .views import (
    RevenueListView, RevenueDetailView,
    ExpenseListView, ExpenseDetailView,
    HoursListView, HoursDetailView,
    MileageListView, MileageDetailView,
    ZZPSummaryView,
    AccountantReviewView, AccountantReviewDetailView,
)

urlpatterns = [
    # Revenue
    path("revenue/",            RevenueListView.as_view(),          name="zzp-revenue-list"),
    path("revenue/<int:pk>/",   RevenueDetailView.as_view(),        name="zzp-revenue-detail"),

    # Expenses
    path("expenses/",           ExpenseListView.as_view(),          name="zzp-expense-list"),
    path("expenses/<int:pk>/",  ExpenseDetailView.as_view(),        name="zzp-expense-detail"),

    # Hours
    path("hours/",              HoursListView.as_view(),            name="zzp-hours-list"),
    path("hours/<int:pk>/",     HoursDetailView.as_view(),          name="zzp-hours-detail"),

    # Mileage
    path("mileage/",            MileageListView.as_view(),          name="zzp-mileage-list"),
    path("mileage/<int:pk>/",   MileageDetailView.as_view(),        name="zzp-mileage-detail"),

    # Summary
    path("summary/",            ZZPSummaryView.as_view(),           name="zzp-summary"),

    # Accountant review
    path("reviews/",            AccountantReviewView.as_view(),     name="zzp-reviews"),
    path("reviews/<int:pk>/",   AccountantReviewDetailView.as_view(), name="zzp-review-detail"),
]
