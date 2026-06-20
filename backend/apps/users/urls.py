from django.urls import path
from .views import (
    RegisterView, ProfileView, GoogleAuthView,
    AlertsView, ActionsView, HealthView,
    NotificationPrefsView, YearSnapshotView,
    ItemStatesView, EmailCaptureView, RemindersView,
    ChatHistoryView, ICSCalendarView, AccountantView,
    AccountantSetupView, PDFReportView,
    AccountantInvitationsView, ClientInvitationsView,
    PushVapidKeyView, PushSubscribeView,
    ClientMyAccountantView,
    AccountDeletionView, DataExportView,
    InAppNotificationsView, InAppNotificationReadAllView,
    InAppNotificationDetailView, InAppUnreadCountView,
)
from .admin_views import AdminUserListView, AdminUserDetailView

urlpatterns = [
    path("health/",           HealthView.as_view(),            name="health"),
    path("register/",         RegisterView.as_view(),          name="register"),
    path("profile/",          ProfileView.as_view(),           name="profile"),
    path("auth/google/",      GoogleAuthView.as_view(),        name="google_auth"),
    path("alerts/",           AlertsView.as_view(),            name="alerts"),
    path("actions/",          ActionsView.as_view(),           name="actions"),
    path("item-states/",      ItemStatesView.as_view(),        name="item-states"),
    path("notifications/",    NotificationPrefsView.as_view(), name="notification-prefs"),
    path("snapshots/",        YearSnapshotView.as_view(),      name="year-snapshots"),
    path("snapshots/<int:year>/", YearSnapshotView.as_view(),  name="year-snapshot-detail"),
    # New endpoints
    path("email-capture/",    EmailCaptureView.as_view(),      name="email-capture"),
    path("reminders/",        RemindersView.as_view(),         name="reminders"),
    path("chat-history/",     ChatHistoryView.as_view(),       name="chat-history"),
    path("chat-history/<int:pk>/", ChatHistoryView.as_view(),  name="chat-history-detail"),
    path("calendar.ics",      ICSCalendarView.as_view(),       name="calendar-ics"),
    path("accountant/setup/",            AccountantSetupView.as_view(), name="accountant-setup"),
    path("accountant/clients/",          AccountantView.as_view(),      name="accountant-clients"),
    path("accountant/clients/<int:pk>/", AccountantView.as_view(),      name="accountant-client-detail"),
    path("report/",                    PDFReportView.as_view(),   name="pdf-report"),
    # Invitation system
    path("accountant/invitations/",          AccountantInvitationsView.as_view(), name="accountant-invitations"),
    path("accountant/invitations/<int:pk>/", AccountantInvitationsView.as_view(), name="accountant-invitation-detail"),
    path("client/invitations/",              ClientInvitationsView.as_view(),     name="client-invitations"),
    path("client/invitations/<int:pk>/respond/", ClientInvitationsView.as_view(), name="client-invitation-respond"),
    path("client/my-accountant/",          ClientMyAccountantView.as_view(),    name="client-my-accountant"),
    path("client/my-accountant/<int:pk>/", ClientMyAccountantView.as_view(),    name="client-my-accountant-detail"),
    # Web Push
    path("push/vapid-key/",  PushVapidKeyView.as_view(),   name="push-vapid-key"),
    path("push/subscribe/",  PushSubscribeView.as_view(),  name="push-subscribe"),
    # In-app notifications
    path("inapp-notifications/",              InAppNotificationsView.as_view(),      name="inapp-notifications"),
    path("inapp-notifications/read-all/",     InAppNotificationReadAllView.as_view(), name="inapp-notifications-read-all"),
    path("inapp-notifications/unread-count/", InAppUnreadCountView.as_view(),         name="inapp-notifications-count"),
    path("inapp-notifications/<int:pk>/read/", InAppNotificationDetailView.as_view(), name="inapp-notification-read"),
    # GDPR
    path("me/",             AccountDeletionView.as_view(), name="account-deletion"),
    path("me/data-export/", DataExportView.as_view(),      name="data-export"),
    # Admin-only user management
    path("admin/list/",              AdminUserListView.as_view(),   name="admin-user-list"),
    path("admin/<int:pk>/",          AdminUserDetailView.as_view(), name="admin-user-detail"),
]
