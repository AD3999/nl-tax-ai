from django.urls import path
from .views import RegisterView, ProfileView, GoogleAuthView, AlertsView, HealthView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("register/", RegisterView.as_view(), name="register"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("auth/google/", GoogleAuthView.as_view(), name="google_auth"),
    path("alerts/", AlertsView.as_view(), name="alerts"),
]
