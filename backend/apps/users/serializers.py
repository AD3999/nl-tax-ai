from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username", "user_type", "preferred_language", "tax_year"]
        read_only_fields = ["id", "email"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "username", "password", "user_type", "preferred_language"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
