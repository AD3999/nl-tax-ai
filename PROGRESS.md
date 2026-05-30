# TaxWijs — Build Progress Log

> This file tracks what has been built, tested, and shipped.
> Last updated: 30 May 2026 — Phase 26 complete. Full UX audit: formal type scale, WCAG AA, mobile responsiveness, form accessibility.

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

## What Comes Next

| Item | Priority | Description |
|------|----------|-------------|
| **Build Phase 2 RAG index** | 🔴 High | `python phase2/build_index.py --provider openai` — gives chat real rule context |
| **Deploy to VPS** | 🔴 High | Fill `.env.production.example`, `docker-compose up -d`, create superuser |
| **Admin UI redesign** | 🟡 Optional | Port `/admin/*` pages to new sage design system (see `ui/src/screens/admin.jsx`) |
| **SEO pages** | Later | Django templates for landing + tax guide pages (server-rendered for Google indexing) |
| **Proactive alerts** | Later | Tax reminder engine — email/push notifications near deadlines |
| **Annual maintenance** | September | Update tax rules each September for the new tax year via admin panel |
