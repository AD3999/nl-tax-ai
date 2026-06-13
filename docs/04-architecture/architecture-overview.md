# Architecture Overview

> TaxWijs system design principles, bounded contexts, and technology choices.
> Updated: 2026-06-13

---

## Design Principles

1. **AI explains, calculator computes.** The AI (Claude) never does arithmetic. The deterministic `engine.py` computes all tax numbers. This invariant must be enforced in all future development.

2. **Only verified data reaches users.** Every RAG retrieval applies a hard `verification_status=verified` filter. Pending or draft rules never appear in responses.

3. **Tenant isolation by design.** Every database query scopes to the authenticated user's firm and role. Accountants cannot see other firms' clients. Clients cannot see other clients' engagements.

4. **AI extraction is always candidate-only.** OCR/AI extractions are never authoritative until an accountant (or the user) explicitly approves them. `review_status=candidate` is the default. Values never affect tax calculations until `approved`.

5. **Audit trail is immutable.** `PortalAuditLog` and all structured event logs are append-only. No records are deleted — only archived with a `deleted_at` timestamp.

6. **Three-language parity.** All features must work equally in NL, EN, and FA. Persian is not a secondary translation — it has full text in every rule, Q&A pair, and UI string.

7. **Source everything.** Every factual claim in an AI response must include a `source_url` from an official Dutch government source.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSERS                          │
│     React+Vite SPA (client-web + accountant-web + admin-web)    │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS (REST + SSE)
┌─────────────────────────▼───────────────────────────────────────┐
│                    DJANGO REST API                               │
│  apps: users │ tax │ chat │ calculator │ portal │ zzp            │
│  Served via: gunicorn + WhiteNoise (static files)                │
└─────┬─────────┬────────────┬──────────┬────────────┬────────────┘
      │         │            │          │            │
  ┌───▼──┐ ┌───▼──┐   ┌─────▼───┐ ┌───▼────┐ ┌────▼────┐
  │SQLite│ │Chroma│   │Anthropic│ │OpenAI  │ │Sentry/  │
  │(dev) │ │DB    │   │Claude   │ │Embed   │ │PostHog  │
  │Postgres│(RAG) │   │API      │ │API     │ │(obs)    │
  │(prod)│ └──────┘   └─────────┘ └────────┘ └─────────┘
  └──────┘
      │
  ┌───▼──────────────┐
  │  Celery Beat     │
  │  (async tasks)   │
  │  - reminders     │
  │  - OCR jobs      │
  │  - purge/GDPR    │
  └──────────────────┘
```

---

## Bounded Contexts

### 1. Identity & Access
**Owns:** Users, roles, permissions, sessions, OAuth, invitations, push subscriptions  
**Key models:** `User`, `AccountantProfile`, `AccountantInvitation`, `PushSubscription`  
**Django app:** `apps/users`

### 2. Tax Knowledge
**Owns:** Tax rules, Q&A pairs, scenarios, IB form fields, RAG pipeline  
**Key files:** `phase1/data/seed/`, `phase2/`  
**Django app:** `apps/tax`

### 3. AI Response
**Owns:** Chat messages, AI streaming, intake profile, IB return mode, simulation mode  
**Key models:** `Conversation`, `Message`, `User.tax_memory`, `User.intake_profile`  
**Django app:** `apps/chat`

### 4. Tax Calculator
**Owns:** Deterministic tax calculation engine, all 2026 tax rules implemented in code  
**Key files:** `backend/apps/calculator/engine.py`  
**Django app:** `apps/calculator`

### 5. Engagement Management
**Owns:** Engagements, checklists, documents, extractions, readiness, actions, audit  
**Key models:** `TaxEngagement`, `ChecklistItem`, `ClientDocument`, `ExtractedIncome`, `AccountantAction`, `PortalAuditLog`  
**Django app:** `apps/portal`

### 6. ZZP Workspace
**Owns:** ZZP revenue/expense tracking, quarterly VAT calculation  
**Key models:** ZZP workspace models  
**Django app:** `apps/zzp`

### 7. Notifications & Messaging
**Owns:** Push notifications, accountant-client messages, email notifications  
**Key models:** `PushSubscription`, `PortalMessage`, `ReminderLog`  
**Shared across:** `apps/users`, `apps/portal`

### 8. Rule Engine (target state)
**Owns:** Versioned tax rules, rule approval workflow, rule test cases, shadow mode  
**Key models:** `RuleSet`, `Rule`, `RuleVersion`, `RuleTestCase` (to be built)  
**Django app:** `apps/rules` (to be created)

### 9. Admin & Platform
**Owns:** Feature flags, system configuration, GDPR/DSAR, billing models  
**Key models:** `FeatureFlag`, `Subscription`, `Invoice`, `DataSubjectRequest` (to be built)  
**Django app:** `apps/admin_platform` (to be created)

---

## Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Backend framework | Django + DRF | 6.x | Python 3.12 |
| API auth | simplejwt + django-allauth | latest | JWT + Google OAuth |
| Task queue | Celery + Redis | latest | Beat for scheduled tasks |
| Frontend | React + Vite + TypeScript | 19 / 8 / 5.7 | Not Next.js |
| State management | TanStack Query v5 | 5.x | Server state |
| Routing | React Router v7 | 7.x | Client-side |
| HTTP client | Axios | latest | JWT interceptors |
| i18n | i18next | latest | NL/EN/FA |
| AI responses | Anthropic API (Claude claude-sonnet-4-6) | latest | SSE streaming |
| Embeddings | OpenAI text-embedding-3-small | latest | 1536 dims |
| Vector store | ChromaDB (dev) / Supabase pgvector (prod) | 0.4+ | Single collection |
| Database | SQLite (dev) / PostgreSQL (prod) | 16 | pgvector extension in prod |
| File storage | Local filesystem (dev) / S3-compatible (prod) | — | GAP-I02: vendor not selected |
| Observability | Sentry (errors) + PostHog (analytics) + structured logging | — | OpenTelemetry target state |
| Deployment | Railway (current) | — | Docker/K8s target state |
| Email | Django SMTP backend | — | SMTP credentials in env |
| Push notifications | Web Push VAPID | — | `pywebpush` library |

---

## API Design Conventions

- All endpoints prefixed: `/api/`
- Authentication: Bearer JWT in `Authorization` header
- Response envelope for errors: `{"error": {"code": "...", "message": "...", "requestId": "..."}}`
- Pagination: `{"count": N, "next": url, "previous": url, "results": [...]}`
- Idempotency: sensitive mutation endpoints accept `Idempotency-Key` header
- Versioning: currently unversioned; `v1/` prefix to be added (see OpenAPI spec)
- SSE streaming: `Content-Type: text/event-stream` for chat endpoint
