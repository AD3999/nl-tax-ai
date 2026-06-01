# TaxWijs — Product Task Backlog
> Generated: 1 Jun 2026  
> Source: Gap analysis against Growth Strategy + Reminder Engine specs  
> Each task is written as a self-contained instruction you can hand to Claude tomorrow.

---

## TIER 1 — Revenue (Do These First, They Generate Money)

### T1-1: Restore the pricing page with the real tier structure
**Why:** The spec says pricing page is required for conversion. We deleted it. Bring it back with the correct 4-tier model.
**What to build:**
- Route `/pricing` → new `PricingPage.tsx` (replace the old redirect-to-home)
- Four tiers: Free (€0), Starter (€7–9/mo), ZZP Pro (€15–29/mo), One-time Report (€19)
- Each tier lists exact features in NL/EN/FA
- CTA buttons: "Start free", "Get ZZP Pro", "Buy report €19"
- Stripe buy buttons (placeholder OK until T1-3 is done)
- Add pricing link back to `NAV_ITEMS_GUEST` in TopNav

---

### T1-2: Add Stripe payment integration
**Why:** Zero revenue without it. The spec says start with the €19 one-time report.
**What to build:**
**Backend:**
- `pip install stripe` → add to `requirements.txt`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` to `.env`
- New model: `Purchase(user, product_type, stripe_payment_intent_id, amount_eur, status, created_at)`
- Migration for `Purchase` model
- `POST /api/users/purchase/create/` → creates Stripe PaymentIntent, returns `client_secret`
- `POST /api/users/purchase/webhook/` → Stripe webhook handler, marks purchase complete
- Add `product_type` to `User` or separate `UserAccess` model to track what user has paid for
**Frontend:**
- Install `@stripe/stripe-js` and `@stripe/react-stripe-js`
- `VITE_STRIPE_PUBLISHABLE_KEY` to `.env`
- `PaymentModal.tsx` component — shows Stripe Card Element, handles confirm
- `api/purchases.ts` — `createPaymentIntent()`, `checkAccess(product)`

---

### T1-3: Build PDF Tax Health Report (the €19 product)
**Why:** This is the spec's first real paid product. Health score + deductions + warnings + deadlines in a downloadable PDF.
**What to build:**
**Backend:**
- `pip install reportlab` (or `weasyprint`) → add to `requirements.txt`
- `GET /api/users/report/` → auth required, checks Purchase for `product_type="tax_report"`, generates PDF
- PDF content (all from existing data):
  - Page 1: User name, tax year, user type, date generated
  - Tax Health Score (0–100) with gauge visual as text description
  - Box 1 tax estimate, effective rate, monthly reserve
  - Active deductions (zelfstandigenaftrek, MKB, KIA, etc.) with amounts
  - Risk warnings (Wet DBA, urencriterium, ZVW reminder)
  - Upcoming deadlines (BTW Q dates, IB May 1)
  - Optimization opportunities (pension jaarruimte, voorlopige aanslag)
  - Footer: "Source: Belastingdienst | Verified 2026 | Not official tax advice"
**Frontend:**
- "Download Tax Report — €19" button in Dashboard sidebar
- If purchased: triggers `GET /api/users/report/` → downloads PDF
- If not purchased: opens `PaymentModal` for €19 one-time

---

### T1-4: Implement free-vs-paid gates (paywall)
**Why:** Everything that should be paid is currently free. The spec is explicit about this.
**What to gate (require Starter or higher):**
- Calculator: show first result free, hide detailed breakdown behind gate
- Dashboard: full deduction amounts gated (show count only for free users)
- Tax optimization opportunities: first one free, rest gated
- Multi-year comparison (TaxHistoryPage): require login + Starter
**What stays free forever:**
- Chat (limited to 5 sessions anon, 10/day free account)
- IB Guide (reading only)
- Basic tax estimator (income → rough bracket)
- Alert feed (top 3 alerts free, all alerts for paid)
**How to build:**
- `useAccess(product)` hook in frontend — checks `user.plan` or `Purchase` list
- `GateCard.tsx` component — renders locked state with upgrade CTA
- Backend: `UserAccess` helper that checks plan tier

---

## TIER 2 — Acquisition (Grow the User Base)

### T2-1: Build `/deduction-checker` as standalone free tool
**Why:** Spec's best viral hook — "Am I missing Dutch tax deductions?" The spec calls this a dedicated free page with a 6-question flow.
**What to build:**
- New page `DeductionCheckerPage.tsx` at route `/deduction-checker`
- 6-question wizard (no account required):
  1. Are you ZZP? (yes/no)
  2. How many hours did you work for your business? (number)
  3. Did you buy a laptop, phone, software? (yes/no)
  4. Do you work from a home office? (yes/no)
  5. Did you travel for work? (yes/no)
  6. Any education/training costs? (yes/no)
- Free output: "You may qualify for 3 deductions: zelfstandigenaftrek, MKB-winstvrijstelling, business expenses"
- **No amounts shown** — amounts are behind paywall
- CTA at bottom: "Get your full deduction amounts and PDF report — €19"
- Add to nav as primary CTA, also reachable from landing page hero
- Trilingual (NL/EN/FA)

---

### T2-2: Build SEO page `/zzp-tax-netherlands`
**Why:** This is the spec's primary organic acquisition channel. ZZP workers Google this exact phrase.
**What to build:**
- New page `ZZPTaxPage.tsx` at route `/zzp-tax-netherlands`
- Static SEO content (no AI, just well-written HTML):
  - H1: "ZZP Tax in the Netherlands — Complete 2026 Guide"
  - Sections: What taxes do ZZP pay | Box 1 brackets | Zelfstandigenaftrek explained | Urencriterium 1225 hours | MKB-winstvrijstelling | BTW obligations | ZVW health contribution | Key 2026 deadlines
  - Each section cites `belastingdienst.nl` source
  - Inline FAQ (accordion) for common questions
- `<meta>` tags: title, description, og:title optimized for search
- CTA after each section: "Check your ZZP deductions free →" → `/deduction-checker`
- CTA at page bottom: "Calculate your 2026 ZZP tax →" → `/intake`

---

### T2-3: Build SEO page `/expat-tax-netherlands`
**Why:** Second highest-value organic audience. Expats pay well and search in English.
**What to build:**
- New page `ExpatTaxPage.tsx` at route `/expat-tax-netherlands`
- Content: 30% ruling explained | Who qualifies | Phase-down from 2024 | M-form for partial year | Box 1 for expats | Box 3 foreign assets | Zorgtoeslag eligibility | Key deadlines
- English-first content (also NL/FA versions via i18n)
- CTA: "Ask the expat tax AI" → `/chat`
- CTA: "Calculate your 2026 expat tax" → `/intake`
- Meta tags optimized for "Dutch tax expat 2026", "30% ruling Netherlands"

---

### T2-4: Update landing page hero and CTA strategy
**Why:** Spec says primary CTA should be "Check my deductions" not "Set up profile". The viral hook is deduction discovery.
**What to change:**
- Primary button: "Check my ZZP deductions — free" → `/deduction-checker`
- Secondary button: "Calculate my tax" → `/intake`  
- Third link: "Ask tax AI" → `/chat`
- Add trust strip: "10,000+ ZZP checks · Verified 2026 rules · Sources: Belastingdienst"
- Add "As seen in" / social proof section (even placeholder for now)
- Feature cards: reorder to show Deduction Checker first, then Calculator, then Chat, then IB Guide

---

### T2-5: Add email capture on landing page
**Why:** Spec says email capture is in Week 3. Need leads even before full payment flow.
**What to build:**
- Simple email bar in hero: "Get 2026 ZZP tax tips" + email input + "Send me tips" button
- Backend: `POST /api/users/email-capture/` — no auth required, stores email + user_type preference
- New model: `EmailCapture(email, user_type, source_page, created_at)` 
- Thank-you state inline (no page redirect)
- Also add email capture as exit-intent in DeductionChecker result step

---

## TIER 3 — Product Quality & Retention

### T3-1: Upgrade Reminder Engine to full calendar data model
**Why:** Current alert system is event-driven but not a proper reminder calendar. The spec defines a `TaxReminder` type with due_date, recurrence, reminder_offsets, action_type. This is the foundation for all advanced reminders.
**What to build:**
**Backend:**
- New model `TaxReminder` with fields matching the spec's TypeScript type:
  - `id`, `title_nl/en/fa`, `description_nl/en/fa`
  - `category` (income_tax | vat | payroll | corporate_tax | dividend_tax | toeslagen | provisional_assessment | box3 | expat | admin | documents)
  - `user_types` (JSONField array)
  - `tax_year`, `due_date` (DateField)
  - `recurrence` (monthly | quarterly | yearly | custom | null)
  - `reminder_offsets` (JSONField — e.g. [30, 14, 7, 1] days before due_date)
  - `source_url`, `source_status` (official | estimated | user_defined)
  - `verification_status` (draft | pending_review | verified | expired)
  - `action_type` (file_return | pay_tax | update_income | upload_document | check_eligibility | review_rule | book_consultation)
- Seed all 2026 deadlines as verified `TaxReminder` records (see reminder engine spec)
- `GET /api/users/reminders/` — returns reminders relevant to user's profile + upcoming (next 60 days)
- Celery task: daily check → for each user, find reminders where today matches any offset → queue delivery
**Frontend:**
- `TaxCalendarPage.tsx` at `/tax-calendar`
- Month-view calendar showing upcoming deadlines color-coded by category
- List view toggle showing all reminders with days-until chip
- Each reminder has: title, why it matters, source link, action button

---

### T3-2: Add full BTW quarterly reminders (all 4 dates, data-driven)
**Why:** BTW quarterly is ZZP's most frequent obligation but our system only has Q1 hardcoded.
**What to build:**
- In the `TaxReminder` seed data, add all 4 BTW quarterly reminders:
  - Q1 2026: due 30 April 2026, offsets [30, 14, 7, 1]
  - Q2 2026: due 31 July 2026, offsets [30, 14, 7, 1]
  - Q3 2026: due 31 October 2026, offsets [30, 14, 7, 1]
  - Q4 2026: due 31 January 2027, offsets [30, 14, 7, 1]
- Also add BTW annual deadline: 31 March 2027
- In `alerts.py`, replace hardcoded Q1 logic with query to `TaxReminder` table filtered by `category="vat"` and `due_date` within next 45 days
- This makes deadlines data-driven, editable from admin

---

### T3-3: Add conversation history to dashboard
**Why:** Spec says "previous questions" is a dashboard section. Users want to return to prior conversations.
**What to build:**
**Backend:**
- New model `ChatConversation(user, created_at, summary, message_count)` and `ChatMessage(conversation, role, content, created_at)`
- Store messages when user is authenticated (anon sessions ephemeral)
- `GET /api/chat/history/` → last 10 conversations with message count + summary
- `GET /api/chat/history/<id>/` → full message list
**Frontend:**
- Dashboard History section: show last 5 conversations with timestamp + first question
- Each card links to `/chat?session=<id>` to resume
- ChatPage: on mount for auth users, check URL param, load prior messages

---

### T3-4: Build AI Tax Memory (cross-session context)
**Why:** Spec says paid users get personalized answers based on their stored profile + prior session answers.
**What to build:**
**Backend:**
- `User.tax_memory` JSONField — stores: user_type, income, hours_worked, known_deductions, last_calc_result, open_questions
- Update `tax_memory` on: profile update, each calculation, each chat Q&A involving a tax fact
- In `ChatView`, inject `tax_memory` into system prompt for paid users: "This user is ZZP, €45k income, 1300 hours, likely qualifies for zelfstandigenaftrek, last calculated 14,736 total tax"
**Frontend:**
- "Tax Memory" section in Dashboard profile card — shows what AI remembers
- "Edit memory" link → profile page
- Clear memory button (GDPR compliance)

---

### T3-5: Add analytics event tracking
**Why:** Spec says track all KPIs from day one. Without data, you cannot know what to fix.
**What to build:**
- Install PostHog (`posthog-js`) — free tier, GDPR-compliant, no cookies without consent
- `VITE_POSTHOG_KEY` in `.env`
- Track these events:
  - `page_view` (every route change)
  - `intake_started`, `intake_completed`, `intake_skipped`
  - `calculation_done` (with user_type, income_bracket — no PII)
  - `chat_message_sent` (count only)
  - `deduction_checker_started`, `deduction_checker_completed`
  - `upgrade_modal_shown`, `upgrade_cta_clicked`
  - `pdf_report_purchased`, `subscription_started`
  - `alert_dismissed`, `alert_action_clicked`
- Simple analytics dashboard in admin: top questions, conversion funnel, user type breakdown

---

## TIER 4 — Advanced Reminder Categories

### T4-1: Add Inkomstenbelasting full reminder flow (6 events)
Add all 6 IB events to `TaxReminder` seed data:
1. Filing season open (1 Jan) — "aangifte inkomstenbelasting for 2025 is now open"
2. IB deadline warning (1 May) — sent at 30, 14, 7, 1 days before
3. Uitstel request (before deadline if not filed)
4. Aanslag received (triggered manually when user marks it received)
5. Aanslag payment deadline
6. Bezwaar window (6 weeks after aanslag, user can object)

---

### T4-2: Add Toeslagen reminder flow (5 events)
1. Zorgtoeslag eligibility check (income-triggered: if income < €40,857)
2. Zorgtoeslag income update reminder (if income changed)
3. Huurtoeslag review (if rental situation changed)
4. Kindgebonden budget (if child added to profile)
5. Kinderopvangtoeslag deadline (within 3 months of childcare start)

---

### T4-3: Add ZZP admin reminders (invoice + expense + year-end)
1. Invoice registration: monthly prompt "record your sales invoices"
2. Expense logging: monthly "log your deductible business expenses"
3. Urencriterium Q4 warning: if hours < 900 by October, red alert
4. Year-end checklist: November — review deductions, KIA investments, voorlopige aanslag, cashflow

---

### T4-4: Add Voorlopige aanslag smart reminders
1. Request reminder: triggered when total tax > €500 and no voorlopige aanslag registered
2. Income-change alert: "your income changed significantly — consider updating your voorlopige aanslag"
3. Payment tracking: monthly installment confirmation
4. Annual review: compare actual income to VA estimate

---

### T4-5: Add DGA / BV reminder categories
1. Gebruikelijk loon check (annual — min €56,000 salary)
2. Vennootschapsbelasting deadline (June 1 after tax year)
3. Dividendbelasting: 1-year window after beschikbaarstelling
4. Box 2 impact warning before paying dividend
5. Loonheffingen monthly (employer/DGA)
6. Jaaropgave deadline (January/February)

---

### T4-6: Add Expat-specific reminder flow
1. 30%-regeling application (within 4 months of arrival + employer)
2. 30%-ruling phase-down warning: at year 3 (30%→20%), year 4 (20%→10%), year 5 (expired)
3. M-form notification (for partial-year residents)
4. Box 3 foreign assets review (Jan 1 snapshot)
5. Residency status check (for toeslagen eligibility)

---

## TIER 5 — B2B & Infrastructure

### T5-1: Build Accountant Dashboard
**Why:** €99/month B2B tier — accountants manage multiple clients.
**What to build:**
- New Django model `AccountantProfile(user, firm_name, client_limit)`
- New model `AccountantClient(accountant, client_user, nickname, notes)`
- `GET /api/accountant/clients/` — list clients
- `GET /api/accountant/clients/<id>/alerts/` — client's alerts
- `GET /api/accountant/clients/<id>/reminders/` — upcoming deadlines
- Frontend: `/accountant` dashboard — client list, upcoming deadline calendar, bulk reminder status
- Separate nav for accountant users

---

### T5-2: Add WhatsApp/SMS reminder delivery
**Why:** Most ZZP workers in the Netherlands use WhatsApp daily. Email open rates are low.
**What to build:**
- Integrate Twilio (SMS) or WhatsApp Business API
- `NotificationPreference` model already has `whatsapp_enabled` and `sms_enabled` flags — wire them up
- Celery task: for reminders due within offset, check preference, send via channel
- WhatsApp template messages (requires Meta business account + template approval)
- User opt-in flow in Profile settings

---

### T5-3: Add Google Calendar sync
**Why:** Spec's Phase 3 feature. Users want deadlines in their calendar.
**What to build:**
- `GET /api/users/calendar.ics` — returns iCal feed of all user's upcoming tax deadlines
- Each event has: title (trilingual), description with action + source URL, 2 reminders (1 week + 1 day before)
- "Add to Google Calendar" button on TaxCalendarPage → opens Google Calendar with the ICS URL
- "Download .ics" button for Apple Calendar / Outlook
- No OAuth needed for basic ICS; OAuth needed for push sync

---

### T5-4: Add Prinsjesdag/Belastingplan admin reminders
**Why:** The spec requires internal admin reminders for annual tax law update cycle.
**What to build:**
- In admin dashboard, add a "Tax Law Calendar" section:
  - September: Prinsjesdag alert — "Review Belastingplan for next year"
  - October–November: "Extract proposed rules from new Belastingplan"
  - December: "Final law adoption — mark rules as verified"
  - January: "Activate new year rules — archive expired rules"
  - March: "Test aangifte season — verify all calculations"
- Add `AdminReminder` model or just Celery periodic task per month
- Email admin when trigger fires

---

## QUICK REFERENCE — Task Order for Next Sessions

```
Session 1:  T1-1 Pricing page + T1-4 Paywall gates
Session 2:  T2-1 Deduction checker page
Session 3:  T1-2 Stripe integration (backend first)
Session 4:  T1-3 PDF report generation
Session 5:  T2-2 SEO page /zzp-tax-netherlands
Session 6:  T2-3 SEO page /expat-tax-netherlands  
Session 7:  T2-4 Landing hero CTA update + T2-5 Email capture
Session 8:  T3-1 TaxReminder calendar data model
Session 9:  T3-2 BTW all 4 quarters data-driven
Session 10: T3-3 Conversation history
Session 11: T3-4 AI Tax Memory
Session 12: T3-5 Analytics (PostHog)
Session 13: T4-1 through T4-6 (reminder categories — do one per session)
Session 14: T5-1 Accountant dashboard
Session 15: T5-2 WhatsApp/SMS + T5-3 Calendar sync
Session 16: T5-4 Admin Belastingplan reminders
```

---

## What's Already Done (Don't Rebuild)

- ✅ AI Chat (RAG pipeline, Claude API, streaming, rate limits)
- ✅ Tax Calculator Engine (deterministic, all 2026 rules)
- ✅ IB Guide (9 form fields, step-by-step)
- ✅ IB Simulation (full multi-step)
- ✅ Dashboard (Tax Health Score, alert feed, action engine, financial overview)
- ✅ Admin Dashboard (rule CRUD, impact analysis, calculator preview, RAG preview)
- ✅ Proactive Alert Engine (10 alert types, all 3 languages)
- ✅ Celery Beat periodic tasks (infra ready for reminder delivery)
- ✅ NotificationPreference model (channel flags ready)
- ✅ TaxYearSnapshot + multi-year comparison UI
- ✅ Google OAuth login
- ✅ Three-language support (NL/EN/FA, logical CSS, natural Persian)
- ✅ Trust signals (source citation, verified rules, deterministic calc)
- ✅ Backend persistence (IB guide answers, simulation state, health score)
- ✅ JWT auth + token refresh
