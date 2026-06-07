"""
Deterministic readiness score engine.

calculate_readiness(engagement) -> dict with score 0-100, missing counts,
risk_level, blocking_reasons, and next_actions.

Engagement is only ready_to_file when:
  score >= 85 AND missing_required == 0 AND needs_review == 0 AND no blocking risks.
"""
from __future__ import annotations


def calculate_readiness(engagement) -> dict:
    from apps.portal.models import ChecklistItem, DocumentRequest, AccountantAction

    checklist = list(ChecklistItem.objects.filter(engagement=engagement))
    requests  = list(DocumentRequest.objects.filter(engagement=engagement))

    # ── Count checklist states ────────────────────────────────────────────────
    total_required    = sum(1 for i in checklist if i.required)
    accepted_required = sum(1 for i in checklist if i.required and i.status in ("accepted", "waived"))
    uploaded_required = sum(1 for i in checklist if i.required and i.status == "uploaded")
    needs_review_req  = sum(1 for i in checklist if i.required and i.status == "needs_review")
    missing_required  = sum(1 for i in checklist if i.required and i.status in ("todo", "waiting_client", "rejected"))

    # Optional items
    accepted_optional = sum(1 for i in checklist if not i.required and i.status in ("accepted", "waived"))

    # Document requests pending review
    docs_needs_review = sum(1 for r in requests if r.status == "needs_review")
    docs_rejected     = sum(1 for r in requests if r.status == "rejected")

    # ── Score calculation ─────────────────────────────────────────────────────
    if total_required == 0:
        base_score = 60
    else:
        base_score = int((accepted_required / total_required) * 80)

    # Bonus for uploaded-but-not-yet-reviewed
    base_score += min(uploaded_required * 3, 10)

    # Bonus for optional items
    base_score += min(accepted_optional * 2, 10)

    # Penalty
    base_score -= needs_review_req * 5
    base_score -= docs_needs_review * 3
    base_score -= docs_rejected * 10

    score = max(0, min(100, base_score))

    # ── Risk level ───────────────────────────────────────────────────────────
    blocking_reasons = []
    next_actions = []

    if missing_required > 0:
        blocking_reasons.append(f"{missing_required} required document(s) not yet provided")
        next_actions.append("Request missing documents from client")

    if needs_review_req > 0:
        blocking_reasons.append(f"{needs_review_req} checklist item(s) uploaded but not reviewed")
        next_actions.append("Review uploaded checklist items")

    if docs_needs_review > 0:
        blocking_reasons.append(f"{docs_needs_review} document request(s) need review")
        next_actions.append("Review uploaded documents")

    if docs_rejected > 0:
        blocking_reasons.append(f"{docs_rejected} document(s) were rejected — re-upload needed")
        next_actions.append("Ask client to re-upload rejected documents")

    # Risk from open actions
    open_actions = AccountantAction.objects.filter(engagement=engagement, status="open")
    high_risk_actions = [a for a in open_actions if a.priority == "high"]
    if high_risk_actions:
        blocking_reasons.append(f"{len(high_risk_actions)} high-priority action(s) open")
        next_actions.extend([a.title for a in high_risk_actions[:3]])

    if missing_required >= 5 or len(high_risk_actions) >= 3:
        risk_level = "high"
    elif missing_required >= 2 or needs_review_req >= 2 or len(high_risk_actions) >= 1:
        risk_level = "medium"
    else:
        risk_level = "low"

    # ── Ready-to-file gate ───────────────────────────────────────────────────
    ready_to_file = (
        score >= 85
        and missing_required == 0
        and needs_review_req == 0
        and docs_needs_review == 0
        and not high_risk_actions
    )

    # ── Update the engagement record ─────────────────────────────────────────
    engagement.readiness_score    = score
    engagement.missing_items_count = missing_required
    engagement.risk_level         = risk_level
    if ready_to_file and engagement.status not in ("filed", "completed"):
        engagement.status = "ready_to_file"
    engagement.save(update_fields=["readiness_score", "missing_items_count", "risk_level", "status"])

    return {
        "score":            score,
        "missing_required": missing_required,
        "needs_review":     needs_review_req + docs_needs_review,
        "accepted":         accepted_required,
        "risk_level":       risk_level,
        "blocking_reasons": blocking_reasons,
        "next_actions":     next_actions[:5],
        "ready_to_file":    ready_to_file,
    }
