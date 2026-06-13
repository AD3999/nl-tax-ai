# Traceability Matrix

> Links PRD requirements → user stories → implementation → tests.
> Use this to verify completeness and find gaps.
> Updated: 2026-06-13

---

## How to Read This Matrix

| Column | Meaning |
|--------|---------|
| Req ID | Functional requirement from PRD |
| Story IDs | User stories that implement it |
| Implementation | Code file(s) or module |
| Test | Test file(s) covering it |
| Status | implemented / partial / not-started |

---

## Identity & Access

| Req ID | Requirement | Story IDs | Implementation | Test | Status |
|--------|-------------|-----------|----------------|------|--------|
| IAM-001 | User registration (client/accountant/admin) | US-IAM-001 to 005 | `backend/apps/users/views.py::RegisterView` | `test_api.py` | implemented |
| IAM-002 | JWT login + token refresh | US-IAM-006 | `users/views.py::LoginView`, simplejwt | `test_api.py` | implemented |
| IAM-003 | Google OAuth2 login | US-IAM-007 | `users/views.py::GoogleAuthView`, `GoogleCallbackPage.tsx` | manual | implemented |
| IAM-004 | Role-based access (client/accountant/admin) | US-IAM-008 to 010 | `User.role` field, `_is_portal_user()` | `test_api.py` | implemented |
| IAM-005 | Session auto-logout (1hr inactivity) | US-IAM-011 | `AuthContext.tsx` | manual | implemented |
| IAM-006 | Password reset flow | US-IAM-012 | django-allauth | not tested | partial |
| IAM-007 | GDPR account deletion | US-IAM-013 | `users/views.py::DeleteAccountView` | `test_gdpr.py` | implemented |

---

## Client Onboarding

| Req ID | Requirement | Story IDs | Implementation | Test | Status |
|--------|-------------|-----------|----------------|------|--------|
| ONB-001 | User type selection (ZZP/employee/expat/DGA) | US-ONB-001 | `IntakePage.tsx`, `RegisterPage.tsx` | manual | implemented |
| ONB-002 | Tax intake profile collection | US-ONB-002 to 004 | `IntakePage.tsx`, `intake_profile` JSONField | manual | implemented |
| ONB-003 | Multilingual onboarding (NL/EN/FA) | US-ONB-005 | i18next, all pages | manual | implemented |
| ONB-004 | Accountant invitation acceptance | US-ONB-006 | `ClientInvitationsView`, `InvitationBanner.tsx` | `test_api.py` | implemented |

---

## Engagement Lifecycle

| Req ID | Requirement | Story IDs | Implementation | Test | Status |
|--------|-------------|-----------|----------------|------|--------|
| ENG-001 | Create engagement for client + tax year | US-ENG-001 | `TaxEngagement` model, `EngagementPage` | `test_services.py` | implemented |
| ENG-002 | Engagement state machine (Draft→Filed) | US-ENG-002 to 006 | `TaxEngagement.status` field | `test_models.py` | partial |
| ENG-003 | Engagement overview tab (readiness + actions) | US-ENG-007 | `EngagementPage.tsx` Overview tab | manual | implemented |
| ENG-004 | Engagement archive | US-ENG-008 | `status=archived` | none | partial |

---

## Readiness Engine

| Req ID | Requirement | Story IDs | Implementation | Test | Status |
|--------|-------------|-----------|----------------|------|--------|
| RDY-001 | 0–100 readiness score | US-RDY-001 | `portal/services/readiness.py` | `test_services.py` | implemented |
| RDY-002 | Score breakdown explanation | US-RDY-002 | `readiness.py::get_readiness_detail()` | `test_services.py` | partial |
| RDY-003 | Mandatory evidence gating (score cap at 80) | US-RDY-003 | `readiness.py` gating rule | `test_services.py` | implemented |
| RDY-004 | Readiness recalculation on events | US-RDY-004 | `ClientPortalTaskUpdateView::recalculate_readiness()` | none | partial |
| RDY-005 | Historical readiness snapshots | US-RDY-005 | `ReadinessSnapshot` model (DB-1 pending) | none | not-started |

---

## Checklist Engine

| Req ID | Requirement | Story IDs | Implementation | Test | Status |
|--------|-------------|-----------|----------------|------|--------|
| CHK-001 | Persona-specific checklist templates | US-CHK-001 | `portal/services/accountant_checklists.py` | `test_services.py` | implemented |
| CHK-002 | ChecklistItem CRUD | US-CHK-002 | `ChecklistItem` model, portal views | `test_api.py` | implemented |
| CHK-003 | Idempotent template generation (stable_key) | US-CHK-003 | `stable_key` field | `test_services.py` | implemented |
| CHK-004 | Client task view (open/done split) | US-CHK-004 | `ClientTasksPage.tsx` | manual | implemented |
| CHK-005 | Ask AI from task card | US-CHK-005 | `ClientTasksPage.tsx::handleAskAI()` | manual | implemented |

