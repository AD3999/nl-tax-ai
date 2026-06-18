"""
Main retrieval interface for the RAG pipeline.

retrieve(question, user_type, year) → list[RetrievedContext]

Four-step algorithm:
  1. Embed the query using the model recorded in embedding_manifest.json
  2. Filtered vector search (hard filters: year, verification_status, effective_until)
  3. Cascade retrieval: if a Q&A matched, also pull its rule_ids via direct lookup
  4. Deduplication: if same source_id appears twice, keep higher-scored one
"""

from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path
from typing import Optional

from phase2.store.chroma_store import ChromaStore
from phase2.store.schema import Chunk, RetrievedContext

MANIFEST_PATH = Path(__file__).parent / "embedding_manifest.json"
PHASE1_SEED = Path(__file__).parent.parent / "phase1" / "data" / "seed"

TOP_K = 5


def _load_manifest() -> dict:
    if not MANIFEST_PATH.exists():
        raise FileNotFoundError(
            f"embedding_manifest.json not found at {MANIFEST_PATH}. "
            "Run build_index.py first."
        )
    with open(MANIFEST_PATH, encoding="utf-8") as f:
        return json.load(f)


def _get_embed_fn(manifest: dict):
    """Return the embed_query function matching what was used to build the index."""
    provider = manifest.get("provider", "openai")
    if provider == "openai":
        from phase2.embeddings.embed_openai import embed_query
        return embed_query
    elif provider == "local":
        try:
            import sentence_transformers  # noqa: F401
        except ImportError:
            raise RuntimeError(
                "embedding_manifest.json says provider='local' but sentence-transformers is not installed. "
                "Rebuild the index with OpenAI: python phase2/build_index.py --provider openai --reset"
            )
        from phase2.embeddings.embed_local import embed_query
        return embed_query
    else:
        raise ValueError(f"Unknown embedding provider '{provider}' in manifest.")


def _extract_qa_rule_ids(text: str) -> list[str]:
    """
    Extract rule IDs from a Q&A canonical chunk text.
    Looks for lines like: "Related rules: ZA-2026-001, MKB-2026-001"
    """
    match = re.search(r"Related rules:\s*(.+)", text)
    if not match:
        return []
    return [rid.strip() for rid in match.group(1).split(",") if rid.strip()]


def retrieve(
    question: str,
    user_type: Optional[str] = None,
    year: int = 2026,
    as_of_date: Optional[date] = None,
    store: Optional[ChromaStore] = None,
    top_k: int = TOP_K,
) -> list[RetrievedContext]:
    """
    Retrieve the most relevant tax knowledge for a user's question.

    Args:
        question: The user's question in any supported language (NL/EN/FA).
        user_type: Optional profile type — "zzp", "employee", "expat", "dga".
                   When provided, rules for other user types are excluded.
        year: Tax year to retrieve for. Default 2026.
        as_of_date: Used for effective_until filtering. Defaults to today.
        store: Optional pre-constructed ChromaStore (useful for testing).
        top_k: Number of semantic results before cascade expansion. Default 5.

    Returns:
        Deduplicated list of RetrievedContext, sorted by score descending.
        May include cascade-pulled rule chunks (marked with is_cascade=True).
    """
    manifest = _load_manifest()
    embed_query = _get_embed_fn(manifest)

    if store is None:
        store = ChromaStore()

    # Step 1: Embed the query
    query_vector = embed_query(question)

    # Step 2: Filtered vector search — fetch a wider candidate pool before cascade
    # so canonical Q&A chunks (which are long, multi-language) still get a chance
    # to appear even if focused rule chunks outscore them at positions 1-5.
    candidate_k = max(top_k * 4, 20)
    results = store.query(
        query_embedding=query_vector,
        top_k=candidate_k,
        user_type=user_type,
        as_of_date=as_of_date,
    )

    # Step 3: Cascade retrieval — for any matched Q&A (canonical or variant),
    # also fetch its linked rules via direct lookup.
    cascade_chunks: list[RetrievedContext] = []
    seen_rule_ids: set[str] = set()

    for ctx in results:
        if ctx.doc_type != "qa":
            continue

        # Canonical chunk_id is always "qa-{source_id}"; variants have a suffix.
        canonical_id = f"qa-{ctx.source_id}"
        is_variant = (ctx.chunk_id != canonical_id)

        if is_variant:
            # Variant chunk: resolve the canonical chunk to get its rule IDs
            canonical_list = store.get_by_ids([canonical_id])
            rule_ids = _extract_qa_rule_ids(canonical_list[0].text) if canonical_list else []
        else:
            # Canonical chunk — extract related rule IDs directly from its text
            rule_ids = _extract_qa_rule_ids(ctx.text)

        new_rule_ids = [rid for rid in rule_ids if rid not in seen_rule_ids]
        seen_rule_ids.update(new_rule_ids)

        if new_rule_ids:
            rule_chunk_ids = store.get_rule_chunk_ids(new_rule_ids)
            rule_chunks = store.get_by_ids(rule_chunk_ids)

            # Filter out expired chunks — direct lookup bypasses DB date filter
            effective_as_of = as_of_date or date.today()
            as_of_int = int(effective_as_of.strftime("%Y%m%d"))
            rule_chunks = [
                rc for rc in rule_chunks
                if Chunk._date_to_int(rc.effective_until) >= as_of_int
            ]

            for rc in rule_chunks:
                # Only add rules not already in semantic results
                already_retrieved = any(
                    existing.source_id == rc.source_id for existing in results
                )
                if not already_retrieved:
                    cascade_ctx = RetrievedContext(
                        chunk_id=rc.chunk_id,
                        text=rc.text,
                        source_url=rc.source_url,
                        source_id=rc.source_id,
                        doc_type=rc.doc_type,
                        score=0.0,  # cascade items have no similarity score
                        ai_prompt_hint=rc.ai_prompt_hint,
                        expected_ai_behavior=rc.expected_ai_behavior,
                        year=rc.year,
                        topic=rc.topic,
                        user_types=rc.user_types,
                        is_cascade=True,
                    )
                    cascade_chunks.append(cascade_ctx)

    # Step 4: Deduplicate — if same source_id appears in both semantic and cascade, keep semantic
    combined = results + cascade_chunks
    seen_source_ids: dict[str, RetrievedContext] = {}
    for ctx in combined:
        existing = seen_source_ids.get(ctx.source_id)
        if existing is None or ctx.score > existing.score:
            seen_source_ids[ctx.source_id] = ctx

    deduplicated = sorted(seen_source_ids.values(), key=lambda c: c.score, reverse=True)

    return deduplicated


if __name__ == "__main__":
    results = retrieve(
        question="Hoeveel belasting betaal ik als ZZP'er met €50.000 winst?",
        user_type="zzp",
    )
    print(f"Retrieved {len(results)} contexts")
    for i, ctx in enumerate(results, 1):
        cascade_flag = " [cascade]" if ctx.is_cascade else ""
        print(f"  {i}. [{ctx.doc_type}] {ctx.source_id} — score={ctx.score:.3f}{cascade_flag}")
