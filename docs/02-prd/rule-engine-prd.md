# Rule Engine PRD

> Module: Rule Engine | Version: 1.0 | Updated: 2026-06-13

---

## Overview

The Rule Engine manages the tax knowledge base — the 28 verified 2026 tax rules (and future rules) that power AI responses, the deduction scanner, and the tax calculator. It provides a versioned, audited, approval-gated system for creating, updating, and retiring tax rules. Only `verified` rules are ever served to users.

---

## Core Architecture Principle

**The rule engine is the only place where tax values live.** Every other component (AI responses, calculator, deduction scanner, checklist templates) reads from the rule engine. Hardcoded tax values anywhere else in the code are a violation.

---

## Rule Entity

Every rule is a `TaxRule` record. This is the database representation of the Phase 1 `tax_rule.schema.json`.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| rule_id | string | Human-readable ID: `ZA-2026-001` |
| topic | string | `zelfstandigenaftrek` |
| category | enum | zzp_deduction / box1 / box2 / box3 / credit / vat / toeslag / social / compliance |
| year | int | 2026 |
| user_types | JSONField | `["zzp"]` |
| plain_nl | text | Dutch plain-language explanation |
| plain_en | text | English plain-language explanation |
| plain_fa | text | Persian plain-language explanation |
| condition_summary | text | When this rule applies (prose) |
| result_type | enum | deduction / credit / rate / threshold / deadline / penalty |
| result_value | JSONField | Numeric value or formula |
| formula | text | Nullable — Python expression for calculator |
| notes | text | Additional context |
| ai_prompt_hint | text | Instruction for AI (e.g., "ALWAYS include ZVW") |
| tags | JSONField | `["urencriterium", "1225uur"]` |
| source_url | URL | Belastingdienst citation |
| verification_status | enum | verified / pending_review / draft |
| effective_from | date | `2026-01-01` |
| effective_until | date | Nullable (`2026-12-31` for SA-2026-001) |
| supersedes | FK(self) | Points to the previous year's rule |
| version | int | Incremented on each change |
| created_by | FK(User) | |
| approved_by | FK(User) | Nullable — must be set before verification_status=verified |
| approved_at | datetime | Nullable |
| created_at | datetime | |
| updated_at | datetime | |

---

## Versioning System

When a rule needs to change (e.g., tax rate correction):
1. A new `TaxRule` is created with the corrected values and `verification_status=draft`
2. It references the old rule via `supersedes`
3. An admin reviews and approves — sets `verification_status=verified`, `approved_by`, `approved_at`
4. The old rule's `effective_until` is set to the date the new rule becomes effective
5. The old rule remains in the database for historical queries

**No in-place updates.** Every change creates a new version. Old versions are preserved.

---

## Rule Lifecycle

```
DRAFT ──(admin edits)──► PENDING_REVIEW ──(reviewer approves)──► VERIFIED
                                │
                         (reviewer rejects)
                                │
                                ▼
                             DRAFT (back for edits)
```

### State Definitions

| Status | Who can see | Used in retrieval | Notes |
|--------|-------------|------------------|-------|
| DRAFT | Admin only | No | Work in progress |
| PENDING_REVIEW | Admin only | No | Awaiting approval |
| VERIFIED | Everyone | Yes | Served to users |

---

## Shadow Mode Testing

Before a new rule goes live (especially for calculator-affecting rules), it can be run in **shadow mode**:

1. Rule is VERIFIED but has `shadow_mode=True` flag
2. All 6 benchmark scenarios are run against the new rule set
3. Results are compared against expected values in `scenarios.json`
4. If all 6 scenarios pass (< 1% error): shadow flag is removed, rule is fully live
5. If any scenario fails: rule is moved back to PENDING_REVIEW with failure details

---

## RuleTestCase Model

Each rule has associated test cases for automated validation.

