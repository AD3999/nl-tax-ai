from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from config.authentication import SoftJWTAuthentication
from .engine import calculate
from .models import CalculationResult
from .serializers import CalculationResultSerializer, CalculatorInputSerializer


class CalculateView(APIView):
    """
    POST /api/calculator/calculate/
    Deterministic Dutch 2026 tax calculator.
    Open to all including anonymous users; results only persisted for authenticated users.
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CalculatorInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        profile = serializer.validated_data
        try:
            result = calculate(profile)
        except ValueError as exc:
            return Response({"user_type": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

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
