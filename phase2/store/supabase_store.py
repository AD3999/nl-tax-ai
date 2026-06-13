"""
Supabase pgvector vector store — production implementation.

Uses Supabase's built-in pgvector extension. All tax chunks are stored in the
`tax_chunks` table. Hard filters identical to ChromaStore are applied on every
query via SQL WHERE clauses, keeping the retrieval contract identical.

Setup (run once in Supabase SQL editor):
  CREATE EXTENSION IF NOT EXISTS vector;

  CREATE TABLE tax_chunks (
      chunk_id             TEXT PRIMARY KEY,
      text                 TEXT NOT NULL,
      embedding            vector(1536),          -- OpenAI 1536 or local 768 — must match manifest
      doc_type             TEXT NOT NULL,
      source_id            TEXT NOT NULL,
      year                 INTEGER NOT NULL,
      topic                TEXT NOT NULL DEFAULT '',
      user_types           TEXT NOT NULL DEFAULT '',   -- comma-joined: "zzp,employee"
      verification_status  TEXT NOT NULL DEFAULT 'draft',
      effective_from       TEXT NOT NULL DEFAULT '',
      effective_until_int  INTEGER NOT NULL DEFAULT 99991231,  -- YYYYMMDD, 99991231 = never expires
      source_url           TEXT NOT NULL DEFAULT '',
      ai_prompt_hint       TEXT NOT NULL DEFAULT '',
      expected_ai_behavior TEXT NOT NULL DEFAULT '',
      language             TEXT NOT NULL DEFAULT 'multilingual',
      qa_id                TEXT NOT NULL DEFAULT '',
      priority             REAL NOT NULL DEFAULT 1.0,
      created_at           TIMESTAMPTZ DEFAULT NOW()
  );

  -- ANN index for cosine similarity (IVFFlat — tune lists for dataset size)
  CREATE INDEX tax_chunks_embedding_idx ON tax_chunks
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 10);   -- rule of thumb: sqrt(row_count); rebuild after major data changes

  -- RLS: only service role may read/write (API is behind Django — no direct client access)
  ALTER TABLE tax_chunks ENABLE ROW LEVEL SECURITY;

Environment variables needed:
  SUPABASE_URL   — e.g. https://xxxx.supabase.co
  SUPABASE_KEY   — service_role key (NOT anon key; needed for INSERT)
"""

from __future__ import annotations

import os
from datetime import date
from typing import Optional

from phase2.store.schema import Chunk, RetrievedContext

_REQUIRED_ENV = ("SUPABASE_URL", "SUPABASE_KEY")


def _get_client():
    """Lazy-import supabase and return an authenticated client."""
    missing = [k for k in _REQUIRED_ENV if not os.environ.get(k)]
    if missing:
        raise EnvironmentError(
            f"Supabase store requires environment variables: {missing}. "
            "Set them in .env or Railway secrets."
        )
    from supabase import create_client  # type: ignore
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])


TABLE = "tax_chunks"


