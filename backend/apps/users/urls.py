from django.urls import path
from django.http import JsonResponse
from .views import RegisterView, ProfileView, GoogleAuthView


def health(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("health/", health, name="health"),
    path("register/", RegisterView.as_view(), name="register"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("auth/google/", GoogleAuthView.as_view(), name="google_auth"),
]
