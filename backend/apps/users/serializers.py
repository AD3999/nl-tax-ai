from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    is_admin = serializers.SerializerMethodField()

    def get_is_admin(self, obj):
        return obj.is_staff or obj.is_superuser

    class Meta:
        model = User
        fields = [
            "id", "email", "username", "user_type", "preferred_language",
            "tax_year", "plan", "daily_message_count", "daily_message_date", "is_admin",
            "intake_profile",
        ]
        read_only_fields = ["id", "email", "plan", "daily_message_count", "daily_message_date", "is_admin"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "username", "password", "user_type", "preferred_language"]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return value

    def create(self, validated_data):
        # username is set to email by the frontend — normalise it
        validated_data.setdefault("username", validated_data["email"])
        return User.objects.create_user(**validated_data)
