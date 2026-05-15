# CLAUDE.md — NL Tax AI Project Memory

> This file is read by Claude Code at the start of every session.
> It contains the complete context of this project so work can continue
> without re-explaining what was built, why, or what comes next.
> Last updated: May 2026 (Phase 1 complete, Phase 2 starting).

---

## What this project is

An AI-powered Dutch tax assistant for **ZZP (freelance) workers, employees, expats, and DGA directors** in the Netherlands. It answers tax questions, calculates tax bills, and guides users through the annual income tax return (aangifte inkomstenbelasting). It supports three languages: **Dutch (NL), English (EN), and Persian (FA)**. Persian is a first-class language — not a translation, a fully supported interface language.

Target users: ~1 million ZZP workers in the Netherlands, many of whom are Iranian expats or non-Dutch speakers who find the tax system confusing. The product serves them in their own language.

**Core architectural principle that must never be violated:** The AI never does arithmetic. Every tax number (brackets, rates, credits, phase-outs) is computed by a deterministic code calculator. The AI retrieves rules, explains them, and cites sources. The calculator computes numbers. These are always separate.

---

## Current project status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Knowledge Base | ✅ Complete |
| Phase 2 | RAG Pipeline | 🔄 Starting now |
| Phase 3 | Tax Calculator Engine | ⏳ Not started |
| Phase 4 | AI Response Layer | ⏳ Not started |
| Phase 5 | User Intake System | ⏳ Not started |
| Phase 6 | IB Return Guide | ⏳ Not started |
| Phase 7 | Testing & QA | 🔄 Ongoing from Phase 2 |
| Phase 8 | Product Layer | ⏳ Not started |
| Phase 9 | Annual Maintenance | ⏳ Recurring each September |

**The next task is Phase 2 — building the RAG pipeline.**

---

## Repository structure (what exists on disk)

```
nl-tax-ai/
├── CLAUDE.md                          ← this file
├── phase1/
│   ├── README.md                      ← Phase 1 documentation
│   ├── requirements.txt               ← pip dependencies
│   ├── data/
│   │   ├── schemas/
│   │   │   ├── tax_rule.schema.json   ← JSON Schema for a tax rule
│   │   │   ├── qa_pair.schema.json    ← JSON Schema for a Q&A pair
│   │   │   ├── scenario.schema.json   ← JSON Schema for a tax scenario
│   │   │   └── ib_form_field.schema.json ← JSON Schema for IB form fields
│   │   ├── seed/
│   │   │   ├── tax_rules_2026.json    ← 28 hand-verified tax rules
│   │   │   ├── qa_pairs_2026.json     ← 12 Q&A pairs (NL+EN+FA)
│   │   │   ├── scenarios.json         ← 6 full tax scenarios
│   │   │   └── ib_form_mapping.json   ← 9 IB form fields mapped
│   │   └── raw/                       ← scraped content goes here (gitignore)
│   ├── scrapers/
│   │   ├── scrape_belastingdienst.py  ← scrapes 22 official Belastingdienst URLs
│   │   └── scrape_forums.py           ← scrapes Reddit + expatforum.nl
│   └── scripts/
│       └── validate.py                ← schema + calculation + integrity tests
└── phase2/                            ← TO BE BUILT
    (see Phase 2 plan below)
```

---

## Phase 1 — Knowledge Base (complete)

### What was built and why

Phase 1 created a structured, trustworthy knowledge layer. All data is in JSON, validated against schemas. Every piece of knowledge has a source URL, a verification status, and a year tag.

**Four schemas** define the shape of every record:

`tax_rule.schema.json` — A single tax rule as `condition → result → source`. ID format: `TOPIC-YEAR-SEQ` (e.g. `ZA-2026-001`). Every rule has `plain_nl`, `plain_en`, `plain_fa` for three-language output, an `ai_prompt_hint` for RAG behavior, and a `verification_status` field. Only `verified` rules should ever be served to users.

`qa_pair.schema.json` — A Q&A pair with `question_variants` (multiple phrasings), three-language answers (`short_*` + `detailed_*`), a `numeric_answer` for accuracy regression testing, and `expected_ai_behavior` (`answer_directly` / `answer_with_caveat` / `ask_clarifying_question` / `refer_to_advisor`). This behavioral field is critical — it tells the AI how confident to be when answering.

