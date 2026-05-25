from django.urls import path
from .views import CreateCheckoutSessionView, BillingPortalView, StripeWebhookView

urlpatterns = [
    path("create-checkout-session/", CreateCheckoutSessionView.as_view()),
    path("billing-portal/", BillingPortalView.as_view()),
    path("webhook/", StripeWebhookView.as_view()),
]
