# User Journeys

> End-to-end journeys for each primary persona.
> Updated: 2026-06-13

---

## Journey 1 — ZZP Worker: First Tax Estimate (Arash)

**Trigger:** Arash sees a TaxWijs ad on expatforum.nl in February.  
**Goal:** Know how much tax he owes for 2025 and what to set aside going forward.

```
1. DISCOVERY
   Arash lands on /zzp-tax-netherlands (Persian SEO page)
   → Reads the ZVW section — first time he's heard of this
   → Clicks "Check my deductions" CTA

2. DEDUCTION CHECKER
   /deduction-checker — selects ZZP
   → Answers 9 questions (hours, revenue, expenses, KIA, BTW, pension)
   → Sees results: "Likely eligible" (zelfstandigenaftrek, MKB, ZVW), "Needs confirmation" (KIA)
   → Email gate: enters email to see full results
   → Reads results, clicks "Calculate my exact tax →"

3. REGISTRATION
   /register — selects "ZZP freelancer"
   → Enters name, email, password
   → Navigates to /intake

4. INTAKE WIZARD
   /intake — enters: ZZP, revenue €72k, expenses €8k, hours ~1,300, no starter, 3rd year
   → Profile saved
   → Navigates to /dashboard

5. DASHBOARD
   Dashboard shows: tax estimate €13,952, effective rate 19.4%, monthly reserve €1,228
   → Sees Wet DBA alert (65% single client)
   → Clicks "Ask AI about Wet DBA"

6. CHAT
   /chat — AI explains Wet DBA risk in Persian
   → Arash understands he is medium risk
   → AI recommends adding a substitution clause to his contract
   → Arash saves the conversation insight to dashboard

7. ONGOING
   Gets BTW deadline reminder (30 April)
   Returns in March to start IB return guidance
   Invites his accountant to review his file
```

**Outcome:** Arash knows his tax obligation, understands ZVW, has a Wet DBA risk plan, and has started his IB return preparation.

---

## Journey 2 — New ZZP: Claiming Startersaftrek (Lisa)

**Trigger:** Lisa's friend tells her that the startersaftrek is being abolished — this is the last year.  
**Goal:** Confirm eligibility and claim the €2,123 deduction on her first IB return.

```
1. SEARCH
   Googles "startersaftrek 2026 last year"
   → Finds TaxWijs deduction checker page

2. DEDUCTION CHECKER
   Answers: ZZP, 1st year, 1,300 hours, yes to starting
   → Results: startersaftrek "Likely eligible" — red banner: "LAST YEAR — abolished 2027"
   → "Calculate your full tax →" CTA

3. REGISTRATION + INTAKE
   Registers, completes intake: €28k revenue, design, 1st year ZZP

4. DASHBOARD
   Sees: total tax €1,359, effective rate 4.9%
   → Notices note: "Startersaftrek included: €2,123 saved"
   → Understands the value without understanding the mechanism

5. IB RETURN GUIDE
   Clicks "Start IB return guide" chip in /chat
   → AI walks her through fields 1a, 1c, 1d conversationally
   → Downloads IB return report PDF

6. ACCOUNTANT PORTAL (optional)
   If she connects to an accountant:
   → Accountant receives portal with her documents and checklist pre-filled
   → Accountant reviews and files
```

**Outcome:** Lisa claims the startersaftrek before it disappears and completes her first IB return with AI guidance.

---

## Journey 3 — Expat: 30% Ruling Check (Maria)

**Trigger:** Maria's colleague says the 30% ruling is being phased down — she doesn't know what year she's in.  
**Goal:** Understand her ruling status and whether she needs to do anything.

