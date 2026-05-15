"""
Converts Phase 1 scenarios.json records into Chunk objects.

One Chunk per scenario, written as natural-language prose so that semantic
similarity works for queries like "how much tax for a ZZP with ~€70k profit".
JSON structure is intentionally not reproduced — readable narrative is better for embedding.
"""

from __future__ import annotations

import json
from pathlib import Path

from phase2.store.schema import Chunk

PHASE1_SEED = Path(__file__).parent.parent.parent / "phase1" / "data" / "seed"

_USER_TYPE_LABELS = {
    "zzp": "ZZP freelancer",
    "employee": "employee",
    "expat": "expat",
    "dga": "DGA director",
}


def _build_scenario_text(scn: dict) -> str:
    """Convert a scenario record to readable prose for embedding."""
    scn_id = scn["id"]
    title = scn.get("title", "")
    user_type = scn.get("user_type", "")
    year = scn["year"]

    profile = scn.get("profile", {})
    calc = scn.get("calculation", {})
    result = scn.get("result", {})

    revenue = (
        profile.get("annual_revenue_zzp") or
        profile.get("employment_income") or
        profile.get("annual_salary_dga") or
        0
    )
    # Use `or 0` not `.get(key, 0)` because JSON null becomes Python None (not absent)
    expenses = profile.get("business_expenses") or 0
    gross_profit = calc.get("gross_profit") or (revenue - expenses)
    taxable_income = calc.get("taxable_income_box1", 0)
    total_tax = result.get("total_tax_due", 0)
    effective_rate = result.get("effective_rate", 0)
    monthly_reserve = result.get("monthly_reserve_needed", 0)
    wet_dba_risk = result.get("wet_dba_risk", "")

    hours = profile.get("hours_per_year", 0)
    years_entrepreneur = profile.get("years_as_entrepreneur", 0)
    is_starter = profile.get("is_starter", False)
    has_children_u12 = profile.get("children_under_12", 0)
    uses_30pct = profile.get("uses_30pct_ruling", False)
    kia = profile.get("kia_investments", 0)

    applied_rules = ", ".join(scn.get("rule_ids_applied", []))
    insights = result.get("key_insights", [])
    opportunities = result.get("optimization_opportunities", [])
    toeslagen = result.get("eligible_toeslagen", [])

    user_label = _USER_TYPE_LABELS.get(user_type, user_type.upper())

    lines = [
        f"[SCENARIO: {scn_id}] {title} | Year: {year} | User type: {user_label}",
        "",
        f"Situation: A {user_label} with annual revenue of €{revenue:,} and business expenses of €{expenses:,}.",
    ]

    if hours:
        lines.append(f"Works {hours} hours/year on the business ({years_entrepreneur} years as entrepreneur).")
    if is_starter:
        lines.append("This person is a starter (startersaftrek may apply).")
    if has_children_u12:
        lines.append(f"Has {has_children_u12} child(ren) under 12 (IACK eligible).")
    if uses_30pct:
        lines.append("Uses the 30% expat ruling.")
    if kia:
        lines.append(f"Made qualifying KIA investments of €{kia:,}.")

    lines += [
        "",
        f"Tax calculation summary:",
        f"  Gross profit: €{gross_profit:,}",
        f"  Taxable income (Box 1): €{taxable_income:,}",
        f"  Total tax due: €{total_tax:,}",
        f"  Effective tax rate: {effective_rate * 100:.1f}%",
    ]

    if monthly_reserve:
        lines.append(f"  Monthly reserve needed: €{monthly_reserve:,}/month")
    if wet_dba_risk:
        lines.append(f"  Wet DBA risk level: {wet_dba_risk}")
    if toeslagen:
        lines.append(f"  Eligible toeslagen: {', '.join(toeslagen)}")

    if insights:
        lines.append("")
        lines.append("Key insights:")
        for insight in insights:
            lines.append(f"  - {insight}")

    if opportunities:
        lines.append("")
        lines.append("Optimization opportunities:")
        for opp in opportunities:
            lines.append(f"  - {opp}")

    if applied_rules:
        lines.append("")
        lines.append(f"Rules applied: {applied_rules}")

    return "\n".join(lines)


def chunk_scenarios(path: Path | None = None) -> list[Chunk]:
    """
    Load scenarios.json and return one Chunk per scenario.

    Args:
        path: Override the default seed file path (useful for testing).
    """
    if path is None:
        path = PHASE1_SEED / "scenarios.json"

    with open(path, encoding="utf-8") as f:
        scenarios: list[dict] = json.load(f)

    chunks: list[Chunk] = []
    for scn in scenarios:
        user_type = scn.get("user_type", "all")
        tags = scn.get("tags", [])
        topic = tags[0] if tags else user_type

        chunk = Chunk(
            chunk_id=f"scenario-{scn['id']}",
            text=_build_scenario_text(scn),
            doc_type="scenario",
            source_id=scn["id"],
            year=scn["year"],
            topic=topic,
            user_types=[user_type],
            verification_status="verified",
            effective_from=f"{scn['year']}-01-01",
            effective_until=None,
            source_url="https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/",
            ai_prompt_hint=None,
            expected_ai_behavior="answer_with_caveat",
            language="multilingual",
            priority=1.0,
        )
        chunks.append(chunk)

    return chunks


if __name__ == "__main__":
    chunks = chunk_scenarios()
    print(f"Produced {len(chunks)} scenario chunks")
    print("\n--- Sample (SCN-ZZP-001) ---")
    for c in chunks:
        if c.source_id == "SCN-ZZP-001":
            print(c.text)
            break