class SupabaseStore:
    """
    Wraps the Supabase pgvector `tax_chunks` table.

    The query contract is identical to ChromaStore: same hard filters,
    same RetrievedContext output, same cascade-retrieval helpers.
    Swap ChromaStore → SupabaseStore in retriever.py for production.
    """

    def __init__(self):
        self._client = _get_client()

    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------

    def upsert_chunks(self, chunks: list[Chunk]) -> None:
        """
        Insert or update Chunks. Chunks without embeddings are skipped.

        Uses Supabase upsert with on_conflict=chunk_id (primary key).
        """
        to_upsert = [c for c in chunks if c.embedding]
        skipped = len(chunks) - len(to_upsert)
        if skipped:
            print(f"Warning: skipping {skipped} chunk(s) with no embedding")

        if not to_upsert:
            return

        rows = []
        for c in to_upsert:
            meta = c.to_chroma_metadata()  # reuse the same flat dict
            rows.append({
                "chunk_id": c.chunk_id,
                "text": c.text,
                "embedding": c.embedding,  # Supabase accepts list[float] for vector columns
                **meta,
            })

        # Supabase upsert in batches of 100 to stay within request size limits
        batch_size = 100
        for i in range(0, len(rows), batch_size):
            batch = rows[i : i + batch_size]
            self._client.table(TABLE).upsert(batch, on_conflict="chunk_id").execute()

    def delete_chunks(self, chunk_ids: list[str]) -> None:
        if not chunk_ids:
            return
        self._client.table(TABLE).delete().in_("chunk_id", chunk_ids).execute()

    def count(self) -> int:
        response = self._client.table(TABLE).select("chunk_id", count="exact").execute()
        return response.count or 0

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
        Semantic search via pgvector cosine similarity with hard SQL filters.

        Hard filters (always applied):
          - year = 2026
          - verification_status = 'verified'
          - effective_until_int >= as_of_date (YYYYMMDD)

        Soft filters (applied post-retrieval in Python, same as ChromaStore):
          - user_type: matched against comma-joined user_types string
        """
        if as_of_date is None:
            as_of_date = date.today()
        as_of_int = int(as_of_date.strftime("%Y%m%d"))

        # Fetch a wider pool so post-filter by user_type still leaves top_k results
        fetch_k = top_k * 4

        # Call Supabase RPC function for vector search with hard filters.
        # The SQL function `match_tax_chunks` must be defined in Supabase (see below).
        response = self._client.rpc(
            "match_tax_chunks",
            {
                "query_embedding": query_embedding,
                "match_count": fetch_k,
                "filter_year": 2026,
                "filter_verification": "verified",
                "filter_as_of_int": as_of_int,
            },
        ).execute()

        rows = response.data or []
        contexts = [self._row_to_context(row) for row in rows]

        # Post-filter by user_type (same logic as ChromaStore)
        filtered = self._filter_by_user_type(contexts, user_type)
        return filtered[:top_k]

    def get_by_ids(self, chunk_ids: list[str]) -> list[Chunk]:
        """Direct lookup by chunk_id. Used for cascade retrieval."""
        if not chunk_ids:
            return []

        response = (
            self._client.table(TABLE)
            .select("*")
            .in_("chunk_id", chunk_ids)
            .execute()
        )

        chunks = []
        for row in response.data or []:
            try:
                eff_int = row.get("effective_until_int", 99991231)
                if eff_int and eff_int != 99991231:
                    s = str(int(eff_int))
                    row["effective_until"] = f"{s[:4]}-{s[4:6]}-{s[6:8]}"
                else:
                    row["effective_until"] = None
                chunks.append(Chunk.from_chroma_metadata(
                    chunk_id=row["chunk_id"],
                    text=row["text"],
                    metadata=row,
                ))
            except (KeyError, ValueError) as exc:
                print(f"Warning: could not reconstruct chunk {row.get('chunk_id')}: {exc}")

        return chunks

    def get_rule_chunk_ids(self, rule_ids: list[str]) -> list[str]:
        """Map Phase 1 rule IDs to chunk IDs — same convention as ChromaStore."""
        return [f"rule-{rid}" for rid in rule_ids]

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _filter_by_user_type(
        contexts: list[RetrievedContext], user_type: Optional[str]
    ) -> list[RetrievedContext]:
        if not user_type:
            return contexts
        return [
            ctx for ctx in contexts
            if "all" in ctx.user_types or user_type in ctx.user_types
        ]

    @staticmethod
    def _row_to_context(row: dict) -> RetrievedContext:
        user_types_str = row.get("user_types", "")
        user_types = [u for u in user_types_str.split(",") if u]
        # pgvector returns cosine distance in [0, 1] (1 = most similar) via the RPC function
        score = float(row.get("similarity", 0.0))

        return RetrievedContext(
            chunk_id=row["chunk_id"],
            text=row["text"],
            source_url=row.get("source_url", ""),
            source_id=row.get("source_id", ""),
            doc_type=row.get("doc_type", ""),
            score=score,
            ai_prompt_hint=row.get("ai_prompt_hint") or None,
            expected_ai_behavior=row.get("expected_ai_behavior") or None,
            year=int(row.get("year", 2026)),
            topic=row.get("topic", ""),
            user_types=user_types,
            is_cascade=False,
        )


# ------------------------------------------------------------------
# Supabase SQL: match_tax_chunks RPC function
# Run this once in the Supabase SQL editor to enable the query() method above.
# ------------------------------------------------------------------
#
# CREATE OR REPLACE FUNCTION match_tax_chunks(
#   query_embedding    vector,
#   match_count        int     DEFAULT 20,
#   filter_year        int     DEFAULT 2026,
#   filter_verification text   DEFAULT 'verified',
#   filter_as_of_int   int     DEFAULT 99991231
# )
# RETURNS TABLE (
#   chunk_id             text,
#   text                 text,
#   doc_type             text,
#   source_id            text,
#   year                 int,
#   topic                text,
#   user_types           text,
#   verification_status  text,
#   effective_from       text,
#   effective_until_int  int,
#   source_url           text,
#   ai_prompt_hint       text,
#   expected_ai_behavior text,
#   language             text,
#   qa_id                text,
#   priority             real,
#   similarity           float
# )
# LANGUAGE sql STABLE
# AS $$
#   SELECT
#     chunk_id, text, doc_type, source_id, year, topic, user_types,
#     verification_status, effective_from, effective_until_int,
#     source_url, ai_prompt_hint, expected_ai_behavior,
#     language, qa_id, priority,
#     1 - (embedding <=> query_embedding) AS similarity
#   FROM tax_chunks
#   WHERE
#     year = filter_year
#     AND verification_status = filter_verification
#     AND effective_until_int >= filter_as_of_int
#   ORDER BY embedding <=> query_embedding
#   LIMIT match_count;
# $$;
