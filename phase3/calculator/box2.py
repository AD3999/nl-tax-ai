"""Box 2 dividend / AB income tax."""

from __future__ import annotations

from phase3.data_loader import box2_params


def calc_box2_tax(dividend_income: float) -> float:
    """
    24.5 % on first €68,843; 31 % on remainder.
    Each tax partner benefits independently from the low bracket.
    """
    if dividend_income <= 0:
        return 0.0

    p = box2_params()
    low_rate = p["low_rate"]        # 0.245
    threshold = p["low_threshold"]  # 68_843
    high_rate = p["high_rate"]      # 0.310

    low_part = min(dividend_income, threshold)
    high_part = max(0.0, dividend_income - threshold)

    return round(low_part * low_rate + high_part * high_rate)
