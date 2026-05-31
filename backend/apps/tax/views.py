import json
import os
import time
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from config.authentication import SoftJWTAuthentication
from .models import TaxProfile, TaxRule
from .serializers import TaxProfileSerializer, TaxRuleSerializer


class IsStaffUser(permissions.BasePermission):
    """Allow only staff/admin users."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and (request.user.is_staff or getattr(request.user, "is_admin", False))
        )


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

    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.AllowAny]

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
    POST /api/tax/phase2/retrieve/ — staff-only RAG inspection endpoint.
    """

    permission_classes = [IsStaffUser]

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


class RecentRuleChangesView(APIView):
    """
    GET /api/tax/rules/changes/?user_type=zzp&days=30
    Returns verified tax rules that were updated in the last N days.
    Used by the dashboard "Recent Rule Changes" section.
    Public endpoint — anyone can see recently changed rules.
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        days = min(int(request.query_params.get("days", 30)), 90)
        user_type = request.query_params.get("user_type", "")
        since = timezone.now() - timedelta(days=days)

        qs = TaxRule.objects.filter(
            verification_status="verified",
            updated_at__gte=since,
            year=2026,
        ).order_by("-updated_at")

        if user_type:
            # Filter rules that apply to this user type or to all users
            matching_ids = [
                r.pk for r in qs
                if not r.user_types or user_type in r.user_types
            ]
            qs = qs.filter(pk__in=matching_ids)

        results = [
            {
                "rule_id": r.rule_id,
                "topic": r.topic,
                "category": r.category,
                "plain_en": r.plain_en[:200] + ("…" if len(r.plain_en) > 200 else ""),
                "plain_nl": r.plain_nl[:200] + ("…" if len(r.plain_nl) > 200 else ""),
                "plain_fa": r.plain_fa[:200] + ("…" if len(r.plain_fa) > 200 else ""),
                "source_url": r.source_url,
                "updated_at": r.updated_at.date().isoformat(),
                "updated_by": r.updated_by or "admin",
                "user_types": r.user_types,
            }
            for r in qs[:10]
        ]
        return Response(results)


class AdminRuleImpactView(APIView):
    """
    GET /api/tax/rules/<rule_id>/impact/
    Returns impact analysis for a specific rule: how many users are affected,
    broken down by user type. Staff only.

    This powers the Rule Change Alert System — when an admin updates a rule,
    they can see immediately which users will be affected.
    """
    permission_classes = [IsStaffUser]

    def get(self, request, rule_id: str):
        try:
            rule = TaxRule.objects.get(rule_id=rule_id)
        except TaxRule.DoesNotExist:
            return Response({"error": "Rule not found"}, status=status.HTTP_404_NOT_FOUND)

        from apps.users.models import User
        affected_user_types = rule.user_types or []
        total_users = User.objects.filter(intake_profile__isnull=False).count()

        # Count users whose intake_profile user_type matches this rule
        if affected_user_types:
            affected_count = 0
            for ut in affected_user_types:
                affected_count += User.objects.filter(
                    intake_profile__user_type=ut
                ).count()
        else:
            affected_count = total_users  # rule affects all users

        return Response({
            "rule_id": rule.rule_id,
            "topic": rule.topic,
            "affected_user_types": affected_user_types or ["all"],
            "affected_users_estimate": affected_count,
            "total_users_with_profile": total_users,
            "last_updated": rule.updated_at.date().isoformat(),
            "updated_by": rule.updated_by or "unknown",
            "verification_status": rule.verification_status,
            "recommended_action": (
                "Notify affected users via rule_change alert"
                if rule.verification_status == "verified"
                else "Rule must be verified before notifying users"
            ),
        })


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
