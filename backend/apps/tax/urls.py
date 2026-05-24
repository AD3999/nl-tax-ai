from django.urls import path

from .views import IBFieldsView, Phase2RetrieveView, TaxProfileView

urlpatterns = [
    path("profile/", TaxProfileView.as_view(), name="tax-profile"),
    path("phase2/retrieve/", Phase2RetrieveView.as_view(), name="phase2-retrieve"),
    path("ib/fields/", IBFieldsView.as_view(), name="ib-fields"),
]
