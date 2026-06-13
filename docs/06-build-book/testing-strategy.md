# Testing Strategy — TaxWijs

> What we test, how we test it, and the quality gates that must pass before each release.

---

## 1. Test Pyramid

```
         /\
        /E2E\          Playwright — critical user flows (5–10 scenarios)
       /------\
      /  Integ  \      Django test client — API contract tests (per endpoint)
     /------------\
    /    Unit       \  pytest + Vitest — pure function tests (majority)
   /------------------\
  /   Data Validation   \  validate.py — Phase 1 data integrity (always 100%)
 /------------------------\
```

---

## 2. Backend Test Suite (pytest-django)

### 2.1 Structure

```
backend/
├── apps/
│   ├── accounts/tests/
│   │   ├── test_models.py
│   │   ├── test_views.py
│   │   └── test_auth.py
│   ├── portal/tests/
│   │   ├── test_models.py
│   │   ├── test_views.py
│   │   ├── test_readiness.py    ← readiness scoring logic
│   │   └── test_serializers.py
│   ├── documents/tests/
│   │   ├── test_pipeline.py
│   │   ├── test_extraction.py
│   │   └── test_views.py
│   └── ai/tests/
│       ├── test_retriever.py
│       ├── test_calculator.py
│       └── test_views.py
```

### 2.2 Running Tests

```bash
cd backend
pytest                               # all tests
pytest apps/portal/tests/ -v        # specific app
pytest -k "test_readiness" -v       # by name
pytest --cov=apps --cov-report=html # coverage
```

### 2.3 Coverage Requirement

Minimum 80% line coverage on `apps/`. CI fails below this threshold.

### 2.4 Test Data Factories

Use `factory_boy` for test data:
```python
class EngagementFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Engagement
    tax_year = 2026
    persona = "zzp"
    status = "intake"
```

Never use fixtures for complex relational data — factories compose better.

---

## 3. Phase-Specific Test Suites

### 3.1 Phase 1 — Knowledge Base Validation

```bash
cd phase1/scripts && python validate.py
```

Must pass 100%. Tests:
- JSON schema validation (all seed files)
- Calculation spot-checks (scenario totals within 0.1%)
- Rule ID format (`TOPIC-YEAR-SEQ`)
- Source URL reachability (optional, skipped in CI)
- Cross-reference integrity (Q&A `rule_ids` reference valid rule IDs)

### 3.2 Phase 2 — RAG Quality Gates

```bash
python phase2/test_retrieval.py
```

Gates (all must pass):
1. Precision@5 ≥ 95% on 12 Q&A pairs
2. Cross-lingual: FA query returns same top-3 as NL query
3. Metadata filter: `user_type=employee` never returns `zzp`-only rules
4. Expiry: SA-2026-001 not returned when `current_date=2027-01-01`
5. Token budget: assembled context ≤ 1,500 tokens

### 3.3 Phase 3 — Calculator Accuracy

```bash
python phase3/test_scenarios.py
```

All 6 seed scenarios must match expected totals with < 0.01% error:
- SCN-ZZP-001: €14,736 total tax
- SCN-ZZP-002: €1,359 total tax
- SCN-ZZP-003: €32,179 total tax
- SCN-EMP-001: €8,210 total tax
- SCN-EXP-001: €16,390 total tax
- SCN-DGA-001: €24,111 total tax

---

## 4. Frontend Tests (Vitest + Testing Library)

### 4.1 Component Tests

```bash
cd ui/new-ui
npm test           # run all
npm test -- --coverage
```

Coverage target: 70% on `src/components/`.

Test what a user sees and does, not implementation details:
```typescript
// Good
render(<ReadinessScore score={82} />)
expect(screen.getByText("82%")).toBeInTheDocument()
expect(screen.getByText("Klaar voor review")).toBeInTheDocument()

// Bad — testing implementation
expect(component.state.score).toBe(82)
```

### 4.2 Build Verification

```bash
npm run build   # must exit 0 with 0 TypeScript errors
```

This runs in CI on every PR.

---

## 5. E2E Tests (Playwright)

Located in `ui/new-ui/e2e/`. Run against local dev server.

| Scenario | File |
|----------|------|
| Accountant login + view engagement | `auth.spec.ts` |
| Upload document + check readiness score change | `document-upload.spec.ts` |
| AI chat — ZZP tax question (NL) | `ai-chat-nl.spec.ts` |
| AI chat — Persian question (FA) | `ai-chat-fa.spec.ts` |
| Checklist accept + readiness score | `checklist.spec.ts` |

Run locally:
```bash
npx playwright test
npx playwright test --headed  # with browser visible
```

---

## 6. CI Quality Gates

Every PR must pass (see `.github/workflows/ci.yml`):
- [ ] `pytest` — all backend tests pass
- [ ] Coverage ≥ 80% on `apps/`
- [ ] `python validate.py` — 100% pass
- [ ] `python phase2/test_retrieval.py` — all 5 gates pass
- [ ] `python phase3/test_scenarios.py` — 0.0% error
- [ ] `npm run build` — 0 TypeScript errors
- [ ] `npm test` — all frontend tests pass
- [ ] OpenAPI lint — no spec violations
