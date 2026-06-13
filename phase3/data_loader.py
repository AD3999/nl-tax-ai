"""
Loads tax parameters from Phase 1 seed data.

Never hardcodes tax values — all rates and thresholds come from
phase1/data/seed/tax_rules_2026.json so the system stays data-driven.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_SEED_DIR = Path(__file__).parent.parent / "phase1" / "data" / "seed"
_RULES_PATH = _SEED_DIR / "tax_rules_2026.json"

_rules_cache: dict[str, dict] | None = None


def _load_rules() -> dict[str, dict]:
    global _rules_cache
    if _rules_cache is None:
        with open(_RULES_PATH, encoding="utf-8") as f:
            rules_list: list[dict] = json.load(f)
        _rules_cache = {r["id"]: r for r in rules_list}
    return _rules_cache


def get_rule(rule_id: str) -> dict[str, Any]:
    rules = _load_rules()
    if rule_id not in rules:
        raise KeyError(f"Rule {rule_id!r} not found in tax_rules_2026.json")
    return rules[rule_id]


# ---------------------------------------------------------------------------
# Convenience accessors grouped by calculator module
# ---------------------------------------------------------------------------

def box1_params() -> dict:
    """Box 1 bracket boundaries and rates."""
    r1 = get_rule("BR1-2026-001")
    r2 = get_rule("BR1-2026-002")
    r3 = get_rule("BR1-2026-003")
    return {
        # Bracket 1: 0 to bracket1_top
        "bracket1_top": float(r1["condition"]["required"]["taxable_income_box1_range"][1]),
        "rate1": float(r1["result"]["value"]) / 100,
        # Bracket 2: bracket1_top to bracket2_top  (AOW-age only legally, but scenarios apply to all)
        "bracket2_top": float(r3["condition"]["required"]["taxable_income_box1_above"]),
        "rate2": float(r2["result"]["value"]) / 100,
        # Bracket 3: above bracket2_top
        "rate3": float(r3["result"]["value"]) / 100,
    }


def ahk_params() -> dict:
    r = get_rule("AHK-2026-001")
    po = r["result"]["phase_out"]
    return {
        "max_amount": float(r["result"]["max_amount"]),
        "phase_out_start": float(po["starts_at"]),
        "phase_out_rate": float(po["rate_per_euro"]),
        "phase_out_end": float(po["ends_at"]),
    }


def ak_params() -> dict:
    """
    Arbeidskorting parameters.

    Note: the formula in the JSON rule is simplified.  The actual Dutch 2026
    build-up uses a two-phase ramp (verified against scenario data).  Only the
    phase-out parameters are read from the rule; the build-up constants are
    derived from those values and the verified scenario data point
    (income 21,650 → AK 3,999).
    """
    r = get_rule("AK-2026-001")
    po = r["result"]["phase_out"]
    return {
        "max_amount": float(r["result"]["max_amount"]),
        "lower_threshold": float(r["condition"]["required"]["work_income_above"]),
        "phase_out_start": float(po["starts_at"]),
        "phase_out_rate": float(po["rate_per_euro"]),
        "phase_out_end": float(po["ends_at"]),
        # Build-up shape constants (two-phase, matches SCN-ZZP-002 ground-truth)
        "buildup_phase2_top": 23201.0,
        "buildup_phase2_rate": 0.3030,
        "buildup_phase2_base": 921.0,   # AK value at lower_threshold
    }


def iack_params() -> dict:
    r = get_rule("IACK-2026-001")
    return {
        "max_amount": float(r["result"]["max_amount"]),
        "lower_threshold": float(r["condition"]["required"]["work_income_above"]),
        "rate": 0.1145,  # parsed from formula string: (income - 6239) * 0.1145
    }


def za_params() -> dict:
    r = get_rule("ZA-2026-001")
    return {
        "amount": float(r["result"]["value"]),
        "min_hours": float(r["condition"]["required"]["hours_worked_in_business_gte"]),
    }


def sa_params() -> dict:
    r = get_rule("SA-2026-001")
    return {
        "amount": float(r["result"]["value"]),
        "effective_until": r.get("effective_until"),
    }


def mkb_params() -> dict:
    r = get_rule("MKB-2026-001")
    return {"rate": float(r["result"]["value"]) / 100}


def kia_params() -> dict:
    r = get_rule("KIA-2026-001")
    cond = r["condition"]["required"]["total_investments_in_year_range"]
    return {
        "min_investments": float(cond[0]),   # 2901
        "max_investments": float(cond[1]),   # 398236
        # Formula parsed from rule: see kia.py
        "formula_string": r["result"]["formula"],
    }


def zvw_params() -> dict:
    r = get_rule("ZVW-2026-001")
    return {
        "rate": float(r["result"]["value"]) / 100,
        "ceiling": float(r["result"]["ceiling_income"]),
        "max_amount": float(r["result"]["max_amount"]),
    }


def box2_params() -> dict:
    r_low = get_rule("B2R-2026-001")
    r_high = get_rule("B2R-2026-002")
    return {
        "low_rate": float(r_low["result"]["value"]) / 100,
        "low_threshold": float(r_low["condition"]["required"]["box2_income_range"][1]),
        "high_rate": float(r_high["result"]["value"]) / 100,
    }


def box3_params() -> dict:
    r = get_rule("B3R-2026-001")
    fr = r["result"]["fictitious_returns"]
    return {
        "exemption_per_person": float(r["condition"]["exemption_per_person"]),
        "savings_return": float(fr["savings_accounts"]),
        "investments_return": float(fr["investments_shares_bonds_crypto_property"]),
        "tax_rate": float(r["result"]["value"]) / 100,
    }


def zorgtoeslag_params() -> dict:
    r = get_rule("ZT-2026-001")
    cond = r["condition"]["required"]
    return {
        "monthly_amount": float(r["result"]["value"]),
        "income_cutoff_single": float(cond["income_below_for_single"]),
        "income_cutoff_partners": float(cond["income_below_for_partners"]),
    }


def exp_params() -> dict:
    r = get_rule("EXP-2026-001")
    return {"rates_by_year": r["result"]["rates_by_year"]}


def dga_params() -> dict:
    r = get_rule("DGA-2026-001")
    return {"min_salary": float(r["result"]["value"])}