```
1. DISCOVERY
   Finds TaxWijs via "30% ruling Netherlands English" Google search
   → Lands on /expat-tax-netherlands (English)

2. CHAT (unauthenticated)
   Uses the chat widget to ask: "I arrived in March 2024. What is my 30% ruling status?"
   → AI explains: Year 2 in 2026, still at 30%. Year 4 (2028) drops to 20%.
   → AI recommends registering to track this over time

3. REGISTRATION + INTAKE
   Registers, selects Expat, enters arrival date, employer, salary €90k

4. DASHBOARD
   Shows: 30% ruling active (year 2), next phase-down date 2028
   → Tax estimate with ruling applied: €16,390
   → Without ruling estimate: €22,400 — "Your 30% ruling saves you €6,010/year"

5. IB RETURN CHECK
   AI asks: "Do you know you may need to file an IB return even as an employee?"
   → Maria didn't know this
   → IB return guide walks her through expat-specific fields
```

**Outcome:** Maria understands her ruling timeline, sees the financial value, and discovers she needs to file an IB return.

---

## Journey 4 — Accountant: Onboarding a Client (Sara)

**Trigger:** Sara registers as an accountant and wants to bring her first client onto TaxWijs.  
**Goal:** Get client documents collected and engagement started.

```
1. ACCOUNTANT REGISTRATION
   /register — selects Accountant
   → Enters firm name, KVK number
   → Navigates to /accountant/portal

2. INVITATION FLOW
   /accountant/portal → Invitations tab
   → Enters client email + optional message
   → Sends invitation

3. CLIENT ACCEPTANCE (client side)
   Client logs in → sees InvitationBanner on dashboard
   → Clicks "Accept" → connected

4. ENGAGEMENT CREATION (accountant side)
   AccountantPortalPage → client appears in client list
   → Clicks client → AccountantClientDetailPage
   → Creates new engagement for tax year 2026
   → Checklist template auto-generated (ZZP template)

5. DOCUMENT COLLECTION
   Accountant sends document requests: "Upload your jaaropgaaf 2025"
   Client receives in /client/tasks
   → Uploads document
   → OCR extracts: gross salary €72,000, tax withheld €14,000

6. ACCOUNTANT REVIEW
   Sara opens /accountant/engagements/[id] → Documents tab
   → Split panel: document on left, extracted fields on right
   → Reviews confidence scores, corrects one field
   → Marks extraction as "approved"
   → Readiness score jumps from 62 → 78

7. DEDUCTION SCAN
   Sara clicks "Generate deduction analysis" in Risks & Deductions tab
   → AI identifies 3 opportunities:
      - Startersaftrek (client is in year 2)
      - ZVW (often missed — already in calculator)
      - KIA (client bought a laptop, €1,200)
   → Sara reviews and confirms

8. FILING PREP
   Readiness reaches 85 → "Ready to file" badge appears
   Sara downloads the IB return summary → files via Belastingdienst
```

**Outcome:** Sara onboarded a client in under 30 minutes, collected all documents, and reached filing readiness with AI assistance.

---

## Journey 5 — Client Self-Service: No Accountant (General)

**Trigger:** User registers but has no accountant. Wants to use TaxWijs independently.  
**Goal:** Prepare their IB return without paying for an accountant.

```
1. REGISTRATION
   /register → selects client type
   → Completes intake

2. PORTAL AUTO-CREATE
   /client → auto-creates AccountantClientProfile + TaxEngagement
   → "Self-service mode" — no accountant linked

3. TASK CHECKLIST
   /client/tasks shows standard checklist for their user type
   → "Upload jaaropgaaf" → uploads document
   → OCR extracts salary data

4. AI CHAT FOR QUESTIONS
   "Ask AI" from task card → Chat with pre-filled context
   → AI answers: "Based on your profile, here is what field 1b should be..."

5. READINESS TRACKING
   Returns periodically to /client → checks readiness score
   → When score reaches 80+, "Your file looks ready"

6. IB RETURN GUIDE
   Opens IB return guide chip in /chat
   → AI walks through all 9 fields, pre-populating from profile
   → Downloads report → files independently
```

**Outcome:** User completes IB return preparation independently, guided by AI, without needing an accountant.
