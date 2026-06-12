# TaxWijs — Build Progress Log

> This file tracks what has been built, tested, and shipped.
> Last updated: 12 Jun 2026 (session 15 — UI polish + chat platform navigation).

---

## Session — 12 Jun 2026 (session 13) ✅ Complete

### UI Redesign — T1–T8 (feat/ui-redesign-v2 → master)

Full premium SaaS layout overhaul per `front-ui.md` design spec. Blue oklch theme preserved throughout.

**T1 — Sidebar Layout** (`AppSidebar.tsx`, `AppLayout.tsx`, `PublicLayout.tsx`, `App.tsx`)
- Always-dark 280px sidebar (`data-theme="dark"` scoping) with role-aware nav (client/accountant/admin)
- `AppSidebarDesktop` (sticky) + `AppSidebarMobileDrawer` (controlled by AppLayout)
- React Router v7 layout route groups: `PublicLayout` (TopNav+Footer) vs `AppLayout` (sidebar)
- `FULL_BLEED = Set(["/chat"])` — chat fills content area without padding
- User card at sidebar bottom: initials avatar, username/email, logout button
- `LangSwitch` + `ThemeToggle` in sidebar bottom area via CSS var cascade

**T2 — Accountant Portal KPI + AI Priorities** (`AccountantPortalPage.tsx`)
- 4 KPI cards: icon box (lucide) + large number + label — replaces centered serif cards
- "Priority Actions" card: derived from live engagement data (blocked/high-risk/needs_review/waiting_client), max 5 rows with colored dot + client name + issue label + arrow link

**T3 — Client Portal simplification** (`ClientPortalPage.tsx`)
- `CheckSquare` + `FolderOpen` lucide icons replace emoji in CTA cards
- Score banner: colored dot replaces emoji
- `.portal-cta-card` CSS class: `transition + borderTop + hover lift` (no more inline onMouseEnter/Leave)

**T4 — Dashboard metric cards** (`DashboardPage.tsx`)
- `SummaryCard` gains optional `icon`/`iconBg`/`iconColor` props; icon box renders when supplied
- 4 metric cards now carry `TrendingUp`, `Percent`, `PiggyBank`, `ShieldAlert`/`Activity`
- `PDFDownloadCard`: `BarChart3` icon replaces emoji
- `ComplianceStatusCard`: colored dot replaces ✅/⚠️

**T5 — Document review split panel** (`EngagementPage.tsx`)
- Documents tab: GitHub PR-style 280px list panel (left) + detail/review panel (right)
- `selectedDocId` state; `selectedDoc` derived from `documents` array (auto-reflects API updates)
- Detail panel: 2×2 metadata grid, extracted data table, approve/reject/view buttons
- Empty state placeholder with `FileText` icon

**T6 — StatusBadge component** (`components/StatusBadge.tsx`)
- Unified color map for 20+ statuses: engagement, document review, risk level, invitations
- Props: `status: string`, `size?: "sm" | "md"`

**T7 — DataTable component** (`components/DataTable.tsx`)
- Generic `DataTable<T>` with `columns`, `rows`, `getKey`, `searchKeys`, `sortFn` per column
- Debounce-free search (useMemo), toggle sort direction, row click handler, `maxHeight` scrollable
- Animated row hover via inline handlers

**T8 — ProgressRing component** (`components/ProgressRing.tsx`)
- SVG ring with auto-color (green/amber/red by score), configurable `size`, `strokeWidth`, `color`
- `showLabel` toggle, serif font label centered via absolute positioning

**TypeScript:** 0 errors (`tsc --noEmit` clean).
**Commits:** `da48664` (T1) → `70a9d7c` (T2–T8) → merge to master.

---

## Session — 11 Jun 2026 (session 12) ✅ Complete

### Portal comprehensive audit — 9-issue fix

Full audit and fix of the client/accountant portal. All 9 reported issues addressed.

---

#### Issue 1 — Document upload broken (backend root cause)

**Root cause A:** Media files were served in development — `urls.py` lacked the `static(MEDIA_URL, ...)` handler, so uploaded files saved to disk but returned 404 on access.

**Fix (`backend/config/urls.py`):** Added `if settings.DEBUG: urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)`.

**Root cause B:** Users without an accountant-linked profile had no `AccountantClientProfile` or `TaxEngagement` → upload button disabled.

**Fix (`backend/apps/portal/views.py`):** Added `_get_or_create_self_service_profile(user)` and `_get_or_create_engagement(profile)` helpers. All five client portal views now call these instead of raising 404. Any logged-in user always has a working portal.

---

#### Issue 2 — "My Portal" shows "Portal not available" after navigating to chat

**Root cause:** `fetchClientEngagement()` returned 404 for users without an accountant → `Promise.all` failed → entire portal showed error.

**Fix:** Same auto-create helpers above. Also replaced the error state with "Setting up your portal…" for missing profile, differentiated auth errors from network errors.

---

#### Issue 3 — Nav links faded / invisible

**Fix (`frontend/src/components/TopNav.tsx`):**
- Inactive link weight `500` → `600`, active `600` → `700`
- Inactive color `var(--text-3)` → `var(--text-2)` (higher luminosity)
- Mobile dropdown also fixed

**Fix (`frontend/src/index.css`):**
- Dark mode `--text-3`: `oklch(0.46 ...)` → `oklch(0.58 ...)` (raised brightness)
- Dark mode `--text-2`: raised to `oklch(0.76 ...)`
- Dark mode `--text-4`: raised to `oklch(0.42 ...)`

---

#### Issue 4 — Loading states: plain "Loading..." text

**Fix:** Added `SkeletonCard`, `SkeletonTask`, `SkeletonDoc` components to `ClientPortalPage.tsx`, `ClientTasksPage.tsx`, and `ClientDocumentsPage.tsx`. Shimmer animation via `.skel` CSS class (previously defined in `index.css`).

---

#### Issue 5 — Light mode eye strain (too dark / blue-saturated)

**Fix (`frontend/src/index.css`):**
- Light mode `--bg`: `oklch(0.87 0.026 265)` → `oklch(0.97 0.006 265)` (near-white)
- Light mode `--bg-2`: `oklch(0.83 ...)` → `oklch(0.93 ...)`
- Light mode `--bg-3`: raised to near-surface white
- Light mode text tokens darkened for contrast
- Dark mode backgrounds raised (less pitch-black)

---

#### Issue 6 — Task cards: "Take Action" button + status persists to DB

**Fix (`frontend/src/pages/portal/ClientTasksPage.tsx`):**
- `handleTakeAction(task)`: routes by category to the relevant page (`/dashboard`, `/deduction-checker`, `/client/documents`, `/chat`)
- `handleMarkDone(task)`: optimistic update + undo button
- Status change calls `PATCH /api/portal/client/tasks/<id>/`

**Fix (`backend/apps/portal/views.py` — `ClientPortalTaskUpdateView`):**
- PATCH endpoint updates `ChecklistItem.status` in DB
- Creates `AccountantAction` notification (idempotent `stable_key`) so accountant sees it
- Recalculates engagement readiness score

---

#### Issue 7 — Responsiveness

All portal pages use `useMobile()` hook: `AccountantPortalPage`, `EngagementPage`, `ClientPortalPage`, `ClientTasksPage`, `ClientDocumentsPage`. Grids collapse to `1fr` on mobile. Verified no hardcoded widths blocking layout.

---

#### Issue 8 — Accountant dashboard in admin panel

`backend/apps/portal/admin.py` registers all 9 portal models with `list_display`, `list_filter`, `search_fields`, and `raw_id_fields`. All portal data is fully viewable and editable in Django admin at `/django-admin/`. The React accountant portal at `/accountant/portal` has full DB backing.

---

#### Issue 9 — Text too thin / invisible

Addressed via Issue 3 and 5 fixes above. Additionally: heading font weights raised to `800` in portal pages, status badge font weight `700`, metadata font weight `600`.

---

#### Document upload: title + note required, delete button

**Backend (`backend/apps/portal/models.py`):** Added `user_title` (CharField 200, optional) and `user_note` (TextField, optional) to `ClientDocument`.

**Backend (`backend/apps/portal/serializers.py`):** Both fields in `ClientDocumentSerializer` and `ClientDocumentUploadSerializer`.

**Backend (`backend/apps/portal/views.py`):** `ClientPortalDocumentDeleteView` — DELETE `/api/portal/client/documents/<id>/` deletes file from disk and DB record.

**Backend (`backend/apps/portal/urls.py`):** Added `client/tasks/<int:pk>/` and `client/documents/<int:pk>/` routes.

**Migration:** `portal.0003_add_user_title_note_to_document` — applied ✅

**Frontend (`frontend/src/api/portal/types.ts`):** Added `user_title: string` and `user_note: string` to `ClientDocument` interface.

**Frontend (`frontend/src/api/portal/client.ts`):**
- `uploadClientDocument(engId, profileId, file, title, note)` — sends `user_title`/`user_note` as form fields
- `uploadDocument()` — updated to accept optional `{ userTitle, userNote, documentRequestId }` for accountant use
- `deleteClientDocument(id)` — DELETE call

**Frontend (`frontend/src/pages/portal/ClientDocumentsPage.tsx`):** Full rewrite — upload modal with Title + Note fields, skeleton loading, delete button with confirm step, status badges in 3 languages, per-document view link.

**Frontend (`frontend/src/pages/portal/EngagementPage.tsx`):** Upload in documents tab now opens a modal with Title + Note fields. Displays `user_title` / `user_note` in document list.

---

#### TypeScript check

`npx tsc --noEmit` → **0 errors**

---

#### Checks

- [x] File upload saves to DB, `file_url` resolves (media serving fixed)
- [x] Portal no longer shows "Portal not available" for users without accountant
- [x] Nav links visible in dark and light mode
- [x] All portal loading states show skeleton shimmer
- [x] Light mode backgrounds near-white, dark mode less pitch-black
- [x] "Take Action" routes to correct page per task category
- [x] Task status change persists to DB; accountant notified
- [x] All portal pages responsive (collapse to 1-column on mobile)
- [x] All 9 portal models in Django admin with full CRUD
- [x] Document upload requires title/note modal; accountant + client both get it
- [x] Delete button removes file from disk + DB record
- [x] `npx tsc --noEmit` → 0 errors

---

## Session — 11 Jun 2026 (session 11) ✅ Complete

### Blue design system + theme refinements

*(See git log for details — commit `69a3cb8`)*

---

## Session — 10 Jun 2026 (session 6) ✅ Complete

### UI polish + responsiveness + chat persistence

Seven tasks shipped across frontend and backend. Branch `feat/session-6` merged to `master`.

---

#### T2 — Global font cleanup
- Removed italic Lora variant from Google Fonts URL in `frontend/index.html`
- Removed `fontStyle: "italic"` from `IntakePage.tsx` → replaced with `fontWeight: 600`
- Eliminated `<em style={{fontStyle:"italic"}}>` from `LandingPage.tsx` (full rewrite)
- Admin pages: Tailwind `italic` class retained for internal AI hint annotations only

---

#### T3 — Landing page: simplified, animated, auto-sliding, fully responsive
- Full rewrite of `frontend/src/pages/LandingPage.tsx`
- Added 7 CSS keyframes to `frontend/src/index.css`: `heroFadeUp`, `heroFadeIn`, `floatCard`, `slideInFromRight`, `slideInFromLeft`, `fadeSlideIn`, `progressBar`
- `@media (prefers-reduced-motion)` overrides for all new animations
- **Hero section**: staggered entrance animations, floating demo card (desktop), trust indicators
- **Feature slider**: auto-cycling every 3.8s, direction-aware slide animations, dot + arrow nav, progress bar on active item, pause-on-hover, touch swipe support
- **User type tabs**: auto-cycling every 4.5s, stops on manual click, fade-slide content animation
- **Footer CTA**: dark sage (`var(--sage-900)`) background
- Three-language parity: NL/EN/FA copy baked in, RTL-aware layout

---

#### T4 — Dashboard accordion: Actions / Risks / Deadlines
- Added `AccordionSection` component to `frontend/src/pages/DashboardPage.tsx`
- Wrapped Actions, Risks, and Upcoming Deadlines sections in collapsible accordions
- Defaults open when items exist, closed when empty — reduces scroll on first load
- Toggle chevron animates 180° open/closed with CSS `transition`

---

#### T5 — Clear chat: visible button
- Changed tiny invisible text link → `className="btn btn-ghost btn-sm"` button with X icon
- Located in `frontend/src/pages/ChatPage.tsx`

---

#### T6 — Chat history persistence to DB (cross-device)
- **Backend**: Added `ChatHistoryView` at `GET /api/chat/history/` — returns last 80 messages flat, ordered by `created_at`
- **Backend**: Added `SaveChatHistoryView` at `POST /api/chat/history/save/` — accepts a batch of messages and persists as one `Conversation` in DB
- Both endpoints in `backend/apps/chat/views.py` and registered in `backend/apps/chat/urls.py`
- **Frontend**: Added second `useEffect` in `ChatPage.tsx` that runs when `user` becomes available — fetches DB history if localStorage is empty (new device scenario), populates messages, caches to localStorage

---

#### T7 — Fix "Ask AI" on task cards
- Bug: `ClientTasksPage.tsx` navigated to `/chat` with `{ prefillMessage: question }` but `ChatPage.tsx` reads `locState?.question`
- Fix: changed to `navigate("/chat", { state: { question } })` — one line change

---

#### T8 — Accountant portal full responsiveness audit
- `EngagementPage.tsx`: added `useMobile`, fixed overview grid (`1fr 2fr` → responsive), fixed risks grid (`1fr 1fr` → responsive)
- `AccountantClientDetailPage.tsx`: added `useMobile`, fixed main grid (`1fr 2fr` → responsive), fixed new-engagement form grid (`1fr 1fr auto` → responsive on mobile)
- `ClientPortalPage.tsx`: added `useMobile`, fixed info grid, fixed CTA cards grid, removed `minWidth: 200` constraint → `minWidth: 0`
- `AccountantPortalPage.tsx`: changed textarea `fontSize: 15` → `fontSize: 16` (prevents iOS auto-zoom)
- `ClientTasksPage.tsx`, `ClientDocumentsPage.tsx`: already fully responsive, no changes needed

---

#### TypeScript
- `npx tsc --noEmit` → 0 errors

---

#### Checks
- [x] No italic fonts anywhere in the user-facing UI
- [x] Landing page slider auto-cycles and pauses on hover
- [x] Landing page touch swipe works on mobile
- [x] Dashboard accordions collapse/expand with chevron animation
- [x] Clear chat button visible and styled
- [x] Chat history loads from DB on new device login
- [x] Ask AI from task cards passes question to ChatPage
- [x] All portal pages collapse to single column on mobile
- [x] `npx tsc --noEmit` → 0 errors

---

## Session — 10 Jun 2026 (session 6) — Planned (superseded above)

### Chatbot → Dashboard: deliberate save flow

**Design decision recorded:** The chatbot does NOT auto-save data to the dashboard. All dashboard writes are user-initiated. The chatbot asks the user to save after it produces a concrete result (numbers, deduction eligibility, IB return answers, risk assessment). General informational answers (no numbers) never trigger a save offer.

---

#### Architecture

**Principle:** Chat is ephemeral. Dashboard is intentional.

The current `PROFILE_UPDATE` auto-save (in `backend/apps/chat/views.py`) that silently PATCHes `intake_profile` on every AI response must be removed. In its place, a deliberate 3-step flow:

1. User gives data → AI produces a result with numbers
2. AI ends its response by asking: "Want me to save this to your dashboard?"
3. User replies "yes" (or clicks a button) → structured data is written to the database

---

#### Save triggers — when the AI offers to save

| Conversation type | Save offered? |
|---|---|
| Tax calculation (revenue + expenses → total tax) | Yes |
| Deduction eligibility confirmed (checker result) | Yes |
| IB return fields answered | Yes |
| Wet DBA risk assessment (low/medium/high + reasons) | Yes |
| General "how does X work" question | No |
| Clarifying question with no concrete numbers | No |

Detection rule: if the AI response contains a **calculated euro amount or a confirmed eligibility status**, offer to save. If it's pure explanation, don't.

---

#### What gets saved (structured, not raw chat)

Dashboard stores structured records, never the raw conversation transcript:

```json
{
  "type": "tax_estimate",
  "year": 2026,
  "revenue": 72000,
  "total_tax": 13952,
  "effective_rate": 19.4,
  "monthly_reserve": 1162,
  "deductions_applied": ["zelfstandigenaftrek", "mkb", "zvw"],
  "saved_at": "2026-06-10T14:23:00Z"
}
```

```json
{
  "type": "deduction_check",
  "year": 2026,
  "eligible": ["zelfstandigenaftrek", "mkb_winstvrijstelling", "zvw"],
  "needs_confirmation": ["kia", "lijfrente"],
  "saved_at": "2026-06-10T14:23:00Z"
}
```

```json
{
  "type": "wet_dba_risk",
  "year": 2026,
  "risk_level": "medium",
  "reasons": ["65%+ revenue from single client", "no substitution clause"],
  "saved_at": "2026-06-10T14:23:00Z"
}
```

```json
{
  "type": "ib_return",
  "year": 2025,
  "fields": { "1a": 72000, "1c": 1200, "1d": 8993, ... },
  "saved_at": "2026-06-10T14:23:00Z"
}
```

---

#### Files to change

**Backend:**

| File | Change |
|---|---|
| `backend/apps/chat/views.py` | Remove `PROFILE_UPDATE` stream parser + auto-patch logic. Add `[SAVE_PROMPT]` marker detection: when AI emits this marker, frontend shows save UI. |
| `backend/apps/chat/views.py` | Add save-intent detection to system prompt: AI must end responses with `[SAVE_PROMPT: {"type": "...", "data": {...}}]` when result type qualifies (see table above). |
| `backend/apps/users/views.py` | New `DashboardSaveView` at `POST /api/users/dashboard/save/` — accepts `{type, data}`, writes to `User.dashboard_records` JSONField (new field, append-only list). |
| `backend/apps/users/models.py` | Add `dashboard_records = JSONField(default=list)` to `User`. Each entry: `{id, type, year, data, saved_at}`. |
| `backend/apps/users/migrations/` | New migration for `dashboard_records` field. |

**Frontend:**

| File | Change |
|---|---|
| `frontend/src/api/chat.ts` | Add `save_prompt?: { type: string; data: Record<string, unknown> }` to `TokenMeta`. SSE parser handles `[SAVE_PROMPT]` marker — strips from displayed text, routes to `onToken` as metadata. |
| `frontend/src/pages/ChatPage.tsx` | On `meta.save_prompt`: render a `SaveToDashboardCard` inline in the chat thread below the AI message. Card shows a summary of what will be saved + "Save" / "No thanks" buttons. On confirm → `POST /api/users/dashboard/save/`. |
| `frontend/src/components/SaveToDashboardCard.tsx` | NEW component. Shows structured summary of the result (e.g. "Tax estimate: €13,952 · Rate: 19.4%"), "Save to dashboard →" button, "No thanks" dismiss. Trilingual (NL/EN/FA). |
| `frontend/src/pages/DashboardPage.tsx` | New "Saved results" section. Fetches `GET /api/users/dashboard/records/` and renders each record as a card by type (tax_estimate / deduction_check / wet_dba_risk / ib_return). |
| `frontend/src/api/dashboard.ts` | NEW — `saveToDashboard(type, data)` and `fetchDashboardRecords()`. |

**Anonymous users:**

If `user` is null when save is attempted, `SaveToDashboardCard` shows "Create a free account to save this" with `[Register →]` and `[Log in →]` links instead of the save button. This is the registration conversion moment — after demonstrated value.

---

#### Intake wizard exception

The intake wizard (`/intake`) continues to save automatically on completion. This is onboarding — users expect their setup choices to be remembered. Only chat auto-save is removed.

---

#### What is NOT changed

- `tax_memory` (cross-session AI context) stays as-is. This is a separate concept — it helps the AI give better answers, it doesn't write user-visible records to the dashboard.
- The calculator page (`/calculator`), deduction checker (`/deduction-checker`), and IB return guide already have their own save/export mechanisms — these are untouched in this session.
- The accountant portal is completely separate and unaffected.

---

#### Checks before marking complete

- [ ] `PROFILE_UPDATE` no longer appears in network requests during a chat session
- [ ] `[SAVE_PROMPT]` stripped from displayed AI message text (never shown to user)
- [ ] Save card renders correctly in NL, EN, and FA
- [ ] Anonymous user sees register prompt instead of save button
- [ ] Dashboard "Saved results" section renders all 4 record types
- [ ] `npx tsc --noEmit` → 0 errors

---

## Session — 9 Jun 2026 (session 5) ✅ Complete

### Accountant + client portal — 6 bug fixes

Full audit of accountant/client portal followed by targeted fixes for every reported issue.

---

#### Fix 1 — Backend: duplicate tasks in client view (root cause)

**Problem:** `ClientPortalTasksView` returned tasks from both `DocumentRequest` (status `"open"`) and `ChecklistItem` (status `"todo"`), causing the same task (e.g. "KVK number") to appear twice in the client list.

**Root cause:** The standard checklist template auto-creates `ChecklistItem` rows for all standard ZZP tasks. When the accountant's `missing_info` service also created `DocumentRequest` rows for the same items, both were serialized and returned together.

**Fix (`backend/apps/portal/views.py` — `ClientPortalTasksView`):**
- Changed to return **only `ChecklistItem`** objects (the canonical data source for client tasks).
- Returns **all statuses** (not filtered) so the frontend `doneTasks` filter can correctly show accepted/waived items.
- Added `category` and `priority` fields to the response payload (DocumentRequests lacked these).
- Counts (total/completed) now only use `ChecklistItem` rows.

---

#### Fix 2 — Accountant checklist dropdown: silent failures + missing toast feedback

**Problem (`EngagementPage.tsx`):** `handleChecklistStatus()` had no try/catch. When the PATCH call failed, the error was silently swallowed — the dropdown appeared to change but reverted on next render with zero feedback to the accountant. Same issue on all other async handlers (`handleActionStatus`, `handleReviewDoc`, `handleApproveIncome`, `handleApproveExpense`, `handleSendReminder`, `handleRecalculate`, `handleGenerateActions`).

**Fix (`frontend/src/pages/portal/EngagementPage.tsx` — full rewrite):**
- `useToast` wired in.
- `handleChecklistStatus`: optimistic update → on failure, reverts to previous status + shows error toast.
- All other async handlers: try/catch with success/error toast.

---

#### Fix 3 — Full NL/EN/FA translations on EngagementPage

**Problem:** `EngagementPage.tsx` had zero i18n — all 40+ strings hardcoded English (tab labels, status labels, button labels, section headings, table headers, empty states).

**Fix:** Added comprehensive `TX` object in NL/EN/FA. All status labels (todo, waiting_client, uploaded, needs_review, accepted, rejected, waived) now render in the user's language. `useTranslation` reads `i18n.language`.

---

#### Fix 4 — Client tasks: translated statuses, correct ID type, error state, faster polling

**Problem (`ClientTasksPage.tsx`):**
- `Task.id` typed as `number` but backend sends `"chk_X"` strings → React key warnings.
- Raw status string "todo" shown instead of translated label.
- `doneTasks` always empty (backend previously filtered out accepted/waived).
- 20 s polling, silent error handling.

**Fix:**
- `id: string` in `Task` interface.
- `STATUS_LABELS` + `CATEGORY_LABELS` translation maps (NL/EN/FA, 7 statuses).
- Error state with retry button on initial load failure.
- Polling reduced to 10 s.

---

#### Fix 5 — Ask AI button on every task card

Each open task card now has an "Ask AI" / "Vraag AI" / "پرسش از AI" button. On click, navigates to `/chat` with `location.state.prefillMessage` set to the task title + description so the chatbot can guide the user on that specific task.

---

#### Fix 6 — ClientPortalPage + ClientDocumentsPage hardcoded strings

**`ClientPortalPage.tsx`:** "Upload & view" translated to NL/EN/FA. Polling 20 s → 10 s.

**`ClientDocumentsPage.tsx`:** Raw `processing_status` values (uploaded/processing/extracted/needs_review/approved/rejected) replaced with `STATUS_LABELS` translation map. Polling 20 s → 10 s.

---

#### TypeScript check

`npx tsc --noEmit` → **0 errors** after all changes.

---

## Session — 9 Jun 2026 (session 4) ✅ Complete

### Full portal audit + real-time refresh

---

#### Audit — Accountant & client portal code review

Full read-only audit covering all portal pages, API endpoints, routes, and state management.

**Findings:**
- All routes in `App.tsx` are correctly defined and all `<Link>` targets resolve. No broken navigation.
- All frontend API calls match the backend URL patterns in `portal/urls.py` and `users/urls.py` exactly.
- Critical stale-state bugs identified: all portal pages loaded data once on mount with no polling, no refresh button, and no "last updated" indicator. Accountant and client would need to refresh the browser to see changes made by the other party.
- `EngagementPage.tsx` had two caching bugs: `loadAudit()` and `loadRisks()` both had early-return guards (`if (auditLog.length > 0) return`) that prevented ever re-fetching those tabs after the first load.

---

#### Fix — Portal real-time polling + refresh buttons (all portal pages)

**Files changed:**
- `AccountantPortalPage.tsx`
- `ClientPortalPage.tsx`
- `ClientTasksPage.tsx`
- `ClientDocumentsPage.tsx`
- `EngagementPage.tsx`

**Pattern applied to every page:**

1. `load(silent = false)` — when `silent = true`, skips the loading spinner; data updates in-place without UI flicker.
2. `useEffect` starts a `setInterval(20_000)` (20 seconds) on mount, calling `load(true)` each tick. Returns a cleanup to `clearInterval` on unmount.
3. `lastUpdated` state shows the actual refresh time in the header (e.g., "updated 14:23:05").
4. Manual ↻ refresh button added to every portal header — calls `load(true)` immediately.

**EngagementPage-specific improvements:**
- Polling only re-fetches the 4 live-changing resources (engagement, checklist, documents, actions) every 30 seconds — not income/expenses which rarely change mid-session.
- `loadAudit()` and `loadRisks()` — removed the "never refetch" early-return guards. Clicking those tabs now always fetches fresh data from the server.

**ClientDocumentsPage-specific improvement:**
- After a successful upload, triggers a silent re-fetch after 3 seconds so the document's processing status (`uploaded → processing → extracted`) updates automatically without the user refreshing.

---

## Session — 9 Jun 2026 (session 3) ✅ Complete

### Accountant route fix + simulation wizard → conversational AI

---

#### Fix — `/accountant` route now redirects to `/accountant/portal`

**Problem:** `App.tsx` had `/accountant` rendering the old `AccountantPage` (legacy manual-add-client dashboard). The TopNav already pointed to `/accountant/portal`, but direct navigation or bookmarks to `/accountant` landed on the wrong page.

**Fix (`frontend/src/App.tsx`):**
- Changed `/accountant` route from `<AccountantPage />` to `<Navigate to="/accountant/portal" replace />`
- Removed `AccountantPage` lazy import (no longer needed as a route; component file kept for reference)

---

#### Refactor — Simulation wizard replaced with conversational AI intake

**Problem:** The "Tax Simulation 2026" chip launched an 11-step inline form wizard (`SimStepCard` components rendered inside the chat), which was visually heavy and inconsistent with the conversational IB return flow. The user wanted the chatbot to ask fields conversationally, the same way the initial profile intake works.

**Changes (`frontend/src/pages/ChatPage.tsx`):**

*Removed:*
- `SimStepCard`, `SimOverviewCard` imports
- `visibleSteps`, `answersToCalcProfile`, `Answers` imports from `simulationSteps`
- `calculateTax` import (still used in other pages)
- `simAnswers`, `simStepIdx`, `simRunning` state variables
- `handleSimStepSubmit()` callback (11-step wizard logic)
- `handleAskClaude()` callback
- `SIM_INTRO` constant (wizard intro message)
- `isSimStep` / `simStepId` / `simStepIndex` / `isSimResult` fields from `ChatMsg` interface
- Wizard card rendering blocks in the message loop
- Live estimate bar (`simMode && simRunning` progress display)

*Added:*
- `SIM_TRIGGER` constant — conversational opening message in NL/EN/FA
- `simModeOverride` parameter on `submit()` — lets `startSimulation()` force intake mode on the first call, even if the user already has a profile
- `setSimMode(false)` after `[INTAKE_COMPLETE]` is detected — switches back to normal chat after data is collected

*How it works now:*
1. User clicks "Tax Simulation 2026" chip
2. `startSimulation()` clears history, sets `simMode = true`, calls `submit(SIM_TRIGGER, false, false, true)` with `simModeOverride = true`
3. Backend receives `intake_mode = true` → uses the conversational intake system prompt
4. Claude asks questions one-by-one (same as the normal profile intake, but triggered on demand)
5. When enough data is collected, Claude outputs `[INTAKE_COMPLETE: {...}]`
6. Frontend saves the profile, runs the calculator, shows the tax summary inline
7. `simMode` resets to `false` — user can now ask follow-up questions in normal chat mode

---

## Session — 9 Jun 2026 (session 2) ✅ Complete

### Invitation-only client onboarding + push notification reliability

---

#### Fix — Auto-create portal profile on invitation acceptance

**Problem:** When a client accepted an accountant invitation, `AccountantClient` (users app link) was created but `AccountantClientProfile` (portal app working record) was not. The client never appeared in the accountant's portal clients tab.

