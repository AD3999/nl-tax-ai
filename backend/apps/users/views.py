import requests as http_requests
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from config.authentication import SoftJWTAuthentication
from .models import User
from .serializers import UserSerializer, RegisterSerializer
from .alerts import generate_alerts


class HealthView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"status": "ok"})


class AlertsView(APIView):
    """
    GET /api/users/alerts/?lang=en
    Returns proactive tax alerts derived from the user's intake profile.
    Works for authenticated users (reads from DB profile) and anonymous
    users if they POST a profile in the request body.
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        lang = request.query_params.get("lang", "en")
        profile = None
        calc_result = {}

        if request.user.is_authenticated and request.user.intake_profile:
            profile = request.user.intake_profile
            # Run calculator silently
            try:
                from apps.calculator.engine import calculate
                calc_result = calculate(profile)
            except Exception:
                pass

        if not profile:
            return Response([])

        alerts = generate_alerts(profile, calc_result, lang)
        return Response(alerts)

    def post(self, request):
        """Accept profile in body for anonymous preview."""
        lang = request.data.get("lang", "en")
        profile = request.data.get("profile") or {}
        calc_result = {}
        if profile:
            try:
                from apps.calculator.engine import calculate
                calc_result = calculate(profile)
            except Exception:
                pass
        return Response(generate_alerts(profile, calc_result, lang))


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        access_token = request.data.get("access_token")
        user_type = request.data.get("user_type", "zzp")

        if not access_token:
            return Response({"error": "No access token provided"}, status=400)

        # Verify token and fetch user info from Google
        resp = http_requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        if resp.status_code != 200:
            return Response({"error": "Invalid Google token"}, status=400)

        info = resp.json()
        email = info.get("email")
        if not email:
            return Response({"error": "Google account has no email"}, status=400)

        # Get or create user
        try:
            user = User.objects.get(email__iexact=email)
            created = False
        except User.DoesNotExist:
            user = User.objects.create_user(
                email=email,
                username=email,
                password=None,
                user_type=user_type,
            )
            created = True

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "is_new": created,
        })
