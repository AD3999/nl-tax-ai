from rest_framework import serializers
from .models import User, AccountantProfile


class AccountantProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountantProfile
        fields = ["firm_name", "kvk_number", "designation", "phone", "client_limit", "is_verified"]
        read_only_fields = ["client_limit", "is_verified"]


class UserSerializer(serializers.ModelSerializer):
    is_admin           = serializers.SerializerMethodField()
    accountant_profile = AccountantProfileSerializer(read_only=True)
    has_accountant     = serializers.SerializerMethodField()

    def get_is_admin(self, obj):
        return obj.is_staff or obj.is_superuser

    def get_has_accountant(self, obj):
        from apps.portal.models import AccountantClientProfile
        # AccountantClientProfile is the canonical source of truth for portal access.
        # Self-managed profiles (accountant_user == client_user) are created automatically
        # for every user who visits the portal and must never count.
        # The legacy AccountantClient model is intentionally NOT checked here: it could
        # stay active if _deactivate_client_link fails (AccountantProfile lookup), causing
        # has_accountant to stay True after an accountant disconnects.
        return AccountantClientProfile.objects.filter(
            client_user=obj,
        ).exclude(
            accountant_user=obj,           # exclude self-managed
        ).exclude(
            status__in=["deactivated", "archived"],
        ).exists()

    class Meta:
        model = User
        fields = [
            "id", "email", "username", "user_type", "role", "preferred_language",
            "tax_year", "plan", "daily_message_count", "daily_message_date", "is_admin",
            "intake_profile", "ib_guide_answers", "simulation_state",
            "accountant_profile", "has_accountant",
        ]
        read_only_fields = ["id", "email", "plan", "daily_message_count", "daily_message_date", "is_admin", "role"]


class RegisterSerializer(serializers.ModelSerializer):
    password   = serializers.CharField(write_only=True, min_length=8)
    # Accountant-only optional fields
    firm_name  = serializers.CharField(write_only=True, required=False, allow_blank=True)
    kvk_number = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["email", "username", "password", "role", "preferred_language",
                  "firm_name", "kvk_number"]

    def validate_role(self, value):
        if value not in ("client", "accountant"):
            raise serializers.ValidationError(
                "Accountant registration requires admin approval. "
                "Please use the accountant request-access form."
            )
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return value

    def create(self, validated_data):
        validated_data.pop("firm_name", "")
        validated_data.pop("kvk_number", "")
        validated_data["user_type"] = "zzp"

        validated_data.setdefault("username", validated_data["email"])
        user = User.objects.create_user(**validated_data)

        return user
