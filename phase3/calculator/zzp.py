"""
ZZP-specific deductions and contributions:
  - Zelfstandigenaftrek (ZA)
  - Startersaftrek (SA)
  - Kleinschaligheidsinvesteringsaftrek (KIA)
  - MKB-winstvrijstelling (MKB)
  - ZVW-bijdrage
  - Lijfrente jaarruimte (pension deduction)
"""

from __future__ import annotations

from phase3.data_loader import kia_params, mkb_params, sa_params, za_params, zvw_params


def calc_zelfstandigenaftrek(gross_profit: float, hours_per_year: int) -> float:
    """€1,200 deduction; requires ≥ 1,225 hours/year."""
    p = za_params()
    if hours_per_year < p["min_hours"]:
        return 0.0
    return min(p["amount"], gross_profit)


def calc_startersaftrek(
    gross_profit: float,
    zelfstandigenaftrek: float,
    hours_per_year: int,
    is_starter: bool,
) -> float:
    """€2,123 additional deduction; requires ZA eligibility and starter status."""
    p = sa_params()
    if not is_starter or hours_per_year < 1225:
        return 0.0
    return min(p["amount"], max(0.0, gross_profit - zelfstandigenaftrek))


def calc_kia(investment_amount: float) -> float:
    """
    Kleinschaligheidsinvesteringsaftrek.

    Tiers (read from JSON formula string):
      ≤ €2,900           : no KIA
      €2,901 – €70,602   : 28 % of investment
      €70,603 – €132,746 : fixed €20,072
      €132,747 – €398,236: tapers from €20,072 to 0
      > €398,236         : no KIA
    """
    p = kia_params()
    if investment_amount < p["min_investments"]:
        return 0.0

    if investment_amount <= 70602:
        return round(investment_amount * 0.28)
    if investment_amount <= 132746:
        return 20072.0
    if investment_amount <= p["max_investments"]:
        fraction = (p["max_investments"] - investment_amount) / (p["max_investments"] - 132746)
        return round(fraction * 20072)
    return 0.0


def calc_mkb(profit_after_ondernemers: float) -> float:
    """12.7 % of profit after ondernemersaftrek; no hours requirement."""
    p = mkb_params()
    return round(max(0.0, profit_after_ondernemers) * p["rate"])


def calc_zvw(profit_after_ondernemers: float) -> float:
    """
    ZVW-bijdrage: 4.85 % on profit after OA, ceiling €79,409.

    Paid via the annual IB return — separate from Box 1 income tax.
    """
    p = zvw_params()
    base = min(max(0.0, profit_after_ondernemers), p["ceiling"])
    return round(base * p["rate"])


def calc_zzp_deductions(
    gross_profit: float,
    hours_per_year: int,
    is_starter: bool,
    kia_investments: float,
    pension_contribution: float,
) -> dict:
    """
    Full ZZP deduction chain in the correct order:
      1. Zelfstandigenaftrek
      2. Startersaftrek
      3. KIA (kleinschaligheidsinvesteringsaftrek)
      4. Ondernemersaftrek total = ZA + SA + KIA
      5. Profit after ondernemersaftrek
      6. MKB-winstvrijstelling (on profit after OA)
      7. Profit after MKB
      8. Pension / lijfrente deduction
      9. Taxable income Box 1
      10. ZVW (on profit after OA)

    Returns a dict with all intermediate values.
    """
    za = calc_zelfstandigenaftrek(gross_profit, hours_per_year)
    sa = calc_startersaftrek(gross_profit, za, hours_per_year, is_starter)
    kia = calc_kia(kia_investments)

    oa_total = za + sa + kia
    profit_after_oa = max(0.0, gross_profit - oa_total)

    mkb = calc_mkb(profit_after_oa)
    profit_after_mkb = max(0.0, profit_after_oa - mkb)

    pension_ded = min(pension_contribution, profit_after_mkb)
    taxable_box1 = max(0.0, profit_after_mkb - pension_ded)

    zvw = calc_zvw(profit_after_oa)

    return {
        "zelfstandigenaftrek": za,
        "startersaftrek": sa,
        "kia_deduction": kia,
        "pension_deduction": pension_ded,
        "ondernemersaftrek_total": oa_total,
        "profit_after_ondernemers": profit_after_oa,
        "mkb_winstvrijstelling": mkb,
        "taxable_income_box1": taxable_box1,
        "zvw_contribution": zvw,
    }
