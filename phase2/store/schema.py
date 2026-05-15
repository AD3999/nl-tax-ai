"""
Core data structures for the Phase 2 RAG pipeline.

Chunk: the unit stored in the vector database.
RetrievedContext: what the retriever returns to the assembler.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

# Valid values for doc_type
DOC_TYPES = frozenset({"rule", "qa", "scenario", "ib_field", "raw"})

# Valid values for verification_status
VERIFICATION_STATUSES = frozenset({"verified", "pending_review", "draft"})

# Valid values for expected_ai_behavior
AI_BEHAVIORS = frozenset({
    "answer_directly",
    "answer_with_caveat",
    "ask_clarifying_question",
    "refer_to_advisor",
})


@dataclass
class Chunk:
    """
    A single embeddable document unit stored in the vector database.

    chunk_id naming conventions:
      rules     → "rule-{rule_id}"               e.g. "rule-ZA-2026-001"
      qa canon  → "qa-{qa_id}"                   e.g. "qa-QA-2026-002"
      qa variant→ "qa-{qa_id}-variant-{n}"       e.g. "qa-QA-2026-002-variant-1"
      scenario  → "scenario-{scenario_id}"        e.g. "scenario-SCN-ZZP-001"
      ib_field  → "ib-{field_code}"              e.g. "ib-1a"
      raw       → "raw-{source_id}-chunk-{n}"    e.g. "raw-bld-scraped-001-chunk-3"
    """

    chunk_id: str
    text: str
    doc_type: str

    # Phase 1 record identifier (ZA-2026-001, QA-2026-002, etc.)
    source_id: str

    year: int
    topic: str
    user_types: list[str]
    verification_status: str

    # ISO date strings
    effective_from: str
    effective_until: Optional[str]

    source_url: str

    # Survives to assembled context verbatim
    ai_prompt_hint: Optional[str]
    expected_ai_behavior: Optional[str]

    # "multilingual" for rule/qa/scenario chunks; "nl"/"en"/"fa" for variant-only chunks
    language: str = "multilingual"

    # Set on qa-variant chunks to link back to the canonical qa chunk
    qa_id: Optional[str] = None

    # 1.0 = seed data (phase1/), 0.8 = scraped raw
    priority: float = 1.0

    # Populated after embedding; empty list means not yet embedded
    embedding: list[float] = field(default_factory=list)

    def __post_init__(self) -> None:
        if self.doc_type not in DOC_TYPES:
            raise ValueError(f"Invalid doc_type '{self.doc_type}'. Must be one of {DOC_TYPES}")
        if self.verification_status not in VERIFICATION_STATUSES:
            raise ValueError(
                f"Invalid verification_status '{self.verification_status}'. "
                f"Must be one of {VERIFICATION_STATUSES}"
            )
        if self.expected_ai_behavior is not None and self.expected_ai_behavior not in AI_BEHAVIORS:
            raise ValueError(
                f"Invalid expected_ai_behavior '{self.expected_ai_behavior}'. "
                f"Must be one of {AI_BEHAVIORS}"
            )

    @staticmethod
    def _date_to_int(date_str: Optional[str]) -> int:
        """Convert ISO date string to YYYYMMDD integer for ChromaDB range filters.
        Returns 99991231 when date_str is None (meaning: never expires)."""
        if not date_str:
            return 99991231
        return int(date_str.replace("-", ""))

    def to_chroma_metadata(self) -> dict:
        """Return a flat dict suitable for ChromaDB metadata (no None values, no lists as values).

        effective_until is stored as YYYYMMDD integer so ChromaDB $gt/$lt range
        filters work correctly (ChromaDB only supports numeric range operators).
        99991231 means no expiry.
        """
        return {
            "doc_type": self.doc_type,
            "source_id": self.source_id,
            "year": self.year,
            "topic": self.topic,
            # ChromaDB does not support list metadata values; store as comma-joined string
            "user_types": ",".join(self.user_types),
            "verification_status": self.verification_status,
            "effective_from": self.effective_from,
            "effective_until_int": self._date_to_int(self.effective_until),
            "source_url": self.source_url,
            "ai_prompt_hint": self.ai_prompt_hint or "",
            "expected_ai_behavior": self.expected_ai_behavior or "",
            "language": self.language,
            "qa_id": self.qa_id or "",
            "priority": self.priority,
        }

    @classmethod
    def from_chroma_metadata(
        cls,
        chunk_id: str,
        text: str,
        metadata: dict,
        embedding: Optional[list[float]] = None,
    ) -> "Chunk":
        """Reconstruct a Chunk from ChromaDB metadata (inverse of to_chroma_metadata)."""
        return cls(
            chunk_id=chunk_id,
            text=text,
            doc_type=metadata["doc_type"],
            source_id=metadata["source_id"],
            year=int(metadata["year"]),
            topic=metadata["topic"],
            user_types=[u for u in metadata["user_types"].split(",") if u],
            verification_status=metadata["verification_status"],
            effective_from=metadata["effective_from"],
            effective_until=metadata.get("effective_until") or None,
            source_url=metadata["source_url"],
            ai_prompt_hint=metadata.get("ai_prompt_hint") or None,
            expected_ai_behavior=metadata.get("expected_ai_behavior") or None,
            language=metadata.get("language", "multilingual"),
            qa_id=metadata.get("qa_id") or None,
            priority=float(metadata.get("priority", 1.0)),
            embedding=embedding or [],
        )


@dataclass
class RetrievedContext:
    """
    What the retriever returns for each matched chunk.
    Passed to the assembler which formats them into the AI system prompt.
    """

    chunk_id: str
    text: str
    source_url: str
    source_id: str
    doc_type: str

    # Cosine similarity score from the vector store (0.0–1.0, higher = more relevant)
    score: float

    ai_prompt_hint: Optional[str]
    expected_ai_behavior: Optional[str]

    year: int
    topic: str
    user_types: list[str]

    # True when this chunk was pulled via cascade (rule_ids from a matched Q&A), not pure semantic
    is_cascade: bool = False
