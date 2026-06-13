# Readiness Score Formula — TaxWijs

> Precise specification of the engagement readiness calculation: formula, components, gating rules, effective status logic, examples, and explanation templates.

---

## 1. Formula

```
score = doc_score × 0.40
      + checklist_score × 0.30
      + verification_score × 0.20
      + accountant_review_score × 0.10
```

Each component is 0–100. Final score is rounded to 1 decimal place (0.0–100.0).

---

## 2. Component Definitions

### 2.1 Document Score (40%)

Measures the completeness of submitted documents relative to all document requests.

```python
req_total = len(doc_requests)
if req_total == 0:
    doc_score = 100.0
else:
    full_credit = count where effective_status(r) in ("accepted", "waived")
    half_credit = count where effective_status(r) in ("uploaded", "processing")
    doc_score = min(100.0, (full_credit + half_credit × 0.5) / req_total × 100)
```

**Effective status:** When a `ChecklistItem` is accepted or waived, its linked `DocumentRequest` (stable_key = `req_` + checklist stable_key) is treated as accepted for scoring purposes. This prevents double-penalty when an accountant accepts a checklist item but the corresponding document request status has not been explicitly updated.

```python
def effective_status(doc_request) -> str:
    if doc_request.stable_key.startswith("req_"):
        checklist_key = doc_request.stable_key[4:]
        if checklist_key in accepted_checklist_keys:
            return "accepted"
    return doc_request.status
```

| Document Status | Score Credit |
|----------------|-------------|
| accepted | Full (1.0) |
| waived | Full (1.0) |
| uploaded | Half (0.5) |
| processing | Half (0.5) |
| todo | None (0.0) |
| rejected | None (0.0) |
| needs_review | None (0.0) |

---

### 2.2 Checklist Score (30%)

Measures required checklist items only. Optional items (required=False) are excluded from this score.

```python
total_required = count where checklist_item.required == True
if total_required == 0:
    checklist_score = 100.0
else:
    accepted_req = count where required AND status in ("accepted", "waived")
    uploaded_req = count where required AND status == "uploaded"
    checklist_score = min(100.0, (accepted_req + uploaded_req × 0.5) / total_required × 100)
```

---

### 2.3 Verification Score (20%)

Measures how clean the review queue is. Penalizes items awaiting review or rejected.

```python
needs_review_docs = count doc_requests where status == "needs_review"
rejected_docs = count doc_requests where status == "rejected"
needs_review_checklist = count checklist_items where required AND status == "needs_review"

penalty_pct = needs_review_docs × 15 + needs_review_checklist × 15 + rejected_docs × 20
verification_score = max(0.0, 100.0 - min(penalty_pct, 100.0))
```

| Issue | Penalty |
|-------|---------|
| Document needs_review | −15 points |
| Required checklist item needs_review | −15 points |
| Document rejected | −20 points |

---

### 2.4 Accountant Review Score (10%)

```python
high_risk_actions = [a for a in open_actions if a.priority == "high"]

if engagement.accountant_confirmed and not high_risk_actions:
    accountant_review_score = 100.0
elif engagement.accountant_confirmed and high_risk_actions:
    accountant_review_score = 50.0
else:  # not confirmed
    accountant_review_score = 0.0
```

---

## 3. Ready-to-File Gate

A score ≥ 85 is necessary but not sufficient. All four conditions must pass:

```python
ready_to_file = (
    score >= 85
    and missing_required == 0        # no required items in todo/waiting_client/rejected
    and needs_review_total == 0      # no items awaiting review
    and not high_risk_actions        # no open high-priority accountant actions
)
```

If `ready_to_file` becomes True and `engagement.status` is not `filed/completed/archived`, the status automatically advances to `ready_to_file`.

---

## 4. Per-Persona Adjustments

| User Type | Additional Gate |
|-----------|----------------|
| ZZP | Wet DBA risk must be "low" or "medium" for ready-to-file gate |
| DGA | Gebruikelijk loon check must be confirmed (≥ €56,000) |
| Expat | 30% ruling decision letter status must be documented (accepted or waived) |
| Employee | No additional gate beyond standard formula |

---

## 5. Worked Examples

### Example A: ZZP — All accepted, accountant not yet confirmed

| Component | Value | Weight | Contribution |
|-----------|-------|--------|-------------|
| doc_score | 100 | 0.40 | 40.0 |
| checklist_score | 100 | 0.30 | 30.0 |
| verification_score | 100 | 0.20 | 20.0 |
| accountant_review_score | 0 | 0.10 | 0.0 |
| **Total** | | | **90.0** |

Ready-to-file: ❌ (score ≥ 85 ✅, but accountant not confirmed — high_risk_actions check may pass, needs_review = 0 ✅ — actually if accountant_confirmed=False and all else pass, ready_to_file = False because the gate logic checks accountant_confirmed separately via open actions. Score = 90 but engagement stays in `review` status until accountant confirms.)

### Example B: Employee — 3 of 5 required docs uploaded, 1 rejected, accountant confirmed

```
doc_requests: 5 total → 2 accepted + 1 uploaded + 1 rejected + 1 todo
doc_score = (2 + 0.5×1) / 5 × 100 = 50.0

checklist_items: 5 required → 2 accepted + 1 uploaded + 1 rejected + 1 todo
checklist_score = (2 + 0.5×1) / 5 × 100 = 50.0

verification_score = 100 - 20 (rejected doc) = 80.0

accountant_review_score = 100 (confirmed, no high-risk actions)

score = 50×0.4 + 50×0.3 + 80×0.2 + 100×0.1
      = 20 + 15 + 16 + 10 = 61.0
```

Ready-to-file: ❌ (score < 85; missing_required = 1; rejected doc exists)

### Example C: DGA — All items accepted, accountant confirmed, no issues

```
doc_score = 100.0
checklist_score = 100.0
verification_score = 100.0
accountant_review_score = 100.0

score = 40 + 30 + 20 + 10 = 100.0
```

Ready-to-file: ✅ (assuming gebruikelijk loon confirmed and no DGA-specific gate failures)

---

## 6. Snapshot and History

Every call to `calculate_readiness()` creates a `ReadinessSnapshot` row:
- Immutable audit record (never updated)
- Records all 4 component scores + final score + trigger_event + timestamp
- Enables trend display ("Your readiness has improved from 61 → 90 since last week")

---

## 7. Explanation Templates

```python
# Score improved
f"Your readiness increased from {prev_score} to {score}. "
f"{len(newly_accepted)} item(s) were accepted since your last check."

# Items missing
f"Your score is {score}. To reach ready-to-file ({85}), you need: "
+ "; ".join([f"upload {item.title}" for item in missing_required_items[:3]])

# Score capped
f"Your weighted score is {weighted_score}, but it is capped at 80 because "
f"a mandatory document ({mandatory_missing.title}) has not been received."

# Ready to file
f"You are ready to file. All required documents are verified and your accountant "
f"has confirmed the review. Your tax return for {year} can now be submitted."
```
