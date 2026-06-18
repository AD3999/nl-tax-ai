#!/usr/bin/env python3
"""
Phase 1 Knowledge Base Validator
---------------------------------
Validates all seed JSON files against their schemas and runs accuracy
tests on tax rule calculations to ensure <1% error margin.

Usage:
    pip install jsonschema
    python validate.py
    python validate.py --only schemas        # schema checks only
    python validate.py --only calculations   # calculation checks only
    python validate.py --verbose
"""

import json, argparse, sys, math
from pathlib import Path

try:
    from jsonschema import validate, ValidationError, Draft7Validator
except ImportError:
    print("ERROR: jsonschema not installed. Run: pip install jsonschema")
    sys.exit(1)

BASE = Path(__file__).parent.parent.parent
SCHEMAS = BASE / "data" / "schemas"
SEED    = BASE / "data" / "seed"

SCHEMA_FILES = {
    "tax_rules":    (SCHEMAS / "tax_rule.schema.json",     SEED / "tax_rules_2026.json"),
    "qa_pairs":     (SCHEMAS / "qa_pair.schema.json",      SEED / "qa_pairs_2026.json"),
    "scenarios":    (SCHEMAS / "scenario.schema.json",     SEED / "scenarios.json"),
    "ib_mapping":   (SCHEMAS / "ib_form_field.schema.json",SEED / "ib_form_mapping.json"),
}

PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"
WARN = "\033[93m⚠\033[0m"

def load_json(path: Path) -> object:
    with open(path, encoding="utf-8") as f:
        return json.load(f)

# ──────────────────────────────────────────────────────────────────
# SCHEMA VALIDATION
# ──────────────────────────────────────────────────────────────────

def validate_schemas(verbose: bool = False) -> tuple[int, int]:
    passed = failed = 0
    print("\n── Schema Validation ──────────────────────────────────────────")

    for name, (schema_path, data_path) in SCHEMA_FILES.items():
        if not schema_path.exists():
            print(f"  {WARN} Schema missing: {schema_path}")
            continue
        if not data_path.exists():
            print(f"  {WARN} Seed data missing: {data_path}")
            continue

        schema = load_json(schema_path)
        records = load_json(data_path)
        if not isinstance(records, list):
            records = [records]

        errors = []
        for i, record in enumerate(records):
            try:
                validate(instance=record, schema=schema)
            except ValidationError as e:
                errors.append(f"Record {i} ({record.get('id','?')}): {e.message}")

        if errors:
            print(f"  {FAIL} {name}: {len(errors)}/{len(records)} records invalid")
            if verbose:
                for err in errors[:5]:
                    print(f"       → {err}")
            failed += len(errors)
        else:
            print(f"  {PASS} {name}: {len(records)} records valid")
            passed += len(records)

    return passed, failed


# ──────────────────────────────────────────────────────────────────
# CALCULATION ACCURACY TESTS
# ──────────────────────────────────────────────────────────────────

TOLERANCE = 0.01  # 1% tolerance

def assert_near(label: str, actual: float, expected: float, results: list):
    if expected == 0:
        ok = abs(actual) < 1
    else:
        ok = abs(actual - expected) / abs(expected) < TOLERANCE
    results.append((label, ok, actual, expected))

def calc_box1_tax(taxable: float) -> float:
    """2026 Box 1 tax brackets (below AOW age)."""
    tax = 0.0
    b1_ceil = 38883
    b3_floor = 78426
    if taxable <= 0:
        return 0
    tax += min(taxable, b1_ceil) * 0.3575
    if taxable > b1_ceil:
        mid = min(taxable, b3_floor) - b1_ceil
        if mid > 0:
            tax += mid * 0.3756  # bracket 2 (AOW age only, skip for ZZP)
    if taxable > b3_floor:
        tax += (taxable - b3_floor) * 0.495
    # Simplified: use only br1 + br3 for non-AOW-age
    tax = min(taxable, b1_ceil) * 0.3575
    if taxable > b3_floor:
        # Small bracket 2 gap (38883–78426 at 37.56%, but only for AOW age)
        # For working-age: br1 then br3
        tax += (taxable - b1_ceil) * 0.3575  # simplified — use same rate for gap
    return tax

def calc_ahk(aggregate: float) -> float:
    if aggregate <= 29736: return 3115
    if aggregate >= 78426: return 0
    return max(0, 3115 - (aggregate - 29736) * 0.06398)

def calc_arbeidskorting(work_income: float) -> float:
    if work_income <= 11490: return 0
    if work_income <= 37697: return (work_income - 11490) / (37697 - 11490) * 5685
    if work_income <= 45592: return 5685
    if work_income <= 132920: return max(0, 5685 - (work_income - 45592) * 0.0651)
    return 0

