# Jobs to Be Done

> Core jobs per persona with outcomes, context, and obstacles.
> Format: "When [situation], I want to [motivation], so I can [outcome]."
> Updated: 2026-06-13

---

## ZZP Worker (Arash / Lisa / Mehmet)

| # | Job | Situation | Outcome | Obstacle | TaxWijs Solution |
|---|-----|-----------|---------|----------|-----------------|
| Z-01 | Calculate total annual tax | I finished my year with €X revenue | Know exactly how much I owe and what to set aside | Dutch tax system complexity, missed deductions (ZVW, MKB) | Tax calculator + deduction checker + monthly reserve display |
| Z-02 | Know my monthly tax reserve | I just signed a new client at €8k/month | Set aside the right amount each month so I'm not shocked in spring | No intuitive tool for ZZP forward planning | Calculator monthly reserve output |
| Z-03 | Check my deductions | I'm filing my IB return | Not leave money on the table | Don't know what I qualify for | Deduction checker 9-step wizard |
| Z-04 | Understand Wet DBA risk | A client wants me to work exclusively with them | Know if I'm at risk of being reclassified as an employee | Opaque enforcement criteria | Wet DBA risk scorer |
| Z-05 | Understand the urencriterium | I want to claim zelfstandigenaftrek | Know if my 1,225 hours qualify | No clear definition of what counts | AI explanation + urencriterium guide |
| Z-06 | File my IB return | April arrives and I need to file | Submit correct return without overpaying or underpaying | Complex form, Dutch-only instructions | IB return guide (conversational AI) |
| Z-07 | Get startersaftrek before 2027 | I'm in my second year of ZZP | Claim the last year of this deduction | Didn't know it's being abolished | Startersaftrek alert in deduction checker |
| Z-08 | Understand ZVW contribution | I got a bill for ZVW I didn't budget for | Budget correctly for next year | ZVW is rarely explained upfront | ZVW explanation in calculator output |
| Z-09 | Track quarterly BTW | Q1 ends 31 March | File and pay BTW before 30 April deadline | Forget to file, even for zero returns | Tax calendar + Celery reminders |
| Z-10 | Check KOR eligibility | My revenue is ~€18k | Know if I should use the KOR exemption | Threshold and opt-in rules confusing | KOR eligibility check in deduction checker |

---

## Expat (Maria)

| # | Job | Situation | Outcome | Obstacle | TaxWijs Solution |
|---|-----|-----------|---------|----------|-----------------|
| E-01 | Understand my 30% ruling | I just got hired with a 30% ruling | Know what this means for my net salary and taxes | Complex explanation, Dutch-only sources | 30% ruling calculator + English guide |
| E-02 | Know when my ruling phases down | I've been here 3 years | Prepare for lower tax-free percentage in year 4 | No visibility on timeline | Phase-down timeline in profile |
| E-03 | Know if I need to file | Year 1 in the Netherlands | Not miss a filing obligation | HR says they handle it — might not be true | IB return guide + expat onboarding |
| E-04 | Understand partial-year taxes | I arrived in June | Calculate my tax correctly for year 1 | Partial-year is the hardest case | Partial-year expat scenario (flagged GAP-L02) |
| E-05 | Get tax advice in English | I don't speak Dutch | Access the same quality of advice as Dutch speakers | Dutch-only sources | Full English parity in all features |

---

## DGA Director (Thomas)

| # | Job | Situation | Outcome | Obstacle | TaxWijs Solution |
|---|-----|-----------|---------|----------|-----------------|
| D-01 | Validate my gebruikelijk loon | End of year planning | Confirm I'm paying myself the correct minimum salary | €56,000 rule + market rate complexity | DGA gebruikelijk loon check |
| D-02 | Optimize dividend vs salary | My BV has €80k retained earnings | Take money out most tax-efficiently | Box 1 vs Box 2 tradeoff is non-obvious | Dividend optimizer |
| D-03 | Understand new Box 2 rates | New 24.5%/31% split from 2024 | Apply the right rate to my dividend | Rate change not widely understood | Box 2 rate explanation + calculator |
| D-04 | Plan year-end | November, reviewing BV financial position | Decide salary/dividend before 31 December | No planning tool for DGA | Year-end planning guide (AI) |

---

## Accountant (Sara)

| # | Job | Situation | Outcome | Obstacle | TaxWijs Solution |
|---|-----|-----------|---------|----------|-----------------|
| A-01 | See which clients need attention | Monday morning | Prioritize the day in 5 minutes | 45 clients, different tools, lots of emails | Accountant inbox + priority AI panel |
| A-02 | Collect documents from a client | Client needs to upload jaaropgaaf | Receive and review in one place | Email chains, wrong formats, missing files | Client portal + document request system |
| A-03 | Review AI-extracted data | Document is uploaded | Verify AI extraction, correct mistakes | AI extractions can be wrong | Document review split panel with confidence scores |
| A-04 | Check engagement readiness | 3 weeks before filing deadline | Know which engagements are ready and which are blocked | No real-time readiness view | Readiness score + engagement overview |
| A-05 | Find deductions for a client | Reviewing ZZP client profile | Surface every deduction they might qualify for | Manual, knowledge-dependent process | AI deduction scanner in engagement workspace |
| A-06 | Communicate with a client in Persian | Client speaks Persian | Serve them without a translator | Language barrier | Trilingual message interface |
| A-07 | Send client a reminder | Client hasn't uploaded a document in 2 weeks | Get the document without an awkward chase | Chasing clients is inefficient | Automated reminder system (Celery Beat) |
| A-08 | Onboard a new client | New referral calls | Set up their workspace and start collecting | Manual onboarding overhead | Invitation flow + auto-create portal |

---

## Firm Manager (Pieter)

| # | Job | Situation | Outcome | Obstacle | TaxWijs Solution |
|---|-----|-----------|---------|----------|-----------------|
| F-01 | See firm-wide engagement health | Monday morning | Know which clients are at risk across all accountants | No firm dashboard | Firm-level engagement dashboard |
| F-02 | Reassign a client | An accountant is out sick | Transfer client smoothly | No built-in reassignment | Client reassignment (Tier 9 feature) |
| F-03 | Verify a new rule change | Belastingplan is published | Ensure all accountants know about it | Manual briefing process | Rule change notifications + rule engine |
| F-04 | Attract new clients | Looking for growth | List the firm on a marketplace | No B2B discovery channel | Marketplace listing (Tier 9 feature) |

---

## Platform Admin

| # | Job | Situation | Outcome | Obstacle | TaxWijs Solution |
|---|-----|-----------|---------|----------|-----------------|
| ADM-01 | Update tax rules for 2027 | Belastingplan 2027 published | Update all rules without a developer | Rules are in JSON + code | Rule engine admin UI (Tier 9 feature) |
| ADM-02 | Review a new pending rule | Someone submitted a rule update | Approve or flag for legal review | No admin workflow | Rule verification workflow |
| ADM-03 | Handle a DSAR | User requests their data | Provide complete data export | No automated DSAR flow | DSAR workflow (Tier 9 feature) |
| ADM-04 | Monitor system health | Any time | Catch issues before users do | No observability dashboard | OpenTelemetry + Sentry + PostHog |
