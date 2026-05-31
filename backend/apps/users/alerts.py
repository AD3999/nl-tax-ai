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

    # ── 11. Pension jaarruimte opportunity ───────────────────────────────────────
    _check_pension_opportunity(alerts, profile, lang)

    # ── 12. KIA investment opportunity ───────────────────────────────────────────
    if user_type == "zzp":
        _check_kia_opportunity(alerts, profile, lang)

    # ── 13. Voorlopige aanslag opportunity ───────────────────────────────────────
    if user_type in ("zzp", "dga"):
        _check_voorlopige_opportunity(alerts, result, lang)

    # ── 14. DGA compliance: gebruikelijk loon ─────────────────────────────────────
    if user_type == "dga":
        _check_dga_compliance(alerts, profile, lang)

    # ── 15. MKB-winstvrijstelling awareness ───────────────────────────────────────
    if user_type == "zzp":
        _check_mkb_opportunity(alerts, calc, lang)

    # ── 16. Partner income optimization ──────────────────────────────────────────
    _check_partner_optimization(alerts, profile, income, lang)

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


def _check_pension_opportunity(alerts, profile, lang):
    user_type = profile.get("user_type", "")
    income = float(profile.get("annual_revenue_zzp") or profile.get("employment_income") or 0)
    pension = float(profile.get("pension_deduction") or 0)
    BASE = 19172
    if user_type not in ("zzp", "employee") or income <= BASE or pension > 0:
        return
    jaarruimte = round((income - BASE) * 0.30)
    if jaarruimte < 500:
        return
    alerts.append({
        "id": "pension-opportunity",
        "category": "opportunity",
        "severity": "info",
        "title": {
            "nl": f"Ongebruikte pensioenruimte: tot €{jaarruimte:,} aftrekbaar",
            "en": f"Unused pension margin: up to €{jaarruimte:,} deductible",
            "fa": f"جای خالی بازنشستگی: تا €{jaarruimte:,} قابل کسر",
        }.get(lang),
        "body": {
            "nl": f"U kunt tot €{jaarruimte:,} aan lijfrentepremies aftrekken (30% × winst boven €19.172). Dit verlaagt uw belastbaar inkomen direct. U heeft dit jaar niets benut.",
            "en": f"You can deduct up to €{jaarruimte:,} in pension premiums (30% × income above €19,172) — directly reducing your taxable income. You've used €0 this year.",
            "fa": f"می‌توانید تا €{jaarruimte:,} از حق بیمه بازنشستگی کسر کنید. امسال €۰ استفاده کرده‌اید — فرصت از دست نرود.",
        }.get(lang),
        "action_label": {
            "nl": "Jaarruimte berekenen",
            "en": "Calculate your margin",
            "fa": "محاسبه جای خالی",
        }.get(lang),
        "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/werk_en_inkomen/pensioen/lijfrente/",
    })


def _check_kia_opportunity(alerts, profile, lang):
    kia = float(profile.get("kia_investments") or 0)
    income = float(profile.get("annual_revenue_zzp") or 0)
    if kia > 0 or income < 15000:
        return
    alerts.append({
        "id": "kia-opportunity",
        "category": "opportunity",
        "severity": "info",
        "title": {
            "nl": "Investeringsaftrek (KIA) mogelijk niet benut",
            "en": "Investment deduction (KIA) may be unclaimed",
            "fa": "ممکن است کسر سرمایه‌گذاری (KIA) دریافت نشده باشد",
        }.get(lang),
        "body": {
            "nl": "Als u dit jaar zakelijk hebt geïnvesteerd (€2.901–€70.602), kunt u 28% KIA aftrekken. Voeg investeringen toe aan uw profiel.",
            "en": "If you made business investments this year (€2,901–€70,602), you can deduct 28% via the Small Investment Deduction (KIA). Add investments to your profile.",
            "fa": "اگر امسال سرمایه‌گذاری تجاری داشتید (€۲,۹۰۱–€۷۰,۶۰۲)، می‌توانید ۲۸٪ کسر KIA دریافت کنید.",
        }.get(lang),
        "action_label": {
            "nl": "KIA info",
            "en": "KIA info",
            "fa": "اطلاعات KIA",
        }.get(lang),
        "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/kleinschaligheidsinvesteringsaftrek/",
    })


def _check_voorlopige_opportunity(alerts, result, lang):
    reserve = result.get("monthly_reserve_needed", 0) or 0
    total_tax = result.get("total_tax_due", 0) or 0
    if total_tax < 500 or reserve < 800:
        return
    alerts.append({
        "id": "voorlopige-opportunity",
        "category": "opportunity",
        "severity": "info",
        "title": {
            "nl": "Belasting gespreid betalen via voorlopige aanslag",
            "en": "Spread tax payments with a provisional assessment",
            "fa": "پرداخت پراکنده مالیات از طریق ارزیابی موقت",
        }.get(lang),
        "body": {
            "nl": f"Uw verwachte belasting is €{total_tax:,.0f}. Een voorlopige aanslag (gratis) spreidt de betaling over het jaar zodat u nooit een grote eindafrekening krijgt.",
            "en": f"Your estimated tax is €{total_tax:,.0f}. A provisional assessment (free to request) spreads payments across the year — no lump-sum surprise at year-end.",
            "fa": f"مالیات تخمینی شما €{total_tax:,.0f} است. یک ارزیابی موقت (رایگان) پرداخت را در طول سال پخش می‌کند.",
        }.get(lang),
        "action_label": {
            "nl": "Aanvragen",
            "en": "Request now",
            "fa": "درخواست",
        }.get(lang),
        "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/aangifte_doen/voorlopige_aanslag/",
    })