`scenario.schema.json` — A complete tax scenario with `profile` (user inputs), `calculation` (every intermediate step explicitly stored), and `result` (total tax, effective rate, monthly reserve, toeslagen eligibility, optimization opportunities, Wet DBA risk). Scenarios are used as worked examples in retrieval and as accuracy benchmarks.

`ib_form_field.schema.json` — Maps official IB form field codes (`1a`, `1b`, etc.) to plain-language questions in three languages, plus `common_mistakes` and `ai_follow_up_questions`.

### Key 2026 tax data (memorize these)

| Item | Value | Notes |
|------|-------|-------|
| Box 1 bracket 1 | 35.75% | €0–€38,883. Includes 27.65% social insurance |
| Box 1 bracket 3 | 49.50% | Above €78,426 |
| Zelfstandigenaftrek | €1,200 | ZZP only, 1,225 hrs/year. WAS €2,470 in 2025 |
| Startersaftrek | €2,123 | ⚠️ LAST YEAR IN 2026. Abolished from 2027 |
| MKB-winstvrijstelling | 12.7% | Applied AFTER ondernemersaftrek, NO hours req |
| ZVW (health contribution) | 5.32% | On profit up to €71,628. Max €3,811/yr. Most missed! |
| Algemene heffingskorting | €3,115 max | Phases out to €0 at €78,426 aggregate income |
| Arbeidskorting | €5,685 max | Phases out above €45,592 |
| IACK (working parents) | €3,032 max | Child under 12 registered at home |
| Box 2 low rate | 24.5% | Up to €68,843 dividend/share income |
| Box 2 high rate | 31.0% | Above €68,843 |
| Box 3 exemption | €59,357/person | Reference date: 1 January |
| Box 3 rate | 36% | On fictitious return (savings 1.28%, investments 6%) |
| BTW standard | 21% | Most professional services |
| BTW reduced | 9% | Food, medicine, books. ⚠️ Accommodation moved 9%→21% in 2026 |
| KOR threshold | €20,000 | VAT exemption option for small turnover |
| Zorgtoeslag max | €129/month | Hard cutoff at €40,857 (single) — €1 over = €0 |
| Huurtoeslag | Reformed 2026 | Rent ceiling ABOLISHED — any rent now qualifies |
| Wet DBA | Active enforcement | Since Jan 2025. 65%+ single client = medium risk |
| DGA gebruikelijk loon | €56,000 | Minimum DGA salary 2026 |
| 30% ruling | 5-year phase-down | Year 1-3: 30% / Year 4: 20% / Year 5: 10% |
| BTW Q1 deadline | 30 April 2026 | Late = automatic penalty even for zero return |
| IB return deadline | 1 May 2026 | For tax year 2025 |

### The 28 tax rules (IDs to remember)

```
BOX-2026-001  Box 1 detection (work/business income)
BOX-2026-002  Box 2 detection (≥5% shareholding)
BOX-2026-003  Box 3 detection (assets >€59,357)
BR1-2026-001  Box 1 bracket 1 (35.75%, €0-38,883)
BR1-2026-002  Box 1 bracket 2 (37.56%, AOW age only)
BR1-2026-003  Box 1 bracket 3 (49.50%, >€78,426)
ZA-2026-001   Zelfstandigenaftrek €1,200
SA-2026-001   Startersaftrek €2,123 (LAST YEAR — effective_until 2026-12-31)
MKB-2026-001  MKB-winstvrijstelling 12.7%
KIA-2026-001  Kleinschaligheidsinvesteringsaftrek (28% on €2,901–€70,602)
LR-2026-001   Lijfrente jaarruimte (30% × (income − €19,172))
ZVW-2026-001  ZVW bijdrage 5.32% (ALWAYS include in ZZP estimates)
AHK-2026-001  Algemene heffingskorting €3,115 max (phase-out at €78,426)
AK-2026-001   Arbeidskorting €5,685 max
IACK-2026-001 IACK €3,032 max (child under 12)
B2R-2026-001  Box 2 low rate 24.5%
B2R-2026-002  Box 2 high rate 31%
B3R-2026-001  Box 3 fictitious returns (savings 1.28%, investments 6%, rate 36%)
BTW-2026-001  BTW standard 21%
BTW-2026-002  BTW reduced 9% (accommodation changed to 21% in 2026)
KOR-2026-001  KOR VAT exemption <€20k
ZT-2026-001   Zorgtoeslag €129/mo (hard cutoff €40,857)
HT-2026-001   Huurtoeslag (2026 reform: no rent ceiling)
WD-2026-001   Wet DBA (active enforcement since 2025)
DL-2026-001   BTW quarterly deadlines
DL-2026-002   IB return deadline 1 May 2026
EXP-2026-001  30% ruling expats (5-year phase-down from 2024)
DGA-2026-001  DGA gebruikelijk loon €56,000
```

