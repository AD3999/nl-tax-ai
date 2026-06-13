"""
Dataclasses for Phase 3 tax calculator inputs and outputs.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class TaxProfile:
    """Input profile for a tax calculation."""

    user_type: str  # "zzp" | "employee" | "expat" | "dga"
    year: int = 2026

    # Income
    annual_revenue_zzp: float = 0.0
    business_expenses: float = 0.0
    employment_income: float = 0.0  # gross salary (employee / expat / dga salary)

    # ZZP-specific
    hours_per_year: int = 0
    years_as_entrepreneur: int = 0
    is_starter: bool = False
    kia_investments: float = 0.0
    pension_contribution: float = 0.0  # lijfrente jaarruimte contribution
    single_client_percentage: Optional[float] = None

    # Expat
    uses_30pct_ruling: bool = False
    ruling_year: int = 1  # which year of the ruling (1-5 for phase-down)

    # DGA
    has_company_bv: bool = False
    box2_dividend: float = 0.0  # dividend received this year

    # Household
    has_partner: bool = False
    partner_income: float = 0.0
    children: int = 0
    children_under_12: int = 0
    rent_per_month: Optional[float] = None

    # Box 3 wealth
    net_assets_box3: float = 0.0
    box3_savings: Optional[float] = None       # if None, all treated as investments
    box3_investments: Optional[float] = None


@dataclass
class TaxCalculation:
    """Full intermediate calculation steps — mirrors scenarios.json structure."""

    gross_revenue: float = 0.0
    business_expenses: float = 0.0
    gross_profit: float = 0.0

    # ZZP deductions
    zelfstandigenaftrek: float = 0.0
    startersaftrek: float = 0.0
    kia_deduction: float = 0.0
    pension_deduction: float = 0.0
    ondernemersaftrek_total: float = 0.0
    profit_after_ondernemers: float = 0.0
    mkb_winstvrijstelling: float = 0.0

    # Box 1
    taxable_income_box1: float = 0.0
    box1_tax_bracket1: float = 0.0
    box1_tax_bracket2: float = 0.0
    box1_tax_bracket3: float = 0.0
    box1_tax_raw: float = 0.0

    # Credits
    algemene_heffingskorting: float = 0.0
    arbeidskorting: float = 0.0
    iack: float = 0.0
    income_tax_after_credits: float = 0.0

    # Other taxes
    zvw_contribution: float = 0.0
    box2_tax: float = 0.0
    box3_tax: float = 0.0

    # Total
    total_tax_due: float = 0.0
    effective_rate: float = 0.0


@dataclass
class TaxResult:
    """Final result returned to callers."""

    total_tax_due: float
    effective_rate: float
    monthly_reserve_needed: float

    calculation: TaxCalculation = field(default_factory=TaxCalculation)

    eligible_toeslagen: list[str] = field(default_factory=list)
    toeslagen_value: float = 0.0

    wet_dba_risk: str = "n/a"  # "low" | "medium" | "high" | "n/a"
    wet_dba_reasons: list[str] = field(default_factory=list)

    optimization_opportunities: list[str] = field(default_factory=list)
    key_insights: list[str] = field(default_factory=list)
    rule_ids_applied: list[str] = field(default_factory=list)
