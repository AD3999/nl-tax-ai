# TaxWijs — Design Brief for UI Redesign

> This document is a complete handoff for a UI designer.
> It covers: what the product is, who it is for, the full project tree,
> the current design system, and a page-by-page breakdown of every screen
> with its purpose, current state, and design requirements.

---

## 1. What TaxWijs Is

TaxWijs is an **AI-powered Dutch income tax assistant**. It helps people in the Netherlands understand their taxes, calculate what they owe, and walk through the official annual tax return (aangifte inkomstenbelasting) step by step.

The core experience: you enter your financial situation once, and then you can ask plain-language questions — in Dutch, English, or Persian — and get accurate, sourced answers based on your specific numbers. The AI never does arithmetic itself; a deterministic engine calculates all the numbers, and Claude (Anthropic) explains them.

---

## 2. Target Users

Four user types, each with different needs:

| Type | Label | Who they are |
|------|-------|-------------|
| `zzp` | ZZP / Freelancer | Dutch freelancers (~1M people). Most confused about ZVW, Wet DBA risk, quarterly VAT |
| `employee` | Employee | Salaried workers. Need help understanding payslips, credits, Box 3 |
| `expat` | Expat | Foreign nationals working in NL, often on the 30% ruling. English/Persian primary language |
| `dga` | DGA / Director | Company directors paying themselves a salary via their BV, with dividend income |

**Key insight:** A large portion of ZZP workers are Iranian expats. Persian (Farsi) is a first-class supported language — not a translated afterthought. The UI must be fully RTL-compatible when Persian is active.

---

## 3. Languages

The app supports three languages simultaneously. Every piece of text has NL / EN / FA versions. The language switcher is in the top navigation. When Persian is selected, the entire layout flips to RTL (`dir="rtl"`).

| Code | Language | Script direction |
|------|----------|-----------------|
| `nl` | Nederlands (Dutch) | LTR |
| `en` | English | LTR |
| `fa` | فارسی (Persian) | RTL |

---

## 4. Access Tiers

| Tier | Who | Questions allowed | Badge shown |
|------|-----|------------------|-------------|
| Anonymous | Not logged in | 5 per session | None |
| Free | Registered, `plan=free` | 10 per day | None |
| Premium | Paying, `plan=premium` | Unlimited | ⚡ Premium (purple) |

Premium costs €9.99/month via Stripe. Checkout is handled externally (Stripe-hosted page). When a limit is hit, an **UpgradeModal** slides up instead of the AI answering.

---

## 5. Current Design System

The app uses **Tailwind CSS** with CSS custom properties for theming. All brand values live in CSS variables so dark mode is a single toggle.

### Color tokens

```css
/* Light mode */
--text:          #6b6375    /* body text — muted purple-grey */
--text-h:        #08060d    /* headings — near black */
--bg:            #ffffff    /* page background */
--border:        #e5e4e7    /* card and input borders */
--code-bg:       #f4f3ec    /* code blocks, info boxes */
--accent:        #aa3bff    /* primary brand purple */
--accent-bg:     rgba(170,59,255,0.10)  /* tinted purple for highlights */
--accent-border: rgba(170,59,255,0.50)  /* semi-transparent purple borders */
--social-bg:     rgba(244,243,236,0.50) /* feature cards */
--shadow:        0 1px 2px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04)
--card-bg:       #f9f9f9    /* slightly off-white card backgrounds */

/* Dark mode (auto via @media prefers-color-scheme) */
--text:          #9ca3af
--text-h:        #f3f4f6
--bg:            #16171d
--border:        #2e303a
--code-bg:       #1f2028
--accent:        #c084fc    /* lighter purple in dark mode */
--accent-bg:     rgba(192,132,252,0.15)
--accent-border: rgba(192,132,252,0.50)
--social-bg:     rgba(47,48,58,0.50)
```

### Typography

```css
--sans:    "Inter", system-ui, sans-serif
--heading: same as --sans, weight 500
--mono:    "JetBrains Mono", "Fira Code", monospace

Base: 18px / 145% line-height
Body text: var(--text) — #6b6375
Headings: var(--text-h) — #08060d
```

### Key spacing patterns

- Page max-width: `760px` (content) / `860px` (calculator, wider forms)
- Page padding: `px-12 py-12 pb-24`
- Nav height: `52px`
- Card border radius: `rounded-xl` (12px) or `rounded-2xl` (16px)
- Input border radius: `rounded-lg` (8px)
- Gap between sections: `gap-8` (32px)
- Gap inside cards: `gap-3` or `gap-5`

### Component patterns

**Primary button:**
```
bg-[var(--accent)] text-white rounded-lg px-6 py-2.5 font-medium
hover:opacity-85 transition-opacity
```

**Secondary / outline button:**
```
border border-[var(--border)] bg-transparent text-[var(--text)]
rounded-lg px-5 py-2.5 hover:border-[var(--accent)] hover:text-[var(--accent)]
```

**Input field:**
```
px-3 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--bg)]
text-[var(--text-h)] focus:border-[var(--accent)] outline-none transition-colors
```

**Card:**
```
bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6
```

**Badge (accent):**
```
text-[11px] font-bold tracking-widest uppercase
text-[var(--accent)] (just text, no background — used as section labels)
```

