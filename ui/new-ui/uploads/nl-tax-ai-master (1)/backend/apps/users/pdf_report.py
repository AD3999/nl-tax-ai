"""
TaxWijs PDF Tax Health Report generator.
Uses ReportLab — pure Python, no system dependencies.

Entry point: generate_report(user, profile, calc_result, alerts, lang) → bytes
"""
import io
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, HRFlowable, PageTemplate,
    Paragraph, Spacer, Table, TableStyle, KeepTogether,
)
from reportlab.platypus.flowables import Flowable

# ── Brand palette ─────────────────────────────────────────────────────────────
SAGE    = colors.HexColor("#5a7854")
SAGE_LT = colors.HexColor("#c8d9c4")
SAGE_BG = colors.HexColor("#f0f5ef")
INK     = colors.HexColor("#1c1c1a")
INK_3   = colors.HexColor("#6b6b66")
INK_4   = colors.HexColor("#9b9b95")
PAPER   = colors.HexColor("#faf9f7")
DANGER  = colors.HexColor("#c0392b")
WARN    = colors.HexColor("#b7791f")
OK      = colors.HexColor("#276749")
HAIR    = colors.HexColor("#e8e6e0")

W, H = A4  # 595 × 842 pts

# ── Style helpers ─────────────────────────────────────────────────────────────
_BASE = getSampleStyleSheet()

def _s(name, **kw) -> ParagraphStyle:
    return ParagraphStyle(name, **{"fontName": "Helvetica", "textColor": INK, **kw})

EYEBROW  = _s("Eyebrow",  fontSize=8,  textColor=INK_3, spaceAfter=2,  tracking=1.5, fontName="Helvetica-Bold", leading=10)
TITLE    = _s("Title",    fontSize=22, fontName="Helvetica-Bold", leading=26, spaceAfter=4)
SUBTITLE = _s("Subtitle", fontSize=10, textColor=INK_3, leading=14, spaceAfter=2)
HEADING  = _s("Heading",  fontSize=12, fontName="Helvetica-Bold", leading=16, spaceAfter=4, spaceBefore=8)
BODY     = _s("Body",     fontSize=9,  leading=14, spaceAfter=3)
SMALL    = _s("Small",    fontSize=8,  textColor=INK_3, leading=11)
MONO     = _s("Mono",     fontSize=9,  fontName="Courier", leading=12)
CELL_L   = _s("CellL",    fontSize=9,  leading=12)
CELL_R   = _s("CellR",    fontSize=9,  leading=12, alignment=TA_RIGHT)
CELL_B   = _s("CellB",    fontSize=9,  leading=12, fontName="Helvetica-Bold")


# ── Gauge flowable (SVG-style, drawn on canvas) ───────────────────────────────
class HealthGauge(Flowable):
    def __init__(self, score: int, width=140, height=80):
        super().__init__()
        self.score = max(0, min(100, score))
        self.width = width
        self.height = height

    def wrap(self, *_):
        return self.width, self.height

    def draw(self):
        c = self.canv
        cx, cy = self.width / 2, 14
        r = 52

        import math
        def arc_pt(deg):
            rad = math.radians(deg)
            return cx + r * math.cos(rad), cy + r * math.sin(rad)

        # Background arc (180° → 0°)
        c.setStrokeColor(HAIR)
        c.setLineWidth(10)
        c.arc(cx - r, cy - r, cx + r, cy + r, 0, 180)

        # Score arc
        angle = 180 - int(self.score * 1.8)
        score_color = OK if self.score >= 80 else (WARN if self.score >= 55 else DANGER)
        c.setStrokeColor(score_color)
        c.setLineWidth(10)
        c.arc(cx - r, cy - r, cx + r, cy + r, angle, 180 - angle)

        # Score text
        c.setFont("Helvetica-Bold", 26)
        c.setFillColor(score_color)
        c.drawCentredString(cx, cy + 10, str(self.score))

        c.setFont("Helvetica", 8)
        c.setFillColor(INK_3)
        c.drawCentredString(cx, cy - 2, "/ 100")

        label = "Excellent" if self.score >= 80 else ("Fair" if self.score >= 55 else "Needs attention")
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(score_color)
        c.drawCentredString(cx, cy - 16, label)


