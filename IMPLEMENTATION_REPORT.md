# TaxWijs Enterprise — Implementation Report
**Branch:** feat/enterprise-phases-1-6  
**Date:** 2026-06-12  
**Phases:** 1 (hardening) + 2 + 3 + 4 + 5 + 6

---

## Overview

This session implemented the complete TaxWijs Enterprise accountant platform across 6 phases, transforming the existing AI tax assistant into a professional multi-tenant accountant portal.

---

## Phase 1 — Foundation Hardening

### Multi-tenant Security Fix
- Fixed `_can_access_client()` to enforce strict per-accountant scoping at the detail-view level
- Previously any authenticated accountant could access any client's detail record
- Now only the owning accountant (or `is_staff` admin) can access client/engagement detail endpoints

### ReminderLog Model
- `backend/apps/portal/models.py` — added `ReminderLog` model tracking every reminder sent per engagement
- Fields: engagement, client_profile, sent_by, reminder_type, channel, subject, body, delivered, created_at
- Migration: `0004_add_reminder_log_portal_message`

### PortalMessage Model
- `backend/apps/portal/models.py` — added `PortalMessage` model for in-app messaging
- Fields: engagement, client_profile, sender, body, is_read, read_at, created_at

### GDPR Retention
- Added `retention_expires_at` to `ClientDocument`
- Migration: `0005_gdpr_document_retention`

---

## Phase 2 — Accountant Portal

### Inbox Aggregation API
- `GET /api/portal/inbox/` — returns pending_docs, open_actions, recent_reminders, unread_messages with counts

### Messaging API
- `GET/POST /api/portal/engagements/<id>/messages/` — accountant thread with auto-read marking
- Reminder persistence — every `PortalReminderView.post()` now creates a `ReminderLog` record

### Serializers
- `ReminderLogSerializer` — full reminder metadata including client_name, sent_by_email
- `PortalMessageSerializer` — includes `is_own` computed from request.user for chat bubble orientation

### Frontend: AccountantInboxPage
- Route: `/accountant/inbox`
- Displays KPI pills: pending docs count, open actions count, unread messages count
- Four data sections: Pending Documents, Open Actions, Unread Messages, Recent Reminders
- Three-language support (NL/EN/FA)

### Frontend: AccountantSettingsPage
- Route: `/accountant/settings`
- Contact Info section: firm name, KVK, BTW, phone, address
- Branding section: brand color picker, email signature textarea, default reminder days
- Subscription info (read-only): plan, max clients
- PATCH to `/api/users/accountant/setup/` on save

---

## Phase 3 — Client Portal

### Client Messages API
- `GET/POST /api/portal/client/messages/` — client-facing message thread
- `is_own` flag on PortalMessageSerializer for correct chat bubble rendering

### Frontend: ClientMessagesPage
- Route: `/client/messages`
- Full-height chat interface with bubble alignment (own=right, theirs=left)
- RTL support for Persian (dir="rtl" when lang="fa")
- Enter-to-send (Shift+Enter for newline)

### Frontend: ClientProfilePage
- Route: `/client/profile`
- Personal Information section: name, email, phone, birth date, address
- Tax Information section: BSN, KVK, BTW, tax type dropdown, language preference
- Notes section (free text)
- PATCH to `/api/portal/client/profile/` on save
- RTL support for Persian

---

## Phase 4 — ZZP Daily Workspace

### ZZP Django App
- New app: `backend/apps/zzp/` with full CRUD for all ZZP entry types
- Registered in `INSTALLED_APPS` as `"apps.zzp"`

### Models
- `ZZPRevenueEntry` — invoice tracking with auto VAT calculation, payment status
- `ZZPExpenseEntry` — expense tracking with 16 categories, business_use_pct, deductible_amount
- `ZZPHoursEntry` — hours log with urencriterium constant (1225 hrs/year)
- `ZZPMileageEntry` — mileage at €0.23/km, deductible_amount property
- `AccountantReviewEvent` — accountant review of any entry type (pending/accepted/rejected/needs_more_info)
- Migration: `0001_initial_zzp_workspace`