**Boolean pill buttons (yes/no toggles):**
```
Active:   border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)] font-semibold
Inactive: border-[var(--border)] bg-[var(--bg)] text-[var(--text)] hover:border-[var(--accent)]
```

---

## 6. Full Project Tree

```
nl-tax-ai/
│
├── CLAUDE.md                         # AI session instructions (project memory)
├── PROGRESS.md                       # Full build log, all phases documented
├── DESIGN_BRIEF.md                   # ← THIS FILE
├── .env.example                      # All required environment variables
├── docker-compose.yml                # Docker setup for production
│
├── phase1/                           # KNOWLEDGE BASE (Python, not a web server)
│   └── data/
│       ├── schemas/                  # JSON schemas for all data types
│       │   ├── tax_rule.schema.json
│       │   ├── qa_pair.schema.json
│       │   ├── scenario.schema.json
│       │   └── ib_form_field.schema.json
│       ├── seed/                     # The actual hand-verified data
│       │   ├── tax_rules_2026.json   # 28 verified Dutch 2026 tax rules
│       │   ├── qa_pairs_2026.json    # 12 Q&A pairs (NL+EN+FA)
│       │   ├── scenarios.json        # 6 full tax scenarios with every calculation step
│       │   └── ib_form_mapping.json  # 9 IB return form fields
│       ├── scrapers/                 # Scripts to scrape Belastingdienst + forums
│       └── scripts/
│           └── validate.py           # Schema + calculation accuracy tests (all must pass)
│
├── phase2/                           # RAG PIPELINE (Python, used by Django backend)
│   ├── chunkers/                     # Convert JSON data → embeddable text chunks
│   │   ├── rule_chunker.py           # Tax rules → Chunk objects (all 3 languages in one chunk)
│   │   ├── qa_chunker.py             # Q&A pairs → canonical + variant chunks
│   │   ├── scenario_chunker.py       # Scenarios → natural-language worked examples
│   │   ├── ib_field_chunker.py       # IB fields → chunks (mistakes + follow-ups)
│   │   └── raw_chunker.py            # Scraped content → sliding-window chunks
│   ├── embeddings/
│   │   ├── embed_openai.py           # OpenAI text-embedding-3-small (primary)
│   │   └── embed_local.py            # sentence-transformers (offline fallback)
│   ├── store/
│   │   ├── schema.py                 # Chunk dataclass definition
│   │   ├── chroma_store.py           # ChromaDB implementation
│   │   └── supabase_store.py         # Supabase pgvector stub (production)
│   ├── retriever.py                  # Main: retrieve(question, user_type, year) → chunks
│   ├── assembler.py                  # Formats chunks → AI context string (≤1500 tokens)
│   ├── build_index.py                # Entry point: load data → embed → store in ChromaDB
│   ├── test_retrieval.py             # 5 accuracy tests (precision, cross-lingual, filters)
│   └── embedding_manifest.json       # Records which embedding model was used
│
├── backend/                          # DJANGO REST API
│   ├── manage.py
│   ├── requirements.txt              # Django 6, DRF, simplejwt, anthropic, stripe, etc.
│   ├── db.sqlite3                    # Local SQLite database
│   ├── config/
│   │   ├── settings.py               # All Django settings + Stripe + limits
│   │   ├── urls.py                   # Root URL config
│   │   └── celery.py                 # Celery (background tasks, future use)
│   └── apps/
│       ├── users/                    # Custom User model + auth
│       │   ├── models.py             # User: email, user_type, plan, stripe_customer_id,
│       │   │                         #       daily_message_count, daily_message_date
│       │   ├── serializers.py        # UserSerializer (exposes plan + daily counts)
│       │   ├── views.py              # ProfileView, RegisterView
│       │   └── urls.py               # /api/users/profile/, /api/users/register/
│       │
│       ├── calculator/               # Deterministic tax engine
│       │   ├── engine.py             # All tax calculation functions (reads from phase1 JSON)
│       │   ├── serializers.py        # CalculatorInputSerializer
│       │   ├── views.py              # POST /api/calculator/calculate/
│       │   └── tests.py              # 38 tests (6 scenarios ≤1% error)
│       │
│       ├── chat/                     # Claude AI chat via SSE streaming
│       │   ├── views.py              # ChatMessageView — plan-aware limits + Claude SSE
│       │   ├── serializers.py        # ChatMessageSerializer
│       │   ├── models.py             # Conversation, Message
│       │   └── tests.py              # 12 tests (streaming, limits, filters)
│       │
│       ├── tax/                      # Tax knowledge API
│       │   └── views.py              # IBFieldsView (GET /api/tax/ib/fields/?user_type=zzp)
│       │                             # Phase2RetrieveView (POST /api/tax/phase2/retrieve/)
│       │
│       └── payments/                 # Stripe subscription management
│           ├── views.py              # CreateCheckoutSession, BillingPortal, StripeWebhook
│           └── urls.py               # /api/payments/create-checkout-session/
│                                     # /api/payments/billing-portal/
│                                     # /api/payments/webhook/
│
└── frontend/                         # REACT + VITE + TAILWIND
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js            # Content: src/**/*.{ts,tsx}, brand colors, animations
    ├── package.json
    └── src/
        ├── main.tsx                  # React entry — wraps app in AuthProvider
        ├── App.tsx                   # Router + nav bar + lazy-loaded routes
        ├── index.css                 # @tailwind directives + all CSS variables (light+dark)
        │
        ├── api/                      # API client functions (Axios + native fetch for SSE)
        │   ├── client.ts             # Axios instance (base URL + JWT interceptor)
        │   ├── auth.ts               # login, register, fetchProfile, logout, AuthUser type
        │   ├── calculator.ts         # calculateTax(input) → CalcResult
        │   ├── chat.ts               # sendMessage() — SSE stream, upgrade_required handling
        │   ├── ib.ts                 # fetchIBFields(user_type) → IBField[]
        │   ├── payments.ts           # createCheckoutSession(), createBillingPortalSession()
        │   └── retrieve.ts           # retrieveContexts() — Phase 2 RAG demo
        │
        ├── context/
        │   └── AuthContext.tsx       # useAuth() → { user, setUser, logout }
        │                             # user includes: email, plan, daily_message_count
        │
        ├── components/
        │   ├── UpgradeModal.tsx      # Shown when any usage limit is hit
        │   ├── ui/
        │   │   └── index.tsx         # Shared UI: Button, Badge, Input, Card, Table, etc.
        │   └── admin/
        │       ├── AdminLayout.tsx   # Two-column admin shell (sidebar + content)
        │       ├── AdminSidebar.tsx  # Dark nav sidebar for admin
        │       ├── AdminTopbar.tsx   # White header bar
        │       ├── RuleStatusBadge.tsx
        │       └── StatCard.tsx      # Metric card with icon + trend
        │
        ├── data/
        │   └── simulationSteps.ts    # All 11 simulation steps with fields in NL/EN/FA
        │
        ├── i18n/
        │   ├── index.ts              # i18next config
        │   └── locales/
        │       ├── en.json           # English translations
        │       ├── nl.json           # Dutch translations
        │       └── fa.json           # Persian translations (RTL)
        │
        ├── lib/
        │   ├── utils.ts              # cn(), formatEur(), formatPct(), formatDate()
        │   └── tax-rules/
        │       ├── types.ts          # TaxRule TypeScript interface
        │       ├── schema.ts         # Zod validation schemas
        │       ├── mock-data.ts      # 50+ mock rules (2025/2026/2027)
        │       ├── api.ts            # Mock CRUD: getRules, createRule, updateRule, etc.
        │       └── audit.ts          # Audit log with pre-seeded entries
        │
        ├── pages/                    # All user-facing pages
        │   ├── LandingPage.tsx       # / — marketing home
        │   ├── LoginPage.tsx         # /login
        │   ├── RegisterPage.tsx      # /register
        │   ├── IntakePage.tsx        # /intake — 3-step profile wizard
        │   ├── ChatPage.tsx          # /chat — main AI chat experience
        │   ├── CalculatorPage.tsx    # /calculator — tax calculator form + breakdown
        │   ├── IBGuidePage.tsx       # /ib-guide — IB return field-by-field guide
        │   ├── SimulationPage.tsx    # /simulation — full 11-step aangifte simulation
        │   ├── PricingPage.tsx       # /pricing — Free vs Premium comparison
        │   ├── Phase2Demo.tsx        # /phase2 — RAG pipeline test page (internal)
        │   └── admin/
        │       ├── AdminDashboard.tsx         # /admin — overview + stats
        │       ├── AdminRulesPage.tsx          # /admin/rules — rules table + filters
        │       ├── AdminRuleEditorPage.tsx     # /admin/rules/:id — 6-tab rule editor
        │       ├── AdminCalculatorPreviewPage.tsx  # /admin/calculator-preview
        │       ├── AdminRAGPreviewPage.tsx     # /admin/rag-preview
        │       └── AdminSettingsPage.tsx       # /admin/settings
        │
        └── styles/
            └── admin.css             # Scoped Tailwind for admin (no base reset)
```

