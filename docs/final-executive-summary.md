# Final Executive Summary — TaxWijs Artifact Set

> Generated: June 2026. This document summarises the complete engineering-grade artifact set produced for TaxWijs, per the master product prompt.

---

## Overall Scope

TaxWijs is an AI Tax Operating System for Dutch taxpayers and accountants. The artifact set covers the full product — from market discovery through to CI/CD pipelines and operational runbooks — and is designed to be directly executable by an engineering team.

---

## Total Counts

| Artifact type | Count |
|--------------|-------|
| User stories | 240 (16 epics × 15 stories) |
| HTTP API endpoints | 100+ (OpenAPI 3.1) |
| Database tables | 53 (PostgreSQL) |
| Domain events | 18 (AsyncAPI 2.6) |
| UI screens / wireframes | 8 SVG wireframes (desktop + mobile) |
| Tax rules (verified) | 28 rules, 2026 tax year |
| Q&A pairs | 12 ground-truth pairs (NL/EN/FA) |
| Tax scenarios | 6 end-to-end scenarios |
| Personas | 8 (Employee, ZZP, Expat, DGA, SMB Owner, Accountant, Firm Manager, Admin) |
| Epics | 16 |
| Sprints planned | 6 (12 weeks to MVP) |
| CI/CD workflows | 6 GitHub Actions |
| Bounded contexts | 6 |
| Document types classified | 18 |

---

## What Is Done

### Discovery (docs/01-discovery/)
- Market landscape comparing TaxWijs vs Taxfix, Tellow, Moneybird
- 8 personas with goals, frustrations, and success metrics
- Jobs-to-be-done mapped to product features
- User journeys for all primary flows
- Product thesis and scope/non-goals
- Dutch tax rule source register with provenance fields per rule

### Governance (docs/00-governance/)
- Source register, assumptions/gap register, domain glossary
- Decision log, execution plan, traceability matrix

### PRD (docs/02-prd/)
- Master PRD + 11 module PRDs (engagement workspace, client portal, accountant portal, readiness engine, checklist engine, document center, deduction scanner, rule engine, admin/marketplace/billing)
- 240 user stories with full acceptance criteria
- Non-functional requirements (performance, security, accessibility, GDPR)
- `user-stories.csv` for import into project management tools

### UX (docs/03-ux/)
- Information architecture, navigation map, screen inventory
- Design system tokens, component library (10 components with TypeScript interfaces)
- Content design (NL/EN/FA tone, terminology, numeric formatting)
- States and edge cases for all major components
- Figma-ready structure and naming conventions
- Accessibility spec (WCAG 2.1 AA)
- 8 SVG wireframes covering all primary workflows
- Navigation flow and UX flow Mermaid diagrams

### Technical Architecture (docs/04-architecture/)
- Architecture overview with bounded-context-first stance
- 6 bounded contexts: IAM, Firm/Client, Engagement Workspace, Document Processing, AI Rule Engine, Billing
- C4 diagrams (system context, container, component)
- Sequence diagrams (document ingestion, readiness recalculation)
- Security architecture (AES-256-GCM BSN encryption, TLS 1.3, OWASP controls)
- Observability architecture (OpenTelemetry traces, Grafana dashboards)
- GDPR/data retention architecture (7yr documents, 5yr audit, 2yr AI chat)
- RBAC matrix (5 roles × 23 permissions)
- Event catalog (18 domain events)
- API guidelines (versioning, error envelopes, idempotency, rate limits)

### Database (schema/postgres/)
- 53-table PostgreSQL schema covering all 6 bounded contexts
- Performance indexes including IVFFlat pgvector index (lists=16) for RAG
- Seed reference data (roles, permissions, checklist templates NL/EN/FA, retention policies)

### AI and Rule Engine (docs/05-ai-rule-engine/)
- AI architecture overview
- OCR and document pipeline (18 document type taxonomy)
- Document classification spec with confidence thresholds
- Field extraction and validation spec (JAAROPGAVE, BTW, BANKAFSCHRIFT, HYPOTHEEKJAAROPGAVE)
- Confidence scoring spec (composite formula, ECE calibration target <0.05)
- Human-in-loop spec (30-min review lock, optimistic locking, 5-reason override audit)
- RAG architecture (paraphrase-multilingual-mpnet-base-v2 / OpenAI, 5 quality gates)
- Rule engine domain model, versioning and governance
- Readiness formula (`score = doc×0.40 + checklist×0.30 + verification×0.20 + accountant×0.10`)
- Deduction scanner logic
- AI monitoring and evaluation (P0-P3 incident thresholds, drift detection)

### Build Book (docs/06-build-book/)
- Engineering build book with one-page architecture, repo layout, quick start
- Repository structure (monorepo with apps/, packages/, services/, infra/)
- Coding standards (Black/Ruff Python, strict TypeScript, UTF-8 Persian)
- Testing strategy (pytest 80%+ coverage, Vitest 70%, Playwright E2E)
- Definition of done (7 categories)
- Release management (feature branches, semantic versioning, monthly cadence)
- Operational runbooks (10 runbooks covering all P0-P2 scenarios)
- Master prompt pack (5 canonical Claude prompts)

