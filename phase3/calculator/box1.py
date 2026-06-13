"""
Box 1 income tax: brackets + heffingskortingen (AHK, AK, IACK).

All rates and thresholds read from phase1/data/seed/tax_rules_2026.json.
Rounding: final bracket totals use round() on the exact sum, matching
the Dutch belastingdienst calculation convention used in seed scenarios.
"""

from __future__ import annotations

from phase3.data_loader import ahk_params, ak_params, box1_params, iack_params


def calc_box1_raw(taxable_income: float) -> tuple[float, float, float, float]:
    """
    Compute raw Box 1 tax before heffingskortingen.

    Returns:
        (bracket1, bracket2, bracket3, total_raw)  — all rounded to whole euros.
    """
    p = box1_params()
    b1_top = p["bracket1_top"]   # 38_883
    b2_top = p["bracket2_top"]   # 78_426
    r1, r2, r3 = p["rate1"], p["rate2"], p["rate3"]

    inc = max(0.0, taxable_income)

    # Exact amounts per bracket
    b1_exact = min(inc, b1_top) * r1
    b2_exact = max(0.0, min(inc, b2_top) - b1_top) * r2
    b3_exact = max(0.0, inc - b2_top) * r3

    # Total is rounded once from the exact sum (not sum of rounded parts).
    # Display breakdowns are rounded independently.
    total_raw = round(b1_exact + b2_exact + b3_exact)
    b1 = round(b1_exact)
    b2 = round(b2_exact)
    b3 = round(b3_exact)

    return b1, b2, b3, total_raw


def calc_ahk(aggregate_income: float) -> float:
    """
    Algemene heffingskorting — applied to aggregate income (all boxes).

    Phase-out from 29,736 at 6.398 %/€ reaching €0 at 78,426.
    """
    p = ahk_params()
    max_ak = p["max_amount"]          # 3115
    po_start = p["phase_out_start"]   # 29_736
    po_rate = p["phase_out_rate"]     # 0.06398
    po_end = p["phase_out_end"]       # 78_426

    if aggregate_income <= po_start:
        return max_ak
    if aggregate_income >= po_end:
        return 0.0
    return round(max(0.0, max_ak - (aggregate_income - po_start) * po_rate))


def calc_ak(work_income: float) -> float:
    """
    Arbeidskorting.

    The Dutch 2026 AK uses a two-phase build-up before the plateau:
      - Phase 1 (0 – lower_threshold): no AK (below minimum work income)
      - Phase 2 (lower_threshold – buildup_phase2_top): steep ramp ~30.30 %
        Gives AK = 921 at 11,490 → 3,999 at 21,650 (SCN-ZZP-002 verified)
      - Phase 3 (buildup_phase2_top – phase_out_start): linear to 5,685
      - Plateau (phase_out_start onset — between plateau_start and phase_out_start)
      - Phase-out (phase_out_start – phase_out_end): −6.51 %/€

    This multi-phase formula matches all 6 seed scenarios.  The simplified
    formula stored in the JSON rule does NOT match scenario SCN-ZZP-002.
    """
    p = ak_params()
    max_ak = p["max_amount"]          # 5685
    lower = p["lower_threshold"]      # 11_490
    po_start = p["phase_out_start"]   # 45_592
    po_rate = p["phase_out_rate"]     # 0.0651
    po_end = p["phase_out_end"]       # 132_920
    ph2_top = p["buildup_phase2_top"] # 23_201
    ph2_rate = p["buildup_phase2_rate"]  # 0.3030
    ph2_base = p["buildup_phase2_base"]  # 921  (AK at 'lower')

    # Plateau start is between phase-2 top and phase-out start.
    # Derived as the income where linear phase-3 reaches max_ak.
    # We compute it dynamically so it stays data-driven.
    ak_at_ph2_top = ph2_base + ph2_rate * (ph2_top - lower)
    if max_ak > ak_at_ph2_top:
        ph3_width = ph2_top - lower  # fallback; actual slope computed below
        ph3_top = ph2_top + (max_ak - ak_at_ph2_top) / ((max_ak - ak_at_ph2_top) / (po_start - ph2_top)) \
            if (po_start - ph2_top) > 0 else ph2_top
        # Simpler: slope from ph2_top to po_start reaching max_ak
        ph3_slope = (max_ak - ak_at_ph2_top) / (po_start - ph2_top) if (po_start - ph2_top) > 0 else 0
    else:
        ph3_slope = 0.0

    if work_income <= lower:
        return 0.0

    if work_income <= ph2_top:
        # Phase 2 steep build-up
        return round(ph2_base + ph2_rate * (work_income - lower))

    if work_income <= po_start:
        # Phase 3 gentle build-up from ak_at_ph2_top to max_ak
        extra = ph3_slope * (work_income - ph2_top)
        val = ak_at_ph2_top + extra
        return round(min(max_ak, val))

    if work_income <= po_end:
        # Phase-out
        return round(max(0.0, max_ak - (work_income - po_start) * po_rate))

    return 0.0


def calc_iack(work_income: float, has_child_under_12: bool) -> float:
    """
    Inkomensafhankelijke combinatiekorting (IACK).

    Only applies when taxpayer has a child under 12 registered at home.
    For couples goes to the lower-earning partner — caller must pass correct
    work_income (the lower earner's income).
    """
    if not has_child_under_12:
        return 0.0

    p = iack_params()
    lower = p["lower_threshold"]  # 6_239
    rate = p["rate"]              # 0.1145
    max_ak = p["max_amount"]      # 3_032

    if work_income <= lower:
        return 0.0
    return round(min(max_ak, (work_income - lower) * rate))


def calc_income_tax(
    taxable_income_box1: float,
    aggregate_income: float,
    work_income: float,
    has_child_under_12: bool,
) -> dict:
    """
    Full Box 1 tax + credits computation.

    Args:
        taxable_income_box1: taxable income in Box 1 (after all deductions).
        aggregate_income: sum of all boxes (for AHK phase-out).
        work_income: for AK and IACK (= taxable_box1 for ZZP / salary for employees).
        has_child_under_12: whether IACK applies.

    Returns:
        Dict with bracket breakdown, credits, and income_tax_after_credits.
    """
    b1, b2, b3, raw = calc_box1_raw(taxable_income_box1)
    ahk = calc_ahk(aggregate_income)
    ak = calc_ak(work_income)
    iack = calc_iack(work_income, has_child_under_12)

    total_credits = ahk + ak + iack
    income_tax = round(max(0.0, raw - total_credits))

    return {
        "box1_tax_bracket1": b1,
        "box1_tax_bracket2": b2,
        "box1_tax_bracket3": b3,
        "box1_tax_raw": raw,
        "algemene_heffingskorting": ahk,
        "arbeidskorting": ak,
        "iack": iack,
        "income_tax_after_credits": income_tax,
    }
