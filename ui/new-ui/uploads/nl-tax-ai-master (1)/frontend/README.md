# TaxWijs Frontend

React 19 + TypeScript + Vite frontend for the NL Tax AI assistant.
Supports Dutch (NL), English (EN), and Persian (FA) — all three are first-class languages.

## Prerequisites

- Node.js 20 or later (`node --version`)
- npm 10 or later (`npm --version`)

No Python, no pip, no virtual environment needed for the frontend.

## Setup

```bash
# 1. Enter the frontend directory
cd frontend

# 2. Install all dependencies (reads package-lock.json for exact versions)
npm install

# 3. Copy environment file
cp .env.example .env
# For local dev, leave VITE_API_URL blank — the Vite proxy handles it.

# 4. Start the dev server
npm run dev
# Opens at http://localhost:5173
```

The dev server proxies all `/api/*` requests to the Django backend at `http://localhost:8000`.
The backend must be running for API calls to work (see `backend/README.md`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot module reload |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## Dependencies

All dependencies are declared in `package.json` and pinned in `package-lock.json`.
`npm install` installs the exact locked versions — no drift between machines.

Key packages:
- **React 19** + **React Router 7** — UI and routing
- **TanStack Query v5** — server state and mutations
- **Axios** — HTTP client with JWT interceptors
- **i18next** + **react-i18next** — NL/EN/FA translations (see `src/i18n/`)
- **Vite 8** + **TypeScript 6** — build tooling

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | API origin for production (e.g. `https://api.taxwijs.nl`). Leave blank for local dev. |

All `VITE_*` variables are inlined at build time by Vite.

## Project structure

```
frontend/src/
├── api/            # API client (axios) + typed request functions
├── components/     # Shared UI components
├── i18n/           # Translation files (nl.json, en.json, fa.json)
├── pages/          # Route-level page components
│   └── Phase2Demo  # RAG pipeline demo (route: /phase2)
└── App.tsx         # Router + layout
```

## Adding a new language string

1. Add the key to all three files: `src/i18n/locales/nl.json`, `en.json`, `fa.json`
2. Use it in a component: `const { t } = useTranslation(); t('your.key')`

Persian text must be meaningful — do not use machine translation without review.