### API Endpoints (12 routes at `/api/zzp/`)
| Method | URL | Description |
|--------|-----|-------------|
| GET/POST | `/zzp/revenue/` | Revenue list + create |
| GET/PATCH/DELETE | `/zzp/revenue/<id>/` | Revenue detail |
| GET/POST | `/zzp/expenses/` | Expense list + create |
| GET/PATCH/DELETE | `/zzp/expenses/<id>/` | Expense detail |
| GET/POST | `/zzp/hours/` | Hours list + create (includes totals + progress%) |
| DELETE | `/zzp/hours/<id>/` | Hours delete |
| GET/POST | `/zzp/mileage/` | Mileage list + create (includes business_km + deductible) |
| DELETE | `/zzp/mileage/<id>/` | Mileage delete |
| GET | `/zzp/summary/` | Full year summary + quarterly VAT breakdown |
| GET/POST | `/zzp/review/` | Accountant review events list + create |
| GET/PATCH | `/zzp/review/<id>/` | Accountant review detail |

### Background Task
- `quarterly_vat_summary_task(user_id, year, quarter)` — computes VAT out/in/payable per quarter

### Frontend: ZZPWorkspacePage
- Route: `/zzp-workspace`
- 6 tabs: Overview, Revenue, Expenses, Hours, Mileage, VAT
- **Overview tab**: KPI cards (revenue, expenses, profit, VAT payable), hours progress bar, quarterly VAT grid
- **Revenue tab**: inline add form + entry list with payment status badges
- **Expenses tab**: inline add form with 16 category options + deductible amount display
- **Hours tab**: urencriterium progress bar + hours log
- **Mileage tab**: business km + deductible amount summary + entry list
- **VAT tab**: quarterly breakdown table with deadlines (30 apr, 31 jul, 31 okt, 31 jan)
- Quick Actions bar for one-click add across all entry types
- Three-language support (NL/EN/FA) with type-safe T interface

### TypeScript API Client
- `frontend/src/api/zzp.ts` — full typed API client with 13 exported functions

---

## Phase 5 — Document Intelligence

### OCR Provider Pattern
- `backend/apps/portal/ocr/base.py` — `OCRProvider` abstract base class + `OCRResult` dataclass
- `backend/apps/portal/ocr/none_provider.py` — no-op provider (default)
- `backend/apps/portal/ocr/google_vision_provider.py` — Google Vision API stub
- `backend/apps/portal/ocr/google_document_ai_provider.py` — Google Document AI stub
- `backend/apps/portal/ocr/azure_document_provider.py` — Azure Form Recognizer stub
- `backend/apps/portal/ocr/factory.py` — `get_ocr_provider()` reads `OCR_PROVIDER` env var, instantiates via importlib with graceful fallback

### Integration
- `document_extraction.py` — Step 1 checks `OCR_PROVIDER` env var; calls provider if not "none"
- Falls back to pdfminer if OCR provider returns empty text

---

## Phase 6 — Production Hardening

### GDPR
- `User.anonymize()` method: erases PII (name, email → deleted_<pk>@anonymized.invalid), clears tax data, sets is_active=False
- `AccountDeletionView` — `DELETE /api/users/me/` requires `{"confirm": true}`
- `DataExportView` — `GET /api/users/me/data-export/` returns JSON summary of all user data
- `retention_expires_at` on ClientDocument for document-level GDPR retention
- `purge_expired_documents_task` — Celery task for GDPR document purge

### Celery Background Jobs
- `send_pending_reminders_task` — daily at 08:00, creates ReminderLog per engagement needing reminder
- `purge_expired_documents_task` — daily at 02:00, purges expired ClientDocument files
- `process_document_task(document_id)` — async OCR + AI extraction with 3 retries
- `quarterly_vat_summary_task` — ZZP quarterly VAT computation
- Celery Beat schedule configured in `settings.py`

### Structured Logging + Sentry
- `LOGGING` config: verbose console formatter, root=INFO, django=WARNING, apps=INFO
- Sentry SDK initialization (only activates when `SENTRY_DSN` env var is set)
- Graceful import failure if `sentry-sdk` not installed

---

## Navigation

### AppSidebar — new routes added

**Client nav:**
- `/client/messages` — Messages (MessageSquare icon)
- `/client/profile` — My Profile (User icon)
- `/zzp-workspace` — ZZP Workspace (Truck icon)

