"""
Entry point: load Phase 1 data → chunk → embed → store in ChromaDB.

Run from the project root:
  python phase2/build_index.py

Options:
  --provider openai   Use OpenAI text-embedding-3-small (default, requires OPENAI_API_KEY)
  --provider local    Use local sentence-transformers (no API key needed)
  --reset             Drop existing collection and rebuild from scratch
  --dry-run           Chunk but do not embed or store (shows chunk count)

Writes embedding_manifest.json on success so the retriever knows which
model to use when embedding queries.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# Ensure project root is on sys.path so imports work when run as a script
PROJECT_ROOT = Path(__file__).parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from phase2.chunkers.ib_field_chunker import chunk_ib_fields
from phase2.chunkers.qa_chunker import chunk_qa_pairs
from phase2.chunkers.raw_chunker import chunk_all_raw
from phase2.chunkers.rule_chunker import chunk_rules
from phase2.chunkers.scenario_chunker import chunk_scenarios
from phase2.store.chroma_store import ChromaStore
from phase2.store.schema import Chunk

MANIFEST_PATH = Path(__file__).parent / "embedding_manifest.json"

PROVIDERS = {
    "openai": {
        "module": "phase2.embeddings.embed_openai",
        "model": "text-embedding-3-small",
        "dimensions": 1536,
    },
    "local": {
        "module": "phase2.embeddings.embed_local",
        "model": "all-MiniLM-L6-v2",
        "dimensions": 384,
    },
}


def _load_embed_fn(provider: str):
    import importlib
    mod = importlib.import_module(PROVIDERS[provider]["module"])
    return mod.embed_chunks


def _collect_chunks() -> list[Chunk]:
    """Run all chunkers and return the combined list."""
    print("Chunking Phase 1 data...")
    rules = chunk_rules()
    print(f"  Rules:      {len(rules)} chunks")

    qa = chunk_qa_pairs()
    canonical_qa = [c for c in qa if c.qa_id is None]
    variant_qa = [c for c in qa if c.qa_id is not None]
    print(f"  Q&A pairs:  {len(canonical_qa)} canonical + {len(variant_qa)} variants = {len(qa)} total")

    scenarios = chunk_scenarios()
    print(f"  Scenarios:  {len(scenarios)} chunks")

    ib_fields = chunk_ib_fields()
    print(f"  IB fields:  {len(ib_fields)} chunks")

    raw = chunk_all_raw()
    print(f"  Raw scraped:{len(raw)} chunks")

    all_chunks = rules + qa + scenarios + ib_fields + raw
    print(f"  TOTAL:      {len(all_chunks)} chunks")
    return all_chunks


def _write_manifest(provider: str, chunk_count: int) -> None:
    manifest = {
        "provider": provider,
        "model": PROVIDERS[provider]["model"],
        "dimensions": PROVIDERS[provider]["dimensions"],
        "chunk_count": chunk_count,
        "built_at": datetime.now(timezone.utc).isoformat(),
    }
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"Manifest written to {MANIFEST_PATH}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the Phase 2 RAG index")
    parser.add_argument(
        "--provider",
        choices=["openai", "local"],
        default="openai",
        help="Embedding provider (default: openai)",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Drop existing ChromaDB collection before rebuilding",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Chunk but do not embed or store",
    )
    args = parser.parse_args()

    # Chunk
    chunks = _collect_chunks()

    if args.dry_run:
        print("\nDry run — stopping before embed/store step.")
        return

    # Optionally reset
    store = ChromaStore()
    if args.reset:
        existing_count = store.count()
        if existing_count > 0:
            print(f"\nResetting collection ({existing_count} existing chunks will be deleted)...")
            import chromadb
            from phase2.store.chroma_store import COLLECTION_NAME, DEFAULT_DB_PATH, _get_client
            client = _get_client(DEFAULT_DB_PATH)
            client.delete_collection(COLLECTION_NAME)
            store = ChromaStore()
            print("Collection reset.")

    # Embed
    print(f"\nEmbedding {len(chunks)} chunks with provider='{args.provider}'...")
    embed_chunks = _load_embed_fn(args.provider)
    embedded = embed_chunks(chunks)
    print("Embedding complete.")

    # Store
    print(f"Upserting into ChromaDB...")
    store.upsert_chunks(embedded)
    final_count = store.count()
    print(f"ChromaDB now contains {final_count} chunks.")

    # Write manifest
    _write_manifest(args.provider, final_count)

    print("\nIndex build complete. Run test_retrieval.py to validate.")


if __name__ == "__main__":
    main()
