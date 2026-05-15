"""
Converts Phase 1 qa_pairs_2026.json records into Chunk objects.

Strategy:
  - 1 canonical Chunk per Q&A pair (full trilingual question + trilingual answer)
  - N variant Chunks (one per question_variants entry) — lightweight, point back to canonical

Variant chunks exist purely for recall coverage. When retrieved, the assembler
uses qa_id to locate and render the full canonical chunk text.
"""

from __future__ import annotations

import json
from pathlib import Path

from phase2.store.schema import Chunk

PHASE1_SEED = Path(__file__).parent.parent.parent / "phase1" / "data" / "seed"


def _build_canonical_text(qa: dict) -> str:
    """Build the embeddable text for the canonical Q&A chunk."""
    qa_id = qa["id"]
    user_types = ", ".join(qa.get("user_types", []))
    tags = ", ".join(qa.get("tags", []))
    source_url = qa.get("source_url", "")
    expected_behavior = qa.get("expected_ai_behavior", "")
    rule_ids = ", ".join(qa.get("rule_ids", []))

    q_nl = qa.get("question_nl", "")
    q_en = qa.get("question_en", "")
    q_fa = qa.get("question_fa", "")

    answer = qa.get("answer", {})
    short_nl = answer.get("short_nl", "")
    short_en = answer.get("short_en", "")
    short_fa = answer.get("short_fa", "")
    detailed_nl = answer.get("detailed_nl", "")
    detailed_en = answer.get("detailed_en", "")
    detailed_fa = answer.get("detailed_fa", "")

    conditions = answer.get("conditions_that_change_answer", [])
    conditions_text = ""
    if conditions:
        conditions_text = "\n".join(f"  ({i+1}) {c}" for i, c in enumerate(conditions))

    lines = [
        f"[Q&A: {qa_id}] Users: {user_types} | Behavior: {expected_behavior}",
        f"Question (NL): {q_nl}",
        f"Question (EN): {q_en}",
        f"Question (FA): {q_fa}",
        f"Short answer (NL): {short_nl}",
        f"Short answer (EN): {short_en}",
        f"Short answer (FA): {short_fa}",
        f"Detailed (NL): {detailed_nl}",
        f"Detailed (EN): {detailed_en}",
        f"Detailed (FA): {detailed_fa}",
    ]
    if conditions_text:
        lines.append(f"Conditions that change answer:\n{conditions_text}")
    lines.append(f"Related rules: {rule_ids}")
    lines.append(f"Tags: {tags}")
    lines.append(f"Source: {source_url}")

    return "\n".join(lines)


def _build_variant_text(qa_id: str, variant_question: str, variant_index: int) -> str:
    """Build the lightweight text for a variant chunk."""
    return (
        f"[Q&A VARIANT: {qa_id} | variant-{variant_index}]\n"
        f"Question variant: {variant_question}\n"
        f"(See canonical record {qa_id} for full answer)"
    )


def chunk_qa_pairs(path: Path | None = None) -> list[Chunk]:
    """
    Load qa_pairs_2026.json and return canonical + variant Chunks.

    Args:
        path: Override the default seed file path (useful for testing).
    """
    if path is None:
        path = PHASE1_SEED / "qa_pairs_2026.json"

    with open(path, encoding="utf-8") as f:
        qa_pairs: list[dict] = json.load(f)

    chunks: list[Chunk] = []

    for qa in qa_pairs:
        qa_id = qa["id"]
        year = qa["year"]
        user_types = qa.get("user_types", [])
        source_url = qa.get("source_url", "")
        verification_status = qa.get("verification_status", "draft")
        expected_behavior = qa.get("expected_ai_behavior")
        tags = qa.get("tags", [])
        topic = tags[0] if tags else ""

        # Canonical chunk
        chunks.append(Chunk(
            chunk_id=f"qa-{qa_id}",
            text=_build_canonical_text(qa),
            doc_type="qa",
            source_id=qa_id,
            year=year,
            topic=topic,
            user_types=user_types,
            verification_status=verification_status,
            effective_from=f"{year}-01-01",
            effective_until=None,
            source_url=source_url,
            ai_prompt_hint=None,
            expected_ai_behavior=expected_behavior,
            language="multilingual",
            qa_id=None,
            priority=1.0,
        ))

        # Variant chunks
        for i, variant in enumerate(qa.get("question_variants", []), start=1):
            chunks.append(Chunk(
                chunk_id=f"qa-{qa_id}-variant-{i}",
                text=_build_variant_text(qa_id, variant, i),
                doc_type="qa",
                source_id=qa_id,
                year=year,
                topic=topic,
                user_types=user_types,
                verification_status=verification_status,
                effective_from=f"{year}-01-01",
                effective_until=None,
                source_url=source_url,
                ai_prompt_hint=None,
                expected_ai_behavior=expected_behavior,
                language="nl",
                qa_id=qa_id,
                priority=1.0,
            ))

    return chunks


if __name__ == "__main__":
    chunks = chunk_qa_pairs()
    canonical = [c for c in chunks if c.qa_id is None]
    variants = [c for c in chunks if c.qa_id is not None]
    print(f"Produced {len(chunks)} Q&A chunks ({len(canonical)} canonical, {len(variants)} variants)")
    print("\n--- Sample canonical chunk (QA-2026-001) ---")
    for c in canonical:
        if c.source_id == "QA-2026-001":
            print(c.text[:500], "...")
            break
