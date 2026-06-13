# Coding Standards — TaxWijs

> These standards apply to all new code. Existing code that deviates should be updated during natural touchpoints, not in isolation.

---

## 1. Python (Backend)

### 1.1 Style

- **Formatter:** Black (line length 88)
- **Linter:** Ruff (replaces flake8 + isort)
- **Type hints:** Required on all public functions; optional on private helpers
- **Docstrings:** One-line only; only when the WHY is non-obvious

```python
# Good — explains non-obvious behavior
def _effective_status(doc_request, accepted_keys: set[str]) -> str:
    # req_ prefix means this DocumentRequest mirrors a ChecklistItem
    if doc_request.stable_key and doc_request.stable_key.startswith("req_"):
        if doc_request.stable_key[4:] in accepted_keys:
            return "accepted"
    return doc_request.status

# Bad — narrates what the code already says
def calculate_score(items):
    """Calculate score by summing items."""  # useless
    return sum(items)
```

### 1.2 Django Conventions

- **Models:** `class Meta: ordering` defined on every model
- **Migrations:** Never edit migrations after they've been run in staging/prod. Always create new migrations.
- **Views:** Class-based views (`APIView`, `GenericAPIView`) for REST endpoints
- **Serializers:** One serializer per model; split into `*ListSerializer` / `*DetailSerializer` when shape differs significantly
- **URLs:** `router.register()` for standard CRUD; explicit `path()` for custom actions
- **Constants:** Never hardcode status strings — use `TextChoices` or module-level constants

```python
class EngagementStatus(models.TextChoices):
    INTAKE = "intake", "Intake"
    DOCUMENTS_PENDING = "documents_pending", "Documents Pending"
    IN_REVIEW = "in_review", "In Review"
    READY = "ready", "Ready"
    FILED = "filed", "Filed"
    ARCHIVED = "archived", "Archived"
```

### 1.3 Security Rules

- All user input sanitized via DRF serializers before DB write
- Never construct raw SQL: use ORM or `django.db.models.functions`
- Row-level isolation: every queryset filtered by `firm_id` from `request.user`
- BSN never logged; always stored encrypted (`bsn_enc`)
- Secrets in `.env` only; never in `settings.py` or committed

---

## 2. TypeScript (Frontend)

### 2.1 Style

- **Strict mode:** `"strict": true` in `tsconfig.json`
- **Formatter:** Prettier (default config)
- **Linter:** ESLint + `@typescript-eslint`
- **No `any`:** Use `unknown` if type is genuinely unknown; use a proper type everywhere else

### 2.2 Component Conventions

- Functional components only (no class components)
- Props typed with inline `interface Props` or `type Props`
- Extract custom hooks for any logic that spans two or more components
- Co-locate component, its types, and its test in the same folder:
  ```
  src/components/ReadinessScore/
  ├── ReadinessScore.tsx
  ├── ReadinessScore.test.tsx
  └── index.ts
  ```

### 2.3 API Calls

All backend calls through `src/services/api.ts`. Never call `fetch` directly in a component.

```typescript
// Good
const engagement = await engagementService.get(id);

// Bad
const response = await fetch(`/api/portal/engagements/${id}/`);
```

---

## 3. Three-Language Parity

Every user-visible string must exist in all three languages:
- `NL` — Dutch (primary)
- `EN` — English
- `FA` — Persian / Farsi (RTL)

File encoding: **UTF-8** everywhere. No exceptions.

Translations live in:
- Backend: `django-rosetta` or JSON locale files in `apps/*/locale/`
- Frontend: `src/i18n/nl.json`, `src/i18n/en.json`, `src/i18n/fa.json`

Never hardcode a user-visible string in a component. Always use the translation function.

---

## 4. Testing Requirements

See [testing-strategy.md](testing-strategy.md). Summary:
- Backend: `pytest-django`, minimum 80% coverage on `apps/`
- Frontend: Vitest + Testing Library for component tests; Playwright for E2E
- Phase 1: `validate.py` must pass 100%
- Phase 2: `test_retrieval.py` — precision@5 ≥ 95%
- Phase 3: `test_scenarios.py` — 0.0% error on all 6 seed scenarios

---

## 5. AI-Specific Rules

1. **Calculator is the only source of numbers.** Never ask Claude to compute a tax amount.
2. **Only `verified` rules reach the user.** The `verification_status` filter must appear in every RAG query.
3. **Source URLs are mandatory.** Every factual claim in an AI response must be traceable to a `source_url`.
4. **Persian requires UTF-8.** All file I/O for text that may contain Persian must specify `encoding="utf-8"`.
5. **No hardcoded tax values.** Read from `phase1/data/seed/tax_rules_2026.json` always.
