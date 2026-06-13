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

    client_type = engagement.client_profile.client_type or "other"
    profile     = engagement.client_profile

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

    # ── ZZP-specific rules ────────────────────────────────────────────────────
    if client_type == "zzp":
        if "jaaropgave" not in uploaded_doc_types and not ChecklistItem.objects.filter(engagement=engagement, stable_key="zzp_hours", status__in=("accepted","waived")).exists():
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

        if not ChecklistItem.objects.filter(engagement=engagement, stable_key="zzp_btw_returns", status__in=("accepted","waived")).exists():
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

    # ── Employee-specific rules ───────────────────────────────────────────────
    if client_type == "employee":
        if "jaaropgave" not in uploaded_doc_types and not ChecklistItem.objects.filter(engagement=engagement, stable_key__in=("emp_jaaropgave","det_emp_jaaropgave"), status__in=("accepted","waived")).exists():
            _add_item(
                "det_emp_jaaropgave", "Jaaropgave still missing",
                "The annual income statement is the most critical document for the IB return. Request from client.",
                "income", required=True, priority="high"
            )
            _add_action(
                "act_emp_jaaropgave", "Request Jaaropgave from client",
                "Employee client has not uploaded their Jaaropgave. This is required for the IB return. Send reminder.",
                "request_document", priority="high"
            )

    # ── Expat-specific rules ──────────────────────────────────────────────────
    if client_type == "expat":
        ruling_item = ChecklistItem.objects.filter(engagement=engagement, stable_key__in=("exp_30pct_ruling","det_exp_30pct")).first()
        if not ruling_item or ruling_item.status == "todo":
            _add_item(
                "det_exp_30pct", "30% ruling status unknown",
                "Confirm whether the 30% ruling applies. Request decision letter or confirmation from client.",
                "deductions", required=True, priority="high"
            )
            _add_action(
                "act_exp_30pct", "Request 30% ruling decision or status",
                "Expat client has not confirmed 30%-ruling status. Request the Belastingdienst decision letter or written confirmation that it does not apply.",
                "request_document", priority="high"
            )

        mform_item = ChecklistItem.objects.filter(engagement=engagement, stable_key="exp_m_form").first()
        if not mform_item or mform_item.status == "todo":
            _add_action(
                "act_exp_mform", "Check M-form requirement for partial-year resident",
                "Confirm arrival date in NL. If client arrived after 1 January, the M-form (migrant form) applies instead of the standard C-form.",
                "check_deduction", priority="medium"
            )

    # ── DGA-specific rules ────────────────────────────────────────────────────
    if client_type == "dga":
        salary_item = ChecklistItem.objects.filter(engagement=engagement, stable_key__in=("dga_salary","det_dga_salary")).first()
        if not salary_item or salary_item.status == "todo":
            _add_item(
                "det_dga_salary", "DGA salary / gebruikelijk loon not confirmed",
                "DGA minimum salary in 2026 is €56,000. Request salary slip or payroll confirmation.",
                "income", required=True, priority="high"
            )
            _add_action(
                "act_dga_salary", "Request DGA salary / payroll info",
                "DGA gebruikelijk loon not on file. Minimum is €56,000 in 2026. Request payslip or payroll summary.",
                "request_document", priority="high"
            )

        annual_accounts = ChecklistItem.objects.filter(engagement=engagement, stable_key__in=("dga_annual_accounts","det_dga_accounts")).first()
        if not annual_accounts or annual_accounts.status == "todo":
            _add_item(
                "det_dga_accounts", "Annual accounts BV not received",
                "The BV jaarrekening is required for the DGA personal return and Box 2 reporting.",
                "business", required=True, priority="high"
            )

    # ── Universal rules (all client types) ───────────────────────────────────

    # Documents uploaded but not yet extracted/reviewed
    pending_review_docs = ClientDocument.objects.filter(
        engagement=engagement, processing_status__in=("uploaded", "extracted")
    ).count()
    if pending_review_docs > 0:
        _add_action(
            f"act_review_docs_{pending_review_docs}", f"Review {pending_review_docs} uploaded document(s)",
            f"{pending_review_docs} document(s) have been uploaded by the client and are waiting for accountant review.",
            "review_document", priority="medium"
        )

    # Check readiness
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
