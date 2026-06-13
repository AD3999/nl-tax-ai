# TaxWijs — Documentation Index

> Navigation hub for all TaxWijs engineering artifacts.
> Last updated: 2026-06-13

---

## Governance

| File | Purpose |
|------|---------|
| [01-source-register.md](01-source-register.md) | All source inputs, their authority level, and status |
| [02-assumptions-gap-register.md](02-assumptions-gap-register.md) | Every unknown, assumption, and gap — tracked by type |
| [03-domain-glossary.md](03-domain-glossary.md) | Dutch tax and product domain terms defined in EN |
| [04-decision-log.md](04-decision-log.md) | Architecture and product decisions with rationale |
| [05-execution-plan.md](05-execution-plan.md) | Phased delivery plan with milestones and owners |
| [06-traceability-matrix.md](06-traceability-matrix.md) | PRD requirement → story → implementation → test |

---

## Discovery

| File | Purpose |
|------|---------|
| [../01-discovery/market-landscape.md](../01-discovery/market-landscape.md) | Competitive landscape, market sizing, positioning |
| [../01-discovery/personas.md](../01-discovery/personas.md) | Eight user personas with goals and pain points |
| [../01-discovery/jobs-to-be-done.md](../01-discovery/jobs-to-be-done.md) | Core jobs and outcomes per persona |
| [../01-discovery/user-journeys.md](../01-discovery/user-journeys.md) | End-to-end journeys for each primary persona |
| [../01-discovery/product-thesis.md](../01-discovery/product-thesis.md) | Why TaxWijs exists and what it uniquely does |
| [../01-discovery/scope-and-non-goals.md](../01-discovery/scope-and-non-goals.md) | In scope, out of scope, future scope |
| [../01-discovery/dutch-tax-rule-source-register.md](../01-discovery/dutch-tax-rule-source-register.md) | Legal provenance for every Dutch tax rule |

---

## PRD

| File | Purpose |
|------|---------|
| [../02-prd/product-prd-master.md](../02-prd/product-prd-master.md) | Master product requirements document |
| [../02-prd/engagement-workspace-prd.md](../02-prd/engagement-workspace-prd.md) | Engagement workspace module PRD |
| [../02-prd/client-portal-prd.md](../02-prd/client-portal-prd.md) | Client portal module PRD |
| [../02-prd/accountant-portal-prd.md](../02-prd/accountant-portal-prd.md) | Accountant portal module PRD |
| [../02-prd/readiness-engine-prd.md](../02-prd/readiness-engine-prd.md) | Readiness engine module PRD |
| [../02-prd/checklist-engine-prd.md](../02-prd/checklist-engine-prd.md) | Checklist engine module PRD |
| [../02-prd/document-center-prd.md](../02-prd/document-center-prd.md) | Document center module PRD |
| [../02-prd/deduction-scanner-prd.md](../02-prd/deduction-scanner-prd.md) | Deduction scanner module PRD |
| [../02-prd/rule-engine-prd.md](../02-prd/rule-engine-prd.md) | Rule engine module PRD |
| [../02-prd/admin-marketplace-billing-prd.md](../02-prd/admin-marketplace-billing-prd.md) | Admin, marketplace, and billing PRD |
| [../02-prd/non-functional-requirements.md](../02-prd/non-functional-requirements.md) | Performance, security, availability, scalability |
| [../02-prd/user-stories.md](../02-prd/user-stories.md) | All 250 user stories |
| [../02-prd/user-stories.csv](../02-prd/user-stories.csv) | Machine-importable story backlog |

---

## UX

| File | Purpose |
|------|---------|
| [../03-ux/information-architecture.md](../03-ux/information-architecture.md) | Site map and IA tree per role |
| [../03-ux/navigation-map.md](../03-ux/navigation-map.md) | Navigation structure and routing |
| [../03-ux/screen-inventory.md](../03-ux/screen-inventory.md) | All screens with variants and states |
| [../03-ux/design-system.md](../03-ux/design-system.md) | Tokens, typography, color, spacing, components |
| [../03-ux/content-design.md](../03-ux/content-design.md) | Content hierarchy and microcopy guide |
| [../03-ux/states-and-edge-cases.md](../03-ux/states-and-edge-cases.md) | Empty, loading, error, permission states |
| [../03-ux/accessibility-spec.md](../03-ux/accessibility-spec.md) | WCAG targets, keyboard nav, RTL/LTR |
| [../03-ux/component-library.md](../03-ux/component-library.md) | Component inventory and usage guide |
| [../03-ux/wireframes/](../03-ux/wireframes/) | SVG wireframes for all primary screens |
| [../03-ux/diagrams/](../03-ux/diagrams/) | UX flow and navigation Mermaid diagrams |

---

## Architecture

| File | Purpose |
|------|---------|
| [../04-architecture/architecture-overview.md](../04-architecture/architecture-overview.md) | System overview and design principles |
| [../04-architecture/bounded-contexts.md](../04-architecture/bounded-contexts.md) | Domain boundaries and service responsibilities |
| [../04-architecture/c4-system-context.mmd](../04-architecture/c4-system-context.mmd) | C4 level 1 — system context |
| [../04-architecture/c4-container.mmd](../04-architecture/c4-container.mmd) | C4 level 2 — containers |
| [../04-architecture/c4-component-core.mmd](../04-architecture/c4-component-core.mmd) | C4 level 3 — core API components |
| [../04-architecture/sequence-document-ingestion.mmd](../04-architecture/sequence-document-ingestion.mmd) | Document upload → OCR → review flow |
| [../04-architecture/sequence-readiness-recalc.mmd](../04-architecture/sequence-readiness-recalc.mmd) | Readiness score recalculation flow |
| [../04-architecture/security-architecture.md](../04-architecture/security-architecture.md) | Security controls, encryption, tenant isolation |
| [../04-architecture/observability-architecture.md](../04-architecture/observability-architecture.md) | Logging, tracing, metrics, alerting |
| [../04-architecture/rbac-matrix.md](../04-architecture/rbac-matrix.md) | Role × action × resource × scope |
| [../04-architecture/event-catalog.md](../04-architecture/event-catalog.md) | All system events with producer/consumer/schema |
| [../04-architecture/data-retention-and-gdpr.md](../04-architecture/data-retention-and-gdpr.md) | Retention classes, DSAR, deletion workflows |