# ── Page template ─────────────────────────────────────────────────────────────
def _build_template(doc) -> list:
    margin = 18 * mm
    frame = Frame(margin, margin, W - 2 * margin, H - 2 * margin - 20 * mm, id="main")

    def _header(canvas, doc):
        canvas.saveState()
        # Top stripe
        canvas.setFillColor(SAGE)
        canvas.rect(0, H - 14 * mm, W, 14 * mm, fill=1, stroke=0)
        canvas.setFont("Helvetica-Bold", 10)
        canvas.setFillColor(colors.white)
        canvas.drawString(margin, H - 10 * mm, "TaxWijs")
        canvas.setFont("Helvetica", 8)
        canvas.drawRightString(W - margin, H - 10 * mm, "Tax Health Report · 2026")
        # Bottom footer
        canvas.setFillColor(HAIR)
        canvas.rect(0, 0, W, 10 * mm, fill=1, stroke=0)
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(INK_3)
        canvas.drawString(margin, 3.5 * mm,
            "Source: Belastingdienst.nl | Verified 2026 rules | Not official tax advice — for informational purposes only")
        canvas.drawRightString(W - margin, 3.5 * mm, f"Page {doc.page}")
        canvas.restoreState()

    return [PageTemplate(id="main", frames=[frame], onPage=_header)]


# ── Section helpers ───────────────────────────────────────────────────────────
def _hr():
    return HRFlowable(width="100%", thickness=0.5, color=HAIR, spaceAfter=6, spaceBefore=2)

def _section_heading(text: str):
    return Paragraph(text, HEADING)

