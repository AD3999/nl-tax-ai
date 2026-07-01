"""
Deterministic missing-information detection engine.

detect_missing_information(engagement) inspects the current state of
checklist items, uploaded documents, and client profile to generate
new ChecklistItem and AccountantAction records.

Idempotent: uses stable_key to avoid creating duplicates.
"""
from __future__ import annotations
from typing import List


def detect_missing_information(engagement) -> dict:
    """
    Inspect engagement and create any missing checklist items / actions.
    Returns summary dict.
    """
    from apps.portal.models import ChecklistItem, AccountantAction, ClientDocument

    profile = engagement.client_profile

    new_items   = 0
    new_actions = 0

    existing_item_keys   = set(ChecklistItem.objects.filter(engagement=engagement).values_list("stable_key", flat=True))
    existing_action_keys = set(AccountantAction.objects.filter(engagement=engagement).values_list("stable_key", flat=True))
    uploaded_doc_types   = set(ClientDocument.objects.filter(engagement=engagement).values_list("document_type", flat=True))

    def _add_item(key, title, description, category, required=True, priority="medium"):
        nonlocal new_items
        if key in existing_item_keys:
            return
        ChecklistItem.objects.create(
            engagement=engagement,
            client_profile=profile,
            title=title,
            description=description,
            category=category,
            required=required,
            priority=priority,
            stable_key=key,
            source="rule_engine",
        )
        existing_item_keys.add(key)
        new_items += 1

    def _add_action(key, title, body, action_type, priority="medium"):
        nonlocal new_actions
        if key in existing_action_keys:
            return
        AccountantAction.objects.create(
            engagement=engagement,
            client_profile=profile,
            title=title,
            body=body,
            action_type=action_type,
            priority=priority,
            stable_key=key,
            source="rule_engine",
        )
        existing_action_keys.add(key)
        new_actions += 1

    # ── ZZP rules (unconditional — every client is ZZP) ──────────────────────

    if not ChecklistItem.objects.filter(engagement=engagement, stable_key="zzp_hours", status__in=("accepted", "waived")).exists():
        _add_item(
            "det_zzp_hours", "Hours registration (urencriterium)",
            "Client must prove 1,225+ hours to qualify for zelfstandigenaftrek. Request an hour log or summary.",
            "compliance", required=True, priority="high"
        )
        _add_action(
            "act_zzp_hours", "Request hour registration from client",
            "ZZP client has not yet provided hours registration. Zelfstandigenaftrek (€1,200) requires 1,225+ hours/year. Send reminder to upload hour log.",
            "request_document", priority="high"
        )

    if not ChecklistItem.objects.filter(engagement=engagement, stable_key="zzp_btw_returns", status__in=("accepted", "waived")).exists():
        _add_item(
            "det_zzp_btw", "BTW quarterly returns",
            "All 4 BTW returns (Q1–Q4) should be uploaded or confirmed as submitted.",
            "vat", required=True, priority="high"
        )
        _add_action(
            "act_zzp_btw", "Confirm BTW returns submitted",
            "No BTW returns on file. Ask client to confirm all quarterly returns were submitted or upload confirmations.",
            "request_document", priority="high"
        )

    # ── Universal rules ────────────────────────────────────────────────────────

    pending_review_docs = ClientDocument.objects.filter(
        engagement=engagement, processing_status__in=("uploaded", "extracted")
    ).count()
    if pending_review_docs > 0:
        _add_action(
            f"act_review_docs_{pending_review_docs}", f"Review {pending_review_docs} uploaded document(s)",
            f"{pending_review_docs} document(s) have been uploaded by the client and are waiting for accountant review.",
            "review_document", priority="medium"
        )

    from apps.portal.services.readiness import calculate_readiness
    readiness = calculate_readiness(engagement)
    if readiness["ready_to_file"]:
        _add_action(
            "act_ready_to_file", "Engagement is ready to file",
            "All required documents are collected and reviewed. The engagement can now be filed.",
            "prepare_filing", priority="high"
        )

    return {
        "new_checklist_items": new_items,
        "new_actions": new_actions,
        "readiness": readiness,
    }