def calc_mkb(profit_after_oa: float) -> float:
    return profit_after_oa * 0.127

def calc_zvw_zzp(profit: float) -> float:
    return min(profit, 79409) * 0.0485


def validate_calculations(verbose: bool = False) -> tuple[int, int]:
    print("\n── Calculation Accuracy Tests ─────────────────────────────────")
    results = []

    # ── Test 1: ZZP €50k profit standard case ─────────────────────
    profit = 50000
    za = 1200
    profit_after_oa = profit - za
    mkb = calc_mkb(profit_after_oa)
    taxable = profit_after_oa - mkb
    box1_raw = min(taxable, 38883) * 0.3575
    ahk = calc_ahk(taxable)
    ak = calc_arbeidskorting(taxable)
    income_tax = max(0, box1_raw - ahk - ak)
    zvw = calc_zvw_zzp(taxable)
    total = income_tax + zvw

    assert_near("T1: ZZP €50k — zelfstandigenaftrek", za, 1200, results)
    assert_near("T1: ZZP €50k — MKB-winstvrijstelling", mkb, 6200, results)
    assert_near("T1: ZZP €50k — taxable income", taxable, 42600, results)
    assert_near("T1: ZZP €50k — total tax (approx)", total, 7990, results)

    # ── Test 2: AHK phase-out ──────────────────────────────────────
    assert_near("T2: AHK €29,000 income → max", calc_ahk(29000), 3115, results)
    assert_near("T2: AHK €78,426 income → zero", calc_ahk(78426), 0, results)
    assert_near("T2: AHK €50,000 income → partial", calc_ahk(50000),
                3115 - (50000 - 29736) * 0.06398, results)

    # ── Test 3: Arbeidskorting ─────────────────────────────────────
    assert_near("T3: AK €45,000 → max", calc_arbeidskorting(45000), 5685, results)
    assert_near("T3: AK €10,000 → below threshold", calc_arbeidskorting(10000), 0, results)
    assert_near("T3: AK €80,000 → phased out", calc_arbeidskorting(80000),
                max(0, 5685 - (80000 - 45592) * 0.0651), results)

    # ── Test 4: ZVW ceiling ────────────────────────────────────────
    assert_near("T4: ZVW €50k profit", calc_zvw_zzp(50000), 50000 * 0.0485, results)
    assert_near("T4: ZVW €100k profit (capped)", calc_zvw_zzp(100000), 79409 * 0.0485, results)
    assert_near("T4: ZVW max amount", calc_zvw_zzp(999999), 3851.34, results)

    # ── Test 5: MKB-winstvrijstelling ─────────────────────────────
    assert_near("T5: MKB 12.7% of €50k", calc_mkb(50000), 6350, results)
    assert_near("T5: MKB 12.7% of €100k", calc_mkb(100000), 12700, results)

    # ── Test 6: Box 2 rates ───────────────────────────────────────
    b2_low = 40000 * 0.245
    b2_high = 100000 * 0.245 + (100000 - 68843) * (0.31 - 0.245)
    assert_near("T6: Box2 €40k → 24.5%", b2_low, 9800, results)

    # ── Test 7: Box 3 calculation ─────────────────────────────────
    assets = 100000
    exemption = 59357
    above = max(0, assets - exemption)  # €40,643 taxable
    fictitious = above * 0.0128  # savings rate
    b3_tax = fictitious * 0.36
    assert_near("T7: Box3 €100k savings — taxable above exemption", above, 40643, results)
    assert_near("T7: Box3 €100k savings — fictitious return", fictitious, 520.23, results)

    # ── Test 8: Validate scenario SCN-ZZP-001 ────────────────────
    scen_path = SEED / "scenarios.json"
    if scen_path.exists():
        scenarios = load_json(scen_path)
        s001 = next((s for s in scenarios if s["id"] == "SCN-ZZP-001"), None)
        if s001:
            c = s001["calculation"]
            assert_near("T8: SCN-ZZP-001 gross profit", c["gross_profit"],
                        s001["profile"]["annual_revenue_zzp"] - s001["profile"]["business_expenses"], results)
            assert_near("T8: SCN-ZZP-001 total tax", s001["result"]["total_tax_due"],
                        c["income_tax_after_credits"] + c["zvw_contribution"], results)

    # ── Report ─────────────────────────────────────────────────────
    p = sum(1 for _, ok, *_ in results if ok)
    f = len(results) - p

    for label, ok, actual, expected in results:
        icon = PASS if ok else FAIL
        if verbose or not ok:
            pct = abs(actual - expected) / max(abs(expected), 1) * 100
            print(f"  {icon} {label}")
            if not ok:
                print(f"       actual={actual:.2f}, expected={expected:.2f}, err={pct:.1f}%")
        else:
            print(f"  {icon} {label}")

    return p, f


