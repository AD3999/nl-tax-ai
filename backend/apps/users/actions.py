"""
Tax Action Engine — generates specific user tasks from profile + calculator result.

Actions are distinct from alerts:
  Alerts  = informational notices (risk exists, deadline is approaching)
  Actions = concrete tasks the user should complete (file return, collect receipts, request assessment)

States (managed client-side via localStorage):
  open | done | dismissed   (snoozed can be added later)
"""

from datetime import date
from typing import Any


def generate_actions(
    profile: dict[str, Any],
    calc_result: dict[str, Any],
    lang: str = "en",
) -> list[dict]:
    """
    Returns a list of action dicts:
      { id, category, priority, title, body, action_label, action_url, due_date }

    priority  : high | medium | low
    category  : filing | preparation | review | optimization | compliance
    due_date  : ISO date string or null
    """
    actions: list[dict] = []
    today = date.today()
    result = calc_result.get("result", {}) if calc_result else {}
    user_type = profile.get("user_type", "")
    income = float(
        profile.get("annual_revenue_zzp")
        or profile.get("employment_income")
        or 0
    )

    _btw_filing(actions, today, user_type, lang)
    _ib_return(actions, today, lang)
    _urencriterium(actions, profile, user_type, lang)
    _voorlopige_aanslag(actions, result, user_type, lang)
    _monthly_reserve(actions, result, user_type, lang)
    _toeslagen_update(actions, income, lang)
    _box3_review(actions, profile, lang)
    _pension_jaarruimte(actions, profile, lang)
    _profile_completion(actions, profile, lang)
    if user_type == "zzp":
        _collect_receipts(actions, today, lang)

    return actions


# ── Filing ──────────────────────────────────────────────────────────────────

def _btw_filing(actions, today, user_type, lang):
    if user_type not in ("zzp", "dga"):
        return
    year = today.year
    quarters = [
        {"id": "file-btw-q1", "due": date(year, 4, 30), "q": 1},
        {"id": "file-btw-q2", "due": date(year, 7, 31), "q": 2},
        {"id": "file-btw-q3", "due": date(year, 10, 31), "q": 3},
        {"id": "file-btw-q4", "due": date(year + 1, 1, 31), "q": 4},
    ]
    for qt in quarters:
        days_left = (qt["due"] - today).days
        if not (0 <= days_left <= 45):
            continue
        n = qt["q"]
        due_str = qt["due"].strftime("%d %B %Y")
        actions.append({
            "id": qt["id"],
            "category": "filing",
            "priority": "high" if days_left <= 14 else "medium",
            "title": {
                "nl": f"BTW-aangifte Q{n} indienen",
                "en": f"File VAT return Q{n}",
                "fa": f"ارسال اظهارنامه VAT Q{n}",
            }.get(lang, f"File VAT Q{n}"),
            "body": {
                "nl": f"Uw BTW-aangifte voor Q{n} vervalt op {due_str}. Nog {days_left} dag(en).",
                "en": f"Your VAT return for Q{n} is due {due_str}. {days_left} day(s) remaining.",
                "fa": f"اظهارنامه VAT Q{n} تا {due_str} باید ارسال شود. {days_left} روز مانده.",
            }.get(lang),
            "action_label": {
                "nl": "Ga naar Belastingdienst",
                "en": "Go to Belastingdienst",
                "fa": "رفتن به سامانه",
            }.get(lang, "File now"),
            "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/btw_aangifte_doen_en_betalen/",
            "due_date": qt["due"].isoformat(),
        })


def _ib_return(actions, today, lang):
    ib_due = date(today.year, 5, 1)
    days_left = (ib_due - today).days
    if not (0 <= days_left <= 60):
        return
    actions.append({
        "id": "file-ib-return",
        "category": "filing",
        "priority": "high" if days_left <= 14 else "medium",
        "title": {
            "nl": "IB-aangifte 2025 indienen",
            "en": "File IB return 2025",
            "fa": "ارسال اظهارنامه مالیاتی ۲۰۲۵",
        }.get(lang),
        "body": {
            "nl": f"Uw inkomstenbelastingaangifte voor 2025 vervalt op 1 mei 2026. Nog {days_left} dag(en).",
            "en": f"Your income tax return for 2025 is due 1 May 2026. {days_left} day(s) remaining.",
            "fa": f"اظهارنامه مالیات بر درآمد ۲۰۲۵ تا ۱ مه ۲۰۲۶ است. {days_left} روز مانده.",
        }.get(lang),
        "action_label": {
            "nl": "Ga naar de IB-gids",
            "en": "Go to IB guide",
            "fa": "رفتن به راهنما",
        }.get(lang, "IB guide"),
        "action_url": "/ib-guide",
        "due_date": ib_due.isoformat(),
    })


