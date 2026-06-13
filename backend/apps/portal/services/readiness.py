"""
Deterministic readiness score engine.

Formula (matches PRD spec):
  score = doc_score * 0.4 + checklist_score * 0.3 + verification_score * 0.2 + accountant_review_score * 0.1

Each component is 0–100. Final score is 0–100.

Ready-to-file gate (ALL must pass):
  - score >= 85
  - zero missing required document requests
  - zero checklist items still in needs_review
  - accountant_confirmed is True or no required docs present yet

A ReadinessSnapshot is saved on every recalculation for audit trail.
"""
from __future__ import annotations
from django.utils import timezone


def calculate_readiness(engagement, trigger_event: str = "manual") -> dict:
    from apps.portal.models import (
        ChecklistItem, DocumentRequest, AccountantAction, ReadinessSnapshot
    )

    checklist = list(ChecklistItem.objects.filter(engagement=engagement))
    doc_requests = list(DocumentRequest.objects.filter(engagement=engagement))
    open_actions = list(AccountantAction.objects.filter(engagement=engagement, status="open"))

    # When a ChecklistItem is accepted/waived, its linked DocumentRequest
    # (stable_key = "req_" + checklist stable_key) should score as accepted.
    accepted_checklist_keys = {
        i.stable_key for i in checklist if i.status in ("accepted", "waived")
    }

    def _effective_status(r) -> str:
        if r.stable_key and r.stable_key.startswith("req_"):
            if r.stable_key[4:] in accepted_checklist_keys:
                return "accepted"
        return r.status

    # ── COMPONENT 1: Document score (40%) ─────────────────────────────────────
    # Full credit: accepted, waived. Partial credit (50%): uploaded, processing.
    # No credit: todo, rejected, needs_review (covered by verification score).
    req_total = len(doc_requests)
    if req_total == 0:
        doc_score = 100.0
    else:
        full_credit = sum(1 for r in doc_requests if _effective_status(r) in ("accepted", "waived"))
        half_credit = sum(1 for r in doc_requests if _effective_status(r) in ("uploaded", "processing"))
        doc_score = min(100.0, (full_credit + half_credit * 0.5) / req_total * 100)

    # ── COMPONENT 2: Checklist score (30%) ────────────────────────────────────
    # Required items only. accepted/waived = full, uploaded = 50%, else = 0.
    total_required = sum(1 for i in checklist if i.required)
    if total_required == 0:
        checklist_score = 100.0
    else:
        accepted_req = sum(1 for i in checklist if i.required and i.status in ("accepted", "waived"))
        uploaded_req = sum(1 for i in checklist if i.required and i.status == "uploaded")
        checklist_score = min(100.0, (accepted_req + uploaded_req * 0.5) / total_required * 100)

    # ── COMPONENT 3: Verification score (20%) ─────────────────────────────────
    # Measures how clean the review queue is. Start at 100, deduct for items
    # needing review or rejected.
    needs_review_docs = sum(1 for r in doc_requests if r.status == "needs_review")
    rejected_docs = sum(1 for r in doc_requests if r.status == "rejected")
    needs_review_checklist = sum(1 for i in checklist if i.required and i.status == "needs_review")

    total_items = req_total + total_required or 1
    penalty_pct = (needs_review_docs + needs_review_checklist) * 15 + rejected_docs * 20
    verification_score = max(0.0, 100.0 - min(penalty_pct, 100.0))

    # ── COMPONENT 4: Accountant review score (10%) ────────────────────────────
    # Full 100 when accountant_confirmed=True and no open high-priority actions.
    # 50 when confirmed but high-priority actions open. 0 when not confirmed.
    high_risk_actions = [a for a in open_actions if a.priority == "high"]
    if engagement.accountant_confirmed and not high_risk_actions:
        accountant_review_score = 100.0
    elif engagement.accountant_confirmed:
        accountant_review_score = 50.0
    else:
        accountant_review_score = 0.0

    # ── Weighted total ────────────────────────────────────────────────────────
    score = round(
        doc_score * 0.4
        + checklist_score * 0.3
        + verification_score * 0.2
        + accountant_review_score * 0.1,
        1,
    )

    # ── Missing / needs-review counts for gate logic ───────────────────────────
    missing_required = sum(
        1 for i in checklist
        if i.required and i.status in ("todo", "waiting_client", "rejected")
    )
    needs_review_total = needs_review_checklist + needs_review_docs

    # ── Ready-to-file gate ────────────────────────────────────────────────────
    ready_to_file = (
        score >= 85
        and missing_required == 0
        and needs_review_total == 0
        and not high_risk_actions
    )

    # ── Risk level ────────────────────────────────────────────────────────────
    blocking_reasons: list[str] = []
    next_actions: list[str] = []

    if missing_required > 0:
        blocking_reasons.append(f"{missing_required} required item(s) not provided")
        next_actions.append("Request missing documents from client")
    if needs_review_total > 0:
        blocking_reasons.append(f"{needs_review_total} item(s) awaiting review")
        next_actions.append("Review uploaded items")
    if rejected_docs > 0:
        blocking_reasons.append(f"{rejected_docs} document(s) rejected — re-upload needed")
        next_actions.append("Ask client to re-upload rejected documents")
    if high_risk_actions:
        blocking_reasons.append(f"{len(high_risk_actions)} high-priority action(s) open")
        next_actions.extend(a.title for a in high_risk_actions[:3])

    if missing_required >= 5 or len(high_risk_actions) >= 3:
        risk_level = "high"
    elif missing_required >= 2 or needs_review_total >= 2 or high_risk_actions:
        risk_level = "medium"
    else:
        risk_level = "low"

    # ── Persist engagement fields ─────────────────────────────────────────────
    engagement.readiness_score = score
    engagement.missing_items_count = missing_required
    engagement.risk_level = risk_level
    engagement.ready_to_file = ready_to_file
    engagement.readiness_updated_at = timezone.now()
    if ready_to_file and engagement.status not in ("filed", "completed", "archived"):
        engagement.status = "ready_to_file"
    engagement.save(update_fields=[
        "readiness_score", "missing_items_count", "risk_level",
        "ready_to_file", "readiness_updated_at", "status",
    ])

    # ── Immutable audit snapshot ──────────────────────────────────────────────
    ReadinessSnapshot.objects.create(
        engagement=engagement,
        score=score,
        doc_score=doc_score,
        checklist_score=checklist_score,
        verification_score=verification_score,
        accountant_review_score=accountant_review_score,
        ready_to_file=ready_to_file,
        trigger_event=trigger_event,
    )

    return {
        "score": score,
        "doc_score": doc_score,
        "checklist_score": checklist_score,
        "verification_score": verification_score,
        "accountant_review_score": accountant_review_score,
        "missing_required": missing_required,
        "needs_review": needs_review_total,
        "accepted": sum(1 for i in checklist if i.required and i.status in ("accepted", "waived")),
        "risk_level": risk_level,
        "blocking_reasons": blocking_reasons,
        "next_actions": next_actions[:5],
        "ready_to_file": ready_to_file,
    }
