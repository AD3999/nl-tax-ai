# Execution Plan

> Phased delivery plan for TaxWijs from specification to production.
> Updated: 2026-06-13

---

## Overall Status

| Tier | Description | Status | Completion |
|------|-------------|--------|-----------|
| Tier 1 | Governance & Discovery | In Progress | 80% |
| Tier 2 | PRD & User Stories | In Progress | 5% |
| Tier 3 | Technical Architecture Docs | In Progress | 10% |
| Tier 4 | OpenAPI Specification | Pending | 0% |
| Tier 5 | Database Expansion | Pending | 30% |
| Tier 6 | Versioned Rule Engine | Pending | 0% |
| Tier 7 | CI/CD Infrastructure | Pending | 0% |
| Tier 8 | UX Documentation | Pending | 10% |
| Tier 9 | Missing Product Features | Pending | 40% |
| Tier 10 | Build Book | Pending | 0% |

---

## Specification Phases

### Phase S1 — Governance (current)

**Deliverables:**
- `/docs/00-governance/` — 6 files ✅
- `/docs/01-discovery/` — 7 files (in progress)
- Dutch tax rule source register with legal provenance

**Quality gate:** No placeholder sections. All gaps logged in gap register.

---

### Phase S2 — PRD and User Stories

**Deliverables:**
- `/docs/02-prd/product-prd-master.md`
- 9 module PRDs
- 250 user stories in structured format
- `backlog.csv` (importable to Jira/Linear/GitHub Projects)

**Quality gate:** Story count 200–300. All epics covered. Each story has acceptance criteria, events, and DoD note.

---

### Phase S3 — Technical Architecture

**Deliverables:**
- C4 diagrams (system context, container, component)
- Sequence diagrams (document ingestion, readiness recalculation)
- RBAC matrix
- Event catalog + AsyncAPI spec
- Security architecture
- Observability architecture
- Data retention and GDPR architecture

**Quality gate:** All Mermaid diagrams render. AsyncAPI validates.

---

### Phase S4 — API Specification

**Deliverables:**
- `api/openapi.yaml` — 100+ endpoints
- OpenAPI examples directory

**Quality gate:** OpenAPI validates with `swagger-cli` or `redocly lint`.

---

### Phase S5 — Database

**Deliverables:**
- ~25 new Django models (reaching 40–60 total)
- `schema/postgres/schema.sql` — canonical SQL
- `schema/postgres/indexes.sql`
- `schema/postgres/seed-reference-data.sql`

**Quality gate:** `python manage.py migrate` succeeds. Table count 40–60. All PII fields identified.

---

### Phase S6 — AI + Rule Engine

**Deliverables:**
- Versioned rule engine (DB-backed, replaces static JSON)
- Rule governance workflow (draft → review → published → deprecated)
- Confidence scoring implementation
- Human-in-loop formalization
- Phase 1 data migrated into rule engine

**Quality gate:** All 28 Phase 1 rules migrated. Existing calculator tests still pass.

---

### Phase S7 — CI/CD Infrastructure

**Deliverables:**
- `.github/workflows/ci.yml` — lint, type check, test
- `.github/workflows/security.yml` — dependency scan
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml` (manual approval)
- `/infra/terraform/` skeleton
- `/infra/k8s/` skeleton
- SLO/SLA document

**Quality gate:** CI workflow runs cleanly on push to branch.

---

### Phase S8 — UX Documentation

**Deliverables:**
- Information architecture
- Navigation map
- Screen inventory (20+ screens)
- Design system document
- SVG wireframes (12 primary screens)
- Accessibility spec

**Quality gate:** All major screens covered. Wireframes correspond to implemented pages.

---

### Phase S9 — Missing Product Features

**Deliverables:**
- Admin React console (`/admin-panel`)
- Feature flags system
- Webhook system
- Email notification system
- DSAR workflow
- Billing models (no active Stripe yet)
- Basic marketplace

**Quality gate:** `python manage.py migrate` succeeds. `npx tsc --noEmit` → 0 errors.

---

### Phase S10 — Build Book

**Deliverables:**
- `/docs/06-build-book/` — all 7 files
- project documentation updated
- `master-prompt-pack.md`

**Quality gate:** A new engineer can onboard from docs alone.

---

## Sprint Plan (suggested)

| Sprint | Focus | Duration |
|--------|-------|---------|
| Sprint 0 | Governance + Discovery + Architecture diagrams | 2 weeks |
| Sprint 1 | PRD + User stories + OpenAPI spec | 2 weeks |
| Sprint 2 | Database expansion + Rule engine | 2 weeks |
| Sprint 3 | CI/CD + Missing product features | 2 weeks |
| Sprint 4 | UX documentation + Build book | 1 week |
| Sprint 5 | Review, gaps, final QA | 1 week |

---

## Critical Path

```
Governance → PRD → Architecture → OpenAPI → DB Expansion → Rule Engine → CI/CD
                                                  ↓
                                         Missing Features
                                                  ↓
                                           Build Book
```

Governance and PRD must come first because they define the contracts that architecture and API spec implement.
