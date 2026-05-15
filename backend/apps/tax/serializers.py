from rest_framework import serializers
from .models import TaxProfile


class TaxProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxProfile
        exclude = ["user"]
        read_only_fields = ["updated_at"]
