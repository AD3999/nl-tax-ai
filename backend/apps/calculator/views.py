from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .engine import calculate
from .models import CalculationResult
from .serializers import CalculationResultSerializer, CalculatorInputSerializer


class CalculateView(APIView):
    """
    POST /api/calculator/calculate/
    Deterministic Dutch 2026 tax calculator (Phase 3).
    Open to unauthenticated users for demo/frontend use.
    Results are only persisted to DB when the user is authenticated.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CalculatorInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        profile = serializer.validated_data
        result  = calculate(profile)

        # Persist only for authenticated users
        if request.user and request.user.is_authenticated:
            calc_data = result["calculation"]
            CalculationResult.objects.create(
                user           = request.user,
                tax_year       = int(profile.get("year", 2026)),
                input_snapshot = dict(profile),
                result         = result,
                total_tax_due  = calc_data["total_tax_due"],
                effective_rate = calc_data["effective_rate"],
                monthly_reserve = result["result"]["monthly_reserve_needed"],
            )

        return Response(result, status=status.HTTP_200_OK)


class CalculationHistoryView(generics.ListAPIView):
    serializer_class   = CalculationResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CalculationResult.objects.filter(user=self.request.user)