### Sprint Backlog (docs/07-backlog/)
- 16 epics with representative stories
- 6-sprint plan (12 weeks to MVP)
- Milestone plan with launch criteria
- Dependencies map (Mermaid + table)
- Importable `backlog.csv`

### CI/CD and Ops (docs/08-ops/, .github/workflows/)
- 6 GitHub Actions workflows: CI, API contract check, DB validate, security, staging deploy, production deploy
- Environment strategy (local/CI/staging/production)
- Secrets and config management
- Rollback and disaster recovery (RTO <2h, RPO <1h)
- SLO/SLA definitions

### API and Events
- `api/openapi.yaml` — 100+ HTTP endpoints (OpenAPI 3.1)
- `api/openapi-examples/` — request/response examples for key endpoints
- `events/asyncapi.yaml` — 18 domain events (AsyncAPI 2.6)

### Infrastructure
- `infra/terraform/` — Terraform modules for Railway, Supabase, Cloudflare, S3
- `infra/k8s/` — Kubernetes base manifests and environment overlays

---

## Top Assumptions (review before sprint 1)

| # | Assumption | Risk | Owner |
|---|-----------|------|-------|
| A1 | Supabase pgvector used for production RAG (not ChromaDB) | HIGH — ChromaDB is dev-only; pgvector needed before Railway go-live | Engineering |
| A2 | OpenAI `text-embedding-3-small` used as primary embedding model | HIGH — RAG index must be rebuilt with OpenAI before production | Engineering |
| A3 | Railway used for backend hosting; Cloudflare Pages for frontend | Medium — infra can be swapped without product changes | Engineering |
| A4 | OCR vendor not locked — abstraction layer in document-worker | Medium — spike needed in Sprint 1 | Engineering |
| A5 | Wet DBA enforcement since Jan 2025 — 65%+ single client = medium risk | High — legal interpretation, not hard law | Tax SME |
| A6 | Startersaftrek (SA-2026-001) abolished after 2026 | HIGH — last year, must alert all eligible users now | Tax SME |
| A7 | ZVW bijdrage (4.85%) always included in ZZP tax estimates | HIGH — most commonly missed item | Tax SME |
| A8 | DGA gebruikelijk loon at €56,000 minimum for 2026 | Medium — confirm with Belastingdienst source | Tax SME |
| A9 | 30% ruling phase-down to 5 years applies from 2024 grant date | Medium | Legal |
| A10 | GDPR lawful basis for AI chat: legitimate interest | MEDIUM — legal should confirm vs consent | Legal/DPO |

---

## Legal and Tax Review Items

**Must be reviewed by Dutch tax SME before production:**
- All 28 rules in `phase1/data/seed/tax_rules_2026.json`
- Dutch tax rule source register (`docs/01-discovery/dutch-tax-rule-source-register.md`)
- Wet DBA risk scoring logic (`docs/05-ai-rule-engine/deduction-scanner-logic.md`)
- AI disclaimer copy (master-prompt-pack.md — all 5 prompts contain "I am not a tax advisor" language)

**Must be reviewed by DPO/legal before production:**
- Data retention periods (`docs/04-architecture/data-retention-and-gdpr.md`)
- DSAR workflow (30-day SLA, auto-deletion triggers)
- Third-party processor register (marked UNSPECIFIED — requires DPA agreements)
- BSN encryption approach (AES-256-GCM, key in Railway env vars)
- Consent records schema and lawful basis per processing activity

---

## Recommended Sprint 0 / Sprint 1 Scope

**Sprint 0 (before dev starts):**
1. Tax SME reviews and signs off on all 28 rules in `tax_rules_2026.json`
2. Legal reviews GDPR architecture and lawful basis register
3. Engineering decides OCR vendor (Textract vs Document AI) — update assumptions register
4. **Rebuild RAG index with OpenAI** (`python phase2/build_index.py --provider openai --reset`) — eliminates Railway 846MB model issue
5. Set up Supabase project and configure `SUPABASE_URL` + `SUPABASE_KEY` for production vector store
6. Engineering reviews 53-table schema and confirms Railway + Supabase topology

**Sprint 1 (first 2 weeks of build):**
- IAM epic: user registration, JWT auth, role assignment, firm creation
- Client onboarding: client profile, tax profile, tax year creation
- Engagement creation (Draft → Collecting state)
- Document upload with S3 presigned URLs
- Health check endpoint and CI pipeline green

---

## What Remains Risky

1. **RAG in production** — current index uses local 846MB model. Must switch to OpenAI before Railway deploy.
2. **OCR vendor** — no vendor selected. Document pipeline spec exists but vendor spike is outstanding.
3. **Rule source provenance** — 28 rules have Belastingdienst URLs but no formal legal sign-off.
4. **e-Filing integration** — IB return guide exists but actual DigiD/Belastingdienst API integration is out of scope for MVP.
5. **Marketplace** — PRD written but billing/Stripe integration and marketplace features are post-MVP.
6. **Persian RTL** — spec requires full FA parity; actual translation of UI copy requires native Persian speaker review.
