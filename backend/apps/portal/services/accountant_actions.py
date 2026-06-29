"""
AI/rule-assisted action engine for the accountant portal.

generate_accountant_actions(engagement) creates AccountantAction records
based on deterministic rules. Each action has a suggested message to the client.

Deterministic engine generates base actions.
AI may only rewrite/explain them in friendly language (not implemented here
— this module is rule-only, consistent with the architecture principle that
the AI never computes or decides).
"""
from __future__ import annotations


def generate_accountant_actions(engagement) -> dict:
    """
    Idempotent. Returns structured dict with action list + counts.
    """
    import logging
    _log = logging.getLogger(__name__)

    from apps.portal.models import AccountantAction, ChecklistItem, ClientDocument, ExtractedIncome, ExtractedExpense
    from apps.portal.services.missing_info import detect_missing_information

    engine_result: dict = {"new_checklist_items": 0, "new_actions": 0}
    try:
        engine_result = detect_missing_information(engagement)
    except Exception as exc:
        _log.error("detect_missing_information failed for engagement %s: %s", engagement.id, exc)

    # Collect all open actions for response
    actions = list(
        AccountantAction.objects.filter(engagement=engagement, status="open")
        .order_by("-priority", "-created_at")
    )

    # Build suggested client messages for each action
    profile = engagement.client_profile
    lang = profile.preferred_language or "en"

    CLIENT_MESSAGES = {
        "request_document": {
            "nl": f"Beste {profile.first_name or 'klant'},\n\nWij hebben nog aanvullende documenten nodig voor uw belastingaangifte {engagement.tax_year}. Kunt u deze zo snel mogelijk uploaden via uw TaxWijs portal?\n\nMet vriendelijke groet,\nUw accountant",
            "en": f"Dear {profile.first_name or 'client'},\n\nWe still need some documents for your {engagement.tax_year} tax return. Please upload them through your TaxWijs portal at your earliest convenience.\n\nKind regards,\nYour accountant",
            "fa": f"با احترام {profile.first_name or 'مشتری گرامی'},\n\nبرای اظهارنامه مالیاتی {engagement.tax_year} شما هنوز به برخی مدارک نیاز داریم. لطفاً آن‌ها را از طریق پورتال TaxWijs خود آپلود کنید.\n\nبا احترام،\nحسابدار شما",
        },
        "review_document": {
            "nl": "Geüploade documenten wachten op beoordeling door de accountant.",
            "en": "Uploaded documents are waiting for accountant review.",
            "fa": "اسناد آپلود شده منتظر بررسی حسابدار هستند.",
        },
        "check_deduction": {
            "nl": "Mogelijke belastingaftrek gevonden — controleer of van toepassing.",
            "en": "Possible tax deduction found — verify if applicable.",
            "fa": "کسر مالیاتی احتمالی یافت شد — بررسی کنید که آیا قابل اعمال است.",
        },
    }

    action_list = []
    for action in actions:
        msg_map = CLIENT_MESSAGES.get(action.action_type, {})
        suggested_message = msg_map.get(lang, msg_map.get("en", ""))
        action_list.append({
            "id":                action.id,
            "title":             action.title,
            "body":              action.body,
            "action_type":       action.action_type,
            "priority":          action.priority,
            "status":            action.status,
            "suggested_message": suggested_message,
        })

    return {
        "actions":              action_list,
        "actions_count":        len(action_list),
        "new_checklist_items":  engine_result.get("new_checklist_items", 0),
        "new_actions":          engine_result.get("new_actions", 0),
    }
