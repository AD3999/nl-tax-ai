# TaxWijs — Master Product Requirements Document

> Version: 1.0 | Status: Active | Updated: 2026-06-13

---

## 1. Vision

TaxWijs is the AI Tax Operating System for Dutch taxpayers and accountants. It reduces the burden of Dutch tax compliance by combining a verified tax knowledge base, a deterministic calculator, AI-powered guidance, and a collaborative accountant-client workspace — in Dutch, English, and Persian.

---

## 2. Business Goals

| Goal | Metric | Target (12 months) |
|------|--------|-------------------|
| Grow ZZP user base | Registered ZZP users | 10,000 |
| Activate accountant channel | Accountants with ≥1 active engagement | 200 |
| Drive deduction discovery | Deduction checker completions | 50,000 |
| Demonstrate tax accuracy | Calculator error vs Belastingdienst | 0% on all 6 benchmark scenarios |
| Serve Persian-speaking community | FA-language sessions | 30% of total sessions |
| Achieve engagement quality | Engagements reaching ReadyToFile | 80% of started engagements |

---

## 3. Success Metrics

### North Star
**Engagements completed** (status = Filed or ReadyToFile) per month.

### Supporting Metrics
- Deduction checker completion rate (step 1 → results)
- Average readiness score at first accountant review
- Chat messages per session (depth of engagement)
- Cross-language session distribution (NL/EN/FA)
- Document processing success rate (uploaded → classified)
- Time from engagement creation to ReadyToFile

---

## 4. Scope

### In Scope (v1.0)
See [../01-discovery/scope-and-non-goals.md](../01-discovery/scope-and-non-goals.md) for the full list.

**Key features:**
- AI tax Q&A chat (Claude, SSE streaming, sourced, trilingual)
- Deterministic tax calculator (Box 1/2/3, all deductions, ZVW, credits)
- Deduction checker wizard (9 steps, ZZP-optimized)
- IB return guide (conversational AI, all 9 form fields)
- Tax simulation (income → full tax picture)
- Accountant portal (engagement workspace, 7 tabs, KPI dashboard)
- Client portal (tasks, documents, messages, readiness)
- Document upload + OCR + accountant review
- Checklist engine (persona-specific, idempotent)
- Readiness engine (0–100 score, mandatory gating)
- Invitation-based accountant-client connection
- Push notifications (VAPID) + email notifications
- GDPR account deletion + anonymization
- Multi-tenant firm management
- Tax calendar + ICS download
- ZZP workspace (quarterly VAT, P&L)

### Out of Scope (v1.0)
- Direct e-filing to Belastingdienst
- Bookkeeping / invoicing
- Corporate tax (VPB)
- Mobile native app (iOS/Android)
- Active billing paywalls
- WhatsApp/SMS notifications

---

## 5. Personas

Eight personas — see [../01-discovery/personas.md](../01-discovery/personas.md):
1. Arash — ZZP IT contractor (expat, Persian speaker)
2. Lisa — New ZZP designer (Dutch, starter year)
3. Maria — Employee expat (30% ruling holder)
4. Mehmet — Senior ZZP consultant (considering DGA)
5. Thomas — DGA director (BV owner)
6. Sara — Accountant (AA, 45 clients)
7. Pieter — Firm manager (12-accountant firm)
8. Admin — TaxWijs platform operator

---

## 6. Core Workflows

### 6.1 Taxpayer Self-Service

```
Register → Intake (profile) → Dashboard (tax estimate) →
Chat (Q&A / IB guide / simulation) → Deduction Checker →
Tax Calendar (deadlines) → IB Report
```

### 6.2 Accountant Onboarding Client

```
Register as accountant → Invite client → Client accepts →
Auto-create engagement → Generate checklist →
Send document requests → Client uploads →
OCR + extraction → Accountant reviews → Readiness 85+ →
ReadyToFile → Filed
```

### 6.3 AI Chat

```
User asks question → RAG retrieval (top 5 rules + cascade) →
Context assembled (≤1500 tokens) → Claude generates response (SSE stream) →
Response includes source_url citations →
If numbers: calculator was called first, AI explains result →
If PROFILE_UPDATE detected: save to intake_profile
```

---

## 7. State Machines

### 7.1 Engagement State Machine

