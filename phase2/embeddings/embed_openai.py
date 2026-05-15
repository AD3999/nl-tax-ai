"""
OpenAI text-embedding-3-small embedding provider.

Primary embedding model for the pipeline. Sends chunks in batches to avoid
rate limits and keep cost minimal (~$0.01 for the full ~113-chunk dataset).

Reads OPENAI_API_KEY from environment (via python-dotenv or system env).
"""

from __future__ import annotations

import os
import time
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

from phase2.store.schema import Chunk

load_dotenv(Path(__file__).parent.parent.parent / ".env")

MODEL = "text-embedding-3-small"
DIMENSIONS = 1536

# How many texts to send per API call. OpenAI allows up to 2048 inputs per call,
# but small batches keep memory footprint low and errors easy to retry.
BATCH_SIZE = 50

# Seconds to wait between batches to stay within rate limits
BATCH_DELAY = 0.5


def embed_texts(texts: list[str], client: OpenAI | None = None) -> list[list[float]]:
    """
    Embed a list of strings using text-embedding-3-small.

    Args:
        texts: Strings to embed. Must be non-empty.
        client: Optional pre-constructed OpenAI client (useful for testing with mocks).

    Returns:
        List of embedding vectors, same order as input.
    """
    if not texts:
        return []

    if client is None:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise EnvironmentError(
                "OPENAI_API_KEY not set. Add it to your .env file or environment."
            )
        client = OpenAI(api_key=api_key)

    all_embeddings: list[list[float]] = []

    for batch_start in range(0, len(texts), BATCH_SIZE):
        batch = texts[batch_start : batch_start + BATCH_SIZE]
        response = client.embeddings.create(model=MODEL, input=batch)
        # Response items are returned in the same order as input
        batch_embeddings = [item.embedding for item in response.data]
        all_embeddings.extend(batch_embeddings)

        if batch_start + BATCH_SIZE < len(texts):
            time.sleep(BATCH_DELAY)

    return all_embeddings


def embed_chunks(chunks: list[Chunk], client: OpenAI | None = None) -> list[Chunk]:
    """
    Embed a list of Chunks in-place (fills the .embedding field) and return them.

    Args:
        chunks: Chunks whose .embedding field is to be populated.
        client: Optional pre-constructed OpenAI client.

    Returns:
        The same list with .embedding filled on each Chunk.
    """
    texts = [c.text for c in chunks]
    embeddings = embed_texts(texts, client=client)

    for chunk, embedding in zip(chunks, embeddings):
        chunk.embedding = embedding

    return chunks


def embed_query(query: str, client: OpenAI | None = None) -> list[float]:
    """
    Embed a single query string for retrieval.

    Args:
        query: The user's question text.
        client: Optional pre-constructed OpenAI client.

    Returns:
        A 1536-dimensional embedding vector.
    """
    vectors = embed_texts([query], client=client)
    return vectors[0]


if __name__ == "__main__":
    sample = "Hoeveel belasting betaal ik als ZZP'er met €50.000 winst?"
    vec = embed_query(sample)
    print(f"Embedded query → {len(vec)}-dimensional vector")
    print(f"First 5 values: {vec[:5]}")
