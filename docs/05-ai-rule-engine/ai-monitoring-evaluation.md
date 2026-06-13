# AI Monitoring and Evaluation — TaxWijs

> Metrics, dashboards, evaluation pipeline, drift detection, incident thresholds, and cost monitoring for all AI components.

---

## 1. Quality Metrics

### 1.1 RAG Pipeline

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Precision@5 (12 Q&A ground truth) | ≥ 95% | `phase2/test_retrieval.py` nightly |
| Cross-lingual recall (NL→FA same top-3) | ≥ 72% | `phase2/test_retrieval.py` nightly |
| Metadata filter correctness | 100% | `phase2/test_retrieval.py` — user_type isolation |
| Expiry filter correctness | 100% | `phase2/test_retrieval.py` — SA-2026-001 date test |
| Token budget compliance (≤1,500 tokens) | 100% | `phase2/test_retrieval.py` |
| Context assembly latency P95 | < 500ms | OpenTelemetry trace |

### 1.2 Tax Calculator

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Scenario accuracy (6 seed scenarios) | 0.0% error | `phase3/test_scenarios.py` nightly |
| Calculator latency P95 | < 100ms | OpenTelemetry trace |
| Calculation error rate (live) | < 0.1% | Exception tracking |

### 1.3 Claude AI Responses

| Metric | Target | Measurement |
|--------|--------|------------|
| First token latency P50 | < 1s | SSE stream timing |
| First token latency P95 | < 2s | SSE stream timing |
| Full response latency P95 | < 8s | SSE stream timing |
| Mock mode fallback rate | < 0.1% (API key must be set in prod) | Error log |
| Response accuracy (monthly human eval) | ≥ 90% correct on ground truth | Tax SME review of 50 samples |

### 1.4 OCR Pipeline

| Metric | Target | Measurement |
|--------|--------|------------|
| Straight-through rate (confidence ≥ 0.90) | ≥ 60% | Pipeline_runs classification |
| Human review rate | ≤ 35% | Pipeline_runs classification |
| Manual-only rate | ≤ 5% | Pipeline_runs classification |
| OCR latency P95 | < 30s per page | pipeline_runs.duration_ms |
| Classification accuracy | ≥ 92% | Monthly calibration vs. accountant decisions |

---

## 2. Evaluation Pipeline

### 2.1 Nightly Automated Evaluation (CI)

```yaml
# .github/workflows/ci.yml — ai-eval job
- name: RAG quality gates
  run: python phase2/test_retrieval.py
  
- name: Calculator accuracy
  run: python phase3/test_scenarios.py

- name: OpenAPI contract validation
  run: npx @stoplight/spectral-cli lint docs/03-api/openapi.yaml
```

### 2.2 Monthly Human Evaluation

1. Sample 50 real AI responses from the past 30 days (anonymized)
2. Tax SME rates each response: Correct / Partially Correct / Incorrect
3. Flag all Incorrect responses for root cause analysis
4. Check: did the response cite the correct source_url?
5. Check: did the AI respect `expected_ai_behavior` (answer_directly vs answer_with_caveat)?
6. Results logged to `docs/05-ai-rule-engine/ai-monitoring-evaluation.md` monthly update section

### 2.3 Calibration Evaluation (Monthly)

1. Pull 200 most recently reviewed documents with accountant corrections
2. For each corrected field: was our confidence correct? (calibration)
3. Compute Expected Calibration Error (ECE) — target < 0.05
4. If ECE > 0.05: update extraction prompt or adjust confidence formula

---

## 3. Drift Detection

### 3.1 RAG Drift

```python
# Nightly alert condition:
if rag_precision_at_5 < 0.85:
    send_alert(
        severity="P1",
        title="RAG precision@5 dropped below 85%",
        action="Run phase2/build_index.py to re-index corpus"
    )
```

Causes of RAG drift:
- Phase 1 data updated but index not re-built
- Embedding model updated (dimension mismatch)
- ChromaDB index corruption

Fix: `python phase2/build_index.py` (re-embeds all ~113 chunks, ~2 minutes)

### 3.2 Calculator Drift

```python
# Nightly: any scenario failure = immediate P0
if any(scenario.error_pct > 0.01 for scenario in scenarios):
    send_alert(severity="P0", title="Calculator accuracy failure")
```

---

## 4. Incident Thresholds

| Condition | Severity | Response Time | Owner |
|-----------|----------|--------------|-------|
| Any phase3 scenario fails (>1% error) | P0 | 30 min | Engineer |
| RAG precision@5 < 80% | P0 | 30 min | Engineer |
| Calculator error rate in prod > 1% | P0 | 30 min | Engineer |
| RAG precision@5 80–85% | P1 | 4 hours | Engineer |
| Claude API down (no fallback to mock) | P1 | 1 hour | Engineer + Infra |
| OCR pipeline failure rate > 10% | P1 | 2 hours | Engineer |
| Classification accuracy < 85% | P2 | 1 week | AI team |
| Response latency P95 > 10s | P2 | 3 days | Engineer |

---

## 5. Prompt Version Tracking

Every change to an AI prompt creates a `prompt_versions` row:

```json
{
  "prompt_name": "system_prompt_zzp_result_mode",
  "version": 12,
  "content": "...",
  "author_id": "uuid",
  "deployed_at": "2026-06-01T00:00:00Z",
  "notes": "Added ZVW reminder to all ZZP prompts after missing it in 3 user sessions"
}
```

A/B testing is supported: run two prompt versions on 50%/50% of traffic, compare `response_accuracy` in monthly eval.

---

## 6. Cost Monitoring

| Component | Metric | Alert Threshold |
|-----------|--------|----------------|
| Claude API tokens/month | Track via usage API | Alert if > 2× prior month |
| Claude API cost/engagement | Cost per engagement | Alert if > €0.50/engagement |
| Embedding cost (if OpenAI) | Cost per index run | Informational |
| OCR cost/document | Cost per pipeline_run | Alert if > €0.10/document |
| Total AI infrastructure cost | Monthly total | Alert if > budget |

Cost data flows: Claude API usage → `usage_records` table → admin billing dashboard.

---

## 7. Failure Mode Catalog

| Failure | Detection | Fallback | Recovery |
|---------|-----------|----------|----------|
| `ANTHROPIC_API_KEY` not set | Startup check | Auto-enable mock mode | Set env var, restart |
| ChromaDB not initialized | `retrieve()` exception | Empty context; AI answers with caveat | Run `build_index.py` |
| Phase 1 JSON missing/corrupt | `data_loader.py` exception | Service unavailable | Restore from git |
| Calculator exception | `calculate()` exception | Return error to client; AI says "calculation unavailable" | Fix bug, redeploy |
| OCR vendor timeout | 30s timeout | Retry ×3; then create manual review task | Vendor health check |
| Claude API rate limit (429) | HTTP 429 response | Retry with exponential backoff (1s, 4s, 16s) | Monitor rate limit headers |
| Embedding model not cached | `SentenceTransformer` load error | Alert; download model | `python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-mpnet-base-v2')"` |
