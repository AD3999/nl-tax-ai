import json
import os
import time

from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TaxProfile, TaxRule
from .serializers import TaxProfileSerializer, TaxRuleSerializer


class TaxProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = TaxProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = TaxProfile.objects.get_or_create(
            user=self.request.user,
            defaults={"tax_year": self.request.user.tax_year},
        )
        return profile


class IBFieldsView(APIView):
    """GET /api/tax/ib/fields/?user_type=zzp — returns IB return fields from Phase 1 seed data."""

    permission_classes = [AllowAny]

    _cache: list | None = None

    def get(self, request):
        if IBFieldsView._cache is None:
            path = os.path.join(
                settings.BASE_DIR.parent, "phase1", "data", "seed", "ib_form_mapping.json"
            )
            with open(path, encoding="utf-8") as f:
                IBFieldsView._cache = json.load(f)

        user_type = request.query_params.get("user_type", "").strip()
        fields = IBFieldsView._cache
        if user_type:
            fields = [
                f for f in fields
                if user_type in f.get("user_types", []) or "all" in f.get("user_types", [])
            ]
        return Response(fields)


class Phase2RetrieveView(APIView):
    """
    POST /api/tax/phase2/retrieve/

    Runs the Phase 2 RAG pipeline for a given question and returns the
    retrieved contexts. No authentication required — development endpoint.

    Request body:
        question  (str, required)  — the user's tax question
        user_type (str, optional)  — "zzp" | "employee" | "expat" | "dga"

    Response:
        results    list of RetrievedContext objects
        query_info metadata about the query (timing, filters applied)
    """

    permission_classes = [AllowAny]

    def post(self, request):
        question = (request.data.get("question") or "").strip()
        user_type = request.data.get("user_type") or None

        if not question:
            return Response(
                {"error": "question is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from phase2.retriever import retrieve
            from phase2.store.chroma_store import ChromaStore
        except ImportError as exc:
            return Response(
                {"error": f"Phase 2 modules not available: {exc}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            store = ChromaStore()

            if store.count() == 0:
                return Response(
                    {"error": "ChromaDB index is empty. Run phase2/build_index.py --provider local first."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            t0 = time.monotonic()
            results = retrieve(question=question, user_type=user_type, store=store)
            elapsed_ms = round((time.monotonic() - t0) * 1000)

            return Response({
                "results": [
                    {
                        "chunk_id": ctx.chunk_id,
                        "source_id": ctx.source_id,
                        "doc_type": ctx.doc_type,
                        "topic": ctx.topic,
                        "score": round(ctx.score, 4),
                        "text": ctx.text,
                        "source_url": ctx.source_url,
                        "ai_prompt_hint": ctx.ai_prompt_hint,
                        "expected_ai_behavior": ctx.expected_ai_behavior,
                        "user_types": ctx.user_types,
                        "is_cascade": ctx.is_cascade,
                    }
                    for ctx in results
                ],
                "query_info": {
                    "question": question,
                    "user_type": user_type,
                    "result_count": len(results),
                    "elapsed_ms": elapsed_ms,
                },
            })

        except Exception as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ──────────────────────────────────────────
# Admin-only Tax Rules API
# ──────────────────────────────────────────

class IsStaffUser(permissions.BasePermission):
    """Allow only staff/admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or getattr(request.user, 'is_admin', False)))


class TaxRuleListView(generics.ListCreateAPIView):
    """GET /api/tax/rules/ — list + filter; POST — create new rule (admin only)."""
    serializer_class = TaxRuleSerializer
    permission_classes = [IsStaffUser]

    def get_queryset(self):
        qs = TaxRule.objects.all()
        year = self.request.query_params.get("year")
        status_filter = self.request.query_params.get("status")
        category = self.request.query_params.get("category")
        search = self.request.query_params.get("search", "").strip()
        if year:
            qs = qs.filter(year=year)
        if status_filter:
            qs = qs.filter(verification_status=status_filter)
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(rule_id__icontains=search) | qs.filter(topic__icontains=search) | qs.filter(plain_en__icontains=search)
        return qs.order_by("year", "rule_id")

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user.email)


class TaxRuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/tax/rules/{rule_id}/ (admin only)."""
    serializer_class = TaxRuleSerializer
    permission_classes = [IsStaffUser]
    lookup_field = "rule_id"
    queryset = TaxRule.objects.all()

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user.email)


class TaxRuleImportView(APIView):
    """POST /api/tax/rules/import/ — import rules from Phase 1 JSON seed (admin only)."""
    permission_classes = [IsStaffUser]

    def post(self, request):
        seed_path = os.path.join(
            settings.BASE_DIR.parent, "phase1", "data", "seed", "tax_rules_2026.json"
        )
        if not os.path.exists(seed_path):
            return Response({"error": "Seed file not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            created, updated = TaxRule.import_from_json(seed_path)
            return Response({"created": created, "updated": updated, "total": TaxRule.objects.count()})
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminStatsView(APIView):
    """GET /api/tax/admin/stats/ — dashboard statistics (admin only)."""
    permission_classes = [IsStaffUser]

    def get(self, request):
        from django.db.models import Count
        from apps.users.models import User
        from apps.calculator.models import CalculationResult

        rules_qs = TaxRule.objects.all()
        stats = {
            "total_rules": rules_qs.count(),
            "verified_rules": rules_qs.filter(verification_status="verified").count(),
            "pending_rules": rules_qs.filter(verification_status="pending_review").count(),
            "draft_rules": rules_qs.filter(verification_status="draft").count(),
            "rules_by_year": list(rules_qs.values("year").annotate(count=Count("id")).order_by("year")),
            "rules_by_category": list(rules_qs.values("category").annotate(count=Count("id")).order_by("-count")[:10]),
            "total_users": User.objects.count(),
            "premium_users": User.objects.filter(plan="premium").count(),
            "total_calculations": CalculationResult.objects.count() if hasattr(CalculationResult, 'objects') else 0,
        }
        return Response(stats)