---

## 7. Navigation Structure

```
Top nav (52px, always visible):
  Left:  TaxWijs (logo/wordmark) → /
         Ask a question → /chat
         Calculator → /calculator
         IB Return → /ib-guide
         Return Simulation → /simulation
         Pricing → /pricing
         Admin (only if is_admin) → /admin

  Right: [Language selector: NL | EN | FA]
         If logged out: Log in | Register (purple button)
         If logged in:  ⚡ Premium (if premium) | email address | Log out
```

---

## 8. Page-by-Page Design Brief

---

### PAGE 1 — Landing Page `/`

**File:** `frontend/src/pages/LandingPage.tsx`
**Auth required:** No

**Purpose:** Marketing page. First impression. Converts visitors to users.

**Current layout:**
- Full-width, centered, no max-width restriction on outer wrapper
- `text-center` throughout
- Hero section: badge → h1 → subheadline → two CTA buttons → disclaimer text
- Features grid: 4 cards in `auto-fit, minmax(220px, 1fr)` grid
- Disclaimer at bottom

**Content (English):**
- Badge: "Dutch Tax AI · 2026"
- Headline: "Your Dutch Tax Assistant"
- Subheadline: "AI-powered tax guidance for ZZP workers, employees, expats, and DGA directors in the Netherlands."
- CTA primary: "Get started" → /intake
- CTA secondary: "Ask a question" → /chat
- Fine print: "No account needed"
- Feature 1 (💬): "AI Chat" — "Ask any Dutch tax question in NL, EN, or FA. Get sourced answers from verified 2026 rules."
- Feature 2 (🧮): "Tax Calculator" — "Exact 2026 figures: Box 1/2/3, all ZZP deductions, credits, Wet DBA risk."
- Feature 3 (📋): "IB Return Guide" — "Step-by-step guide to your annual aangifte. Ask Claude on every field."
- Feature 4 (🌍): "3 Languages" — "Dutch, English, and Persian — first class, no translation compromise."
- Bottom disclaimer: "TaxWijs provides general information — not official tax advice."

