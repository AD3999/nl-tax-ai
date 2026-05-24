"""
Phase 7 — Calculator engine tests.
All 6 phase1 scenarios must match within 1% of stored expected totals.
Individual unit tests cover each sub-calculator independently.
"""
import json
from pathlib import Path

from django.test import TestCase
from rest_framework.test import APIClient

from .engine import (
    calc_ahk,
    calc_arbeidskorting,
    calc_box1_tax,
    calc_box2,
    calc_box3,
    calc_iack,
    calc_kia,
    calc_zvw,
    calculate,
)

_SCENARIOS = json.loads(
    (Path(__file__).resolve().parents[3] / "phase1" / "data" / "seed" / "scenarios.json")
    .read_text(encoding="utf-8")
)

_USER_TYPE_MAP = {
    "SCN-ZZP-001": "zzp",
    "SCN-ZZP-002": "zzp",
    "SCN-ZZP-003": "zzp",
    "SCN-EMP-001": "employee",
    "SCN-EXP-001": "expat",
    "SCN-DGA-001": "dga",
}


def _pct_diff(actual, expected):
    if expected == 0:
        return 0.0
    return abs(actual - expected) / expected


class ScenarioAccuracyTests(TestCase):
    """Engine output must match phase1 scenario totals within 1%."""

    def _run(self, scenario):
        profile = dict(scenario["profile"])
        profile["user_type"] = _USER_TYPE_MAP[scenario["id"]]
        result = calculate(profile)
        return result["result"]["total_tax_due"], scenario["result"]["total_tax_due"]

    def test_scn_zzp_001(self):
        s = next(x for x in _SCENARIOS if x["id"] == "SCN-ZZP-001")
        actual, expected = self._run(s)
        self.assertLessEqual(_pct_diff(actual, expected), 0.01,
            f"SCN-ZZP-001: got €{actual}, expected €{expected}")

    def test_scn_zzp_002(self):
        s = next(x for x in _SCENARIOS if x["id"] == "SCN-ZZP-002")
        actual, expected = self._run(s)
        self.assertLessEqual(_pct_diff(actual, expected), 0.01,
            f"SCN-ZZP-002: got €{actual}, expected €{expected}")

    def test_scn_zzp_003(self):
        s = next(x for x in _SCENARIOS if x["id"] == "SCN-ZZP-003")
        actual, expected = self._run(s)
        self.assertLessEqual(_pct_diff(actual, expected), 0.01,
            f"SCN-ZZP-003: got €{actual}, expected €{expected}")

    def test_scn_emp_001(self):
        s = next(x for x in _SCENARIOS if x["id"] == "SCN-EMP-001")
        actual, expected = self._run(s)
        self.assertLessEqual(_pct_diff(actual, expected), 0.01,
            f"SCN-EMP-001: got €{actual}, expected €{expected}")

    def test_scn_exp_001(self):
        s = next(x for x in _SCENARIOS if x["id"] == "SCN-EXP-001")
        actual, expected = self._run(s)
        self.assertLessEqual(_pct_diff(actual, expected), 0.01,
            f"SCN-EXP-001: got €{actual}, expected €{expected}")

    def test_scn_dga_001(self):
        s = next(x for x in _SCENARIOS if x["id"] == "SCN-DGA-001")
        actual, expected = self._run(s)
        self.assertLessEqual(_pct_diff(actual, expected), 0.01,
            f"SCN-DGA-001: got €{actual}, expected €{expected}")


class Box1TaxTests(TestCase):
    def test_zero_income(self):
        r = calc_box1_tax(0)
        self.assertEqual(r["raw"], 0)

    def test_bracket1_only(self):
        r = calc_box1_tax(20000)
        expected = round(20000 * 0.3575)
        self.assertAlmostEqual(r["raw"], expected, delta=2)
        self.assertEqual(r["bracket2"], 0)
        self.assertEqual(r["bracket3"], 0)

    def test_all_brackets(self):
        r = calc_box1_tax(100000)
        self.assertGreater(r["bracket1"], 0)
        self.assertGreater(r["bracket2"], 0)
        self.assertGreater(r["bracket3"], 0)

    def test_top_bracket_rate(self):
        # Income entirely above €78,426 marginal rate = 49.5%
        r_high = calc_box1_tax(200000)
        r_low = calc_box1_tax(100000)
        marginal = r_high["raw"] - r_low["raw"]
        self.assertAlmostEqual(marginal / 100000, 0.495, delta=0.001)


