# Observability Architecture

> Logging, tracing, metrics, alerting, and monitoring strategy for TaxWijs.
> Updated: 2026-06-13

---

## Observability Pillars

| Pillar | Tool (Current) | Tool (Target) | Purpose |
|--------|---------------|---------------|---------|
| Errors | Sentry | Sentry | Capture and alert on unhandled exceptions |
| Product Analytics | PostHog | PostHog | Funnel tracking, feature usage, conversion |
| Structured Logging | Django logging (JSON) | OpenTelemetry + Loki | Searchable, correlated log records |
| Distributed Tracing | None (current) | OpenTelemetry + Jaeger | Request traces across API → Celery → external services |
| Metrics | None (current) | Prometheus + Grafana | System and business metrics dashboards |
| Uptime Monitoring | None (current) | UptimeRobot / Better Uptime | External endpoint monitoring with alerting |

---

## Current Implementation

### Sentry (errors)

Configured in `backend/config/settings.py`:
- `SENTRY_DSN` from environment variable
- Captures: unhandled exceptions, Django errors, Celery task failures
- Release tracking: tied to git commit SHA
- Performance monitoring: enabled (p95 latency tracking)
- PII scrubbing: user email and profile data excluded from Sentry payloads

### PostHog (analytics)

Configured in `frontend/src/lib/analytics.ts`:
- Product events tracked:
  - `deduction_checker_started` — first answer in checker
  - `checker_step_completed` — each step with step_id
  - `deduction_checker_completed` — completion with deduction_count
  - `checker_results_viewed` — results with likely/needs_info counts
  - `checker_waitlist_submitted` — non-ZZP waitlist capture
- User identification: PostHog `identify()` on login with role
- Cookie consent: PostHog only loads after consent

### Structured Logging

Django logging configured in `settings.py`:
- Format: JSON (when `DJANGO_LOG_FORMAT=json` in env)
- Level: `INFO` in production, `DEBUG` in development
- Destinations: stdout (captured by Railway)
- Key log points:
  - All API authentication failures
  - Document upload + processing events
  - Celery task start/complete/failure
  - Push notification delivery results (success/failure)
  - GDPR operations (deletion, DSAR)

---

## Target OpenTelemetry Architecture

```
Django API ──────────────────► OTLP Collector
    │ (auto-instrumentation)         │
Celery Workers ──────────────►      │
    │                               ├──► Jaeger (traces)
External calls ──────────────►      ├──► Prometheus (metrics)
(Anthropic, OpenAI, SMTP)           └──► Loki (logs)
                                         │
                                    Grafana (dashboards)
                                         │
                                    PagerDuty / Slack (alerts)
```

**Implementation steps:**
1. Add `opentelemetry-sdk` + `opentelemetry-instrumentation-django` to requirements
2. Configure OTLP exporter pointing to collector
3. Auto-instrument Django, requests, SQLAlchemy
4. Add custom spans for: RAG pipeline, AI response streaming, OCR calls
5. Add business metrics: readiness score distribution, document processing latency, AI response latency

---

## Key Metrics to Track

### System Metrics
| Metric | Type | Alert Threshold |
|--------|------|----------------|
| API p95 latency | Histogram | > 500ms |
| API error rate | Rate | > 1% of requests |
| Chat streaming latency (first token) | Histogram | > 3s |
| Document OCR latency | Histogram | > 30s |
| Celery queue depth | Gauge | > 100 tasks |
| Database connection pool utilization | Gauge | > 80% |
| File storage usage | Gauge | > 80% capacity |

### Business Metrics
| Metric | Description | Dashboard |
|--------|-------------|-----------|
| Daily active users (DAU) | Unique users with at least 1 API call | PostHog |
| Deduction checker funnel | Steps 1–9 completion rates | PostHog |
| Chat engagement rate | % users who send >3 messages | PostHog |
| Engagement readiness distribution | Histogram of readiness scores | Grafana |
| Document processing success rate | % docs that reach "classified" status | Grafana |
| Accountant portal activation | % accountants who create ≥1 engagement | PostHog |
| Time to first engagement | From registration to first engagement created | PostHog |

### AI Quality Metrics
| Metric | Description | Frequency |
|--------|-------------|-----------|
| RAG retrieval precision@5 | % of queries where ground truth rules appear in top 5 | Daily test run |
| Cross-lingual retrieval accuracy | Same top-3 results for NL vs FA queries | Weekly |
| AI response source citation rate | % of AI responses that include a source_url | Weekly sample |
| Calculator accuracy | Engine output vs Belastingdienst ground truth | Per deploy |

---

## Alerting Rules

| Alert | Condition | Severity | Channel |
|-------|-----------|----------|---------|
| High error rate | > 5% API errors in 5 min | P1 Critical | PagerDuty |
| Chat endpoint down | /api/chat/ health check fails | P1 Critical | PagerDuty |
| Database connection failure | Django DB connection error | P1 Critical | PagerDuty |
| Celery queue overloaded | Queue depth > 500 for 10 min | P2 High | Slack |
| OCR task failure spike | > 10% OCR failures in 1 hour | P2 High | Slack |
| Sentry error volume | > 100 new errors in 1 hour | P2 High | Slack |
| Anthropic API errors | > 5% Claude API errors in 5 min | P2 High | Slack |
| Disk space low | File storage > 85% | P3 Medium | Email |

---

## SLO Targets

| Service | Availability SLO | Latency SLO |
|---------|-----------------|-------------|
| API (overall) | 99.5% monthly | p95 < 500ms |
| Chat streaming | 99.0% monthly | First token < 3s |
| Document upload | 99.5% monthly | < 5s to acknowledge |
| Document OCR | 95.0% monthly | < 60s end-to-end |
| Frontend (static) | 99.9% monthly | < 2s initial load |

See [../08-ops/slos-slas.md](../08-ops/slos-slas.md) for full SLO/SLA definitions.
