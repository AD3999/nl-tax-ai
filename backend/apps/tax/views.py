from rest_framework import generics, permissions
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
