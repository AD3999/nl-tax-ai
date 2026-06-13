"""
Toeslagen eligibility: zorgtoeslag and huurtoeslag.

Uses hard-cutoff logic from the Phase 1 seed rules.
"""

from __future__ import annotations

from typing import Optional

from phase3.data_loader import get_rule, zorgtoeslag_params


def check_zorgtoeslag(
    aggregate_income: float,
    has_partner: bool,
    net_assets: float = 0.0,
) -> tuple[bool, float]:
    """
    Returns (eligible, annual_value).

    Hard cutoff: €1 over income threshold → €0.
    Asset limits from ZT-2026-001 condition block.
    """
    p = zorgtoeslag_params()
    income_limit = p["income_cutoff_partners"] if has_partner else p["income_cutoff_single"]
    monthly = p["monthly_amount"]   # 129

    r = get_rule("ZT-2026-001")
    asset_limit = (
        float(r["condition"]["required"]["net_assets_below_partners"]) if has_partner
        else float(r["condition"]["required"]["net_assets_below_single"])
    )

    if aggregate_income > income_limit:
        return False, 0.0
    if net_assets > asset_limit:
        return False, 0.0

    annual = monthly * 12
    return True, annual


def check_huurtoeslag(
    aggregate_income: float,
    rent_per_month: Optional[float],
    has_partner: bool,
) -> tuple[bool, float]:
    """
    2026 reform: rent ceiling abolished — any rent qualifies.

    Income-tested; exact amounts depend on household size and income.
    We return a flag + a conservative estimate based on the income level.
    The calculator returns toeslagen_value as an estimate only.
    """
    r = get_rule("HT-2026-001")
    if rent_per_month is None or rent_per_month <= 0:
        return False, 0.0

    # Basic income test from rule conditions (thresholds in rule)
    cond = r.get("condition", {}).get("required", {})
    income_limit_single = float(cond.get("income_below_for_single", 40000))
    income_limit_partners = float(cond.get("income_below_for_partners", 55000))

    income_limit = income_limit_partners if has_partner else income_limit_single
    if aggregate_income > income_limit:
        return False, 0.0

    # Rough estimate — actual amount depends on toeslagendiensttabel
    # (out of scope for deterministic calculator without the full table)
    annual_estimate = min(rent_per_month * 12 * 0.30, 3600)  # conservative 30% subsidy cap
    return True, round(annual_estimate)
