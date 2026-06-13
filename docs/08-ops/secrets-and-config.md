# Secrets and Configuration — TaxWijs

> How configuration is managed, where secrets live, how to rotate them, and what to do if one is exposed.

---

## 1. Configuration Sources (Priority Order)

1. **Environment variables** (highest priority — always wins over file)
2. **`.env` file** (local development only — gitignored)
3. **Django `settings.py` defaults** (lowest priority — safe defaults only)

Never hardcode secrets in `settings.py`. Never commit `.env`.

---

## 2. All Configuration Variables

### 2.1 Django Core

| Variable | Default (dev) | Required in Prod | Notes |
|----------|--------------|-----------------|-------|
| `DJANGO_SECRET_KEY` | dev-key | Yes | Rotate annually. 50+ random chars. |
| `DJANGO_DEBUG` | `True` | `False` | Never `True` in prod |
| `ALLOWED_HOSTS` | `*` | `api.taxwijs.nl` | Comma-separated |
| `DATABASE_URL` | `sqlite:///db.sqlite3` | PostgreSQL URL | Supabase connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Railway Redis URL | |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | `https://app.taxwijs.nl` | |

### 2.2 AI Providers

| Variable | Required | Notes |
|----------|----------|-------|
| `ANTHROPIC_API_KEY` | In prod | Claude chat + classification. Omit = mock mode activated |
| `OPENAI_API_KEY` | Optional | OpenAI embeddings. Omit = local multilingual model used |

### 2.3 Storage

| Variable | Required | Notes |
|----------|----------|-------|
| `AWS_ACCESS_KEY_ID` | In prod | S3 document storage |
| `AWS_SECRET_ACCESS_KEY` | In prod | |
| `AWS_S3_BUCKET_NAME` | In prod | `taxwijs-documents-{env}` |
| `AWS_TEXTRACT_REGION` | In prod | `eu-west-1` recommended for GDPR |
| `USE_LOCAL_STORAGE` | Dev only | `True` to use `media/` folder |

### 2.4 Email

| Variable | Required | Notes |
|----------|----------|-------|
| `EMAIL_BACKEND` | Dev: console | Prod: `django.core.mail.backends.smtp.EmailBackend` |
| `EMAIL_HOST` | | SMTP host (SendGrid: `smtp.sendgrid.net`) |
| `EMAIL_HOST_USER` | In prod | `apikey` for SendGrid |
| `EMAIL_HOST_PASSWORD` | In prod | SendGrid API key |
| `DEFAULT_FROM_EMAIL` | In prod | `noreply@taxwijs.nl` |

### 2.5 Monitoring

| Variable | Required | Notes |
|----------|----------|-------|
| `SENTRY_DSN` | In prod + staging | Error tracking |
| `APP_VERSION` | | Set at deploy time: `v1.2.3` |
| `ENVIRONMENT` | | `local` / `staging` / `production` |

### 2.6 External Services

| Variable | Required | Notes |
|----------|----------|-------|
| `SUPABASE_URL` | Prod pgvector | Supabase project URL |
| `SUPABASE_KEY` | Prod pgvector | Supabase anon key |
| `REDDIT_CLIENT_ID` | Phase 1 scraper only | Optional |
| `REDDIT_CLIENT_SECRET` | Phase 1 scraper only | Optional |

---

## 3. Secret Storage Locations

| Environment | Secret Storage |
|-------------|---------------|
| Local | `.env` file (gitignored) |
| CI | GitHub Actions repository secrets |
| Staging | Railway environment variables (staging service) |
| Production | Railway environment variables (production service) |

---

## 4. Secret Rotation

| Secret | Rotation Frequency | How |
|--------|---------------------|-----|
| `DJANGO_SECRET_KEY` | Annually | Generate new key; roll deploy; old sessions invalidated |
| `ANTHROPIC_API_KEY` | If exposed | Revoke in Anthropic console; generate new; update Railway |
| `AWS_ACCESS_KEY_ID` | Quarterly | Create new IAM key; update; delete old |
| `SUPABASE_KEY` | If exposed | Rotate in Supabase dashboard; update Railway |
| `EMAIL_HOST_PASSWORD` | If exposed | Rotate SendGrid API key |
| Database password | Annually | Supabase dashboard + update `DATABASE_URL` |

---

## 5. If a Secret Is Exposed

1. **Immediately revoke** the exposed secret at the provider (Anthropic console, AWS IAM, etc.)
2. **Generate a new secret** and deploy it to all environments
3. **Check audit logs** for unauthorized use of the exposed secret (provider dashboards)
4. **Create an incident** in `incidents` table
5. **Notify affected users** if data was accessed
6. **Post-mortem** within 48 hours: how did the secret get exposed? What process needs to change?

---

## 6. `.env.example` (Reference — never actual values)

```bash
# Django
DJANGO_SECRET_KEY=change-me-to-50-random-chars
DJANGO_DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0

# AI Providers
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-openai-key

# Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET_NAME=taxwijs-documents-local
AWS_TEXTRACT_REGION=eu-west-1
USE_LOCAL_STORAGE=True

# Email
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@taxwijs.nl

# Monitoring
SENTRY_DSN=
ENVIRONMENT=local
APP_VERSION=dev

# Supabase (production only)
SUPABASE_URL=
SUPABASE_KEY=
```
