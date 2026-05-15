"""
Converts Phase 1 ib_form_mapping.json records into Chunk objects.

One Chunk per IB form field. The common_mistakes and ai_follow_up_questions
arrays are rendered as readable prose — not as JSON arrays — so they embed well.
"""

from __future__ import annotations

import json
from pathlib import Path

from phase2.store.schema import Chunk

PHASE1_SEED = Path(__file__).parent.parent.parent / "phase1" / "data" / "seed"


def _build_ib_chunk_text(field: dict) -> str:
    code = field["field_code"]
    box = field["box"]
    section_nl = field.get("section_nl", "")
    section_en = field.get("section_en", "")
    label_nl = field.get("official_label_nl", "")

    q_nl = field.get("plain_question_nl", "")
    q_en = field.get("plain_question_en", "")
    q_fa = field.get("plain_question_fa", "")

    help_nl = field.get("help_text_nl", "")
    help_en = field.get("help_text_en", "")
    help_fa = field.get("help_text_fa", "")

    mistakes = field.get("common_mistakes", [])
    follow_ups = field.get("ai_follow_up_questions", [])
    rule_ids = ", ".join(field.get("rule_ids", []))
    source_url = field.get("source_url", "")
    user_types = ", ".join(field.get("user_types", []))

    lines = [
        f"[IB FORM FIELD: {code}] Box: {box} | Section: {section_nl} / {section_en}",
        f"Official label: {label_nl}",
        f"Users: {user_types}",
        "",
        f"Question (NL): {q_nl}",
        f"Question (EN): {q_en}",
        f"Question (FA): {q_fa}",
        "",
        f"Help (NL): {help_nl}",
        f"Help (EN): {help_en}",
        f"Help (FA): {help_fa}",
    ]

    if mistakes:
        lines.append("")
        lines.append("Common mistakes:")
        for i, m in enumerate(mistakes, 1):
            lines.append(f"  {i}. {m}")

    if follow_ups:
        lines.append("")
        lines.append("AI follow-up questions to ask the user:")
        for i, q in enumerate(follow_ups, 1):
            lines.append(f"  {i}. {q}")

    if rule_ids:
        lines.append("")
        lines.append(f"Related rules: {rule_ids}")

    lines.append(f"Source: {source_url}")
    return "\n".join(lines)


def chunk_ib_fields(path: Path | None = None) -> list[Chunk]:
    """
    Load ib_form_mapping.json and return one Chunk per field.

    Args:
        path: Override the default seed file path (useful for testing).
    """
    if path is None:
        path = PHASE1_SEED / "ib_form_mapping.json"

    with open(path, encoding="utf-8") as f:
        fields: list[dict] = json.load(f)

    chunks: list[Chunk] = []
    for field in fields:
        code = field["field_code"]
        user_types = field.get("user_types", [])

        chunk = Chunk(
            chunk_id=f"ib-{code}",
            text=_build_ib_chunk_text(field),
            doc_type="ib_field",
            source_id=f"IB-{code.upper()}",
            year=2026,
            topic=f"ib_form_field_{code}",
            user_types=user_types,
            verification_status="verified",
            effective_from="2026-01-01",
            effective_until=None,
            source_url=field.get("source_url", ""),
            ai_prompt_hint=None,
            expected_ai_behavior="ask_clarifying_question",
            language="multilingual",
            priority=1.0,
        )
        chunks.append(chunk)

    return chunks


if __name__ == "__main__":
    chunks = chunk_ib_fields()
    print(f"Produced {len(chunks)} IB field chunks")
    print("\n--- Sample (field 1a) ---")
    for c in chunks:
        if "1a" in c.chunk_id:
            print(c.text)
            break
