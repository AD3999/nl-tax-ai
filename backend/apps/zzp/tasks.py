"""
ZZP Celery tasks — background jobs for the ZZP daily workspace.
"""
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def quarterly_vat_summary_task(user_id: int, year: int, quarter: int):
    """
    Generate a VAT summary for a ZZP user's quarter and store it
    as a notification. Triggered at the end of each quarter.
    """
    from apps.zzp.models import ZZPRevenueEntry, ZZPExpenseEntry
    from django.db.models import Sum
    from decimal import Decimal

    rev_qs = ZZPRevenueEntry.objects.filter(user_id=user_id, year=year, quarter=quarter)
    exp_qs = ZZPExpenseEntry.objects.filter(user_id=user_id, year=year, quarter=quarter)

    vat_out = rev_qs.aggregate(t=Sum("vat_amount"))["t"] or Decimal("0")
    vat_in  = exp_qs.aggregate(t=Sum("vat_amount"))["t"] or Decimal("0")
    payable = vat_out - vat_in

    logger.info(
        "quarterly_vat_summary user=%d year=%d Q%d: out=%.2f in=%.2f payable=%.2f",
        user_id, year, quarter, vat_out, vat_in, payable,
    )
    return {
        "user_id":  user_id,
        "year":     year,
        "quarter":  quarter,
        "vat_out":  float(vat_out),
        "vat_in":   float(vat_in),
        "payable":  float(payable),
    }
