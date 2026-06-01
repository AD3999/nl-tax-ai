from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailOrUsernameTokenSerializer(TokenObtainPairSerializer):
    """
    Accepts either username or email in the username field.
    Regular registered users have username == email (set by RegisterSerializer).
    Superusers created via createsuperuser have a distinct username (e.g. 'admin').
    This serializer resolves both cases transparently.
    """

    def validate(self, attrs):
        username_value = attrs.get(self.username_field, "")
        if "@" in username_value:
            try:
                user = User.objects.get(email__iexact=username_value)
                attrs[self.username_field] = user.username
            except User.DoesNotExist:
                pass
        return super().validate(attrs)
