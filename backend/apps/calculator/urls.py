from django.urls import path
from .views import CalculateView, CalculationHistoryView

urlpatterns = [
    path("calculate/", CalculateView.as_view(), name="calculate"),
    path("history/", CalculationHistoryView.as_view(), name="calculation-history"),
]
