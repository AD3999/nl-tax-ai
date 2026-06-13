# Architecture and Product Decision Log

> Every significant decision with rationale, alternatives considered, and consequences.
> Format: ADR (Architecture Decision Record) style.
> Updated: 2026-06-13

---

## ADR-001 — AI model: Claude (Anthropic) for responses

**Date:** 2026-05-01  
**Status:** Accepted  
**Decision:** Use Claude claude-sonnet-4-6 via Anthropic API for all AI-generated tax responses.

**Context:** The product requires a reasoning-capable LLM for explaining Dutch tax rules in three languages (NL/EN/FA) with citations and caveats.

**Alternatives considered:**
- OpenAI GPT-4o — available, widely used, but chosen not to use for AI responses
- Local/self-hosted LLM — not viable for production quality at this stage

**Consequences:**
- AI responses are billed per token via Anthropic API
- `ANTHROPIC_API_KEY` required in production environment
- SSE streaming is used for chat responses (`text/event-stream`)
- OpenAI is still used for embeddings (`text-embedding-3-small`) — separate concern

---

## ADR-002 — Embedding model: OpenAI text-embedding-3-small

**Date:** 2026-05-01  
**Status:** Accepted  
**Decision:** Use OpenAI `text-embedding-3-small` (1536 dims) as primary embedding model. Fallback: `all-MiniLM-L6-v2` (sentence-transformers, local, 384 dims) for offline use.

**Rationale:** ~$0.01 for all 113 chunks. Multilingual capability. Well-tested with ChromaDB.

**Consequences:**
- `OPENAI_API_KEY` required for production embeddings
- Local model `all-MiniLM-L6-v2` is English-only — cross-lingual precision drops from 9/11 to 3/11
- `embedding_manifest.json` records which model was used at index time

---

## ADR-003 — Vector store: ChromaDB (dev) / Supabase pgvector (production)

**Date:** 2026-05-01  
**Status:** Accepted  
**Decision:** Single ChromaDB collection with `doc_type` metadata filter for development. Supabase pgvector for production.

**Alternatives considered:**
- Pinecone — managed, but adds vendor dependency and cost
- Weaviate — powerful but heavyweight for 113 chunks
- Separate collections per doc_type — rejected because ChromaDB metadata filters work well and add no overhead

**Consequences:**
- All 113 chunks in one collection
- Hard filters on every query: `year=2026`, `verification_status=verified`, `effective_until` check
- Migration from ChromaDB to pgvector requires re-embedding (same vectors, different store)

---

## ADR-004 — Frontend: React + Vite (not Next.js)

**Date:** 2026-05-01  
**Status:** Accepted  
**Decision:** React 19 + TypeScript + Vite 8 for all frontend applications.

**Context:** User explicitly chose React+Vite over Next.js.

**Consequences:**
- No server-side rendering (SSR) — all rendering is client-side
- SEO relies on pre-rendered static meta tags
- Deployment serves the Vite build as static assets via Django WhiteNoise

---

## ADR-005 — AI math policy: AI never computes

**Date:** 2026-05-01  
**Status:** Accepted — CORE INVARIANT  
**Decision:** The AI never does arithmetic. Every tax number is computed by the deterministic calculator (`backend/apps/calculator/engine.py`). The AI retrieves rules, explains them, and cites sources.

**Rationale:** LLMs make arithmetic errors. Tax calculations must be deterministic and auditable. The calculator engine is validated against Belastingdienst ground truth with 0% error on all 6 scenarios.

**Consequences:**
- Any AI response containing a tax amount must have come from a calculator call, not from the model's computation
- The chat endpoint calls the calculator and injects results into the system prompt before Claude responds
- This invariant must be enforced in all future AI feature development

---

## ADR-006 — Only verified records served to users

**Date:** 2026-05-01  
**Status:** Accepted — CORE INVARIANT  
**Decision:** `verification_status = "verified"` is a hard filter on all RAG retrieval. `pending_review` and `draft` records never reach the user.

**Rationale:** Tax information accuracy is safety-critical. Unverified rules could lead to wrong deductions, penalties, or legal liability.

**Consequences:**
- New rules must go through a review workflow before they can affect user responses
- The validator (`phase1/data/scripts/validate.py`) must pass 100% before any phase ships

---

## ADR-007 — Database: SQLite (dev) / PostgreSQL (production)

**Date:** 2026-05-01  
**Status:** Accepted  
**Decision:** SQLite for local development via `DATABASE_URL=sqlite:///db.sqlite3`. PostgreSQL + pgvector for production.

**Consequences:**
- Some PostgreSQL-specific features (RLS, pgvector, JSONB operators) cannot be tested locally without a local PostgreSQL instance
- Docker Compose is available for local PostgreSQL if needed

---

## ADR-008 — Chunking: all 3 languages in one chunk (for rules)

**Date:** 2026-05-01  
**Status:** Accepted  
**Decision:** Tax rule chunks include `plain_nl`, `plain_en`, and `plain_fa` in the same chunk text. Q&A variant chunks are lightweight and point to canonical records.

**Rationale:** A multilingual embedding model maps all three languages to the same vector space, so one chunk handles queries in any language. Reduces collection size from 3× to 1×.

**Consequences:**
- Cross-lingual retrieval (Persian query → Dutch rule) works with the OpenAI model but not with the local English-only model
- Q&A pairs use N variant chunks for recall, all pointing to one canonical chunk for the full answer

---

## ADR-009 — No premium gates at launch

**Date:** 2026-06-01  
**Status:** Accepted  
**Decision:** All features are free at launch. Billing and subscription models are specced and the data models exist, but no paywalls are active.

**Rationale:** User requested this. Build audience first, monetize later.

**Consequences:**
- `Subscription`, `Invoice`, `UsageRecord` models exist but have no active enforcement
- Pricing page, Stripe integration, and paywall gates are deferred

---

## ADR-010 — Invitation-only client onboarding for accountant portal

**Date:** 2026-06-08  
**Status:** Accepted  
**Decision:** Clients join the accountant portal only via accountant-sent invitations. Manual "+ Add client" form was removed.

**Rationale:** Manual adds created `AccountantClientProfile` rows with `client_user=null`, bypassing the invitation flow and causing duplicates and stale records.

**Consequences:**
- All client → accountant relationships are traceable to an `AccountantInvitation` record
- `AccountantClient` is always linked to a real `User`

---

## ADR-011 — Monorepo structure (target)

**Date:** 2026-06-13  
**Status:** Proposed  
**Decision:** Move toward a monorepo structure with `apps/`, `packages/`, `services/`, `infra/` top-level directories.

**Current state:** Single `backend/` (Django) + `frontend/` (React) in project root.

**Target structure:**
```
apps/client-web         (React, client-facing)
apps/accountant-web     (React, accountant-facing — currently merged with client-web)
apps/admin-web          (React, super admin console — not yet built)
apps/api                (Django REST API — current backend/)
packages/ui             (Shared React component library)
packages/domain         (Shared TypeScript domain types)
packages/contracts      (OpenAPI + AsyncAPI generated types)
packages/config         (Shared ESLint, TS config)
services/document-worker (Celery document processing)
services/ai-worker      (Celery AI tasks)
services/rag-worker     (ChromaDB / embedding service)
infra/terraform         (Cloud infra)
infra/k8s               (Kubernetes manifests)
```

**Consequences:**
- Migration path: gradual extraction, not a big-bang rewrite
- Currently blocked on: GAP-I01 (cloud provider not locked)
