# Developer Guide

> How to set up, run, test, and deploy TaxWijs.
> Updated: 2026-06-13

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.12+ | `pyenv install 3.12` |
| Node.js | 20+ | `nvm install 20` |
| Git | 2.40+ | System package |
| Docker Desktop | 4.25+ | docker.com (for Postgres + Redis locally) |

API keys needed (development):
- `OPENAI_API_KEY` — for embeddings
- `ANTHROPIC_API_KEY` — for AI responses

---

## Repository Layout

```
nl-tax-ai/
├── .github/workflows/       ← CI/CD pipelines
├── backend/                 ← Django 6 API
│   ├── apps/
│   │   ├── core/            ← shared models, middleware, utils
│   │   ├── users/           ← User, IntakeProfile, TaxMemory, GDPR
│   │   ├── chat/            ← AI chat, SSE streaming
│   │   ├── calculator/      ← Deterministic tax calculator
│   │   ├── checker/         ← Deduction checker
│   │   ├── portal/          ← Engagements, docs, checklist, messages
│   │   ├── rules/           ← Rule engine (TaxRule CRUD + versioning)
│   │   ├── notifications/   ← Push notifications, email
│   │   └── billing/         ← Subscription + usage (stub)
│   ├── config/              ← Django settings, URLs, WSGI
│   ├── tests/               ← All backend tests
│   └── manage.py
├── frontend/                ← React + Vite SPA
│   ├── src/
│   │   ├── components/      ← Shared UI components
│   │   ├── pages/           ← Route-level pages
│   │   │   ├── portal/      ← Client portal pages
│   │   │   ├── accountant/  ← Accountant portal pages
│   │   │   └── admin/       ← Admin console pages
│   │   ├── lib/             ← API client, auth context, analytics
│   │   ├── hooks/           ← Custom React hooks
│   │   └── i18n/            ← nl.json, en.json, fa.json locale files
│   └── package.json
├── phase1/                  ← Knowledge base (Phase 1)
│   ├── data/schemas/        ← JSON schemas
│   ├── data/seed/           ← 28 rules, 12 Q&A, 6 scenarios
│   └── scripts/validate.py  ← Validation (run after every data change)
├── phase2/                  ← RAG pipeline (Phase 2)
│   ├── chunkers/            ← Rule/QA/scenario → Chunk converters
│   ├── embeddings/          ← OpenAI + local embedder
│   ├── store/               ← ChromaDB + Supabase vector stores
│   ├── retriever.py         ← retrieve(question, user_type, year)
│   ├── assembler.py         ← Formats retrieved chunks for AI
│   └── build_index.py       ← Entry point: build vector index
├── docs/                    ← All project documentation
│   ├── 00-governance/
│   ├── 01-discovery/
│   ├── 02-prd/
│   ├── 03-api/
│   ├── 04-architecture/
│   ├── 05-ux/
│   ├── 06-build-book/
│   ├── 07-testing/
│   └── 08-ops/
├── infra/
│   ├── terraform/           ← Infrastructure as Code (skeleton)
│   └── k8s/                 ← Kubernetes manifests (skeleton)
└── PROGRESS.md              ← Session-by-session progress log
```

---

## Local Development Setup

### 1. Clone and configure environment

```bash
git clone git@github.com:your-org/nl-tax-ai.git
cd nl-tax-ai
cp .env.example .env
# Edit .env and add your API keys
```

### 2. Start infrastructure (Postgres + Redis)

```bash
docker compose up -d postgres redis
```

Or if not using Docker, install Postgres 15 and Redis 7 locally and update `.env` accordingly.

### 3. Set up Python environment

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt -r backend/requirements-dev.txt
```

### 4. Run Django setup

```bash
python backend/manage.py migrate
python backend/manage.py createsuperuser
python backend/manage.py import_phase1_rules --year 2026
```

### 5. Start Celery worker

```bash
celery -A config.celery worker -l info
```

### 6. Start Django development server

```bash
python backend/manage.py runserver 8000
```

### 7. Set up frontend

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

Frontend runs at: http://localhost:5173  
API runs at: http://localhost:8000  

### 8. Build Phase 2 RAG index (optional — for chat)

```bash
python phase2/build_index.py
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# Django
DJANGO_SECRET_KEY=your-secret-key
DJANGO_ENV=development
DATABASE_URL=postgresql://taxwijs:password@localhost:5432/taxwijs_dev
REDIS_URL=redis://localhost:6379