| Field | Type |
|-------|------|
| id | UUID |
| rule | FK(TaxRule) |
| name | string |
| input | JSONField (e.g., `{"profit": 50000, "hours": 1400}`) |
| expected_output | JSONField (e.g., `{"eligible": true, "deduction": 1200}`) |
| result | JSONField (last test run result) |
| passed | boolean |
| last_run_at | datetime |

Test cases are run automatically on every rule change and in CI.

---

## Admin UI

The rule management admin UI is at `/admin/rules/` (Django admin override or custom React page).

**Features:**
- Browse rules: filter by year, category, user_type, verification_status
- View rule history: see all versions of a rule chronologically
- Create new rule (draft)
- Edit draft rule
- Submit for review (transitions to pending_review)
- Approve rule (admin with reviewer role → transitions to verified)
- Run test cases for a rule
- Shadow mode toggle
- View rules expiring within 90 days (for annual maintenance prep)

**Access:**
- `admin` role: create, edit, submit for review, run tests
- `super_admin` role: all of above + approve + shadow mode toggle
- `accountant` role: read-only view of verified rules

---

## Annual Maintenance (Phase 9)

Each September, before the next tax year:

1. Admin opens the rule update workflow
2. For each rule with `year=current`:
   - Are the values changing for next year? (e.g., ZA going from €1,200 to X)
   - If yes: create a new rule with `year=next`, `supersedes=current_rule_id`
   - If no: create a copy with the same values and new year
3. All new-year rules start as DRAFT
4. After government publishes Prinsjesdag (Budget Day, 3rd Tuesday September):
   - Update values from official Belastingdienst publications
   - Submit for review
   - Test cases run
   - Approve → verified
5. New-year rules effective from 1 January of the new year

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/rules/` | All | List verified rules (filtered by year, topic, user_type) |
| GET | `/api/rules/{rule_id}/` | All | Get one rule by rule_id |
| GET | `/api/rules/{rule_id}/history/` | Admin | All versions of a rule |
| POST | `/api/admin/rules/` | Admin | Create draft rule |
| PATCH | `/api/admin/rules/{id}/` | Admin | Edit draft rule |
| POST | `/api/admin/rules/{id}/submit-for-review/` | Admin | Submit draft → pending_review |
| POST | `/api/admin/rules/{id}/approve/` | SuperAdmin | Approve → verified |
| POST | `/api/admin/rules/{id}/run-tests/` | Admin | Run test cases |
| GET | `/api/admin/rules/{id}/test-cases/` | Admin | List test cases |
| POST | `/api/admin/rules/{id}/test-cases/` | Admin | Add test case |

---

## Phase 1 Migration

The 28 Phase 1 rules in `phase1/data/seed/tax_rules_2026.json` must be migrated to the database via a Django management command:

```bash
python manage.py import_phase1_rules --year 2026 --approved-by admin@taxwijs.nl
```

This command:
1. Reads `tax_rules_2026.json`
2. Creates a `TaxRule` for each record
3. Sets `verification_status=verified` (they are already hand-verified)
4. Sets `approved_at=now()` and `approved_by=admin user`
5. Creates `RuleTestCase` records from the Q&A pair `rule_ids` mapping
6. Is idempotent (safe to run multiple times)

---

## RAG Integration

Phase 2's RAG pipeline reads rules via `GET /api/rules/?year=2026` and re-indexes when rules change. A `rule_updated` event (from the event catalog) triggers `rebuild_rag_index.delay()` in Celery.

The `ai_prompt_hint` field survives from rule → chunk → assembled context → AI system prompt.

---

## NFR

| Requirement | Target |
|-------------|--------|
| Rule read latency | < 50ms (cached) |
| Rule update approval | 2-person approval minimum (creator ≠ approver) |
| Test case coverage | 100% of verified rules have ≥ 1 test case |
| Annual maintenance | All next-year rules drafted by 1 October, verified by 15 December |
| Audit trail | Every rule state transition recorded with actor, timestamp, reason |
| Zero hardcoded values | CI check: no tax rate literals in non-rule-engine Python files |