---

## Document Center

| Req ID | Requirement | Story IDs | Implementation | Test | Status |
|--------|-------------|-----------|----------------|------|--------|
| DOC-001 | Document upload (PDF/JPEG/PNG/HEIC/CSV/XLSX, max 20MB) | US-DOC-001 | `ClientDocument` model, upload validation | `test_api.py` | implemented |
| DOC-002 | Document status machine | US-DOC-002 | `ClientDocument.status` field | `test_models.py` | implemented |
| DOC-003 | OCR extraction (4 providers) | US-DOC-003 | `portal/services/document_extraction.py` | none | implemented |
| DOC-004 | Accountant review — split panel | US-DOC-004 | `EngagementPage.tsx` Documents tab | manual | implemented |
| DOC-005 | Low-confidence field review | US-DOC-005 | `ExtractionReview` (DB-1 pending) | none | not-started |
| DOC-006 | Document delete | US-DOC-006 | `ClientPortalDocumentDeleteView` | none | implemented |
| DOC-007 | Document versioning (superseded) | US-DOC-007 | `status=superseded` | none | partial |
| DOC-008 | Audit trail for all document actions | US-DOC-008 | `PortalAuditLog` model | `test_models.py` | implemented |

---

## AI & Chat

| Req ID | Requirement | Story IDs | Implementation | Test | Status |
|--------|-------------|-----------|----------------|------|--------|
| AI-001 | Tax Q&A chat (streaming) | US-AI-001 | `chat/views.py::ChatMessageView` | none | implemented |
| AI-002 | RAG retrieval injected into system prompt | US-AI-002 | `phase2/retriever.py` + `chat/views.py` | `test_retrieval.py` | implemented |
| AI-003 | Source citations in every AI response | US-AI-003 | `assembler.py::IMPORTANT: Cite source_url` | `test_retrieval.py` | implemented |
| AI-004 | IB return conversational guide | US-AI-004 | `chat/views.py::_ib_return_system_prompt()` | manual | implemented |
| AI-005 | Tax simulation (conversational intake) | US-AI-005 | `chat/views.py` + `ChatPage.tsx` sim mode | manual | implemented |
| AI-006 | AI tax memory (cross-session profile) | US-AI-006 | `User.tax_memory`, `chat/views.py` | none | implemented |

---

## Deduction Scanner

| Req ID | Requirement | Story IDs | Implementation | Test | Status |
|--------|-------------|-----------|----------------|------|--------|
| DED-001 | ZZP deduction checker (9-step wizard) | US-DED-001 | `DeductionCheckerPage.tsx` | manual | implemented |
| DED-002 | 3-tier results (likely/needs confirmation/not likely) | US-DED-002 | `DeductionCheckerPage.tsx` | manual | implemented |
| DED-003 | Accountant-facing deduction opportunities | US-DED-003 | `EngagementPage.tsx` Risks tab | manual | partial |
| DED-004 | Evidence requirements per deduction | US-DED-004 | `EvidenceRequirement` model (DB-1 pending) | none | not-started |
| DED-005 | Deduction opportunity persistence | US-DED-005 | `DeductionOpportunity` model (DB-1 pending) | none | not-started |

---

## Messaging

| Req ID | Requirement | Story IDs | Implementation | Test | Status |
|--------|-------------|-----------|----------------|------|--------|
| MSG-001 | Accountant → client messaging thread | US-MSG-001 | `PortalMessage` model, `AccountantInboxView` | none | implemented |
| MSG-002 | Client → accountant messaging | US-MSG-002 | `ClientMessagesView` | none | implemented |
| MSG-003 | RTL chat layout for Persian | US-MSG-003 | CSS `dir=rtl` | manual | implemented |
| MSG-004 | Push notifications for new messages | US-MSG-004 | `push_utils.py`, `PushSubscription` model | manual | implemented |

---

## Rule Engine

| Req ID | Requirement | Story IDs | Implementation | Test | Status |
|--------|-------------|-----------|----------------|------|--------|
| RUL-001 | Tax rule versioning with effective dates | US-RUL-001 | `RuleVersion` model (DB-1 pending) | none | not-started |
| RUL-002 | Rule approval workflow | US-RUL-002 | Rule governance (Tier 6 pending) | none | not-started |
| RUL-003 | Rule test cases | US-RUL-003 | `RuleTestCase` model (DB-1 pending) | none | not-started |
| RUL-004 | Shadow mode for new rules | US-RUL-004 | Tier 6 pending | none | not-started |
| RUL-005 | Static Phase 1 rules served to AI | US-RUL-005 | `tax_rules_2026.json` → RAG pipeline | `test_retrieval.py` | implemented |

---

## Legend

| Status | Meaning |
|--------|---------|
| implemented | Code exists and is working |
| partial | Code exists but is incomplete or untested |
| not-started | Listed in spec, not yet built |