### The 12 Q&A pairs and their ground truth rule_ids

This table is used for retrieval accuracy testing in Phase 2.

| QA ID | Question (short) | Ground truth rule_ids | Expected behavior |
|-------|------------------|-----------------------|-------------------|
| QA-2026-001 | ZZP €50k profit total tax? | BR1-2026-001, BR1-2026-003, ZA-2026-001, MKB-2026-001, AHK-2026-001, AK-2026-001, ZVW-2026-001 | answer_with_caveat |
| QA-2026-002 | Zelfstandigenaftrek + urencriterium? | ZA-2026-001 | answer_directly |
| QA-2026-003 | Startersaftrek last year 2026? | SA-2026-001, ZA-2026-001 | answer_directly |
| QA-2026-004 | ZVW hidden tax explained? | ZVW-2026-001 | answer_directly |
| QA-2026-005 | €65k profit — top bracket? | BR1-2026-001, BR1-2026-003, ZA-2026-001, MKB-2026-001 | answer_with_caveat |
| QA-2026-006 | Huurtoeslag for ZZP? | HT-2026-001 | answer_directly |
| QA-2026-007 | Wet DBA risk assessment? | WD-2026-001 | answer_with_caveat |
| QA-2026-008 | Expat 30% ruling + IB return? | EXP-2026-001, DL-2026-002 | answer_with_caveat |
| QA-2026-009 | Pension deduction for ZZP? | LR-2026-001 | answer_directly |
| QA-2026-010 | BTW quarterly deadlines? | DL-2026-001, KOR-2026-001 | answer_directly |
| QA-2026-011 | DGA minimum salary? | DGA-2026-001, B2R-2026-001 | answer_with_caveat |
| QA-2026-012 | Home office deduction? | (none — misconception rule) | answer_directly |

### The 6 scenarios and their totals

| ID | Type | Revenue | Total tax | Monthly reserve |
|----|------|---------|-----------|-----------------|
| SCN-ZZP-001 | ZZP yr3 IT | €72k | €14,736 | €1,228 |
| SCN-ZZP-002 | ZZP yr1 design | €28k | €1,359 | €113 |
| SCN-ZZP-003 | ZZP yr8 senior | €140k | €32,179 | €2,682 |
| SCN-EMP-001 | Employee | €48k | €8,210 | €0 |
| SCN-EXP-001 | Expat + 30% ruling | €90k | €16,390 | €0 |
| SCN-DGA-001 | DGA + BV | €56k+div | €24,111 | €0 |

---

## Phase 2 — RAG Pipeline (next task)

### What Phase 2 must produce

A function `retrieve(question, user_type, year)` that takes a user's question, returns a formatted context string containing the most relevant tax rules, Q&A pairs, and scenarios — ready to inject into an AI system prompt. The AI reads this context and answers from it, citing the source URLs.

### Files to create in phase2/

```
phase2/
├── chunkers/
│   ├── rule_chunker.py       ← converts tax rules → embeddable Chunk objects
│   ├── qa_chunker.py         ← converts Q&A pairs → Chunk objects (1 per variant)
│   ├── scenario_chunker.py   ← converts scenarios → Chunk objects (situation text)
│   ├── ib_field_chunker.py   ← converts IB fields → Chunk objects (mistakes + follow-ups)
│   └── raw_chunker.py        ← converts scraped raw JSON → Chunk objects
├── embeddings/
│   ├── embed_openai.py       ← OpenAI text-embedding-3-small (primary)
│   └── embed_local.py        ← multilingual-e5 sentence-transformers (local fallback)
├── store/
│   ├── schema.py             ← Chunk dataclass definition
│   ├── chroma_store.py       ← ChromaDB implementation (dev/local)
│   └── supabase_store.py     ← Supabase pgvector implementation (production)
├── retriever.py              ← Main interface: retrieve(question, user_type, year)
├── assembler.py              ← Formats retrieved chunks into AI-ready context string
├── build_index.py            ← Entry point: load Phase 1 data → chunk → embed → store
├── test_retrieval.py         ← Accuracy tests: precision@5, cross-lingual, filter tests
└── requirements.txt
```

