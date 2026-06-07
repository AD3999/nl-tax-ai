from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "role", "content", "retrieved_sources", "created_at"]
        read_only_fields = ["id", "role", "retrieved_sources", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "language", "tax_year", "created_at", "updated_at", "messages"]
        read_only_fields = ["id", "created_at", "updated_at"]


class AskSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=2000)
    conversation_id = serializers.IntegerField(required=False, allow_null=True)
    language = serializers.ChoiceField(choices=["nl", "en", "fa"], default="nl")


class ChatMessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000, min_length=1)
    user_profile = serializers.DictField(required=False, allow_null=True, default=None)
    conversation_history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
        max_length=500,
    )
    session_message_count = serializers.IntegerField(required=False, default=0, min_value=0)
    intake_mode = serializers.BooleanField(required=False, default=False)
    language = serializers.ChoiceField(choices=["nl", "en", "fa"], default="nl")
    # Structured alert context when user clicks "Ask AI" on a specific alert
    explain_alert = serializers.DictField(required=False, allow_null=True, default=None)
