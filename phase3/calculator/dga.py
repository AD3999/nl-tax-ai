"""DGA gebruikelijk loon check."""

from __future__ import annotations

from phase3.data_loader import dga_params


def check_gebruikelijk_loon(salary: float) -> tuple[bool, float, str]:
    """
    Verify DGA salary meets the gebruikelijk loon minimum.

    Returns:
        (meets_minimum, min_salary, note)
    """
    p = dga_params()
    min_salary = p["min_salary"]  # 56_000

    if salary >= min_salary:
        return True, min_salary, f"Salary €{salary:,.0f} meets minimum gebruikelijk loon €{min_salary:,.0f}"

    note = (
        f"Salary €{salary:,.0f} is below minimum gebruikelijk loon €{min_salary:,.0f}. "
        "Belastingdienst may impute the minimum — risk of additional assessment."
    )
    return False, min_salary, note