# ── Compliance ───────────────────────────────────────────────────────────────

def _urencriterium(actions, profile, user_type, lang):
    if user_type != "zzp":
        return
    hours = int(profile.get("hours_per_year") or 0)
    THRESHOLD = 1225
    if hours == 0:
        actions.append({
            "id": "track-hours",
            "category": "compliance",
            "priority": "medium",
            "title": {
                "nl": "Start uren registreren",
                "en": "Start tracking your hours",
                "fa": "شروع ثبت ساعات کاری",
            }.get(lang),
            "body": {
                "nl": "Registreer uw gewerkte uren om de zelfstandigenaftrek (€1.200) veilig te stellen. U heeft 1.225 uur per jaar nodig.",
                "en": "Track your working hours to qualify for the self-employed deduction (€1,200). You need 1,225 hours/year.",
                "fa": "ساعات کاری خود را ثبت کنید تا کسر کارآفرینی (€۱,۲۰۰) را حفظ کنید. ۱,۲۲۵ ساعت در سال نیاز دارید.",
            }.get(lang),
            "action_label": {
                "nl": "Uren bijhouden",
                "en": "Track hours",
                "fa": "ثبت ساعات",
            }.get(lang),
            "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/zelfstandigenaftrek/",
            "due_date": None,
        })
    elif 0 < hours < THRESHOLD:
        short = THRESHOLD - hours
        actions.append({
            "id": "add-hours",
            "category": "compliance",
            "priority": "high",
            "title": {
                "nl": f"Nog {short} uur nodig voor de zelfstandigenaftrek",
                "en": f"{short} more hours needed for the deduction",
                "fa": f"هنوز {short} ساعت برای کسر نیاز دارید",
            }.get(lang),
            "body": {
                "nl": f"U heeft {hours} uur geregistreerd. Haal 1.225 uur om de zelfstandigenaftrek (€1.200) te claimen.",
                "en": f"You have {hours} hours logged. Reach 1,225 hours to claim the self-employed deduction (€1,200).",
                "fa": f"شما {hours} ساعت ثبت کرده‌اید. به ۱,۲۲۵ ساعت برسید تا کسر (€۱,۲۰۰) را دریافت کنید.",
            }.get(lang),
            "action_label": {
                "nl": "Profiel bijwerken",
                "en": "Update profile",
                "fa": "بروزرسانی پروفایل",
            }.get(lang),
            "action_url": "/intake",
            "due_date": f"{date.today().year}-12-31",
        })


# ── Optimization ─────────────────────────────────────────────────────────────

def _voorlopige_aanslag(actions, result, user_type, lang):
    reserve = result.get("monthly_reserve_needed", 0) or 0
    if user_type not in ("zzp", "dga") or reserve < 1500:
        return
    actions.append({
        "id": "request-voorlopige-aanslag",
        "category": "optimization",
        "priority": "medium",
        "title": {
            "nl": "Vraag een voorlopige aanslag aan",
            "en": "Request a provisional tax assessment",
            "fa": "درخواست ارزیابی مالیاتی موقت",
        }.get(lang),
        "body": {
            "nl": f"Uw maandelijkse reserve is €{reserve:,.0f}. Een voorlopige aanslag spreidt de betaling over het jaar en voorkomt een grote eindafrekening.",
            "en": f"Your monthly reserve is €{reserve:,.0f}. A provisional assessment (voorlopige aanslag) spreads your tax payments, avoiding a lump-sum bill at year-end.",
            "fa": f"ذخیره ماهانه شما €{reserve:,.0f} است. ارزیابی موقت پرداخت را در طول سال پخش می‌کند.",
        }.get(lang),
        "action_label": {
            "nl": "Aanvragen bij Belastingdienst",
            "en": "Request at Belastingdienst",
            "fa": "درخواست",
        }.get(lang),
        "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/aangifte_doen/voorlopige_aanslag/",
        "due_date": None,
    })


