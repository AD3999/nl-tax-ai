"""
Phase 3 — Deterministic Tax Calculator Engine
All constants read from phase1/data/seed/tax_rules_2026.json at import time.
The AI never does arithmetic — it calls this engine and reads the result.
"""
import json
import math
from pathlib import Path

_RULES_FILE = (
    Path(__file__).resolve().parents[3]
    / "phase1" / "data" / "seed" / "tax_rules_2026.json"
)
_rules: dict = {}


def _load() -> dict:
    global _rules
    if not _rules:
        _rules = {r["id"]: r for r in json.loads(_RULES_FILE.read_text(encoding="utf-8"))}
    return _rules


def _rv(rule_id: str, *path):
    """Read a numeric value from a rule's result dict."""
    node = _load()[rule_id]["result"]
    for key in path:
        node = node[key]
    return float(node)


def _eur(x: float) -> int:
    """Round to nearest euro (standard half-up)."""
    return math.floor(x + 0.5)


# ── Individual calculators ──────────────────────────────────────────────────

def calc_box1_tax(taxable: float, aow_age: bool = False) -> dict:
    b1_ceil  = 38883.0
    b3_floor = 78426.0
    b1_rate  = _rv("BR1-2026-001", "value") / 100   # 0.3575
    b2_rate  = 0.3707                                # non-AOW bracket 2 (not in JSON; correct Dutch law)
    b2_aow   = _rv("BR1-2026-002", "value") / 100   # 0.3756 (AOW age only)
    b3_rate  = _rv("BR1-2026-003", "value") / 100   # 0.495

    br1 = min(taxable, b1_ceil) * b1_rate
    br2 = max(0.0, min(taxable, b3_floor) - b1_ceil) * (b2_aow if aow_age else b2_rate)
    br3 = max(0.0, taxable - b3_floor) * b3_rate

    return {
        "bracket1": _eur(br1),
        "bracket2": _eur(br2),
        "bracket3": _eur(br3),
        "raw":      _eur(br1 + br2 + br3),
    }


def calc_ahk(aggregate_income: float) -> int:
    r       = _load()["AHK-2026-001"]["result"]
    max_ahk = float(r["max_amount"])                    # 3115
    start   = float(r["phase_out"]["starts_at"])        # 29736
    rate    = float(r["phase_out"]["rate_per_euro"])    # 0.06398
    end     = float(r["phase_out"]["ends_at"])          # 78426
    if aggregate_income <= start:
        return _eur(max_ahk)
    if aggregate_income >= end:
        return 0
    return max(0, _eur(max_ahk - (aggregate_income - start) * rate))


def calc_arbeidskorting(work_income: float) -> int:
    r         = _load()["AK-2026-001"]["result"]
    max_ak    = float(r["max_amount"])                  # 5685
    phase_lo  = float(r["phase_out"]["starts_at"])      # 45592
    phase_rate = float(r["phase_out"]["rate_per_euro"]) # 0.0651
    build_lo, build_hi, phase_hi = 11490.0, 37697.0, 132920.0

    if work_income <= build_lo:
        return 0
    if work_income <= build_hi:
        return _eur((work_income - build_lo) / (build_hi - build_lo) * max_ak)
    if work_income <= phase_lo:
        return _eur(max_ak)
    if work_income <= phase_hi:
        return max(0, _eur(max_ak - (work_income - phase_lo) * phase_rate))
    return 0


def calc_iack(work_income: float, children_under_12: int) -> int:
    if children_under_12 == 0:
        return 0
    r        = _load()["IACK-2026-001"]
    min_inc  = float(r["condition"]["required"]["work_income_above"])  # 6239
    max_iack = float(r["result"]["max_amount"])                        # 3032
    if work_income <= min_inc:
        return 0
    return min(_eur(max_iack), _eur((work_income - min_inc) * 0.1145))


def calc_kia(investments: float) -> int:
    if investments < 2901:
        return 0
    if investments <= 70602:
        return _eur(investments * 0.28)
    if investments <= 132746:
        return 20072
    if investments <= 398236:
        return max(0, _eur(20072 * (1 - (investments - 132746) / (398236 - 132746))))
    return 0


def calc_zvw(zzp_profit: float) -> int:
    rate    = _rv("ZVW-2026-001", "value") / 100   # 0.0532
    ceiling = _rv("ZVW-2026-001", "ceiling_income") # 71628
    return _eur(min(zzp_profit, ceiling) * rate)


def calc_box3(net_assets: float, has_partner: bool, savings_fraction: float = 0.0) -> int:
    r          = _load()["B3R-2026-001"]
    exemption  = float(r["condition"]["exemption_per_person"])  # 59357
    above      = max(0.0, net_assets - exemption * (2 if has_partner else 1))
    if above == 0:
        return 0
    s_rate  = float(r["result"]["fictitious_returns"]["savings_accounts"])                          # 0.0128
    i_rate  = float(r["result"]["fictitious_returns"]["investments_shares_bonds_crypto_property"])  # 0.06
    tax_rate = _rv("B3R-2026-001", "value") / 100  # 0.36
    blended  = savings_fraction * s_rate + (1 - savings_fraction) * i_rate
    return _eur(above * blended * tax_rate)


def calc_box2(dividend: float) -> int:
    low_ceil  = float(_load()["B2R-2026-001"]["condition"]["required"]["box2_income_range"][1])  # 68843
    low_rate  = _rv("B2R-2026-001", "value") / 100  # 0.245
    high_rate = _rv("B2R-2026-002", "value") / 100  # 0.31
    return _eur(min(dividend, low_ceil) * low_rate + max(0.0, dividend - low_ceil) * high_rate)