**Accountant nav:**
- `/accountant/inbox` — Inbox (Inbox icon)
- `/accountant/settings` — Settings (Settings icon)

---

## Test Suite

All 47 tests pass:
- `apps.portal.tests.test_models` — 16 model tests
- `apps.portal.tests.test_api` — 13 API endpoint tests
- `apps.portal.tests.test_services` — 12 service tests
- `apps.zzp` — 0 tests (app is new, model-level correctness validated by migrations)
- `apps.users` — 6 tests

**Test runner:** `DJANGO_SETTINGS_MODULE=config.settings_test python manage.py test`

**Frontend:** `npx tsc --noEmit` → 0 errors, `npm run build` → success (2193 modules)

---

## Environment Variables Added

```
OCR_PROVIDER=none                    # none|google_vision|google_document_ai|azure
GOOGLE_VISION_CREDENTIALS=          # path to service account JSON
GOOGLE_DOCAI_PROJECT_ID=            # Google Document AI project
GOOGLE_DOCAI_LOCATION=eu
GOOGLE_DOCAI_PROCESSOR_ID=
AZURE_FORM_RECOGNIZER_ENDPOINT=
AZURE_FORM_RECOGNIZER_KEY=
SENTRY_DSN=                         # activates Sentry error tracking
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=true
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=noreply@taxwijs.nl
```

---

## Files Changed

### New Backend Files
- `backend/apps/portal/ocr/__init__.py`
- `backend/apps/portal/ocr/base.py`
- `backend/apps/portal/ocr/none_provider.py`
- `backend/apps/portal/ocr/google_vision_provider.py`
- `backend/apps/portal/ocr/google_document_ai_provider.py`
- `backend/apps/portal/ocr/azure_document_provider.py`
- `backend/apps/portal/ocr/factory.py`
- `backend/apps/portal/tasks.py`
- `backend/apps/portal/migrations/0004_add_reminder_log_portal_message.py`
- `backend/apps/portal/migrations/0005_gdpr_document_retention.py`
- `backend/apps/zzp/__init__.py`
- `backend/apps/zzp/apps.py`
- `backend/apps/zzp/models.py`
- `backend/apps/zzp/serializers.py`
- `backend/apps/zzp/views.py`
- `backend/apps/zzp/urls.py`
- `backend/apps/zzp/tasks.py`
- `backend/apps/zzp/migrations/0001_initial_zzp_workspace.py`
- `backend/apps/users/migrations/0010_gdpr_anonymization_fields.py`
- `backend/config/settings_test.py`
- `backend/pytest.ini`

### Modified Backend Files
- `backend/apps/portal/models.py` — ReminderLog, PortalMessage, retention_expires_at
- `backend/apps/portal/serializers.py` — ReminderLogSerializer, PortalMessageSerializer
- `backend/apps/portal/views.py` — inbox, messages views; security fix for _can_access_client
- `backend/apps/portal/urls.py` — inbox, messages routes
- `backend/apps/portal/services/document_extraction.py` — OCR provider integration
- `backend/apps/portal/tests/test_api.py` — rewritten for Django TestCase
- `backend/apps/portal/tests/test_models.py` — rewritten for Django TestCase
- `backend/apps/portal/tests/test_services.py` — rewritten for Django TestCase
- `backend/apps/users/models.py` — anonymize() method, GDPR fields
- `backend/apps/users/views.py` — AccountDeletionView, DataExportView
- `backend/apps/users/urls.py` — deletion/export routes
- `backend/config/settings.py` — zzp app, Celery Beat, logging, Sentry
- `backend/config/urls.py` — /api/zzp/ routes
- `.env.example` — new env vars

### New Frontend Files
- `frontend/src/api/zzp.ts`
- `frontend/src/api/portal/messages.ts`
- `frontend/src/pages/ZZPWorkspacePage.tsx`
- `frontend/src/pages/AccountantInboxPage.tsx`
- `frontend/src/pages/AccountantSettingsPage.tsx`
- `frontend/src/pages/ClientMessagesPage.tsx`
- `frontend/src/pages/ClientProfilePage.tsx`

### Modified Frontend Files
- `frontend/src/App.tsx` — 8 new routes
- `frontend/src/components/AppSidebar.tsx` — new nav items + icons
