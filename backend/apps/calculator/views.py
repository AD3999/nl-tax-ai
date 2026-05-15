from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CalculationResult
from .serializers import CalculationResultSerializer


class CalculateView(APIView):
    """
    POST /api/calculator/calculate/
    Runs the deterministic tax calculator (Phase 3) against the user's TaxProfile.
    Returns the full breakdown immediately — no async needed (pure arithmetic).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Phase 3 will implement the full calculator here.
        return Response(
            {"detail": "Tax calculator not yet implemented (Phase 3)."},
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )


class CalculationHistoryView(generics.ListAPIView):
    serializer_class = CalculationResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CalculationResult.objects.filter(user=self.request.user)
