from django.urls import path
from .views import (
    AccountantClientListView, AccountantClientDetailView,
    EngagementListView, EngagementDetailView,
    ChecklistView, ChecklistItemDetailView,
    DocumentRequestListView, DocumentRequestDetailView,
    ClientDocumentUploadView, EngagementDocumentsView, DocumentReviewView,
    DocumentFileView,
    ExtractedIncomeView, ExtractedIncomeDetailView,
    ExtractedExpenseView, ExtractedExpenseDetailView,
    AccountantActionsView, AccountantActionDetailView,
    ReadinessView, RisksDeductionsView, PortalReminderView, AuditLogView,
    ClientPortalProfileView, ClientPortalEngagementView,
    ClientPortalTasksView, ClientPortalDocumentsView,
    ClientPortalTaskUpdateView, ClientPortalDocumentDeleteView,
    AccountantInboxView,
    EngagementMessagesView, ClientMessagesView, ClientMessageUnreadCountView,
)

urlpatterns = [
    # ── Accountant — Clients ────────────────────────────────────────────────
    path("clients/",                        AccountantClientListView.as_view(),        name="portal-clients"),
    path("clients/<int:pk>/",               AccountantClientDetailView.as_view(),      name="portal-client-detail"),

    # ── Accountant — Engagements ────────────────────────────────────────────
    path("engagements/",                    EngagementListView.as_view(),              name="portal-engagements"),
    path("engagements/<int:pk>/",           EngagementDetailView.as_view(),            name="portal-engagement-detail"),

    # ── Engagement sub-resources ────────────────────────────────────────────
    path("engagements/<int:pk>/checklist/",           ChecklistView.as_view(),             name="portal-checklist"),
    path("engagements/<int:pk>/checklist/regenerate/",ChecklistView.as_view(),             name="portal-checklist-regenerate"),
    path("engagements/<int:pk>/document-requests/",   DocumentRequestListView.as_view(),   name="portal-doc-requests"),
    path("engagements/<int:pk>/documents/",           EngagementDocumentsView.as_view(),   name="portal-eng-documents"),
    path("engagements/<int:pk>/income/",              ExtractedIncomeView.as_view(),       name="portal-income"),
    path("engagements/<int:pk>/expenses/",            ExtractedExpenseView.as_view(),      name="portal-expenses"),
    path("engagements/<int:pk>/actions/",             AccountantActionsView.as_view(),     name="portal-actions"),
    path("engagements/<int:pk>/generate-actions/",    AccountantActionsView.as_view(),     name="portal-generate-actions"),
    path("engagements/<int:pk>/recalculate-readiness/", ReadinessView.as_view(),           name="portal-readiness"),
    path("engagements/<int:pk>/risks/",               RisksDeductionsView.as_view(),       name="portal-risks"),
    path("engagements/<int:pk>/send-reminder/",       PortalReminderView.as_view(),        name="portal-reminder"),
    path("engagements/<int:pk>/audit/",               AuditLogView.as_view(),              name="portal-audit"),

    # ── Individual resource endpoints ───────────────────────────────────────
    path("checklist/<int:pk>/",             ChecklistItemDetailView.as_view(),          name="portal-checklist-item"),
    path("document-requests/<int:pk>/",     DocumentRequestDetailView.as_view(),        name="portal-doc-request-detail"),
    path("documents/upload/",               ClientDocumentUploadView.as_view(),         name="portal-upload"),
    path("documents/<int:pk>/file/",        DocumentFileView.as_view(),                 name="portal-doc-file"),
    path("documents/<int:pk>/review/",      DocumentReviewView.as_view(),               name="portal-doc-review"),
    path("income/<int:pk>/",                ExtractedIncomeDetailView.as_view(),        name="portal-income-detail"),
    path("expenses/<int:pk>/",              ExtractedExpenseDetailView.as_view(),       name="portal-expense-detail"),
    path("actions/<int:pk>/",              AccountantActionDetailView.as_view(),        name="portal-action-detail"),

    # ── Accountant inbox (P2.1) ─────────────────────────────────────────────────
    path("inbox/",                         AccountantInboxView.as_view(),               name="portal-inbox"),

    # ── Messaging (P3.1) ────────────────────────────────────────────────────────
    path("engagements/<int:pk>/messages/", EngagementMessagesView.as_view(),            name="portal-eng-messages"),

    # ── Client self-service ─────────────────────────────────────────────────────
    path("client/profile/",                ClientPortalProfileView.as_view(),           name="portal-client-profile"),
    path("client/engagement/",             ClientPortalEngagementView.as_view(),        name="portal-client-engagement"),
    path("client/tasks/",                  ClientPortalTasksView.as_view(),             name="portal-client-tasks"),
    path("client/tasks/<int:pk>/",         ClientPortalTaskUpdateView.as_view(),        name="portal-client-task-update"),
    path("client/documents/",              ClientPortalDocumentsView.as_view(),         name="portal-client-documents"),
    path("client/documents/<int:pk>/",     ClientPortalDocumentDeleteView.as_view(),    name="portal-client-document-delete"),
    path("client/messages/",               ClientMessagesView.as_view(),                name="portal-client-messages"),
    path("client/messages/unread-count/",  ClientMessageUnreadCountView.as_view(),      name="portal-client-messages-unread"),
]
