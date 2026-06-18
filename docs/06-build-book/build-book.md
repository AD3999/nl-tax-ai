# Build Book — TaxWijs

> The definitive guide to building, deploying, and operating TaxWijs. Read this before writing any code.

---

## 1. Project Overview

TaxWijs is an AI-powered Dutch tax operations platform for accounting firms serving ZZP (freelance) workers, employees, expats, and DGA directors in the Netherlands. It supports Dutch, English, and Persian (first-class, not a translation).

**Primary value proposition:** An accountant handles 3× more clients because TaxWijs automates document intake, classification, extraction, readiness scoring, and tax question answering. The accountant focuses on judgment calls; the platform handles logistics.

---

## 2. Architecture in One Page

```
Client Browser → Cloudflare → Nginx → React+Vite (static)
                           → Gunicorn → Django 6 REST API
                                      → PostgreSQL (Supabase in prod)
                                      → Redis (cache + Celery queue)
                                      → ChromaDB (RAG vector store, dev)
                                      → Anthropic Claude API (AI responses)
                                      → AWS Textract (OCR)
                                      → S3 (document storage)
```

**Never violate:** AI computes nothing. The deterministic Phase 3 calculator produces all numbers. Claude reads results and explains them.

---

## 3. Repository Layout

```
nl-tax-ai/
├── backend/          Django 6 application
│   ├── config/       settings, urls, wsgi, asgi
│   ├── apps/
│   │   ├── accounts/ User model, JWT auth, invitations
│   │   ├── portal/   Firms, clients, engagements, readiness, checklists
│   │   ├── documents/Document upload, OCR pipeline, extraction, review
│   │   └── ai/       RAG, calculator, Claude chat API
│   └── manage.py
├── ui/new-ui/        React+Vite frontend
│   ├── src/
│   │   ├── components/   Shared UI components
│   │   ├── pages/        Route-level page components
│   │   ├── hooks/        Custom React hooks
│   │   ├── services/     API client functions
│   │   └── i18n/         NL/EN/FA translations
│   └── package.json
├── phase1/           Knowledge base: schemas, seed data, scrapers
├── phase2/           RAG pipeline: chunkers, embedder, retriever
├── phase3/           Tax calculator engine
├── schema/postgres/  Canonical DB schema (schema.sql, indexes.sql, seed)
├── docs/             All documentation (this folder)
├── events/           AsyncAPI spec for domain events
├── api/              OpenAPI spec (root copy) + examples
├── wireframes/       SVG wireframes for all key views
├── .github/          CI/CD workflows
└── .github/          CI/CD workflows
```

---

## 4. Phase Completion Checklist

Before any phase is considered done:
- [ ] All tests pass (`pytest` / `npm test`)
- [ ] `phase1/scripts/validate.py` passes 100%
- [ ] No TypeScript errors (`npm run build` exits 0)
- [ ] PROGRESS.md updated with phase entry
- [ ] Code committed and pushed to GitHub

---

## 5. Quick Start

See [developer-guide.md](developer-guide.md) for full setup. Short version:

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (separate terminal)
cd ui/new-ui
npm install
npm run dev
```

Local URLs:
- Frontend: http://localhost:5173
- API: http://localhost:8000/api/
- Django admin: http://localhost:8000/admin/
