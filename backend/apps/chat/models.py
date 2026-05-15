from django.db import models
from django.conf import settings


class Conversation(models.Model):
    LANGUAGES = [("nl", "Dutch"), ("en", "English"), ("fa", "Persian")]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="conversations"
    )
    language = models.CharField(max_length=5, choices=LANGUAGES, default="nl")
    tax_year = models.PositiveIntegerField(default=2026)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]


class Message(models.Model):
    ROLES = [("user", "User"), ("assistant", "Assistant")]

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=10, choices=ROLES)
    content = models.TextField()
    # Stores the source_ids of retrieved chunks that informed this answer
    retrieved_sources = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
