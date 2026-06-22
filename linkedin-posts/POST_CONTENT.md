# TaxWijs — LinkedIn Post Content
> 6 posts for the TaxWijs launch campaign. Each post maps to specific screenshots.
> Screenshots folder: `linkedin-posts/screenshots/`

---

## POST 1 — Launch Announcement (English)
**Screenshot(s):** `landing_desktop_en.png`, `landing_mobile_en.png`
**Target audience:** General (Dutch tech, FinTech, expat community)

---

Excited to announce **TaxWijs** — the AI-powered Dutch tax assistant I've been building.

🇳🇱 Navigating Dutch taxes as a ZZP freelancer, employee, or expat is genuinely hard. The rules change every year, the jargon is dense, and mistakes cost real money.

TaxWijs changes that:

→ Ask any Dutch tax question in plain language
→ Get verified answers, sourced directly from Belastingdienst.nl
→ Calculate your full 2026 tax bill in seconds
→ Walk through the IB return (aangifte) step by step
→ Connect with a certified accountant — right in the same platform

What makes it different: the AI never does the maths. A deterministic calculator handles all numbers. The AI explains, the calculator computes. Always accurate. Always cited.

Available in **Dutch · English · Persian (فارسی)**

📸 Screenshots: Landing page (desktop + mobile)

Built by: **Diako** — Full Stack Developer

#TaxWijs #DutchTax #ZZP #FinTech #AI #Netherlands #Freelance #Expat #Launch

---

## POST 2 — AI Assistant Deep Dive (English)
**Screenshot(s):** `chat_desktop_en.png`, `chat_mobile_fa.png`
**Target audience:** ZZP workers, expats, anyone filing Dutch taxes

---

What does it actually feel like to ask an AI about your Dutch taxes?

Like this:

💬 "How much tax do I pay as a ZZP with €50k profit?"

TaxWijs responds with:
✅ Your exact tax breakdown (Box 1, ZVW contribution, deductions)
✅ How zelfstandigenaftrek and MKB-winstvrijstelling apply to YOU
✅ How much to reserve each month
✅ Source: belastingdienst.nl — not guesswork

The AI knows about the 2026 rule changes:
• Startersaftrek is **in its last year** — after 2026, it's gone
• Accommodation BTW moved from 9% → 21%
• Wet DBA enforcement is now active

Ask in Dutch, English, or Persian. Get the same quality answer.

📸 Screenshot: Chat interface — desktop (EN) + mobile (FA)

#TaxWijs #AI #ZZPbelasting #DutchTaxes #FinTech #Freelance

---

## POST 3 — Persian Community (Persian + English)
**Screenshot(s):** `landing_desktop_fa.png`, `chat_desktop_fa.png`, `landing_mobile_fa.png`
**Target audience:** Iranian community in the Netherlands

---

**English:**
Over 100,000 Iranian expats live in the Netherlands. Many are freelancers, employees, and entrepreneurs navigating one of Europe's most complex tax systems — in a language that isn't their first.

TaxWijs is built for them too.

🇮🇷🇳🇱 Persian is a **first-class language** in TaxWijs — not an afterthought, not a Google Translation. Every tax rule, every explanation, every IB return step is written natively in Persian.

**فارسی:**
بیش از ۱۰۰,۰۰۰ ایرانی در هلند زندگی می‌کنند. بسیاری از آنها فریلنسر، کارمند یا کارآفرین هستند و با یکی از پیچیده‌ترین سیستم‌های مالیاتی اروپا روبرو می‌شوند.

TaxWijs برای آنها هم ساخته شده.

زبان فارسی در TaxWijs یک زبان اول است — نه ترجمه، نه افزودنی. هر قانون مالیاتی، هر توضیح، و هر مرحله از اظهارنامه به فارسی نوشته شده.

📸 Screenshots: Landing page + Chat — Persian/FA

#TaxWijs #IranianExpats #DutchTax #مالیات_هلند #ZZP #FinTech #Netherlands