**Design requirements:**
- Hero should feel premium and confident — not "startup demo"
- Accent color (#aa3bff) should anchor the visual hierarchy
- The four feature cards should have subtle visual differentiation (icon treatment, light gradient bg)
- Must look polished on mobile — this is the entry point for organic traffic
- Consider adding a subtle background pattern or gradient behind the hero

---

### PAGE 2 — Login `/login`

**File:** `frontend/src/pages/LoginPage.tsx`
**Auth required:** No (redirects to /chat if already logged in)

**Purpose:** Return users sign in here.

**Current layout:**
- Full-viewport centered card
- Max-width `360px` card, white bg, `border`, `rounded-xl`, `p-10`, shadow
- H1 "Log in" at top
- Two fields: Email, Password
- Submit button (full-width, purple)
- "Forgot password?" link (not yet implemented)
- "No account?" → /register link at bottom

**Design requirements:**
- Clean, minimal, trustworthy — tax product, not a social app
- The card should feel elevated (shadow, slight border)
- Error state: red inline text under the form
- Loading state: spinner replaces button text

---

### PAGE 3 — Register `/register`

**File:** `frontend/src/pages/RegisterPage.tsx`
**Auth required:** No

**Purpose:** New user creation. Asks for email, password, and user type.

**Current layout:**
- Same card pattern as Login
- Three fields: Email, Password, User type (dropdown: ZZP / Employee / Expat / DGA)
- Submit button
- "Already have account?" → /login link

**Design requirements:**
- User type dropdown is a standard `<select>` — consider upgrading to illustrated type cards (same as IntakePage step 1) for better UX
- After register → auto-login → redirects to /intake (so users never land on an empty dashboard)

---

### PAGE 4 — Intake Wizard `/intake`

**File:** `frontend/src/pages/IntakePage.tsx`
**Auth required:** No (profile is stored in localStorage)

**Purpose:** Collects enough financial info to personalise the AI chat. Three steps, takes 2 minutes. No account required.

**Current layout:**
- Full-viewport centered card, max-width `540px`
- Progress dots at top (3 dots, filled with accent when reached)
- Step title + subtitle
- Step content (varies per step)
- Back / Next button row at bottom
- "Skip" text link below everything

**Step 1 — "Who are you?"**
- 2×2 grid of type cards: ZZP 💼 / Employee 🏢 / Expat 🌍 / DGA 🏛️
- Each card: emoji + label + short description
- Active card: accent border + accent-tinted background
- Click to select (radio-like, single selection)

**Step 2 — "Your income"**
- Changes based on type:
  - ZZP: Revenue field + Expenses field + "Starter year?" checkbox
  - Employee: Salary field
  - DGA: Salary field + Dividend field
  - Expat: Salary field + "Ruling year" dropdown (1–5)
- All inputs are number fields with € label and placeholder

**Step 3 — "Your situation"**
- Has partner? (checkbox) → if yes: Partner income field
- Children under 12 (dropdown: 0 / 1 / 2 / 3+)
- Box 3 assets (optional number field)
- Pension contributions (optional number field)

**On finish:**
- Calls `/api/calculator/calculate/` silently
- Saves to `localStorage["taxwijs_calc_input"]`
- Navigates to `/chat`

**Design requirements:**
- Steps should feel like a conversation, not a form
- Progress indicator should be more expressive — consider a horizontal step bar with labels
- The type cards in step 1 deserve more visual investment (currently just a border change)
- The "Skip" link should be present but clearly secondary
- Smooth animated transitions between steps (slide left/right)

---

### PAGE 5 — Chat `/chat` ⭐ Main experience

**File:** `frontend/src/pages/ChatPage.tsx`
**Auth required:** No (but limit of 5 questions/session for anon)

**Purpose:** The core product. User asks questions; Claude answers based on their tax profile and retrieved rules. All interaction happens through pre-written question cards (no free-text input).

**Current layout:**
- Full-viewport height minus 52px nav: `height: calc(100vh - 52px)`
- Three zones stacked vertically:
  1. **Profile banner** (thin strip at top, accent-tinted)
  2. **Messages area** (flex-1, scrollable)
  3. (No input bar — cards live in the messages area)

**Profile banner (top strip):**
- Left: "Profile: ZZP · €72,000"
- Right: usage counter + optional "Upgrade →" CTA + edit ✎ button
- If premium: ⚡ Premium badge
- If free: "3 / 10 questions today"
- If anon: "2 / 5 questions this session" + "Upgrade →"

**Messages area:**

*Empty state (no messages yet):*
- Centered text: "Your tax results are ready"
- Subtitle: "Ask a question or click below"
- Grid of 6 question cards (see below)

*After first exchange:*
- Message bubbles scroll upward
- After each AI response, 4 remaining cards slide up with staggered animation

**Question cards:**
- Pill-shaped or rounded-rectangle cards
- Each card is a pre-written question relevant to the user's type and language
- Clicking a card sends it as a message instantly
- Cards that have been asked disappear from the deck
- Cards animate in with `slideUp` + opacity, staggered by 60ms each
- 10 ZZP questions, 8 employee, 6 expat, 6 DGA (in each language)

**Message bubbles:**
- User messages: right-aligned, accent background, white text, `rounded-2xl`
- Assistant messages: left-aligned, card background, normal text, `rounded-2xl`, markdown rendered
- Streaming: assistant message shows a blinking cursor while text is arriving
- Sources: not currently shown inline (future)

**No-profile gate:**
- If no `taxwijs_calc_input` in localStorage: full-screen gate
- Icon + "Complete your tax profile first" + "Set up profile" button → /intake
- Fine print: "Takes 2 minutes. No account required."

**UpgradeModal (triggered by backend):**
- Slides up over the chat when `upgrade_required: true` arrives via SSE
- Three triggers: `session_limit` (anon), `daily_limit` (free user), `register` (anon nudge)
- See UpgradeModal section below

**Design requirements:**
- The question cards are the UX centerpiece — they should feel inviting, not like a menu
- Consider a horizontal scrollable card strip vs the current grid layout
- The profile banner is currently very minimal — could show tax summary numbers
- The gate screen needs to feel welcoming, not like an error page
- Streaming text should feel smooth — cursor animation matters
- Chat bubbles need clear visual separation — currently they're close together

---

### PAGE 6 — Calculator `/calculator`

**File:** `frontend/src/pages/CalculatorPage.tsx`
**Auth required:** No

**Purpose:** Power tool. Lets users input any financial scenario and see the full Dutch income tax breakdown instantly. No AI — just the deterministic engine.

**Current layout:**
- Max-width `860px`, centered
- Section header: badge + h1 + description
- Form card (white, border, rounded-xl, p-7):
  - User type pills: ZZP / EMPLOYEE / EXPAT / DGA (selected = purple fill)
  - Two-column grid of fields (changes based on user type)
  - "Calculate" button
- Results (shown after submit):
  - Summary cards row: Total Tax Due | Effective Rate | Monthly Reserve | Wet DBA Risk
  - Full breakdown table (every calculation step from gross → total tax)

**Form fields by user type:**

ZZP:
- Annual revenue (€)
- Business expenses (€)
- Hours per year
- KIA investments (€)
- Single client % (Wet DBA check)
- Starter year? (checkbox)

Employee:
- Employment income (€)

Expat:
- Employment income (€)
- 30% ruling active? (checkbox)
- Ruling year (1–5)

DGA:
- Employment income (€)
- Box 2 dividend (€)

All types:
- Pension contribution (€)
- Net assets Box 3 (€)
- Savings fraction (%)
- Children under 12
- Has partner? (checkbox) → Partner income (€)

**Summary cards:**
- Total tax due: large euro amount
- Effective rate: percentage
- Monthly reserve: "how much to set aside per month" (ZZP only)
- Wet DBA risk: HIGH (red) / MEDIUM (amber) / LOW (green) (ZZP only)

**Breakdown table:**
- Rows from gross revenue down to total tax
- Bold rows for key totals (gross profit, taxable income, total tax)
- Separator lines between sections
- Values right-aligned in monospace font
- Negative values (deductions) prefixed with −

**Design requirements:**
- Results section needs more visual punch — the breakdown table is dense text
- Summary cards should feel like a dashboard widget (currently they're minimal)
- Wet DBA risk card should be very visually prominent (it's a compliance issue)
- Consider adding a "What does this mean?" tooltip on technical terms
- Mobile: the two-column field grid should stack to single column

---

### PAGE 7 — IB Return Guide `/ib-guide`

**File:** `frontend/src/pages/IBGuidePage.tsx`
**Auth required:** No

**Purpose:** Walks users through 9 fields from the real Dutch tax return form. For each field: plain-language question + help text + common mistakes + Ask Claude button.

**Current layout:**
- Max-width `760px`, centered
- Header: badge + title + subtitle + user type chip (if known)
- Progress bar (linear, fills as fields are answered)
- Progress label: "3 of 9 fields answered"
- Stack of field cards (one per IB field)
- Summary table (appears when ≥1 field is answered)

**Field card anatomy:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Box 1] [1a]  Winst uit onderneming                        │
│                                                             │
│  Plain-language question text (15px, medium weight)         │
│                                                             │
│  Help text with left border accent (13px, muted)            │
│                                                             │
│  [Input: boolean YES/NO  OR  currency € field]              │
│                                                             │
│  ▼ Common mistakes (collapsible, 13px text)                │
│                                                             │
│  ──────────────────────────────────────────────────────    │
│  Belastingdienst ↗                       Ask Claude →       │
└─────────────────────────────────────────────────────────────┘
```

**Box color coding:**
- Box 1 (income): purple `#7c3aed`
- Box 2 (significant interest): cyan `#0891b2`
- Box 3 (savings): green `#059669`

**The 9 fields:**
1. `1a` — Winst uit onderneming (ZZP business profit)
2. `1b` — Loon en uitkeringen (employment income)
3. `1c` — Zelfstandigenaftrek (1,225 hours check)
4. `1d` — Startersaftrek (⚠️ LAST YEAR 2026)
5. `1e` — MKB-winstvrijstelling (12.7%)
6. `1f` — Lijfrentepremies (pension deduction)
7. `2a` — Voordeel aanmerkelijk belang (DGA dividend)
8. `3a` — Bezittingen Box 3 (savings/investments)
9. `VOL-1` — Voorlopige aanslag (provisional tax already paid)

**Summary table (bottom):**
- Appears when any field is answered
- Columns: code | field name | value
- "Go to chat →" button

**Design requirements:**
- The field cards are functional but visually flat — needs more visual hierarchy
- The "⚠️ Common mistakes" toggle is currently just text — needs icon treatment
- The Box color coding is good — keep it, but make the box badge more prominent
- Progress bar should be more prominent — it's a key motivator to complete all fields
- The "Ask Claude" button is the key CTA — it should feel inviting, not just a small button
- The summary at the bottom needs visual weight — it's the payoff for completing the guide

---

### PAGE 8 — Simulation `/simulation`

**File:** `frontend/src/pages/SimulationPage.tsx`
**Auth required:** No (but premium in future plans)

**Purpose:** Full simulation of the real Dutch IB aangifte process. 11 steps with conditional branching. At the end, the real tax calculator runs and shows your estimated assessment. Every field has an "Ask Claude" button.

**Current layout:**
- Two-column: fixed sidebar (240px) + scrollable main area
- Total height: `calc(100vh - 52px)`

**Sidebar:**
- Header: "IB Return Simulation 2026" (accent text, uppercase small)
- Vertical step list, one button per visible step
- Active step: accent background
- Completed step: ✓ checkmark, muted text
- Future step: normal text
- Steps 3, 4, 7, 9 are conditional (hidden if not applicable)

**Main area:**
- Thin progress bar at very top (fills across full width as you advance)
- Step header: "Step 3 of 11" (small, uppercase, muted) + icon + step title + subtitle
- Fields section: one or more sections per step, each with a title and its fields
- Navigation at bottom: ← Back | Next →

**11 Simulation steps:**

| # | Icon | Step title |
|---|------|-----------|
| 1 | 👤 | Personal details (fiscal year, birth year, fiscal partner) |
| 2 | 💼 | Income type (employee? ZZP? foreign income? Box 2?) |
| 3 | 🏢 | Wages & benefits (salary, employer, deducted tax) |
| 4 | 📊 | Business profit (gross profit, expenses, hours, investments) |
| 5 | 🏠 | Home (own home? WOZ value, mortgage interest, eigenwoningforfait) |
| 6 | 📋 | Deductions (pension, gifts, healthcare costs, study costs) |
| 7 | 🌍 | Foreign income (country, income amount, tax treaty) |
| 8 | 💰 | Box 3 savings & investments (savings, investments, crypto) |
| 9 | 🏛️ | Box 2 substantial interest (dividend, shares in own BV) |
| 10 | 💳 | Tax credits (arbeidskorting, heffingskorting, IACK) |
| 11 | 📊 | Overview & calculation (OverviewStep — calls calculator API) |

**Field types:**
- **boolean**: Ja / Nee toggle buttons
- **number**: Currency input with € prefix, or plain number
- **text**: Simple text input
- **select**: Dropdown with options
- **info**: Explanatory box (accent-tinted background, no input)

**OverviewStep (step 11):**
- Calls `POST /api/calculator/calculate/` with all answers
- Loading state: "Calculating…"
- Result cards: Total tax due | Effective rate | Monthly reserve | Already paid (if voorlopige aanslag was entered) | Net amount to pay/receive
- Breakdown table (same style as CalculatorPage)
- "Discuss with Claude →" button (navigates to /chat with pre-filled question)
- Disclaimer

**Design requirements:**
- The sidebar is critical — it's the user's roadmap. It needs to clearly show completed / active / future states
- The conditional branching (steps appearing/disappearing) should be animated
- The OverviewStep is the emotional climax of the simulation — it needs visual impact
- "Ask Claude" appears on every single field — it should be subtle enough not to overwhelm but present enough to be discoverable
- The two-column layout breaks on mobile — needs a responsive alternative (collapsed sidebar / top tabs)
- Info boxes (explanatory panels) need a distinct but not jarring visual treatment

---

### PAGE 9 — Pricing `/pricing`

**File:** `frontend/src/pages/PricingPage.tsx`
**Auth required:** No

**Purpose:** Converts free users to paying Premium subscribers. Shows Free vs Premium plans, feature comparison, FAQ.

**Current layout:**
- Max-width `860px`, centered
- Header: badge + headline + subheadline
- Two plan cards side-by-side (max-width `640px`, centered)
- FAQ section (3 questions)

**Free card (left):**
- Label: "Free" | Price: €0/month
- Feature list with ✓ and ✕ marks
- Free features: 5q/session, calculator, IB guide, 3 languages
- Not included (✕ greyed): Full simulation, Saved history, Priority responses
- CTA: "Start for free" → /chat

**Premium card (right):**
- "Most popular" badge at top
- Purple border, tinted background
- Label: "Premium" | Price: €9.99/month
- Full feature list (all ✓)
- CTA changes based on state:
  - Logged out: "Create free account" → /register
  - Free user: "Upgrade to Premium" → Stripe checkout
  - Premium user: "Manage billing" → Stripe billing portal + "Your current plan" badge

**FAQ (3 items):**
1. Can I cancel anytime?
2. Is my tax data stored?
3. What payment methods are accepted?

**Design requirements:**
- The Premium card needs to feel desirable and premium — not just "same card with purple border"
- Consider a subtle radial glow or gradient on the Premium card
- The feature comparison should be easy to scan — icons help
- Price should be prominent with the monthly cadence clear
- The "Most popular" badge should feel like social proof, not just a label
- Mobile: stack cards vertically with Premium first

---

### PAGE 10 — UpgradeModal (overlay component)

**File:** `frontend/src/components/UpgradeModal.tsx`
**Trigger:** SSE `upgrade_required` event from backend, or anon user nudge

**Purpose:** Converts users at the moment of friction (hitting a limit) instead of blocking them with a wall.

**Three trigger states:**

1. **`session_limit`** (anonymous user hit 5 questions):
   - Headline: "You've used all your free questions"
   - Body: "Register for free to get 10 questions/day. Upgrade to Premium for unlimited access."
   - CTA: "Create free account" → /register

2. **`daily_limit`** (free logged-in user hit 10 questions today):
   - Headline: "Daily limit reached"
   - Body: "Upgrade to Premium for unlimited questions and the full simulation."
   - CTA: "Upgrade to Premium — €9.99/month" → Stripe checkout

3. **`register`** (soft nudge in nav for anon users):
   - Headline: "Create a free account"
   - Body: Register framing
   - CTA: "Create free account" → /register

**Current layout:**
- Fixed overlay: `fixed inset-0 z-50` with dark semi-transparent backdrop + blur
- Centered card: max-width `400px`, white, `rounded-2xl`, shadow
- ⚡ icon in purple circle
- Headline + body text
- Feature comparison table (Free column | Premium column)
- Price text (for upgrade state)
- Two buttons: primary CTA + "Maybe later" (dismiss)

**Design requirements:**
- The modal must feel friendly, not punishing — hitting a limit should be a natural invitation
- The feature table should be legible at a glance — no information overload
- Animation: slides up from bottom with backdrop fade-in
- The backdrop blur creates focus — keep it
- "Maybe later" should be present but clearly secondary

---

### PAGE 11 — Admin Dashboard `/admin`

**File:** `frontend/src/pages/admin/AdminDashboard.tsx`
**Auth required:** Yes, `is_admin = true`

**Purpose:** Internal operations. Admins monitor the rule database health, spot rules needing attention, and access quick actions.

**Layout:** Two-column admin shell (dark sidebar + white content area)

**Admin sidebar (240px wide, dark slate-900):**
- TaxWijs logo + "Admin" label
- Nav items: Dashboard | Rules | Calculator Preview | RAG Preview | Settings
- Active item: blue highlight
- Bottom: back to app link

**Dashboard content:**
- 6 stat cards in a grid: Total Rules | Verified | Pending Review | Draft | Expired | Expiring Soon
- "Rules Needing Attention" table (pending/expired rules)
- Rules by year (bar chart or grouped list: 2025 / 2026 / 2027)
- Category cloud (topic tags with counts)
- Quick actions (New Rule, Rebuild Index, Run Tests)

---

### PAGE 12 — Admin Rules Table `/admin/rules`

**File:** `frontend/src/pages/admin/AdminRulesPage.tsx`
**Auth required:** Admin

**Purpose:** Browse, search, filter, and manage all tax rules.

**Layout:**
- Search bar + 4 filter dropdowns (year / user_type / status / category)
- Sortable data table: ID | Topic | Year | User Types | Status | Updated | Actions
- Actions per row: Edit | Duplicate | Delete
- Status badge colours: verified=green / pending=amber / draft=grey / expired=red

---

### PAGE 13 — Admin Rule Editor `/admin/rules/:id` and `/admin/rules/new`

**File:** `frontend/src/pages/admin/AdminRuleEditorPage.tsx`
**Auth required:** Admin

**Purpose:** Create or edit a single tax rule. 6 tabs.

**Tabs:**
1. **Basic Info** — ID, year, topic, category, user types, effective dates, tags
2. **Result / Formula** — result type, value, unit, formula, notes, phase-out parameters
3. **Multilingual** — NL / EN / FA textarea trio (all required for verified status)
4. **AI & RAG** — `ai_prompt_hint` field
5. **Source & Verification** — source URL + open link + verification status radio
6. **Audit History** — chronological log with actor, timestamp, field diff

---

### PAGE 14 — Admin Calculator Preview `/admin/calculator-preview`

**File:** `frontend/src/pages/admin/AdminCalculatorPreviewPage.tsx`

**Purpose:** Build a user profile → see which verified rules match → verify the data layer is correct.

---

### PAGE 15 — Admin RAG Preview `/admin/rag-preview`

**File:** `frontend/src/pages/admin/AdminRAGPreviewPage.tsx`

**Purpose:** Type a question → see simulated retrieval → see assembled AI context block. Mirrors the actual RAG pipeline output.

---

### PAGE 16 — Phase 2 RAG Demo `/phase2`

**File:** `frontend/src/pages/Phase2Demo.tsx`
**Auth required:** No (but effectively internal — not linked from main nav)

**Purpose:** Developer/QA tool to test the RAG retrieval pipeline visually.

**Layout:**
- Header with badge + title + subtitle
- Query form: textarea + example question pills + user type filter pills + submit
- Results: stats bar (count + ms + user_type) + result cards

**Result card:**
- Doc-type badge (colour per type: rule=violet / qa=blue / scenario=green / ib_field=amber)
- Source ID (monospace)
- Similarity score badge (%)
- Cascade indicator (dashed border)
- Topic label
- Text block (expandable if long)
- AI behavior badge (answer_directly=green / answer_with_caveat=amber / etc.)
- Source URL
- AI instruction box (if present)

---

## 9. Shared Component Inventory

| Component | Location | Used on |
|-----------|----------|---------|
| `UpgradeModal` | `components/UpgradeModal.tsx` | Chat, anywhere limit is hit |
| `Button`, `Badge`, `Input`, `Card`, `Table` | `components/ui/index.tsx` | Admin pages only |
| `AdminLayout` | `components/admin/AdminLayout.tsx` | All admin pages |
| `StatCard` | `components/admin/StatCard.tsx` | Admin dashboard |
| `RuleStatusBadge` | `components/admin/RuleStatusBadge.tsx` | Admin rules table/editor |

User-facing pages (non-admin) use **Tailwind utility classes directly** — no shared component abstractions. Consistent visual patterns are achieved through copy-pasted class strings and helper constants like `const inputCls = "..."`.

---

## 10. Animations

Defined in `tailwind.config.js`:

| Name | Class | Keyframe | Duration |
|------|-------|----------|---------|
| Slide up | `animate-slide-up` | 0%: opacity 0, translateY 20px → 100%: opacity 1, translateY 0 | 0.25s ease-out |
| Fade in | `animate-fade-in` | 0%: opacity 0 → 100%: opacity 1 | 0.2s ease-out |
| Spin | `animate-spin` | Tailwind built-in | (for loading spinners) |

Question cards use staggered `animationDelay: ${i * 60}ms` via inline style to create a cascade effect.

---

## 11. Responsive Breakpoints

The app currently has **limited mobile optimisation**. Pages are desktop-first with some responsive adjustments:

- `max-w-[760px] mx-auto` on most pages — works fine down to ~800px
- Calculator form: `grid grid-cols-2` → no breakpoint (needs `sm:grid-cols-1`)
- SimulationPage sidebar: fixed width, no collapse on mobile (known gap)
- Pricing: `grid-cols-2` cards → no breakpoint (needs stacking)
- Admin: no mobile support (intentional — internal tool)

**The RTL layout (Persian):** `dir={isRtl ? "rtl" : "ltr"}` on the page wrapper. All Tailwind classes work correctly with RTL when using logical properties (`ms-`, `me-`, `ps-`, `pe-`) — currently the code uses physical properties (`pl-`, `pr-`) which may need auditing.

---

## 12. Key Design Gaps to Address

These are the areas where the current implementation is functional but visually underdeveloped:

1. **LandingPage** — The hero section is plain. No illustration, no screenshot, no visual proof of what the product does.

2. **ChatPage question cards** — The cards are the core interaction but currently just white rounded rectangles. They need more visual character.

3. **Calculator results** — The breakdown table is a wall of text. Needs visual grouping (sections with subtle separators, key numbers highlighted).

4. **SimulationPage OverviewStep** — The emotional payoff of the whole simulation. The result cards are functional but not celebratory. Consider a "Your tax estimate is ready" moment.

5. **Mobile responsiveness** — The two-column grids (calculator form, pricing cards, simulation sidebar) don't collapse on small screens.

6. **Empty states** — Chat gate screen and empty states are minimal text. Need illustration or visual anchor.

7. **Onboarding flow continuity** — The transition from Register → Intake → Chat should feel like one connected journey, not three separate pages.

8. **Dark mode** — CSS variables are defined for dark mode but the full UI hasn't been reviewed in dark mode. Some components may have hardcoded light-mode assumptions.

---

## 13. What NOT to Change

- **CSS variables** — The theme tokens (`--accent`, `--text`, etc.) must be preserved. All colour decisions flow through them.
- **RTL support** — The `dir={isRtl ? "rtl" : "ltr"}` pattern on page wrappers must be maintained for Persian users.
- **API contract** — Design changes only. Backend API shapes, localStorage keys, and routing paths should not change.
- **The card-based chat UX** — No free-text input in the chat. All interaction is via pre-written question cards. This is a deliberate product constraint.
- **TypeScript strict mode** — All frontend code must continue to pass `npx tsc --noEmit` with no errors.