class AHKTests(TestCase):
    def test_max_credit_low_income(self):
        ahk = calc_ahk(10000)
        self.assertEqual(ahk, 3115)  # max 2026

    def test_phases_out_at_ceiling(self):
        ahk = calc_ahk(78426)
        self.assertEqual(ahk, 0)

    def test_phases_out_above_ceiling(self):
        self.assertEqual(calc_ahk(100000), 0)

    def test_partial_phaseout(self):
        mid = calc_ahk(50000)
        self.assertGreater(mid, 0)
        self.assertLess(mid, 3115)


class ArbeidskortingTests(TestCase):
    def test_zero_income(self):
        self.assertEqual(calc_arbeidskorting(0), 0)

    def test_max_credit(self):
        ak = calc_arbeidskorting(40000)
        self.assertLessEqual(ak, 5685)

    def test_phases_out_high_income(self):
        ak_mid = calc_arbeidskorting(60000)
        ak_high = calc_arbeidskorting(120000)
        self.assertGreater(ak_mid, ak_high)


class IACKTests(TestCase):
    def test_no_children(self):
        self.assertEqual(calc_iack(40000, 0), 0)

    def test_with_child(self):
        iack = calc_iack(40000, 1)
        self.assertGreater(iack, 0)
        self.assertLessEqual(iack, 3032)

    def test_max_credit(self):
        # Max €3,032 reached at income >= €32,713 (formula: (income-6239)*0.1145)
        self.assertEqual(calc_iack(35000, 1), 3032)


class ZVWTests(TestCase):
    def test_zero(self):
        self.assertEqual(calc_zvw(0), 0)

    def test_rate(self):
        # ZVW rate is 4.85% (not 5.32%) — confirmed from ZVW-2026-001 rule
        zvw = calc_zvw(10000)
        self.assertAlmostEqual(zvw, round(10000 * 0.0485), delta=2)

    def test_capped_at_max(self):
        # Cap is 4.85% of €79,409 = €3,851 — from rule result.max_amount
        zvw_high = calc_zvw(200000)
        self.assertLessEqual(zvw_high, 3852)


class Box2Tests(TestCase):
    def test_zero(self):
        self.assertEqual(calc_box2(0), 0)

    def test_low_rate(self):
        tax = calc_box2(50000)
        self.assertAlmostEqual(tax, round(50000 * 0.245), delta=2)

    def test_high_rate_above_threshold(self):
        # Amount above €68,843 taxed at 31%
        tax = calc_box2(100000)
        expected = round(68843 * 0.245) + round((100000 - 68843) * 0.31)
        self.assertAlmostEqual(tax, expected, delta=5)


class Box3Tests(TestCase):
    def test_below_exemption(self):
        self.assertEqual(calc_box3(50000, False, 1.0), 0)

    def test_above_exemption_single(self):
        tax = calc_box3(100000, False, 0.0)  # all investments
        self.assertGreater(tax, 0)

    def test_partner_doubles_exemption(self):
        # Both single and partner at €59,357 × 2 = €118,714 exempt
        tax_single = calc_box3(80000, False, 1.0)
        tax_partner = calc_box3(80000, True, 1.0)
        self.assertEqual(tax_partner, 0)
        self.assertGreater(tax_single, 0)


class KIATests(TestCase):
    def test_below_threshold(self):
        self.assertEqual(calc_kia(1000), 0)

    def test_in_range(self):
        kia = calc_kia(10000)
        self.assertGreater(kia, 0)

    def test_high_investment_still_gives_credit(self):
        # KIA peaks mid-range then phases out, but always > 0 within eligible band
        kia = calc_kia(200000)
        self.assertGreater(kia, 0)


class CalculatorAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_zzp_calculate_returns_200(self):
        resp = self.client.post("/api/calculator/calculate/", {
            "user_type": "zzp",
            "annual_revenue_zzp": 60000,
            "business_expenses": 5000,
            "hours_per_year": 1300,
            "is_starter": False,
        }, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("result", resp.json())
        self.assertIn("total_tax_due", resp.json()["result"])

    def test_employee_calculate_returns_200(self):
        resp = self.client.post("/api/calculator/calculate/", {
            "user_type": "employee",
            "employment_income": 45000,
        }, format="json")
        self.assertEqual(resp.status_code, 200)

    def test_low_income_no_negative_tax(self):
        # Serializer requires annual_revenue_zzp > 0; use minimum valid value
        resp = self.client.post("/api/calculator/calculate/", {
            "user_type": "zzp",
            "annual_revenue_zzp": 1,
        }, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(resp.json()["result"]["total_tax_due"], 0)

    def test_missing_user_type_returns_400(self):
        resp = self.client.post("/api/calculator/calculate/", {
            "annual_revenue_zzp": 50000,
        }, format="json")
        self.assertEqual(resp.status_code, 400)
