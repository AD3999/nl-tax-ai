"""
Phase 3 accuracy tests: validates all 6 seed scenarios with < 1 % error.

Run:
    python -m phase3.test_scenarios
or:
    cd nl-tax-ai && python phase3/test_scenarios.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Allow running directly from nl-tax-ai root
sys.path.insert(0, str(Path(__file__).parent.parent))

from phase3.calculator.full_calculation import calculate
from phase3.tax_types import TaxProfile

SCENARIOS_PATH = Path(__file__).parent.parent / "phase1" / "data" / "seed" / "scenarios.json"
TOLERANCE = 0.01  # 1 %


def _load_scenarios() -> list[dict]:
    with open(SCENARIOS_PATH, encoding="utf-8") as f:
        return json.load(f)


def _profile_from_scenario(scn: dict) -> TaxProfile:
    p = scn["profile"]
    return TaxProfile(
        user_type=p["user_type"],
        year=scn["year"],
        # ZZP income
        annual_revenue_zzp=float(p.get("annual_revenue_zzp") or 0),
        business_expenses=float(p.get("business_expenses") or 0),
        # Employee / expat / DGA salary
        employment_income=float(p.get("employment_income") or 0),
        # ZZP specifics
        hours_per_year=int(p.get("hours_per_year") or 0),
        years_as_entrepreneur=int(p.get("years_as_entrepreneur") or 0),
        is_starter=bool(p.get("is_starter", False)),
        kia_investments=float(p.get("kia_investments") or 0),
        pension_contribution=float(p.get("pension_contribution") or 0),
        single_client_percentage=p.get("single_client_percentage"),
        # Expat
        uses_30pct_ruling=bool(p.get("uses_30pct_ruling", False)),
        ruling_year=2,  # SCN-EXP-001 is year 2 (30% rate applies)
        # DGA
        has_company_bv=bool(p.get("has_company_bv", False)),
        box2_dividend=float(p.get("box2_dividend") or 0),
        # Household
        has_partner=bool(p.get("has_partner", False)),
        partner_income=float(p.get("partner_income") or 0),
        children=int(p.get("children") or 0),
        children_under_12=int(p.get("children_under_12") or 0),
        rent_per_month=p.get("rent_per_month"),
        # Box 3
        net_assets_box3=float(p.get("net_assets_box3") or 0),
    )


def _pct_error(actual: float, expected: float) -> float:
    if expected == 0:
        return 0.0 if actual == 0 else float("inf")
    return abs(actual - expected) / abs(expected)


def run_tests() -> bool:
    scenarios = _load_scenarios()
    all_pass = True

    print(f"{'ID':<16} {'Expected':>10} {'Actual':>10} {'Error':>8}  Status")
    print("-" * 60)

    for scn in scenarios:
        sid = scn["id"]
        expected_total = float(scn["calculation"]["total_tax_due"])
        expected_rate = float(scn["calculation"]["effective_rate"])

        profile = _profile_from_scenario(scn)
        result = calculate(profile)

        err_total = _pct_error(result.total_tax_due, expected_total)
        err_rate = _pct_error(result.effective_rate, expected_rate)

        passed = err_total <= TOLERANCE
        status = "PASS" if passed else "FAIL"
        if not passed:
            all_pass = False

        print(
            f"{sid:<16} {expected_total:>10,.0f} {result.total_tax_due:>10,.0f} "
            f"{err_total:>7.1%}  {status}"
        )

        if not passed or "--verbose" in sys.argv:
            c = result.calculation
            exp_c = scn["calculation"]
            print(f"  taxable_box1:  expected={exp_c['taxable_income_box1']:,}  "
                  f"got={c.taxable_income_box1:,}")
            print(f"  box1_raw:      expected={exp_c['box1_tax_raw']:,}  got={c.box1_tax_raw:,}")
            print(f"  ahk:           expected={exp_c['algemene_heffingskorting']:,}  "
                  f"got={c.algemene_heffingskorting:,}")
            print(f"  ak:            expected={exp_c['arbeidskorting']:,}  "
                  f"got={c.arbeidskorting:,}")
            print(f"  iack:          expected={exp_c['iack']:,}  got={c.iack:,}")
            print(f"  income_tax:    expected={exp_c['income_tax_after_credits']:,}  "
                  f"got={c.income_tax_after_credits:,}")
            print(f"  zvw:           expected={exp_c['zvw_contribution']:,}  "
                  f"got={c.zvw_contribution:,}")
            print(f"  box2_tax:      expected={exp_c['box2_tax']:,}  got={c.box2_tax:,}")
            print(f"  box3_tax:      expected={exp_c['box3_tax']:,}  got={c.box3_tax:,}")
            print(f"  eff_rate:      expected={expected_rate:.1%}  got={result.effective_rate:.1%}  "
                  f"err={err_rate:.1%}")
            if ut := profile.user_type == "zzp":
                print(f"  za:            expected={exp_c.get('zelfstandigenaftrek',0):,}  "
                      f"got={c.zelfstandigenaftrek:,}")
                print(f"  sa:            expected={exp_c.get('startersaftrek',0):,}  "
                      f"got={c.startersaftrek:,}")
                print(f"  kia:           expected={exp_c.get('kia_deduction',0):,}  "
                      f"got={c.kia_deduction:,}")
                print(f"  mkb:           expected={exp_c.get('mkb_winstvrijstelling',0):,}  "
                      f"got={c.mkb_winstvrijstelling:,}")

    print("-" * 60)
    if all_pass:
        print(f"ALL {len(scenarios)} scenarios PASSED (tolerance {TOLERANCE:.0%})")
    else:
        print("SOME SCENARIOS FAILED — see details above")

    return all_pass


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