def calc_wet_dba(single_client_pct) -> str:
    if single_client_pct is None:
        return "n/a"
    pct = float(single_client_pct)
    if pct >= 70:
        return "high"
    if pct >= 50:
        return "medium"
    return "low"


# ── Main entry point ────────────────────────────────────────────────────────

def calculate(profile: dict) -> dict:
    """
    Run the full Dutch 2026 income tax calculation for a user profile.
    Returns a dict with 'calculation' (all intermediate steps) and 'result' (summary).
    """
    user_type = str(profile.get("user_type", "zzp"))
    aow_age   = bool(profile.get("aow_age", False))

    # ── 1. Gross income ─────────────────────────────────────────────
    if user_type == "zzp":
        gross_revenue = float(profile.get("annual_revenue_zzp") or 0)
        expenses      = float(profile.get("business_expenses") or 0)
    else:
        gross_revenue = float(profile.get("employment_income") or 0)
        expenses      = 0.0

    gross_profit = gross_revenue - expenses

    # 30% ruling (expat employees)
    if profile.get("uses_30pct_ruling"):
        ruling_year  = int(profile.get("ruling_year") or 1)
        exempt_pct   = 0.30 if ruling_year <= 3 else (0.20 if ruling_year == 4 else 0.10)
        gross_profit = gross_revenue * (1 - exempt_pct)

    # ── 2. ZZP deductions ───────────────────────────────────────────
    hours      = int(profile.get("hours_per_year") or 0)
    is_starter = bool(profile.get("is_starter", False))
    kia_invest = float(profile.get("kia_investments") or 0)
    pension    = float(profile.get("pension_contribution") or 0)

    meets_uren = (user_type == "zzp" and hours >= 1225)
    za  = _rv("ZA-2026-001", "value")  if meets_uren                    else 0.0  # 1200
    sa  = _rv("SA-2026-001", "value")  if (meets_uren and is_starter)   else 0.0  # 2123
    kia = float(calc_kia(kia_invest))  if user_type == "zzp"            else 0.0

    ondernemers     = za + sa + kia
    profit_after_oa = gross_profit - ondernemers

    mkb = _eur(profit_after_oa * (_rv("MKB-2026-001", "value") / 100)) if user_type == "zzp" else 0

    # ZVW uses profit before pension; taxable Box 1 deducts pension
    zvw_base     = profit_after_oa - mkb
    taxable_box1 = zvw_base - pension

    # ── 3. Box 1 tax ────────────────────────────────────────────────
    b1 = calc_box1_tax(max(0.0, taxable_box1), aow_age)

    # ── 4. Tax credits ──────────────────────────────────────────────
    ahk  = calc_ahk(taxable_box1)
    ak   = calc_arbeidskorting(taxable_box1)
    iack = calc_iack(taxable_box1, int(profile.get("children_under_12") or 0))

    income_tax = max(0, b1["raw"] - ahk - ak - iack)

    # ── 5. ZVW ──────────────────────────────────────────────────────
    zvw = calc_zvw(zvw_base) if user_type == "zzp" else 0

    # ── 6. Box 2 ────────────────────────────────────────────────────
    box2_dividend = float(profile.get("box2_dividend") or 0)
    box2_tax      = calc_box2(box2_dividend) if box2_dividend > 0 else 0

    # ── 7. Box 3 ────────────────────────────────────────────────────
    net_assets   = float(profile.get("net_assets_box3") or 0)
    has_partner  = bool(profile.get("has_partner", False))
    savings_frac = float(profile.get("savings_fraction") or 0.0)
    box3_tax     = calc_box3(net_assets, has_partner, savings_frac)

    # ── 8. Totals ───────────────────────────────────────────────────
    total_tax   = income_tax + zvw + box2_tax + box3_tax
    eff_rate    = round(total_tax / max(gross_profit, 1), 3)
    monthly_res = _eur(total_tax / 12) if user_type == "zzp" else 0
    dba_risk    = calc_wet_dba(profile.get("single_client_percentage"))

    return {
        "calculation": {
            "gross_revenue":            _eur(gross_revenue),
            "business_expenses":        _eur(expenses),
            "gross_profit":             _eur(gross_profit),
            "zelfstandigenaftrek":      _eur(za),
            "startersaftrek":           _eur(sa),
            "kia_deduction":            _eur(kia),
            "pension_deduction":        _eur(pension),
            "ondernemersaftrek_total":  _eur(ondernemers),
            "profit_after_ondernemers": _eur(profit_after_oa),
            "mkb_winstvrijstelling":    mkb,
            "taxable_income_box1":      _eur(taxable_box1),
            "box1_tax_bracket1":        b1["bracket1"],
            "box1_tax_bracket2":        b1["bracket2"],
            "box1_tax_bracket3":        b1["bracket3"],
            "box1_tax_raw":             b1["raw"],
            "algemene_heffingskorting": ahk,
            "arbeidskorting":           ak,
            "iack":                     iack,
            "income_tax_after_credits": income_tax,
            "zvw_contribution":         zvw,
            "box2_tax":                 box2_tax,
            "box3_tax":                 box3_tax,
            "total_tax_due":            total_tax,
            "effective_rate":           eff_rate,
        },
        "result": {
            "total_tax_due":          total_tax,
            "effective_rate":         eff_rate,
            "monthly_reserve_needed": monthly_res,
            "wet_dba_risk":           dba_risk,
        },
    }
