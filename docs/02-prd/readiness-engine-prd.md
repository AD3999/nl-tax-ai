# Readiness Engine PRD

> Module: Readiness Engine | Version: 1.0 | Updated: 2026-06-13

---

## Overview

The Readiness Engine computes a 0–100 score reflecting how complete a tax engagement is. It is the single source of truth that gates `ReadyToFile` status, drives client task prioritization, and populates the readiness ring in both client and accountant portals. The score must be deterministic, fast (< 500ms), and recalculate automatically on any triggering event.

---

## Score Formula

```
readiness_score = (
    documents_score * 0.40 +
    checklist_score * 0.30 +
    verification_score * 0.20 +
    accountant_review_score * 0.10
)
```

All four dimension scores are 0–100 before weighting.

### Dimension 1 — Documents (40%)

```
documents_score = (approved_docs / total_required_docs) * 100
```

- `total_required_docs` = checklist items with `priority=required` that require a document
- `approved_docs` = checklist items where the linked document has status=APPROVED
- A required doc that is NEEDS_REVIEW counts as 0.5 (half credit)
- A required doc that is REJECTED counts as 0

**Mandatory doc gate:** If any required document is missing (not yet uploaded), `ready_to_file` is forced to `False` regardless of total score.

### Dimension 2 — Checklist (30%)

```
checklist_score = (
    (accepted_required * 2.0 + accepted_recommended * 1.0 + waived_required * 1.0) /
    (total_required * 2.0 + total_recommended * 1.0)
) * 100
```

- Required items have double weight
- Waived items count the same as accepted (accountant consciously chose to skip)
- Rejected items count as 0 (equivalent to not done)

### Dimension 3 — Verification (20%)

```
verification_score = (
    (verified_income_sources + verified_deductions) /
    (total_expected_income_sources + total_expected_deductions)
) * 100
```

- Verified = accountant-confirmed extraction from a document
- Expected counts are derived from the client's intake profile (user_type + income_type flags)
- A ZZP client is expected to have: salary/invoice income + at least 1 business expense record

### Dimension 4 — Accountant Review (10%)

```
accountant_review_score = (
    (completed_actions / total_actions) * 60 +
    (engagement.accountant_confirmed ? 40 : 0)
)
```

- `total_actions` = open AccountantAction records for this engagement
- `accountant_confirmed` = boolean set manually by accountant to indicate "I have reviewed everything"

---

## ReadyToFile Gate

`ready_to_file = True` if and only if ALL of the following:
1. `readiness_score >= 85`
2. No required document is missing (documents_score = 100 OR all mandatory docs are approved/waived)
3. No checklist item with `priority=required` is in `todo` or `rejected` state
4. No document in `needs_review` state
5. `accountant_confirmed = True` (if engagement has an accountant)

---

## Trigger Events

The readiness score must be recalculated within 30 seconds of any of the following events:

| Event | Trigger mechanism |
|-------|------------------|
| Document status changed (any) | Celery task: `recalculate_readiness.delay(engagement_id)` |
| ChecklistItem status changed | Same Celery task |
| Extraction approved/rejected | Same Celery task |
| AccountantAction marked done | Same Celery task |
| `accountant_confirmed` toggled | Same Celery task |
| Engagement created | Run once immediately on creation |
| Intake profile updated | Re-evaluate expected doc/income counts |

---

## Recalculation Process

```python
def recalculate_readiness(engagement_id: UUID) -> ReadinessResult:
    engagement = TaxEngagement.objects.get(id=engagement_id)
    checklist_items = ChecklistItem.objects.filter(engagement=engagement)
    documents = ClientDocument.objects.filter(engagement=engagement)
    actions = AccountantAction.objects.filter(engagement=engagement)

    # 1. Compute 4 dimension scores
    doc_score = _compute_document_score(checklist_items, documents)
    checklist_score = _compute_checklist_score(checklist_items)
    verification_score = _compute_verification_score(engagement, documents)
    accountant_score = _compute_accountant_review_score(actions, engagement)

    # 2. Weighted total
    total = (doc_score * 0.4 + checklist_score * 0.3 +
             verification_score * 0.2 + accountant_score * 0.1)

    # 3. Gate check
    ready = _check_ready_to_file_gate(engagement, checklist_items, documents, total)

    # 4. Persist
    engagement.readiness_score = round(total)
    engagement.ready_to_file = ready
    engagement.readiness_updated_at = now()
    engagement.save(update_fields=["readiness_score", "ready_to_file", "readiness_updated_at"])

    # 5. Snapshot
    ReadinessSnapshot.objects.create(
        engagement=engagement,
        score=total,
        doc_score=doc_score,
        checklist_score=checklist_score,
        verification_score=verification_score,
        accountant_review_score=accountant_score,
        ready_to_file=ready,
        computed_at=now()
    )

    # 6. Status transition check
    _maybe_advance_engagement_status(engagement, ready)

    # 7. Milestone event
    _emit_readiness_milestone_if_crossed(engagement, total)

    return ReadinessResult(score=total, ready_to_file=ready, ...)
```

---

## ReadinessSnapshot Model

Every recalculation persists a snapshot for audit and trend analysis.

| Field | Type |
|-------|------|
| id | UUID |
| engagement | FK(TaxEngagement) |
| score | float |
| doc_score | float |
| checklist_score | float |
| verification_score | float |
| accountant_review_score | float |
| ready_to_file | boolean |
| computed_at | datetime |
| trigger_event | string (for debugging) |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/portal/engagements/{id}/readiness/` | Return current score + breakdown |
| POST | `/api/portal/engagements/{id}/readiness/recalculate/` | Force recalculation (admin/accountant) |
| GET | `/api/portal/engagements/{id}/readiness/history/` | List all snapshots (sorted by date) |

**Response schema:**
```json
{
  "score": 72,
  "ready_to_file": false,
  "dimensions": {
    "documents": { "score": 80, "weight": 0.4 },
    "checklist": { "score": 67, "weight": 0.3 },
    "verification": { "score": 60, "weight": 0.2 },
    "accountant_review": { "score": 50, "weight": 0.1 }
  },
  "blocking_items": [
    { "type": "missing_required_doc", "label": "Jaaropgaaf 2025", "checklist_item_id": "uuid" }
  ],
  "updated_at": "2026-06-13T10:30:00Z"
}
```

---

## Frontend Rendering

**ProgressRing component** (used in both portals):
- SVG circle, stroke-dasharray for fill percentage
- Color: red (#EF4444) < 50, amber (#F59E0B) 50–74, green (#22C55E) ≥ 75
- Animated transition on score change (300ms ease-in-out)
- Accessible: `aria-valuenow`, `aria-label="Readiness {score}%"`

**Dimension breakdown** (below the ring):
- 4 mini progress bars labeled Documents, Checklist, Verification, Review
- Each shows individual score × weight contribution

**Blocking items callout:**
- "What's preventing ReadyToFile?" shown when ready_to_file=False
- Lists up to 3 specific blocking items with direct action links

---

## NFR

| Requirement | Target |
|-------------|--------|
| Recalculation latency | < 500ms from trigger to DB write |
| Celery task retry | 3 retries with 10s backoff |
| Score drift | Cannot change without a DB-recorded trigger event |
| Snapshot retention | 7 years (matches audit log) |
| Concurrent recalculation | Idempotent — two simultaneous triggers produce the same final state |
