# SLOs and SLAs

> Service Level Objectives and Service Level Agreements for TaxWijs.
> Updated: 2026-06-13

---

## SLO Definitions

An **SLO** (Service Level Objective) is an internal target we commit to maintaining. An **SLA** (Service Level Agreement) is an external commitment to customers. We define SLOs first; SLAs are a subset of SLOs (stricter by one standard deviation to provide headroom).

**Error budget formula:**
```
error_budget = (1 - slo_target) × total_minutes_in_month
```
For 99.5% monthly: error budget = 0.5% × 43,800min = **219 minutes** (3.65 hours)

---

## Service SLOs

### API (overall)

| Metric | SLO Target | Error Budget (30 days) | Measurement |
|--------|-----------|----------------------|-------------|
| Availability | 99.5% | 219 minutes downtime | Uptime Robot + Railway health |
| p50 latency | < 100ms | — | OpenTelemetry histogram |
| p95 latency | < 500ms | — | OpenTelemetry histogram |
| p99 latency | < 2000ms | — | OpenTelemetry histogram |
| Error rate | < 1% of requests | — | Sentry + application logs |

**Excluded from availability:** Planned maintenance windows (Sundays 02:00–04:00 CET), announced ≥ 48h in advance.

### Chat Endpoint (`POST /api/chat/`)

| Metric | SLO Target | Error Budget |
|--------|-----------|-------------|
| Availability | 99.0% | 432 minutes |
| First token latency | < 3 seconds (p95) | — |
| Full response (p95) | < 15 seconds | — |
| Anthropic API errors | < 5% | — |

**Note:** Chat availability is lower because it depends on the Anthropic API (external). When Claude is unavailable, the endpoint returns a graceful error — not a hard outage.

### Document Upload

| Metric | SLO Target | Error Budget |
|--------|-----------|-------------|
| Upload acknowledgement | 99.5% | 219 minutes |
| Upload latency (ack) | < 5 seconds | — |
| OCR completion (p95) | < 60 seconds | — |
| OCR success rate | > 90% | — |

### Frontend (static assets)

| Metric | SLO Target | Error Budget |
|--------|-----------|-------------|
| Availability | 99.9% | 43.8 minutes |
| First Contentful Paint | < 2 seconds | — |
| Time to Interactive | < 3 seconds | — |

### Celery Workers

| Metric | SLO Target | Notes |
|--------|-----------|-------|
| Availability | 95.0% | Degraded mode OK (uploads queue) |
| OCR task processing | < 60 seconds p95 | Measured from queued to complete |
| Queue depth | < 100 tasks | Alert at 100, critical at 500 |

---

## SLA (External Commitments)

For accountant firm plans (Professional + Firm tier, future):

| Service | SLA Target | Compensation |
|---------|-----------|-------------|
| API availability | 99.0% monthly | Pro-rated credit |
| Chat availability | 98.0% monthly | Pro-rated credit |
| Document processing | 95.0% success | Pro-rated credit |

SLA excludes:
- Force majeure events
- Client-side issues (browser, network)
- Third-party service outages (Anthropic, OpenAI, Google)
- Planned maintenance windows (announced ≥ 48h)

---

## On-Call and Incident Response

### Severity Levels

| Severity | Definition | Response Time | Resolution Target |
|----------|-----------|--------------|-------------------|
| P1 Critical | Service unavailable or data loss risk | 15 minutes | 2 hours |
| P2 High | Major feature broken, >10% users affected | 30 minutes | 8 hours |
| P3 Medium | Minor feature broken, workaround exists | 4 hours | 3 business days |
| P4 Low | Cosmetic issue or improvement | Next sprint | Best effort |

### Alerting Thresholds (triggers incident)

| Condition | Severity |
|-----------|----------|
| API error rate > 5% for 5 minutes | P1 |
| `/api/health/` returns non-200 | P1 |
| Database unreachable | P1 |
| Chat endpoint > 30% error rate | P1 |
| Celery queue depth > 500 | P2 |
| OCR failure rate > 10% in 1 hour | P2 |
| API p95 latency > 2 seconds | P2 |
| Disk usage > 85% | P3 |

### Incident Communication

1. **Internal:** Slack #incidents channel, @ mention on-call engineer
2. **Status page:** status.taxwijs.nl (to be set up — currently: Betterstack / Statuspage)
3. **User communication:** In-app banner + email for P1 incidents affecting user data
4. **Post-mortem:** Required for all P1 incidents, published internally within 5 business days

---

## SLO Burn Rate Alerts

Using the standard multi-window burn rate approach:

| Window | Burn Rate | Action |
|--------|-----------|--------|
| 1h | 14× | Page immediately (P1) |
| 6h | 6× | Page (P2) |
| 3 days | 1× | Slack alert (P3 — review error budget) |

**Burn rate calculation:**
```
burn_rate = (actual_error_rate / error_budget_rate)
```

At 14× burn on a 99.5% SLO: consuming the monthly error budget in 30/14 ≈ 2 days.

---

## Measurement Infrastructure

**Current (partial):**
- Sentry: error rate measurement
- Railway metrics: uptime, memory, CPU
- PostHog: user-facing latency proxy (chat events)

**Target (OpenTelemetry stack):**
- OpenTelemetry Django auto-instrumentation → OTLP Collector
- Prometheus for metrics storage
- Grafana for dashboards and alerting rules
- Uptime Robot / BetterStack for external availability monitoring

**SLO review cadence:** Monthly review of SLO compliance. Adjust targets if consistently over- or under-meeting.
