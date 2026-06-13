# Environments — TaxWijs

> The four runtime environments, their URLs, data, and access policies.

---

## Environment Summary

| Env | Purpose | URL | Data | Access |
|-----|---------|-----|------|--------|
| **Local** | Development | localhost:8000 / :5173 | SQLite + local files | Developer only |
| **CI** | Test runner | GitHub Actions | Temp PostgreSQL | GitHub Actions only |
| **Staging** | Pre-production testing | staging.taxwijs.nl | Anonymized copy | Team + stakeholders |
| **Production** | Live product | app.taxwijs.nl | Real client data | Accountants + clients |

---

## 1. Local Development

```bash
# Required .env variables for local
DJANGO_DEBUG=True
DJANGO_SECRET_KEY=dev-secret-key-change-in-prod
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0
ANTHROPIC_API_KEY=sk-ant-...  # set for real AI; omit for mock mode
OPENAI_API_KEY=sk-...          # optional; falls back to local model

# Optional
CELERY_TASK_ALWAYS_EAGER=True  # run Celery tasks synchronously in dev
```

**ChromaDB:** persisted locally at `phase2/chroma_db/` (gitignored)

**Document storage:** local filesystem at `backend/media/documents/`

---

## 2. CI Environment

Spun up fresh for each PR:
- PostgreSQL via `docker-compose` or GitHub Actions service containers
- In-memory ChromaDB (rebuilt from `build_index.py` each run)
- No real API keys (mock mode for Claude; local embedding model)
- No real document storage (S3 mocked in tests)

---

## 3. Staging Environment

**Purpose:** Final pre-production testing with real pipelines.

**Data:** Anonymized copy of production schema + synthetic test data. No real client BSNs or documents.

**Deployment:** Auto-deployed on merge to `main`

**URL:** `staging.taxwijs.nl` / `staging-api.taxwijs.nl`

**Differences from production:**
- `DEBUG=False` but Sentry environment = "staging"
- Feature flags can be enabled/disabled freely
- Claude API: real key but rate limit alerts disabled
- Email delivery: intercepted by Mailhog (not real delivery)

---

## 4. Production Environment

**Platform:** Railway (backend + Celery) + Cloudflare Pages (frontend) + Supabase (PostgreSQL + pgvector)

**URL:** `app.taxwijs.nl` / `api.taxwijs.nl`

**Key settings:**
```
DJANGO_DEBUG=False
ALLOWED_HOSTS=api.taxwijs.nl
CORS_ALLOWED_ORIGINS=https://app.taxwijs.nl
DATABASE_URL=postgresql://... (Supabase connection string)
REDIS_URL=redis://... (Railway Redis)
ANTHROPIC_API_KEY=sk-ant-... (live key)
AWS_TEXTRACT_REGION=eu-west-1
S3_BUCKET=taxwijs-documents-prod
```

**Access control:**
- Production database: 2 accounts (app service account + DBA read-only)
- SSH / Railway CLI: restricted to senior engineers
- API admin: Django admin, 2FA required, IP allowlist
- Secrets: GitHub repository secrets + Railway environment variables

---

## 5. Environment Configuration Checklist

Before each production deployment:
- [ ] All secrets set in Railway environment
- [ ] Database migration applied (`manage.py migrate`)
- [ ] ChromaDB index built if phase1/ changed
- [ ] `ALLOWED_HOSTS` correct
- [ ] `DEBUG=False`
- [ ] Sentry DSN configured
- [ ] CORS settings include only production frontend URL
- [ ] Health check endpoint returns 200
