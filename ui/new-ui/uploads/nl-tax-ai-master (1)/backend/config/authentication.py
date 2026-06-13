from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken


class SoftJWTAuthentication(JWTAuthentication):
    """JWT auth that treats an invalid/expired token as anonymous.

    DRF raises AuthenticationFailed (→ 401) when a Bearer token is present but
    invalid, even on AllowAny views. This catches that and returns None so
    AllowAny views serve anonymous users whose client has a stale token.
    """

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except InvalidToken:
            return None
