from django.urls import path
from .views import AskView, ChatMessageView, ConversationListView, ConversationDetailView, TestClaudeView

urlpatterns = [
    path("message/", ChatMessageView.as_view(), name="chat-message"),
    path("test/", TestClaudeView.as_view(), name="chat-test-claude"),
    path("ask/", AskView.as_view(), name="chat-ask"),
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),
    path("conversations/<int:pk>/", ConversationDetailView.as_view(), name="conversation-detail"),
]
