# Non-Functional Requirements

> Performance, security, availability, scalability, accessibility, internationalization.
> Updated: 2026-06-13

---

## Performance

| Requirement | Target | Measurement Method |
|-------------|--------|-------------------|
| API p50 response time | < 100ms | OpenTelemetry histogram |
| API p95 response time | < 500ms | OpenTelemetry histogram |
| API p99 response time | < 2000ms | OpenTelemetry histogram |
| Chat first-token latency (SSE) | < 3 seconds | Frontend timing + PostHog |
| Chat full response latency (p95) | < 15 seconds | OpenTelemetry |
| Document upload acknowledgement | < 5 seconds | Frontend timing |
| Document OCR end-to-end | < 60 seconds | Celery task duration |
| Tax calculator response | < 200ms | API timing |
| Page initial load (FCP) | < 2 seconds | Lighthouse |
| Page interactive (TTI) | < 3 seconds | Lighthouse |
| RAG retrieval | < 500ms | phase2/retriever.py timing |
| Context assembly | < 100ms | assembler.py timing |

---

## Availability

| Service | Target | Error Budget (monthly) |
|---------|--------|----------------------|
| API (overall) | 99.5% | 3.65 hours downtime |
| Chat endpoint | 99.0% | 7.3 hours downtime |
| Document upload | 99.5% | 3.65 hours downtime |
| Frontend (static) | 99.9% | 43.8 minutes downtime |
| Celery workers | 95.0% | 36.5 hours downtime |

**Planned maintenance windows:** Sundays 02:00–04:00 CET (announced 48h in advance).

---

## Scalability

| Dimension | Current Capacity | Target Capacity | Scaling Strategy |
|-----------|-----------------|----------------|-----------------|
| Concurrent API users | ~100 (Railway free tier) | 10,000 | Horizontal scale, gunicorn workers |
| Database connections | SQLite (dev) / 100 (prod) | 1,000 | PgBouncer connection pooling |
| Document storage | Local FS | 1TB | S3-compatible object storage |
| Vector store | ChromaDB (local) | 1M chunks | Supabase pgvector |
| Celery workers | 1 worker | 10 workers | Container-based auto-scaling |
| Chat sessions | No explicit limit | 10,000 concurrent | Claude API handles; Redis for sessions |

---

## Security

Reference: [../04-architecture/security-architecture.md](../04-architecture/security-architecture.md)

| Requirement | Standard | Status |
|-------------|----------|--------|
| Authentication | JWT + OAuth2 PKCE | Partial (PKCE not yet implemented) |
| Authorization | RBAC + object-level | Implemented |
| Transport encryption | TLS 1.2+ | Implemented (Railway) |
| Input validation | DRF serializers + MIME whitelist | Implemented |
| XSS prevention | React JSX escaping | Implemented |
| SQL injection prevention | ORM parameterized queries | Implemented |
| GDPR compliance | Data deletion, DSAR, retention | Partially implemented |
| Rate limiting | Per-endpoint throttle | Not implemented (improvement needed) |
| Dependency scanning | CI security workflow | Not implemented (CI-2 pending) |
| OWASP ASVS Level 2 | Security audit | Partial |

---

## Accessibility

Standard: **WCAG 2.1 Level AA**

| Requirement | Target | Notes |
|-------------|--------|-------|
| Keyboard navigation | Full keyboard access to all features | All interactive elements |
| Screen reader | ARIA labels on all interactive elements | React components |
| Color contrast | ≥ 4.5:1 for normal text, ≥ 3:1 for large text | Validated in design system |
| Focus indicators | Visible focus ring on all focusable elements | CSS custom properties |
| Text resize | Content readable at 200% zoom | Responsive layout |
| Motion reduction | `prefers-reduced-motion` respected | CSS media queries |
| RTL layout | Full RTL support for Persian (FA) | `dir="rtl"` on FA content |
| Alt text | All images have meaningful alt text | Content policy |
| Error identification | All form errors have text labels | Not just color |
| Language declaration | `lang` attribute on HTML element, updated on language switch | i18next |

---

## Internationalization (i18n)

| Requirement | Implementation |
|-------------|---------------|
| Languages | NL (primary), EN (full parity), FA (full parity) |
| Text direction | LTR for NL/EN, RTL for FA (`dir="rtl"` CSS) |
| Date format | NL: DD-MM-YYYY, EN: DD/MM/YYYY, FA: Persian calendar display |
| Number format | NL: comma decimal (€1.200,50), EN: period decimal (€1,200.50) |
| Currency | Euro (€) — no multi-currency |
| Translation management | i18next with JSON locale files (`nl.json`, `en.json`, `fa.json`) |
| Missing key fallback | Falls back to EN if NL/FA key missing |
| Tax term translation | Dutch terms kept in all languages on first use, defined in glossary |
| Persian text quality | Native speaker review required before any FA content ships |

---

## Data Retention

| Data Type | Retention Period | Legal Basis |
|-----------|-----------------|-------------|
| User account data | Until deletion + 30 days | Contract |
| Tax documents (uploaded) | Tax year + 7 years | Dutch financial record law (Boekhouding) |
| Chat messages | 12 months | Legitimate interest |
| Audit logs | 7 years | Legal obligation |
| Push subscriptions | Until expired or unsubscribed | Consent |
| Analytics events (PostHog) | 24 months | Legitimate interest |
| Error logs (Sentry) | 90 days | Legitimate interest |
| Billing records | 7 years | Tax/financial obligation |

---

## Reliability

| Requirement | Implementation |
|-------------|---------------|
| Database backups | Daily automated backup with 30-day retention |
| File storage backups | Daily backup of document storage |
| Rollback capability | Deployments are reversible within 1 hour |
| Graceful degradation | Chat falls back to no-RAG mode if ChromaDB unavailable |
| Circuit breaker | Anthropic API timeout: 30s, fallback: error message to user |
| Idempotency | Sensitive mutations use `Idempotency-Key` header and `stable_key` pattern |

---

## Compliance

| Regulation | Requirement | Status |
|-----------|-------------|--------|
| GDPR (AVG) | Deletion, DSAR, retention, consent | Partially implemented |
| Wet IB 2001 | Tax calculation accuracy | All 6 scenarios validated vs Belastingdienst |
| Wet DBA | Disclaimer on WD risk assessment | Implemented |
| Wet OB 1968 (BTW) | Correct VAT rates and deadlines | Implemented |
| WCAG 2.1 AA | Accessibility | Partially implemented |
| NEN-ISO/IEC 27001 | Information security management | Target state (not certified) |
