"""
Deterministic checklist templates by client type.
AI may only suggest ADDITIONAL items after this base checklist is generated.
"""

from __future__ import annotations
from typing import List, Dict, Any


CHECKLISTS: Dict[str, List[Dict[str, Any]]] = {
    "zzp": [
        {"stable_key": "zzp_kvk",               "title": "KVK number",                          "description": "Chamber of Commerce registration number",                          "category": "identity",   "required": True,  "priority": "high", "task_type": "info"},
        {"stable_key": "zzp_btw",               "title": "BTW (VAT) number",                    "description": "OB-nummer for VAT returns",                                        "category": "identity",   "required": True,  "priority": "high", "task_type": "info"},
        {"stable_key": "zzp_start_date",        "title": "Business start date",                 "description": "Date of KVK registration / business start",                       "category": "identity",   "required": True,  "priority": "high", "task_type": "info"},
        {"stable_key": "zzp_revenue",           "title": "Annual revenue (total invoiced)",     "description": "Total turnover for the tax year — all client invoices",           "category": "income",     "required": True,  "priority": "high", "task_type": "info"},
        {"stable_key": "zzp_sales_invoices",    "title": "Sales invoices",                      "description": "All client invoices issued during the year",                      "category": "income",     "required": True,  "priority": "high"},
        {"stable_key": "zzp_purchase_invoices", "title": "Purchase invoices / receipts",        "description": "All business purchase invoices and receipts",                     "category": "expense",    "required": True,  "priority": "high"},
        {"stable_key": "zzp_bank_statements",   "title": "Bank statements or bookkeeping export","description": "Full-year business bank statements or accounting export",         "category": "bank",       "required": True,  "priority": "high"},
        {"stable_key": "zzp_btw_returns",       "title": "BTW returns Q1–Q4",                   "description": "All submitted VAT returns for the year",                          "category": "vat",        "required": True,  "priority": "high"},
        {"stable_key": "zzp_hours",             "title": "Hours registration (urencriterium)",  "description": "1,225+ hours required for zelfstandigenaftrek — log or summary",  "category": "compliance", "required": True,  "priority": "high", "task_type": "info"},
        {"stable_key": "zzp_laptop",            "title": "Laptop / equipment invoices",         "description": "Invoices for business equipment purchased this year",             "category": "expense",    "required": False, "priority": "medium"},
        {"stable_key": "zzp_software",          "title": "Software subscriptions",              "description": "Annual software and SaaS costs",                                  "category": "expense",    "required": False, "priority": "medium"},
        {"stable_key": "zzp_travel",            "title": "Travel costs / mileage log",          "description": "Public transport costs or km-log for business travel",           "category": "expense",    "required": False, "priority": "medium"},
        {"stable_key": "zzp_car",               "title": "Car costs / bijtelling",              "description": "Car usage for business — lease info or private car km-log",      "category": "expense",    "required": False, "priority": "medium"},
        {"stable_key": "zzp_home_office",       "title": "Home office information",             "description": "Dedicated work space at home — size, rent/mortgage info",        "category": "expense",    "required": False, "priority": "low"},
        {"stable_key": "zzp_insurance",         "title": "Insurance costs",                     "description": "Business-related insurance premiums",                             "category": "expense",    "required": False, "priority": "low"},
        {"stable_key": "zzp_accountant_costs",  "title": "Accountant / bookkeeping costs",      "description": "Accountant or bookkeeping fees paid this year",                  "category": "expense",    "required": False, "priority": "medium"},
        {"stable_key": "zzp_training",          "title": "Training / course costs",             "description": "Professional development and education costs",                   "category": "expense",    "required": False, "priority": "low"},
        {"stable_key": "zzp_pension",           "title": "Pension / lijfrente payments",        "description": "Voluntary pension premiums for jaarruimte deduction",            "category": "pension",    "required": False, "priority": "medium"},
        {"stable_key": "zzp_kia",               "title": "KIA investment list",                 "description": "Business assets >€450 bought this year for KIA deduction",      "category": "deductions", "required": False, "priority": "medium"},
        {"stable_key": "zzp_wet_dba_clients",   "title": "Wet DBA — number of clients",         "description": "How many clients worked with, % from largest client",            "category": "compliance", "required": True,  "priority": "high", "task_type": "info"},
        {"stable_key": "zzp_wet_dba_contracts", "title": "Wet DBA — contract type",             "description": "Free-text or formal contracts with main clients",                "category": "compliance", "required": False, "priority": "medium"},
    ],

    "other": [
        {"stable_key": "oth_identity",           "title": "Identity document",                  "description": "Valid passport or Dutch ID",                                     "category": "identity",   "required": True,  "priority": "high"},
        {"stable_key": "oth_income_sources",     "title": "Income sources",                     "description": "Overview of all income received during the tax year",           "category": "income",     "required": True,  "priority": "high"},
        {"stable_key": "oth_employment_status",  "title": "Employment / business status",       "description": "Employer, self-employed, or benefit recipient",                  "category": "identity",   "required": True,  "priority": "high"},
        {"stable_key": "oth_partner",            "title": "Partner information",                "description": "Fiscal partner status and income",                               "category": "household",  "required": False, "priority": "medium"},
        {"stable_key": "oth_assets",             "title": "Assets overview",                    "description": "Savings, investments, property — all Box 3 items",              "category": "box3",       "required": False, "priority": "medium"},
        {"stable_key": "oth_notes",              "title": "Notes for accountant review",        "description": "Any special circumstances the accountant should know about",    "category": "other",      "required": False, "priority": "low"},
    ],
}


