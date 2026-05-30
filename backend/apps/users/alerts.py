"""
Proactive alert engine — generates user-specific tax alerts, risks, and opportunities
from a saved tax profile + calculator result. Pure functions, no DB required.
"""

from datetime import date
from typing import Any


def generate_alerts(profile: dict[str, Any], calc_result: dict[str, Any], lang: str = "en") -> list[dict]:
    """
    Returns a list of alert dicts:
      { id, category, severity, title, body, action_label, action_url }

    Categories: deadline | risk | opportunity | missing_data | cashflow | compliance
    Severity:   critical | warning | info
    """
    alerts = []
    today = date.today()
    result = calc_result.get("result", {}) if calc_result else {}
    calc = calc_result.get("calculation", {}) if calc_result else {}
    user_type = profile.get("user_type", "")
    income = (
        profile.get("annual_revenue_zzp") or
        profile.get("employment_income") or 0
    )

    # ── 1. Upcoming deadlines ───────────────────────────────────────────────────
    _check_deadlines(alerts, today, user_type, lang)

    # ── 2. Wet DBA risk ─────────────────────────────────────────────────────────
    if user_type == "zzp":
        _check_wet_dba(alerts, profile, result, lang)

    # ── 3. ZVW contribution warning (most ZZP workers miss this) ────────────────
    if user_type == "zzp":
        _check_zvw(alerts, calc, lang)

    # ── 4. Zorgtoeslag cliff edge ────────────────────────────────────────────────
    _check_zorgtoeslag(alerts, income, lang)

    # ── 5. Urencriterium risk ────────────────────────────────────────────────────
    if user_type == "zzp":
        _check_urencriterium(alerts, profile, lang)

    # ── 6. Startersaftrek last year ──────────────────────────────────────────────
    if user_type == "zzp" and profile.get("is_starter"):
        _check_startersaftrek(alerts, lang)

    # ── 7. Monthly reserve check ─────────────────────────────────────────────────
    if user_type in ("zzp", "dga"):
        _check_cashflow(alerts, result, lang)

    # ── 8. Profile completeness ──────────────────────────────────────────────────
    _check_profile_completeness(alerts, profile, lang)

    # ── 9. Box 3 opportunity ─────────────────────────────────────────────────────
    _check_box3(alerts, profile, lang)

    # ── 10. 30% ruling phase-out warning ────────────────────────────────────────
    if user_type == "expat":
        _check_30pct(alerts, profile, lang)

    return alerts


# ── Individual check functions ──────────────────────────────────────────────────

def _check_deadlines(alerts, today, user_type, lang):
    DEADLINES = [
        {
            "id": "dl-btw-q1",
            "date": date(today.year, 4, 30),
            "title": {"nl": "BTW Q1 aangifte vervalt 30 april", "en": "VAT Q1 return due 30 April", "fa": "اظهارنامه مالیات Q1 تا ۳۰ آوریل"},
            "body": {"nl": "Dien uw BTW-aangifte voor Q1 op tijd in. Te laat = automatische boete.", "en": "Submit your Q1 VAT return on time. Late filing triggers an automatic penalty even on a zero return.", "fa": "اظهارنامه VAT Q1 خود را به موقع ارسال کنید. تأخیر جریمه خودکار دارد."},
            "url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/btw_aangifte_doen_en_betalen/wanneer_aangifte_doen/",
            "user_types": ["zzp", "dga"],
        },
        {
            "id": "dl-ib",
            "date": date(today.year, 5, 1),
            "title": {"nl": "IB-aangifte 2025 vervalt 1 mei", "en": "IB return 2025 due 1 May", "fa": "اظهارنامه مالیات بر درآمد ۲۰۲۵ تا ۱ مه"},
            "body": {"nl": "Uw inkomstenbelasting aangifte voor 2025 moet voor 1 mei 2026 worden ingediend.", "en": "Your income tax return for 2025 must be filed before 1 May 2026.", "fa": "اظهارنامه مالیات بر درآمد ۲۰۲۵ باید قبل از ۱ مه ۲۰۲۶ ارسال شود."},
            "url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/aangifte_doen/",
            "user_types": None,  # all
        },
        {
            "id": "dl-btw-q2",
            "date": date(today.year, 7, 31),
            "title": {"nl": "BTW Q2 aangifte vervalt 31 juli", "en": "VAT Q2 return due 31 July", "fa": "اظهارنامه مالیات Q2 تا ۳۱ جولای"},
            "body": {"nl": "Dien uw BTW-aangifte voor Q2 op tijd in.", "en": "Submit your Q2 VAT return on time.", "fa": "اظهارنامه VAT Q2 خود را به موقع ارسال کنید."},
            "url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/",
            "user_types": ["zzp", "dga"],
        },
    ]

    for d in DEADLINES:
        if d["user_types"] and user_type not in d["user_types"]:
            continue
        days_left = (d["date"] - today).days
        if days_left < 0:
            continue  # past
        severity = "critical" if days_left <= 14 else "warning" if days_left <= 45 else "info"
        t = d["title"].get(lang, d["title"]["en"])
        b = d["body"].get(lang, d["body"]["en"])
        days_txt = {"nl": f"Nog {days_left} dag(en)", "en": f"{days_left} day(s) left", "fa": f"{days_left} روز مانده"}.get(lang, f"{days_left} days left")
        alerts.append({
            "id": d["id"], "category": "deadline", "severity": severity,
            "title": t, "body": f"{b} {days_txt}",
            "action_label": {"nl": "Meer info", "en": "More info", "fa": "بیشتر"}.get(lang, "More info"),
            "action_url": d["url"],
        })


