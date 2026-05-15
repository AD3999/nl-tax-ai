"""
ChromaDB vector store implementation.

Uses a single persistent collection with doc_type metadata filter.
Hard filters on every query: year=2026, verification_status=verified, effective date.

Collection name: nl_tax_2026
Storage path: phase2/.chromadb/  (gitignored — rebuild via build_index.py)
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Optional

import chromadb
from chromadb.config import Settings

from phase2.store.schema import Chunk, RetrievedContext

COLLECTION_NAME = "nl_tax_2026"
DEFAULT_DB_PATH = Path(__file__).parent.parent / ".chromadb"


def _get_client(db_path: Path | None = None) -> chromadb.ClientAPI:
    path = db_path or DEFAULT_DB_PATH
    path.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(
        path=str(path),
        settings=Settings(anonymized_telemetry=False),
    )


def _get_collection(client: chromadb.ClientAPI) -> chromadb.Collection:
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )


class ChromaStore:
    """Wraps a ChromaDB collection with tax-domain-specific query helpers."""

    def __init__(self, db_path: Path | None = None):
        self._client = _get_client(db_path)
        self._collection = _get_collection(self._client)

    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------

    def upsert_chunks(self, chunks: list[Chunk]) -> None:
        """
        Insert or update Chunks. Chunks without embeddings are skipped with a warning.

        Args:
            chunks: Chunks to upsert. Must have .embedding populated.
        """
        to_upsert = [c for c in chunks if c.embedding]
        skipped = len(chunks) - len(to_upsert)
        if skipped:
            print(f"Warning: skipping {skipped} chunk(s) with no embedding")

        if not to_upsert:
            return

        self._collection.upsert(
            ids=[c.chunk_id for c in to_upsert],
            embeddings=[c.embedding for c in to_upsert],
            documents=[c.text for c in to_upsert],
            metadatas=[c.to_chroma_metadata() for c in to_upsert],
        )

    def delete_chunks(self, chunk_ids: list[str]) -> None:
        self._collection.delete(ids=chunk_ids)

    def count(self) -> int:
        return self._collection.count()

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    def query(
        self,
        query_embedding: list[float],
        top_k: int = 5,
        user_type: Optional[str] = None,
        doc_types: Optional[list[str]] = None,
        as_of_date: Optional[date] = None,
    ) -> list[RetrievedContext]:
        """
        Semantic search with hard metadata filters applied on every call.

        Hard filters (always applied):
          - year = 2026
          - verification_status = "verified"
          - effective_until IS NULL or effective_until > as_of_date

        Soft filters (applied when provided):
          - user_type: matched against comma-joined user_types string
          - doc_types: restrict to specific document types

        Args:
            query_embedding: The embedded query vector.
            top_k: Number of results to return.
            user_type: Optional user profile type ("zzp", "employee", "expat", "dga").
            doc_types: Optional list of doc_type values to restrict results.
            as_of_date: Date for effective_until filtering. Defaults to today.

        Returns:
            List of RetrievedContext sorted by descending cosine similarity.
        """
        if as_of_date is None:
            as_of_date = date.today()

        # Convert date to YYYYMMDD integer — matches how schema stores effective_until_int
        as_of_int = int(as_of_date.strftime("%Y%m%d"))

        # Build filter: ChromaDB uses $and / $or operators.
        # effective_until_int: 99991231 = never expires; otherwise YYYYMMDD of expiry.
        # $gte as_of_int catches both never-expiring (99991231) and future expiry dates.
        # NOTE: user_type filtering is NOT done here because ChromaDB does not support
        # substring/contains matching on metadata strings. It is applied in Python
        # post-retrieval (see _filter_by_user_type). We fetch top_k * 4 to ensure
        # enough candidates survive the post-filter.
        filter_conditions: list[dict] = [
            {"year": {"$eq": 2026}},
            {"verification_status": {"$eq": "verified"}},
            {"effective_until_int": {"$gte": as_of_int}},
        ]

        if doc_types:
            if len(doc_types) == 1:
                filter_conditions.append({"doc_type": {"$eq": doc_types[0]}})
            else:
                filter_conditions.append({
                    "$or": [{"doc_type": {"$eq": dt}} for dt in doc_types]
                })

        where = {"$and": filter_conditions}

        # Fetch a wider pool so post-filter by user_type still leaves top_k results
        fetch_k = min(top_k * 4, self._collection.count() or 1)

        results = self._collection.query(
            query_embeddings=[query_embedding],
            n_results=fetch_k,
            where=where,
            include=["documents", "metadatas", "distances"],
        )

        parsed = self._parse_results(results)
        filtered = self._filter_by_user_type(parsed, user_type)
        return filtered[:top_k]

    def get_by_ids(self, chunk_ids: list[str]) -> list[Chunk]:
        """
        Direct lookup by chunk_id. Used for cascade retrieval.

        Args:
            chunk_ids: List of chunk_ids to retrieve.

        Returns:
            Chunks found (may be fewer than requested if some IDs don't exist).
        """
        if not chunk_ids:
            return []

        result = self._collection.get(
            ids=chunk_ids,
            include=["documents", "metadatas"],
        )

        chunks: list[Chunk] = []
        for chunk_id, doc, meta in zip(
            result["ids"], result["documents"], result["metadatas"]
        ):
            try:
                # Reconstruct effective_until string from the stored YYYYMMDD integer
                # (to_chroma_metadata stores only the int; from_chroma_metadata needs the string)
                eff_int = meta.get("effective_until_int", 99991231)
                if eff_int and eff_int != 99991231:
                    s = str(int(eff_int))
                    meta = {**meta, "effective_until": f"{s[:4]}-{s[4:6]}-{s[6:8]}"}
                chunks.append(Chunk.from_chroma_metadata(chunk_id, doc, meta))
            except (KeyError, ValueError) as exc:
                print(f"Warning: could not reconstruct chunk {chunk_id}: {exc}")

        return chunks

    def get_rule_chunk_ids(self, rule_ids: list[str]) -> list[str]:
        """
        Map Phase 1 rule IDs to their chunk IDs (e.g. "ZA-2026-001" → "rule-ZA-2026-001").

        Args:
            rule_ids: Phase 1 source IDs.

        Returns:
            The corresponding chunk_ids that exist in the store.
        """
        return [f"rule-{rid}" for rid in rule_ids]

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _filter_by_user_type(
        contexts: list[RetrievedContext], user_type: Optional[str]
    ) -> list[RetrievedContext]:
        """Keep chunks relevant to user_type. Chunks tagged 'all' always pass."""
        if not user_type:
            return contexts
        return [
            ctx for ctx in contexts
            if "all" in ctx.user_types or user_type in ctx.user_types
        ]

    def _parse_results(self, results: dict) -> list[RetrievedContext]:
        """Convert raw ChromaDB query results to RetrievedContext objects."""
        contexts: list[RetrievedContext] = []

        ids = results.get("ids", [[]])[0]
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        for chunk_id, doc, meta, distance in zip(ids, docs, metas, distances):
            # ChromaDB cosine distance: 0 = identical, 2 = opposite.
            # Convert to similarity score in [0, 1].
            score = max(0.0, 1.0 - distance / 2.0)

            user_types_str = meta.get("user_types", "")
            user_types = [u for u in user_types_str.split(",") if u]

            ctx = RetrievedContext(
                chunk_id=chunk_id,
                text=doc,
                source_url=meta.get("source_url", ""),
                source_id=meta.get("source_id", ""),
                doc_type=meta.get("doc_type", ""),
                score=score,
                ai_prompt_hint=meta.get("ai_prompt_hint") or None,
                expected_ai_behavior=meta.get("expected_ai_behavior") or None,
                year=int(meta.get("year", 2026)),
                topic=meta.get("topic", ""),
                user_types=user_types,
                is_cascade=False,
            )
            contexts.append(ctx)

        return contexts