---

## AI + Rule Engine

| File | Purpose |
|------|---------|
| [../05-ai-rule-engine/ai-architecture.md](../05-ai-rule-engine/ai-architecture.md) | AI system design and provider choices |
| [../05-ai-rule-engine/ocr-and-document-pipeline.md](../05-ai-rule-engine/ocr-and-document-pipeline.md) | Document ingestion pipeline spec |
| [../05-ai-rule-engine/confidence-scoring-spec.md](../05-ai-rule-engine/confidence-scoring-spec.md) | Confidence model for documents and fields |
| [../05-ai-rule-engine/human-in-loop-spec.md](../05-ai-rule-engine/human-in-loop-spec.md) | Cases requiring human review |
| [../05-ai-rule-engine/rag-architecture.md](../05-ai-rule-engine/rag-architecture.md) | RAG pipeline, chunking, retrieval, evaluation |
| [../05-ai-rule-engine/rule-engine-domain-model.md](../05-ai-rule-engine/rule-engine-domain-model.md) | Rule versioning, governance, approval workflow |
| [../05-ai-rule-engine/readiness-formula.md](../05-ai-rule-engine/readiness-formula.md) | Readiness score formula with dimensions and gating |
| [../05-ai-rule-engine/deduction-scanner-logic.md](../05-ai-rule-engine/deduction-scanner-logic.md) | Deduction opportunity detection logic |

---

## Build Book

| File | Purpose |
|------|---------|
| [../06-build-book/build-book.md](../06-build-book/build-book.md) | Engineering build book — all conventions |
| [../06-build-book/repository-structure.md](../06-build-book/repository-structure.md) | Monorepo layout and module ownership |
| [../06-build-book/coding-standards.md](../06-build-book/coding-standards.md) | Python, TypeScript, SQL standards |
| [../06-build-book/testing-strategy.md](../06-build-book/testing-strategy.md) | Testing pyramid and quality gates |
| [../06-build-book/definition-of-done.md](../06-build-book/definition-of-done.md) | DoD checklist per story type |
| [../06-build-book/release-management.md](../06-build-book/release-management.md) | Versioning, release process, hotfix policy |
| [../06-build-book/operational-runbooks.md](../06-build-book/operational-runbooks.md) | Incident response and operational procedures |

---

## Backlog

| File | Purpose |
|------|---------|
| [../07-backlog/epics-features-stories.md](../07-backlog/epics-features-stories.md) | Full epic and feature breakdown |
| [../07-backlog/sprint-plan.md](../07-backlog/sprint-plan.md) | Sprint-by-sprint delivery plan |
| [../07-backlog/backlog.csv](../07-backlog/backlog.csv) | Importable backlog (Jira/Linear/GitHub) |
| [../07-backlog/dependencies-map.md](../07-backlog/dependencies-map.md) | Cross-story and cross-epic dependencies |
| [../07-backlog/milestone-plan.md](../07-backlog/milestone-plan.md) | Major milestones and acceptance criteria |

---

## CI/CD + Ops

| File | Purpose |
|------|---------|
| [../08-ops/cicd-strategy.md](../08-ops/cicd-strategy.md) | CI/CD pipeline design and promotion rules |
| [../08-ops/environments.md](../08-ops/environments.md) | Dev, staging, production environment specs |
| [../08-ops/secrets-and-config.md](../08-ops/secrets-and-config.md) | Secret management and config strategy |
| [../08-ops/rollback-and-dr.md](../08-ops/rollback-and-dr.md) | Rollback procedures and disaster recovery |
| [../08-ops/slos-slas.md](../08-ops/slos-slas.md) | Service level objectives and agreements |

---

## API

| File | Purpose |
|------|---------|
| [../../api/openapi.yaml](../../api/openapi.yaml) | OpenAPI 3.1 spec — 100+ endpoints |
| [../../events/asyncapi.yaml](../../events/asyncapi.yaml) | AsyncAPI 2.6 spec — all system events |

---

## Schema

| File | Purpose |
|------|---------|
| [../../schema/postgres/schema.sql](../../schema/postgres/schema.sql) | Canonical PostgreSQL schema (40–60 tables) |
| [../../schema/postgres/indexes.sql](../../schema/postgres/indexes.sql) | Index definitions |
| [../../schema/postgres/seed-reference-data.sql](../../schema/postgres/seed-reference-data.sql) | Reference data seed |

---

## Counts (target)

| Artifact | Target | Status |
|----------|--------|--------|
| User stories | 250 | In progress |
| HTTP endpoints (OpenAPI) | 100+ | In progress |
| Database tables | 40–60 | In progress |
| Mermaid diagrams | 10+ | In progress |
| SVG wireframes | 12+ | In progress |
| Events (AsyncAPI) | 30+ | In progress |
