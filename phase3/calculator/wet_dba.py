"""
Wet DBA risk scoring.

Returns: "low" | "medium" | "high" with reasons.
Active enforcement since January 2025.
"""

from __future__ import annotations

from typing import Optional


def score_wet_dba(
    single_client_percentage: Optional[float],
    user_type: str,
) -> tuple[str, list[str]]:
    """
    Classify Wet DBA risk based on client concentration.

    Thresholds from WD-2026-001:
      < 50% single client  → low
      50–65%               → medium
      > 65%                → high
    """
    if user_type != "zzp" or single_client_percentage is None:
        return "n/a", []

    reasons: list[str] = []
    pct = single_client_percentage

    if pct >= 65:
        risk = "high"
        reasons.append(
            f"{pct:.0f}% revenue from a single client — active enforcement threshold; "
            "consult a tax advisor immediately"
        )
    elif pct >= 50:
        risk = "medium"
        reasons.append(
            f"{pct:.0f}% revenue from a single client — monitor carefully; "
            "diversify client base or obtain model contract (modelovereenkomst)"
        )
    else:
        risk = "low"
        reasons.append(f"{pct:.0f}% single-client concentration is below risk threshold")

    return risk, reasons
