"""
Tax calculation orchestrator.

calculate(profile) → TaxResult

Supports user_types: zzp, employee, expat, dga.

Core principle: the AI never computes numbers — this module does.
"""

from __future__ import annotations

from phase3.calculator.box1 import calc_income_tax
from phase3.calculator.box2 import calc_box2_tax
from phase3.calculator.box3 import calc_box3_tax
from phase3.calculator.dga import check_gebruikelijk_loon
from phase3.calculator.toeslagen import check_huurtoeslag, check_zorgtoeslag
from phase3.calculator.wet_dba import score_wet_dba
from phase3.calculator.zzp import calc_zzp_deductions
from phase3.tax_types import TaxCalculation, TaxProfile, TaxResult


def _calc_30pct_ruling_factor(ruling_year: int) -> float:
    """Return the tax-free fraction for the given year of the 30% ruling."""
    if ruling_year <= 3:
        return 0.30
    if ruling_year == 4:
        return 0.20
    if ruling_year == 5:
        return 0.10
    return 0.0


def calculate(profile: TaxProfile) -> TaxResult:
    """
    Full deterministic tax calculation for the given profile.

    Steps vary by user_type:
      zzp     — business income, ZZP deductions, ZVW
      employee — salary income, no ZZP deductions, no ZVW
      expat   — salary × (1 − 30%-ruling fraction) as taxable income
      dga     — salary + pension, Box 2 dividend, Box 3 wealth
    """
    calc = TaxCalculation()
    rule_ids: list[str] = []

    # -----------------------------------------------------------------------
    # Step 1 — Gross income
    # -----------------------------------------------------------------------
    ut = profile.user_type

    if ut == "zzp":
        calc.gross_revenue = profile.annual_revenue_zzp
        calc.business_expenses = profile.business_expenses
        calc.gross_profit = profile.annual_revenue_zzp - profile.business_expenses

    elif ut == "employee":
        calc.gross_revenue = profile.employment_income
        calc.gross_profit = profile.employment_income

    elif ut == "expat":
        gross_salary = profile.employment_income
        factor = _calc_30pct_ruling_factor(profile.ruling_year)
        calc.gross_revenue = gross_salary
        calc.gross_profit = gross_salary * (1.0 - factor)  # taxable after ruling
        rule_ids.append("EXP-2026-001")

    elif ut == "dga":
        salary = profile.employment_income
        calc.gross_revenue = salary
        calc.gross_profit = salary  # DGA salary (no business expenses at personal level)

    else:
        raise ValueError(f"Unknown user_type: {ut!r}. Must be zzp/employee/expat/dga.")

    # -----------------------------------------------------------------------
    # Step 2 — Deductions (ZZP and DGA only for pension)
    # -----------------------------------------------------------------------
    if ut == "zzp":
        zzp = calc_zzp_deductions(
            gross_profit=calc.gross_profit,
            hours_per_year=profile.hours_per_year,
            is_starter=profile.is_starter,
            kia_investments=profile.kia_investments,
            pension_contribution=profile.pension_contribution,
        )
        calc.zelfstandigenaftrek = zzp["zelfstandigenaftrek"]
        calc.startersaftrek = zzp["startersaftrek"]
        calc.kia_deduction = zzp["kia_deduction"]
        calc.pension_deduction = zzp["pension_deduction"]
        calc.ondernemersaftrek_total = zzp["ondernemersaftrek_total"]
        calc.profit_after_ondernemers = zzp["profit_after_ondernemers"]
        calc.mkb_winstvrijstelling = zzp["mkb_winstvrijstelling"]
        calc.taxable_income_box1 = zzp["taxable_income_box1"]
        calc.zvw_contribution = zzp["zvw_contribution"]

        if calc.zelfstandigenaftrek > 0:
            rule_ids.append("ZA-2026-001")
        if calc.startersaftrek > 0:
            rule_ids.append("SA-2026-001")
        if calc.kia_deduction > 0:
            rule_ids.append("KIA-2026-001")
        rule_ids.append("MKB-2026-001")
        rule_ids.append("ZVW-2026-001")

    elif ut == "dga":
        # DGA: salary - pension contribution = Box 1 taxable
        pension_ded = min(profile.pension_contribution, calc.gross_profit)
        calc.pension_deduction = pension_ded
        calc.profit_after_ondernemers = calc.gross_profit
        calc.taxable_income_box1 = max(0.0, calc.gross_profit - pension_ded)

    else:
        # employee / expat: taxable = gross_profit (after 30% ruling if applicable)
        calc.taxable_income_box1 = calc.gross_profit
        calc.profit_after_ondernemers = calc.gross_profit

    # -----------------------------------------------------------------------
    # Step 3 — Box 1 tax + heffingskortingen
    # -----------------------------------------------------------------------
    has_child_u12 = profile.children_under_12 > 0

    # For IACK in couples: goes to lower-earning partner.
    # Here we assume the profile holder is the lower earner when has_partner is true
    # and partner_income is higher. For simplicity, we compute IACK on the filer's
    # taxable_box1 as the work income.
    work_income = calc.taxable_income_box1

    # aggregate income for AHK: Box 1 + Box 2 + Box 3 (approximated before Box2/3 computed)
    # We'll compute Box 2 and 3 taxes first to get aggregate income.

    # Step 3a — Box 2
    dividend = profile.box2_dividend if ut == "dga" else 0.0
    calc.box2_tax = calc_box2_tax(dividend)
    if calc.box2_tax > 0:
        rule_ids.extend(["B2R-2026-001", "B2R-2026-002"])

    # Step 3b — Box 3
    _, calc.box3_tax = calc_box3_tax(
        net_assets=profile.net_assets_box3,
        has_partner=profile.has_partner,
        savings=profile.box3_savings,
        investments=profile.box3_investments,
    )
    if calc.box3_tax > 0:
        rule_ids.append("B3R-2026-001")

    # Step 3c — Aggregate income (Box 1 + Box 2 + Box 3 income)
    # Box 2 income = dividend; Box 3 income = fictitious returns
    # For AHK phase-out the Dutch system uses box1 taxable + box2 + box3 fictitious.
    # Simplified: use taxable_box1 as aggregate (close enough for most scenarios;
    # exact aggregate requires box 3 grondslag which we don't compute separately).
    aggregate_income = calc.taxable_income_box1  # dominant for most users

    box1_result = calc_income_tax(
        taxable_income_box1=calc.taxable_income_box1,
        aggregate_income=aggregate_income,
        work_income=work_income,
        has_child_under_12=has_child_u12,
    )

    calc.box1_tax_bracket1 = box1_result["box1_tax_bracket1"]
    calc.box1_tax_bracket2 = box1_result["box1_tax_bracket2"]
    calc.box1_tax_bracket3 = box1_result["box1_tax_bracket3"]
    calc.box1_tax_raw = box1_result["box1_tax_raw"]
    calc.algemene_heffingskorting = box1_result["algemene_heffingskorting"]
    calc.arbeidskorting = box1_result["arbeidskorting"]
    calc.iack = box1_result["iack"]
    calc.income_tax_after_credits = box1_result["income_tax_after_credits"]

    rule_ids.extend(["BR1-2026-001", "BR1-2026-003"])
    rule_ids.append("AHK-2026-001")
    rule_ids.append("AK-2026-001")
    if calc.iack > 0:
        rule_ids.append("IACK-2026-001")

    # -----------------------------------------------------------------------
    # Step 4 — Total tax
    # -----------------------------------------------------------------------
    calc.total_tax_due = round(
        calc.income_tax_after_credits
        + calc.zvw_contribution
        + calc.box2_tax
        + calc.box3_tax
    )

    # Base income for effective rate
    base_income = calc.gross_profit if calc.gross_profit > 0 else profile.employment_income
    calc.effective_rate = round(calc.total_tax_due / base_income, 3) if base_income > 0 else 0.0

    # -----------------------------------------------------------------------
    # Step 5 — Monthly reserve (ZZP / DGA need to set aside; employees don't)
    # -----------------------------------------------------------------------
    monthly_reserve = 0.0
    if ut in ("zzp",):
        monthly_reserve = round(calc.total_tax_due / 12)

    # -----------------------------------------------------------------------
    # Step 6 — Toeslagen eligibility
    # -----------------------------------------------------------------------
    eligible_toeslagen: list[str] = []
    toeslagen_value = 0.0

    zt_eligible, zt_value = check_zorgtoeslag(
        aggregate_income=aggregate_income,
        has_partner=profile.has_partner,
        net_assets=profile.net_assets_box3,
    )
    if zt_eligible:
        eligible_toeslagen.append("zorgtoeslag")
        toeslagen_value += zt_value
        rule_ids.append("ZT-2026-001")

    ht_eligible, ht_value = check_huurtoeslag(
        aggregate_income=aggregate_income,
        rent_per_month=profile.rent_per_month,
        has_partner=profile.has_partner,
    )
    if ht_eligible:
        eligible_toeslagen.append("huurtoeslag")
        toeslagen_value += ht_value
        rule_ids.append("HT-2026-001")

    # -----------------------------------------------------------------------
    # Step 7 — Wet DBA risk
    # -----------------------------------------------------------------------
    wet_dba_risk, wet_dba_reasons = score_wet_dba(
        single_client_percentage=profile.single_client_percentage,
        user_type=ut,
    )
    if wet_dba_risk not in ("n/a",):
        rule_ids.append("WD-2026-001")

    # -----------------------------------------------------------------------
    # Step 8 — DGA checks
    # -----------------------------------------------------------------------
    if ut == "dga":
        check_gebruikelijk_loon(profile.employment_income)
        rule_ids.append("DGA-2026-001")

    return TaxResult(
        total_tax_due=calc.total_tax_due,
        effective_rate=calc.effective_rate,
        monthly_reserve_needed=monthly_reserve,
        calculation=calc,
        eligible_toeslagen=eligible_toeslagen,
        toeslagen_value=round(toeslagen_value),
        wet_dba_risk=wet_dba_risk,
        wet_dba_reasons=wet_dba_reasons,
        rule_ids_applied=list(dict.fromkeys(rule_ids)),  # deduplicate, preserve order
    )
