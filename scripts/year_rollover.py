#!/usr/bin/env python3
"""
Phase 9 — Annual year rollover script.

Run each September to prepare the next tax year's knowledge base.

What it does:
  1. Reads the current year's tax_rules_{year}.json
  2. Creates a new tax_rules_{next_year}.json with:
     - year bumped to next_year
     - IDs bumped (e.g. ZA-2026-001 → ZA-2027-001)
     - supersedes set to the current-year ID
     - verification_status reset to "draft" (requires re-verification)
     - effective_from / effective_until updated for next year
     - last_checked reset to today
  3. Rules with effective_until <= current year's end are excluded
     (they were year-specific, e.g. SA-2026-001 which ends 31 Dec 2026)
  4. Runs validate.py on the new file to check schema integrity
  5. Prints a checklist of manual steps still required

Usage:
  python3 scripts/year_rollover.py            # 2026 → 2027
  python3 scripts/year_rollover.py --from 2027 --to 2028

After running:
  - Review the draft rules in phase1/data/seed/tax_rules_{next_year}.json
  - Update all values for the new year (brackets, rates, amounts)
  - Set verification_status back to "verified" for each confirmed rule
  - Run: python3 phase1/scripts/validate.py
  - Run: python3 phase2/build_index.py  (rebuilds the RAG vector index)
"""

import argparse
import json
import re
import subprocess
import sys
from copy import deepcopy
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED_DIR = ROOT / "phase1" / "data" / "seed"


def bump_id(rule_id: str, from_year: int, to_year: int) -> str:
    """ZA-2026-001 → ZA-2027-001"""
    return rule_id.replace(f"-{from_year}-", f"-{to_year}-")


def rollover(from_year: int, to_year: int, dry_run: bool = False) -> None:
    src_path = SEED_DIR / f"tax_rules_{from_year}.json"
    dst_path = SEED_DIR / f"tax_rules_{to_year}.json"

    if not src_path.exists():
        print(f"ERROR: Source file not found: {src_path}", file=sys.stderr)
        sys.exit(1)

    if dst_path.exists():
        print(f"WARNING: {dst_path.name} already exists — it will be overwritten.")

    with open(src_path, encoding="utf-8") as f:
        rules = json.load(f)

    today = date.today().isoformat()
    year_end = f"{from_year}-12-31"
    skipped = []
    new_rules = []

    for rule in rules:
        eff_until = rule.get("effective_until")

        # Drop rules that expired at the end of from_year (year-specific rules)
        if eff_until and eff_until <= year_end:
            skipped.append(rule["id"])
            continue

        new_rule = deepcopy(rule)
        old_id = rule["id"]
        new_id = bump_id(old_id, from_year, to_year)

        new_rule["id"]                  = new_id
        new_rule["year"]                = to_year
        new_rule["supersedes"]          = old_id
        new_rule["verification_status"] = "draft"
        new_rule["effective_from"]      = f"{to_year}-01-01"
        new_rule["effective_until"]     = None
        new_rule["last_checked"]        = today

        new_rules.append(new_rule)

    if dry_run:
        print(f"\nDRY RUN — would write {len(new_rules)} rules to {dst_path.name}")
        print(f"Skipped (year-specific, expired {from_year}): {skipped or 'none'}")
        return

    with open(dst_path, "w", encoding="utf-8") as f:
        json.dump(new_rules, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Created {dst_path.name}  ({len(new_rules)} rules)")

    if skipped:
        print(f"\n⚠  Excluded {len(skipped)} year-specific rule(s) that expired at end of {from_year}:")
        for sid in skipped:
            print(f"     - {sid}  (effective_until: {from_year}-12-31)")
        print(f"   → Write replacement rule(s) for {to_year} if they still apply.")

    # Run validate.py — it will fail because values are draft/stale but schema must pass
    print(f"\nRunning validate.py on {dst_path.name}...")
    validate_script = ROOT / "phase1" / "scripts" / "validate.py"
    result = subprocess.run(
        [sys.executable, str(validate_script)],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        print("✓ validate.py passed — schema is valid")
    else:
        print("✗ validate.py reported issues (expected for draft rules — check values):")
        print(result.stdout[-2000:] if len(result.stdout) > 2000 else result.stdout)

    # Print checklist
    print(f"""
╔══════════════════════════════════════════════════════╗
║   Manual steps required before {to_year} goes live   ║
╚══════════════════════════════════════════════════════╝

 1. Open phase1/data/seed/tax_rules_{to_year}.json
    Update ALL monetary values, rates, and thresholds for {to_year}
    (brackets, credits, deductions — check Belastingdienst.nl each September)

 2. For each rule, set:
      "verification_status": "verified"
    Only after manually confirming the value against official sources.

 3. Update source_url for any rules where the official page changed.

 4. Write new rule(s) to replace skipped year-specific rules:
    {skipped or '(none this year)'}

 5. Run: python3 phase1/scripts/validate.py
    All checks must pass before proceeding.

 6. Rebuild the RAG index:
    python3 phase2/build_index.py

 7. Run the full test suite:
    ./scripts/run_tests.sh

 8. Update CLAUDE.md with the new year's values.
""")


def main():
    parser = argparse.ArgumentParser(description="TaxWijs annual year rollover")
    parser.add_argument("--from", dest="from_year", type=int, default=2026,
                        help="Source year (default: 2026)")
    parser.add_argument("--to", dest="to_year", type=int, default=2027,
                        help="Target year (default: 2027)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview without writing any files")
    args = parser.parse_args()

    if args.to_year <= args.from_year:
        print("ERROR: --to must be greater than --from", file=sys.stderr)
        sys.exit(1)

    print(f"TaxWijs year rollover: {args.from_year} → {args.to_year}"
          + (" (dry run)" if args.dry_run else ""))

    rollover(args.from_year, args.to_year, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
