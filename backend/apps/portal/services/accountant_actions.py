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

    name       = profile.first_name or None
    client_type = getattr(profile, "client_type", "other") or "other"
    year        = engagement.tax_year

    # Generic fallback messages per action type (all languages)
    _GENERIC = {
        "request_document": {
            "nl": f"Beste {name or 'klant'},\n\nWij hebben nog aanvullende documenten nodig voor uw belastingaangifte {year}. Kunt u deze zo snel mogelijk uploaden via uw TaxWijs portal?\n\nMet vriendelijke groet,\nUw accountant",
            "en": f"Dear {name or 'client'},\n\nWe still need some documents for your {year} tax return. Please upload them through your TaxWijs portal at your earliest convenience.\n\nKind regards,\nYour accountant",
            "fa": f"با احترام {name or 'مشتری گرامی'},\n\nبرای اظهارنامه مالیاتی {year} شما هنوز به برخی مدارک نیاز داریم. لطفاً آن‌ها را از طریق پورتال TaxWijs خود آپلود کنید.\n\nبا احترام،\nحسابدار شما",
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
        "prepare_filing": {
            "nl": f"Het dossier voor belastingaangifte {year} is compleet en klaar voor indiening.",
            "en": f"The {year} tax return file is complete and ready to file.",
            "fa": f"پرونده اظهارنامه مالیاتی {year} کامل است و آماده ارسال می‌باشد.",
        },
    }

    # Client-type-specific overrides for request_document
    _TYPE_OVERRIDES: dict[str, dict[str, dict[str, str]]] = {
        "zzp": {
            "request_document": {
                "nl": f"Beste {name or 'klant'},\n\nVoor uw aangifte als zzp'er {year} hebben wij nog documenten nodig: urenregistratie (voor de zelfstandigenaftrek van €1.200, minimaal 1.225 uur), BTW-aangiftes en een overzicht van uw winst en verlies. Upload deze via uw TaxWijs portal.\n\nLet op: ZVW-bijdrage (4,85% over nettowinst) is dit jaar ook verschuldigd.\n\nMet vriendelijke groet,\nUw accountant",
                "en": f"Dear {name or 'client'},\n\nFor your {year} self-employed (zzp) tax return we still need: your hour log (required for the €1,200 zelfstandigenaftrek — min. 1,225 hrs), BTW returns, and a profit/loss statement. Please upload via TaxWijs.\n\nNote: ZVW health contribution (4.85% on net profit) is also due this year.\n\nKind regards,\nYour accountant",
                "fa": f"با احترام {name or 'مشتری گرامی'},\n\nبرای اظهارنامه مالیاتی {year} به عنوان فریلنسر (zzp) هنوز به مدارک زیر نیاز داریم: ثبت ساعات کار (برای کسر ۱٬۲۰۰ یورویی، حداقل ۱٬۲۲۵ ساعت)، اظهارنامه‌های BTW و صورت سود و زیان. لطفاً از طریق پورتال TaxWijs آپلود کنید.\n\nتوجه: مشارکت ZVW (۴٫۸۵٪ از سود خالص) نیز امسال باید پرداخت شود.\n\nبا احترام،\nحسابدار شما",
            },
        },
    }

    type_overrides = _TYPE_OVERRIDES.get(client_type, {})

    def _resolve_message(action_type: str) -> dict[str, str]:
        return type_overrides.get(action_type) or _GENERIC.get(action_type) or {}

    CLIENT_MESSAGES = {
        action_type: _resolve_message(action_type)
        for action_type in ("request_document", "review_document", "check_deduction", "prepare_filing")
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
