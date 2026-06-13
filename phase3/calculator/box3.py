"""
Box 3 wealth tax on fictitious returns.

Savings: 1.28 % fictitious return
Investments (and everything else): 6.00 % fictitious return
Tax rate: 36 % on the fictitious return amount.
Reference date: 1 January of the tax year.
"""

from __future__ import annotations

from typing import Optional

from phase3.data_loader import box3_params


def calc_box3_tax(
    net_assets: float,
    has_partner: bool,
    savings: Optional[float] = None,
    investments: Optional[float] = None,
) -> tuple[float, float]:
    """
    Calculate Box 3 tax.

    If savings/investments are not specified separately, all above-exemption
    assets are treated as investments (6 % fictitious return), which is the
    assumption used in the Phase 1 seed scenarios.

    Returns:
        (taxable_box3_assets, box3_tax)
    """
    if net_assets <= 0:
        return 0.0, 0.0

    p = box3_params()
    exemption = p["exemption_per_person"] * (2 if has_partner else 1)
    savings_return = p["savings_return"]       # 0.0128
    invest_return = p["investments_return"]    # 0.06
    tax_rate = p["tax_rate"]                   # 0.36

    taxable_assets = max(0.0, net_assets - exemption)
    if taxable_assets <= 0:
        return 0.0, 0.0

    # Split into savings / investments
    if savings is not None and investments is not None:
        # Proportional split or explicit values
        sav = min(savings, taxable_assets)
        inv = max(0.0, taxable_assets - sav)
    elif savings is not None:
        sav = min(savings, taxable_assets)
        inv = max(0.0, taxable_assets - sav)
    else:
        # Default: all treated as investments (seed scenario assumption)
        sav = 0.0
        inv = taxable_assets

    fictitious_return = sav * savings_return + inv * invest_return
    box3_tax = round(fictitious_return * tax_rate)

    return taxable_assets, box3_tax
