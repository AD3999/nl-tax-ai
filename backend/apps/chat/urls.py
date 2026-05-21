from django.urls import path
from .views import AskView, ChatMessageView, ConversationListView, ConversationDetailView

urlpatterns = [
    path("message/", ChatMessageView.as_view(), name="chat-message"),
    path("ask/", AskView.as_view(), name="chat-ask"),
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),
    path("conversations/<int:pk>/", ConversationDetailView.as_view(), name="conversation-detail"),
]
