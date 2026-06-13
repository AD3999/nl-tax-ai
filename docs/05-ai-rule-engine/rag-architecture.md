# RAG Architecture — TaxWijs

> Retrieval-Augmented Generation pipeline specification. Covers corpus, chunking, embedding, retrieval, assembly, evaluation, and privacy controls.

---

## 1. Overview

The RAG system gives the Claude AI response layer accurate, source-cited Dutch tax knowledge. Without RAG, Claude would answer from training data that may be outdated or wrong. With RAG, every answer is grounded in verified 2026 rules with Belastingdienst source URLs.

**Critical invariant:** Only `verification_status = "verified"` records are ever embedded or retrieved. `pending_review` and `draft` records never reach users.

---

## 2. Corpus Types

| Corpus | Source File | Chunks | Embedding Strategy |
|--------|-------------|--------|-------------------|
| Tax rules | `phase1/data/seed/tax_rules_2026.json` | 28 (1 per rule) | All 3 languages in 1 chunk |
| Q&A pairs | `phase1/data/seed/qa_pairs_2026.json` | ~72 (1 canonical + N variants per Q&A) | Canonical + variant chunks |
| Tax scenarios | `phase1/data/seed/scenarios.json` | 6 (1 per scenario) | Natural language description |
| IB form fields | `phase1/data/seed/ib_form_mapping.json` | 9 (1 per field) | Mistakes + follow-up questions |
| Raw scraped | `phase1/data/raw/*.json` | ~varied | Sliding window 512-token / 64 overlap |
| **Total** | | **~113 seed chunks** | |

---

## 3. Chunk Schema

```python
@dataclass
class Chunk:
    chunk_id: str              # "rule-ZA-2026-001", "qa-QA-2026-002-variant-1"
    text: str                  # embeddable text (multilingual)
    embedding: list[float]     # 768 dims (paraphrase-multilingual-mpnet)
    doc_type: str              # "rule" | "qa" | "scenario" | "ib_field" | "raw"
    source_id: str             # Phase 1 record ID (ZA-2026-001, QA-2026-002, etc.)
    year: int                  # 2026
    topic: str                 # e.g. "zelfstandigenaftrek"
    user_types: list[str]      # e.g. ["zzp"]
    verification_status: str   # "verified" | "pending_review" | "draft"
    effective_from: str        # "2026-01-01"
    effective_until: str|None  # None or "2026-12-31" (SA-2026-001 expires end 2026)
    source_url: str            # citation URL (belastingdienst.nl)
    ai_prompt_hint: str|None   # "ALWAYS include ZVW in ZZP estimates"
    expected_ai_behavior: str|None  # from Q&A: "answer_directly" | "answer_with_caveat"
    language: str              # "multilingual" (rules) | "nl" | "en" | "fa"
    qa_id: str|None            # for variant chunks: canonical QA record ID
    priority: float            # 1.0 = seed, 0.8 = scraped
```

---

## 4. Chunking Rules

### 4.1 Rules → Chunks (`phase2/chunkers/rule_chunker.py`)

One chunk per rule. Include all three language versions in the SAME chunk text. Multilingual models map NL/EN/FA to the same vector space, so one chunk handles any-language queries.

```
[TAX RULE: {id}] Topic: {topic} | Category: {category} | Users: {user_types}
Dutch: {plain_nl}
English: {plain_en}
Persian: {plain_fa}
Condition: {condition summary}
Result: {type} | Value: {value} | {formula if exists}
{notes if exists}
AI INSTRUCTION: {ai_prompt_hint}
Tags: {tags joined}
Source: {source_url}
```

The `AI INSTRUCTION:` prefix must be preserved verbatim — it gets embedded and the assembler extracts it.

### 4.2 Q&A Pairs → Chunks (`phase2/chunkers/qa_chunker.py`)

- **1 canonical chunk** per Q&A: full question (all langs) + full answer (short + detailed, all langs) + `expected_ai_behavior` + `conditions_that_change_answer`
- **N variant chunks**: one per entry in `question_variants` — lightweight, just the variant text + `qa_id` pointing to canonical

Variant chunks exist purely for recall. When a variant is retrieved, the system uses `qa_id` to pull the full answer from the canonical chunk.

### 4.3 Scenarios → Chunks (`phase2/chunkers/scenario_chunker.py`)

Natural language description (NOT JSON dump). Example for SCN-ZZP-001:

```
ZZP IT consultant in year 3, annual revenue €72,000, business expenses €5,000.
After zelfstandigenaftrek (€1,200) and MKB-winstvrijstelling (12.7%), taxable Box 1 
income is €57,336. Box 1 tax: €20,476 raw, minus AHK (€1,889) and arbeidskorting 
(€4,065). ZVW contribution: €486. Total tax: €14,736. Monthly reserve needed: €1,228.
No toeslagen eligible (income too high). Wet DBA risk: low (multiple clients).
```

### 4.4 IB Form Fields → Chunks (`phase2/chunkers/ib_field_chunker.py`)

One chunk per field. Common mistakes and AI follow-up questions rendered as readable prose (not JSON arrays).

### 4.5 Raw Scraped → Chunks (`phase2/chunkers/raw_chunker.py`)

Sliding window: 512 tokens, 64-token overlap. Tagged with `source_type: "scraped"` and `priority: 0.8`.

---

## 5. Embedding Model

