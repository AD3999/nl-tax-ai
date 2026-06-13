# Repository Structure — TaxWijs

> Every file and folder in this repository, what it is, and why it exists.

---

## Root Level

```
nl-tax-ai/
├── CLAUDE.md                    Project memory for Claude Code — read at session start
├── PROGRESS.md                  Phase completion log
├── .env.example                 Template for local environment variables
├── .gitignore                   Standard Python + Node + secrets ignores
├── README.md                    Project introduction (brief — details are in docs/)
│
├── backend/                     Django 6 REST API
├── ui/new-ui/                   React + Vite frontend
│
├── phase1/                      Knowledge base (structured tax data)
├── phase2/                      RAG pipeline (vector search)
├── phase3/                      Deterministic tax calculator
│
├── schema/postgres/             Canonical SQL schema (source of truth for DB)
├── docs/                        All documentation
├── api/                         Root-level OpenAPI spec (copy of docs/03-api/)
├── events/                      AsyncAPI spec for domain events
├── wireframes/                  SVG wireframes for UI views
│
├── .github/workflows/           CI/CD pipelines
└── .claude/                     Claude Code configuration (skills, hooks, rules)
```

---

## backend/

```
backend/
├── config/
│   ├── settings.py              Django settings (reads from .env via python-dotenv)
│   ├── urls.py                  Root URL conf
│   ├── wsgi.py                  WSGI for Gunicorn
│   └── asgi.py                  ASGI for SSE streaming
│
├── apps/
│   ├── accounts/                User auth, JWT, invitations, roles
│   │   ├── models.py            User, UserSession, Invitation, APIClient
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── permissions.py       Custom DRF permission classes
│   │   └── tests/
│   │
│   ├── portal/                  Core business: firms, clients, engagements
│   │   ├── models.py            Firm, Client, Engagement, ChecklistItem, etc.
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── services/
│   │   │   ├── readiness.py     Readiness score computation (4-component formula)
│   │   │   └── checklist.py     Checklist template instantiation
│   │   └── tests/
│   │
│   ├── documents/               Document upload, OCR, extraction, review
│   │   ├── models.py            Document, DocumentExtraction, ExtractedField, etc.
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── pipeline/
│   │   │   ├── ocr.py           AWS Textract integration
│   │   │   ├── classifier.py    Claude-based document classifier
│   │   │   ├── extractor.py     Claude-based field extractor
│   │   │   └── validator.py     Cross-document validation
│   │   └── tests/
│   │
│   └── ai/                      RAG, calculator, Claude chat
│       ├── views.py             ChatAPIView (SSE), CalculatorView
│       ├── urls.py
│       ├── calculator.py        Delegates to phase3/ calculator
│       ├── retriever.py         Delegates to phase2/ retriever
│       ├── chat.py              Builds system prompt + calls Claude API
│       └── tests/
│
├── requirements.txt
└── manage.py
```

---

## ui/new-ui/

```
ui/new-ui/
├── src/
│   ├── main.tsx                 Entry point
│   ├── App.tsx                  Root component + router
│   ├── components/              Reusable UI components
│   │   ├── ReadinessScore/      Circular score display
│   │   ├── DocumentUpload/      Drag-and-drop upload
│   │   ├── ChecklistPanel/      Checklist with status badges
│   │   ├── AIChat/              Streaming chat interface
│   │   └── LanguageSwitcher/    NL/EN/FA toggle
│   ├── pages/                   Route-level pages
│   │   ├── Dashboard.tsx
│   │   ├── EngagementWorkspace.tsx
│   │   ├── DocumentReview.tsx
│   │   └── AdminConsole.tsx
│   ├── hooks/                   Custom React hooks
│   │   ├── useSSE.ts            Server-Sent Events for AI streaming
│   │   ├── useEngagement.ts
│   │   └── useReadiness.ts
│   ├── services/                API client functions
│   │   └── api.ts               All fetch calls go through here
│   └── i18n/                    Translations
│       ├── nl.json
│       ├── en.json
│       └── fa.json
├── e2e/                         Playwright E2E tests
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## phase1/ — Knowledge Base

```
phase1/
├── data/
│   ├── schemas/                 JSON Schema definitions (4 schemas)
│   ├── seed/                    28 rules + 12 Q&A + 6 scenarios + 9 IB fields (hand-verified)
│   └── raw/                     Scraped web content (gitignored)
├── scrapers/                    Belastingdienst + forum scrapers
└── scripts/
    └── validate.py              Must pass 100% before any phase ships
```

---

## phase2/ — RAG Pipeline

```
phase2/
├── chunkers/                    rule_chunker, qa_chunker, scenario_chunker, etc.
├── embeddings/                  embed_openai.py + embed_local.py
├── store/                       schema.py (Chunk dataclass) + chroma_store.py
├── retriever.py                 retrieve(question, user_type, year) → RetrievedContext[]
├── assembler.py                 formats retrieved chunks → AI-ready context string
├── build_index.py               Entry point: load → chunk → embed → store
└── test_retrieval.py            5 quality gates (must pass before Phase 3)
```

---

## phase3/ — Tax Calculator

```
phase3/
├── calculator.py                Main: calculate(profile) → TaxResult
├── box1.py                      Box 1 income tax (brackets)
├── deductions.py                ZA, SA, MKB, KIA, LR
├── credits.py                   AHK, AK, IACK
├── zvw.py                       ZVW health contribution
├── box2.py                      Box 2 dividend tax
├── box3.py                      Box 3 wealth tax
├── toeslagen.py                 Zorgtoeslag, huurtoeslag
├── wet_dba.py                   Wet DBA risk scorer
├── data_loader.py               Reads values from phase1/ JSON (never hardcodes)
└── test_scenarios.py            6 scenarios must pass with 0.0% error
```