### The Chunk dataclass (schema.py)

Every document in the vector store is a Chunk with these fields:

```python
@dataclass
class Chunk:
    chunk_id: str              # "rule-ZA-2026-001", "qa-QA-2026-002-variant-1"
    text: str                  # the embeddable text string
    embedding: list[float]     # the vector (1536 dims for OpenAI)
    doc_type: str              # "rule" | "qa" | "scenario" | "ib_field" | "raw"
    source_id: str             # Phase 1 record ID (ZA-2026-001, QA-2026-002, etc.)
    year: int                  # 2026
    topic: str                 # e.g. "zelfstandigenaftrek"
    user_types: list[str]      # e.g. ["zzp"]
    verification_status: str   # "verified" | "pending_review" | "draft"
    effective_from: str        # "2026-01-01"
    effective_until: str|None  # None or "2026-12-31" (SA-2026-001 expires end of 2026)
    source_url: str            # citation URL
    ai_prompt_hint: str|None   # from rule field (e.g. "ALWAYS include ZVW")
    expected_ai_behavior: str|None  # from Q&A field
    language: str              # "multilingual" (most) or "nl"/"en"/"fa"
    qa_id: str|None            # for variant chunks: points to canonical QA record
    priority: float            # 1.0 = seed data, 0.8 = scraped raw
```

### Chunking rules (how to convert each document type)

**Rules → Chunks (rule_chunker.py)**

One chunk per rule. Include ALL three language versions (`plain_nl`, `plain_en`, `plain_fa`) in the same chunk text. This is important: a multilingual embedding model maps all three to the same vector space, so one chunk handles queries in any language.

Also include: condition summary in readable prose, result value + formula, notes, ai_prompt_hint, tags, source_url. The `ai_prompt_hint` is critical — it must appear in the chunk text as "AI INSTRUCTION: ..." so it gets embedded and the assembler can extract it.

Format:
```
[TAX RULE: {id}] Topic: {topic} | Category: {category} | Users: {user_types}
Dutch: {plain_nl}
English: {plain_en}
Persian: {plain_fa}
Condition: {condition summary in plain text}
Result: {type} | Value: {value} | {formula if exists}
{notes if exists}
AI INSTRUCTION: {ai_prompt_hint}
Tags: {tags joined}
Source: {source_url}
```

**Q&A pairs → Chunks (qa_chunker.py)**

Multiple chunks per Q&A pair:
- 1 canonical chunk with full question (NL+EN+FA) + full answer (short + detailed in all 3 langs) + `expected_ai_behavior` + `conditions_that_change_answer`
- N variant chunks (one per entry in `question_variants`) — these are lightweight, just the variant question text + `qa_id` in metadata pointing to the canonical record

The variant chunks exist purely for recall. When retrieved, the system uses `qa_id` to pull the full answer from the canonical chunk.

**Scenarios → Chunks (scenario_chunker.py)**

One chunk per scenario. Write it as a natural language situation description — NOT as JSON output. The chunk should read like a worked example a human would write. Focus on: income level, user type, key deductions applied, final tax figure, monthly reserve needed, key insights. This way when someone asks "how much tax for a ZZP with ~€70k" the scenario chunk surfaces via semantic similarity.

**IB form fields → Chunks (ib_field_chunker.py)**

One chunk per field. The `common_mistakes` and `ai_follow_up_questions` arrays should be rendered as readable text, not as JSON arrays. These are the most valuable parts for retrieval.

**Raw scraped → Chunks (raw_chunker.py)**

Use sliding window: 512 tokens, 64 token overlap. Tag with `source_type: "scraped"` and `priority: 0.8` so seed data takes precedence when both cover the same topic.

### Vector store design decision (already decided)

Use a **single ChromaDB collection** with `doc_type` as a metadata filter. Do NOT use separate collections per document type. The filters work well and add no operational overhead.

Always apply these hard filters on every retrieval:
- `year = 2026`
- `verification_status = "verified"`
- `effective_until IS NULL OR effective_until > current_date`

Apply `user_type` filter when known from user profile. This is `{"user_types": {"$contains": user_type}}` in ChromaDB query syntax.

### Retrieval logic (retriever.py)

Four steps:
1. **Embed the query** using the same model recorded in `embedding_manifest.json`
2. **Filtered vector search**: apply metadata filters, then cosine similarity, return top-5
3. **Cascade retrieval**: if a Q&A pair was retrieved, also pull its `rule_ids` via direct lookup even if they weren't in top-5
4. **Deduplication**: if same source_id appears twice (canonical + variant), keep higher-scored one