def _check_dga_compliance(alerts, profile, lang):
    income = float(profile.get("employment_income") or 0)
    MIN_SALARY = 56000
    if 0 < income < MIN_SALARY:
        alerts.append({
            "id": "dga-gebruikelijk-loon",
            "category": "compliance",
            "severity": "critical",
            "title": {
                "nl": f"DGA loon te laag: €{income:,.0f} (minimum €{MIN_SALARY:,})",
                "en": f"DGA salary too low: €{income:,.0f} (minimum €{MIN_SALARY:,})",
                "fa": f"حقوق DGA خیلی کم: €{income:,.0f} (حداقل €{MIN_SALARY:,})",
            }.get(lang),
            "body": {
                "nl": f"De Belastingdienst vereist een gebruikelijk loon van minimaal EUR{MIN_SALARY:,} voor DGA-directeuren. Uw salaris (EUR{income:,.0f}) is te laag. Dit kan leiden tot correcties en boetes.",
                "en": f"The Belastingdienst requires a minimum salary of €{MIN_SALARY:,} for DGA directors. Your declared salary (€{income:,.0f}) falls short. This can trigger corrections and penalties.",
                "fa": f"Belastingdienst حداقل حقوق €{MIN_SALARY:,} برای مدیران DGA الزامی است. حقوق شما (€{income:,.0f}) کمتر است — ممکن است جریمه شوید.",
            }.get(lang),
            "action_label": {"nl": "DGA loon info", "en": "DGA salary rules", "fa": "قوانین حقوق DGA"}.get(lang),
            "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/gebruikelijk_loon/",
        })


def _check_mkb_opportunity(alerts, calc, lang):
    mkb = float(calc.get("mkb_winstvrijstelling") or 0)
    gross = float(calc.get("gross_profit") or 0)
    if gross < 10000 or mkb > 0:
        return
    estimated = round(gross * 0.127)
    alerts.append({
        "id": "mkb-opportunity",
        "category": "opportunity",
        "severity": "info",
        "title": {
            "nl": f"MKB-winstvrijstelling: ~€{estimated:,} belastingvrij",
            "en": f"MKB profit exemption: ~€{estimated:,} tax-free",
            "fa": f"معافیت سود MKB: ~€{estimated:,} معاف از مالیات",
        }.get(lang),
        "body": {
            "nl": f"De MKB-winstvrijstelling (12,7% van uw winst) bespaart u ~€{estimated:,}. Deze aftrek is automatisch van toepassing — zorg dat uw boekhouder dit correct verwerkt.",
            "en": f"The MKB profit exemption (12.7% of profit) saves you ~€{estimated:,}. It applies automatically — ensure your accountant applies it correctly in your filing.",
            "fa": f"معافیت سود MKB (۱۲.۷٪ سود) ~€{estimated:,} صرفه‌جویی می‌کند. به طور خودکار اعمال می‌شود — مطمئن شوید حسابداری آن را درست ثبت کرده.",
        }.get(lang),
        "action_label": {"nl": "MKB info", "en": "MKB info", "fa": "اطلاعات MKB"}.get(lang),
        "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/mkb_winstvrijstelling/",
    })


def _check_partner_optimization(alerts, profile, income, lang):
    has_partner = profile.get("has_partner") or profile.get("has_fiscal_partner")
    if not has_partner:
        return
    partner_income = float(profile.get("partner_income") or 0)
    if partner_income == 0:
        alerts.append({
            "id": "partner-income-missing",
            "category": "missing_data",
            "severity": "info",
            "title": {"nl": "Partner inkomen niet opgegeven", "en": "Partner income not declared", "fa": "درآمد شریک وارد نشده"}.get(lang),
            "body": {
                "nl": "U heeft een fiscaal partner maar geen partnerinkomen opgegeven. Dit beïnvloedt uw belastingberekening en toeslagen. Voeg het toe voor een volledig beeld.",
                "en": "You have a fiscal partner but no partner income declared. This affects your tax calculation and toeslagen eligibility. Add it for an accurate result.",
                "fa": "شریک مالی دارید اما درآمد شریک وارد نشده. این روی محاسبه مالیات و toeslagen تأثیر می‌گذارد.",
            }.get(lang),
            "action_label": {"nl": "Profiel bijwerken", "en": "Update profile", "fa": "بروزرسانی"}.get(lang),
            "action_url": "/intake",
        })
        return
    income_diff = abs(float(income) - partner_income)
    if income_diff > 20000:
        alerts.append({
            "id": "partner-optimization",
            "category": "opportunity",
            "severity": "info",
            "title": {
                "nl": "Partneroptimalisatie mogelijk",
                "en": "Partner tax optimization may apply",
                "fa": "بهینه‌سازی مالیاتی با شریک ممکن",
            }.get(lang),
            "body": {
                "nl": f"Er is een inkomensverschil van €{income_diff:,.0f} tussen u en uw partner. Via fiscaal partnerschap kunt u heffingskortingen en aftrekposten optimaal verdelen.",
                "en": f"There is a €{income_diff:,.0f} income gap between you and your partner. Fiscal partnership lets you redistribute credits and deductions for maximum benefit.",
                "fa": f"اختلاف درآمد €{income_diff:,.0f} بین شما و شریکتان وجود دارد. شراکت مالیاتی اجازه تقسیم بهینه اعتبارات را می‌دهد.",
            }.get(lang),
            "action_label": {"nl": "Fiscaal partnerschap", "en": "Fiscal partnership", "fa": "شراکت مالی"}.get(lang),
            "action_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/relatie_familie_en_gezin/fiscaal_partnerschap/",
        })
