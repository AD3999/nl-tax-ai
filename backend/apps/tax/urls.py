from django.urls import path
from .views import TaxProfileView

urlpatterns = [
    path("profile/", TaxProfileView.as_view(), name="tax-profile"),
]