The `retrieve()` function returns a list of `RetrievedContext` objects, each with: `text`, `source_url`, `source_id`, `doc_type`, `score`, `ai_prompt_hint`, `expected_ai_behavior`.

### Context assembler output format (assembler.py)

The assembler produces a string like this for injection into the AI system prompt:

```
=== RETRIEVED TAX KNOWLEDGE (verified, 2026) ===

[RULE: ZA-2026-001 | Topic: zelfstandigenaftrek | Source: {url}]
AI INSTRUCTION: Always check urencriterium (1225 hrs) before applying this deduction
Dutch: De zelfstandigenaftrek is €1.200 in 2026...
English: Self-employed entrepreneurs working 1,225+ hours/year may deduct €1,200...
Persian: کارآفرینانی که ۱٬۲۲۵ ساعت یا بیشتر...
Condition: is_entrepreneur AND hours_gte=1225

[Q&A: QA-2026-002 | AI BEHAVIOR: answer_directly | Source: {url}]
Question: Wat is de zelfstandigenaftrek in 2026?
Short answer: €1,200 in 2026. Minimum 1,225 hours/year required.
Conditions that change answer: (1) AOW age: only €600 (2) Missing hours: €0

=== END RETRIEVED KNOWLEDGE ===
IMPORTANT: Cite source_url for every factual claim. Use the language the user wrote in.
```

Respect a token budget of ~1,500 tokens for the context block. Use `tiktoken` to count tokens before finalizing.

### Accuracy tests (test_retrieval.py)

Must pass before Phase 3 starts:

1. **Precision@5**: for each of the 12 Q&A pairs, embed `question_nl`, retrieve top-5, check that all `rule_ids` from the Q&A appear in the results. Target: 95% precision. (Note: cascade retrieval means we check top-5 semantic + cascade-pulled rules combined.)

2. **Cross-lingual test**: for each Q&A, embed `question_fa` (Persian), check it retrieves the same top rules as `question_nl`. Target: same top-3 results.

3. **Metadata filter test**: query with `user_type="employee"` must NOT return rules tagged `user_types: ["dga"]` or `user_types: ["zzp"]`.

4. **Expiry test**: `SA-2026-001` (startersaftrek, `effective_until: 2026-12-31`) must be retrieved when `current_date=2026-06-01` but NOT when `current_date=2027-01-01`.

5. **Token budget test**: assembled context for top-5 results must be ≤1,500 tokens.

### Embedding model

Primary: `text-embedding-3-small` (OpenAI, 1536 dims, ~$0.01 for all 113 chunks)
Fallback: `paraphrase-multilingual-mpnet-base-v2` (sentence-transformers, runs offline)

Store the model name and version in `phase2/embedding_manifest.json` so re-runs always use the same model.

### Dependencies (requirements.txt for phase2)

```
chromadb>=0.4.0
openai>=1.0.0
sentence-transformers>=2.2.0
tiktoken>=0.5.0
numpy>=1.24.0
python-dotenv>=1.0.0
supabase>=1.0.0    # for production store (optional at this stage)
```

---

## Architecture principles (must always follow)

1. **AI never computes numbers.** The AI calls the calculator API, reads the result, and explains it. Never asks Claude to multiply or apply a tax rate.

2. **Every factual claim must have a source_url.** When the AI mentions a tax rate or rule, it must cite the Belastingdienst URL that the rule came from. This is enforced by the assembler passing source_url through to context.

3. **Only `verified` records are served.** The `verification_status` field is a hard filter. `pending_review` and `draft` records never reach the user.

4. **Three-language parity.** Dutch, English, and Persian receive equal quality. Persian is not a secondary translation — it has full `plain_fa`, `question_fa`, `answer.detailed_fa` in every record.

5. **Deterministic IDs.** Rule IDs follow `TOPIC-YEAR-SEQ`. Never auto-generate IDs. This enables the `supersedes` chain across years.

6. **Year isolation.** Every query filters `year=2026` unless explicitly asking about historical data. The schema supports multi-year but the active year is always explicit.

7. **The validator is truth.** Before any phase ships, `validate.py` must pass 100%. Add tests to it as new components are built — never remove existing tests.

---

## How to set up the development environment