**Primary (production):** `paraphrase-multilingual-mpnet-base-v2`
- Provider: sentence-transformers (HuggingFace)
- Dimensions: 768
- Model size: 1,061 MB
- Language coverage: 50+ languages including NL, EN, FA
- Location: cached at `~/.cache/huggingface/hub/`

**Fallback (OpenAI):** `text-embedding-3-small`
- Dimensions: 1536
- Cost: ~$0.01 for all 113 seed chunks
- File: `phase2/embeddings/embed_openai.py`

**Model version tracking:** `phase2/embedding_manifest.json` records the model name, version, and index date. Any re-run must use the same model recorded here to avoid dimension mismatch.

---

## 6. Vector Store

**Development:** ChromaDB persistent local storage
- Collection: `taxwijs_2026` (single collection, `doc_type` as metadata filter)
- Path: `phase2/chroma_db/`

**Production:** Supabase pgvector
- Table: `rag_chunks` with `embedding vector(768)` column
- Index: `ivfflat (embedding vector_cosine_ops)` for ANN search

**Design decision:** Single collection with `doc_type` filter (NOT separate collections per type). Rationale: simpler operations, no cross-collection queries needed, metadata filters in ChromaDB work well.

---

## 7. Retrieval Algorithm

```python
def retrieve(question: str, user_type: str, year: int = 2026) -> list[RetrievedContext]:
    # Step 1: Embed the query
    query_embedding = embedder.encode(question)
    
    # Step 2: Hard metadata filters (always applied)
    filters = {
        "year": {"$eq": year},
        "verification_status": {"$eq": "verified"},
        # effective_until check done post-retrieval (ChromaDB limitation)
    }
    if user_type:
        filters["user_types"] = {"$contains": user_type}
    
    # Step 3: Vector search — 20 candidates, then filter to top-5
    candidates = collection.query(
        query_embeddings=[query_embedding],
        n_results=20,
        where=filters
    )
    
    # Step 4: Filter expired rules (effective_until < today)
    today = date.today().isoformat()
    valid = [c for c in candidates if c.effective_until is None or c.effective_until >= today]
    top5 = valid[:5]
    
    # Step 5: Cascade retrieval
    # If a Q&A chunk was retrieved, also pull its canonical record and linked rule_ids
    for chunk in top5:
        if chunk.doc_type == "qa" and chunk.qa_id:
            canonical = get_canonical_qa(chunk.qa_id)
            for rule_id in canonical.rule_ids:
                rule_chunk = get_chunk_by_source_id(rule_id)
                if rule_chunk and rule_chunk not in top5:
                    top5.append(rule_chunk)
    
    # Step 6: Deduplication (same source_id → keep higher score)
    return deduplicate(top5)
```

---

## 8. Context Assembly (`phase2/assembler.py`)

Token budget: **1,500 tokens** (enforced with `tiktoken`).

Output format injected into Claude system prompt:

```
=== RETRIEVED TAX KNOWLEDGE (verified, 2026) ===

[RULE: ZA-2026-001 | Topic: zelfstandigenaftrek | Source: https://www.belastingdienst.nl/...]
AI INSTRUCTION: Always check urencriterium (1225 hrs) before applying this deduction
Dutch: De zelfstandigenaftrek is €1.200 in 2026...
English: Self-employed entrepreneurs working 1,225+ hours/year may deduct €1,200...
Persian: کارآفرینانی که ۱٬۲۲۵ ساعت یا بیشتر...
Condition: is_entrepreneur AND hours_gte=1225

[Q&A: QA-2026-002 | AI BEHAVIOR: answer_directly | Source: ...]
Question: Wat is de zelfstandigenaftrek in 2026?
Short answer: €1,200 in 2026. Minimum 1,225 hours/year required.
Conditions that change answer: (1) AOW age: only €600 (2) Missing hours: €0

=== END RETRIEVED KNOWLEDGE ===
IMPORTANT: Cite source_url for every factual claim. Use the language the user wrote in.
```

---

## 9. Evaluation Plan

**Quality gates (must pass before each release):**

| Test | Target | File |
|------|--------|------|
| Precision@5 on 12 Q&A pairs | ≥ 95% | `phase2/test_retrieval.py` |
| Cross-lingual (NL→FA same top-3) | ≥ 72% | `phase2/test_retrieval.py` |
| Metadata filter (user_type isolation) | PASS | `phase2/test_retrieval.py` |
| Expiry filter (SA-2026-001 expires 2026-12-31) | PASS | `phase2/test_retrieval.py` |
| Token budget ≤ 1,500 tokens for top-5 | PASS | `phase2/test_retrieval.py` |

**Ground truth:** 12 Q&A pairs in `phase1/data/seed/qa_pairs_2026.json`, each with `rule_ids` the retriever must surface.

**Drift detection:** If precision@5 drops below 85% in nightly eval, trigger `ALERT_RAG_DRIFT` event and page on-call.

---

## 10. Privacy Boundaries

- No PII (names, BSN, IBAN, income amounts) is ever stored in ChromaDB or embedded.
- Chunks contain only tax law text, Q&A pairs about rules, and anonymized scenario descriptions.
- Source URLs are only from verified `belastingdienst.nl`, `wetten.overheid.nl`, or official Dutch government domains.
- User queries are passed to the embedding model locally (no API call to embed queries).
- The assembled context string contains no client-specific data — only rule text.