def generate_checklist_for_engagement(engagement) -> list:
    """
    Returns a list of ChecklistItem-ready dicts for the given engagement.
    Uses the client_profile.client_type to pick the template.
    Does NOT write to DB — caller does that.
    """
    client_type = engagement.client_profile.client_type or "zzp"
    template = CHECKLISTS.get(client_type, CHECKLISTS["zzp"])

    items = []
    for item in template:
        items.append({
            "engagement":     engagement,
            "client_profile": engagement.client_profile,
            "title":          item["title"],
            "description":    item["description"],
            "category":       item["category"],
            "required":       item["required"],
            "priority":       item["priority"],
            "stable_key":     item["stable_key"],
            "task_type":      item.get("task_type", "document"),
            "source":         "template",
            "status":         "todo",
        })
    return items


def create_checklist_for_engagement(engagement) -> int:
    """
    Idempotent: creates ChecklistItem rows for engagement.
    Skips items whose stable_key already exists.
    Returns number of items created.
    """
    from apps.portal.models import ChecklistItem, DocumentRequest

    existing_keys = set(
        ChecklistItem.objects.filter(engagement=engagement)
        .values_list("stable_key", flat=True)
    )
    items_data = generate_checklist_for_engagement(engagement)
    created = 0

    for item_data in items_data:
        key = item_data["stable_key"]
        if key in existing_keys:
            continue
        ChecklistItem.objects.create(**item_data)
        created += 1

        # Create a matching DocumentRequest for required items
        if item_data["required"]:
            req_key = f"req_{key}"
            if not DocumentRequest.objects.filter(
                engagement=engagement, stable_key=req_key
            ).exists():
                DocumentRequest.objects.create(
                    engagement=engagement,
                    client_profile=engagement.client_profile,
                    title=item_data["title"],
                    description=item_data["description"],
                    request_type=_map_category_to_request_type(item_data["category"]),
                    required=True,
                    created_by="rule_engine",
                    stable_key=req_key,
                )

    return created


def _map_category_to_request_type(category: str) -> str:
    mapping = {
        "identity":   "identity",
        "income":     "income",
        "expense":    "expense",
        "bank":       "bank",
        "payroll":    "payroll",
        "property":   "mortgage",
        "pension":    "pension",
        "box3":       "bank",
        "box2":       "investment",
        "vat":        "vat",
        "compliance": "contract",
        "business":   "business",
        "deductions": "other",
        "household":  "other",
        "toeslagen":  "other",
        "other":      "other",
    }
    return mapping.get(category, "other")