def _monthly_reserve(actions, result, user_type, lang):
    reserve = result.get("monthly_reserve_needed", 0) or 0
    if user_type not in ("zzp", "dga") or reserve <= 0:
        return
    actions.append({
        "id": "set-aside-reserve",
        "category": "preparation",
        "priority": "low",
        "title": {
            "nl": f"Reserveer €{reserve:,.0f} per maand voor belastingen",
            "en": f"Set aside €{reserve:,.0f}/month for taxes",
            "fa": f"ماهانه €{reserve:,.0f} برای مالیات کنار بگذارید",
        }.get(lang),
        "body": {
            "nl": f"Zet elke maand €{reserve:,.0f} apart op een spaarrekening. Zo voorkomt u een onverwachte aanslag bij de eindafrekening.",
            "en": f"Transfer €{reserve:,.0f} to a savings account each month. This prevents a surprise tax bill at year-end.",
            "fa": f"هر ماه €{reserve:,.0f} به حساب پس‌انداز منتقل کنید تا در پایان سال غافلگیر نشوید.",
        }.get(lang),
        "action_label": {
            "nl": "Belasting simulator",
            "en": "Tax simulator",
            "fa": "شبیه‌ساز",
        }.get(lang),
        "action_url": "/simulation",
        "due_date": None,
    })


# ── Review ────────────────────────────────────────────────────────────────────

def _toeslagen_update(actions, income, lang):
    CLIFF = 40857
    if not (0 < income < CLIFF):
        return
    gap = CLIFF - income
    actions.append({
        "id": "review-toeslagen",
        "category": "review",
        "priority": "medium",
        "title": {
            "nl": "Zorgtoeslag-inkomen controleren",
            "en": "Review your toeslagen income estimate",
            "fa": "بررسی برآورد درآمد برای toeslagen",
        }.get(lang),
        "body": {
            "nl": f"Uw inkomen (€{income:,.0f}) ligt €{gap:,.0f} onder de grens. Controleer of uw toeslagen actueel zijn — één euro over de grens = volledig verlies.",
            "en": f"Your income (€{income:,.0f}) is €{gap:,.0f} below the cliff. Verify your toeslagen estimate is current — one euro over = total loss.",
            "fa": f"درآمد شما (€{income:,.0f}) به اندازه €{gap:,.0f} زیر مرز است. برآورد toeslagen را بررسی کنید.",
        }.get(lang),
        "action_label": {
            "nl": "Mijn Toeslagen",
            "en": "Mijn Toeslagen",
            "fa": "بررسی toeslagen",
        }.get(lang),
        "action_url": "https://mijn.toeslagen.nl/",
        "due_date": None,
    })


def _box3_review(actions, profile, lang):
    assets = float(profile.get("box3_assets") or profile.get("net_assets_box3") or 0)
    EXEMPTION = 59357
    if assets <= EXEMPTION:
        return
    actions.append({
        "id": "review-box3",
        "category": "review",
        "priority": "medium",
        "title": {
            "nl": "Box 3 vermogen controleren op peildatum",
            "en": "Review Box 3 assets at reference date",
            "fa": "بررسی دارایی‌های باکس ۳ در تاریخ مرجع",
        }.get(lang),
        "body": {
            "nl": f"Uw Box 3 vermogen (€{assets:,.0f}) overschrijdt de vrijstelling. De peildatum is 1 januari — controleer wat u dan exact bezat.",
            "en": f"Your Box 3 assets (€{assets:,.0f}) exceed the exemption. The reference date is 1 January — verify what you owned on that date exactly.",
            "fa": f"دارایی‌های باکس ۳ شما (€{assets:,.0f}) از معافیت بیشتر است. تاریخ مرجع ۱ ژانویه است.",
        }.get(lang),
        "action_label": {
            "nl": "Box 3 uitleg",
            "en": "Box 3 explained",
            "fa": "توضیح باکس ۳",
        }.get(lang),
        "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/",
        "due_date": f"{date.today().year + 1}-01-01",
    })


