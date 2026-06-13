# Client Portal PRD

> Module: Client Portal | Version: 1.0 | Updated: 2026-06-13

---

## Overview

The client portal is the primary self-service interface for taxpayers. It is accessed at `/portal` after login and provides: a task list, document upload, AI chat, readiness status, tax calendar, and IB return guide. Clients who have no accountant use it autonomously; clients with an accountant see a shared task view.

---

## Key Screens

### 1. Dashboard (`/portal`)

A card-based overview of the client's current tax year status.

**Cards shown:**
- **Readiness ring** — 0–100, color-coded, with 4-dimension breakdown and "What's missing?" callout
- **Open tasks** — count of tasks requiring client action (upload X, answer Y)
- **Next deadline** — next BTW or IB deadline from the tax calendar
- **Recent chat** — link to continue last AI conversation
- **Deduction opportunity** (conditional) — if AI scanner found a deduction, show it with CTA

**Behavior:**
- FR-CPT-001: Dashboard renders in under 2 seconds (cached readiness score, no heavy computation on load)
- FR-CPT-002: "What's missing?" is a bulleted list of the top 3 blocking items, each with a direct action link
- FR-CPT-003: Readiness ring animates on first load (CSS transition)
- FR-CPT-004: If engagement status = ReadyToFile, show a green congratulations banner

### 2. My Tasks (`/portal/tasks`)

A flat list of all tasks requiring client action, sorted by priority.

**Task types:**
- Upload document (doc_type + instructions)
- Answer question (from checklist item → chat)
- Review and confirm (income figure)
- Accept engagement invitation

**Each task row:**
- Priority indicator (required / recommended)
- Task description (multilingual)
- Status (todo / in_progress / done)
- Action button (Upload / Answer / Confirm / View)
- Due date (if applicable)

**Behavior:**
- FR-CPT-005: Completing a task updates its status in real time (optimistic update + server confirm)
- FR-CPT-006: "Required" tasks with no due date show "blocking your progress" label
- FR-CPT-007: Done tasks collapse into a "Completed (N)" expandable section
- FR-CPT-008: Push notification badge count = count of open required tasks

### 3. Documents (`/portal/documents`)

Where clients upload and view their tax documents.

**Two-column layout:**
- Left: upload zone (drag & drop or browse, max 20MB, PDF/JPEG/PNG/HEIC)
- Right: document list (sorted by upload date, most recent first)

**Each document card:**
- Filename, document type badge, upload date
- Status: Uploaded → Processing → Classified → Under Review → Approved / Rejected
- "Replace" button when status = Rejected
- "View" link (preview modal)

**Behavior:**
- FR-CPT-009: Upload progress shown as a spinner + "Processing..." for up to 60 seconds
- FR-CPT-010: When a document is rejected by accountant, the client sees the rejection reason and a "re-upload" CTA
- FR-CPT-011: Document type auto-detected by OCR (shown as a badge after classification)
- FR-CPT-012: Client cannot delete an approved document (only accountant can supersede it)

### 4. Messages (`/portal/messages`)

The shared communication thread between client and accountant.

**Full-width chat interface:**
- Message bubbles (client = right, accountant = left)
- System messages (e.g., "Accountant approved your Jaaropgaaf")
- Compose box at bottom
- File attachment (shares to /documents as well)

**Behavior:**
- FR-CPT-013: New messages from accountant trigger push notification
- FR-CPT-014: Message thread is per-engagement (scoped to current tax year)
- FR-CPT-015: File attachments via messages appear in the Documents tab too
- FR-CPT-016: Unread message count shown in nav badge

### 5. AI Chat (`/portal/chat`)

The AI tax Q&A interface — see also [../02-prd/ai-chat-prd.md] (if it exists).

**Layout:**
- Full-page chat interface
- Model indicator: "Powered by Claude, sourced from verified 2026 Dutch tax rules"
- Session history: last 20 messages in context
- Source citations shown below each AI response
- Language switcher in top-right (NL / EN / FA)

