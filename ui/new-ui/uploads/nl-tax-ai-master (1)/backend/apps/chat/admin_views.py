from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.tax.views import IsStaffUser
from .models import Conversation, Message


class AdminChatLogsView(APIView):
    """GET /api/chat/admin/logs/ — all conversations across all users (staff only)."""
    permission_classes = [IsStaffUser]

    def get(self, request):
        qs = Conversation.objects.select_related("user").order_by("-updated_at")

        search = request.query_params.get("search", "").strip()
        lang = request.query_params.get("lang", "").strip()
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(user__email__icontains=search) |
                Q(summary__icontains=search)
            )
        if lang:
            qs = qs.filter(language=lang)

        convs = [_serialize_conv(c) for c in qs[:200]]
        return Response({"conversations": convs, "total": qs.count()})


class AdminChatDetailView(APIView):
    """GET /api/chat/admin/logs/<pk>/ — full conversation with messages (staff only)."""
    permission_classes = [IsStaffUser]

    def get(self, request, pk):
        try:
            conv = Conversation.objects.select_related("user").get(pk=pk)
        except Conversation.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        messages = Message.objects.filter(conversation=conv).order_by("created_at")
        data = _serialize_conv(conv)
        data["messages"] = [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ]
        return Response(data)


def _serialize_conv(c):
    return {
        "id": c.id,
        "user_id": c.user_id,
        "user_email": c.user.email if c.user_id else None,
        "language": c.language,
        "tax_year": c.tax_year,
        "summary": c.summary,
        "message_count": c.message_count,
        "created_at": c.created_at.isoformat(),
        "updated_at": c.updated_at.isoformat(),
    }