```
DRAFT ──────────────────────────────────────►
  │                                          │
  ▼                                          │
COLLECTING ──(all mandatory docs present)───►│
  │                                          │
  ▼                                          │
REVIEW ──(accountant confirms all fields)───►│
  │                                          │
  ▼                                          │
READY_TO_FILE ──(readiness ≥85 + no gaps)   │
  │                                          │
  ▼                                          │
FILED ◄──────────────────────────────────────┘
  │
  ▼
ARCHIVED
```

Transitions:
- `DRAFT → COLLECTING`: engagement created + checklist generated
- `COLLECTING → REVIEW`: all mandatory checklist items have uploaded documents
- `REVIEW → READY_TO_FILE`: readiness score ≥85, no open review actions, no needs_review docs
- `READY_TO_FILE → FILED`: accountant or client manually marks as filed
- `FILED → ARCHIVED`: after 12 months or manual archive

### 7.2 Document State Machine

```
UPLOADED → PROCESSING → CLASSIFIED ────────► APPROVED
                    │                              │
                    └─► NEEDS_REVIEW ──────────────┘
                              │
                              └─► REJECTED ──► (client re-uploads)
```

Superseded: when a newer version of the same document is uploaded, the old one transitions to `SUPERSEDED`.

### 7.3 ChecklistItem State Machine

```
TODO → WAITING_CLIENT → UPLOADED → NEEDS_REVIEW → ACCEPTED
                                                      │
                                               WAIVED (accountant decision)
                                                      │
                                               REJECTED (re-upload required)
```

---

## 8. Non-Functional Requirements

See [non-functional-requirements.md](non-functional-requirements.md) for full spec.

**Summary:**
- API p95 latency: < 500ms
- Chat first-token latency: < 3 seconds
- Availability: 99.5% monthly
- GDPR: full compliance (deletion, DSAR, retention)
- Accessibility: WCAG 2.1 Level AA
- Internationalization: NL/EN/FA with RTL support for FA
- Security: OWASP ASVS Level 2

---

## 9. Analytics Hooks

Every significant user action must emit a PostHog event. Required events:

| Event | Trigger | Properties |
|-------|---------|-----------|
| `user_registered` | Successful registration | role, user_type, language |
| `intake_completed` | Intake wizard finish | user_type, has_income |
| `chat_message_sent` | User sends chat message | mode (normal/intake/ib/sim), language |
| `calculator_used` | Calculator submit | user_type, income_bracket |
| `deduction_checker_started` | First checker answer | user_type |
| `deduction_checker_completed` | Results shown | likely_count, user_type |
| `engagement_created` | New engagement | client_type, tax_year |
| `document_uploaded` | Document upload | doc_type, file_size_mb |
| `readiness_milestone` | Score crosses 25/50/75/85 | score, engagement_id |
| `ib_return_completed` | IB return guide finished | language |
| `accountant_invited_client` | Invitation sent | — |
| `invitation_accepted` | Client accepts | — |
| `gdpr_deletion_requested` | Account deletion | role |

---

## 10. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| AI produces wrong tax number | Medium | High | AI never computes — calculator only. Source citations. |
| Tax rule changes invalidate advice | Annual | High | Annual Phase 9 maintenance. Effective dates on all rules. |
| Legal classification as belastingadvies | Medium | High | Disclaimer on all AI responses. GAP-L06 under legal review. |
| Single cloud provider outage | Low | High | Railway + backups. Target K8s for failover. |
| OCR vendor misreads financial amounts | Medium | High | Human review required for all extractions before they're authoritative. |
| GDPR non-compliance | Low | Critical | DSAR workflow, deletion endpoint, data minimization. Legal review pending. |
| Persian translation errors | Low | Medium | Native speaker review for all FA content. |

---

## 11. Rollout Plan

### Phase 1 (current) — Core product, free, self-service
- All tax calculation and guidance features live
- Accountant portal live (multi-tenant)
- No billing paywalls

### Phase 2 — Accountant growth
- Marketplace listing (firm directory)
- Firm manager dashboard
- Enhanced rule management UI

### Phase 3 — Monetization
- Subscription tiers defined
- Stripe integration
- Accountant plan (per-seat or per-engagement pricing)

### Phase 4 — Annual maintenance (Phase 9)
- Tax year 2026 → 2027 rule update
- Admin UI for non-technical rule updates
- Historical year support (2024, 2025 lookup)