**Modes (client can switch):**
- **Normal Q&A** — open-ended tax questions
- **IB Return Guide** — conversational IB form walkthrough
- **Tax Simulation** — enter income, see full tax breakdown

**Behavior:**
- FR-CPT-017: AI responses stream via SSE (first token < 3 seconds)
- FR-CPT-018: Every factual statement in the response includes a [source URL]
- FR-CPT-019: If the AI detects a profile update intent (e.g., "I earned €72k this year"), it saves to intake_profile and confirms with client
- FR-CPT-020: Calculator is invoked automatically when a numeric tax question is asked

### 6. Tax Calendar (`/portal/calendar`)

A view of all upcoming Dutch tax deadlines relevant to the client's profile.

**Calendar display:**
- Month view with deadline markers
- List view alternative
- Click a deadline → detail modal (what is due, amount if known, action link)
- ICS download button (subscribe to calendar)

**Deadlines shown (2026):**
- BTW Q1 due: 30 April 2026
- BTW Q2 due: 31 July 2026
- BTW Q3 due: 31 October 2026
- IB return deadline: 1 May 2026
- Extension deadlines (if applicable)

**Behavior:**
- FR-CPT-021: Only deadlines relevant to the client's user_type are shown (ZZP sees BTW, employee does not)
- FR-CPT-022: Deadlines within 14 days have a "Due soon" amber badge
- FR-CPT-023: Passed deadlines with no action recorded show a "Late?" red badge
- FR-CPT-024: ICS download includes all relevant deadlines for the full calendar year

### 7. Settings (`/portal/settings`)

Account and notification preferences.

**Sections:**
- Profile: name, email, preferred language (NL/EN/FA)
- Notifications: email frequency, push notification toggle
- Privacy: download my data (DSAR), delete my account
- Connected accountant: view who is managing my engagement, disconnect option

**Behavior:**
- FR-CPT-025: Language change applies immediately (i18next language switch, no page reload)
- FR-CPT-026: "Delete my account" requires typing "DELETE" to confirm — triggers GDPR anonymization
- FR-CPT-027: DSAR export generated within 24 hours, link sent by email

---

## Navigation

**Bottom tab bar (mobile) / Left sidebar (desktop):**
- Dashboard (home icon)
- Tasks (checkbox icon + badge)
- Documents (file icon)
- Messages (chat bubbles + badge)
- AI Chat (sparkle icon)
- Calendar (calendar icon)
- Settings (gear icon)

**Behavior:**
- FR-CPT-028: Active tab highlighted with brand color
- FR-CPT-029: Badge counts on Tasks and Messages updated in real time via polling (30s interval)
- FR-CPT-030: If user has no engagement (no accountant + no self-started), show onboarding prompt on dashboard

---

## Self-Service vs Accountant-Managed

| Feature | Self-Service (no accountant) | Accountant-Managed |
|---------|-----------------------------|--------------------|
| Dashboard | Own readiness score | Shared readiness (accountant updates too) |
| Tasks | Auto-generated by checklist engine | Accountant assigns tasks |
| Documents | Client reviews own docs | Accountant reviews |
| Messages | No message tab | Full message thread |
| Checklist | Client marks items done | Accountant marks items done |

---

## RBAC

| Action | Allowed | Condition |
|--------|---------|-----------|
| View dashboard | client | Own engagement only |
| Upload document | client | Engagement not Archived |
| Delete document | client | Status = Uploaded (not yet reviewed) |
| Send message | client | Has active engagement with accountant |
| Export DSAR | client | Own data only |
| Delete account | client | Must confirm |
| Switch language | client | Always allowed |

---

## Persian (FA) Support

- All UI strings available in `fa.json` locale file
- Document upload instructions in FA
- AI chat responses in FA when user asks in Farsi
- Tax deadline dates use Gregorian calendar (Shamsi calendar display is a Phase 2 enhancement)
- RTL layout: `dir="rtl"` applied to all FA content blocks
- FA text quality: native speaker reviewed before shipping
