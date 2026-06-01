from django.urls import path
from .views import (
    RegisterView, ProfileView, GoogleAuthView,
    AlertsView, ActionsView, HealthView,
    NotificationPrefsView, YearSnapshotView,
    ItemStatesView,
)

urlpatterns = [
    path("health/",          HealthView.as_view(),             name="health"),
    path("register/",        RegisterView.as_view(),           name="register"),
    path("profile/",         ProfileView.as_view(),            name="profile"),
    path("auth/google/",     GoogleAuthView.as_view(),         name="google_auth"),
    path("alerts/",          AlertsView.as_view(),             name="alerts"),
    path("actions/",         ActionsView.as_view(),            name="actions"),
    # Alert/Action state persistence (authenticated users)
    path("item-states/",     ItemStatesView.as_view(),         name="item-states"),
    # Smart Calendar / Reminder Engine
    path("notifications/",   NotificationPrefsView.as_view(),  name="notification-prefs"),
    # Future Memory Foundation
    path("snapshots/",       YearSnapshotView.as_view(),       name="year-snapshots"),
    path("snapshots/<int:year>/", YearSnapshotView.as_view(),  name="year-snapshot-detail"),
]