---

## POST 4 — Platform Tour / Feature Showcase (English)
**Screenshot(s):** `dashboard_desktop_en.png`, `zzp_workspace_desktop_nl.png`, `simulation_desktop_en.png`, `pricing_mobile_en.png`
**Target audience:** ZZP workers, accountants, Dutch professionals

---

A tour of what TaxWijs actually does:

**🏠 Dashboard**
Your tax health at a glance. Smart alerts for deadlines, risk flags, and deduction opportunities — personalised to your income and user type.

**📊 ZZP Workspace**
Track revenue, expenses, hours, and mileage. The platform calculates urencriterium progress (the 1,225-hour threshold for zelfstandigenaftrek) live.

**🔢 Tax Simulation**
Input your numbers. Get a full 2026 tax breakdown: gross profit → deductions → Box 1 tax → ZVW → credits → net payable. Every step explained.

**🤝 Find an Accountant**
The AI doesn't replace your accountant. It prepares you for them. When you're ready, connect with a certified Dutch tax advisor directly in the platform.

**💶 Pricing**
Free to try. €9.99/month when you're ready. No surprise add-ons.

📸 Screenshots: Dashboard, ZZP Workspace, Simulation, Pricing

#TaxWijs #ZZP #DutchTax #TaxTech #FinTech #Netherlands #Accountant

---

## POST 5 — For Accountants / B2B (English)
**Screenshot(s):** `find_accountant_desktop_en.png`, `dashboard_desktop_nl.png`
**Target audience:** Dutch accountants, tax advisors, bookkeepers

---

TaxWijs isn't trying to replace accountants.

It's trying to make their clients **better prepared**.

The #1 complaint I hear from Dutch tax advisors: clients arrive with incomplete records, wrong documents, and basic questions that eat billable time.

TaxWijs solves the intake problem:
→ Client answers structured tax questions before the meeting
→ Platform builds a complete profile (income, deductions, toeslagen eligibility)
→ AI flags Wet DBA risks, missed deductions, and deadline gaps
→ Client arrives with a readiness score, not a shoebox of receipts

Accountants on the platform get:
✔ Client portal access
✔ Document review queue
✔ Direct messaging
✔ Engagement tracking

Interested in partnering? DM me.

📸 Screenshots: Find Accountant + Dashboard

#TaxWijs #Accountants #Belastingadviseur #DutchTax #B2B #FinTech #ZZP

---

## POST 6 — Developer / Builder Story (English)
**Screenshot(s):** `landing_desktop_en.png`, `chat_desktop_nl.png`, `pricing_desktop_en.png`
**Target audience:** Tech community, developers, startups, recruiters

---

I built TaxWijs as a full-stack solo project. Here's the honest stack:

**Frontend:** React + TypeScript + Vite. Fully trilingual (NL/EN/FA), including RTL layout for Persian. Every user-facing string exists in all three languages.

**Backend:** Django + Django REST Framework. JWT auth, Celery for async tasks, PostgreSQL.

**AI Layer:** Claude (Anthropic) for reasoning + explanations. The AI never computes tax numbers — that's a deterministic Python calculator that runs separately, seeded from a hand-verified JSON knowledge base with 28 verified 2026 tax rules.

**RAG Pipeline:** ChromaDB + OpenAI embeddings. All AI answers cite their source URL (belastingdienst.nl). Hallucination by design: impossible for the AI to invent a tax rate.

**Infrastructure:** Supabase (pgvector for production), Celery + Redis, PostHog analytics, full GDPR cookie consent.

What I'm most proud of: the architecture enforces correctness. The AI *cannot* do arithmetic. This isn't a constraint — it's the product.

Looking for feedback, collaborators, or early users. Drop a comment or DM.

📸 Screenshots: Landing (EN), Chat (NL), Pricing

#BuiltInPublic #FullStack #React #Django #AI #FinTech #TaxWijs #Netherlands #OpenToWork

---