def _check_wet_dba(alerts, profile, result, lang):
    risk = result.get("wet_dba_risk", "").lower()
    pct = profile.get("single_client_percentage") or profile.get("single_client_pct") or 0
    if risk == "high" or (pct and float(pct) >= 65):
        alerts.append({
            "id": "wet-dba-high", "category": "compliance", "severity": "critical",
            "title": {"nl": "Wet DBA risico: HOOG", "en": "Wet DBA risk: HIGH", "fa": "ریسک Wet DBA: بالا"}.get(lang),
            "body": {"nl": f"65%+ van uw omzet komt van één klant ({pct}%). Dat is een duidelijk signaal voor de Belastingdienst. Diversifieer uw klantenbestand of overweeg een vast contract.", "en": f"65%+ of your revenue comes from one client ({pct}%). This is a clear red flag for the Belastingdienst. Diversify or consider a formal employment contract.", "fa": f"بیش از ۶۵٪ درآمد شما از یک مشتری است ({pct}%). این یک علامت هشدار برای Belastingdienst است."}.get(lang),
            "action_label": {"nl": "Wet DBA uitleg", "en": "Wet DBA explained", "fa": "توضیح Wet DBA"}.get(lang),
            "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/werken_met_of_als_zelfstandige/",
        })
    elif risk == "medium" or (pct and 40 <= float(pct) < 65):
        alerts.append({
            "id": "wet-dba-medium", "category": "compliance", "severity": "warning",
            "title": {"nl": "Wet DBA risico: GEMIDDELD", "en": "Wet DBA risk: MEDIUM", "fa": "ریسک Wet DBA: متوسط"}.get(lang),
            "body": {"nl": "U heeft enige concentratie bij één klant. Let op signalen van schijnzelfstandigheid.", "en": "You have some revenue concentration with one client. Watch for signals of disguised employment.", "fa": "تمرکز درآمد نسبی دارید. مراقب نشانه‌های استخدام پنهان باشید."}.get(lang),
            "action_label": {"nl": "Check uw risico", "en": "Check your risk", "fa": "ریسک را بررسی کنید"}.get(lang),
            "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/werken_met_of_als_zelfstandige/",
        })


def _check_zvw(alerts, calc, lang):
    zvw = calc.get("zvw_contribution", 0) or 0
    if zvw > 0:
        alerts.append({
            "id": "zvw-reminder", "category": "cashflow", "severity": "info",
            "title": {"nl": f"ZVW-bijdrage: €{zvw:,.0f} — vergeet dit niet!", "en": f"ZVW health contribution: €{zvw:,.0f} — easy to miss", "fa": f"ZVW: €{zvw:,.0f} — فراموش نکنید!"}.get(lang),
            "body": {"nl": "ZZP'ers betalen de ZVW-bijdrage (5.32% over winst) zelf. Dit wordt niet automatisch ingehouden. Zet het maandelijks apart.", "en": "Self-employed workers pay ZVW (health contribution, 5.32% of profit) themselves — it's not withheld automatically. Set it aside monthly.", "fa": "کارآفرینان ZVW (۵.۳۲٪ سود) را خودشان می‌پردازند — به صورت خودکار کسر نمی‌شود."}.get(lang),
            "action_label": {"nl": "Meer over ZVW", "en": "About ZVW", "fa": "درباره ZVW"}.get(lang),
            "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/overige_belastingen/inkomensafhankelijke_bijdrage_zvw/",
        })