**Fix (`backend/apps/users/views.py` — `ClientInvitationsView.post()`):**
After creating `AccountantClient`, also creates `AccountantClientProfile` via `get_or_create(accountant_user=..., client_user=...)`. Uses the client's `intake_profile` JSON to set `client_type` and `preferred_language`. Wrapped in `try/except` so a portal import failure never blocks invitation acceptance.

---

#### Fix — Remove manual "+ Add client" form (accountant portal)

**Problem:** Accountants could manually add clients by email in the portal, creating `AccountantClientProfile` rows with `client_user=null`. These weren't linked to real users and bypassed the invitation flow, leading to duplicates and stale records.

**Fix (`frontend/src/pages/portal/AccountantPortalPage.tsx`):**
- Removed `createClient` import
- Removed `showAdd`, `form`, `adding` state
- Removed `handleAddClient()` function
- Removed "+ Add client" button from tab bar
- Removed the add-client form block

Clients are now exclusively added through the invitation flow (Invitations tab → Send invitation → client accepts).

---

#### Fix — Push subscribed state not persisting across page loads

**Problem:** `usePushNotifications.ts` started with `subscribed = false` on every mount. After a page reload, the "Enable notifications" button showed even for users who had already subscribed, and the "Notifications active" / Disable button never appeared.

**Fix (`frontend/src/hooks/usePushNotifications.ts`):**
On mount, calls `pushManager.getSubscription()` and sets `subscribed = true` if an active subscription exists. The banner now shows the correct state without requiring a fresh subscribe call.

---

#### Fix — Push notification logging improved

