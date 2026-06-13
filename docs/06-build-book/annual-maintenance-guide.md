# Annual Maintenance Guide — Phase 9

> How to update TaxWijs for each new tax year.
> Run each September–December before the following tax year starts.
> Updated: 2026-06-13

---

## Overview

Dutch tax rules change every year, announced on **Prinsjesdag** (3rd Tuesday of September). TaxWijs must be updated before 1 January of the new tax year to ensure correct calculations for the upcoming year.

This guide describes the full Phase 9 workflow for the annual rule update cycle.

---

## Timeline

| Date | Milestone |
|------|-----------|
| **1 September** | Open Phase 9 maintenance branch |
| **3rd Tuesday September** | Prinsjesdag — government announces tax plan |
| **1 October** | All new-year rules drafted in DB (status=draft) |
| **1 November** | Senate confirms final figures — update rules with confirmed values |
| **15 November** | All new-year rules submitted for review (status=pending_review) |
| **1 December** | All new-year rules approved (status=verified) |
| **15 December** | All 6 benchmark scenarios updated and passing for new year |
| **31 December** | New year rules go live (effective_from = new year 01-01) |
| **1 January** | System switches to new year — old year rules still queryable with ?year=N |

---

## Step-by-Step Process

### Step 1: Open Maintenance Branch

```bash
git checkout master
git pull
git checkout -b feat/tax-year-2027-rules
```

### Step 2: Audit Current Rules for Changes

For each of the 28 current rules, check:
- Has the value changed? (bracket threshold, deduction amount, rate)
- Has the rule been abolished? (e.g., startersaftrek ends 2026-12-31)
- Are there new rules to add? (new credits, new thresholds)

Sources to check (in priority order):
1. `docs/01-discovery/dutch-tax-rule-source-register.md` — list of official sources
2. Belastingdienst.nl/zakelijk — updated after Prinsjesdag
3. Rijksoverheid.nl/onderwerpen/inkomstenbelasting — official press releases
4. SRA.nl and NOB.net — professional accountancy organizations

### Step 3: Create New-Year Rules

For each rule that continues unchanged:

```bash
python backend/manage.py clone_rules_for_year --from-year 2026 --to-year 2027
```

This command:
- Copies all verified 2026 rules to 2027 (status=draft)
- Sets `effective_from = 2027-01-01`
- Sets `supersedes = {old_rule_uuid}`
- Does NOT copy `effective_until` (that's set on the old rule when the new one goes live)

For each rule that has changed values, edit the draft:

```bash
# Admin UI at /admin-console/rules OR via API
PATCH /api/admin/rules/{uuid}/
{
  "result_value": {"amount": 1500},  # New value for ZA-2027-001 (example)
  "plain_nl": "De zelfstandigenaftrek is €1.500 in 2027...",
  "plain_en": "The self-employed deduction is €1,500 in 2027...",
  "plain_fa": "کسر کارآفرین مستقل در سال ۲۰۲۷ برابر ۱٬۵۰۰ یورو است..."
}
```

For abolished rules (like startersaftrek post-2026):
- Set `effective_until = 2026-12-31` on the 2026 rule
- Do NOT create a 2027 version

For new rules:
```bash
POST /api/admin/rules/
{
  "rule_id": "NEW-2027-001",
  "year": 2027,
  ...
}
```

### Step 4: Update CLAUDE.md

Update the key 2026 tax data table in `CLAUDE.md` with the new year's values. Every value in the "Key N tax data" section must be updated.

### Step 5: Update Phase 1 Seed Data

```bash
# Duplicate the 2026 seed files for 2027
cp phase1/data/seed/tax_rules_2026.json phase1/data/seed/tax_rules_2027.json
# Edit tax_rules_2027.json with new values
```

Update `phase1/data/seed/scenarios.json` — create 6 new scenarios for the new year using the same profile types but with updated expected calculation results.

### Step 6: Run Phase 1 Validation

```bash
python phase1/scripts/validate.py --year 2027
```

Must pass 100%.

### Step 7: Submit Rules for Review

```bash
POST /api/admin/rules/{uuid}/submit-for-review/
# For each new-year rule
```

Or via admin UI: select all 2027 draft rules → bulk "Submit for review"

### Step 8: Approve Rules (Two-Person Rule)

The person who created/edited the rules CANNOT approve them. A second admin must:

```bash
POST /api/admin/rules/{uuid}/approve/
```

Or via admin UI: review each rule, check source URL, confirm value matches official source.

### Step 9: Update Scenarios and Test Calculator

Update `backend/tests/test_calculator_scenarios.py` with new expected totals for 2027 scenarios. Then run:

```bash
pytest backend/tests/test_calculator_scenarios.py -v --year 2027
```

All 6 scenarios must pass with <1% error against Belastingdienst ground truth.

### Step 10: Rebuild RAG Index

```bash
python phase2/build_index.py --year 2027
python phase2/test_retrieval.py --year 2027
```

Precision@5 must be ≥95% for 2027 rules.

### Step 11: Update Checklist Templates

```bash
# Via admin UI at /admin-console/rules (checklist templates section)
# Or via management command:
python backend/manage.py update_checklist_templates --year 2027
```

### Step 12: Run Full CI

```bash
git push -u origin feat/tax-year-2027-rules
# Open PR → CI must pass fully
```

### Step 13: Update PROGRESS.md

Add a Phase 9 session entry to `PROGRESS.md` documenting:
- Which rules changed and what the new values are
- Which rules were abolished
- Any new rules added
- Scenario pass/fail results

### Step 14: Merge and Deploy

```bash
# After PR approval and CI pass:
git checkout master
git merge --no-ff feat/tax-year-2027-rules
git push

# Staging deploy is automatic (GitHub Actions)
# Production deploy: manual trigger after staging smoke tests pass
```

---

## Rule Change Checklist (per rule)

For each of the 28 rules, verify:

- [ ] Value matches official source (Belastingdienst.nl citation)
- [ ] Source URL updated to the new-year page
- [ ] All three language versions updated (NL + EN + FA)
- [ ] `effective_from` = 2027-01-01
- [ ] `effective_until` = null (unless abolition year)
- [ ] Test case updated with new expected value
- [ ] CLAUDE.md table updated

---

## Frequently Changed Rules (priority review)

These rules change nearly every year — check them first:

| Rule ID | What changes | Source |
|---------|-------------|--------|
| BR1-2026-001 | Box 1 bracket 1 threshold | Belastingdienst |
| BR1-2026-003 | Box 1 bracket 3 threshold | Belastingdienst |
| ZA-2026-001 | Zelfstandigenaftrek amount | Kamerstukken |
| MKB-2026-001 | MKB-winstvrijstelling % | Belastingdienst |
| AHK-2026-001 | Algemene heffingskorting max | Belastingdienst |
| AK-2026-001 | Arbeidskorting max + phase-out | Belastingdienst |
| ZT-2026-001 | Zorgtoeslag amount + cutoff | Belastingdienst/Toeslagen |
| DGA-2026-001 | DGA gebruikelijk loon | Belastingdienst |
| ZVW-2026-001 | ZVW rate + ceiling | Rijksoverheid |

---

## Emergency Rule Fix (mid-year correction)

If a rule value is found to be wrong after going live:

1. Create a corrected draft rule immediately
2. Get emergency approval from super_admin
3. Set `shadow_mode=True` — run all scenarios silently
4. If scenarios pass: remove shadow_mode, go live
5. Notify affected users if any calculations were shown with wrong values
6. Document in `docs/08-ops/operational-runbooks.md`
7. Add to PROGRESS.md
