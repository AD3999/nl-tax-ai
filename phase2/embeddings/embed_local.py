"""
Local fallback embedding using sentence-transformers.

Model: all-MiniLM-L6-v2
  - Only ~45MB download — fast on any connection
  - Runs fully offline, no API key needed
  - English-optimised but handles Dutch well (good enough for dev/testing)
  - Produces 384-dimensional vectors

Swap MODEL_NAME to "paraphrase-multilingual-mpnet-base-v2" (768-dim, ~420MB)
for full NL/EN/FA multilingual support in production, but rebuild the index
from scratch (do NOT mix dimensions in the same ChromaDB collection).

The embedding_manifest.json records which model was used so the retriever
always embeds queries with the same model that built the index.
"""

from __future__ import annotations

from phase2.store.schema import Chunk

MODEL_NAME = "all-MiniLM-L6-v2"
DIMENSIONS = 384

# Lazy-load to avoid paying import cost when this module is not used
_model = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer  # type: ignore
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Embed a list of strings using the local multilingual model.

    Args:
        texts: Strings to embed.

    Returns:
        List of 768-dimensional embedding vectors.
    """
    if not texts:
        return []

    model = _get_model()
    # encode() returns a numpy array; convert to plain Python lists
    vectors = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    return [v.tolist() for v in vectors]


def embed_chunks(chunks: list[Chunk]) -> list[Chunk]:
    """
    Embed a list of Chunks in-place and return them.

    Args:
        chunks: Chunks whose .embedding field is to be populated.

    Returns:
        The same list with .embedding filled on each Chunk.
    """
    texts = [c.text for c in chunks]
    embeddings = embed_texts(texts)

    for chunk, embedding in zip(chunks, embeddings):
        chunk.embedding = embedding

    return chunks


def embed_query(query: str) -> list[float]:
    """
    Embed a single query string for retrieval.

    Args:
        query: The user's question text (any language).

    Returns:
        A 768-dimensional embedding vector.
    """
    vectors = embed_texts([query])
    return vectors[0]


if __name__ == "__main__":
    sample = "Hoeveel belasting betaal ik als ZZP'er met €50.000 winst?"
    vec = embed_query(sample)
    print(f"Local embed → {len(vec)}-dimensional vector (model: {MODEL_NAME})")
    print(f"First 5 values: {vec[:5]}")
