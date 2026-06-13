# Assumptions and Gap Register

> Every unknown, assumption, and open decision is tracked here.
> Items must be resolved before the component they affect ships to production.
> Updated: 2026-06-13

---

## Gap Types

| Type | Meaning |
|------|---------|
| UNSPECIFIED_SOURCE | An official or legal source has not been confirmed |
| UNSPECIFIED_PRODUCT_DECISION | A product or UX decision has not been made |
| UNSPECIFIED_LEGAL_INTERPRETATION | A legal/tax interpretation requires a qualified Dutch tax advisor |
| UNSPECIFIED_INFRA_DECISION | An infrastructure or vendor choice has not been finalized |
| ASSUMPTION | A decision was made without full information — documented for review |

---

## Open Gaps

### Infrastructure

| ID | Type | Description | Impact | Owner | Status |
|----|------|-------------|--------|-------|--------|
| GAP-I01 | UNSPECIFIED_INFRA_DECISION | Target cloud provider not locked (Railway vs AWS vs Azure) | Terraform/K8s modules cannot be finalized | Engineering | OPEN |
| GAP-I02 | UNSPECIFIED_INFRA_DECISION | Object storage vendor for documents not selected (S3, R2, GCS) | DocumentWorker storage adapter is abstract | Engineering | OPEN |
| GAP-I03 | UNSPECIFIED_INFRA_DECISION | OCR vendor not finalized — abstraction layer exists but no production vendor selected | Document intelligence accuracy unknown | Engineering | OPEN |
| GAP-I04 | UNSPECIFIED_INFRA_DECISION | Payment provider not selected (Stripe assumed but not confirmed) | Billing models are vendor-agnostic for now | Engineering/Product | OPEN |
| GAP-I05 | UNSPECIFIED_INFRA_DECISION | SSO/identity provider not selected — Django allauth used for now | Enterprise accountant firm SSO (SAML) not possible yet | Engineering | OPEN |
| GAP-I06 | UNSPECIFIED_INFRA_DECISION | CDN provider for frontend assets not selected | Performance tuning and edge caching not configured | Engineering | OPEN |

### Legal / Tax

| ID | Type | Description | Impact | Owner | Status |
|----|------|-------------|--------|-------|--------|
| GAP-L01 | UNSPECIFIED_LEGAL_INTERPRETATION | Home office deduction eligibility criteria not confirmed with a Dutch tax advisor — current rule says "not deductible for ZZP" but edge cases exist | Deduction scanner may produce wrong eligibility for some users | Legal/Tax SME | OPEN |
| GAP-L02 | UNSPECIFIED_LEGAL_INTERPRETATION | 30% ruling partial year eligibility calculation for mid-year arrivals not confirmed | Expat calculations may be off for partial-year residents | Legal/Tax SME | OPEN |
| GAP-L03 | UNSPECIFIED_LEGAL_INTERPRETATION | Wet DBA enforcement threshold — "65%+ single client = medium risk" is an interpretation, not a published Belastingdienst percentage | Risk scoring may over- or under-alert | Legal/Tax SME | OPEN |
| GAP-L04 | UNSPECIFIED_LEGAL_INTERPRETATION | Box 3 reform post-2025 — government announced a transition plan but final legislation for 2027+ is not yet enacted | Box 3 projections beyond 2026 cannot be made | Legal/Tax SME | OPEN |
| GAP-L05 | UNSPECIFIED_LEGAL_INTERPRETATION | GDPR data processor agreements for OCR vendors (AWS Textract / Google Document AI) — DPAs not yet reviewed | Cannot deploy OCR to production without reviewed DPA | Legal | OPEN |
| GAP-L06 | UNSPECIFIED_LEGAL_INTERPRETATION | Whether TaxWijs constitutes "belastingadvies" under Dutch law and requires BIG/RB registration | If yes, product scope and liability must change | Legal/Product | OPEN |

### Product Decisions

| ID | Type | Description | Impact | Owner | Status |
|----|------|-------------|--------|-------|--------|
| GAP-P01 | UNSPECIFIED_PRODUCT_DECISION | Marketplace design — what is a "listing"? Accountant firm profiles? Third-party tool integrations? | Marketplace module cannot be fully specced | Product | OPEN |
| GAP-P02 | UNSPECIFIED_PRODUCT_DECISION | Billing tiers — free vs paid features not defined. User requested no premium gates initially | Subscription model is spec'd but no pricing set | Product | OPEN |
| GAP-P03 | UNSPECIFIED_PRODUCT_DECISION | e-Filing integration — whether TaxWijs will connect directly to Belastingdienst API or only guide users | Phase 6 (IB Return Guide) scope depends on this | Product | OPEN |
| GAP-P04 | UNSPECIFIED_PRODUCT_DECISION | Accountant firm verification process — is_verified flag exists, but who verifies and how is undefined | Verified accountant badge cannot be shown | Product/Operations | OPEN |
| GAP-P05 | UNSPECIFIED_PRODUCT_DECISION | WhatsApp/SMS notification integration — Twilio dependency needs Meta Business account | Push + email only until resolved | Product/Operations | OPEN |

---

## Resolved Assumptions

| ID | Type | Assumption | Resolution | Date |
|----|------|-----------|------------|------|
| ASM-001 | ASSUMPTION | AI model for responses — assumed Claude (Anthropic API) over OpenAI GPT | Confirmed: Claude claude-sonnet-4-6 for responses, OpenAI text-embedding-3-small for embeddings | 2026-05-01 |
| ASM-002 | ASSUMPTION | Vector store — ChromaDB for dev, Supabase pgvector for production | Confirmed — architecture decision locked | 2026-05-01 |
| ASM-003 | ASSUMPTION | Frontend framework — React + Vite (not Next.js) | Confirmed — user explicitly chose React+Vite | 2026-05-01 |
| ASM-004 | ASSUMPTION | No premium gates initially | Confirmed — user requested all features free at launch | 2026-06-01 |
| ASM-005 | ASSUMPTION | ZVW rate 4.85% and ceiling €79,409 — corrected from earlier wrong values | Confirmed via Belastingdienst + Wfsv validation | 2026-06-03 |
| ASM-006 | ASSUMPTION | Box 1 bracket 2 rate 37.56% (AOW age only) | Confirmed via Belastingdienst 2026 tariff table | 2026-06-03 |
| ASM-007 | ASSUMPTION | Startersaftrek abolished from 2027 — 2026 is last year | Confirmed — effective_until 2026-12-31 in seed data | 2026-05-01 |
| ASM-008 | ASSUMPTION | Accommodation BTW moved from 9% to 21% in 2026 | Confirmed — BTW-2026-002 rule updated | 2026-05-01 |
| ASM-009 | ASSUMPTION | Huurtoeslag reformed in 2026 — no rent ceiling | Confirmed — HT-2026-001 rule reflects reform | 2026-05-01 |
| ASM-010 | ASSUMPTION | Wet DBA active enforcement since January 2025 | Confirmed — Belastingdienst enforcement announcement Jan 2025 | 2026-05-01 |
