"""
Converts Phase 1 tax_rules_2026.json records into Chunk objects.

One Chunk per rule. All three language versions are embedded together so
a multilingual model maps Dutch, English, and Persian queries to the same vector.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from phase2.store.schema import Chunk

PHASE1_SEED = Path(__file__).parent.parent.parent / "phase1" / "data" / "seed"


def _condition_to_text(condition: dict) -> str:
    """Flatten a condition dict to a readable prose string."""
    parts: list[str] = []
    if "required" in condition:
        req = condition["required"]
        parts.append("Required: " + "; ".join(f"{k}={v}" for k, v in req.items()))
    if "optional" in condition:
        opt = condition["optional"]
        parts.append("Optional: " + "; ".join(f"{k}={v}" for k, v in opt.items()))
    if "exclusions" in condition and condition["exclusions"]:
        excl = condition["exclusions"]
        parts.append("Exclusions: " + "; ".join(f"{k}={v}" for k, v in excl.items()))
    return " | ".join(parts) if parts else "Always applies"


def _result_to_text(result: dict) -> str:
    """Format a result dict as a readable string."""
    rtype = result.get("type", "")
    value = result.get("value", "")
    unit = result.get("unit", "")
    formula = result.get("formula", "")
    parts = [f"Type: {rtype}", f"Value: {value} {unit}".strip()]
    if formula:
        parts.append(f"Formula: {formula}")
    return " | ".join(parts)


def _build_chunk_text(rule: dict[str, Any]) -> str:
    """Build the embeddable text string for a tax rule."""
    rule_id = rule["id"]
    topic = rule.get("topic", "")
    category = rule.get("category", "")
    user_types = ", ".join(rule.get("user_types", []))
    tags = ", ".join(rule.get("tags", []))

    plain_nl = rule.get("plain_nl", "")
    plain_en = rule.get("plain_en", "")
    plain_fa = rule.get("plain_fa", "")

    condition_text = _condition_to_text(rule.get("condition", {}))
    result_text = _result_to_text(rule.get("result", {}))

    notes = rule.get("notes", "")
    ai_hint = rule.get("ai_prompt_hint", "")
    source_url = rule.get("source_url", "")

    lines = [
        f"[TAX RULE: {rule_id}] Topic: {topic} | Category: {category} | Users: {user_types}",
        f"Dutch: {plain_nl}",
        f"English: {plain_en}",
        f"Persian: {plain_fa}",
        f"Condition: {condition_text}",
        f"Result: {result_text}",
    ]
    if notes:
        lines.append(f"Notes: {notes}")
    if ai_hint:
        lines.append(f"AI INSTRUCTION: {ai_hint}")
    lines.append(f"Tags: {tags}")
    lines.append(f"Source: {source_url}")

    return "\n".join(lines)


def chunk_rules(path: Path | None = None) -> list[Chunk]:
    """
    Load tax_rules_2026.json and return one Chunk per rule.

    Args:
        path: Override the default seed file path (useful for testing).
    """
    if path is None:
        path = PHASE1_SEED / "tax_rules_2026.json"

    with open(path, encoding="utf-8") as f:
        rules: list[dict] = json.load(f)

    chunks: list[Chunk] = []
    for rule in rules:
        chunk = Chunk(
            chunk_id=f"rule-{rule['id']}",
            text=_build_chunk_text(rule),
            doc_type="rule",
            source_id=rule["id"],
            year=rule["year"],
            topic=rule.get("topic", ""),
            user_types=rule.get("user_types", []),
            verification_status=rule.get("verification_status", "draft"),
            effective_from=rule.get("effective_from", ""),
            effective_until=rule.get("effective_until"),
            source_url=rule.get("source_url", ""),
            ai_prompt_hint=rule.get("ai_prompt_hint"),
            expected_ai_behavior=None,
            language="multilingual",
            priority=1.0,
        )
        chunks.append(chunk)

    return chunks


if __name__ == "__main__":
    chunks = chunk_rules()
    print(f"Produced {len(chunks)} rule chunks")
    print("\n--- Sample chunk (ZA-2026-001) ---")
    for c in chunks:
        if c.source_id == "ZA-2026-001":
            print(c.text)
            break