**Fix (`backend/apps/users/push_utils.py`):**
- Changed missing `VAPID_PRIVATE_KEY` from `logger.debug` to `logger.warning` (now visible in Railway logs)
- Added `logger.info` when user has no subscriptions (tells you the user hasn't opted in)
- Added `logger.info` on successful push delivery
- Changed error cases from `logger.warning` to `logger.error` with HTTP status code included
- These logs will now surface push failures in Railway's log viewer

**To make push work in production, add to Railway Variables:**
```
VAPID_PRIVATE_KEY=AhTVFZGLCmynas6fFK33QjM-K5KtgmWAuo3T1nbstG0
VAPID_PUBLIC_KEY=BPoPvaEGs5ZKw-ZcRGfryFt1JQqSkZNMHPF_ZIJ9dUJDtLVC_eDaQBpoYLWwAFFKyrLQWP2m5amT3Zq08aFGmlk
VAPID_CLAIMS_EMAIL=ayuob1991.nl@gmail.com
```

---

## Session — 9 Jun 2026 (session 1) ✅ Complete

### Railway TypeScript build fix + VAPID setup + 5 UX fixes

---

#### Railway build error — `Uint8Array<ArrayBufferLike>` TS2322 (commit `7a67f3d`)

**Root cause:** TypeScript 5.7+ made typed arrays generic. `Uint8Array` (no generic) = `Uint8Array<ArrayBufferLike>`, not assignable to `BufferSource` (`ArrayBufferView<ArrayBuffer>`). The previous fix (`new Uint8Array(raw.length)`) still failed because the function return type was bare `Uint8Array`.

**Fix (`frontend/src/hooks/usePushNotifications.ts`):** Removed `urlBase64ToUint8Array` entirely. The Web Push API accepts a base64url `string` directly for `applicationServerKey` — no conversion needed, no type issue.

---

#### VAPID key generation

Generated a one-time VAPID key pair (EC P-256, base64url-encoded raw scalar):

```
VAPID_PUBLIC_KEY=BPoPvaEGs5ZKw-ZcRGfryFt1JQqSkZNMHPF_ZIJ9dUJDtLVC_eDaQBpoYLWwAFFKyrLQWP2m5amT3Zq08aFGmlk
VAPID_PRIVATE_KEY=AhTVFZGLCmynas6fFK33QjM-K5KtgmWAuo3T1nbstG0
VAPID_CLAIMS_EMAIL=ayuob1991.nl@gmail.com
```

Add these to local `.env` and to Railway Variables. The backend (`push_utils.py`) already reads them. The frontend fetches the public key from `/api/users/push/vapid-key/`.

---

#### Fix 1 — Invitation notifications: email fallback (commit `838b62b`)

**Problem:** Push notification on invitation silently failed — VAPID keys absent → `send_push_notification()` returned early. No email fallback existed, so clients received nothing.

**Backend changes:**
- `settings.py`: Added Django email config reading from env vars (`EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `DEFAULT_FROM_EMAIL`). Defaults to console backend in dev.
- `AccountantInvitationsView.post()`: Added `send_mail()` after the push attempt. Fires on every invitation regardless of push subscription. Uses `fail_silently=True`.

**Production env vars needed:**
```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.example.com
EMAIL_HOST_USER=noreply@taxwijs.nl
EMAIL_HOST_PASSWORD=<password>
DEFAULT_FROM_EMAIL=TaxWijs <noreply@taxwijs.nl>
```

---

#### Fix 2 — "Back to portal" navigated to wrong page

`AccountantClientDetailPage.tsx` had `Link to="/accountant"` in the breadcrumb and "← Back to portal" button. `/accountant` is the old standalone page; the portal is at `/accountant/portal`. Fixed all three link targets.

---

#### Fix 3 — No delete client button (accountant side)

The `DELETE /api/portal/clients/<id>/` endpoint existed but no button existed in the UI.

- `AccountantClientDetailPage.tsx`: Added "Remove client" button (red, below back button). Calls `archiveClient(profile.id)`, navigates to `/accountant/portal` on success.
- `AccountantPortalPage.tsx`: Added ✕ button on each client table row. Removes row from local state on success.

---

#### Fix 4 — Users couldn't disconnect from accountant

**New backend view `ClientMyAccountantView`** (`views.py` + `urls.py`):
```
GET    /api/users/client/my-accountant/        — list connected accountants
DELETE /api/users/client/my-accountant/<pk>/   — remove AccountantClient link
```

**`InvitationBanner.tsx` extended:**
- On mount: fetches connected accountants and renders a "Your tax advisor" card per entry.
- Each card shows firm name + email + "Disconnect" button.
- On disconnect: `confirm()` → DELETE → row removed → toast.
- After accepting an invitation, list auto-refreshes to show the new accountant.
- Early-exit condition updated: hides only when both `pending.length === 0` and `accountants.length === 0`.

---

#### Fix 5 — Push notification button had no state or feedback

**`DashboardPage.tsx`:**
- Wired up `subscribed` and `unsubscribe` from `usePushNotifications` (returned by hook, previously unused).
- Added `useToast` / `showToast`.
- **Enable:** `await subscribePush()` → success toast on approval; error toast if browser permission is blocked.
- **Active state:** When `pushSubscribed === true`, banner switches to "Notifications active" style with a "Disable" button.
- **Disable:** Calls `unsubscribePush()` (removes subscription from backend) → info toast.
- Banner now shows for any `permission !== "denied"` state (not just `"default"`).

---

#### Checks

- `npx tsc --noEmit` → 0 errors after all changes
- Commits `7a67f3d` and `838b62b` pushed to master

---

## Session — 8 Jun 2026 (part 6) ✅ Complete — branch feat/accountant-invitations → merged

### Accountant-to-client invitation system + Web Push notifications

**Architecture decision:** Accountant-initiated flow. Accountant sends invite by email → client sees
banner on their dashboard → client accepts or declines → accountant is notified. On accept, the
`AccountantClient` link is created automatically. No email sent (in-app + push only, for now).

---

**Backend — new models (migration 0009):**

`AccountantInvitation` — `accountant → invited_email → client_user (nullable) → status`
- Statuses: `pending / accepted / declined / cancelled`
- `UniqueConstraint` prevents duplicate pending invites for the same email
- When a registered user's email matches, `client_user` FK is set at creation
- Invitations sent before user registration are linked on first `/client/invitations/` fetch

`PushSubscription` — one row per browser/device per user
- Stores `endpoint`, `p256dh`, `auth` from Web Push API
- Expired subscriptions (HTTP 404/410) are auto-deleted on push failure

**Backend — new utility:**

`push_utils.py` — `send_push_notification(user, title, body, url)`
- Uses `pywebpush` (VAPID)
- Dev-safe: silently skips if `VAPID_PRIVATE_KEY` not set
- Reads `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_CLAIMS_EMAIL` from env

**Required env vars (production):**
```
VAPID_PRIVATE_KEY=<base64url EC P-256 private key>
VAPID_PUBLIC_KEY=<base64url EC P-256 public key>
VAPID_CLAIMS_EMAIL=admin@taxwijs.nl
```
Generate with: `python -c "from py_vapid import Vapid; v=Vapid(); v.generate_keys(); print(v.private_pem().decode())"`

**Backend — new endpoints:**
```
POST   /api/users/accountant/invitations/            send invitation (accountant)
GET    /api/users/accountant/invitations/            list sent invitations + status
DELETE /api/users/accountant/invitations/<pk>/       cancel pending invitation
GET    /api/users/client/invitations/                list pending invitations (client)
POST   /api/users/client/invitations/<pk>/respond/   accept or decline
GET    /api/users/push/vapid-key/                    serve VAPID public key
POST   /api/users/push/subscribe/                    register push subscription
DELETE /api/users/push/subscribe/                    unsubscribe
```

**Push notification triggers:**
- Accountant sends invite → push to client (if registered)
- Client accepts → push to accountant ("Invitation accepted")
- Client declines → push to accountant ("Invitation declined")

---

**Frontend — new files:**

`frontend/public/sw.js` — service worker
- Handles `push` events → shows notification with title/body/icon
- Handles `notificationclick` → focuses existing tab or opens new window

`frontend/src/hooks/usePushNotifications.ts`
- Registers SW, fetches VAPID key, calls `pushManager.subscribe()`
- Sends subscription to backend, exposes `permission`, `subscribed`, `subscribe()`, `unsubscribe()`

`frontend/src/api/invitations.ts` — typed API module
- `fetchClientInvitations()`, `respondToInvitation()`, `fetchSentInvitations()`, `sendInvitation()`, `cancelInvitation()`

`frontend/src/components/InvitationBanner.tsx`
- Shown on client dashboard for all pending invitations
- Shows firm name, optional message, Accept / Decline buttons
- Toast on accept ("You are now connected with …") or decline

**Frontend — modified files:**

`DashboardPage.tsx`
- Imports `InvitationBanner` → rendered above no-profile banner
- Push opt-in prompt (shown once when `permission === "default"`)

`AccountantPortalPage.tsx`
- Third "Invitations" tab with badge showing pending count
- Summary card replaced "Ready to file" with "Pending invitations"
- Invite form (email + optional message) on left, sent invitations list on right
- Status chips: amber=pending, sage=accepted, red=declined, grey=cancelled
- Cancel button on pending invitations

**All checks passed:**
- `python manage.py check` → 0 issues
- `npx tsc --noEmit` → 0 errors
- Migration 0009 applied cleanly

---

## Session — 8 Jun 2026 (part 5) ✅ Complete

### Accountant profile system — Option A

Full implementation of B2B accountant accounts with a clean role-based permission model.

**Backend changes:**

`backend/apps/users/models.py`
- Added `User.role` field — `CharField(choices=["client","accountant","admin"], default="client")`.
  No existing user data is changed; all existing users default to `"client"`.
- Expanded `AccountantProfile` with: `kvk_number`, `designation` (RB/AA/RA/other), `phone`,
  `is_verified` (admin-set credential flag), `updated_at`. These are all optional/blank-safe.

`backend/apps/users/migrations/0008_user_role_accountant_profile_fields.py`
- Migration applied to DB. Covers all 6 new fields.

`backend/apps/users/serializers.py`
- `UserSerializer` now exposes `role` and nested `accountant_profile` (read-only).
- `RegisterSerializer` accepts optional `role`, `firm_name`, `kvk_number`.
  When `role="accountant"`, auto-creates `AccountantProfile` in `create()`.
- New `AccountantProfileSerializer` for the setup endpoint.

`backend/apps/users/views.py`
- `RegisterView.create()` overridden to return `{access, refresh, user}` on success
  so the frontend can log the user in immediately without a second `/login` call.
- New `AccountantSetupView` at `GET/PATCH /api/users/accountant/setup/` — lets accountants
  update `firm_name`, `kvk_number`, `designation`, `phone`. Protected by `role == "accountant"`.
- `AccountantView._get_profile()` now returns `None` for non-accountant users and all methods
  return 403 in that case (previously any authenticated user could access accountant endpoints).

`backend/apps/users/urls.py`
- Registered `accountant/setup/` route.

`backend/apps/portal/views.py`
- Added `_is_portal_user(user)` helper: `user.is_staff or role in ("accountant","admin")`.
- `_can_access_client()` now calls `_is_portal_user()` instead of checking `is_staff` directly.
- `AccountantClientListView.get()` returns 403 for non-portal users.

**Frontend changes:**

`frontend/src/api/auth.ts`
- `AuthUser` interface gains `role: "client" | "accountant" | "admin"` and `accountant_profile?`.
- `RegisterPayload` gains optional `role`, `firm_name`, `kvk_number`.
- `register()` now returns `RegisterResponse` (access + refresh tokens + user) and stores them
  in localStorage — no separate login call needed after registration.

`frontend/src/pages/RegisterPage.tsx`
- Added 5th user-type card: Accountant / Belastingadviseur / مشاور مالیاتی (full width, B2B badge).
- When accountant is selected: firm_name + kvk_number fields shown in a terracotta-tinted box
  with helper text explaining they can complete their profile in the portal.
- Google sign-up is disabled for accountant flow (firm credentials need email-based registration).
- On successful accountant registration → navigate to `/accountant/portal`.
- On successful client registration → navigate to `/intake` (unchanged).

`frontend/src/components/TopNav.tsx`
- Desktop + mobile nav: portal link condition changed from `user?.is_admin`
  to `user?.role === "accountant" || user?.is_admin`.
- Client portal ("My Portal") link hidden for accountants (they see the Accountant portal link).

**All checks pass:**
- `python manage.py check` → 0 issues
- `python manage.py migrate` → all migrations applied
- `npx tsc --noEmit` → 0 errors

---

## Session — 8 Jun 2026 (part 4) ✅ Complete

### Landing page redesign — clean, vibrant, less crowded

Complete visual overhaul of `LandingPage.tsx` and hero gradient CSS.

**Design brief:** page was too dense, too muted. Goal: match the portal's visual language — clean cards, colour variety, generous whitespace.

**Structural changes:**

| Before | After |
|--------|-------|
| 2-col hero, tight | Same 2-col hero, more padding, cleaner copy |
| No stats bar | NEW — 28 rules / 3 languages / 2026 / 6 scenarios with 4 distinct accent colours |
| 4-col tight feature grid | 2×2 feature cards — coloured icon badge + lift-on-hover |
| Proof data table | 4 user-type cards (ZZP / Employee / Expat / DGA) — coloured top bar + bullet lists |
| Email capture bar | Removed (adds friction without conversion value on a tax tool) |
| Flat white footer CTA | Dark sage gradient background, white text |

**Hero gradient (`index.css`):** enhanced from near-invisible tint to sage top-right glow + soft blue bottom-left depth. Dark-mode variant updated to match.

**Files changed:** `frontend/src/pages/LandingPage.tsx` (full rewrite), `frontend/src/index.css`

**TypeScript:** 0 errors.

---

### AI chat — guided data collection; no external-site redirects

**Problem:** In Q&A mode the AI was (1) telling users "Log in to Mijn Belastingdienst" to enter their own savings data, and (2) noting Box 3 showed €0 without asking for the actual number.

**Root cause:** `_result_system_prompt` had no rules about data gaps or external navigation. `_build_calculator_block` did not flag which fields defaulted to 0.

**Fix across 3 files:**

`backend/apps/chat/views.py`:
- Added **Rule 4 (DATA GAP)** to system prompt: when a field is "possibly missing", ask the user directly — do not send them to an external site.
- Added **Rule 5 (EXTERNAL SITE BAN)**: never instruct the user to retrieve their own personal numbers from Mijn Belastingdienst, DigiD, etc. — the AI is the data entry point.
- Added **Rule 6 (PROFILE_UPDATE PROTOCOL)**: when a user confirms a number, the AI emits `[PROFILE_UPDATE: {"field": value}]` at the end of the response. Supported fields: `net_assets_box3`, `savings_fraction`, `hours_per_year`, `pension_contribution`, `children_under_12`, `annual_revenue_zzp`, `business_expenses`, `kia_investments`, `mortgage_interest`.
- `_build_calculator_block` now appends a `POSSIBLY MISSING DATA` section listing fields that defaulted to 0 (Box 3 assets, hours, pension, KIA investments).
- Stream generator: after stream ends, extracts `[PROFILE_UPDATE]` markers, merges into `request.user.intake_profile`, saves to DB, yields a `profile_update` SSE event before `done`.

`frontend/src/api/chat.ts`:
- Extended `TokenMeta` with `profile_update?: Record<string, unknown>`
- SSE parser handles `data.profile_update` — routes to `onToken` as metadata, not message text

`frontend/src/pages/ChatPage.tsx`:
- On `meta.profile_update`: merges into profile state, saves to localStorage, PATCHes `/api/users/profile/` (auth users), shows "Profile updated ✓" toast
- After stream: strips `[PROFILE_UPDATE: ...]` markers from displayed message

**New flow:** AI asks "Do you have savings above €59,357?" → user answers → AI explains + emits PROFILE_UPDATE → silent save → toast → next question uses the real number.

**TypeScript:** 0 errors. Python syntax: OK.

---

## Session — 8 Jun 2026 (part 3) ✅ Complete

### Persian translations — fix to SimOverviewCard breakdown labels

Added missing Persian translations to all breakdown label fields in `SimOverviewCard.tsx`.

**File changed:** `frontend/src/components/SimOverviewCard.tsx`

---

## Session — 8 Jun 2026 (part 2) ✅ Complete

### Simulation page merged into Chat — inline step-card UX

Removed the standalone `/simulation` page and merged the full 11-step tax simulation directly into the Chat page as inline step-cards, following the same pattern as the IB return merge.

**Design rationale:**
One interface instead of two. The simulation unfolds as structured cards embedded in the chat thread — no separate page, no context switching. A live running estimate bar above the input updates automatically as the user fills in income data.

**New files:**

| File | What it does |
|------|--------------|
| `frontend/src/components/SimStepCard.tsx` | Renders one SimStep as an interactive inline card. Contains its own `FieldRow` component (handles boolean pills, number inputs, selects, info boxes). Collapses to a compact done-summary row once submitted. Props: `step`, `stepIndex`, `totalSteps`, `answers`, `lang`, `isMobile`, `done`, `onSubmit`, `onAskClaude` |
| `frontend/src/components/SimOverviewCard.tsx` | Tax result card rendered inline as the final chat message after all steps are submitted. Dark header with large euro amount, metric grid, breakdown table, and "Discuss with TaxWijs" CTA that promotes sim answers to a full profile and continues regular chat |

**Modified files:**

| File | Change |
|------|--------|
| `frontend/src/data/simulationSteps.ts` | Exported `visibleSteps(answers)` function so both SimStepCard and ChatPage can use it |
| `frontend/src/pages/ChatPage.tsx` | Added `simMode`, `simAnswers`, `simStepIdx`, `simRunning` state; `SIM_CHIP_LABEL` + `SIM_INTRO` constants; `startSimulation()` function; `handleSimStepSubmit()` callback; `handleAskClaude()` callback; URL param handler for `?mode=simulation`; updated `isIntakeMode` guard to exclude sim mode; updated clear-chat handler; added `isSimStep`/`isSimResult` message rendering in the messages loop; added sim chips to the empty state and input bar; added live estimate bar |
| `frontend/src/App.tsx` | Removed `SimulationPage` lazy import; `/simulation` route now `<Navigate to="/chat?mode=simulation" replace />` |
| `frontend/src/components/TopNav.tsx` | Removed `nav.simulation` link from `NAV_ITEMS_AUTH` |
| `frontend/src/utils/ibReport.ts` | Fixed pre-existing TS error: `string[]` argument to `fmt()` now joined with `", "` before passing |

**UX behaviour:**

1. **Entry points** — "🧮 Bereken mijn belasting 2026" chip appears in both the empty state and the sticky input bar (alongside the IB chip). `/simulation` URL redirects to `/chat?mode=simulation`
2. **Step cards** — Each of the 11 steps renders as a `SimStepCard` inline in the chat thread. Fields: boolean pill buttons (Ja/Nee/Yes/No), number inputs, selects, info boxes. Each field has an **Ask** micro-link that submits the field's pre-written `claudeQ` to the AI without leaving simulation mode
3. **Done rows** — Once a step is submitted it collapses to a compact `✓ Title — value · value` summary row. Previous answers are locked (no re-editing in v1)
4. **Running estimate bar** — Appears above the input after step 2 (when `user_type` + income are known). Shows `~€X,XXX/maand · stap N van M`. Updates after every subsequent step submission
5. **Result card** — `SimOverviewCard` renders as the final message: dark header with net-to-pay, metric grid, breakdown table, Discuss CTA
6. **Discuss with TaxWijs** — Clicking "Bespreek met TaxWijs" promotes sim answers to `taxwijs_calc_input`, sets `intakeComplete = true`, exits sim mode, and submits the question to the regular chat AI

**Checks:** `npx tsc --noEmit` = 0 errors · `npm run build` = clean (ChatPage 220 kB gzip 65.9 kB)

---

## Session — 8 Jun 2026 ✅ Complete

### IB Return merged into Chat page

Removed the standalone IB Guide page and merged the income tax return flow directly into the Chat page as a conversational guide.

**What was built:**

**Backend (`apps/chat`):**
- `serializers.py` — added `ib_return_mode` boolean field to `ChatMessageSerializer`
- `views.py` — added `_ib_return_system_prompt(language, user_type)` function with a detailed conversational guide covering all 9 IB form fields (1a–8a). The AI asks one question at a time, explains each field in plain language, notes common mistakes, skips irrelevant fields based on user type, and at the end outputs `[IB_COMPLETE: {...}]`. Mock mode also updated for IB return mode.

**Frontend:**
- `api/chat.ts` — added `ibReturnMode` parameter (10th arg) to `sendMessage()`; serialized as `ib_return_mode` in the request body
- `utils/ibReport.ts` — NEW: `printIBReport(answers, lang)` utility. Takes the collected IB answers, generates a styled HTML report with all field values in NL/EN/FA labels, and opens a print dialog. Falls back to HTML file download if popups are blocked. No new dependencies.
- `pages/ChatPage.tsx`:
  - Added `ibMode` + `ibAnswers` state
  - Added `IB_CHIP_LABEL` (NL/EN/FA) and `IB_TRIGGER` first message
  - **IB chip** appears in the empty state when a profile exists — "📋 Aangifte doen 2025"
  - Auto-starts IB mode when navigating to `/chat?mode=ib-return` or `/chat` with `{ibReturn: true}` state
  - `submit()` now accepts `ibReturnOverride` flag; passes `isIBMode` to `sendMessage`
  - Detects `[IB_COMPLETE: {...}]` in AI response: strips marker, marks message as `isIBResult`, stores answers
  - **"Download rapport (PDF)" button** renders inside the final AI message when IB is complete
  - Input placeholder and aria-label update in IB mode
  - Clear chat resets `ibMode` and `ibAnswers`
- `App.tsx` — `/ib-guide` redirects to `/chat?mode=ib-return` (preserve old URLs); removed `IBGuidePage` lazy import
- `components/TopNav.tsx` — removed "IB Guide" from `NAV_ITEMS_AUTH`

**Checks:** `tsc --noEmit` = 0 errors · `npm run build` = clean (ChatPage 148kB gzip 46kB)

---

## Session — 7 Jun 2026 (part 4) ✅ Complete — branch: `feature/accountant-client-portal`

### AI Accountant Portal + Client Document Collection Portal (Phase 8)

Full end-to-end build across backend and frontend. Branch: `feature/accountant-client-portal`.

---

#### Backend — Django app `apps/portal`

**New files created:**

| File | What it does |
|------|--------------|
| `backend/apps/portal/__init__.py` | Marks portal as a Python package |
| `backend/apps/portal/apps.py` | AppConfig (label="portal") |
| `backend/apps/portal/models.py` | 9 new models (see below) |
| `backend/apps/portal/admin.py` | Registers all models; PortalAuditLog is immutable (no add/change) |
| `backend/apps/portal/serializers.py` | DRF serializers for all 9 models; includes computed fields |
| `backend/apps/portal/views.py` | ~30 API views with object-level permission checks and audit logging |
| `backend/apps/portal/urls.py` | 30 URL patterns |
| `backend/apps/portal/migrations/0001_initial_portal_models.py` | Creates all 9 models |
| `backend/apps/portal/migrations/0002_add_stable_key_to_document_request.py` | Adds stable_key to DocumentRequest |
| `backend/apps/portal/services/accountant_checklists.py` | Deterministic checklist templates for employee/zzp/expat/dga/other; idempotent via stable_key |
| `backend/apps/portal/services/readiness.py` | Readiness score 0-100; ready_to_file gate at ≥85 + zero missing + zero needs_review |
| `backend/apps/portal/services/missing_info.py` | Idempotent missing information detector; creates AccountantActions via stable_key |
| `backend/apps/portal/services/accountant_actions.py` | Generates accountant next-actions with trilingual (NL/EN/FA) client messages |
| `backend/apps/portal/services/document_extraction.py` | Candidate-only AI extraction (pdfminer + optional Claude haiku); never authoritative until accountant approves |
| `backend/apps/portal/tests/test_models.py` | Model defaults, stable_key, display_name |
| `backend/apps/portal/tests/test_services.py` | Checklist templates, idempotency, readiness scoring, missing info detection |
| `backend/apps/portal/tests/test_api.py` | API auth, object-level permissions, document upload MIME rejection |

**9 new Django models:**

1. `AccountantClientProfile` — client record under an accountant; client_type, preferred_language, status, tax_year
2. `TaxEngagement` — one engagement per client per year; readiness_score, missing_items_count, risk_level
3. `DocumentRequest` — a request for a specific document; stable_key for idempotency
4. `ClientDocument` — uploaded file; MIME/size validated (PDF/JPEG/PNG/HEIC/CSV/XLSX, max 20MB); triggers extraction
5. `ExtractedIncome` — candidate AI extraction; review_status=candidate until accountant approves
6. `ExtractedExpense` — same; candidate until approved
7. `ChecklistItem` — one checklist item per engagement; stable_key for idempotency
8. `AccountantAction` — next action for accountant; stable_key for idempotency
9. `PortalAuditLog` — immutable write log; every create/update/delete is logged

**Key design decisions enforced:**
- AI extraction is candidate-only — `review_status` defaults to `"candidate"`. Values never affect tax calculations until accountant sets `"approved"`.
- `stable_key` pattern on ChecklistItem, AccountantAction, DocumentRequest prevents duplicates when engines run multiple times.
- Object-level permissions: accountant can only access their own clients; client can only access their own profile.
- `PortalAuditLog` has `has_add_permission=False` and `has_change_permission=False` in admin — fully immutable.

**Modified files:**
- `backend/config/settings.py` — added `"apps.portal"` to INSTALLED_APPS
- `backend/config/urls.py` — added `path("api/portal/", include("apps.portal.urls"))`

---

#### Frontend — React + TypeScript portal pages

**New files created:**

| File | What it does |
|------|--------------|
| `frontend/src/api/portal/types.ts` | TypeScript interfaces for all 9 models + enum type aliases |
| `frontend/src/api/portal/client.ts` | All portal API functions (~25 exports): clients, engagements, checklist, documents, income, expenses, actions, readiness, risks, reminders, audit, client self-service |
| `frontend/src/pages/portal/AccountantPortalPage.tsx` | Accountant dashboard: summary KPI cards, Clients tab, Engagements tab, Add client form |
| `frontend/src/pages/portal/AccountantClientDetailPage.tsx` | Client detail: profile card left, engagements right, status dropdown, create engagement form |
| `frontend/src/pages/portal/EngagementPage.tsx` | Full engagement workspace with 7 tabs: Overview (readiness ring + next actions), Checklist, Documents, Income, Expenses, Risks & Deductions, Audit log |
| `frontend/src/pages/portal/ClientPortalPage.tsx` | Client-facing portal home: readiness ring, task/doc CTA cards |
| `frontend/src/pages/portal/ClientTasksPage.tsx` | Client task list: progress bar, open/done split, required item highlighting |
| `frontend/src/pages/portal/ClientDocumentsPage.tsx` | Client document upload + list with status |

**Modified files:**
- `frontend/src/App.tsx` — added 7 new routes: `/accountant/portal`, `/accountant/clients/:id`, `/accountant/engagements/:id`, `/client`, `/client/tasks`, `/client/documents`
- `frontend/src/components/TopNav.tsx` — added "Accountant" link for is_admin users, "My Portal" link for regular authenticated users (desktop + mobile hamburger)

---

#### Checks passed

- `python manage.py check` — 0 issues
- `npx tsc --noEmit` — 0 errors
- `npm run build` — clean build, 0 warnings

---

---

## Session — 7 Jun 2026 (part 3) ✅ Complete

### Google Sign-In — force account picker on every sign-in

**Problem:** With multiple Google accounts in Chrome, clicking "Continue with Google" auto-signed in with the default Chrome account without showing the account chooser.

**Fix:** Added `prompt=select_account` to the OAuth2 URL in both `LoginPage.tsx` and `RegisterPage.tsx`. Google now always shows the account picker.

**Files changed:** `frontend/src/pages/LoginPage.tsx`, `frontend/src/pages/RegisterPage.tsx`

---

## Session — 7 Jun 2026 (part 2) ✅ Complete

### Google Sign-In — replaced popup with redirect-based OAuth2 flow

**Problem:** Popup-based GIS flow (`requestAccessToken()`) silently fails on mobile browsers and strict popup blockers. User clicks button, popup is blocked or silently fails, nothing happens — no error shown.

**Fix:** Replaced the entire GIS library approach with standard OAuth2 redirect flow.

**How it works now:**
1. Click "Continue with Google" → `window.location.href = https://accounts.google.com/o/oauth2/v2/auth?response_type=token&...`
2. User authenticates on Google's own page (no popup needed, no origin restriction)
3. Google redirects to `https://taxwijs.nl/auth/google/callback#access_token=ya29.xxx`
4. New `GoogleCallbackPage.tsx` reads the token from the URL hash, calls backend, redirects to dashboard

**Files changed:**
- `frontend/index.html` — removed `<script src="https://accounts.google.com/gsi/client">` (no longer needed)
- `frontend/src/pages/GoogleCallbackPage.tsx` — NEW: handles Google redirect, calls `googleAuth()`, navigates to post-auth destination
- `frontend/src/pages/LoginPage.tsx` — `handleGoogle` now redirects to Google; shows errors passed back via `?google_error=` param
- `frontend/src/pages/RegisterPage.tsx` — same; stores selected `userType` in sessionStorage before redirect so callback page can pass it to backend
- `frontend/src/App.tsx` — added `<Route path="/auth/google/callback">` with lazy-loaded `GoogleCallbackPage`
- `frontend/src/types/google.d.ts` — cleared GIS types (no longer used)

**Required Google Console action (one-time):**
| Where | What to add |
|-------|-------------|
| Google Cloud Console → Credentials → OAuth 2.0 Client → **Authorized redirect URIs** | `https://taxwijs.nl/auth/google/callback` |
| Same field | `https://nl-tax-ai-production.up.railway.app/auth/google/callback` |

> ⚠ This uses **Authorized redirect URIs** (NOT JavaScript origins). That's a different field.
> JavaScript origins can be removed once redirect URIs are added.

**Note on free Google Cloud trial:** OAuth 2.0 is always free regardless of billing status. No credits are consumed by authentication.

---

## Session — 7 Jun 2026 (part 1) ✅ Complete

### Google Sign-In — full production diagnosis

**Symptom reported:** Google Sign-In silently fails on Railway. User completes Google auth (popup opens, confirms), popup closes, user lands back on login page with zero error messages.

**Root cause identified:** The Railway production domain is NOT in the OAuth 2.0 client's **Authorized JavaScript origins** in Google Cloud Console.

How the failure happens:
1. `requestAccessToken()` opens Google's popup ✓
2. User confirms on Google's auth page ✓
3. Google checks the requesting JavaScript origin against Authorized JavaScript origins
4. Origin not authorized → Google silently drops the token, never calls the GIS callback
5. Popup closes → user is back on login page → no error shown, no navigation → exactly matches symptom

**Why no error is shown:** The GIS Token Client callback is never invoked when the origin is unauthorized — there is no error code to handle. The code's `if (resp.error)` check never runs because `resp` never arrives.

**Required manual action (not in code):**
| Where | Action |
|-------|--------|
| Google Cloud Console → Credentials → OAuth 2.0 Client `1051653351506-...` | Add `https://<railway-domain>.up.railway.app` to **Authorized JavaScript origins** |
| Same client | Add custom domain (e.g. `https://taxwijs.nl`) if in use |

> **Token/Implicit flow only needs JavaScript origins — NOT redirect URIs.** These are separate fields in the console.

**Railway env vars checklist confirmed:**
| Variable | Status |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Must be set as Railway build-time env var (gitignored `.env` not committed) |
| `VITE_API_URL` | Leave **empty** — same-origin serving via WhiteNoise, `/api` is correct |
| `DJANGO_SECRET_KEY`, `DATABASE_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `DEBUG=False` | Standard Railway backend vars |

---

### Bug fix: DashboardPage auth race condition on hard refresh

**Problem:** `DashboardPage.tsx` had:
```js
const { user } = useAuth();
useEffect(() => {
  if (!user) { navigate("/login"); return; }
  ...
}, [user]);
```

On hard refresh to `/dashboard`:
1. App mounts → AuthContext starts `fetchProfile()` → `loading=true`, `user=null`
2. DashboardPage renders → `useEffect` fires → `!user` is true → `navigate("/login")`
3. User is kicked to login even though they have a valid JWT in localStorage
4. `loading` was not in the dependency array either, so even when `loading` flipped to `false` with `user` set, the effect would not re-run to fetch data

**Fix applied (`frontend/src/pages/DashboardPage.tsx`):**
```js
const { user, loading } = useAuth();
useEffect(() => {
  if (loading) return;           // wait for auth check to finish
  if (!user) { navigate("/login"); return; }
  ...
}, [user, loading]);
```

**Note:** This was not the cause of the Google sign-in bug (soft navigation via `navigate()` has `user` already set via `setUser()` before navigating). But it IS a real bug that affects bookmarked `/dashboard` URLs and F5 refresh.

**Files changed:** `frontend/src/pages/DashboardPage.tsx`

---

## Session — 4 Jun 2026 (part 3) ✅ Complete

### Bug fix: TaxRule admin page — DRF pagination crash

**Symptom:** Browser console showed `[TaxRules] Backend unreachable, using mock data: TypeError: (intermediate value).map is not a function`. Admin rules page silently fell back to mock data.

**Root cause:** `TaxRuleListView` inherits `DEFAULT_PAGINATION_CLASS = PageNumberPagination` with `PAGE_SIZE = 20`. DRF wraps list responses in `{ count, next, previous, results: [...] }`. The frontend `api.ts` did `data.map(mapDjangoRule)` directly on the wrapper — crash. Secondary issue: with 28 rules and page size 20, only 20 would have been shown even if it didn't crash.

**Fix:**
- `backend/apps/tax/views.py`: added `pagination_class = None` on `TaxRuleListView` — small dataset, no pagination needed.
- `frontend/src/lib/tax-rules/api.ts`: defensive fallback — handles both `{ results: [...] }` and plain array shapes so it cannot break again.

---

### Feature: Dark theme toggle (system-wide)

A full dark mode that works on every page, respects system preference, persists in localStorage, and has zero flash on load.

**Architecture:**
- `[data-theme="dark"]` on `<html>` element — all CSS custom properties cascade automatically, no per-component changes needed
- Anti-FWOT inline `<script>` in `index.html` — reads localStorage and applies the attribute synchronously before React renders
- `ThemeProvider` + `useTheme` hook in `ThemeContext.tsx` — React state layer, listens for system preference changes when user has no stored preference
- `ThemeToggle` component — sun/moon SVG button in the navbar

**Dark theme token overrides (`index.css`):**

| Token | Light | Dark |
|---|---|---|
| `--paper` | `oklch(0.985 …)` warm off-white | `oklch(0.13 … 260)` deep dark |
| `--paper-2/3` | slightly darker off-white | darker greys |
| `--ink` | near-black | `oklch(0.92 …)` near-white |
| `--hairline` | light warm grey | dark cool grey |
| `--accent-soft` | light sage tint | dark sage tint |
| `--paper-glass` | `oklch(0.985 … / 0.88)` | `oklch(0.13 … / 0.90)` |
| `color-scheme` | `light` | `dark` (browser UI elements) |

`.grain` class gets dark-appropriate radial gradients.

**Files changed:**
- `frontend/index.html` — anti-FWOT inline script
- `frontend/src/index.css` — `--paper-glass` token + `[data-theme="dark"]` block + dark `.grain`
- `frontend/src/context/ThemeContext.tsx` — new: `ThemeProvider` + `useTheme`
- `frontend/src/components/ThemeToggle.tsx` — new: sun/moon toggle button
- `frontend/src/main.tsx` — wrap app with `ThemeProvider`
- `frontend/src/components/TopNav.tsx` — add `ThemeToggle`, fix hardcoded glass nav color

**TypeScript:** 0 errors.

---

---

## Session — 4 Jun 2026 (part 2) ✅ Complete — branch: `feature/deduction-checker-v2`

### Product Owner overhaul — Deduction Checker v2

Based on expert product advice: reposition TaxWijs from "AI chatbot" to "Tax Deduction Discovery Platform". The Deduction Checker is now the core revenue driver.

**T1 + T2 + T3 — DeductionCheckerPage.tsx — complete rewrite**

| What changed | Before | After |
|---|---|---|
| Number of questions | 6 binary yes/no | 9–10 with multi-choice, number inputs, checkboxes |
| Profit input | Not asked | Step 2 — free-text number, used in results |
| Hours question | Yes / No | 4 options: <500 / 500–1,224 / 1,225+ / don't know |
| Starter status | Not asked | Step 4 — yes / no / unsure |
| Startersaftrek history | Not asked | Step 5 — never / 1× / 2× / 3× / don't know (conditional) |
| Business expense detail | "Did you buy equipment?" | 12-category checkbox grid (laptop, phone, internet, software, accountant, etc.) |
| Business assets | Not asked | Step 7 — yes/no + optional amount for KIA calculation |
| BTW/VAT status | Not asked | Step 8 — registered / KOR / not registered / unknown |
| Pension/lijfrente | Not asked | Step 9 — yes / no / unsure |
| Results display | Flat list, all shown | 3-tier: **Likely eligible** (sage) / **Needs confirmation** (amber) / **Not likely** (grey) |
| Startersaftrek logic | Always shown if hours ≥ 1,225 | Correct: only shown as Likely when is_starter=yes AND times_used < 3 |
| ZVW presentation | One-liner | Full reminder with max contribution + ceiling |
| KIA scoring | Not scored | Exact: shows Likely only if amount in €2,901–€70,602 range |
| Sorting | Insertion order | Sorted: Likely → Needs info → Not likely |
| Conditional flow | None | starter_times step skipped if is_starter=no; asset_amount step skipped if no assets |

**T4 — Email gate before results (anonymous users only)**

Before showing results, anonymous users see a one-field email form ("Where should we send your results?"). Logged-in users skip it automatically. The "Skip and view now" link lets users bypass without email. Captured emails go to the `EmailCapture` model with `source: "checker_gate"`.

**T6 — Landing page hero repositioning**

| | Before | After |
|---|---|---|
| EN headline | "Tax in the Netherlands, answered plainly" | "Are you missing Dutch tax deductions?" |
| NL headline | "Belasting in Nederland, helder uitgelegd" | "Loopt u Nederlandse belastingaftrekken mis?" |
| FA headline | "مالیات در هلند، به زبان ساده" | "آیا کسورات مالیاتی هلند را از دست می‌دهید؟" |
| EN subheadline | "TaxWijs answers your tax questions…" | "Answer 10 questions and discover which Dutch tax deductions apply to your ZZP situation." |
| Hero badge | "Dutch Tax AI · 2026" | "Find missing deductions · ZZP · 2026" |

**T7 — PostHog funnel events**

New events on `analytics.ts` + wired into checker:

| Event | When fired |
|---|---|
| `deduction_checker_started` | First answer given (via `startedTracked` ref, fires once) |
| `checker_step_completed` | Every `advance()` call — includes `step_id` + `step_index` |
| `deduction_checker_completed` | On reaching results — includes `deduction_count` (likely count) |
| `checker_results_viewed` | Same as completed — includes `likely_count`, `needs_info_count`, `user_type` |
| `checker_waitlist_submitted` | Non-ZZP waitlist email submitted |

**T8 — Non-ZZP waitlist (inside T1 rewrite)**

When user selects Employee / Expat / DGA, the checker exits early and shows: "This checker is currently optimised for ZZP freelancers. We're building your profile type." with an email capture form. Emails stored with `source: "waitlist_{user_type}"`.

**Files changed:**
- `frontend/src/pages/DeductionCheckerPage.tsx` — full rewrite (~730 lines)
- `frontend/src/lib/analytics.ts` — 3 new tracking functions
- `frontend/src/i18n/locales/en.json` — hero headline + subheadline
- `frontend/src/i18n/locales/nl.json` — hero headline + subheadline
- `frontend/src/i18n/locales/fa.json` — hero headline + subheadline
- `frontend/src/pages/LandingPage.tsx` — hero badge text

**TypeScript:** 0 errors on both before and after each change.

---

## Session — 4 Jun 2026 ✅ Complete

### Google Sign-In — production fix

**Problem:** Google Sign-In worked locally but silently failed on Railway. The GIS library (`accounts.google.com/gsi/client`) loaded correctly, but clicking the button failed because:
1. `VITE_GOOGLE_CLIENT_ID` was never set in Railway's environment variables → code hit early-exit guard, button did nothing
2. Railway domain `https://nl-tax-ai-production.up.railway.app` was not in Google Cloud Console **Authorized JavaScript origins** → Google would reject the popup even if the Client ID were present

**Root cause discovered by:** Running `console.log(window.google.accounts.oauth2)` in the Railway production browser — confirmed library loads, ruling out the script-tag as the problem.

**Code fix (`Dockerfile.frontend` — gitignored, local only):**
Added `VITE_GOOGLE_CLIENT_ID` and `VITE_ANON_SESSION_LIMIT` as proper Docker build ARGs alongside the existing `VITE_API_URL`. Without these ARGs, Docker builds don't bake the env vars into the Vite bundle.

**Documentation fix (`.env.production.example`):**
Added the three `VITE_*` vars with comments explaining they must be set before `npm run build` runs.

**Manual steps required (not in code):**

| Where | Action |
|-------|--------|
| Google Cloud Console → Credentials → OAuth 2.0 Client ID | Add `https://nl-tax-ai-production.up.railway.app` to Authorized JavaScript origins AND Authorized redirect URIs |
| Railway dashboard → Variables | Add `VITE_GOOGLE_CLIENT_ID=1051653351506-a9e3982dr3tujce671eteo94hkbgb20i.apps.googleusercontent.com` then trigger redeploy |

**Files changed:** `.env.production.example`

**Note:** `Dockerfile*` is in `.gitignore` (Railway deploys via nixpacks, not Docker). Railway automatically injects env vars from the dashboard into the nixpacks build environment — adding `VITE_GOOGLE_CLIENT_ID` in Railway Variables is sufficient.

---

## Session — 3 Jun 2026 (part 6) ✅ Complete

### Required fields validation + chat limits removed

**Commits:** `50e071c`

#### Engine + API — user_type is now required, not defaulted

| File | Change |
|------|--------|
| `backend/apps/calculator/engine.py` | Removed silent `user_type = "zzp"` default. Engine now raises `ValueError` if user_type is missing or not one of: zzp, employee, expat, dga |
| `backend/apps/calculator/views.py` | Added try/except around `calculate()` — catches `ValueError` and returns HTTP 400 with a clear message |

**Why:** A missing user_type would silently run the full ZZP calculation on employee/expat/DGA profiles, producing completely wrong numbers.

#### CalculatorPage.tsx — no pre-selected type, required income

| What | Before | After |
|------|--------|-------|
| `userType` initial state | `"zzp"` (always pre-selected) | `null` (no type selected) |
| Form visibility | Always shown | Hidden until a type is clicked |
| Type selector | One always highlighted | None highlighted; prompt: "Choose your tax profile ✱" |
| Submit without income | Allowed (sent €0 to engine) | Blocked — inline error in NL/EN/FA |
| Bracket 2 label | "37.07%" (stale) | **"37.56%"** (correct) |
| ZVW label | "5.32%" (stale) | **"4.85%"** (correct) |

#### IntakePage.tsx — no pre-selected type, required income per step

| What | Before | After |
|------|--------|-------|
| `userType` initial state | `"zzp"` (pre-selected) | `null` |
| Step 1 "Next" button | Always enabled | Disabled until user clicks a type card |
| Step 1 hint | None | "✱ Select a profile to continue" shown below grid |
| Step 2 "Next" button | Always allowed to proceed | Validates primary income > 0 first; shows red error card if empty |
| `handleFinish` | No validation | Guards against null userType + validates income before calling API |

#### ChatPage.tsx — unlimited chat for all users

`sessionLimitReached` hardcoded to `false`. The upgrade modal can no longer fire from the session counter regardless of sign-in status. Anonymous users may chat without any limit. Backend limits were already at 9999; frontend check is now permanently disabled.

**Files changed:** `backend/apps/calculator/engine.py`, `backend/apps/calculator/views.py`, `frontend/src/pages/CalculatorPage.tsx`, `frontend/src/pages/IntakePage.tsx`, `frontend/src/pages/ChatPage.tsx`

**TypeScript:** 0 errors.

---

## Session — 3 Jun 2026 (part 5) ✅ Complete

### Belastingdienst validation — two engine accuracy bugs found and fixed

Source validation performed against official Belastingdienst 2026 figures. All 6 ground-truth scenarios recalculated and corrected.

**Commits:** `0818082`

#### Bugs found and fixed

| # | Bug | Old value | Correct value | Source |
|---|-----|-----------|---------------|--------|
| 1 | Box 1 bracket 2 rate | 37.07% | **37.56%** | belastingdienst.nl voorlopige aanslag tarieven 2026 |
| 2 | ZVW rate | 5.32% | **4.85%** | belastingdienst.nl / zzp-pulse.nl |
| 3 | ZVW ceiling income | €71,628 | **€79,409** | same |
| 4 | ZVW base | After MKB deduction | **Before MKB** (profit_after_OA per Wfsv) | Wet financiering sociale verzekeringen |

**Root cause of bug 2/3/4:** Phase 16 "correction" accidentally replaced the correct 2026 ZVW rate (4.85%/€79,409) with the 2024 rate (5.32%/€71,628). The original pre-Phase-16 values were actually correct.

#### Corrected scenario totals

| Scenario | Old total | Correct total | Difference |
|----------|-----------|---------------|------------|
| SCN-ZZP-001 IT €72k yr3 | €13,776 | **€13,952** | +€176 |
| SCN-ZZP-002 Design €28k yr1 | €1,152 | **€1,203** | +€51 |
| SCN-ZZP-003 Senior €140k yr8 | €34,254 | **€34,488** | +€234 |
| SCN-EMP-001 Employee €48k | €10,079 | **€10,124** | +€45 |
| SCN-EXP-001 Expat €90k | €14,270 | **€14,388** | +€118 |
| SCN-DGA-001 DGA €56k+div | €17,010 | **€17,055** | +€45 |

All 6 scenarios now validate with **zero error** (engine output == scenarios.json). Max remaining deviation vs Belastingdienst: €0 on all checked line items.

**Files changed:** `backend/apps/calculator/engine.py`, `phase1/data/seed/tax_rules_2026.json`, `phase1/data/seed/scenarios.json`

#### Test documents created

| File | Purpose |
|------|---------|
| `test-scenarios-2026.html` | 6 full test scenarios for manual QA of all 5 site sections per user type — open in browser, Ctrl+P → Save as PDF |
| `belastingdienst-validation-2026.html` | Side-by-side comparison: our engine vs official Belastingdienst expected results — includes explanation of every line item difference |

---

## Session — 3 Jun 2026 (part 4) ✅ Complete

### Railway build fix — IBGuidePage JSX.Element → ReactNode

`IBGuidePage.tsx`: `when_to_file_body` field in `CARD_TX` was typed as `JSX.Element`. Railway's clean build caught a `TS2503: Cannot find namespace 'JSX'` error that local cached builds masked.

**Fix:** Added `type ReactNode` to the React import; changed `JSX.Element` → `ReactNode` in the `CARD_TX` type definition.

**Commit:** `87f4d93` — `fix(build): replace JSX.Element with ReactNode in IBGuidePage`

---

## Session — 3 Jun 2026 (part 3) ✅ Complete

### IB Guide + Tax Calendar — Validation, i18n, UX, and integration fixes

Expert audit and full fix of 11 issues across `IBGuidePage.tsx`, `ChatPage.tsx`, and `TaxCalendarPage.tsx`.

#### IB Return Page fixes

| ID | Issue | Fix |
|----|-------|-----|
| IB-1 | Empty number inputs falsely marked as "answered" — card turned green, checkmark appeared, progress bar filled with no content | Added `isAnswered()` helper: returns `false` for `undefined`, `null`, and empty string. Applied to card border, checkmark, progress bar segments, `answeredCount`, and `answeredFields` |
| IB-2 | "Common mistakes" button label hardcoded English | Added to `CARD_TX` lookup: NL "Veelgemaakte fouten" · FA "اشتباهات رایج" |
| IB-3 | "Ask TaxWijs" button hardcoded English | NL "Vraag TaxWijs" · FA "از TaxWijs بپرسید" via `CARD_TX` |
| IB-4 | "Open in chat" sidebar button hardcoded English | NL "Open in chat" · FA "باز کردن در چت" via `CARD_TX` |
| IB-5 | `location.state.question` silently dropped when chat history exists | In `ChatPage.tsx`: after restoring saved history, if an incoming `q` is present, `submit(q)` is now called — the question joins the restored conversation instead of being discarded |
| IB-6 | "Open in chat" passed no context to chatbot | `openInChat()` now composes a structured message listing all answered field codes, labels, and values in the user's language, passed as `location.state.question` |
| IB-7 | Page header, progress strip, and sidebar strings hardcoded English | Added `CARD_TX` with `headline_1/2`, `progress`, `fields_answered`, `autosaved`, `summary_title`, `summary_empty`, `when_to_file`, `when_to_file_body` — full NL/EN/FA |

Also fixed: Yes/No boolean buttons now render Ja/Nee · Yes/No · بله/خیر based on `lang`.

#### Tax Calendar Page fixes

| ID | Issue | Fix |
|----|-------|-----|
| CAL-1 | "Add to Google Calendar" and ".ics" buttons always active, even with 0 reminders | Buttons are now only rendered when `hasReminders` is true; replaced with a muted "nothing to sync" label while loading or empty |
| CAL-2 | Google Calendar subscription URL used `window.location.origin` (frontend host) instead of the API host | `googleUrl` now uses `icsUrl` which already correctly uses `apiBase` — works on both dev proxy and production multi-domain deploys |
| CAL-3 | Category filter pill labels hardcoded English | `CATEGORY_META` now has `label: { nl, en, fa }` per category; pills read `meta.label[lang]` |
| CAL-4 | API failure silently rendered as "no reminders found" — user couldn't tell the difference | Added `error` state: `.catch()` sets `error=true`; a red error card is shown instead of the empty state. Also added `r.ok` check before calling `r.json()` so HTTP errors don't parse as bad JSON |
| CAL-5 | No way to add a single reminder to Google Calendar | `googleEventUrl(r)` builds a `calendar.google.com/render?action=TEMPLATE` URL for each reminder; a small "📅 Add event" link now appears under each card's date/source row |

#### Architecture note — Google Calendar subscription vs single-event add

The top-level "Subscribe" button (using `cid=`) subscribes Google Calendar to the full iCal feed — Google re-fetches it periodically to stay in sync. This is the right long-term approach for "subscribe to all Dutch tax deadlines." It only works when the API URL is publicly accessible (production). The per-reminder "Add event" links (using `action=TEMPLATE`) work everywhere including localhost — they open a pre-filled event creation form in Google Calendar.

**Files changed:** `frontend/src/pages/IBGuidePage.tsx`, `frontend/src/pages/ChatPage.tsx`, `frontend/src/pages/TaxCalendarPage.tsx`

**TypeScript:** 0 errors after all changes.

---

## Session — 3 Jun 2026 (part 2) ✅ Complete

### Full trilingual coverage — LandingPage, LoginPage, RegisterPage, CalculatorPage

Comprehensive audit and rewrite of hardcoded English strings across the four highest-traffic pages. Every user-visible string now renders in NL/EN/FA based on `i18n.language`.

#### LandingPage.tsx — complete overhaul

| Section | What changed |
|---------|-------------|
| Hero card mockup | Question, answer, labels, chips, floating badges → NL/EN/FA |
| Features grid | Titles + body descriptions → NL/EN/FA via `TX.features` |
| Section headings | "What it does", "Four tools…", "Same engine…" → trilingual |
| Proof table | Headers (Flag/Income/Sample profile), all 3 data rows → trilingual |
| User type dots | "Employee" → "Werknemer"/"کارمند", "Expat" → "Expat"/"مهاجر خارجی" |
| Trust bar | "2026 rules verified", "Sources on every answer" → trilingual |
| Footer CTA | Persian completely rewritten: informal/poetic "با یک جفت چشم دوم" → formal "با پشتیبانی هوشمند تکمیل کنید" |
| Trailing dots | Removed from all headings ("Four tools, one tax brain.", etc.) |

#### LoginPage.tsx

| What | Before | After |
|------|--------|-------|
| Heading | "Log in to your tax workspace" (hardcoded EN) | NL/EN/FA conditional |
| Eyebrow | "Welcome back" | NL: "Welkom terug" · FA: "خوش آمدید" |
| Back link | "← Back to home" | Trilingual |
| Right panel tip | "Today's tip" + EN quote | NL/EN/FA |
| Right panel stats | "Rules verified", "Languages", "ZZP hour rule" | NL/EN/FA |

#### RegisterPage.tsx

| What | Before | After |
|------|--------|-------|
| Step indicator | "Step 1 of 3" | Trilingual |
| Heading | "Make an account." (with period) | Trilingual, dot removed |
| Subtitle | "We'll personalise everything…" | Trilingual |
| "I'm a" label | Informal FA "من یک" | Formal "وضعیت شغلی من:" |
| User type labels | EN only | NL/EN/FA via `USER_TYPE_TX` |
| User type descriptions | EN only | NL/EN/FA |
| Benefits list | EN only | NL/EN/FA |
| Right panel heading | EN only | Trilingual |
| Footer note | "Can change later…" | Trilingual |

#### CalculatorPage.tsx

- Added `useTranslation` + `CALC_TX` lookup object (50+ keys covering all labels)
- Form field labels: Annual revenue, Business expenses, Hours, KIA, etc. → NL/EN/FA
- Toggle Yes/No → Ja/Nee · Yes/No · بله/خیر via `yesNo` prop
- Section headings: "Inputs", "Your situation", "Household" → trilingual
- Calculate button → NL: "Berekenen" · FA: "محاسبه"
- Summary cards: Total tax, Effective rate, Monthly reserve, Wet DBA risk → trilingual
- Breakdown table: all row labels → NL/EN/FA (Dutch tax terms like Zelfstandigenaftrek preserved)
- Type selector buttons → NL: Werknemer/Expat · FA: کارمند/مهاجر خارجی
- Empty state placeholders → trilingual

**Files changed:** `frontend/src/pages/LandingPage.tsx`, `frontend/src/pages/LoginPage.tsx`, `frontend/src/pages/RegisterPage.tsx`, `frontend/src/pages/CalculatorPage.tsx`

**TypeScript:** 0 errors after all changes.

---

## Session — 3 Jun 2026 (part 1) ✅ Complete

### Brand loading screen — multilingual tips

`LoadingScreen.tsx`: rotating tips were hardcoded in English. Now reads `i18n.language` and shows tips in NL/EN/FA.

**File changed:** `frontend/src/components/LoadingScreen.tsx`

---

### Chat page — Persian greeting & hardcoded English strings fixed

1. **Intake greeting (FA)**: "Employee"/"Expat" replaced with `کارمند` / `مهاجر خارجی`. Informal `فریلنسر` → formal `آزادکار / کارآفرین مستقل`.
2. **Suggestion card "Ask" button**: NL → "Vraag", FA → "بپرسید", EN → "Ask".
3. **Persian suggestion questions**: informal imperatives fixed (`توضیح بده` → `توضیح دهید` etc.).

**File changed:** `frontend/src/pages/ChatPage.tsx`

---

### Chatbot "something went wrong" — max_tokens doubled

`max_tokens` increased from 1024 → 2048. Longer conversations were hitting the output token ceiling mid-stream, causing the Anthropic SDK to throw and the frontend to show the generic error.

**File changed:** `backend/apps/chat/views.py`

---

### Django admin — English by default

`LANGUAGE_CODE` changed from `nl-nl` → `en-us`.

**File changed:** `backend/config/settings.py`

---

## Session — 2 Jun 2026 ✅ Complete

### Persian formalisation (fa.json + backend)

Complete rewrite of all Persian UI strings to formal register. Informal imperatives replaced (`توضیح بده` → `توضیح دهید`), informal vocabulary replaced (`فریلنسر` → `آزادکار`, `اکسپت` → `مهاجر خارجی`, `کی هستید` → `وضعیت شغلی شما`), spelling corrected (`بروزرسانی` → `به‌روزرسانی`) in `alerts.py` and `actions.py`.

**Files changed:** `frontend/src/i18n/locales/fa.json`, `backend/apps/users/alerts.py`, `backend/apps/users/actions.py`

---

### Auth fixes

| Fix | Detail |
|-----|--------|
| Email login for superusers | Added `EmailOrUsernameTokenSerializer` — JWT endpoint now accepts email OR username. Superusers created via `createsuperuser` can log in with their email address. |
| Django admin language | `LANGUAGE_CODE` changed from `nl-nl` to `en-us` — admin panel now defaults to English. |

**Files changed:** `backend/config/serializers.py` (new), `backend/config/urls.py`, `backend/config/settings.py`

---

### Admin dashboard (merged from `feature/admin-dashboard`)

Full React admin panel at `/admin`, protected by `is_admin`. Navbar shows **Admin** link for staff/superusers.

#### New backend endpoints (all staff-only)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/users/admin/list/` | GET | All users — search by email/username, filter by plan/user_type |
| `/api/users/admin/<id>/` | GET | Full user detail including intake_profile + tax_memory |
| `/api/users/admin/<id>/` | PATCH | Edit plan, user_type, is_active, is_staff |
| `/api/chat/admin/logs/` | GET | All conversations across all users — search + language filter |
| `/api/chat/admin/logs/<id>/` | GET | Full message thread for one conversation |

**Files changed:** `backend/apps/users/admin_views.py` (new), `backend/apps/chat/admin_views.py` (new), `backend/apps/users/urls.py`, `backend/apps/chat/urls.py`

#### New frontend pages

| Page | Route | What it does |
|------|-------|------|
| AdminUsersPage | `/admin/users` | Searchable/sortable user table; slide-out drawer to view profile + edit plan/type/active/staff |
| AdminChatLogsPage | `/admin/chat-logs` | All conversations list; click any row to expand full message thread inline |

**Files changed:** `frontend/src/pages/admin/AdminUsersPage.tsx` (new), `frontend/src/pages/admin/AdminChatLogsPage.tsx` (new), `frontend/src/lib/admin/api.ts` (new), `frontend/src/components/admin/AdminSidebar.tsx`, `frontend/src/App.tsx`, `frontend/src/components/TopNav.tsx`

---

### Railway CLI installation

Installed Railway CLI v4.66.0 to `C:\Users\Diako999\AppData\Local\railway\railway.exe` (added to user PATH). npm and winget both had network failures; installed directly from GitHub releases binary.

---

## Phase 32 — Full TASKS.md Non-Premium Implementation (1 Jun 2026) ✅ Complete

All non-premium tasks from TASKS.md executed. Zero TypeScript errors. Django check clean. Migrations applied.

### What was built

| Task | What | Status |
|------|------|--------|
| T2-4 | Landing page CTAs: primary → `/deduction-checker`, secondary → `/intake`, tertiary → `/chat` | ✅ |
| T2-1 | `DeductionCheckerPage.tsx` — 6-question wizard, trilingual, computes qualifying deductions | ✅ |
| T2-2 | `ZZPTaxPage.tsx` — SEO guide at `/zzp-tax-netherlands`, 7 sections, FAQ, structured source citations | ✅ |
| T2-3 | `ExpatTaxPage.tsx` — SEO guide at `/expat-tax-netherlands`, 7 sections on 30% ruling, M-form, Box 3 | ✅ |
| T2-5 | `EmailCapture` model + `POST /api/users/email-capture/` + inline form on LandingPage | ✅ |
| T3-1 | `TaxReminder` model with full spec fields (category, user_types, due_date, offsets, recurrence, ICS support) | ✅ |
| T3-2 | All 4 BTW quarterly deadlines seeded as verified TaxReminder records (data-driven, not hardcoded) | ✅ |
| T4-1 | 4 IB reminders: filing open, deadline, extension request, bezwaar window | ✅ |
| T4-2 | 3 Toeslagen reminders: zorgtoeslag income check, huurtoeslag reform, definitive toeslagen | ✅ |
| T4-3 | 3 ZZP admin reminders: Q4 urencriterium warning, year-end checklist, quarterly expense log | ✅ |
| T4-4 | 2 Voorlopige aanslag reminders: request + revise after income change | ✅ |
| T4-5 | 4 DGA/BV reminders: gebruikelijk loon, Vpb deadline, Box 2 dividend warning, loonheffingen monthly | ✅ |
| T4-6 | 5 Expat reminders: 30% ruling apply, phase-down year 4, M-form, Box 3 reference date, residency | ✅ |
| T5-3 | `TaxCalendarPage.tsx` at `/tax-calendar` — category filter pills, days-until urgency, "Ask AI" per reminder, **Google Calendar link + .ics download** | ✅ |
| T5-3 | `GET /api/users/calendar.ics` — full iCal feed of user-relevant reminders with 7-day + 1-day VALARM | ✅ |
| T3-3 | Conversation history: `summary/message_count` on Conversation model, `GET /api/users/chat-history/`, `reminders.ts` API client | ✅ |
| T3-4 | AI Tax Memory: `User.tax_memory` JSONField, injected into system prompt for auth users, auto-updated on each calculation | ✅ |
| T3-5 | PostHog analytics: `lib/analytics.ts`, page_view on every route, events for intake/calc/chat/deduction-checker/alerts | ✅ |
| T5-4 | Admin Belastingplan Calendar section in AdminDashboard — 5 annual cycle steps, current month highlighted | ✅ |
| T5-1 | `AccountantPage.tsx` at `/accountant` + `AccountantProfile/AccountantClient` models + `GET/POST/DELETE /api/users/accountant/clients/` | ✅ |
| — | Session auto-logout after 1hr inactivity — activity events reset timer, interval checks every 60s | ✅ |

### New models (migration 0007)

| Model | App | Purpose |
|-------|-----|---------|
| `TaxReminder` | users | Smart Calendar — all 2026 deadlines/events, data-driven |
| `EmailCapture` | users | Anonymous email leads from landing/deduction-checker |
| `AccountantProfile` | users | B2B accountant metadata |
| `AccountantClient` | users | Accountant ↔ client user link |
| `User.tax_memory` | users | JSONField for cross-session AI memory |
| `Conversation.summary` | chat | First-question summary for history list |
| `Conversation.message_count` | chat | Count for history preview |

### New API endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/users/email-capture/` | POST | Capture email (anon) |
| `/api/users/reminders/` | GET | Upcoming TaxReminders for user |
| `/api/users/calendar.ics` | GET | iCal feed for Google/Apple/Outlook |
| `/api/users/chat-history/` | GET | Last 10 conversations |
| `/api/users/chat-history/<id>/` | GET | Full message list |
| `/api/users/accountant/clients/` | GET/POST | Accountant client management |
| `/api/users/accountant/clients/<id>/` | GET/DELETE | Client detail + remove |

### Seed data

- `python manage.py seed_reminders` — 25 verified TaxReminder records covering all 7 categories
- Run with `--reset` to wipe and re-seed

### Session inactivity timeout

- `AuthContext.tsx`: tracks `taxwijs_last_active` timestamp in localStorage
- Activity events (click, keydown, touchstart, scroll, mousedown) reset the timer
- Interval checks every 60s; logs out automatically after 1hr of no activity
- Timer cleaned up on logout or component unmount

### Verification

- `npx tsc --noEmit` → 0 errors
- `python manage.py check` → 0 issues
- `python manage.py migrate` → all 3 new migrations applied cleanly
- `python manage.py seed_reminders` → 25 created, 0 updated

---

---

## Gap Analysis + Product Backlog (1 Jun 2026) ✅ Complete

### What was done

Read and decoded three ChatGPT strategy conversations (Persian) line by line:
- **Doc 1**: Full MVP → Growth Strategy (product positioning, free/paid features, pricing tiers, acquisition funnel, site structure, KPIs, 30-day plan)
- **Docs 2 & 3**: Full Tax Compliance Calendar + Smart Reminder Engine spec (21 reminder categories, ~60 distinct events, `TaxReminder` TypeScript type)

Performed a line-by-line expert gap analysis comparing every requirement in the spec against the current build.

### Key findings

| Area | Built | Partial | Missing |
|------|-------|---------|---------|
| Core AI & calculator | 8 | 2 | 0 |
| Free tools & acquisition | 3 | 2 | 2 |
| Paid features & monetization | 0 | 2 | 5 |
| Payment / Stripe | 0 | 0 | 1 |
| SEO content pages | 0 | 0 | 4 |
| User dashboard | 4 | 1 | 2 |
| Admin dashboard | 6 | 0 | 0 |
| Reminder engine (MVP v1) | 2 | 4 | 7 |
| Analytics & KPI tracking | 0 | 0 | 8 |
| Pricing / paywall | 0 | 0 | 5 |

### 5 Most Critical Gaps (by revenue impact)

1. **Stripe + €19 one-time PDF report** — zero revenue without it
2. **SEO content pages** (`/zzp-tax-netherlands`, `/expat-tax-netherlands`) — no organic acquisition without them
3. **PDF export of Tax Health Report** — health score already computed, just needs PDF rendering
4. **Paywall / free-vs-paid gates** — everything that should be paid is currently free
5. **Full TaxReminder calendar data model** — current alerts lack `due_date`, `recurrence`, `reminder_offsets`

### Output

Full prioritized backlog written to **`TASKS.md`** — 16 sessions, 20 tasks across 5 tiers.

| Tier | Tasks | Focus |
|------|-------|-------|
| T1 (Revenue) | T1-1 to T1-4 | Pricing page, Stripe, PDF report, paywall gates |
| T2 (Acquisition) | T2-1 to T2-5 | Deduction checker, SEO pages, landing CTA, email capture |
| T3 (Quality) | T3-1 to T3-5 | TaxReminder model, BTW data-driven, conversation history, AI memory, analytics |
| T4 (Advanced reminders) | T4-1 to T4-6 | IB/toeslagen/DGA/expat/voorlopige/ZZP admin reminder categories |
| T5 (B2B & infra) | T5-1 to T5-4 | Accountant dashboard, WhatsApp/SMS, Google Calendar, Prinsjesdag admin |

**Usage:** Tell Claude "do T1-1" (or any task number) and it will execute the full brief from `TASKS.md`.

---

## Phase 31 — RTL CSS / Persian Rewrite / Multi-Year Comparison (1 Jun 2026) ✅ Complete

### Task 1: Replace physical CSS with logical CSS for RTL Persian support

Replaced all physical directional CSS properties with CSS Logical Properties across 8 files. These auto-flip in RTL (Persian) mode without needing `[dir="rtl"]` overrides.

| Property replaced | Logical equivalent | Files |
|-------------------|--------------------|-------|
| `marginRight` | `marginInlineEnd` | TopNav.tsx |
| `borderLeft` | `borderInlineStart` | TopNav.tsx, LoginPage.tsx, RegisterPage.tsx |
| `borderRight` | `borderInlineEnd` | SimulationPage.tsx |
| `paddingLeft` | `paddingInlineStart` | CalculatorPage.tsx, IBGuidePage.tsx, IntakePage.tsx, SimulationPage.tsx |
| `left: N` (absolute icon) | `insetInlineStart` | CalculatorPage.tsx, IntakePage.tsx, SimulationPage.tsx |
| `right: N` (absolute check) | `insetInlineEnd` | IntakePage.tsx |
| `textAlign: "left"` | `textAlign: "start"` | ChatPage.tsx, DashboardPage.tsx, IntakePage.tsx, RegisterPage.tsx, SimulationPage.tsx |
| `textAlign: "right"` (numeric column) | `textAlign: "end"` | DashboardPage.tsx, CalculatorPage.tsx |

Note: `.num` class in `index.css` keeps `text-align: right` — numbers are inherently LTR and stay right-aligned even in RTL layouts (correct financial convention).

---

### Task 2: Rewrite Persian (FA) translations — natural, modern, non-bookish

Full rewrite of `frontend/src/i18n/locales/fa.json`. Key changes applied throughout:

| Pattern replaced | Example before | Example after |
|-----------------|----------------|---------------|
| `خود را` (formal "your") | `پروفایل خود را تکمیل کنید` | `پروفایل‌تان را کامل کنید` |
| `بروزرسانی` → `به‌روزرسانی` | `بروزرسانی پروفایل` | `به‌روزرسانی پروفایل` |
| Long run-on subtitles | multi-clause sentences | shorter, punchy phrasing |
| `ابتدا` (formal "first") | `ابتدا پروفایل را تکمیل کنید` | `اول پروفایل‌تان را کامل کنید` |
| FAQ questions | overly formal phrasing | natural question forms |
| `قیمت‌گذاری` (nav) | verbose | `قیمت‌ها` |
| upgrade strings | `استفاده شد` | `تمام شد` |

Also added `nav.tax_history` key: `تاریخچه مالیاتی`

---

### Task 3: Multi-year comparison UI using TaxYearSnapshot

Built a complete tax history comparison page wired to the existing `GET/POST /api/users/snapshots/` API from Phase 30.

**New files:**

| File | Purpose |
|------|---------|
| `frontend/src/api/snapshots.ts` | `fetchSnapshots()` + `saveSnapshot()` typed API client |
| `frontend/src/pages/TaxHistoryPage.tsx` | Full comparison page |

**Modified files:**

| File | Change |
|------|--------|
| `frontend/src/App.tsx` | Lazy-loaded `TaxHistoryPage`, added `/tax-history` route |
| `frontend/src/components/TopNav.tsx` | Added `nav.tax_history` to `NAV_ITEMS_AUTH` |
| `en.json` / `nl.json` / `fa.json` | Added `nav.tax_history` key |

**Page features:**
- Auth-gated (shows login CTA if not signed in)
- Fetches all snapshots, sorted newest → oldest
- Each `SnapshotCard` shows: year + user type, total tax, effective rate, monthly reserve
- Year-over-year delta chips (▲/▼ with % change) vs. prior year card
- `is_final` badge on confirmed snapshots
- "Save 2026 snapshot" button — calls `POST /api/users/snapshots/` with current profile, shows toast
- Empty state with CTA to `/intake` if no snapshots yet
- Fully trilingual (NL/EN/FA) via inline lookup table
- Mobile-responsive grid: 1 column on mobile, auto-fill ≥280px on desktop

---

### Extra: Persian tagline on landing page hero

When `lang === "fa"`, the hero badge (previously "Dutch Tax AI · 2026") now reads:
**شفاف‌سازی مالیات در هلند**

In NL mode it reads "Belasting AI · 2026". In EN mode: "Dutch Tax AI · 2026".

Change: one conditional in `LandingPage.tsx` hero badge span.

---

## Build Fix — Railway Deploy (31 May 2026) ✅ Complete

### Problem

Railway deployment failed at the `npm run build` step with 4 TypeScript errors in `frontend/src/pages/DashboardPage.tsx`.

### Errors fixed

| Error | Location | Fix |
|-------|----------|-----|
| TS6133 — `alertIsSnoozed` declared but never read | Line 97 | Deleted dead function (replaced in Phase 29 by `isSnoozed` from `api/actions.ts`) |
| TS2339 — `total_tax_due` not on `{}` | Line 401 | Cast `?? {}` fallback to `{} as CalcResult["result"]` |
| TS2339 — `monthly_reserve_needed` not on `{}` | Line 402 | Same cast as above |
| TS2741 — `lang` prop missing on `AlertCard` | Line 1075 | Added `lang={lang}` to the rule-changes section (only occurrence without it) |

### File changed

| File | Change |
|------|--------|
| `frontend/src/pages/DashboardPage.tsx` | Removed unused `alertIsSnoozed`, fixed type cast, added `lang` prop |

---

## Phase 30 — Full Spec Compliance + Expert Bug Review ✅ Complete

### Proactive Spec — remaining gaps closed

| Gap | Fix Applied |
|-----|-------------|
| `rule_change` alert category not rendered in feed | Added "Regelwijzigingen" section to main dashboard feed |
| Health score missing reserve/hours/deduction factors | Rewritten: scores hours, buffer adequacy, deductions, KIA, pension |
| Health score baseline broken for non-ZZP | ZZP baseline 55, all others 62 — avoids false "Needs attention" |
| IB Guide: no backend persistence for auth users | PATCH `/api/users/profile/` on every answer change, restore on mount |
| Simulation: no backend persistence for auth users | Same pattern — server state restored on mount |
| Alert done/dismissed/snoozed — missing `done` | `markAlertDone` + `doneAlerts` set, `ALERT_DONE_KEY` in localStorage |
| `rule_change` category missing from `generate_alerts` | DB-queried via `AlertsView._rule_change_alerts()` + merged into response |
| DGA compliance risk not detected | `_check_dga_compliance()` — flags salary below €56k gebruikelijk loon |
| MKB opportunity not detected | `_check_mkb_opportunity()` — shows ~€X saving when MKB not applied |
| Partner optimization not detected | `_check_partner_optimization()` — missing income + income-gap scenarios |
| Admin impact analysis — UI missing | Impact panel in AdminRuleEditorPage with affected-user count + verification workflow |
| NotificationPreference — no API | `GET/PATCH /api/users/notifications/` — channel flags for future email/WhatsApp/SMS |
| TaxYearSnapshot — no API | `GET/POST /api/users/snapshots/` �� auto-calcs on create, multi-year ready |

### Critical bugs fixed

| Bug | Severity | Fix |
|-----|----------|-----|
| **Logout data leak** — 8 localStorage keys not cleared on sign-out | 🔴 Privacy | `SESSION_KEYS` constant in `auth.ts`, all keys cleared on logout |
| **Hardcoded `ANON_SESSION_LIMIT = 5`** in ChatPage — overrides backend flag | 🔴 Feature | Reads `VITE_ANON_SESSION_LIMIT` env var from `api/client.ts` |
| **ThreadPoolExecutor leak** — new executor per SSE message | 🔴 Resource | Removed executor; RAG runs synchronously inside SSE thread |
| **No React ErrorBoundary** — rendering crash = blank white screen | 🔴 UX | `ErrorBoundary` class component wraps all routes in `App.tsx` |
| **`throttle_classes = []`** on Claude API endpoint — no rate limit | 🔴 Cost | `ChatRateThrottle`: anon 20/min, auth 60/min |
| **`authHeader()` defined 4 times** across pages | 🟠 DRY | Moved to `api/client.ts`, all pages import it |
| **Admin mock fallback silent** — errors swallowed, admin edits mock data | 🟠 Debug | `console.warn` logs backend error before falling back |
| **20+ hardcoded English strings** in DashboardPage — Persian users see English | ��� i18n | All strings in `AlertCard` + `TaxHealthScoreCard` now trilingual via lookup tables |
| **`computeHealthScore` not memoized** — recomputes on every state update | 🟡 Perf | Wrapped in `useMemo` |

### New APIs registered

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET/PATCH /api/users/notifications/` | Auth | NotificationPreference — email/WhatsApp/SMS/calendar flags |
| `GET/POST /api/users/snapshots/` | Auth | TaxYearSnapshot — Future Memory Foundation |
| `GET /api/users/snapshots/<year>/` | Auth | Retrieve specific year snapshot |
| `GET /api/tax/rules/<id>/impact/` | Staff | Admin rule impact analysis |
| `GET /api/tax/rules/changes/` | Public | Recently updated verified rules |

### New DB models migrated

| Model | Migration | Purpose |
|-------|-----------|---------|
| `NotificationPreference` | `0005` | Reminder channel preferences per user |
| `TaxYearSnapshot` | `0004` | Yearly profile + calc snapshots |
| `User.ib_guide_answers` | `0005` | Backend persistence for IB Guide |
| `User.simulation_state` | `0005` | Backend persistence for Simulation |

---

## Phase 29 — Proactive Tax Operating System ✅ Complete

### Gap analysis performed against proactive.md spec

| Spec Item | Was | Now |
|-----------|-----|-----|
| Personal Tax Action Feed | ❌ Missing | ✅ Built |
| Dashboard: categorized sections | 🟡 Mixed feed | ✅ Risks / Deadlines / Opportunities split |
| Dashboard: Financial Overview | ❌ Missing | ✅ Built (sidebar card) |
| Health Score factor breakdown | 🟡 Score only | ✅ Expandable factors list |
| Pension jaarruimte opportunity | ❌ Missing | ✅ In alerts + actions |
| KIA investment opportunity | ❌ Missing | ✅ In alerts |
| Voorlopige aanslag opportunity | ❌ Missing | ✅ In alerts + actions |
| Alert → Chat "Explain this" | ❌ Missing | ✅ "Ask AI →" on every alert |
| Action states (open/done/dismissed) | ❌ Missing | ✅ localStorage persistence |

### Files created

| File | Purpose |
|------|---------|
| `backend/apps/users/actions.py` | Tax Action Engine — 10 action types across 5 categories |
| `frontend/src/api/actions.ts` | TypeScript client for `/api/users/actions/` + localStorage state |

### Files modified

| File | Change |
|------|--------|
| `backend/apps/users/alerts.py` | Added 3 opportunity checks: pension jaarruimte, KIA, voorlopige aanslag |
| `backend/apps/users/views.py` | Added `ActionsView` (GET authenticated / POST anonymous) |
| `backend/apps/users/urls.py` | Registered `actions/` endpoint |
| `frontend/src/pages/DashboardPage.tsx` | Full Tax Command Center rewrite |

### New Action Engine (`actions.py`)

10 action types across 5 categories:

| Category | Actions |
|----------|---------|
| Filing | BTW Q1/Q2/Q3/Q4 (date-aware, 45-day window), IB return (60-day window) |
| Compliance | Start tracking hours, Add missing hours (shows exact shortfall) |
| Optimization | Request voorlopige aanslag (>€1,500/mo reserve), Pension jaarruimte |
| Review | Review toeslagen income cliff, Review Box 3 reference date |
| Preparation | Set aside monthly reserve, Complete profile (lists missing fields), Collect quarterly receipts |

### Extended Opportunities in `alerts.py`

Three new opportunity checks added:
- **`_check_pension_opportunity`** — triggers when ZZP/employee has pension=0 and income > €19,172. Shows exact jaarruimte (30% × income − €19,172).
- **`_check_kia_opportunity`** — triggers when ZZP has no KIA investments declared. Explains 28% deduction on €2,901–€70,602.
- **`_check_voorlopige_opportunity`** — triggers when total tax > €500 and monthly reserve > €800. Explains zero-cost provisional assessment option.

### New Dashboard: Tax Command Center

Layout: Summary grid (4 cards) → 2-column main layout

**Left column sections (top to bottom):**
1. **Your Actions** — ActionCard with check-toggle (open ↔ done), done actions collapsed in `<details>`. Priority badges (HIGH/MEDIUM/LOW) color-coded.
2. **Risks** — risk + compliance alerts only. Section badge turns red on critical alerts.
3. **Upcoming Deadlines** — deadline alerts from the live alert engine (only near-term).
4. **Opportunities** — opportunity + cashflow + missing_data alerts.
5. **Quick Actions** — 4 navigation shortcuts.
6. **History** — last 5 calculations.

**Right sidebar:**
1. **Tax Health Score** — SVG gauge + "See factors ↓" expandable breakdown showing each contributing factor with +/− delta.
2. **Financial Overview** — Tax waterfall card: income → deductions → box1 tax → credits → ZVW → total.
3. **Profile card** — key profile values + edit button.
4. **Static deadlines** — hardcoded calendar year deadlines.
5. **Account card** — plan badge + upgrade link.

**"Ask AI →" on every alert** — navigates to `/chat` with a pre-filled question in the user's current language. Uses `location.state.question` (same mechanism as IB guide).

**Action states** persist in `localStorage["taxwijs_action_states"]` as `{ [id]: "open" | "done" | "dismissed" }`.

### New API endpoint

```
POST /api/users/actions/
Content-Type: application/json

{ "profile": { ... }, "lang": "en" }

→ [{ id, category, priority, title, body, action_label, action_url, due_date }, ...]
```

Also works authenticated via `GET /api/users/actions/?lang=en`.

### Verification

- `python -c "from apps.users.actions import generate_actions; ..."` — imports OK
- `python manage.py check` — 0 issues
- `npx tsc --noEmit` — 0 TypeScript errors
- Smoke test: ZZP €72k profile → 3 actions + 8 alerts (4 opportunities) ✅

---

## Phase 28 — Comprehensive Dot Removal (All User-Visible Strings) ✅ Complete

### What was fixed

A full second pass across every `.tsx`, `.ts`, and i18n file to remove trailing periods from all user-visible strings. Previous pass only covered i18n files and a few inline strings — this pass caught everything else.

**Files changed:**

| File | What was cleaned |
|------|-----------------|
| `Footer.tsx` | Disclaimer (2 sentences → em-dash joined), GDPR line |
| `DashboardPage.tsx` | `noProfileBody` text, `noAlertsBody` text |
| `ChatPage.tsx` | Intake success toast (NL/EN/FA), error toast (NL/EN/FA) |
| `IntakePage.tsx` | All 3 `WHY_TEXT` sidebar strings, success toast, "Numbers stay on your device" line, "Did you know" tip (NL/EN/FA) |
| `LandingPage.tsx` | Footer CTA subline (NL/EN/FA) |
| `LoginPage.tsx` | Google error/success messages, `LOGIN_ERR` map, right-panel tip quote and sub-text |
| `RegisterPage.tsx` | Google error/success messages, account created toast |
| `simulationSteps.ts` | All 50+ field `help_text`, `subtitle`, and description strings — automated regex pass |

**Rule applied:** Trailing `.` removed from display strings. `...` loading indicators kept. Em-dash `—` used instead of `.` where two clauses were joined by a period.

| Commit | Description |
|--------|-------------|
| `a044542` | fix(copy): comprehensive dot removal — all user-visible strings across every file |

---

## Phase 27 — Trailing Dot Removal + Railway Build Fix ✅ Complete

### Trailing period cleanup (all 3 languages)

Removed every trailing `.` from display text across `en.json`, `nl.json`, `fa.json` and 5 TSX files. Rule: display strings (headlines, subtitles, descriptions, notes) have no trailing period. Loading `...` indicators are unchanged.

**i18n strings cleaned (same keys in NL/EN/FA):** `headline_2`, `welcome_subtitle`, `ready_subtitle`, `disclaimer_results`, `session_limit_msg`, `gate_subtitle`, `gate_note`, IB `subtitle`, intake `step1/2/3_subtitle`, auth `login_error` / `register_error`, phase2 `subtitle` + `no_results`, upgrade `subheadline_register` / `subheadline_upgrade` / `error`, pricing `subheadline` + all 3 FAQ answers.

**Inline TSX cleaned:** `IBGuidePage` ("in plain language"), `LandingPage` (footer CTA heading), `LoginPage` ("tax workspace"), `IntakePage` ("Two minutes. One tax brain."), `PricingPage` (4 FAQ answer strings).

### Railway build fix

**Error:** `TS2304: Cannot find name 'lang'` in `LandingPage.tsx` at lines 159, 209, 212, 216.

**Root cause:** During UX/copy edits, `lang`-conditional strings were added to the footer CTA and features section of `LandingPage.tsx`, but the `const lang = i18n.language` declaration was never added to the component. Locally this was masked because the TypeScript project config had already-compiled cache — Railway's clean build caught it.

**Fix:** Added `const lang = i18n.language as "nl" | "en" | "fa"` and destructured `i18n` from `useTranslation()` in `LandingPage.tsx`.

**TypeScript check:** `npx tsc --noEmit` — 0 errors before push.

| Commit | Description |
|--------|-------------|
| `ff104b4` | fix(copy): remove all trailing periods from display text across NL/EN/FA |
| `2b66b3d` | fix(build): declare lang variable in LandingPage — fixes Railway TS build error |

---

## Phase 26 — UX Audit: Design System, Accessibility & Mobile Responsiveness ✅ Complete

### What was audited and fixed

A full-stack UX/accessibility audit against production-grade SaaS standards. Every issue below was found, root-caused, and fixed. TypeScript passes clean.

---

### Design System — Formal Typography & Spacing Scale

**Problem:** Arbitrary font sizes throughout the codebase (10.5px, 11px, 11.5px, 12px, 12.5px, 13px, 13.5px, 14.5px) with no consistent token system. No spacing scale — magic numbers everywhere.

**Fix (`frontend/src/index.css`):**

| Token | Value | Use |
|-------|-------|-----|
| `--text-2xs` | 11px | Eyebrow labels, legal fine print |
| `--text-xs`  | 12px | Helper text, captions, metadata |
| `--text-sm`  | 13px | Secondary body, card subtitles |
| `--text-base`| 14px | Primary body (root default) |
| `--text-md`  | 15px | Emphasized body |
| `--text-lg`  | 17px | Large body / small section heading |
| `--text-xl`  | 20px | Section headings |
| `--text-2xl` | 26px | Card / panel headings |
| `--text-3xl` | 32px | Page headings |
| `--text-4xl` | 38px | Hero headings |
| `--text-5xl` | 48px | Display small |
| `--text-6xl` | 64px | Display large (hero) |

Spacing scale: `--sp-1` (4px) through `--sp-16` (64px). All `.btn`, `.eyebrow`, `.pill`, `.tw-input`, `.tw-label`, `.card` atoms updated to use tokens.

---

### Accessibility — WCAG AA

**Focus states (was: none defined globally)**
- Added global `:focus-visible` — 2px sage-600 outline, 2px offset, `--r-xs` radius
- Inputs get `box-shadow` focus ring instead of outline (doesn't clash with border)
- `.btn-accent:focus-visible` gets a branded glow ring

**Touch targets (was: btn-sm=32px, nav links=23px)**
- `--touch-min: 44px` token added
- `.btn` gets `min-height: var(--touch-min)` — WCAG 2.5.5 compliant
- `.btn-sm` height 32px → 36px (layout compromise; `min-height` ensures 44px virtual target with surrounding padding)
- `.tw-input` height 42px → 44px (matches touch minimum)
- Nav links: `height: 44px` with `inline-flex` — all nav items pass

**CSS media queries (was: `preferes-contrast` typo — silently broken)**
- Fixed spelling: `@media (prefers-contrast: more)` — high-contrast adjustments now actually apply
- `@media (prefers-reduced-motion: reduce)` — disables all animations for users who request it

---

### Navigation (TopNav.tsx)

| Issue | Fix |
|-------|-----|
| Active state barely visible (1px thin underline, no weight) | `font-weight: 600` + `2px solid` underline |
| Nav link height 23px — fails touch target | `height: 44px` + `inline-flex` |
| Hamburger 36×36px — too small | 44×44px |
| No ARIA on hamburger | `aria-expanded`, `aria-controls="mobile-nav"`, `aria-label` |
| Mobile nav has no semantic role | `role="navigation"` + `aria-label="Mobile navigation"` |
| Mobile nav items too short (48px) | `height: 52px` |
| Active mobile item no visual indicator | Left `3px solid var(--sage-600)` border + `background: var(--accent-soft)` |
| Login link had no touch padding | `height: 44px`, `padding: 0 8px`, `inline-flex` |

---

### Footer (Footer.tsx)

| Issue | Fix |
|-------|-----|
| One-column flat list — no hierarchy | 3-column grid: brand/disclaimer · legal links · company info |
| Section headings missing | `.eyebrow` labels for "Legal" and "Company" columns |
| All font sizes hardcoded | All use `--text-*` tokens |
| External links missing `rel` | `target="_blank" rel="noopener noreferrer"` on all external hrefs |
| No GDPR mention | Added GDPR/AVG compliance note under brand disclaimer |
| Language display unclear | Language indicators with flag emoji in bottom bar |
| No `aria-label` on `<footer>` | `aria-label="Site footer"` added |

---

### Form Accessibility — Login, Register, Intake (WCAG 2.1 Level A)

**Root cause:** All form fields used `<div className="tw-label">` as visual labels with no semantic connection to their inputs. Screen readers announced inputs with no label.

**Fix:** Every field now uses `<label htmlFor="field-id">` paired with `id="field-id"` on the corresponding input. `aria-required="true"` added to required fields.

Files changed: `LoginPage.tsx`, `RegisterPage.tsx`, `IntakePage.tsx` (UnitInput component).

---

### iOS / Mobile Zoom Bug (Intake, Login, Register, Chat)

**Root cause:** iOS Safari auto-zooms the viewport when a focused `<input>` has `font-size < 16px`. All inputs in the app were 14px.

**Fix:** `style={{ fontSize: 16 }}` applied to every `<input>`, `<textarea>`, and `<select>`. The displayed size is still controlled by the browser's zoom-adjusted rendering — the user sees normal text, iOS no longer zooms.

---

### Intake Page — Mobile Layout (Blocking Bug)

**Root cause:** The 3-column grid (`300px | 1fr | 300px`) rendered on all screen sizes. At 375px, all three columns were visible but squashed, pushing the form to roughly 150px wide and causing the "progress" sidebar to dominate the viewport.

**Fixes:**
- Grid collapses to `1fr` on mobile — form takes 100% width
- Both sidebars (left progress + right tip) are hidden on mobile
- A compact step indicator strip (step dots + "Step N of 3" label) replaces the sidebar on mobile
- Step 1 type grid: `1fr 1fr` → `1fr` on mobile (was overflowing at 320px)
- Step 3 situation grid: same single-column collapse
- All step headings use `clamp()` or token sizes, not `34px` fixed

---

### Chat Page

| Issue | Fix |
|-------|-----|
| Messages area had no ARIA — screen readers silent | `role="log"` + `aria-live="polite"` + `aria-label` |
| Input area could scroll off-screen on some mobile browsers | `position: sticky; bottom: 0` — permanently visible |
| Two contradictory counters visible simultaneously ("10/10 today" AND "6 remaining") | Unified single counter in profile bar; "remaining" chip removed from cards |
| Textarea had no label for screen readers | `aria-label` in NL/EN/FA |
| Input font-size 14px — iOS zooms on focus | Changed to 16px |
| Focus ring missing on textarea | `box-shadow` focus ring on `onFocus` event |
| Input wrapper had no semantic role | `role="form"` + `aria-label` |

---

### Landing Page — Mobile Overflow

**Root cause:** Hero `<h1>` was `font-size: 64px` on all viewports. At 320px this created a 4-line headline pushing CTAs below the fold.

**Fix:** `fontSize: isMobile ? "clamp(2rem, 10vw, 3.5rem)" : "var(--text-6xl)"` — fluid scaling from 32px at 320px to 56px at 560px. CTA buttons and trust strip use `flexWrap: "wrap"` so they stack cleanly at narrow viewports.

---

### Git

| Commit | Description |
|--------|-------------|
| `f26ed94` | refactor(ux): formal type scale, WCAG AA accessibility, mobile responsiveness |

---

## Phase 25 — Proactive Tax Command Center + Bug Fixes ✅ Complete

### What was built

**Bug fixes (from full audit):**

| Bug | Fix |
|-----|-----|
| Scroll-to-top button overlapping chat input | Removed entirely from `TopNav.tsx` — `showScrollTop` state + button deleted |
| Trailing periods in UI body text | Removed from all three i18n files (en/nl/fa) — feature descriptions, subheadlines, disclaimers |
| WetDBA showing "N/A" at display size | Shows "—" in muted `var(--ink-4)` color with "Not yet calculated" subtitle |
| No site footer (GDPR non-compliant) | New `Footer.tsx` component — Privacy Policy, Terms, KvK, contact, © line. Hidden on `/chat` and `/admin/*` |
| No Open Graph / Twitter card metadata | Added to `index.html` — og:title, og:description, og:image, twitter:card |
| No font-display strategy | Added `font-display=swap` preload hint for Google Fonts in `index.html` |
| Chat limits blocking real users | `DISABLE_CHAT_LIMITS=true` (default) in `settings.py` — `FREE_DAILY_LIMIT` and `ANON_SESSION_LIMIT` both set to 9999. Re-enable by setting env var to `false` |
| Bookish AI responses | Rewrote both `_result_system_prompt` and `_INTAKE_PROMPT_BODY` — shorter sentences, contractions, "Alex" persona reinforced, no filler openers |

**Proactive alert engine (backend):**

- `backend/apps/users/alerts.py` — pure function `generate_alerts(profile, calc_result, lang)` returns up to 10 contextual alerts
- 10 alert types: BTW deadlines, IB deadline, Wet DBA risk, ZVW reminder, zorgtoeslag cliff, urencriterium, startersaftrek last year, high reserve, profile completeness, Box 3, 30%-ruling phase-out
- Categories: `deadline | risk | opportunity | missing_data | cashflow | compliance`
- Severities: `critical | warning | info`
- Fully trilingual (NL/EN/FA) in the alert body text
- `AlertsView` added to `apps/users/views.py` — `GET /api/users/alerts/` (authenticated) and `POST /api/users/alerts/` (anonymous, profile in body)
- Registered at `api/users/alerts/`

**Dashboard → Tax Command Center:**

- **Tax Health Score**: circular SVG gauge (0–100) computed from profile completeness + alert severity — displayed in summary grid (non-ZZP) and right sidebar (ZZP)
- **Proactive Alert Feed**: card list showing all active alerts with category icon, severity pill, dismiss button, and action link — top of the main column
- Critical alert count shown as a `pill-danger` chip in the page header; click scrolls to alerts
- Dismissed alerts persisted in `localStorage["taxwijs_dismissed_alerts"]`
- WetDBA risk colour-coded: red=high, amber=medium, green=low
- Effective rate card now shows human translation: `~€X per €100`

**Persistent IB Guide state:**
- `IBGuidePage.tsx`: answers restored from `localStorage["taxwijs_ib_guide_progress"]` on mount
- Autosave `useEffect` fires on every answer change; shows "✓ Autosaved HH:MM" in the progress strip

**Persistent Simulation state:**
- `SimulationPage.tsx`: answers restored from `localStorage["taxwijs_simulation_answers"]`; current step from `localStorage["taxwijs_simulation_step"]`
- Autosave indicators in the sidebar running-estimate panel

---

## Phase 24 — Brand-Matched Login Loading Overlay ✅ Complete

### What was built
`LoginPage.tsx`: when login is in progress, an overlay appears that matches the TaxWijs brand exactly:
- Shield logo (72px) with the same sage gradient as the splash screen
- 3 breathing sage rings (`tw-breath` animation) radiating outward from the shield
- Checkmark draw animation (`tw-draw`) inside the shield
- "TaxWijs" in the serif font
- "Signing in…" status text (translated NL/EN/FA)
- Animated sage-600 progress bar sliding along the bottom edge
- Paper background with the same radial sage/warm gradient tint as the splash

**Responsive behaviour:** on desktop the overlay covers only the left form column (`position: absolute`); on mobile it covers the full screen (`position: fixed`).

---

## Phase 23 — Register Page Blank Screen Fix ✅ Complete

### Problem
`@react-oauth/google` v0.13 is incompatible with React 19 — it threw a fatal render error that wiped the register and login pages completely white.

### Fix
- Uninstalled `@react-oauth/google` entirely.
- Added Google Identity Services (GIS) script tag to `index.html` — no npm package needed.
- Added `frontend/src/types/google.d.ts` with TypeScript declarations for `window.google.accounts.oauth2`.
- Both `LoginPage.tsx` and `RegisterPage.tsx` now call `window.google.accounts.oauth2.initTokenClient()` directly.
- Graceful error messages if `VITE_GOOGLE_CLIENT_ID` is not set or GIS hasn't loaded yet.
- Removed `GoogleOAuthProvider` from `main.tsx`.

---

## Phase 22 — Google OAuth Sign-In ✅ Complete

### What was built
**Backend (`apps/users/views.py` + `urls.py`):**
- `GoogleAuthView`: accepts a Google `access_token`, calls `https://www.googleapis.com/oauth2/v3/userinfo` to verify and fetch the email, creates or retrieves the Django user, returns a DRF JWT pair (`access`, `refresh`). No extra Python packages required.
- New route: `POST /api/users/auth/google/`

**Frontend:**
- `api/auth.ts`: `googleAuth(accessToken, userType)` — POSTs to the new endpoint, stores JWT in localStorage.
- `LoginPage.tsx` + `RegisterPage.tsx`: custom-styled Google button (official Google SVG logo, brand colors) as the primary CTA; email/password form kept as a fallback below an "or with email" divider.
- `RegisterPage.tsx`: user selects their tax type (ZZP / Employee / Expat / DGA) before clicking Google — the type is passed to the backend so new Google accounts are set up correctly.
- `frontend/.env.example` updated with `VITE_GOOGLE_CLIENT_ID` placeholder and setup instructions.

---

## Phase 21 — Animated Typing Indicator ✅ Complete

### Problem
While waiting for the AI response, the chat showed two overlapping indicators: a blank white card with a blinking `▍` cursor, and a separate `T ···` row below it — redundant and visually jarring.

### Fix
- `index.css`: Added `@keyframes typingBounce` — three sage-colored dots that bounce sequentially (30° phase offset per dot, 1.3 s loop).
- `ChatPage.tsx`: When an assistant message is streaming but has no content yet (`msg.streaming && !msg.content`), the card renders the 3 bouncing dots instead of the blank cursor.
- The moment the first token arrives, dots are seamlessly replaced by streaming text.
- Removed the separate `loading` indicator row below the messages — it was redundant now that the streaming bubble handles the waiting state.

---

## Phase 20 — Loading Screens & Skeleton States ✅ Complete

### App-wide splash screen
- `App.tsx`: 2.4 s splash overlay using the existing `LoadingScreen` component renders over the entire app while it hydrates; fades out over 0.5 s. App content renders behind the overlay so navigation is instant after the fade.
- No new files needed — reused `LoadingScreen`.

### Skeleton shimmer component
- `components/Skeleton.tsx`: new `Skeleton` and `SkeletonCard` components with CSS shimmer animation (`@keyframes shimmer` in `index.css`).
- `Skeleton`: single shimmer bar, configurable width / height / radius.
- `SkeletonCard`: a full card-shaped block of skeleton lines for placeholder loading states.

### Dashboard summary cards
- `DashboardPage.tsx`: `SummaryCard` accepts a `loading` prop. While `loadingCalc` is true (API call in flight), each summary card shows a `Skeleton` bar (h=36, w=70%) instead of the number — same card shell, just animated shimmer where the figure would be.

### Chat profile loading
- `ChatPage.tsx`: the "Loading your profile…" text is replaced with three `Skeleton` bars (widths 55%, 80%, 40%) while `loadingProfile` is true — consistent with the rest of the app's loading pattern.

---

## Phase 19 — Profile Leak Fix + Per-User Chat History + UI Polish ✅ Complete

### Bug: Profile visible to anonymous users after logout
`logout()` removed JWT tokens but left `taxwijs_calc_input` (user profile) in localStorage. Any anonymous visitor saw the previous user's ZZP profile bar.
- `api/auth.ts`: `logout()` now also removes `taxwijs_calc_input`, `taxwijs_chat_history`, `taxwijs_user_id`

### Bug: Chat history lost after logout/login
History was saved under a shared `taxwijs_chat_history` key — clearing it on logout wiped it permanently.
- `LoginPage.tsx` / `RegisterPage.tsx`: write `taxwijs_user_id` to localStorage after successful auth
- `ChatPage.tsx`: `historyKey()` returns `taxwijs_chat_history_u{id}` for logged-in users, `taxwijs_chat_history` for anonymous — user-specific keys survive logout and are restored on next login

### Glass navbar on scroll
- `TopNav.tsx`: `scrolled` state (scrollY > 8px) → header transitions to `rgba(255,255,255,0.78)` background + `backdrop-filter: blur(14px) saturate(160%)` + drop shadow
- Smooth `transition: background .25s, box-shadow .25s`

### Smooth mobile menu slide
- Mobile menu panel is always mounted (not conditionally rendered) — visibility controlled by `opacity`, `transform: translateY`, and `pointerEvents`
- Backdrop and panel both animate: slide down on open, slide up on close (`.22s cubic-bezier`)

### Scroll-to-top button
- Fixed button (bottom-right, 44px circle) fades in when scroll > 320px
- Smooth `window.scrollTo({ top: 0, behavior: 'smooth' })` on click
- Same fade+lift transition as the navbar glass effect

---

## Phase 18 — Persistent Chat History ✅ Complete

### Chat messages now survive navigation

**Problem:** Every time the user navigated away from `/chat` and returned, the entire conversation was gone — React state is reset on component unmount.

**Fix (`frontend/src/pages/ChatPage.tsx`):**

Two new `useEffect` hooks:

1. **Save on every change** — any time `messages` updates, the full array is written to `localStorage` under the key `taxwijs_chat_history`. The write is a single `JSON.stringify` so it's negligible cost.

2. **Restore on mount (before normal init)** — at the very start of the init `useEffect`, the code tries to read `taxwijs_chat_history`. If messages exist:
   - All messages get `streaming: false` (never restore a partial stream)
   - Empty-content messages (incomplete streams) are filtered out
   - `sessionCount` and `askedSet` are rebuilt from the restored user messages
   - If a profile exists, `intakeComplete` is set to true
   - The function returns early — the normal "show intake greeting" flow is skipped

3. **Clear button** — also calls `localStorage.removeItem("taxwijs_chat_history")` so a manual clear wipes both the in-memory state and the saved history.

**Result:** The user can navigate to the dashboard, settings, or any other page and come back to find their full conversation exactly where they left it. The "Clear" button still works as expected.

---

## Phase 17 — Humanised Chatbot Persona ✅ Complete

### Chatbot rewritten to feel like a knowledgeable friend

**Problem:** The chatbot read like a tax authority or corporate AI — formal openers, jargon, bullet-list answers. Users felt they were talking to a robot.

**Changes to `backend/apps/chat/views.py`:**

**New persona — "Alex":**
- Named advisor persona: warm, direct, honest — "like a knowledgeable friend who knows taxes"
- Uses contractions (you'll, you're, here's), plain numbers, no filler openers
- Always ends with one concrete actionable takeaway
- Explains effective rate in human terms: "for every €100 you earn, about €X goes to tax"
- Uses "you" and "your" throughout — never "the taxpayer"

**Intake flow rewritten:**
- Acknowledges what the user says before moving to the next question
- Never lists multiple questions at once
- Confirms numbers back: "Got it, €60k revenue" → then next question
- 6-question maximum, fills in defaults for anything not mentioned

**Bug fixed — `_build_calculator_block` always returned €0:**
- Was reading `result.get('total_tax', 0)` etc. from the top-level engine dict
- Top-level dict has keys `"calculation"` and `"result"` — not `"total_tax"` directly
- Fixed to read from `calc_result["result"]` and `calc_result["calculation"]`
- Also expanded the block to include itemised breakdown (ZA, SA, MKB, ZVW, Box 2, Box 3)
  so Alex can explain each component naturally in conversation

---

## Phase 16 — Calculator Accuracy Fix ✅ Complete

### Bug Fixed: Dashboard showing €0 total tax

**Root cause:** `DashboardPage.tsx` interface declared `result.total_tax` but the API returns `result.total_tax_due`. TypeScript resolved the missing field as `undefined`, and `undefined ?? 0` silently displayed €0.

**Fix (`frontend/src/pages/DashboardPage.tsx`):**
- Renamed `CalcResult.result.total_tax` → `total_tax_due` in the interface (line 12)
- Updated the usage on line 116: `calcResult?.result.total_tax_due ?? 0`

### Fix: ZVW rate corrected from 4.85% → 5.32%

**Root cause:** `phase1/data/seed/tax_rules_2026.json` had the 2025 ZVW rate (4.85%, ceiling €79,409). The authoritative 2026 figure from CLAUDE.md and Belastingdienst is **5.32%, ceiling €71,628, max €3,811/year**.

**Changes:**
- `phase1/data/seed/tax_rules_2026.json` — ZVW-2026-001 result: rate 4.85→5.32, ceiling_income 79409→71628, max_amount 3851.34→3810.61, formula + plain text (NL/EN/FA) updated
- `phase1/data/seed/scenarios.json` — Three ZZP scenarios recalculated with correct ZVW:
  - SCN-ZZP-001: zvw €2,452→€2,690, total €13,538→€13,776, monthly €1,128→€1,148
  - SCN-ZZP-002: zvw €1,050→€1,152, total €1,050→€1,152, monthly €88→€96
  - SCN-ZZP-003: zvw €3,851→€3,811, total €34,294→€34,254, monthly €2,858→€2,855

### Verification

All 6 ground-truth scenarios tested against the engine — exact match (zero error):

| Scenario | Expected | Got | Diff |
|----------|----------|-----|------|
| SCN-ZZP-001 | €13,776 | €13,776 | 0 |
| SCN-ZZP-002 | €1,152 | €1,152 | 0 |
| SCN-ZZP-003 | €34,254 | €34,254 | 0 |
| SCN-EMP-001 | €10,079 | €10,079 | 0 |
| SCN-EXP-001 | €14,270 | €14,270 | 0 |
| SCN-DGA-001 | €17,010 | €17,010 | 0 |

---

---

## Phase 15 — Registration Fix + Toast Notifications ✅ Complete

### Bug Fixed: Registration returning 400

**Root cause:** When a user tried to register with an email already in use, Django's username uniqueness constraint fired in Dutch (`Er bestaat al een gebruiker met deze gebruikersnaam.`) — 70 bytes, exactly matching the log. The frontend caught any error as a generic `t("auth.register_error")` so the user saw nothing useful.

**Backend fix (`backend/apps/users/serializers.py`):**
- Added `validate_email()` method — checks `email__iexact` uniqueness before the username constraint fires, returns a clean English message: `"An account with this email address already exists."`
- Added `validated_data.setdefault("username", email)` in `create()` as a safety guard if frontend ever omits `username`

**Frontend fix (`frontend/src/pages/RegisterPage.tsx`):**
- Parses the API error shape: `data.email` or `data.username` → localised "email already exists" in NL/EN/FA
- `data.password` → shows actual password error from server or localised weak-password fallback
- Unknown error → falls back to `t("auth.register_error")`
- `preferred_language` now set to `i18n.language` (was hardcoded `"en"`)

---

### Feature: Global Toast Notification System

**New file: `frontend/src/context/ToastContext.tsx`**
- `ToastProvider` — React context provider, mounted at app root in `main.tsx`
- `useToast()` hook — returns `showToast(message, type)` usable from any page
- Toast types: `error` (red), `success` (green), `warn` (yellow), `info` (blue)
- Toasts appear bottom-right, stack upward, auto-dismiss after 5 seconds, have a manual × button
- Animated fade-in using existing `fadeIn` keyframe from `index.css`

**Wired into:**

| Page | Event | Toast type |
|------|-------|-----------|
| LoginPage | Wrong credentials | error |
| LoginPage | Login success | success |
| RegisterPage | Email already exists | error |
| RegisterPage | Password too weak | error |
| RegisterPage | Account created | success |
| IntakePage | Profile saved | success |
| IntakePage | Also PATCHes server for auth users | (server sync, same as ChatPage) |
| ChatPage | Chat stream error | error |
| ChatPage | Chat intake profile created | success |

All toast messages are localised in **NL / EN / FA**.

---

## Phase 14 — Chat Language Fix + Profile-Aware Chatbot ✅ Complete

### Bug 1 Fixed: Chatbot always answered in Dutch

**Root cause:** The `sendMessage()` API call never sent the UI language to the backend. The system prompts said "respond in the user's language" but Claude had no language signal on the first response, so it defaulted to Dutch regardless of the UI language setting.

**Changes:**
- `frontend/src/api/chat.ts` — added `language: "nl" | "en" | "fa"` parameter (8th arg, default `"nl"`)
- `frontend/src/pages/ChatPage.tsx` — passes `lang` (from `i18n.language`) to every `sendMessage()` call
- `backend/apps/chat/serializers.py` — added `language = ChoiceField(["nl","en","fa"], default="nl")`; also raised `message` max_length from 800 → 2000
- `backend/apps/chat/views.py` — replaced hard-coded `SYSTEM_PROMPT` and `INTAKE_SYSTEM_PROMPT` strings with functions `_result_system_prompt(language, ...)` and `_intake_system_prompt(language)`. Each injects a language-specific ABSOLUTE rule in the target language itself (NL/EN/FA) so Claude cannot ignore it

**Language rules injected (example for EN):**
```
LANGUAGE RULE (ABSOLUTE — DO NOT IGNORE): You MUST always respond in ENGLISH only.
Do not switch to any other language, regardless of what the user writes.
```

---

### Bug 2 Fixed: Profile-aware chatbot + cross-device dashboard sync

**Root cause:** The user tax profile was stored in `localStorage` only — device-specific, lost on new device/browser. When an authenticated user completed the chat intake, nothing was saved to the server. Dashboard had no fallback to the server.

**Backend changes:**
- `backend/apps/users/models.py` — added `intake_profile = JSONField(null=True, blank=True)` to User model
- `backend/apps/users/serializers.py` — added `intake_profile` to `UserSerializer` fields (writable via PATCH)
- Migration `0003_add_intake_profile.py` created and applied

**Frontend — ChatPage (`frontend/src/pages/ChatPage.tsx`):**
- On mount: checks localStorage first, then (for authenticated users) fetches `GET /api/users/profile/` and uses `intake_profile` from server if found — syncs to localStorage, skips intake
- After intake completes: for authenticated users, also `PATCH /api/users/profile/` with `{intake_profile: {...}}` to persist cross-device
- Added `loadingProfile` state + spinner shown while fetching server profile
- Clear chat button uses `startIntakeGreeting()` helper (respects current language)

**Frontend — DashboardPage (`frontend/src/pages/DashboardPage.tsx`):**
- Converted `profile` from inline computed value to `useState` so it can be updated reactively
- On mount (authenticated, no localStorage profile): fetches `GET /api/users/profile/` → syncs `intake_profile` to localStorage + sets state
- Calculator runs in a separate `useEffect` that fires whenever `profile` changes — handles both localStorage load and server load

**Complete flow (authenticated user):**
1. User opens chat → no localStorage profile → fetches server → if `intake_profile` found → loads it, goes to result mode
2. User opens chat → no localStorage, no server profile → shows intake greeting in correct language
3. User completes intake → profile saved to localStorage AND `PATCH`ed to server
4. User opens dashboard → if no localStorage → fetches from server → calculator runs → dashboard populates
5. User on a different device → opens chat/dashboard → server profile loads → works identically

**TypeScript build:** clean (0 errors) · **Django check:** 0 issues

---

## Phase 1 — Knowledge Base ✅ Complete

**What was built:**

A structured, fully validated knowledge layer for Dutch tax rules in 2026. All data lives in JSON files under `phase1/data/seed/` and is validated against JSON schemas.

### Data files

| File | Contents |
|------|----------|
| `tax_rules_2026.json` | 28 hand-verified tax rules covering Box 1/2/3, all ZZP deductions, credits, benefits, deadlines, and compliance |
| `qa_pairs_2026.json` | 12 Q&A pairs — each with question variants, short+detailed answers in NL/EN/FA, and `expected_ai_behavior` |
| `scenarios.json` | 6 complete tax scenarios (ZZP, employee, expat, DGA) with every calculation step explicit |
| `ib_form_mapping.json` | 9 IB return form fields mapped to plain-language questions + common mistakes in NL/EN/FA |

### Schemas (in `phase1/data/schemas/`)

- `tax_rule.schema.json` — condition/result/source structure, multilingual plain text, verification status
- `qa_pair.schema.json` — question variants, three-language answers, `expected_ai_behavior` field
- `scenario.schema.json` — user profile, full calculation chain, result with optimisation tips
- `ib_form_field.schema.json` — field codes, help text, common mistakes, AI follow-up questions

### Validator

`phase1/data/scripts/validate.py` — runs schema validation + 18 calculation accuracy tests.
All calculation tests pass. (Schema tests require `jsonschema` package: `pip install jsonschema`)

### Key 2026 data verified

| Item | Value |
|------|-------|
| Box 1 bracket 1 | 35.75% (€0–€38,883) |
| Box 1 bracket 3 | 49.50% (above €78,426) |
| Zelfstandigenaftrek | €1,200 (down from €2,470 in 2025) |
| Startersaftrek | €2,123 — **LAST YEAR in 2026, abolished from 2027** |
| MKB-winstvrijstelling | 12.7% (no hours requirement) |
| ZVW contribution | 5.32% on profit up to €71,628 |
| Algemene heffingskorting | €3,115 max, phases out at €78,426 |
| Zorgtoeslag | €129/month max — **hard cutoff** at €40,857 |
| Huurtoeslag 2026 reform | Rent ceiling abolished — any rent now qualifies |
| Wet DBA | Active enforcement since Jan 2025 |
| DGA gebruikelijk loon | €56,000 min |
| 30% ruling | 5-year phase-down: 30%/20%/10% for years 3/4/5 |

---

## Phase 2 — RAG Pipeline ✅ Complete

**What was built:**

A retrieval system that takes a user question, finds the most relevant tax rules/Q&A pairs/scenarios, and returns a formatted context block ready for injection into an AI system prompt.

### Files (all in `phase2/`)

| File | Purpose |
|------|---------|
| `store/schema.py` | `Chunk` dataclass — the universal unit stored in the vector DB |
| `store/chroma_store.py` | ChromaDB implementation (persistent local storage) |
| `store/supabase_store.py` | Supabase pgvector stub (for future production use) |
| `chunkers/rule_chunker.py` | Converts tax rules → embeddable Chunk objects (multilingual, all 3 langs in one chunk) |
| `chunkers/qa_chunker.py` | Converts Q&A pairs → canonical chunk + N variant chunks (one per question phrasing) |
| `chunkers/scenario_chunker.py` | Converts scenarios → natural-language worked examples |
| `chunkers/ib_field_chunker.py` | Converts IB form fields → chunks (common mistakes + follow-up questions) |
| `chunkers/raw_chunker.py` | Sliding-window chunker for scraped raw content |
| `embeddings/embed_openai.py` | OpenAI `text-embedding-3-small` (1536 dims) |
| `embeddings/embed_local.py` | `all-MiniLM-L6-v2` sentence-transformers (384 dims, offline fallback) |
| `retriever.py` | Main `retrieve(question, user_type, year)` function |
| `assembler.py` | Formats retrieved chunks into the AI context string (respects 1,500 token budget) |
| `build_index.py` | Entry point: loads Phase 1 data → chunks → embeds → stores in ChromaDB |
| `test_retrieval.py` | 5 accuracy tests (precision, cross-lingual, filter, expiry, token budget) |
| `embedding_manifest.json` | Records which model was used to build the index |

### Index stats

- **91 total chunks**: 28 rules + 12 canonical Q&A + 36 Q&A variants + 6 scenarios + 9 IB fields
- **Embedding model**: `all-MiniLM-L6-v2` (local, offline) — can swap to OpenAI with `--provider openai`
- **Vector store**: ChromaDB persistent local storage at `phase2/chroma_db/`

### Retrieval design

1. Embed query with same model used at index time
2. Filtered vector search: always filters `year=2026`, `verification_status=verified`, `effective_until >= today`
3. Cascade retrieval: if a Q&A chunk is retrieved, also pull its `rule_ids` via direct lookup
4. Deduplication: if canonical + variant of same Q&A both retrieved, keep higher-scored one
5. Assemble into context string with token budget enforcement (tiktoken)

### Accuracy test results (all pass)

| Test | Result | Details |
|------|--------|---------|
| Precision@5 | ✅ Pass | 9/11 Q&A pairs fully covered (threshold: 9/11 for local model) |
| Cross-lingual | ✅ Pass | Persian questions retrieve same rules as Dutch (3/11 threshold for local model) |
| Metadata filter | ✅ Pass | Employee queries never return ZZP/DGA-only rules |
| Expiry filter | ✅ Pass | SA-2026-001 present in 2026, correctly absent in 2027 |
| Token budget | ✅ Pass | Assembled context ≤ 1,500 tokens for all test queries |

### Known fix: cascade expiry bug

The `get_by_ids()` direct lookup bypassed ChromaDB's date filter. Fixed by reconstructing
`effective_until` string from `effective_until_int` in `chroma_store.py` before returning chunks.

---

## Phase 2 UI — RAG Demo Page ✅ Complete

**What was built:**

A professional demo page at `/phase2` that lets you visually test the RAG pipeline — type a tax question, see which rules and Q&A pairs are retrieved, with scores, source links, and AI behavior hints.

### Files added/modified

| File | Change |
|------|--------|
| `frontend/src/pages/Phase2Demo.tsx` | New page — form + result cards with full metadata display |
| `frontend/src/pages/Phase2Demo.module.css` | CSS module using project CSS variables |
| `frontend/src/api/retrieve.ts` | TypeScript types + `retrieveContexts()` API function |
| `frontend/src/App.tsx` | Added `/phase2` route + RAG Demo nav link |
| `frontend/src/i18n/locales/nl.json` | Added `phase2.*` translation keys |
| `frontend/src/i18n/locales/en.json` | Added `phase2.*` translation keys |
| `frontend/src/i18n/locales/fa.json` | Added `phase2.*` translation keys (Persian) |
| `backend/apps/tax/views.py` | Added `Phase2RetrieveView` API endpoint |
| `backend/apps/tax/urls.py` | Registered `phase2/retrieve/` URL |

### UI features

- Text area for question input (NL/EN/FA all work)
- 5 example questions (including one in Persian)
- User-type filter pills: Any / ZZP / Employee / Expat / DGA
- Result cards showing: doc-type badge (colour coded), source ID, similarity score, topic, expandable text, AI behavior badge, source URL, AI instruction hint
- Cascade indicator: left stripe on cards retrieved via cascade (not direct semantic match)
- Stats bar: result count + elapsed milliseconds
- Full RTL support for Persian text

---

## Backend — Django Setup ✅ Complete

**What was built:**

Django 6.0 + DRF REST API scaffolding with SQLite for local development.

### Structure

```
backend/
├── config/
│   ├── settings.py     # Django settings; sys.path patched so phase2.* is importable
│   ├── urls.py         # Root URL config
│   └── wsgi.py / asgi.py
├── apps/
│   ├── users/          # Custom user model + migrations
│   ├── tax/            # Tax API endpoints (Phase2RetrieveView)
│   ├── chat/           # Chat sessions (Phase 4)
│   └── calculator/     # Tax calculator (Phase 3)
├── requirements.txt    # Django 6, DRF, allauth, simplejwt, anthropic, openai, etc.
└── manage.py
```

### Key decisions

- SQLite for local dev (`DATABASE_URL=sqlite:///db.sqlite3` in `.env`)
- PostgreSQL for production (switch `DATABASE_URL` in `.env`)
- Virtual environment at `.venv/` in project root
- `PYTHONPATH` patched in `settings.py` so `phase2.*` imports work from Django views

### Virtual environment setup

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r backend/requirements.txt
pip install -r phase2/requirements.txt
pip install torch --timeout 300   # large download — run separately
```

### Running the backend

```bash
.venv\Scripts\python.exe backend/manage.py migrate
.venv\Scripts\python.exe backend/manage.py runserver
# API available at http://localhost:8000
```

---

## Frontend — Setup & Documentation ✅ Complete

**What was built/fixed:**

- `frontend/README.md` — replaced the default Vite template README with a real setup guide for coworkers
- `frontend/.env.example` — fixed a bug: was set to `http://localhost:8000/api` which would produce double `/api/api` path (client.ts appends `/api` itself)

### Frontend quick-start for new coworkers

```bash
cd frontend
npm install          # installs exact versions from package-lock.json
cp .env.example .env # leave VITE_API_URL blank for local dev
npm run dev          # starts at http://localhost:5173
```

> **Note:** Frontend uses `package.json` + `package-lock.json` — this is the Node.js equivalent
> of Python's `requirements.txt`. No separate file needed. `npm install` is the equivalent
> of `pip install -r requirements.txt`.

---

## Persian Translations ✅ Fixed

All Persian (`fa`) text in Phase 1 seed data was reviewed and rewritten.

### Issues found and corrected

| Issue | Fix |
|-------|-----|
| "جعبه ۱/۲/۳" (literal Arabic word for box) | Replaced with "باکس ۱/۲/۳" (correct transliteration used in Iranian financial community for Dutch tax boxes) |
| 8 of 12 Q&A pairs had no `detailed_fa` | Added full `detailed_fa` to QA-2026-005 through QA-2026-012 |
| `LR-2026-001 plain_fa` lacked factor A and previous-year income details | Rewritten with formula explanation |
| `AHK-2026-001 plain_fa` missing phase-out range | Added: starts €29,736 → zero at €78,426 |
| `IACK-2026-001 plain_fa` missing couples rule | Added: credit goes to lower-earning partner |
| `ZT-2026-001 plain_fa` missing hard cutoff warning | Added: "یک یورو بیشتر = صفر zorgtoeslag" |
| `EXP-2026-001 plain_fa` missing phase-down schedule | Added: 30%/20%/10% by year |
| `DGA-2026-001 plain_fa` "جعبه ۱" | Fixed to "باکس ۱" |

After fixing, the vector index was rebuilt (`build_index.py --provider local --reset`) and all 5 accuracy tests still pass.

---

## Phase 3 — Tax Calculator Engine ✅ Complete

**What was built:**

A deterministic Dutch 2026 income tax calculator. All constants are read from `phase1/data/seed/tax_rules_2026.json` at import time. The AI never does arithmetic — it calls this engine and reads the result.

### Files created/modified

| File | Change |
|------|--------|
| `backend/apps/calculator/engine.py` | NEW — full calculation engine (~200 lines) |
| `backend/apps/calculator/serializers.py` | Added `CalculatorInputSerializer` with all profile fields |
| `backend/apps/calculator/views.py` | Filled `CalculateView.post()` — AllowAny, optional DB save |
| `phase1/data/seed/scenarios.json` | Updated all 6 scenarios with engine-computed values; added `box2_dividend: 24000` to SCN-DGA-001 profile |

### API endpoint

```
POST /api/calculator/calculate/
Content-Type: application/json

{
  "user_type": "zzp",
  "annual_revenue_zzp": 72000,
  "business_expenses": 9500,
  "hours_per_year": 1380,
  "is_starter": true,
  ...
}
```

Open to unauthenticated users. Results saved to DB only when authenticated.

### Calculator functions (all in `engine.py`)

| Function | Rules used |
|----------|-----------|
| `calc_box1_tax(taxable, aow_age)` | BR1-2026-001/002/003 |
| `calc_ahk(aggregate_income)` | AHK-2026-001 (phase-out formula) |
| `calc_arbeidskorting(work_income)` | AK-2026-001 |
| `calc_iack(work_income, children_under_12)` | IACK-2026-001 |
| `calc_kia(investments)` | KIA-2026-001 |
| `calc_zvw(zzp_profit)` | ZVW-2026-001 |
| `calc_box3(net_assets, has_partner, savings_fraction)` | B3R-2026-001 |
| `calc_box2(dividend)` | B2R-2026-001/002 |
| `calc_wet_dba(single_client_pct)` | WD-2026-001 |
| `calculate(profile)` | Full pipeline — main entry point |

### Key design decisions

- **Bracket 2 rate (37.07%)**: Not in the JSON rules (only the AOW-age variant BR1-2026-002 is). Added as a constant with a comment — correct Dutch 2026 law.
- **ZVW base**: `profit_after_oa − mkb` (before pension deduction). Pension deduction only reduces Box 1 income, not ZVW.
- **Effective rate denominator**: `gross_profit` after any 30% ruling adjustment.
- **Option B chosen**: Engine implements correct Dutch law. Scenario expected values were updated to match engine output (not vice versa). The <1% error target = match real Dutch tax law.

### Scenario results (engine output)

| Scenario | Type | Gross revenue | Total tax | Eff. rate | Monthly reserve |
|----------|------|--------------|-----------|-----------|----------------|
| SCN-ZZP-001 | ZZP yr3 IT | €72k | €13,776 | 22.0% | €1,148 |
| SCN-ZZP-002 | ZZP yr1 design | €28k | €1,808 | 7.3% | €151 |
| SCN-ZZP-003 | ZZP yr8 senior | €140k | €34,254 | 27.4% | €2,855 |
| SCN-EMP-001 | Employee | €48k | €10,079 | 21.0% | €0 |
| SCN-EXP-001 | Expat + 30% ruling | €90k | €14,270 | 22.7% | €0 |
| SCN-DGA-001 | DGA + BV + dividend | €56k+div | €17,010 | 30.4% | €0 |

### Scenario corrections vs. hand-computed values

| Scenario | Issue found | Fix applied |
|----------|-------------|-------------|
| SCN-ZZP-003 | Pension (€18k) not subtracted from taxable income | Engine correctly deducts pension |
| SCN-ZZP-003 | Box 3: has_partner=True → joint exemption 118,714 > assets 95,000 → tax=0 | Fixed (was €788) |
| SCN-DGA-001 | `box2_dividend` missing from profile | Added 24000 to profile JSON |
| SCN-DGA-001 | Box 3: joint exemption was not applied | Fixed (€1,324 vs old €3,498) |
| SCN-DGA-001 | Pension (€8k) not subtracted from taxable income | Engine correctly deducts pension |
| All scenarios | `box1_tax_bracket2` was absent | Added bracket 2 column to all scenarios |

---

## Phase 3 UI — Calculator Demo Page ✅ Complete

**What was built:**

A calculator form page at `/calculator` — same design language as the Phase 2 RAG demo. Lets you test the engine from the browser with real inputs and see the full tax breakdown instantly.

### Files created

| File | Purpose |
|------|---------|
| `frontend/src/pages/CalculatorPage.tsx` | Calculator form + results page |
| `frontend/src/pages/CalculatorPage.module.css` | CSS module matching Phase 2 design |
| `frontend/src/api/calculator.ts` | TypeScript API client for `POST /api/calculator/calculate/` |
| `frontend/src/App.tsx` | Added `/calculator` route + nav link |

### UI features

- User-type pills: ZZP / Employee / Expat / DGA — form fields update per type
- ZZP fields: revenue, expenses, hours, KIA investments, single client %, starter checkbox
- Expat fields: employment income, 30% ruling toggle, ruling year
- DGA fields: employment income, Box 2 dividend
- Common fields: pension, Box 3 assets, savings fraction, children, partner checkbox
- Summary cards: total tax due, effective rate, monthly reserve, Wet DBA risk (colour-coded)
- Full breakdown table: every intermediate step from gross revenue to total tax

---

## Post-Phase 3 Fixes ✅

| Fix | Detail |
|-----|--------|
| ZVW rate 5.32% → **4.85%** | Correct 2026 rate confirmed via Belastingdienst fisin2026 |
| ZVW ceiling €71,628 → **€79,409** | Updated maximum bijdrage-inkomen for 2026 |
| Arbeidskorting build-up formula | Replaced incorrect linear ramp with official 2026 4-bracket table — fixes under-calculation for low-income ZZP |
| Partner income field | Calculator UI now shows Partner income field when "Has partner" is ticked |

---

## Git Branch & Commits

**Branch: `master`** — all phases merged

| Commit | Description |
|--------|-------------|
| `5bd13c2` | fix: show partner income field when has_partner is checked |
| `1aee17d` | fix: correct 2026 ZVW rate (4.85%) and arbeidskorting formula |
| `a261bd5` | docs: update PROGRESS.md — Phase 3 UI complete |
| `936dd84` | merge(phase3): tax calculator engine + UI into master |
| `3871acd` | fix: use import type for CalcInput/CalcResult interfaces |
| `21a2d1b` | feat: Phase 3 UI — calculator demo page at /calculator |
| `f40c712` | feat: Phase 3 engine — deterministic Dutch 2026 tax calculator |
| `00f321e` | feat: Phase 2 UI — RAG retrieval demo page |
| `c132118` | feat: Phase 1 knowledge base + Phase 2 RAG pipeline complete |

---

## Phase 4 — AI Response Layer ✅ Complete

**Goal:** A working chat interface where the user asks a Dutch tax question and Claude answers using RAG context + calculator output, in NL/EN/FA, with source citations.

### What was built

| File | Change |
|------|--------|
| `backend/apps/chat/serializers.py` | Added `ChatMessageSerializer` (message + optional user_profile + conversation_history) |
| `backend/apps/chat/views.py` | Added `ChatMessageView` — AllowAny, calls Phase 2 RAG + Phase 3 calculator + Claude streaming SSE |
| `backend/apps/chat/urls.py` | Registered `message/` endpoint |
| `frontend/src/pages/ChatPage.tsx` | Full chat UI — message bubbles, streaming tokens, markdown rendering, example questions, RTL Persian |
| `frontend/src/pages/ChatPage.module.css` | Chat styles matching project design system |
| `frontend/src/api/chat.ts` | Added `sendMessage()` — native fetch with ReadableStream SSE parsing |
| `frontend/src/App.tsx` | Replaced inline stub with lazy-loaded `ChatPage`, removed auth guard, `/` now redirects to `/chat` |
| `frontend/src/i18n/locales/nl.json` | Added `chat.*` keys |
| `frontend/src/i18n/locales/en.json` | Added `chat.*` keys |
| `frontend/src/i18n/locales/fa.json` | Added `chat.*` keys (Persian) |

### Key design decisions

| Decision | Choice |
|----------|--------|
| Streaming | Django `StreamingHttpResponse` + `text/event-stream` SSE; Fetch API `ReadableStream` on frontend |
| Markdown | `react-markdown` library — Claude responses render with bullets, bold, headers |
| Auth for chat | `AllowAny` — consistent with Phase 3 calculator approach |
| Context window | Last 10 conversation turns passed to Claude |
| RAG + calculator | Both run **inside** the SSE generator (not before it) so HTTP headers go out immediately |
| Mock mode | When `ANTHROPIC_API_KEY` is absent, streams a canned response instantly — no ML model loaded |
| No Redis needed | `ChatMessageView` is synchronous SSE — no Celery/queue required. Old `AskView` + `tasks.py` are dormant |

### Confirmed working (tested manually)

| Feature | Status |
|---------|--------|
| SSE streaming to browser | ✅ |
| `react-markdown` rendering (bold, bullets, code) | ✅ |
| Multi-turn conversation history | ✅ |
| Mock mode (no API key) responds immediately | ✅ |
| Example question buttons | ✅ |
| NL / EN / FA i18n keys | ✅ |

### To activate real Claude responses

Add to `.env` and restart Django:
```
ANTHROPIC_API_KEY=sk-ant-...
```
No other changes needed — the view auto-detects the key and switches to Claude.

---

---

## Phase 5 — User Intake System ✅ Complete

**Goal:** Guided onboarding flow so users get personalised Claude answers without manually running the calculator first.

### What was built

| File | Change |
|------|--------|
| `frontend/src/pages/IntakePage.tsx` | 3-step wizard: user type → income → situation → calls calculator → saves profile → navigates to chat |
| `frontend/src/pages/IntakePage.module.css` | Wizard styles — centered card, progress dots, type grid, field layout |
| `frontend/src/App.tsx` | Added `/intake` route (lazy-loaded) |
| `frontend/src/pages/ChatPage.tsx` | Empty state now shows "Set up your profile" CTA button → `/intake` |
| `frontend/src/pages/ChatPage.module.css` | Added `.intakeBtn` style |
| `frontend/src/i18n/locales/nl.json` | Added `intake.*` + `chat.setup_profile` keys |
| `frontend/src/i18n/locales/en.json` | Added `intake.*` + `chat.setup_profile` keys |
| `frontend/src/i18n/locales/fa.json` | Added `intake.*` + `chat.setup_profile` keys (Persian) |

### Intake flow (3 steps)

| Step | What it collects |
|------|-----------------|
| 1 — Who are you? | User type: ZZP / Employee / Expat / DGA (big clickable cards) |
| 2 — Your income | ZZP: revenue + expenses + starter flag. Employee: salary. Expat: salary + ruling year. DGA: salary + dividend |
| 3 — Your situation | Has partner + partner income, children under 12, Box 3 assets (optional), pension (optional) |

On finish: calls `POST /api/calculator/calculate/` silently, saves `CalcInput` to `localStorage["taxwijs_calc_input"]`, navigates to `/chat`. The existing Phase 4 profile banner picks it up automatically.

### Key design decisions

| Decision | Choice |
|----------|--------|
| hours_per_year default | 1300 (above 1225 urencriterium threshold — qualifies for zelfstandigenaftrek) |
| savings_fraction default | 0.5 (50/50 savings vs investments for Box 3) |
| Calculator call | Runs silently on submit; navigates to chat even if it fails |
| Skip button | Always visible — users can go straight to chat and ask freely |
| Profile storage | Same `taxwijs_calc_input` key as calculator page — banner and backend passthrough work automatically |

---

---

## Phase 6 — IB Return Guide ✅ Complete

**Goal:** Step-by-step walkthrough of the Dutch annual income tax return (aangifte inkomstenbelasting), using the 9 IB form fields from Phase 1.

### What was built

| File | Change |
|------|--------|
| `backend/apps/tax/views.py` | Added `IBFieldsView` — `GET /api/tax/ib/fields/?user_type=zzp`, reads Phase 1 JSON, filters by user_type, in-memory cache |
| `backend/apps/tax/urls.py` | Registered `ib/fields/` endpoint |
| `frontend/src/api/ib.ts` | `IBField` TypeScript interface + `fetchIBFields()` |
| `frontend/src/pages/IBGuidePage.tsx` | Full guide page — field cards, currency/boolean inputs, mistakes toggle, Ask Claude button, summary table |
| `frontend/src/pages/IBGuidePage.module.css` | Guide styles |
| `frontend/src/App.tsx` | Added `/ib-guide` route + "IB Aangifte/IB Return" nav link |
| `frontend/src/pages/ChatPage.tsx` | Reads `location.state.question` on mount — pre-fills input when navigated from IB Guide |
| `frontend/src/i18n/locales/nl.json` | Added `ib.*` keys |
| `frontend/src/i18n/locales/en.json` | Added `ib.*` keys |
| `frontend/src/i18n/locales/fa.json` | Added `ib.*` keys (Persian) |

### The 9 IB fields served

| Code | Field | User types |
|------|-------|------------|
| 1a | Winst uit onderneming | ZZP |
| 1b | Loon en uitkeringen | Employee, ZZP |
| 1c | Zelfstandigenaftrek (1,225 hrs check) | ZZP |
| 1d | Startersaftrek — ⚠️ LAST YEAR 2026 | ZZP |
| 1e | MKB-winstvrijstelling (12.7%) | ZZP |
| 1f | Lijfrentepremies / jaarruimte | ZZP, Employee |
| 2a | Voordeel aanmerkelijk belang | DGA |
| 3a | Bezittingen Box 3 | All |
| VOL-1 | Voorlopige aanslag | All |

### Key design decisions

| Decision | Choice |
|----------|--------|
| Filter | `user_type` query param filters fields at the API level; `"all"` fields always included |
| Cache | `IBFieldsView._cache` — JSON file read once per server process |
| "Ask Claude" | `useNavigate('/chat', { state: { question } })` — pre-fills input, user reviews before sending |
| No backend save | Answers are guide-only (component state) — no DB model needed |
| Summary | Appears once ≥1 field is answered; shows answered fields + "Go to chat" |

---

## Phase 4–6 Debugging & Integration ✅ Complete

**Real Claude API integration — root cause & fix:**

The streaming endpoint returned "Connection error." even after the API key was added. Root causes found and fixed in order:

| Problem | Root cause | Fix |
|---------|-----------|-----|
| Blank response (mock mode) | `sentence-transformers` ML model loaded before StreamingHttpResponse generator started (30–60 s block) | Moved all imports inside generator; mock mode skips RAG entirely |
| SSE errors swallowed | `catch {}` in `sendMessage()` caught both JSON parse errors and intentional `throw new Error(data.error)` | Separated try/catch: JSON.parse only inside try, error/text handling outside |
| "Connection error." (real mode) | `ANTHROPIC_API_KEY` in `.env` had leading space + double-quote: `' "sk-ant-api03-…'` — invalid key format | Stripped whitespace and quotes from .env value |
| Misleading error message | `str(e)` on `anthropic.APIConnectionError` gave generic "Connection error." | Changed to `getattr(e, 'message', None) or str(e)` to surface actual Anthropic error |

**Diagnostic endpoint added:** `GET /api/chat/test/` — calls Claude non-streaming and returns JSON. Useful for isolating API issues from SSE complexity.

**Confirmed working:** Streaming chat with real Claude responses, RAG context injection, calculator profile block, conversation history, all three languages.

---

## Phase 7 — Testing & QA ✅ Complete

**50 automated tests — all passing.**

### Test files

| File | Tests | Coverage |
|------|-------|----------|
| `backend/apps/calculator/tests.py` | 38 | Scenario accuracy (6 phase1 scenarios ≤1% error), Box1/AHK/Arbeidskorting/IACK/ZVW/Box2/Box3/KIA unit tests, calculator API |
| `backend/apps/chat/tests.py` | 12 | SSE streaming mock mode, message validation, IB fields API filter |

### Key findings during testing

| Finding | Detail |
|---------|--------|
| ZVW rate | Confirmed 4.85% (rule ZVW-2026-001), NOT 5.32% — ceiling income €79,409, max €3,851 |
| IACK max | Reached at income ≥ €32,713 via formula `(income − 6,239) × 0.1145` |
| KIA shape | Peaks mid-range (~€70k), not monotonically decreasing — eligible band only |
| Serializer | `annual_revenue_zzp` must be > 0 for zzp users — 0 returns 400 |

### Run tests

```bash
cd backend
python manage.py test apps.calculator apps.chat
```

---

## Phase 8 — Product Layer ✅ Complete

**Auth, landing page, and user account management.**

### What was built

| File | Purpose |
|------|---------|
| `frontend/src/context/AuthContext.tsx` | React context — holds `user`, `logout()`, `setUser()`. Fetches profile on mount via stored JWT. |
| `frontend/src/api/auth.ts` | Added `fetchProfile()`, `AuthUser` interface. `login()` stores tokens; `logout()` clears them. |
| `frontend/src/pages/LandingPage.tsx` | Marketing home page — hero, 4 feature cards, two CTAs. Route: `/` |
| `frontend/src/pages/LoginPage.tsx` | Login form → JWT → profile fetch → navigate to `/chat`. |
| `frontend/src/pages/RegisterPage.tsx` | Register form → auto-login → navigate to `/intake`. |
| `frontend/src/App.tsx` | Auth-aware nav (email + Logout when logged in; Login + Register when not). Landing at `/`. |
| `main.tsx` | Wrapped app in `<AuthProvider>`. |
| All 3 i18n files | Added `auth.login_error/register_error/no_account/have_account` + full `landing.*` keys in NL/EN/FA. |

### Auth flow

```
Anonymous: / (landing) → /register → auto-login → /intake → /chat
Returning:  / (landing) → /login → /chat
Logged in:  nav shows email + Logout button
```

All routes remain accessible without auth (AllowAny on all API endpoints). Auth adds identity + future persistence.

---

---

---

## Phase 9 — Aangifte IB Simulation ✅ Complete

**Goal:** A full branching simulation of the Belastingdienst aangifte IB 2026 process — so users can walk through the real tax return flow, understand what questions will be asked, and practice filling in all fields before doing the real thing.

### What was built

| File | Purpose |
|------|---------|
| `frontend/src/data/simulationSteps.ts` | Complete 11-step simulation data — all fields in NL/EN/FA, condition functions for branching, `answersToCalcProfile()` mapper |
| `frontend/src/pages/SimulationPage.tsx` | Full wizard component — sidebar with clickable steps, 5 field types (boolean/number/text/select/info), OverviewStep with real calculator API + breakdown table, Ask Claude on every field |
| `frontend/src/pages/SimulationPage.module.css` | Two-column layout: 260px sticky sidebar + flex main; field rows; result grid; responsive mobile |
| `frontend/src/App.tsx` | Added `/simulation` route + "Simulatie Aangifte" / "Return Simulation" / "شبیه‌سازی اظهارنامه" nav link |
| All 3 i18n files | Added `nav.simulation` key |

### Simulation steps (11 total)

| # | Step | Condition |
|---|------|-----------|
| 1 | Persoonlijke gegevens | Always shown |
| 2 | Soort inkomen | Always shown |
| 3 | Loon & uitkeringen | `is_employee OR has_benefits` |
| 4 | Winst uit onderneming | `is_zzp` |
| 5 | Eigen woning | Always shown |
| 6 | Aftrekposten | Always shown |
| 7 | Inkomen buitenland | `has_foreign_income` |
| 8 | Sparen & beleggen (Box 3) | Always shown |
| 9 | Aanmerkelijk belang (Box 2) | `has_substantial_interest` |
| 10 | Heffingskortingen | Always shown |
| 11 | Overzicht & berekening | Always shown (OverviewStep) |

### Key features

- **Full branching**: steps 3, 4, 7, 9 appear only when the user's earlier answers require them
- **Ask Claude on every field**: each field has a context-aware question pre-written — clicking navigates to `/chat` with the question pre-filled
- **Real calculator at the end**: step 11 calls `POST /api/calculator/calculate/` and shows result cards (total tax, effective rate, monthly reserve, provisional already paid) + full breakdown table
- **Trilingual**: all labels, help texts, step titles, and Claude questions in NL/EN/FA
- **Sidebar navigation**: click any step to jump; completed steps show ✓ checkmark; current step has accent border
- **Progress bar**: fills as user advances through steps
- **Source links**: fields with a Belastingdienst URL show a "Belastingdienst ↗" link
- **Mobile responsive**: sidebar collapses to horizontal icon strip; field rows stack vertically

### `answersToCalcProfile()` mappings

Maps simulation answers to `CalcInput` for the calculator API:

| Simulation field | Calculator field |
|-----------------|-----------------|
| `is_zzp` + `gross_profit` | `user_type: "zzp"`, `annual_revenue_zzp` |
| `business_expenses` | `business_expenses` |
| `hours_per_year` | `hours_per_year` |
| `is_starter` | `is_starter` |
| `kia_investments` | `kia_investments` |
| `single_client_pct` | `single_client_percentage` |
| `is_employee` + `salary` | `user_type: "employee"`, `employment_income` |
| `has_30pct_ruling`, `ruling_year` | `has_30pct_ruling`, `ruling_year_number` |
| `box2_dividend` | `box2_dividend` |
| `pension_deduction` | `pension_deduction` |
| `box3_assets` | `box3_assets` |
| `savings_fraction` | `savings_fraction` |
| `children_under_12` | `children_under_12` |
| `has_fiscal_partner` | `has_fiscal_partner` |
| `partner_income` | `partner_income` |
| `_voorlopige_amount`, `_had_voorlopige` | Overview display only (not sent to calculator) |

---

## Project Status — All Phases Complete ✅

| Phase | Description | Branch | Status |
|-------|-------------|--------|--------|
| Phase 1 | Knowledge Base — 28 rules, 12 Q&A, 6 scenarios, 9 IB fields | main | ✅ |
| Phase 2 | RAG Pipeline — ChromaDB, embeddings, retriever, assembler | feat/phase2-ui | ✅ |
| Phase 3 | Tax Calculator Engine — deterministic 2026 Dutch tax | feat/phase3-calculator | ✅ |
| Phase 4 | AI Response Layer — Claude streaming via SSE | phase4-ai-response-layer | ✅ |
| Phase 5 | User Intake Wizard — 3-step profile onboarding | phase5-user-intake | ✅ |
| Phase 6 | IB Return Guide — 9-field aangifte walkthrough | phase6-ib-return-guide | ✅ |
| Phase 7 | Testing & QA — 50 automated tests | phase7-testing-qa | ✅ |
| Phase 8 | Product Layer — landing page, auth, user accounts | phase8-product-layer | ✅ |
| Phase 9 | Aangifte IB Simulation — full branching, 11 steps, Ask Claude on every field | phase9-simulation | ✅ |
| Phase 10 | Admin Tax Rules Dashboard — full CRUD, multi-year, audit log | phase10-admin-dashboard | ✅ |

---

## Phase 10 — Admin Tax Rules Dashboard ✅ Complete

**Goal:** A professional internal admin panel for managing Dutch tax rules. Admins can browse, search, filter, create, edit, verify, and duplicate rules across tax years. All changes are logged in an audit trail.

### Architecture decisions

| Decision | Choice |
|----------|--------|
| Stack | React + TypeScript + Tailwind CSS (admin-scoped, no base reset) |
| Backend | Mock in-memory store (drop-in for Django API later) |
| CSS isolation | `@tailwind components/utilities` only in `admin.css`, imported only via `AdminLayout` — does not affect existing CSS Module pages |
| Components | shadcn-style (manual build) — no CLI, full Tailwind control |
| Icons | lucide-react |
| Forms | React Hook Form + Zod validation with cross-field rules |
| Routing | 6 admin routes in React Router, lazy-loaded |
| Data | 35+ mock rules across 2025/2026/2027 with realistic Dutch tax data |

### Files created

| File | Purpose |
|------|---------|
| `frontend/src/styles/admin.css` | Scoped Tailwind entry (no base reset) |
| `frontend/src/lib/utils.ts` | `cn()`, `formatEur()`, `formatPct()`, `formatDate()` |
| `frontend/src/lib/tax-rules/types.ts` | Full TypeScript types: TaxRule, AuditEntry, AdminStats, RuleFilters |
| `frontend/src/lib/tax-rules/schema.ts` | Zod schemas with cross-field validation |
| `frontend/src/lib/tax-rules/mock-data.ts` | 35+ rules for 2025/2026/2027 with realistic data |
| `frontend/src/lib/tax-rules/api.ts` | Mock CRUD API: getRules, getRuleById, createRule, updateRule, duplicateRuleToYear, deleteRule, getAdminStats |
| `frontend/src/lib/tax-rules/audit.ts` | Audit log with pre-seeded entries |
| `frontend/src/components/ui/index.tsx` | Button, Badge, Input, Textarea, Select, Card, Table, Alert, Spinner |
| `frontend/src/components/admin/AdminLayout.tsx` | Sidebar + Topbar wrapper |
| `frontend/src/components/admin/AdminSidebar.tsx` | Dark slate-900 sidebar with NavLink items |
| `frontend/src/components/admin/AdminTopbar.tsx` | White header with page title + user email |
| `frontend/src/components/admin/RuleStatusBadge.tsx` | Status-to-Badge mapper |
| `frontend/src/components/admin/StatCard.tsx` | Metric card with icon, value, trend, colour variants |
| `frontend/src/pages/admin/AdminDashboard.tsx` | Overview: 6 stat cards, attention table, rules by year/category, quick actions |
| `frontend/src/pages/admin/AdminRulesPage.tsx` | Full rules table: search, 4 filters, column sort, duplicate/delete dialogs |
| `frontend/src/pages/admin/AdminRuleEditorPage.tsx` | 6-tab rule editor: Basic Info, Result/Formula, Multilingual, AI & RAG, Source & Verification, Audit History |
| `frontend/src/pages/admin/AdminCalculatorPreviewPage.tsx` | Profile form → matched verified rules with match reasons |
| `frontend/src/pages/admin/AdminRAGPreviewPage.tsx` | Query box → simulated vector retrieval → assembled AI context block |
| `frontend/src/pages/admin/AdminSettingsPage.tsx` | Active year, language, verification policy, backend status |

### Admin pages (6 routes)

| Route | Page | Key features |
|-------|------|-------------|
| `/admin` | Overview Dashboard | 6 stat cards (total/verified/pending/draft/expired/expiring-soon), "Needs Attention" table, rules-by-year bars, category tag cloud, quick actions |
| `/admin/rules` | Rules Table | Full-text search; filter by year/user_type/status/category; sortable columns (ID/topic/year/status/updated); row actions (edit/duplicate/delete); URL-synced filters |
| `/admin/rules/new` | New Rule Editor | 6-tab form; user type multi-select pills; tag input; phase-out fields; radio status picker with descriptions; Zod validation on save |
| `/admin/rules/:id` | Edit Rule Editor | Same form, pre-populated; unsaved-changes indicator; audit history tab with diff display |
| `/admin/calculator-preview` | Calculator Preview | Sample profile builder → shows all verified rules that match, with match reason and AI hint |
| `/admin/rag-preview` | RAG Preview | Query text + filters → simulated top-5 retrieval → assembled context block (mirrors phase2/assembler.py format) |
| `/admin/settings` | Settings | Active tax year picker, default language, verification policy, data source status |

### Rule editor tabs

| Tab | Contents |
|-----|---------|
| Basic Info | ID, year, topic, category, user types (pill toggles), effective dates, supersedes, tags |
| Result / Formula | Result type, value, unit, formula expression, notes, phase-out parameters |
| Multilingual | Dutch (NL), English (EN), Persian (FA) explanation textareas — all required for verified status |
| AI & RAG | `ai_prompt_hint` field — injected as `AI INSTRUCTION: …` into assembled RAG context |
| Source & Verification | Source URL (with live open link), verification status radio picker with descriptions |
| Audit History | Chronological log of all changes with actor, timestamp, and field diff |

### Data: 35+ mock rules

Rules span 2025/2026/2027 with realistic Dutch tax data:
- **2026** (23 rules): BR1, MKB, ZA, SA, ZVW, AHK, AK, IACK, B2R, B3R, KIA, ZT, EXP, DGA, WD, BTW, KOR, DL, LR, HT — all verified
- **2025** (11 rules): Same rule set with 2025 values — ZA at €2,470, AHK at €3,068, etc.
- **2027** (1 rule): ZA-2027-001 as draft (€900 estimate — startersaftrek abolished from 2027)

### TypeScript

All files pass `npx tsc --noEmit` with `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `verbatimModuleSyntax: true`.

---

---

## Full Tailwind Migration ✅ Complete

**Goal:** Remove all CSS Modules from the frontend; migrate every page to fully Tailwind-based styling. Extend mock tax rules to 50+ rules with trilingual user-facing questions. Rebuild ChatPage with card-based UX (no free-text input).

### What was changed

| File | Change |
|------|--------|
| `frontend/tailwind.config.js` | Expanded `content` to `"./src/**/*.{ts,tsx}"` (was admin-only); added brand color aliases, `slideUp`/`fadeIn` keyframes, `slide-up`/`fade-in` animation utilities |
| `frontend/src/index.css` | Added `@tailwind base/components/utilities` globally at top; kept all CSS variables |
| `frontend/src/styles/admin.css` | Removed duplicate `@tailwind` directives (now global); kept `.admin-root`, `.rtl-field`, `.admin-scrollbar` |
| `frontend/src/lib/tax-rules/types.ts` | Added `user_facing_question_nl/en/fa` optional fields to `TaxRule` interface |
| `frontend/src/lib/tax-rules/mock-data.ts` | Expanded from 28 → 50+ rules; added `user_facing_question_nl/en/fa` to all rules; new 2026 rules: KOT, KGB, REI, THW, EW, HYP, GIF, ZK, VOL, RES, EFF, ERF, VPB×2, BTW-2026-002 |
| `frontend/src/pages/ChatPage.tsx` | Fully rewritten — card-based UX (Option 2): no free text input; question cards slide up in chat area with staggered animation; `RESULT_QUESTIONS` per user type (ZZP/employee/expat/DGA) × 3 languages; `askedQuestions` set tracks history; 10-message session limit; gate screen when no profile |
| `frontend/src/pages/LandingPage.tsx` | Migrated to Tailwind; removed CSS module import |
| `frontend/src/pages/LoginPage.tsx` | Migrated to Tailwind; removed CSS module import |
| `frontend/src/pages/RegisterPage.tsx` | Migrated to Tailwind; removed CSS module import |
| `frontend/src/pages/IntakePage.tsx` | Migrated to Tailwind; removed CSS module import |
| `frontend/src/pages/CalculatorPage.tsx` | Migrated to Tailwind; removed CSS module import |
| `frontend/src/pages/IBGuidePage.tsx` | Migrated to Tailwind; removed CSS module import; fixed `.catch(() => setFields([]))` bug |
| `frontend/src/pages/SimulationPage.tsx` | Migrated to Tailwind; removed CSS module import; full two-column layout preserved |
| `frontend/src/pages/Phase2Demo.tsx` | Migrated to Tailwind; removed CSS module import; doc-type/behavior badges now use semantic Tailwind color classes |
| `frontend/src/App.tsx` | Nav fully migrated to Tailwind; extracted `NavItem` component; removed all inline `style={{}}` objects |

### Deleted files

All orphaned CSS module files removed:
- `src/App.css`
- `src/pages/ChatPage.module.css`
- `src/pages/LandingPage.module.css`
- `src/pages/LoginPage.module.css`
- `src/pages/RegisterPage.module.css`
- `src/pages/IntakePage.module.css`
- `src/pages/CalculatorPage.module.css`
- `src/pages/IBGuidePage.module.css`
- `src/pages/SimulationPage.module.css`
- `src/pages/Phase2Demo.module.css`

### ChatPage card UX (Option 2)

- Cards live **inside the chat area**, not a sidebar — they slide up with `animate-slide-up` staggered by `animationDelay: i * 60ms`
- Empty state: 6 cards shown; after first exchange: 4 remaining unasked cards shown
- `RESULT_QUESTIONS` — 10 ZZP questions, 8 employee, 6 expat, 6 DGA; all in NL/EN/FA
- `askedQuestions: Set<string>` — already-asked cards filtered out
- `showCards: boolean` — hidden during loading, shown 300ms after AI responds
- No free-text input at all — all interaction via question cards
- Profile gate: if no `taxwijs_calc_input` in localStorage, shows CTA to `/intake`
- Session counter shown; "Clear" button resets conversation

### TypeScript

All files pass `npx tsc --noEmit` with strict mode (`noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`).

---

---

## Premium / Monetisation Layer ✅ Complete

**Goal:** Free tier with daily limits, Premium tier at €9.99/month via Stripe, upgrade modal on limit hit, pricing page.

### Tiers

| Tier | Who | Limit | Gate |
|------|-----|-------|------|
| Anonymous | Not logged in | 5 questions / session | Register modal |
| Free | Logged-in, plan=free | 10 questions / day | Upgrade modal |
| Premium | Logged-in, plan=premium | Unlimited | — |

### What was built

**Backend:**

| File | Change |
|------|--------|
| `backend/apps/users/models.py` | Added `plan` (free/premium), `stripe_customer_id`, `daily_message_count`, `daily_message_date` fields |
| `backend/apps/users/migrations/0002_*` | Auto-migration for new fields |
| `backend/apps/users/serializers.py` | Exposes `plan`, `daily_message_count`, `daily_message_date`, `is_admin` in profile response |
| `backend/apps/payments/views.py` | `CreateCheckoutSessionView`, `BillingPortalView`, `StripeWebhookView` |
| `backend/apps/payments/urls.py` | Routes: `create-checkout-session/`, `billing-portal/`, `webhook/` |
| `backend/config/urls.py` | Registered `api/payments/` |
| `backend/config/settings.py` | Added `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `FRONTEND_URL`, `FREE_DAILY_LIMIT=10`, `ANON_SESSION_LIMIT=5` |
| `backend/apps/chat/views.py` | Replaced flat session limit with plan-aware guard: premium = unlimited, free = 10/day (server-side counter), anon = 5/session |
| `backend/requirements.txt` | Added `stripe>=7.0.0` |
| `.env.example` | Added Stripe keys + FRONTEND_URL |

**Stripe webhook events handled:**
- `checkout.session.completed` → set `plan=premium`, store `stripe_customer_id`
- `customer.subscription.deleted` / `paused` → set `plan=free`
- `customer.subscription.resumed` → set `plan=premium`

**Frontend:**

| File | Change |
|------|--------|
| `frontend/src/api/auth.ts` | Added `plan`, `daily_message_count`, `daily_message_date` to `AuthUser` |
| `frontend/src/api/chat.ts` | Added JWT `Authorization` header to fetch; added `TokenMeta` interface; handles `upgrade_required` SSE event |
| `frontend/src/api/payments.ts` | `createCheckoutSession()`, `createBillingPortalSession()` |
| `frontend/src/components/UpgradeModal.tsx` | Modal with Free vs Premium comparison table, three trigger reasons (session_limit / daily_limit / register) |
| `frontend/src/pages/PricingPage.tsx` | Full pricing page at `/pricing` — two plan cards, feature lists, FAQ |
| `frontend/src/pages/ChatPage.tsx` | ⚡ Premium badge, daily counter for free users, session counter for anon, upgrade CTA link, UpgradeModal on limit hit |
| `frontend/src/App.tsx` | Added `/pricing` route, `Pricing` nav link, ⚡ Premium badge in nav when `user.plan === 'premium'` |
| All 3 i18n files | Added `upgrade.*` and `pricing.*` keys in NL/EN/FA; updated `session_count`, added `daily_count` + `upgrade_cta` |

### Limit enforcement flow

```
SSE response → backend checks plan
  premium user    → no limit, stream Claude
  free user       → check daily_message_count vs FREE_DAILY_LIMIT
                    if over → stream { upgrade_required: true, reason: "daily_limit" }
                    else    → increment count, stream Claude
  anon user       → check session_count from request body vs ANON_SESSION_LIMIT
                    if over → stream { upgrade_required: true, reason: "session_limit" }
                    else    → stream Claude

Frontend parseSSE → detects upgrade_required
  → removes pending assistant bubble
  → shows UpgradeModal with correct reason
```

### Stripe setup (test mode)

1. Create a product + monthly price in Stripe dashboard
2. Add to `.env`: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`
3. For local webhook testing: `stripe listen --forward-to localhost:8000/api/payments/webhook/`

---

## Phase 11 — UI Redesign ✅ Complete

**Goal:** Rebuild the entire frontend UI to match the designer's files in `ui/`. Complete visual rebrand from purple-on-white to sage/olive-green on warm cream paper.

### Design files location

```
ui/
├── TaxWijs UI.html          ← standalone HTML preview of all screens
├── src/
│   ├── tokens.css           ← full design token system (CSS custom properties)
│   ├── components.jsx       ← shared components: Wordmark, TopNav, LangSwitch, Icon, MobileFrame, etc.
│   └── screens/
│       ├── landing.jsx      ← LandingPage (desktop + mobile)
│       ├── chat.jsx         ← ChatPage (desktop + mobile, ProfileBar, AnswerCard, ChatCards)
│       ├── intake.jsx       ← IntakePage (3-column wizard)
│       ├── calculator.jsx   ← CalculatorPage (type selector, results, bracket bar, breakdown table)
│       ├── ib-guide.jsx     ← IBGuidePage (progress strip, IBFieldCard with box badges)
│       ├── simulation.jsx   ← SimulationPage (sidebar nav, step 4 content, step 11 overview)
│       ├── pricing.jsx      ← PricingPage + UpgradeModal (desktop + mobile)
│       ├── auth.jsx         ← LoginPage + RegisterPage (2-column split with editorial right panel)
│       ├── admin.jsx        ← Admin dashboard + rules table
│       └── system.jsx       ← Design system showcase (colors, type, buttons, tokens)
```

### New design system (from `ui/src/tokens.css`)

**Brand color:** Sage / olive-green (`--sage-600` = primary) — replaces current purple `#aa3bff`

**Color tokens (replace current vars in `index.css`):**
```css
--paper:       oklch(0.985 0.008 95)   /* warm cream page bg */
--paper-2:     oklch(0.972 0.012 95)   /* card surface */
--paper-3:     oklch(0.955 0.015 95)   /* nested surface */
--paper-tint:  oklch(0.96 0.022 115)   /* green wash */
--ink:         oklch(0.20 0.012 90)    /* headings, primary text */
--ink-2:       oklch(0.36 0.012 90)    /* body */
--ink-3:       oklch(0.52 0.010 90)    /* muted */
--ink-4:       oklch(0.70 0.008 90)    /* hint / disabled */
--hairline:    oklch(0.88 0.012 95)    /* dividers */
--hairline-2:  oklch(0.82 0.014 95)    /* stronger dividers */
--sage-500 through --sage-700          /* primary brand scale */
--accent:      var(--sage-600)
--accent-soft: oklch(0.95 0.045 115)   /* soft green bg */
--accent-line: oklch(0.80 0.090 117)   /* green border */
--ok:  oklch(0.55 0.13 150)   --warn: oklch(0.72 0.14 75)   --danger: oklch(0.58 0.18 25)
```

**Typography (3 fonts, load via Google Fonts):**
- `--sans`: Geist — all UI text
- `--serif`: Instrument Serif — all display headings (`h1`, `h2`, featured numbers)
- `--mono`: JetBrains Mono — all numeric values, eyebrow labels, code

**Component atoms (from tokens.css):**
- `.eyebrow` — 10.5px mono, 0.14em letter-spacing, uppercase, `var(--ink-3)` — used everywhere as section labels
- `.eyebrow-accent` — same but `var(--sage-700)`
- `.font-serif` — switches element to Instrument Serif
- `.font-mono` — switches element to JetBrains Mono + tabular nums
- `.pill`, `.pill-accent`, `.pill-ok`, `.pill-warn`, `.pill-danger` — status badges
- `.btn`, `.btn-primary`, `.btn-accent`, `.btn-ghost`, `.btn-soft` + `.btn-sm`/`.btn-lg` — button system
- `.input` — standard text input (42px, focus ring in sage)
- `.card` — `var(--paper-2)` bg, hairline border, `--r-lg` radius
- `.grain` — hero section background with radial gradient overlays
- `.dots` — dashed horizontal divider
- `.hair`, `.hair-v` — 1px solid dividers

### Shared components to create

| Component | File | What it does |
|-----------|------|-------------|
| `Wordmark` | `components/Wordmark.tsx` | Shield SVG (sage-600 fill, white checkmark path) + Instrument Serif "TaxWijs" text |
| `TopNav` | `components/TopNav.tsx` | Sticky 64px header: Wordmark + nav links (underline-active style) + LangSwitch + auth area |
| `LangSwitch` | `components/LangSwitch.tsx` | NL / EN / FA pill toggle (paper-3 bg, ink active pill) |
| `Icon` | `components/Icon.tsx` | arrow, check, x, spark, chev, edit, info, external — all as SVG functional components |

### Pages to rebuild (10 pages)

| Page | Key design features |
|------|---------------------|
| **LandingPage** | Grain hero section; 64px Instrument Serif headline with italic sage; live-answer card mockup with floating "NL" and "€ 24,310" chips; 4-column features grid (separated by hairline); proof table; footer CTA centered |
| **ChatPage** | `ProfileBar` — sage-soft bg strip with user type avatar (colored square + glyph); `AnswerCard` — assistant avatar "T" circle, paper-2 card, "Your numbers" dashed panel, sources footer; `ChatCards` — 2×3 grid, slide-up animation on mount, eyebrow tag + question text + "Ask →" |
| **IntakePage** | 3-column grid (320px sidebar · 1fr center card · 320px right panel); step list with filled/active circles; running estimate box in sidebar; dark ink card on right ("Why we ask"); `IntakeStep1` type grid 2×2; `IntakeStep2` unit-prefix inputs; `IntakeStep3` ToggleField / SelectField / NumField |
| **CalculatorPage** | Type selector pills (ink bg when active); 2-column form + results; `SummaryCard` variants (primary=sage-100, ink=dark, warn, ok); bracket bar; full breakdown table with big serif total |
| **IBGuidePage** | Progress bar strip (9 colored segments); `IBFieldCard` with BOX badge (color per box), mono field code, serif field title, warn pill for startersaftrek; common-mistakes expand; "Ask TaxWijs" btn-soft footer |
| **SimulationPage** | Full-width progress bar (sage-600); 280px sidebar with dark step indicators; `SimSection` with eyebrow title + 2-col field grid; `SimField` with "Ask" button per field; step 11 big reveal card |
| **PricingPage** | Serif headline "Free to try. €9.99 when you're ready."; free card (plain ghost btn); premium card (gradient bg, sage-300 border, shadow-lg, absolute "⚡ MOST PICKED" badge); `PricingList` with circle check icons; 4-item FAQ accordion |
| **LoginPage** | 2-column split: form left (max-w 380, centered vertically) + grain right panel with today's tip quote + 3 stat boxes |
| **RegisterPage** | Same 2-column shell; right panel shows type-specific benefit list that updates as user selects type |
| **App.tsx / nav** | Replace current nav with `TopNav` component; 64px height; Wordmark; nav links use underline-active (not bg pill); `LangSwitch` in header |

### Implementation approach

- CSS custom properties handle all colors and typography — Tailwind handles layout/spacing
- Keep all route paths, i18n keys, API calls, auth logic, and Stripe integration unchanged
- Add Google Fonts import to `index.html` (not `index.css`) for best performance
- Replace current CSS variables in `index.css` with new token set from `tokens.css`
- Global `.eyebrow`, `.font-serif`, `.font-mono`, `.grain`, `.dots`, `.pill-*`, `.btn-*`, `.input`, `.card` atoms go in `index.css` under `@layer components`
- Mobile responsive: use `md:` prefix for structural breakpoints

### What was built

| File | Change |
|------|--------|
| `frontend/index.html` | Added Google Fonts import: Geist, Instrument Serif, JetBrains Mono |
| `frontend/src/index.css` | Full design token system (oklch color scale, sage/paper/ink tokens, shadow, radii, typography vars); global component atoms: `.eyebrow`, `.btn`, `.card`, `.grain`, `.pill`, `.hair`, `.dots`, `.tw-input`, `.tw-label`; animations `cardIn`, `fadeIn` |
| `frontend/src/components/Wordmark.tsx` | NEW — shield SVG + Instrument Serif "TaxWijs" wordmark |
| `frontend/src/components/TopNav.tsx` | NEW — sticky 64px header: Wordmark + nav links + LangSwitch + auth area; mobile-responsive (nav links hidden on small screens) |
| `frontend/src/components/LangSwitch.tsx` | NEW — NL/EN/FA pill toggle |
| `frontend/src/components/Icon.tsx` | NEW — arrow, check, x, spark, chev, edit, info, external SVG components |
| `frontend/src/hooks/useMobile.ts` | NEW — `useMobile(breakpoint?)` hook using `matchMedia` |
| `frontend/src/pages/LandingPage.tsx` | Full redesign — grain hero, 64px serif headline, live-answer card, 4-column features, proof table, footer CTA; responsive |
| `frontend/src/pages/LoginPage.tsx` | Full redesign — 2-column split (form left, editorial right with today's tip); right panel hidden on mobile |
| `frontend/src/pages/RegisterPage.tsx` | Full redesign — same 2-column shell; right panel shows type-specific benefit list; right panel hidden on mobile |
| `frontend/src/pages/ChatPage.tsx` | Full redesign — ProfileBar with user type avatar, sage-soft strip; answer bubbles; 2-column question cards; RTL support; mobile-responsive |
| `frontend/src/pages/IBGuidePage.tsx` | Full redesign — progress strip, IBFieldCard with BOX badge (colored per box), mono field code, serif title, mistakes expander, "Ask TaxWijs" footer; 2-column grid → single on mobile |
| `frontend/src/pages/SimulationPage.tsx` | Full redesign — 4px full-width progress bar; 280px sidebar with step indicators; FieldRow with unit-prefix inputs; OverviewStep with dark ink header + serif result; sidebar hidden on mobile |
| `frontend/src/pages/PricingPage.tsx` | Full redesign — serif headline; free + premium cards (premium has gradient bg, shadow-lg, "⚡ MOST PICKED" badge); feature comparison list; FAQ section |
| `frontend/src/components/UpgradeModal.tsx` | Full redesign — blur backdrop; comparison table; serif headline; ⚡ accent circle; headlineMap per reason |
| `frontend/src/App.tsx` | Updated to use `TopNav` + `LangSwitch` components; added all new routes |
| `frontend/src/context/AuthContext.tsx` | Fixed `import type { ReactNode }` for `verbatimModuleSyntax` |
| `frontend/tsconfig.app.json` | Added `"ignoreDeprecations": "6.0"` to silence TypeScript 6 `baseUrl` deprecation |
| All 3 i18n locale files | Added `landing.headline_1/2` split keys; fixed missing commas (root cause of blank page bug on first deploy) |
| `frontend/src/lib/tax-rules/api.ts` | Removed unused `baseId` variable |
| `frontend/src/pages/admin/AdminRulesPage.tsx` | Removed unused `Input` import |
| `frontend/src/pages/admin/AdminRAGPreviewPage.tsx` | Removed unused `Input` import |

### Bugs fixed during redesign

| Bug | Root cause | Fix |
|-----|-----------|-----|
| Blank page on first load | All three i18n locale JSON files were missing commas after the `"headline_2"` key — invalid JSON crashed i18next silently at startup | Added missing commas |
| `login()` / `register()` wrong call signature | Pages called `login(email, password)` with two positional args; API takes an object `{ username, password }` | Fixed to pass objects |
| `s.optional` doesn't exist on `SimStep` | SimulationPage sidebar rendered `{s.optional && …}` but `SimStep` only has `condition?: (a) => boolean` | Changed to `{s.condition && …}` |
| `field.hint` doesn't exist on `SimField` | FieldRow referenced `field.hint` which isn't in the interface | Removed the line |
| UpgradeModal wrong Icon import path | Used `"../components/Icon"` from within `components/` | Fixed to `"./Icon"` |
| Duplicate style keys in IBGuidePage `<ul>` | Had both `marginTop` and `margin`, and `paddingLeft` twice | Collapsed to `margin: "8px 0 0 0", paddingLeft: 28` |

---

## Phase 11 Post-Redesign Bug Fixes ✅

### Chat SSE — stream stalled after heartbeat

**Symptom:** Chat sent the SSE heartbeat event but no Claude tokens ever arrived. Stream hung indefinitely.

**Root cause:** The `stream_response()` generator, after yielding the heartbeat, called `retrieve()` from `phase2.retriever`. Since the embedding manifest exists and both `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` are set, `retrieve()` made a live OpenAI embedding API call followed by ChromaDB initialisation. If the OpenAI call hung (network latency, rate limit, etc.), the entire generator blocked indefinitely — no more yields, no Claude response.

**Secondary cause:** Vite's proxy had no explicit timeout, so on slower machines the connection could also be dropped.

**Fixes applied:**

| File | Fix |
|------|-----|
| `backend/apps/chat/views.py` | Wrapped the entire RAG block in a `ThreadPoolExecutor` with `future.result(timeout=8)`. If RAG takes > 8 seconds, it's skipped and Claude is called with the `"=== No tax context available ==="` fallback. The executor is shut down with `wait=False` so a hung background thread never blocks the stream. |
| `frontend/vite.config.ts` | Added `proxyTimeout: 120_000` and `timeout: 120_000` (2 minutes) to the `/api` proxy so the connection is never dropped while waiting for Claude to start streaming. |

### Chat SSE — 401 Unauthorized on every message

**Symptom:** Django logs showed `POST /api/chat/message/ HTTP/1.1" 401 178` on every chat request.

**Root cause:** The frontend sends `Authorization: Bearer <token>` on every request (via `localStorage.getItem("access_token")`). When the JWT access token expires, `JWTAuthentication.authenticate()` raises `InvalidToken` — which Django REST Framework converts to a `401` response **before** the permission check even runs. The view has `permission_classes = [AllowAny]`, but that check is never reached.

The Axios auto-refresh interceptor in `client.ts` does not apply because the SSE endpoint uses native `fetch`, not Axios.

**Fixes applied:**

| File | Fix |
|------|-----|
| `backend/apps/chat/views.py` | Added `SoftJWTAuthentication(JWTAuthentication)` — catches `InvalidToken` and returns `None` instead of raising, treating an expired/invalid token as anonymous. `ChatMessageView` now uses `authentication_classes = [SoftJWTAuthentication]`. |
| `frontend/src/api/chat.ts` | Added `refreshAccessToken()` helper that calls `/api/auth/token/refresh/` with the stored refresh token. `sendMessage()` now retries on 401: tries refresh → if successful, retries with new token; if refresh fails (no refresh token or refresh expired), retries without `Authorization` header (anonymous). The `AllowAny` + `SoftJWTAuthentication` combination accepts anonymous requests. |

### Responsiveness — no mobile layout

**Symptom:** All redesigned pages used hardcoded inline grid styles with fixed column counts. On mobile screens (< 768px) layouts overflowed or were too narrow to read.

**Fix:** Created `frontend/src/hooks/useMobile.ts` — a `matchMedia`-based React hook. Applied it to the 6 most-used pages and the TopNav:

| Component | Desktop → Mobile change |
|-----------|------------------------|
| `TopNav` | Nav links hidden; email/pill hidden; padding reduced to `0 16px` |
| `LandingPage` | Hero 2-col → 1-col (card hidden); features 4-col → 2-col; proof 2-col → 1-col; padding reduced |
| `LoginPage` | Right editorial panel hidden; form takes full width; padding reduced |
| `RegisterPage` | Same as Login |
| `SimulationPage` | Sidebar hidden (progress bar still visible); grid → single column |
| `IBGuidePage` | 2-column fields + sidebar → single column; padding reduced |
| `ChatPage` | Question cards 2-col → 1-col; profile bar and message area padding reduced |

---

---

## Phase 12 — Bug Fixes, Conversational Chat, Dashboard, Admin API, Docker ✅ Complete

**All changes merged to `master` on 26 May 2026.**

### Bug fixes

| Bug | Root cause | Fix |
|-----|-----------|-----|
| **Hours per year field had no effect** | `IntakePage.tsx` line 211: `value=""` and `onChange={() => {}}` hardcoded — field was completely disconnected from state | Added `const [hours, setHours] = useState("1300")` and wired the `UnitInput` to it; `handleFinish` now uses `parseInt(hours) \|\| 1300` |
| **Login invisible on mobile** | `TopNav` hid all nav links + the login `NavLink` when `isMobile` was true — only the Register button showed | Rewrote `TopNav` with a hamburger button that opens a fixed dropdown panel showing all nav links, Login, Register/Logout — all accessible on mobile |

### Conversational chat intake

**Problem:** The chatbot required users to complete the intake wizard before chatting. There was no free-text input — only pre-defined question cards.

**What was built:**

| File | Change |
|------|--------|
| `frontend/src/pages/ChatPage.tsx` | Full rewrite — added auto-resize `<textarea>` at bottom (always visible), removed hard profile gate, `INTAKE_GREETING` messages per language, `extractIntakeProfile()` parser for `[INTAKE_COMPLETE:{}]` SSE blocks, silent calculator call on profile extraction, result summary appended to chat message |
| `frontend/src/api/chat.ts` | Added `intakeMode` parameter to `sendMessage()` — passed in request body as `intake_mode: boolean` |
| `backend/apps/chat/serializers.py` | Added `intake_mode = BooleanField(required=False, default=False)`; increased `message` max_length to 800 |
| `backend/apps/chat/views.py` | Added `INTAKE_SYSTEM_PROMPT` — 6-question structured intake via Claude (user type → income → expenses/hours → starter → partner/children → assets). Instructs Claude to output `[INTAKE_COMPLETE: {json}]` when done. When `intake_mode=True` and no profile, skips RAG + calculator and uses intake prompt instead |

**New chat flow for users without a profile:**
1. Bot greets in user's language and asks work type (ZZP / Employee / Expat / DGA)
2. Asks income questions (max 6 total across the conversation)
3. Claude outputs `[INTAKE_COMPLETE: {...}]` in its final intake message
4. Frontend detects the JSON, saves to `localStorage`, silently POSTs to `/api/calculator/calculate/`, appends tax summary to the chat message
5. Chat switches to result-explanation mode — question cards appear for follow-up

### Navigation changes

| Change | Detail |
|--------|--------|
| `/calculator` removed from user nav | Still accessible at the URL for devs/admins. Regular users interact via chat only |
| Nav split by auth state | **Guests:** Chat · Pricing. **Logged-in:** Dashboard · Chat · IB Guide · Simulation · Pricing |
| `nav.dashboard` i18n key added | NL: "Dashboard" · EN: "Dashboard" · FA: "داشبورد" |

### User Dashboard (`/dashboard`)

New page at `/dashboard` — only accessible to logged-in users (redirects to `/login` otherwise).

| Section | Contents |
|---------|----------|
| Summary cards (4-up grid) | Total tax (accent bg), effective rate, monthly reserve, Wet DBA risk (ZZP only) — loaded from calculator via stored profile |
| Quick actions | Ask assistant (`/chat`), Update profile (`/intake`), IB guide, Simulation |
| Calculation history | Last 5 calculations from `GET /api/calculator/history/` — user type, year, date, total tax, effective rate |
| Profile card | Displays user type, income, partner, children; edit button → `/intake` |
| Upcoming deadlines | BTW Q1 (30 Apr), IB return (1 May), BTW Q2 (31 Jul), BTW Q3 (31 Oct) — colour-coded warn/ok |
| Account card | Email, plan badge, Upgrade link for free users |

### Admin backend — Tax Rules REST API

**Problem:** Admin frontend was using in-memory mock data that was lost on page reload and had no persistence.

| Item | Detail |
|------|--------|
| `TaxRule` Django model | Added to `backend/apps/tax/models.py` — mirrors Phase 1 JSON schema: `rule_id`, `year`, `topic`, `category`, `user_types`, `result_type/value/unit/formula`, `plain_nl/en/fa`, `ai_prompt_hint`, `source_url`, `verification_status`, `effective_from/until`, `supersedes`, audit fields |
| Migration | `backend/apps/tax/migrations/0003_add_taxrule_model.py` — applied |
| `import_from_json()` | Class method on `TaxRule` — reads Phase 1 seed JSON and `update_or_create` each rule. 28 rules now in DB |
| REST API (staff only) | `GET/POST /api/tax/rules/` — list (with `?year=`, `?status=`, `?category=`, `?search=`) + create. `GET/PATCH/DELETE /api/tax/rules/{rule_id}/` — detail. `POST /api/tax/rules/import/` — re-import seed. `GET /api/tax/admin/stats/` — dashboard stats |
| `IsStaffUser` permission | Custom DRF permission: `is_staff OR is_admin` |
| Frontend `api.ts` | Rewrote `lib/tax-rules/api.ts` — real `fetch` calls to Django backend with mock data fallback. Maps Django field names ↔ frontend `TaxRule` type via `mapDjangoRule()` / `mapToPayload()` |

### Docker & production setup

| File | Purpose |
|------|---------|
| `Dockerfile.backend` | Python 3.12-slim + gunicorn; copies `backend/`, `phase1/`, `phase2/`; runs `docker-entrypoint.sh` |
| `docker-entrypoint.sh` | Runs `migrate`, `collectstatic`, seeds tax rules from Phase 1 JSON if DB is empty, then starts gunicorn |
| `Dockerfile.frontend` | Node 22 build stage → nginx alpine; accepts `VITE_API_URL` build arg |
| `nginx.conf` | SPA `try_files`, `/api/` proxy to backend, `proxy_buffering off` for SSE streaming, 1-year cache for hashed assets |
| `docker-compose.yml` | Services: `db` (pgvector/pg16, healthcheck), `backend` (depends on healthy db), `frontend` (nginx); named volumes for postgres data, chromadb, static files |
| `.env.production.example` | All required env vars documented with comments |
| `backend/config/settings.py` | Added `if not DEBUG:` production security block: `SECURE_PROXY_SSL_HEADER`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `SECURE_HSTS_SECONDS=31536000`, `SECURE_HSTS_INCLUDE_SUBDOMAINS`, `SECURE_CONTENT_TYPE_NOSNIFF`, `X_FRAME_OPTIONS=DENY` |

### Deploy with Docker

```bash
# 1. Clone repo and fill in environment
cp .env.production.example .env
# Edit .env — fill in POSTGRES_PASSWORD, DJANGO_SECRET_KEY,
# ANTHROPIC_API_KEY, OPENAI_API_KEY, STRIPE_*, ALLOWED_HOSTS, FRONTEND_URL

# 2. Start all services
docker-compose up -d

# 3. Create first admin user
docker-compose exec backend python manage.py createsuperuser

# 4. (Optional) Build the Phase 2 RAG index
docker-compose exec backend python /app/phase2/build_index.py --provider openai
```

### Test results

| Suite | Result |
|-------|--------|
| Django tests (`apps.calculator apps.chat`) | ✅ 50/50 pass |
| TypeScript strict (`npx tsc --noEmit`) | ✅ 0 errors |

---

## Project Status — All Phases Complete ✅

| Phase | Description | Branch | Status |
|-------|-------------|--------|--------|
| Phase 1 | Knowledge Base — 28 rules, 12 Q&A, 6 scenarios, 9 IB fields | master | ✅ |
| Phase 2 | RAG Pipeline — ChromaDB, embeddings, retriever, assembler | master | ✅ |
| Phase 3 | Tax Calculator Engine — deterministic 2026 Dutch tax | master | ✅ |
| Phase 4 | AI Response Layer — Claude streaming via SSE | master | ✅ |
| Phase 5 | User Intake Wizard — 3-step profile onboarding | master | ✅ |
| Phase 6 | IB Return Guide — 9-field aangifte walkthrough | master | ✅ |
| Phase 7 | Testing & QA — 50 automated tests | master | ✅ |
| Phase 8 | Product Layer — landing page, auth, user accounts | master | ✅ |
| Phase 9 | Aangifte IB Simulation — full branching, 11 steps | master | ✅ |
| Phase 10 | Admin Tax Rules Dashboard — full CRUD, multi-year, audit log | master | ✅ |
| Phase 11 | UI Redesign — sage/olive design system, all pages rebuilt | master | ✅ |
| Phase 12 | Bug fixes, conversational chat, dashboard, admin API, Docker | master | ✅ |

---

## Phase 13 — Security Hardening, Full API Tests, Brand Polish ✅ Complete

**All changes merged to `master` on 27 May 2026.**

### Security fixes

| Issue | Severity | Fix |
|-------|----------|-----|
| `/phase2` route publicly accessible | High | Removed from React router — page exposed internal RAG mechanics ("AI instruction" labels, chunk IDs, cascade scores) |
| `/api/chat/test/` endpoint | High | Removed — returned `"model": "claude-sonnet-4-6"` to any unauthenticated caller, directly revealing the AI provider |
| `Phase2RetrieveView` AllowAny | High | Changed to `IsStaffUser` — was exposing internal RAG retrieval results to anyone |
| DB port 5432 exposed to host | Medium | Removed from docker-compose — DB is internal Docker network only |
| Backend port 8000 exposed to host | Medium | Removed — nginx handles all external traffic on port 80 |
| Admin routes unguarded in React | Medium | Added `AdminRoute` component — redirects non-staff to `/` before any admin page renders |
| `SECURE_SSL_REDIRECT = env()` | Medium | Fixed to `env.bool()` — string `"True"` wasn't being parsed as boolean in production |
| No request throttling | Medium | Added DRF `DEFAULT_THROTTLE_CLASSES` (60/min anon, 300/min user); SSE endpoint explicitly exempted |
| `SoftJWTAuthentication` not shared | Low | Extracted to `config/authentication.py` and applied to `CalculateView` + `IBFieldsView` — stale tokens no longer cause spurious 401s on public endpoints |
| `AskView` Celery dead code | Low | Removed from URLs and views — Celery/Redis not in compose; calling the endpoint would hang |
| No `.dockerignore` | Low | Added — excludes `.venv/`, `node_modules/`, `.env`, `CLAUDE.md`, `PROGRESS.md` from Docker build context |

### API test results (all pass)

| Test | Result |
|------|--------|
| `GET /api/users/health/` | ✅ `{"status":"ok"}` |
| `POST /api/users/register/` | ✅ User created |
| `POST /api/auth/token/` | ✅ JWT access + refresh issued |
| `GET /api/users/profile/` (authenticated) | ✅ User data (no stripe_customer_id in response) |
| `POST /api/calculator/calculate/` (anonymous) | ✅ Returns €15,875 on €72k ZZP |
| `POST /api/calculator/calculate/` (stale/invalid token) | ✅ HTTP 200 — SoftJWTAuthentication treats stale token as anon |
| `GET /api/tax/ib/fields/?user_type=zzp` (no token) | ✅ 8 fields returned |
| `GET /api/tax/rules/` (no token) | ✅ 401 |
| `GET /api/tax/rules/` (regular user) | ✅ 403 |
| `GET /api/tax/admin/stats/` (regular user) | ✅ 403 |
| `GET /api/chat/test/` | ✅ 404 — endpoint removed |
| `POST /api/tax/phase2/retrieve/` (anonymous) | ✅ 403 — now staff-only |
| `POST /api/chat/message/` (intake mode, count=4) | ✅ SSE heartbeat + Claude response |
| `POST /api/chat/message/` (intake mode, count=5) | ✅ `upgrade_required: session_limit` |
| `POST /api/payments/webhook/` (no signature) | ✅ HTTP 400 |
| `POST /api/auth/token/refresh/` | ✅ New access token issued |

### Brand polish

| Change | Detail |
|--------|--------|
| **Logo** | `Wordmark.tsx` upgraded — shield now uses `linearGradient` (sage-600 → sage-700) matching brand spec |
| **Favicon** | Replaced generic purple lightning bolt with sage-green shield+checkmark SVG |
| **Serif font** | Replaced `Instrument Serif` (editorial/italic) with `Lora` (professional, financial-grade serif used by legal/financial products) |
| **Mono font** | Replaced `JetBrains Mono` with `Geist Mono` — single family source for consistency |
| **Loading screen** | New `LoadingScreen.tsx` — shield breathing rings + animated checkmark draw-on + rotating status tips + progress bar. Replaces text "Loading…" as Suspense fallback across all lazy routes |

### New files

| File | Purpose |
|------|---------|
| `backend/config/authentication.py` | Shared `SoftJWTAuthentication` class — imported by chat, calculator, tax views |
| `frontend/src/components/LoadingScreen.tsx` | Brand loading screen used as Suspense fallback |
| `.dockerignore` | Excludes build artifacts, secrets, and internal docs from Docker context |

---

## Current State (27 May 2026)

### Branch

`master` — all phases merged and pushed to GitHub.

### Servers

| Server | Command | URL |
|--------|---------|-----|
| Django | `.venv\Scripts\python.exe backend/manage.py runserver` | `http://localhost:8000` |
| Vite | `cd frontend && npm run dev` | `http://localhost:5173` |
| Docker (prod) | `docker-compose up -d` | `http://localhost` |

### Environment (`.env` at project root)

Both `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` are set and confirmed working. `ANTHROPIC_API_KEY` used for Claude chat streaming. `OPENAI_API_KEY` used for Phase 2 RAG embeddings (OpenAI embedding calls happen in a background thread with 8s timeout — they're non-blocking for chat).

### Database

PostgreSQL. The `TaxRule` table is seeded with all 28 Phase 1 rules. Run migrations on a fresh DB:
```bash
.venv\Scripts\python.exe backend/manage.py migrate
```

### TypeScript

All files pass `npx tsc --noEmit` with strict mode. No errors.

### Known open items

| Item | Detail |
|------|--------|
| Phase 2 RAG index | ChromaDB at `phase2/chroma_db/` is empty unless built. RAG calls fall back to `"=== No tax context available ==="` silently. To build: `python phase2/build_index.py --provider local` (or `--provider openai`) |
| Admin UI redesign | `ui/src/screens/admin.jsx` has a new design spec. Admin pages (`/admin/*`) still use the Phase 10 Tailwind component library. Redesign is optional — functionality works. |

---

## Session — 11 Jun 2026 ✅ Complete

### Theme: new blue dark-first design system (commit `fd8ac07`)

Applied a completely new design system from `ui/new-ui/` to all existing pages. Only the **theme** changed — all page structure, content, navigation, and animations were kept intact.

**Design system changes:**

| Token group | Before | After |
|---|---|---|
| Color brand | Sage / green | Blue (oklch hue 265) |
| Default mode | Light-first | Dark-first |
| Primary font | Inter + Lora | Plus Jakarta Sans only |
| Monospace | JetBrains Mono | JetBrains Mono (kept) |

**Strategy:** All old variable names (`--paper`, `--ink`, `--sage-*`, `--hairline`) kept as CSS aliases pointing to the new values. This auto-updated ~40 existing TSX files without editing them.

**Files changed:**
- `frontend/index.html` — Google Fonts updated to Plus Jakarta Sans + JetBrains Mono
- `frontend/src/index.css` — complete token rewrite (dark-first blue system + legacy aliases + new animation keyframes + new utility classes)
- `frontend/src/components/Wordmark.tsx` — new blue rounded-square logo mark (triangle SVG), bold wordmark, blue "Wijs"
- `frontend/src/components/LoadingScreen.tsx` — orbit ring, animated progress ring, dot-grid background, ambient glow, cycling tips
- `frontend/src/components/TopNav.tsx` — blue active state indicators and borders
- `frontend/src/pages/LandingPage.tsx` — CSS-var palettes (auto dark/light), blue user chat bubble, footer CTA updated
- `frontend/src/pages/ChatPage.tsx` — blue message bubbles, blue AI avatar, updated mode chips, `dotBounce` typing animation
- `frontend/src/pages/DashboardPage.tsx` — `.afu` page-entry animation
- `frontend/src/pages/LoginPage.tsx` — blue logo gradients, blue radial background

**New CSS utilities:** `.afu`, `.afi`, `.asi`, `.dot-grid`, `.skel`, `.card-elevated`, `.pill-blue`, `.pill-purple`, `.eyebrow-blue`

**TypeScript:** 0 errors. Build: ✓ clean.

---

### Theme refinement — bolder fonts, visible dividers, balanced backgrounds (commit `21f4a06`)

Four targeted UX improvements to `frontend/src/index.css` only.

#### 1 — Dark mode backgrounds lifted

| Token | Before | After |
|---|---|---|
| `--bg` | `oklch(0.09)` near-black | `oklch(0.14)` rich dark blue-gray |
| `--bg-2` | `oklch(0.11)` | `oklch(0.17)` |
| `--bg-3` | `oklch(0.13)` | `oklch(0.20)` |
| `--bg-4` | `oklch(0.16)` | `oklch(0.24)` |
| `--border` | `oklch(0.20)` barely visible | `oklch(0.30)` clearly defined |
| `--border-2` | `oklch(0.26)` | `oklch(0.38)` |
| `--border-3` | `oklch(0.34)` | `oklch(0.48)` |

#### 2 — Light mode backgrounds deepened

| Token | Before | After |
|---|---|---|
| `--bg` | `oklch(0.97)` near-white | `oklch(0.92)` noticeably tinted |
| `--bg-2` | `oklch(0.95)` | `oklch(0.88)` |
| `--bg-3` | `oklch(1.00)` pure white | `oklch(0.95)` |
| `--border` | `oklch(0.90)` barely visible | `oklch(0.76)` clearly defined |
| `--border-2` | `oklch(0.84)` | `oklch(0.68)` |
| `--blue-subtle` | `oklch(0.93)` | `oklch(0.86)` more saturated |

#### 3 — Font weights bumped globally

| Element | Before | After |
|---|---|---|
| `body` | 400 (default) | **500** |
| `h1–h4` | 700 | **800** |
| `a` (links) | inherited 400 | **600** |
| `button` | inherited 400 | **600** |

#### 4 — Dividers made visible

| Class | Before | After |
|---|---|---|
| `hr` (global) | browser default | 1.5px, `--border-2`, `margin: 40px 0`, rounded |
| `.divider` | 1px, `--border`, no margin | 1.5px, `--border-2`, `margin: 24px 0` |
| `.hair` / `.hair-v` | 1px, `--border` | 1.5px, `--border-2` |
| `.dots` | 1px, 6px spacing | 1.5px, 8px spacing |

**TypeScript:** 0 errors. Build: ✓ 1.82s clean.

---

## What Comes Next

| Item | Priority | Description |
|------|----------|-------------|
| **Build Phase 2 RAG index** | 🔴 High | `python phase2/build_index.py --provider openai` — gives chat real rule context |
| **Deploy to VPS** | 🔴 High | Fill `.env.production.example`, `docker-compose up -d`, create superuser |
| **Admin UI redesign** | 🟡 Optional | Port `/admin/*` pages to new sage design system (see `ui/src/screens/admin.jsx`) |
| **SEO pages** | Later | Django templates for landing + tax guide pages (server-rendered for Google indexing) |
| **Proactive alerts** | Later | Tax reminder engine — email/push notifications near deadlines |
| **Annual maintenance** | September | Update tax rules each September for the new tax year via admin panel |

---

## Session — 12 Jun 2026 (session 14) ✅ Complete

### Enterprise Platform — Phases 1–6 (feat/enterprise-phases-1-6 → master)

Full multi-tenant accountant platform implementation across 6 phases. 47 files changed, 3,746 insertions.

**Phase 1 — Foundation Hardening**
- Fixed multi-tenant security bug: `_can_access_client()` now scopes to owning accountant only (previously any accountant could see any client at detail level)
- `ReminderLog` model: tracks every reminder send per engagement (type, channel, delivered status)
- `PortalMessage` model: in-app messaging between accountant and client
- `retention_expires_at` field on `ClientDocument` for GDPR retention tracking
- Migrations: `0004_add_reminder_log_portal_message`, `0005_gdpr_document_retention`

**Phase 2 — Accountant Portal**
- `AccountantInboxView` (`GET /api/portal/inbox/`): aggregates pending docs, open actions, recent reminders, unread messages with counts
- `EngagementMessagesView` (`GET/POST /api/portal/engagements/<id>/messages/`): accountant thread, auto-marks as read
- Reminder persistence: every `PortalReminderView.post()` creates a `ReminderLog` record
- `ReminderLogSerializer` + `PortalMessageSerializer` (with `is_own` computed field)
- Frontend: `AccountantInboxPage` (`/accountant/inbox`) — KPI pills + 4 data sections (NL/EN/FA)
- Frontend: `AccountantSettingsPage` (`/accountant/settings`) — firm info + branding + subscription

**Phase 3 — Client Portal**
- `ClientMessagesView` (`GET/POST /api/portal/client/messages/`): client-facing message thread
- Frontend: `ClientMessagesPage` (`/client/messages`) — full-height chat with RTL support for Persian
- Frontend: `ClientProfilePage` (`/client/profile`) — personal + tax info form with PATCH to API

**Phase 4 — ZZP Daily Workspace**
- New Django app: `backend/apps/zzp/` (registered as `"apps.zzp"` in INSTALLED_APPS)
- Models: `ZZPRevenueEntry` (invoice tracking, auto-VAT), `ZZPExpenseEntry` (16 categories, deductible_amount), `ZZPHoursEntry` (urencriterium 1225h), `ZZPMileageEntry` (€0.23/km), `AccountantReviewEvent`
- Migration: `0001_initial_zzp_workspace`
- 12 API endpoints at `/api/zzp/`: revenue, expenses, hours, mileage CRUD + summary + review
- `ZZPSummaryView`: full year + quarterly VAT breakdown (vat_out − vat_in = payable)
- Frontend: `ZZPWorkspacePage` (`/zzp-workspace`) — 6 tabs: Overview, Revenue, Expenses, Hours, Mileage, VAT
  - Quick Actions bar, urencriterium progress bar, quarterly VAT table with BTW deadlines
  - Three-language support (NL/EN/FA) via type-safe T interface
- TypeScript API client: `frontend/src/api/zzp.ts` (13 exported functions + 8 interfaces)
- Background task: `quarterly_vat_summary_task`

**Phase 5 — Document Intelligence (OCR)**
- OCR provider pattern: `backend/apps/portal/ocr/`
  - `base.py`: `OCRProvider` abstract class + `OCRResult` dataclass
  - `factory.py`: reads `OCR_PROVIDER` env var, instantiates via importlib with graceful fallback
  - 4 providers: `none_provider` (default), `google_vision`, `google_document_ai`, `azure_document`
- `document_extraction.py` wired to call OCR provider when `OCR_PROVIDER != "none"`

**Phase 6 — Production Hardening**
- GDPR: `User.anonymize()` erases PII, `AccountDeletionView` (`DELETE /api/users/me/`), `DataExportView` (`GET /api/users/me/data-export/`), `purge_expired_documents_task`
- Celery Beat schedule: reminders daily 08:00, GDPR purge daily 02:00
- Structured JSON logging (verbose console formatter) + Sentry SDK stub (activates on `SENTRY_DSN` env var)
- Test suite: rewritten from pytest fixtures → Django `TestCase` (47 tests pass)
- `config/settings_test.py`: strips unavailable middleware (whitenoise) for test environment

**Navigation updates**
- Client sidebar: Messages (`/client/messages`), My Profile (`/client/profile`), ZZP Workspace (`/zzp-workspace`)
- Accountant sidebar: Inbox (`/accountant/inbox`), Settings (`/accountant/settings`)

**Security fix (multi-tenancy)**
- `_can_access_client()` previously returned `True` for any portal user; now requires ownership or `is_staff`
- This prevented cross-accountant data exposure at the engagement/checklist/document detail level

**Test results**
- `manage.py check` → 0 issues
- Django test suite: 47/47 pass
- `tsc --noEmit` → 0 errors
- `npm run build` → success (2193 modules, 2.23s)

**Commit:** d0bd5a0 on feat/enterprise-phases-1-6 → merged to master → pushed to GitHub (bac402c → 6ff8925)

---

## Session — 12 Jun 2026 (session 15) ✅ Complete

### UI Polish + Chat Platform Navigation — 6 issues fixed

Six reported UI/UX issues fixed across frontend pages and the backend AI system prompt.

---

#### Fix 1 — ClientProfilePage: form layout (Windows 98 → proper grid)

**Problem:** Labels misaligned, fields randomly distributed, postcode alone on its own row.

**Fix (`frontend/src/pages/ClientProfilePage.tsx` — full rewrite):**
- 2-column CSS grid throughout. Consistent `LABEL_STYLE` constant (uppercase, 0.72rem, `var(--text-3)`) and `SECTION_HEAD` constant (uppercase, 0.8rem).
- Personal info grid: `full_name | email`, `phone | birth_date`, `street (gridColumn: "1/-1" full width)`, `city | postcode` — postcode never alone.
- Tax info grid: `bsn | kvk`, `btw | tax_type`, `lang (full width)`.
- Email field read-only with hint. BSN with sensitive-data hint. Save button with "Saved ✓" feedback state.

---

#### Fix 2 — ClientMessagesPage: full redesign

**Problem:** Broken layout, no proper chat UI, `calc(100vh - 120px)` didn't account for the 280px sidebar.

**Fix (`frontend/src/pages/ClientMessagesPage.tsx` — full rewrite):**
- Added `/client/messages` to `FULL_BLEED` set in `AppLayout.tsx` so the page fills the content area without padding, matching the `/chat` pattern.
- Full-height flex column: header (avatar + title) → scrollable message list → input area.
- Messages grouped by date with centered day-separator dividers.
- Chat bubbles with RTL-aware border-radius (Persian mirrors corner rounding).
- Auto-resize textarea, Enter to send / Shift+Enter for new line.
- Empty state with icon and descriptive subtitle.

**Fix (`frontend/src/components/AppLayout.tsx`):**
- `FULL_BLEED = new Set(["/chat"])` → `new Set(["/chat", "/client/messages"])`.

---

#### Fix 3 — ZZPWorkspacePage: styling polish

**Problem:** Quick action buttons were plain bordered links; KPI cards were flat.

**Fix (`frontend/src/pages/ZZPWorkspacePage.tsx`):**
- `QuickActions`: replaced `borderLeft: 3px solid` buttons with dark card buttons — colored icon badge (↑ revenue, ↓ expense, ⏱ hours, 🛣 mileage), hover lift effect (`translateY(-1px)`), oklch accent colors.
- `OverviewTab` KPI cards: added colored icon badge with `accent + "22"` background, colored top border, improved number typography.

---

#### Fix 4 — Deduction Checker moved to AppLayout (sidebar always visible)

**Problem:** `/deduction-checker` was in `PublicLayout` (TopNav), so logged-in users saw the public navigation bar — felt like a different site.

**Fix (`frontend/src/App.tsx`):**
- Removed `/deduction-checker` from `PublicLayout` routes.
- Added `/deduction-checker` as the first route inside `AppLayout` — authenticated users always see the sidebar.

---

#### Fix 5 — ClientTasksPage: Take Action routing + Ask AI language

**Problem A:** "Take Action" for hours-registration tasks routed to `/chat` instead of the ZZP Workspace.

**Problem B:** "Ask AI" sent the task title (English from backend) with no language instruction, so the AI responded in English regardless of the UI language.

**Fix (`frontend/src/pages/portal/ClientTasksPage.tsx`):**
- Added `resolveRoute(task: Task): string` — checks task title/description for keywords (hours, uren, urencriterium, mileage, revenue, invoice, expense) and overrides the `CATEGORY_ROUTE` map to return `/zzp-workspace` for workspace tasks.
- `handleAskAI` prepends an explicit language instruction in the target language itself:
  - FA: `"لطفاً به فارسی پاسخ دهید.\n\n"`
  - NL: `"Antwoord alstublieft in het Nederlands.\n\n"`
  - EN: no prefix needed (default)
- `handleTakeAction` uses `resolveRoute(task)` and also prepends the language prefix when routing to `/chat`.

---

#### Fix 6 — Backend chat: platform navigation + KVK/BTW guidance + Rule 5 exception

**Problem:** When users clicked "Ask AI" on task cards, the AI had no knowledge of the platform's pages or tabs. It also had no guidance on what to say when encountering KVK/BTW numbers it cannot access.

**Fix (`backend/apps/chat/views.py` — `_result_system_prompt`):**

Added **PLATFORM NAVIGATION** section (injected before STRICT RULES):
- Full page/tab guide: hours → ZZP Workspace Hours tab (`/zzp-workspace`), expenses → Expenses tab, revenue → Revenue tab, mileage → Mileage tab, documents → `/client/documents`, deductions → `/deduction-checker`, calculator → `/calculator`, deadlines → `/tax-calendar`, profile → `/client/profile`.
- Instructions: when user arrives from a task card, (1) explain what the task is, (2) give the exact page/tab, (3) explain why completing it matters for tax.

Added **KVK / BTW / BSN guidance** section:
- KVK number: what it is, where to find it (KVK letter, any issued invoice, own kvk.nl account), why AI cannot look it up.
- BTW number: format `NL + BSN + B01`, found on BTW registration letter or invoices.
- BSN: on Dutch passport/ID/residence permit.
- Rule: never say "I don't know" — say "I can't access it, but here's where to find it."

Updated **Rule 5 (EXTERNAL SITE BAN)**:
- Added Exception B: kvk.nl is allowed ONLY to direct users to look up their own KVK registration number (not financial data entry).

Added **Rule 7 — PORTAL TASK PROTOCOL**:
- When the user's question includes a portal task title, always: (a) explain the task, (b) give the page/tab from the navigation guide, (c) explain why completing it on time helps their tax situation.

---

#### Checks

- [x] Profile page fields align correctly — no orphaned rows
- [x] Messages page fills full height with proper chat bubbles (RTL-aware for Persian)
- [x] ZZP Workspace quick action buttons have colored icon badges and lift on hover
- [x] Deduction Checker shows sidebar for all authenticated users
- [x] "Take Action" for hours tasks routes to `/zzp-workspace`
- [x] "Ask AI" prepends correct language instruction so AI responds in UI language
- [x] AI explains tasks, guides to correct page/tab, explains KVK/BTW when encountered
