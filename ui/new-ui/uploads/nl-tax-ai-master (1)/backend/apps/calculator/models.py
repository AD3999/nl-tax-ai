from django.db import models
from django.conf import settings


class CalculationResult(models.Model):
    """
    Stores the output of Phase 3 deterministic tax calculator runs.
    Immutable once created — recalculating creates a new row.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="calculations"
    )
    tax_year = models.PositiveIntegerField(default=2026)
    input_snapshot = models.JSONField()   # Copy of TaxProfile values at calc time
    result = models.JSONField()           # Full calculator output (all intermediate steps)
    total_tax_due = models.DecimalField(max_digits=10, decimal_places=2)
    effective_rate = models.DecimalField(max_digits=5, decimal_places=4)
    monthly_reserve = models.DecimalField(max_digits=8, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