def _pension_jaarruimte(actions, profile, lang):
    user_type = profile.get("user_type", "")
    income = float(profile.get("annual_revenue_zzp") or profile.get("employment_income") or 0)
    pension = float(profile.get("pension_deduction") or 0)
    BASE = 19172
    if user_type not in ("zzp", "employee") or income <= BASE or pension > 0:
        return
    jaarruimte = round((income - BASE) * 0.30)
    if jaarruimte < 500:
        return
    actions.append({
        "id": "pension-jaarruimte",
        "category": "optimization",
        "priority": "medium",
        "title": {
            "nl": f"Pensioen jaarruimte: tot €{jaarruimte:,} aftrekbaar",
            "en": f"Pension annual margin: up to €{jaarruimte:,} deductible",
            "fa": f"جای خالی بازنشستگی: تا €{jaarruimte:,} قابل کسر",
        }.get(lang),
        "body": {
            "nl": f"U kunt tot €{jaarruimte:,} aan lijfrentepremies aftrekken (30% × inkomen boven €19.172). U heeft dit jaar €0 benut. Dit verlaagt uw belastbaar inkomen direct.",
            "en": f"You can deduct up to €{jaarruimte:,} in pension contributions (30% × income above €19,172). You've used €0 this year — this reduces taxable income directly.",
            "fa": f"می‌توانید تا €{jaarruimte:,} از حق بیمه بازنشستگی کسر کنید. امسال €۰ استفاده کرده‌اید.",
        }.get(lang),
        "action_label": {
            "nl": "Lijfrente calculator",
            "en": "Calculate pension margin",
            "fa": "محاسبه جای خالی",
        }.get(lang),
        "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/werk_en_inkomen/pensioen/lijfrente/",
        "due_date": f"{date.today().year}-12-31",
    })


# ── Preparation ───────────────────────────────────────────────────────────────

def _profile_completion(actions, profile, lang):
    missing: list[str] = []
    if not profile.get("box3_assets") and not profile.get("net_assets_box3"):
        missing.append({
            "nl": "Box 3 vermogen",
            "en": "Box 3 assets",
            "fa": "دارایی‌های باکس ۳",
        }.get(lang, "Box 3 assets"))
    if profile.get("user_type") == "zzp":
        if not profile.get("single_client_percentage") and not profile.get("single_client_pct"):
            missing.append({
                "nl": "klantconcentratie (%)",
                "en": "client concentration (%)",
                "fa": "تمرکز مشتری (%)",
            }.get(lang, "client concentration"))
    if not missing:
        return
    fields_str = ", ".join(missing)
    actions.append({
        "id": "complete-profile",
        "category": "preparation",
        "priority": "low",
        "title": {
            "nl": "Profiel aanvullen voor betere berekeningen",
            "en": "Complete profile for better accuracy",
            "fa": "تکمیل پروفایل برای دقت بیشتر",
        }.get(lang),
        "body": {
            "nl": f"Ontbrekend: {fields_str}. Een volledig profiel geeft nauwkeurigere belastingberekeningen.",
            "en": f"Missing: {fields_str}. A complete profile produces more accurate tax calculations.",
            "fa": f"ناقص: {fields_str}. پروفایل کامل محاسبات دقیق‌تری می‌دهد.",
        }.get(lang),
        "action_label": {
            "nl": "Profiel bijwerken",
            "en": "Update profile",
            "fa": "بروزرسانی پروفایل",
        }.get(lang),
        "action_url": "/intake",
        "due_date": None,
    })


def _collect_receipts(actions, today, lang):
    if today.month not in (3, 4, 6, 7, 9, 10, 12, 1):
        return
    quarter_map = {
        3: 1, 4: 1,   # approaching Q1 deadline
        6: 2, 7: 2,   # approaching Q2 deadline
        9: 3, 10: 3,  # approaching Q3 deadline
        12: 4, 1: 4,  # approaching Q4 deadline
    }
    n = quarter_map.get(today.month, 1)
    actions.append({
        "id": f"collect-receipts-q{n}",
        "category": "preparation",
        "priority": "low",
        "title": {
            "nl": f"Bonnen en facturen Q{n} verzamelen",
            "en": f"Collect Q{n} receipts and invoices",
            "fa": f"جمع‌آوری رسیدها و فاکتورهای Q{n}",
        }.get(lang),
        "body": {
            "nl": f"Verzamel alle zakelijke bonnen en facturen voor Q{n}. Georganiseerde administratie maakt de BTW-aangifte een stuk eenvoudiger.",
            "en": f"Collect all business receipts and invoices for Q{n}. Organised records make the VAT filing straightforward.",
            "fa": f"تمام رسیدها و فاکتورهای تجاری Q{n} را جمع‌آوری کنید.",
        }.get(lang),
        "action_label": {
            "nl": "Administratie tips",
            "en": "Record-keeping tips",
            "fa": "نکات مدیریت مدارک",
        }.get(lang),
        "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/",
        "due_date": None,
    })