# AI
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Auth
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Notifications
VAPID_PRIVATE_KEY=...
VAPID_PUBLIC_KEY=...
VAPID_CLAIMS_EMAIL=admin@taxwijs.nl

# Email (dev: use mailtrap or console backend)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_HOST_USER=your-mailtrap-user
EMAIL_HOST_PASSWORD=your-mailtrap-password
EMAIL_USE_TLS=true

# Analytics (optional in dev)
VITE_POSTHOG_KEY=phc_...
SENTRY_DSN=https://...@sentry.io/...

# Optional: Supabase (for production vector store)
SUPABASE_URL=https://...supabase.co
SUPABASE_KEY=eyJ...
```

---

## Running Tests

### Backend tests

```bash
pytest backend/ -q
pytest backend/ -k "test_calculator" -v  # Run specific tests
pytest backend/ --cov=backend --cov-report=html  # With coverage
```

### Phase 1 validation

```bash
python phase1/scripts/validate.py
```

Always run this after changing anything in `phase1/data/seed/`.

### Phase 2 RAG accuracy

```bash
python phase2/test_retrieval.py
```

Requires `OPENAI_API_KEY` and a built index.

### Frontend tests

```bash
npm test --prefix frontend
npm run test:e2e --prefix frontend  # Playwright E2E (requires running backend)
```

### Calculator scenarios (accuracy regression)

```bash
pytest backend/tests/test_calculator_scenarios.py -v
```

This test suite runs all 6 benchmark scenarios and asserts results match the known ground truth with <1% error. This MUST pass before any calculator code change is merged.

---

## Code Standards

### Python

- Formatter: `black` (line-length 100)
- Linter: `ruff`
- Type checking: `mypy`
- Docstrings: only for public APIs and complex algorithms — not for obvious code
- Tests: `pytest` with `pytest-django`

### TypeScript / React

- Formatter: Prettier
- Linter: ESLint with `@typescript-eslint`
- React: functional components + hooks only (no class components)
- State: Zustand for global, `useState` for local
- Data fetching: `@tanstack/react-query`
- Routing: React Router v6

### Git

- Branch naming: `feat/description`, `fix/description`, `docs/description`
- Commit format: `type(scope): short description` (conventional commits)
- PR: all PRs go to `master`. No merge commits — rebase + squash.
- PR title: same as first commit message
- Required before merge: CI passes, 1 reviewer approval

---

## Architectural Rules (Enforced in CI)

1. **AI never computes numbers** — No tax rate literals in any file outside `backend/apps/rules/` or `phase1/data/`
2. **Only verified records served** — `verification_status=verified` filter must appear in every rule query
3. **Source URLs always present** — Every AI response must cite source_url (enforced by assembler.py)
4. **Persian text is UTF-8** — All file I/O for data files uses `encoding="utf-8"`
5. **Calculator tested against scenarios** — All 6 scenarios in CI; failing scenarios block merge

---

## Useful Management Commands

```bash
# Import Phase 1 rules into database
python backend/manage.py import_phase1_rules --year 2026

# Generate checklists for an engagement
python backend/manage.py generate_checklist --engagement-id {uuid}

# Rebuild RAG index
python backend/manage.py rebuild_rag_index --year 2026

# Purge old chat messages (GDPR)
python backend/manage.py purge_old_conversations --days 365

# Export user data (DSAR)
python backend/manage.py export_user_data --user-id {uuid}

# Check Phase 1 validation
python phase1/scripts/validate.py

# Check for expiring rules (within 90 days)
python backend/manage.py check_expiring_rules
```

---

## Common Issues

**Issue:** Django startup error `No module named 'config'`
**Fix:** Run from the `backend/` directory or set `PYTHONPATH=backend/` in your env

**Issue:** ChromaDB error on build_index.py
**Fix:** Delete `phase2/chroma_db/` and re-run `build_index.py`

**Issue:** VAPID key format error on push subscription
**Fix:** Regenerate with `py-vapid` and update `.env`

**Issue:** Persian characters display as mojibake
**Fix:** Ensure `encoding="utf-8"` in all file open() calls and check your terminal LANG setting
