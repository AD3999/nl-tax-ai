from django.urls import path
from .views import ChatMessageView, ConversationListView, ConversationDetailView

urlpatterns = [
    path("message/", ChatMessageView.as_view(), name="chat-message"),
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),
    path("conversations/<int:pk>/", ConversationDetailView.as_view(), name="conversation-detail"),
]
