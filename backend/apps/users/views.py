import requests as http_requests
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import UserSerializer, RegisterSerializer


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
