"""
Formats retrieved chunks into a context string ready for injection into the AI system prompt.

Token budget: ~1,500 tokens. Uses tiktoken to count precisely.
Format documented in CLAUDE.md "Context assembler output format".
"""

from __future__ import annotations

from typing import Optional

import tiktoken

from phase2.store.schema import RetrievedContext

TOKEN_BUDGET = 1500
ENCODING_NAME = "cl100k_base"  # Used by GPT-4 / text-embedding-3-small families

_HEADER = "=== RETRIEVED TAX KNOWLEDGE (verified, 2026) ==="
_FOOTER = (
    "=== END RETRIEVED KNOWLEDGE ===\n"
    "IMPORTANT: Cite source_url for every factual claim. "
    "Use the language the user wrote in."
)


def _count_tokens(text: str) -> int:
    enc = tiktoken.get_encoding(ENCODING_NAME)
    return len(enc.encode(text))


def _render_rule(ctx: RetrievedContext) -> str:
    lines = [f"[RULE: {ctx.source_id} | Topic: {ctx.topic} | Source: {ctx.source_url}]"]
    if ctx.ai_prompt_hint:
        lines.append(f"AI INSTRUCTION: {ctx.ai_prompt_hint}")
    lines.append(ctx.text)
    return "\n".join(lines)


def _render_qa(ctx: RetrievedContext) -> str:
    behavior = f" | AI BEHAVIOR: {ctx.expected_ai_behavior}" if ctx.expected_ai_behavior else ""
    lines = [f"[Q&A: {ctx.source_id}{behavior} | Source: {ctx.source_url}]"]
    # The chunk text already contains the full Q&A — just include it
    lines.append(ctx.text)
    return "\n".join(lines)


def _render_scenario(ctx: RetrievedContext) -> str:
    lines = [f"[SCENARIO: {ctx.source_id} | Source: {ctx.source_url}]"]
    lines.append(ctx.text)
    return "\n".join(lines)


def _render_ib_field(ctx: RetrievedContext) -> str:
    lines = [f"[IB FIELD: {ctx.source_id} | Source: {ctx.source_url}]"]
    lines.append(ctx.text)
    return "\n".join(lines)


def _render_raw(ctx: RetrievedContext) -> str:
    lines = [f"[BACKGROUND: Source: {ctx.source_url}]"]
    # Raw chunks already embed the source URL in the text, so just include text
    lines.append(ctx.text)
    return "\n".join(lines)


_RENDERERS = {
    "rule": _render_rule,
    "qa": _render_qa,
    "scenario": _render_scenario,
    "ib_field": _render_ib_field,
    "raw": _render_raw,
}


def assemble(
    contexts: list[RetrievedContext],
    token_budget: int = TOKEN_BUDGET,
) -> str:
    """
    Format retrieved contexts into a string for the AI system prompt.

    Ordering:
      1. Rules (highest specificity)
      2. Q&A pairs (pre-verified answers)
      3. Scenarios (worked examples)
      4. IB form fields (form guidance)
      5. Raw scraped background (lowest priority)

    Within each group, items are ordered by score descending.
    Items are added until the token budget is reached; the rest are dropped.

    Args:
        contexts: Retrieved contexts from retriever.retrieve().
        token_budget: Maximum tokens for the entire assembled block.

    Returns:
        A formatted string ready to inject into the AI system prompt.
    """
    # Sort by doc_type priority, then by score descending
    priority_order = {"rule": 0, "qa": 1, "scenario": 2, "ib_field": 3, "raw": 4}
    ordered = sorted(
        contexts,
        key=lambda c: (priority_order.get(c.doc_type, 9), -c.score),
    )

    overhead_tokens = _count_tokens(_HEADER + "\n\n" + "\n" + _FOOTER)
    tokens_used = overhead_tokens
    rendered_blocks: list[str] = []

    for ctx in ordered:
        renderer = _RENDERERS.get(ctx.doc_type)
        if renderer is None:
            continue

        block = renderer(ctx)
        block_tokens = _count_tokens(block)

        if tokens_used + block_tokens > token_budget:
            break

        rendered_blocks.append(block)
        tokens_used += block_tokens

    if not rendered_blocks:
        return (
            f"{_HEADER}\n\n"
            "(No verified knowledge retrieved for this query.)\n\n"
            f"{_FOOTER}"
        )

    body = "\n\n".join(rendered_blocks)
    return f"{_HEADER}\n\n{body}\n\n{_FOOTER}"


def assemble_with_stats(
    contexts: list[RetrievedContext],
    token_budget: int = TOKEN_BUDGET,
) -> tuple[str, dict]:
    """
    Same as assemble() but also returns statistics for debugging and tests.

    Returns:
        (assembled_text, stats_dict) where stats_dict contains:
          - total_tokens: int
          - included_count: int
          - dropped_count: int
          - included_ids: list[str]
    """
    priority_order = {"rule": 0, "qa": 1, "scenario": 2, "ib_field": 3, "raw": 4}
    ordered = sorted(
        contexts,
        key=lambda c: (priority_order.get(c.doc_type, 9), -c.score),
    )

    overhead_tokens = _count_tokens(_HEADER + "\n\n" + "\n" + _FOOTER)
    tokens_used = overhead_tokens
    rendered_blocks: list[str] = []
    included_ids: list[str] = []
    dropped_count = 0

    for ctx in ordered:
        renderer = _RENDERERS.get(ctx.doc_type)
        if renderer is None:
            dropped_count += 1
            continue

        block = renderer(ctx)
        block_tokens = _count_tokens(block)

        if tokens_used + block_tokens > token_budget:
            dropped_count += 1
            continue

        rendered_blocks.append(block)
        tokens_used += block_tokens
        included_ids.append(ctx.source_id)

    body = "\n\n".join(rendered_blocks) if rendered_blocks else "(No verified knowledge retrieved.)"
    text = f"{_HEADER}\n\n{body}\n\n{_FOOTER}"

    stats = {
        "total_tokens": _count_tokens(text),
        "included_count": len(rendered_blocks),
        "dropped_count": dropped_count,
        "included_ids": included_ids,
    }
    return text, stats


if __name__ == "__main__":
    # Quick smoke test: assemble a dummy context and check token count
    dummy = RetrievedContext(
        chunk_id="rule-ZA-2026-001",
        text="Dutch: De zelfstandigenaftrek is €1.200 in 2026...\nEnglish: €1,200 in 2026...",
        source_url="https://www.belastingdienst.nl/",
        source_id="ZA-2026-001",
        doc_type="rule",
        score=0.95,
        ai_prompt_hint="Always check urencriterium (1225 hrs)",
        expected_ai_behavior=None,
        year=2026,
        topic="zelfstandigenaftrek",
        user_types=["zzp"],
    )
    text, stats = assemble_with_stats([dummy])
    print(f"Assembled: {stats['total_tokens']} tokens, {stats['included_count']} blocks")
    print(text[:300])
