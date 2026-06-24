"""
Deterministic checklist templates by client type.
AI may only suggest ADDITIONAL items after this base checklist is generated.
"""

from __future__ import annotations
from typing import List, Dict, Any


CHECKLISTS: Dict[str, List[Dict[str, Any]]] = {
    "employee": [
        {"stable_key": "emp_personal_details",   "title": "Personal details",                    "description": "Full name, BSN, address, date of birth",                           "category": "identity",   "required": True,  "priority": "high"},
        {"stable_key": "emp_bsn",                "title": "BSN / identification confirmation",   "description": "Dutch social security number confirmed or ID copy",                "category": "identity",   "required": True,  "priority": "high"},
        {"stable_key": "emp_jaaropgave",         "title": "Jaaropgave (year statement)",         "description": "Annual income statement from employer — required for IB return",   "category": "income",     "required": True,  "priority": "high"},
        {"stable_key": "emp_payslips",           "title": "Payslips (if jaaropgave missing)",    "description": "Monthly payslips as alternative to jaaropgave",                   "category": "income",     "required": False, "priority": "medium"},
        {"stable_key": "emp_partner_info",       "title": "Partner information",                 "description": "Partner BSN, income, and employment status if applicable",        "category": "household",  "required": False, "priority": "medium"},
        {"stable_key": "emp_mortgage",           "title": "Mortgage annual statement",           "description": "Hypotheekrente — annual mortgage statement from lender",          "category": "property",   "required": False, "priority": "high"},
        {"stable_key": "emp_woz",                "title": "WOZ value of home",                   "description": "WOZ-beschikking for the reference year",                           "category": "property",   "required": False, "priority": "high"},
        {"stable_key": "emp_box3_bank",          "title": "Bank/savings balances (Box 3)",       "description": "All bank and savings balances on 1 January",                      "category": "box3",       "required": False, "priority": "medium"},
        {"stable_key": "emp_box3_investments",   "title": "Investment portfolio values (Box 3)", "description": "Value of shares, bonds, funds on 1 January",                      "category": "box3",       "required": False, "priority": "medium"},
        {"stable_key": "emp_pension",            "title": "Pension / lijfrente statement",       "description": "Paid pension premiums or lijfrente for jaarruimte deduction",     "category": "pension",    "required": False, "priority": "medium"},
        {"stable_key": "emp_medical",            "title": "Healthcare / medical deductions",     "description": "Medical expenses exceeding the drempel (threshold)",              "category": "deductions", "required": False, "priority": "low"},
        {"stable_key": "emp_donations",          "title": "Donation receipts",                   "description": "ANBI-registered charity donations for giftenaftrek",              "category": "deductions", "required": False, "priority": "low"},
        {"stable_key": "emp_childcare",          "title": "Childcare / family information",      "description": "Number of children, ages, kinderopvang costs",                   "category": "household",  "required": False, "priority": "medium"},
        {"stable_key": "emp_toeslagen",          "title": "Toeslagen information",               "description": "Current toeslagen received — zorgtoeslag, huurtoeslag",           "category": "toeslagen",  "required": False, "priority": "medium"},
    ],

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

    "expat": [
        {"stable_key": "exp_employment_contract","title": "Employment contract",               "description": "Contract with Dutch employer",                                     "category": "income",     "required": True,  "priority": "high"},
        {"stable_key": "exp_jaaropgave",         "title": "Jaaropgave",                         "description": "Annual income statement from Dutch employer",                     "category": "income",     "required": True,  "priority": "high"},
        {"stable_key": "exp_30pct_ruling",       "title": "30% ruling decision letter",         "description": "Beslissing 30%-regeling if applicable",                          "category": "deductions", "required": False, "priority": "high"},
        {"stable_key": "exp_start_date",         "title": "Start date in the Netherlands",      "description": "Date of first arrival / work start in NL",                       "category": "identity",   "required": True,  "priority": "high", "task_type": "info"},
        {"stable_key": "exp_prev_country",       "title": "Previous country of residence",      "description": "Country of tax residency before moving to NL",                   "category": "identity",   "required": True,  "priority": "high", "task_type": "info"},
        {"stable_key": "exp_foreign_income",     "title": "Foreign income",                     "description": "Any income received from abroad during the year",                "category": "income",     "required": False, "priority": "high"},
        {"stable_key": "exp_foreign_assets",     "title": "Foreign assets (Box 3)",             "description": "Bank accounts, property, investments held abroad on 1 January",  "category": "box3",       "required": False, "priority": "high"},
        {"stable_key": "exp_partner_family",     "title": "Partner / family information",       "description": "Partner and dependent children status",                          "category": "household",  "required": False, "priority": "medium"},
        {"stable_key": "exp_m_form",             "title": "M-form relevance",                   "description": "Partial-year resident — M-form may apply instead of C-form",    "category": "compliance", "required": False, "priority": "high"},
        {"stable_key": "exp_housing",            "title": "Housing / mortgage / rent",          "description": "Dutch housing costs — mortgage or rent amount",                  "category": "property",   "required": False, "priority": "medium"},
        {"stable_key": "exp_box3",               "title": "Box 3 assets (NL)",                  "description": "Dutch bank and investment balances on 1 January",                "category": "box3",       "required": False, "priority": "medium"},
        {"stable_key": "exp_pension",            "title": "Pension / lijfrente",                "description": "NL and foreign pension contributions",                           "category": "pension",    "required": False, "priority": "medium"},
        {"stable_key": "exp_residency",          "title": "Tax residency notes",                "description": "Formal tax residency position if dual-residency risk",           "category": "compliance", "required": False, "priority": "medium"},
    ],

    "dga": [
        {"stable_key": "dga_bv_details",         "title": "BV company details",                 "description": "BV name, KVK number, RSIN",                                      "category": "identity",   "required": True,  "priority": "high"},
        {"stable_key": "dga_kvk",                "title": "KVK extract BV",                     "description": "Current KVK Uittreksel for the BV",                              "category": "identity",   "required": True,  "priority": "high"},
        {"stable_key": "dga_shareholding",       "title": "Shareholding percentage",            "description": "DGA's % in the BV (≥5% = AB-houder for Box 2)",                 "category": "box2",       "required": True,  "priority": "high", "task_type": "info"},
        {"stable_key": "dga_salary",             "title": "DGA salary (gebruikelijk loon)",     "description": "Actual salary paid by BV — minimum €58,000 in 2026 (Ministerie van Financiën norm)", "category": "income",     "required": True,  "priority": "high", "task_type": "info"},
        {"stable_key": "dga_annual_accounts",    "title": "Annual accounts BV",                 "description": "Statutory accounts for the BV (jaarrekening)",                  "category": "business",   "required": True,  "priority": "high"},
        {"stable_key": "dga_dividend",           "title": "Dividend payments",                  "description": "Dividends declared / paid to DGA — Box 2 income",               "category": "box2",       "required": True,  "priority": "high"},
        {"stable_key": "dga_payroll",            "title": "Payroll documents",                  "description": "Loonheffingen declarations for DGA salary",                      "category": "payroll",    "required": True,  "priority": "high"},
        {"stable_key": "dga_rekening_courant",   "title": "Current account director / R-C",     "description": "Rekening-courant balance between DGA and BV",                   "category": "business",   "required": False, "priority": "high"},
        {"stable_key": "dga_company_expenses",   "title": "Company expenses",                   "description": "BV expenses relevant to personal tax return",                    "category": "expense",    "required": False, "priority": "medium"},
        {"stable_key": "dga_pension",            "title": "Pension arrangements",               "description": "Pensioen in eigen beheer or external pension",                   "category": "pension",    "required": False, "priority": "medium"},
        {"stable_key": "dga_partner_split",      "title": "Partner / shareholder split",        "description": "Dividends or salaries paid to partner shareholder",              "category": "household",  "required": False, "priority": "medium"},
        {"stable_key": "dga_gebruikelijk_loon",  "title": "Gebruikelijk loon check",            "description": "Confirm DGA salary meets €58,000 minimum (2026 norm) or has approved waiver", "category": "compliance", "required": True,  "priority": "high"},
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
    client_type = engagement.client_profile.client_type or "other"
    template = CHECKLISTS.get(client_type, CHECKLISTS["other"])

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
