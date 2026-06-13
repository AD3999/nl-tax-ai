"""
Local fallback embedding using sentence-transformers.

Model: paraphrase-multilingual-mpnet-base-v2
  - ~420MB download, runs fully offline, no API key needed
  - Multilingual: maps NL, EN, and FA queries to the same vector space
  - Produces 768-dimensional vectors
  - Required by CLAUDE.md spec for full three-language parity (NL/EN/FA)

Do NOT mix this with the OpenAI 1536-dim index in the same ChromaDB collection.
embedding_manifest.json records which model was used so the retriever always
embeds queries with the same model that built the index.
"""

from __future__ import annotations

from phase2.store.schema import Chunk

MODEL_NAME = "paraphrase-multilingual-mpnet-base-v2"
DIMENSIONS = 768

# Sentence-transformers stores the cached model here (written by the initial download).
# Loading by absolute path avoids a network check and works offline.
import os as _os
_CACHE_DIR = _os.path.join(
    _os.path.expanduser("~"),
    ".cache", "torch", "sentence_transformers",
    f"sentence-transformers_{MODEL_NAME}",
)
# If the local cache doesn't exist, fall back to the hub model name (will download).
_MODEL_SOURCE = _CACHE_DIR if _os.path.isdir(_CACHE_DIR) else MODEL_NAME

# Lazy-load to avoid paying import cost when this module is not used
_model = None


def _get_model():
    global _model
    if _model is None:
        # Guard: on Railway/production the 846MB model is not cached.
        # Production must use embed_openai.py (provider=openai in embedding_manifest.json).
        # Fail fast with a clear message rather than attempting a silent 846MB download.
        if not _os.path.isdir(_CACHE_DIR):
            on_railway = _os.environ.get("RAILWAY_ENVIRONMENT") or _os.environ.get("RAILWAY_PROJECT_ID")
            if on_railway:
                raise RuntimeError(
                    "Local sentence-transformer model not cached on Railway. "
                    "Production must use OpenAI embeddings. "
                    "Rebuild with: python phase2/build_index.py --provider openai --reset"
                )
        from sentence_transformers import SentenceTransformer  # type: ignore
        _model = SentenceTransformer(_MODEL_SOURCE)
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
