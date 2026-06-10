from django.urls import path
from .views import ChatMessageView, ConversationListView, ConversationDetailView, ChatHistoryView, SaveChatHistoryView
from .admin_views import AdminChatLogsView, AdminChatDetailView

urlpatterns = [
    path("message/", ChatMessageView.as_view(), name="chat-message"),
    path("history/", ChatHistoryView.as_view(), name="chat-history"),
    path("history/save/", SaveChatHistoryView.as_view(), name="chat-history-save"),
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),
    path("conversations/<int:pk>/", ConversationDetailView.as_view(), name="conversation-detail"),
    # Admin-only chat log access
    path("admin/logs/", AdminChatLogsView.as_view(), name="admin-chat-logs"),
    path("admin/logs/<int:pk>/", AdminChatDetailView.as_view(), name="admin-chat-detail"),
]