def _check_zorgtoeslag(alerts, income, lang):
    CUTOFF_SINGLE = 40857
    if 0 < income < CUTOFF_SINGLE:
        gap = CUTOFF_SINGLE - income
        alerts.append({
            "id": "zorgtoeslag-cliff", "category": "opportunity", "severity": "info",
            "title": {"nl": "Zorgtoeslag: let op de grens", "en": "Zorgtoeslag: watch the income cliff", "fa": "مراقب مرز درآمد zorgtoeslag باشید"}.get(lang),
            "body": {"nl": f"U valt onder de grens van €40.857 (nog €{gap:,.0f} ruimte). Als uw inkomen de grens overschrijdt, verliest u de volledige zorgtoeslag (€1.548/jaar).", "en": f"You're under the €40,857 cutoff (€{gap:,.0f} headroom). If your income exceeds this by even €1, you lose all zorgtoeslag (~€1,548/year).", "fa": f"شما زیر مرز €۴۰,۸۵۷ هستید (€{gap:,.0f} فاصله). اگر درآمد از این مرز رد شود، کل zorgtoeslag را از دست می‌دهید."}.get(lang),
            "action_label": {"nl": "Zorgtoeslag check", "en": "Check zorgtoeslag", "fa": "بررسی zorgtoeslag"}.get(lang),
            "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/toeslagen/zorgtoeslag/",
        })


def _check_urencriterium(alerts, profile, lang):
    hours = profile.get("hours_per_year") or 0
    THRESHOLD = 1225
    if 0 < int(hours) < THRESHOLD:
        short = THRESHOLD - int(hours)
        alerts.append({
            "id": "urencriterium-risk", "category": "risk", "severity": "warning",
            "title": {"nl": f"Urencriterium: {short} uur tekort", "en": f"Hours criterion: {short} hours short", "fa": f"معیار ساعت: {short} ساعت کم دارید"}.get(lang),
            "body": {"nl": f"U heeft {hours} uur opgegeven. U heeft {THRESHOLD} uur nodig voor de zelfstandigenaftrek (€1.200). Documenteer uw uren goed.", "en": f"You recorded {hours} hours. You need {THRESHOLD} hours/year to qualify for the self-employed deduction (€1,200). Document your hours carefully.", "fa": f"شما {hours} ساعت ثبت کرده‌اید. برای کسر کارآفرینی (€۱,۲۰۰) به {THRESHOLD} ساعت نیاز دارید."}.get(lang),
            "action_label": {"nl": "Uren bijhouden", "en": "Track your hours", "fa": "ساعات را ثبت کنید"}.get(lang),
            "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/zelfstandigenaftrek/",
        })


def _check_startersaftrek(alerts, lang):
    alerts.append({
        "id": "startersaftrek-last-year", "category": "opportunity", "severity": "warning",
        "title": {"nl": "Startersaftrek 2026 — laatste jaar!", "en": "Startersaftrek 2026 — last year!", "fa": "Startersaftrek 2026 — آخرین سال!"}.get(lang),
        "body": {"nl": "De startersaftrek (€2.123) wordt in 2027 afgeschaft. Zorg dat u deze voor het einde van 2026 benut.", "en": "The starter deduction (€2,123) is abolished from 2027. Make sure you claim it before end of 2026.", "fa": "کسر استارتر (€۲,۱۲۳) از ۲۰۲۷ حذف می‌شود. مطمئن شوید که تا پایان ۲۰۲۶ از آن استفاده می‌کنید."}.get(lang),
        "action_label": {"nl": "Meer info", "en": "More info", "fa": "بیشتر"}.get(lang),
        "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/startersaftrek/",
    })