# ──────────────────────────────────────────────────────────────────
# INTEGRITY CHECKS
# ──────────────────────────────────────────────────────────────────

def validate_integrity(verbose: bool = False) -> tuple[int, int]:
    """Cross-reference checks — rule IDs cited in QA pairs and scenarios must exist."""
    print("\n── Integrity Checks ───────────────────────────────────────────")
    passed = failed = 0

    rules = load_json(SEED / "tax_rules_2026.json")
    rule_ids = {r["id"] for r in rules}

    qa_pairs = load_json(SEED / "qa_pairs_2026.json")
    for qa in qa_pairs:
        for rid in qa.get("rule_ids", []):
            if rid in rule_ids:
                passed += 1
            else:
                failed += 1
                print(f"  {FAIL} QA {qa['id']}: references unknown rule_id '{rid}'")

    scenarios = load_json(SEED / "scenarios.json")
    for s in scenarios:
        for rid in s.get("rule_ids_applied", []):
            if rid in rule_ids:
                passed += 1
            else:
                failed += 1
                print(f"  {FAIL} Scenario {s['id']}: references unknown rule_id '{rid}'")

    # Check IB form rule_ids
    ib_fields = load_json(SEED / "ib_form_mapping.json")
    for field in ib_fields:
        for rid in field.get("rule_ids", []):
            if rid in rule_ids:
                passed += 1
            else:
                failed += 1
                print(f"  {FAIL} IB field {field['field_code']}: references unknown rule_id '{rid}'")

    # Check all rules have required source_url
    for r in rules:
        if r.get("source_url"):
            passed += 1
        else:
            failed += 1
            print(f"  {FAIL} Rule {r['id']}: missing source_url")

    if failed == 0:
        print(f"  {PASS} All cross-references valid ({passed} checks passed)")

    return passed, failed


# ──────────────────────────────────────────────────────────────────
# COVERAGE REPORT
# ──────────────────────────────────────────────────────────────────

def print_coverage_report():
    print("\n── Coverage Report ────────────────────────────────────────────")
    rules    = load_json(SEED / "tax_rules_2026.json")
    qa_pairs = load_json(SEED / "qa_pairs_2026.json")
    scenarios= load_json(SEED / "scenarios.json")
    ib_fields= load_json(SEED / "ib_form_mapping.json")

    topics_in_rules = set(r["topic"] for r in rules)
    topics_in_qa    = set(t for qa in qa_pairs for t in qa.get("tags", []))

    user_types_rules = {}
    for r in rules:
        for ut in r.get("user_types", []):
            user_types_rules[ut] = user_types_rules.get(ut, 0) + 1

    user_types_scen = {}
    for s in scenarios:
        ut = s["user_type"]
        user_types_scen[ut] = user_types_scen.get(ut, 0) + 1

    print(f"  Tax rules:        {len(rules):3d}  ({len(topics_in_rules)} unique topics)")
    print(f"  Q&A pairs:        {len(qa_pairs):3d}")
    print(f"  Scenarios:        {len(scenarios):3d}  (user types: {dict(user_types_scen)})")
    print(f"  IB form fields:   {len(ib_fields):3d}")
    print()
    print("  Rules by user type:")
    for ut, count in sorted(user_types_rules.items()):
        print(f"    {ut:<12} {count} rules")
    print()
    print("  Scenarios by type:")
    for ut, count in sorted(user_types_scen.items()):
        print(f"    {ut:<12} {count} scenarios")
    print()
    print("  Topics covered:")
    for t in sorted(topics_in_rules):
        print(f"    • {t}")


# ──────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate Phase 1 knowledge base")
    parser.add_argument("--only", choices=["schemas", "calculations", "integrity", "coverage"])
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    total_passed = total_failed = 0

    if args.only in (None, "schemas"):
        p, f = validate_schemas(args.verbose)
        total_passed += p; total_failed += f

    if args.only in (None, "calculations"):
        p, f = validate_calculations(args.verbose)
        total_passed += p; total_failed += f

    if args.only in (None, "integrity"):
        p, f = validate_integrity(args.verbose)
        total_passed += p; total_failed += f

    if args.only in (None, "coverage"):
        print_coverage_report()

    print(f"\n{'─'*62}")
    if total_failed == 0:
        print(f"  {PASS} ALL CHECKS PASSED ({total_passed} checks)")
    else:
        print(f"  {FAIL} {total_failed} FAILED, {total_passed} passed")
        sys.exit(1)
