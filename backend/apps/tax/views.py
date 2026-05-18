import time

from rest_framework import generics, permissions, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TaxProfile
from .serializers import TaxProfileSerializer


class TaxProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = TaxProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = TaxProfile.objects.get_or_create(
            user=self.request.user,
            defaults={"tax_year": self.request.user.tax_year},
        )
        return profile


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
