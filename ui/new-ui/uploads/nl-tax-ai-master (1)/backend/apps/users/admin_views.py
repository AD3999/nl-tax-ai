from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.tax.views import IsStaffUser

User = get_user_model()


class AdminUserListView(APIView):
    """GET /api/users/admin/list/ — all users with search + filter (staff only)."""
    permission_classes = [IsStaffUser]

    def get(self, request):
        qs = User.objects.all().order_by("-date_joined")

        search = request.query_params.get("search", "").strip()
        plan = request.query_params.get("plan", "").strip()
        user_type = request.query_params.get("user_type", "").strip()
        is_active = request.query_params.get("is_active", "").strip()

        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(email__icontains=search) |
                Q(username__icontains=search)
            )
        if plan:
            qs = qs.filter(plan=plan)
        if user_type:
            qs = qs.filter(user_type=user_type)
        if is_active in ("true", "false"):
            qs = qs.filter(is_active=(is_active == "true"))

        users = [_serialize_user(u) for u in qs[:200]]
        return Response({"users": users, "total": qs.count()})


class AdminUserDetailView(APIView):
    """GET/PATCH /api/users/admin/<id>/ — view or update a single user (staff only)."""
    permission_classes = [IsStaffUser]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(_serialize_user(user, full=True))

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        allowed = ["plan", "user_type", "preferred_language", "is_active", "is_staff", "tax_year"]
        for field in allowed:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()
        return Response(_serialize_user(user, full=True))


def _serialize_user(u, full=False):
    data = {
        "id": u.id,
        "email": u.email,
        "username": u.username,
        "user_type": u.user_type,
        "plan": u.plan,
        "preferred_language": u.preferred_language,
        "tax_year": u.tax_year,
        "is_active": u.is_active,
        "is_staff": u.is_staff,
        "is_superuser": u.is_superuser,
        "date_joined": u.date_joined.isoformat(),
        "last_login": u.last_login.isoformat() if u.last_login else None,
        "daily_message_count": u.daily_message_count,
    }
    if full:
        data["intake_profile"] = u.intake_profile
        data["tax_memory"] = u.tax_memory
    return data
