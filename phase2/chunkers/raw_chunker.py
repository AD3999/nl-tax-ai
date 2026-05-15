"""
Converts scraped raw JSON files from phase1/data/raw/ into Chunk objects.

Strategy: sliding window — 512 tokens, 64 token overlap.
Priority is 0.8 (lower than seed data at 1.0) so structured seed chunks
take precedence when both cover the same topic.

Raw JSON files are expected to have this shape (from scrape_belastingdienst.py):
  { "url": "...", "title": "...", "body_text": "...", "scraped_at": "..." }
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from phase2.store.schema import Chunk

PHASE1_RAW = Path(__file__).parent.parent.parent / "phase1" / "data" / "raw"

WINDOW_TOKENS = 512
OVERLAP_TOKENS = 64

# Rough approximation: 1 token ≈ 4 characters (English). Persian/Dutch are slightly denser.
# We use character-based splitting here because tiktoken is not always available at chunking time.
# The embed step will do the precise token count.
CHARS_PER_TOKEN = 4
WINDOW_CHARS = WINDOW_TOKENS * CHARS_PER_TOKEN   # 2048
OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN  # 256


def _clean_text(raw: str) -> str:
    """Remove excessive whitespace from scraped text."""
    # Collapse runs of whitespace to single spaces, normalize newlines
    text = re.sub(r"\r\n|\r", "\n", raw)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def _sliding_window(text: str) -> list[str]:
    """Split text into overlapping chunks using character-based window."""
    if not text:
        return []
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + WINDOW_CHARS
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break
        start = end - OVERLAP_CHARS
    return chunks


def _url_to_source_id(url: str, index: int) -> str:
    """Derive a stable source ID from a URL."""
    # Strip scheme and domain, take path, slugify
    path = re.sub(r"^https?://[^/]+", "", url)
    slug = re.sub(r"[^a-z0-9]+", "-", path.lower()).strip("-")
    slug = slug[:40] if slug else f"scraped-{index}"
    return f"raw-{slug}"


def chunk_raw_file(path: Path, file_index: int = 0) -> list[Chunk]:
    """
    Convert one scraped JSON file into sliding-window Chunk objects.

    Args:
        path: Path to a raw scraped JSON file.
        file_index: Used for stable source ID generation when URL is missing.
    """
    with open(path, encoding="utf-8") as f:
        data: dict = json.load(f)

    url = data.get("url", "")
    title = data.get("title", "")
    body = _clean_text(data.get("body_text", ""))
    source_id_base = _url_to_source_id(url, file_index)

    if not body:
        return []

    windows = _sliding_window(body)
    chunks: list[Chunk] = []

    for i, window_text in enumerate(windows, start=1):
        header = f"[SCRAPED: {title}]\nSource: {url}\n\n" if title else f"[SCRAPED]\nSource: {url}\n\n"
        text = header + window_text

        chunk = Chunk(
            chunk_id=f"{source_id_base}-chunk-{i}",
            text=text,
            doc_type="raw",
            source_id=f"{source_id_base}-chunk-{i}",
            year=2026,
            topic="scraped",
            user_types=["all"],
            verification_status="verified",
            effective_from="2026-01-01",
            effective_until=None,
            source_url=url,
            ai_prompt_hint=None,
            expected_ai_behavior=None,
            language="nl",
            priority=0.8,
        )
        chunks.append(chunk)

    return chunks


def chunk_all_raw(raw_dir: Path | None = None) -> list[Chunk]:
    """
    Scan the raw/ directory and chunk all JSON files found.

    Args:
        raw_dir: Override the default raw directory (useful for testing).
    """
    if raw_dir is None:
        raw_dir = PHASE1_RAW

    if not raw_dir.exists():
        return []

    json_files = sorted(raw_dir.glob("*.json"))
    all_chunks: list[Chunk] = []

    for i, json_file in enumerate(json_files):
        try:
            file_chunks = chunk_raw_file(json_file, file_index=i)
            all_chunks.extend(file_chunks)
        except (json.JSONDecodeError, KeyError) as exc:
            print(f"Warning: skipping {json_file.name} — {exc}")

    return all_chunks


if __name__ == "__main__":
    chunks = chunk_all_raw()
    print(f"Produced {len(chunks)} raw chunks from {PHASE1_RAW}")