def _check_cashflow(alerts, result, lang):
    reserve = result.get("monthly_reserve_needed", 0) or 0
    if reserve > 2000:
        alerts.append({
            "id": "high-reserve", "category": "cashflow", "severity": "warning",
            "title": {"nl": f"Hoge belastingreserve: €{reserve:,.0f}/maand", "en": f"High tax reserve needed: €{reserve:,.0f}/month", "fa": f"ذخیره مالیاتی بالا: €{reserve:,.0f}/ماه"}.get(lang),
            "body": {"nl": "Uw belastingdruk is aanzienlijk. Overweeg een voorlopige aanslag om het bedrag gespreid te betalen.", "en": "Your tax burden is substantial. Consider a voorlopige aanslag (provisional assessment) to spread payments across the year.", "fa": "بار مالیاتی شما قابل توجه است. یک voorlopige aanslag برای پرداخت تدریجی در نظر بگیرید."}.get(lang),
            "action_label": {"nl": "Voorlopige aanslag", "en": "Provisional assessment", "fa": "ارزیابی موقت"}.get(lang),
            "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/aangifte_doen/voorlopige_aanslag/",
        })


def _check_profile_completeness(alerts, profile, lang):
    if not profile.get("box3_assets") and not profile.get("net_assets_box3"):
        alerts.append({
            "id": "missing-box3", "category": "missing_data", "severity": "info",
            "title": {"nl": "Box 3 gegevens ontbreken", "en": "Box 3 data missing", "fa": "اطلاعات باکس ۳ وارد نشده"}.get(lang),
            "body": {"nl": "Heeft u spaargeld of beleggingen boven de vrijstelling van €59.357? Voeg uw Box 3 vermogen toe voor een volledige berekening.", "en": "Do you have savings or investments above €59,357? Add your Box 3 assets for a complete tax calculation.", "fa": "آیا پس‌انداز یا سرمایه‌گذاری بیش از €۵۹,۳۵۷ دارید؟ دارایی‌های باکس ۳ را اضافه کنید."}.get(lang),
            "action_label": {"nl": "Profiel bijwerken", "en": "Update profile", "fa": "بروزرسانی پروفایل"}.get(lang),
            "action_url": "/intake",
        })


def _check_box3(alerts, profile, lang):
    assets = profile.get("box3_assets") or profile.get("net_assets_box3") or 0
    if float(assets) > 59357:
        alerts.append({
            "id": "box3-taxable", "category": "opportunity", "severity": "info",
            "title": {"nl": "Box 3 boven de vrijstelling", "en": "Box 3 above the exemption", "fa": "باکس ۳ بالای معافیت"}.get(lang),
            "body": {"nl": f"Uw Box 3 vermogen (€{float(assets):,.0f}) overschrijdt de vrijstelling van €59.357. U kunt optimaliseren via de peildatum (1 januari).", "en": f"Your Box 3 assets (€{float(assets):,.0f}) exceed the €59,357 exemption. Consider optimising via the reference date (1 January).", "fa": f"دارایی‌های باکس ۳ شما (€{float(assets):,.0f}) از معافیت €۵۹,۳۵۷ بیشتر است."}.get(lang),
            "action_label": {"nl": "Box 3 uitleg", "en": "Box 3 explained", "fa": "توضیح باکس ۳"}.get(lang),
            "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/vermogen/",
        })


def _check_30pct(alerts, profile, lang):
    year = int(profile.get("ruling_year") or profile.get("ruling_year_number") or 1)
    if year >= 4:
        pct = 20 if year == 4 else 10
        alerts.append({
            "id": "30pct-phaseout", "category": "risk", "severity": "warning",
            "title": {"nl": f"30%-regeling fase-out: nu {pct}%", "en": f"30% ruling phase-out: now {pct}%", "fa": f"کاهش قانون ۳۰٪: اکنون {pct}٪"}.get(lang),
            "body": {"nl": f"U zit in jaar {year} van de 30%-regeling. Het belastingvrije percentage is nu {pct}%. Plan uw situatie na afloop van de regeling.", "en": f"You're in year {year} of the 30% ruling. The tax-free percentage is now {pct}%. Start planning for life after the ruling ends.", "fa": f"شما در سال {year} قانون ۳۰٪ هستید. درصد معاف از مالیات اکنون {pct}٪ است."}.get(lang),
            "action_label": {"nl": "30%-regeling info", "en": "30% ruling info", "fa": "اطلاعات قانون ۳۰٪"}.get(lang),
            "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/werk_en_inkomen/loon_en_andere_uitkeringen/bijzondere_beloningen/30_procentsregeling/",
        })