```bash
# 1. Clone or create project folder
mkdir nl-tax-ai && cd nl-tax-ai

# 2. Create folder structure matching the layout above
mkdir -p phase1/{data/{schemas,seed,raw},scrapers,scripts}
mkdir -p phase2/{chunkers,embeddings,store}

# 3. Copy all Phase 1 files into phase1/ (downloaded from session outputs)

# 4. Install Phase 1 dependencies
pip install -r phase1/requirements.txt

# 5. Validate Phase 1 data
cd phase1/scripts && python validate.py

# 6. Set up environment variables
cp .env.example .env
# Add: OPENAI_API_KEY=your_key

# 7. Start Phase 2
cd ../..
# Build the vector index:
python phase2/build_index.py
# Run retrieval tests:
python phase2/test_retrieval.py
```

---

## Environment variables needed

```
OPENAI_API_KEY=                  # for embeddings only (Phase 2 vector search)
ANTHROPIC_API_KEY=               # for AI responses (Phase 4 — using Claude, not GPT)
REDDIT_CLIENT_ID=                # for forum scraper (Phase 1, optional)
REDDIT_CLIENT_SECRET=            # for forum scraper (Phase 1, optional)
SUPABASE_URL=                    # for production vector store (Phase 2, later)
SUPABASE_KEY=                    # for production vector store (Phase 2, later)
```

---

## Key decisions already made (do not re-debate these)

| Decision | What was chosen | Why |
|----------|-----------------|-----|
| AI math policy | AI never computes, always calls calculator | Deterministic accuracy |
| Vector DB (dev) | ChromaDB with persistent local storage | Simple, no infra, free |
| Vector DB (prod) | Supabase pgvector | SQL + vector in one DB |
| Embedding model | OpenAI text-embedding-3-small (primary) | Low cost, good multilingual |
| AI response model | Claude (Anthropic API) via claude-api | Best reasoning for tax explanations |
| Chunking strategy | One collection, doc_type metadata filter | Simpler than separate collections |
| Q&A variant strategy | One chunk per variant, all point to canonical | Maximizes recall |
| Language strategy | All 3 langs in one chunk (for rules) | Multilingual model handles it |
| Retrieval strategy | Filtered vector search + cascade pull | Semantic + graph combined |
| Token budget | ~1,500 tokens for context block | Fits comfortably in context |
| Retrieval top-k | 5 semantic + cascade | Enough context, not too much |
| Precision target | 95% precision@5 on 12 Q&A pairs | Measurable quality gate |

---

## What Phase 3 will need (for awareness, not to build yet)

Phase 3 is the deterministic tax calculator. It will use the Phase 1 rules database as its source of truth for all values. Key functions needed:

- `calculateBox1Tax(taxableIncome, aowAge)` → from BR1-2026-001/002/003
- `calculateZelfstandigenaftrek(hoursPerYear, profit)` → from ZA-2026-001
- `calculateMKB(profitAfterOA)` → from MKB-2026-001
- `calculateAHK(aggregateIncome)` → from AHK-2026-001 (phase-out formula)
- `calculateArbeidskorting(workIncome)` → from AK-2026-001
- `calculateZVW(profit)` → from ZVW-2026-001
- `calculateBox3Tax(savings, investments, year)` → from B3R-2026-001
- `wetDBAScorer(profile)` → from WD-2026-001 (returns low/medium/high + reasons)
- `calculateToeslagen(profile)` → from ZT-2026-001, HT-2026-001

All 6 scenarios in `phase1/data/seed/scenarios.json` must pass with <1% error.

---

## Notes for the assistant reading this file

- When asked to work on Phase 2, start with `phase2/store/schema.py` (the Chunk dataclass) since everything else depends on it.
- When writing chunkers, read the actual Phase 1 JSON files first — the field names matter exactly.
- The `ai_prompt_hint` field on rules must survive the full pipeline and appear in the assembled context.
- The `expected_ai_behavior` field on Q&A pairs must survive the full pipeline and appear in the assembled context.
- Source URLs must always be preserved and surfaced.
- Never hardcode tax values — always read them from the Phase 1 JSON files so the system stays data-driven.
- Persian text requires UTF-8 encoding everywhere. All file I/O must use `encoding="utf-8"`.
- Run `phase1/scripts/validate.py` after any change to Phase 1 data to confirm nothing broke.
- The total chunk count is ~113 — this is a small dataset. ChromaDB handles it easily. No need for complex sharding.