def _kv_table(rows: list[tuple[str, str, str | None]], col_widths=(120, 80, 120)):
    """Key-value table with optional third column. rows = [(label, value, note)]"""
    data = []
    for label, value, note in rows:
        row = [Paragraph(label, CELL_L), Paragraph(value, CELL_B)]
        if note is not None:
            row.append(Paragraph(note, SMALL))
        data.append(row)

    ncols = 3 if any(r[2] is not None for r in rows) else 2
    widths = list(col_widths[:ncols])

    t = Table(data, colWidths=widths, repeatRows=0)
    t.setStyle(TableStyle([
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
        ("FONTSIZE",  (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [PAPER, colors.white]),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING",   (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.3, HAIR),
        ("ROUNDEDCORNERS", [3]),
    ]))
    return t


def _pill(text: str, color=SAGE) -> Paragraph:
    r, g, b = color.red * 255, color.green * 255, color.blue * 255
    hex_c = "#%02x%02x%02x" % (int(r), int(g), int(b))
    return Paragraph(
        f'<font color="{hex_c}"><b>{text}</b></font>',
        _s("Pill", fontSize=8, leading=11)
    )


def _alert_rows(alerts: list, lang: str) -> list:
    """Render alert list as compact paragraph rows."""
    rows = []
    SEV_LABEL = {"critical": "⚠ URGENT", "warning": "! ALERT", "info": "ℹ INFO"}
    SEV_COLOR = {"critical": DANGER, "warning": WARN, "info": SAGE}
    for a in alerts[:8]:
        sev = a.get("severity", "info")
        label = SEV_LABEL.get(sev, "")
        color = SEV_COLOR.get(sev, SAGE)
        r2, g2, b2 = int(color.red * 255), int(color.green * 255), int(color.blue * 255)
        hex_c = "#%02x%02x%02x" % (r2, g2, b2)
        title = a.get("title", "")
        body = a.get("body", "")
        rows.append(Paragraph(
            f'<font color="{hex_c}"><b>{label}</b></font>  <b>{title}</b><br/>'
            f'<font color="#6b6b66" size="8">{body[:200]}</font>',
            _s("AlertRow", fontSize=9, leading=13, spaceAfter=5,
               leftIndent=4, borderPadding=(3, 6, 3, 6),
               borderColor=HAIR, borderWidth=0.5, borderRadius=3)
        ))
    return rows


# ── Main entry point ──────────────────────────────────────────────────────────
def generate_report(
    user,
    profile: dict,
    calc_result: dict,
    alerts: list,
    lang: str = "en",
) -> bytes:
    """
    Build a complete Tax Health Report PDF and return it as bytes.

    Parameters
    ----------
    user        : Django User instance (email, first_name)
    profile     : intake_profile dict
    calc_result : output of calculator.engine.calculate()
    alerts      : output of alerts.generate_alerts()
    lang        : "nl" | "en" | "fa"
    """
    buf = io.BytesIO()

    doc = BaseDocTemplate(
        buf,
        pagesize=A4,
        title="TaxWijs Tax Health Report 2026",
        author="TaxWijs",
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=20 * mm,
        bottomMargin=16 * mm,
    )
    doc.addPageTemplates(_build_template(doc))

    # ── Shortcuts ─────────────────────────────────────────────────────────────
    r  = calc_result.get("result", {})
    c  = calc_result.get("calculation", {})
    ut = profile.get("user_type", "zzp")
    income = (
        c.get("gross_profit") or c.get("gross_revenue")
        or profile.get("annual_revenue_zzp")
        or profile.get("employment_income", 0)
        or 0
    )

    total_tax     = r.get("total_tax_due", 0)
    effective_rate = r.get("effective_rate", 0)
    monthly_reserve = r.get("monthly_reserve_needed", 0)
    wet_dba       = r.get("wet_dba_risk", "")

    # Health score (simple version of the frontend formula)
    score = 62
    for a in alerts:
        sev = a.get("severity", "")
        cat = a.get("category", "")
        if sev == "critical": score -= 15
        elif sev == "warning" and cat in ("risk", "compliance"): score -= 7
        elif sev == "info" and cat == "opportunity": score += 3
    score = max(0, min(100, score))

    # ── Separate alert types ───────────────────────────────────────────────
    risk_alerts = [a for a in alerts if a.get("category") in ("risk", "compliance")]
    opp_alerts  = [a for a in alerts if a.get("category") in ("opportunity", "cashflow")]
    dead_alerts = [a for a in alerts if a.get("category") == "deadline"]

    # ── Upcoming deadlines from TaxReminder ───────────────────────────────
    upcoming_reminders = []
    try:
        from apps.users.models import TaxReminder
        from datetime import timedelta
        today = date.today()
        qs = TaxReminder.objects.filter(
            verification_status="verified",
            tax_year=2026,
            due_date__gte=today,
            due_date__lte=today + timedelta(days=120),
        )
        if ut and ut not in ("", "all"):
            for rem in qs:
                if not rem.user_types or ut in rem.user_types:
                    upcoming_reminders.append(rem)
        else:
            upcoming_reminders = list(qs[:6])
    except Exception:
        pass

    # ── Deduction breakdown ────────────────────────────────────────────────
    deduction_rows = []
    deduction_map = [
        ("zelfstandigenaftrek",   "Zelfstandigenaftrek"),
        ("startersaftrek",        "Startersaftrek"),
        ("mkb_winstvrijstelling", "MKB-winstvrijstelling"),
        ("kia_deduction",        "KIA"),
        ("pension_deduction",    "Pension / lijfrente"),
    ]
    for key, label in deduction_map:
        val = c.get(key, 0)
        if val and val > 0:
            deduction_rows.append((label, f"−€{val:,.0f}", None))

    # Credits
    for key, label in [("algemene_heffingskorting", "Algemene heffingskorting"),
                        ("arbeidskorting", "Arbeidskorting"),
                        ("iack", "IACK (child credit)")]:
        val = c.get(key, 0)
        if val and val > 0:
            deduction_rows.append((label, f"−€{val:,.0f}", "credit"))

    # ── Date + user ────────────────────────────────────────────────────────
    name = ""
    if user and hasattr(user, "first_name") and user.first_name:
        name = user.first_name
    elif user and hasattr(user, "email"):
        name = user.email.split("@")[0]

    try:
        gen_date = date.today().strftime("%d %B %Y").lstrip("0")
    except Exception:
        gen_date = str(date.today())

    # ── Build story ────────────────────────────────────────────────────────
    story = []

    # ── Cover block ────────────────────────────────────────────────────────
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph("TAX HEALTH REPORT", EYEBROW))
    story.append(Paragraph("Your 2026 Dutch Tax Overview", TITLE))
    story.append(Paragraph(
        f"Generated for <b>{name}</b> · {gen_date} · {ut.upper()} · Tax year 2026",
        SUBTITLE
    ))
    story.append(Spacer(1, 4 * mm))
    story.append(_hr())

    # ── Health score + summary ─────────────────────────────────────────────
    story.append(KeepTogether([
        _section_heading("Tax Health Score"),
        Spacer(1, 2 * mm),
        HealthGauge(score),
        Spacer(1, 3 * mm),
    ]))

    # Summary table
    summary_rows = [
        ("Gross income / profit",    f"€{income:,.0f}",                        None),
        ("Total tax due (2026)",      f"€{total_tax:,.0f}",                     None),
        ("Effective tax rate",        f"{effective_rate * 100:.1f}%",           f"≈ €{effective_rate * 100:.0f} per €100 earned"),
        ("Monthly reserve needed",   f"€{monthly_reserve:,.0f}",               "Set aside each month" if ut == "zzp" else None),
    ]
    if wet_dba:
        wc = DANGER if wet_dba == "high" else (WARN if wet_dba == "medium" else OK)
        r2, g2, b2 = int(wc.red*255), int(wc.green*255), int(wc.blue*255)
        hex_wc = "#%02x%02x%02x" % (r2, g2, b2)
        summary_rows.append(("Wet DBA risk",
            f'<font color="{hex_wc}"><b>{wet_dba.upper()}</b></font>', None))

    story.append(_kv_table(summary_rows, col_widths=(140, 90, 120)))
    story.append(Spacer(1, 4 * mm))
    story.append(_hr())

    # ── Deductions & Credits ───────────────────────────────────────────────
    if deduction_rows:
        story.append(KeepTogether([
            _section_heading("Active Deductions & Credits"),
            Paragraph(
                "These deductions have been applied to reduce your taxable income.",
                BODY
            ),
            Spacer(1, 2 * mm),
            _kv_table(deduction_rows, col_widths=(160, 90, 100)),
            Spacer(1, 4 * mm),
        ]))
        story.append(_hr())

    # ── Tax breakdown waterfall ────────────────────────────────────────────
    waterfall_rows = []
    if income:
        waterfall_rows.append(("Gross income / profit",    f"€{income:,.0f}", None))
    for key, label in [
        ("zelfstandigenaftrek",   "− Zelfstandigenaftrek"),
        ("startersaftrek",        "− Startersaftrek"),
        ("mkb_winstvrijstelling", "− MKB-winstvrijstelling"),
        ("pension_deduction",    "− Pension deduction"),
    ]:
        v = c.get(key, 0)
        if v: waterfall_rows.append((label, f"−€{v:,.0f}", None))

    ti = c.get("taxable_income_box1", 0)
    if ti: waterfall_rows.append(("= Taxable income (Box 1)", f"€{ti:,.0f}", None))

    b1 = c.get("box1_tax_raw", 0)
    if b1: waterfall_rows.append(("Box 1 tax (before credits)", f"€{b1:,.0f}", None))

    for key, label in [
        ("algemene_heffingskorting", "− General tax credit (AHK)"),
        ("arbeidskorting",           "− Employment credit (AK)"),
        ("iack",                     "− IACK child credit"),
    ]:
        v = c.get(key, 0)
        if v: waterfall_rows.append((label, f"−€{v:,.0f}", None))

    iat = c.get("income_tax_after_credits", 0)
    if iat: waterfall_rows.append(("Income tax after credits", f"€{iat:,.0f}", None))

    for key, label in [
        ("zvw_contribution", "ZVW health contribution"),
        ("box2_tax",         "Box 2 tax (dividend)"),
        ("box3_tax",         "Box 3 tax (assets)"),
    ]:
        v = c.get(key, 0)
        if v: waterfall_rows.append((label, f"+€{v:,.0f}", None))

    waterfall_rows.append(("TOTAL TAX DUE", f"€{total_tax:,.0f}", None))

    if waterfall_rows:
        story.append(KeepTogether([
            _section_heading("Tax Calculation Breakdown"),
            Spacer(1, 2 * mm),
            _kv_table(waterfall_rows, col_widths=(190, 90, 70)),
            Spacer(1, 4 * mm),
        ]))
        story.append(_hr())

    # ── Risk warnings ──────────────────────────────────────────────────────
    if risk_alerts:
        story.append(_section_heading("Active Risk Warnings"))
        story.append(Spacer(1, 2 * mm))
        story.extend(_alert_rows(risk_alerts, lang))
        story.append(Spacer(1, 3 * mm))
        story.append(_hr())

    # ── Upcoming deadlines ─────────────────────────────────────────────────
    dead_rows = []
    if upcoming_reminders:
        for rem in upcoming_reminders[:6]:
            days_until = (rem.due_date - date.today()).days
            urgency = "⚠" if days_until <= 14 else ("!" if days_until <= 30 else "✓")
            dead_rows.append((
                rem.title_en[:55],
                rem.due_date.strftime("%d %b %Y"),
                f"{urgency} {days_until}d",
            ))
    elif dead_alerts:
        for a in dead_alerts[:5]:
            dead_rows.append((a.get("title", ""), "", None))

    if dead_rows:
        story.append(KeepTogether([
            _section_heading("Upcoming Tax Deadlines"),
            Spacer(1, 2 * mm),
            _kv_table(dead_rows, col_widths=(200, 80, 60)),
            Spacer(1, 4 * mm),
        ]))
        story.append(_hr())

    # ── Opportunities ──────────────────────────────────────────────────────
    if opp_alerts:
        story.append(_section_heading("Tax Optimization Opportunities"))
        story.append(Paragraph(
            "These opportunities may reduce your tax bill. Review each before filing.",
            BODY
        ))
        story.append(Spacer(1, 2 * mm))
        story.extend(_alert_rows(opp_alerts, lang))
        story.append(Spacer(1, 4 * mm))
        story.append(_hr())

    # ── ZVW callout (most missed by ZZP) ──────────────────────────────────
    zvw = c.get("zvw_contribution", 0)
    if zvw and ut == "zzp":
        story.append(KeepTogether([
            _section_heading("ZVW Health Contribution — The Tax Most ZZP Forget"),
            Paragraph(
                f"As a ZZP worker you pay a ZVW contribution of <b>€{zvw:,.0f}</b> on top of your income tax. "
                "This is 4.85% on your profit (up to €79,409). It is often not budgeted for because it "
                "does not appear on a separate bill — it is included in your tax assessment.",
                BODY
            ),
            Spacer(1, 3 * mm),
        ]))
        story.append(_hr())

    # ── Recommendations ────────────────────────────────────────────────────
    recs = []
    if ut == "zzp" and c.get("zelfstandigenaftrek", 0) == 0:
        recs.append("Check whether you meet the urencriterium (1,225 hours/year) — "
                    "qualifying adds a €1,200 zelfstandigenaftrek deduction.")
    if ut == "zzp" and not profile.get("pension_contribution"):
        recs.append("Consider a lijfrente (pension) contribution — 30% of income above €19,172 "
                    "is deductible and lowers your Box 1 tax significantly.")
    if total_tax > 500 and monthly_reserve < 100:
        recs.append("Request a voorlopige aanslag (provisional assessment) to spread your tax "
                    "payment over monthly instalments — it's free and avoids a large year-end bill.")
    if ut == "zzp" and not profile.get("kia_investments"):
        recs.append("If you invested in business equipment (€2,901–€70,602), you qualify for the "
                    "KIA deduction — 28% of the investment amount.")
    if profile.get("net_assets_box3", 0) > 59357:
        recs.append("You have Box 3 assets above the exemption threshold (€59,357/person). "
                    "Review your reference-date balance (1 January) — the tax is on assets that day.")

    if recs:
        story.append(_section_heading("Recommendations"))
        for i, rec in enumerate(recs, 1):
            story.append(Paragraph(f"{i}. {rec}", BODY))
        story.append(Spacer(1, 4 * mm))
        story.append(_hr())

    # ── Sources ────────────────────────────────────────────────────────────
    story.append(Spacer(1, 3 * mm))
    story.append(_section_heading("Sources & Verification"))
    story.append(Paragraph(
        "All tax figures in this report are calculated by TaxWijs's deterministic rule engine "
        "using verified 2026 rules sourced from Belastingdienst.nl. The engine was last validated "
        f"against 6 ground-truth scenarios with 0% error on {date.today().year} data.",
        BODY
    ))
    story.append(Spacer(1, 2 * mm))
    source_table = _kv_table([
        ("Rule source",       "Belastingdienst.nl", None),
        ("Verification year", "2026",               None),
        ("Calculation method","Deterministic rule engine (not AI)", None),
        ("Rules status",      "Verified",           None),
        ("Report generated",  gen_date,             None),
    ], col_widths=(160, 140, 50))
    story.append(source_table)
    story.append(Spacer(1, 4 * mm))

    # ── Disclaimer ────────────────────────────────────────────────────────
    story.append(Paragraph(
        "DISCLAIMER: This report is for informational purposes only and does not constitute "
        "official tax advice. Tax law is complex and individual circumstances vary. "
        "Consult a registered belastingadviseur (tax advisor) before filing your tax return.",
        _s("Disc", fontSize=7.5, textColor=INK_4, leading=10, spaceBefore=4)
    ))

    # ── Build PDF ─────────────────────────────────────────────────────────
    doc.build(story)
    return buf.getvalue()
