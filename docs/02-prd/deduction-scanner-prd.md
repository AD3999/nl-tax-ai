# Deduction Scanner PRD

> Module: Deduction Scanner | Version: 1.0 | Updated: 2026-06-13

---

## Overview

The Deduction Scanner is a 9-step wizard that helps ZZP (and other) users discover which tax deductions and credits they are eligible for. It combines a structured intake questionnaire with deterministic eligibility checks (from the Phase 1 rule set) and an AI-powered explanation layer. The scanner is accessible without an accountant and is a primary user acquisition funnel.

---

## Design Principles

1. **Non-ZZP users see a waitlist, not the full scanner** — The scanner is ZZP-optimized. Employees, expats, and DGAs are directed to a waitlist with an "in development" message.
2. **No AI in eligibility decisions** — Eligibility (yes/no) is determined by the deterministic rule engine. AI only explains the result.
3. **No paywall** — The scanner is free for all users including anonymous.
4. **Progressive disclosure** — Earlier steps use simple yes/no questions. Later steps show numeric inputs only if relevant.
5. **Persian-first thinking** — All 9 steps are translated to FA with RTL layout.

---

## User Type Gate

Before step 1:

```
"What best describes your work situation?"
○ I am a ZZP'er (freelancer / self-employed)      → Continue to Step 1
○ I am an employee (in dienst)                    → Waitlist screen
○ I am an expat with 30% ruling                  → Waitlist screen
○ I am a DGA (BV director)                       → Waitlist screen
○ I have mixed income (ZZP + employment)          → Continue (limited)
```

---

## 9 Steps

### Step 1 — Business Basics

Questions:
- What is your estimated annual profit? [€ input]
- How many hours did you work on your business this year? [number input]
- Is this your first year as ZZP? [yes/no]
- Is this your second or third year? [yes/no — enables startersaftrek check]

Output signals: `profit`, `hours`, `is_first_year`, `is_starter_year`

### Step 2 — Zelfstandigenaftrek Check

Display:
- Current year requirement: 1,225+ hours (urencriterium)
- User's answer from Step 1 hours input

Eligibility decision (deterministic):
- hours ≥ 1,225: **Eligible** → ZA-2026-001 applies (€1,200 deduction)
- hours < 1,225: **Not eligible** → Show explanation why + tip to track hours better next year

Show: `ZA-2026-001` rule card with Dutch/English/Persian explanation

### Step 3 — Startersaftrek Check

Show only if `is_starter_year = True` (year 1, 2, or 3 of ZZP).

Eligibility: hours ≥ 1,225 AND starter year → `SA-2026-001` applies (€2,123)

**IMPORTANT:** Show prominent warning: "2026 is the LAST YEAR for startersaftrek. It is abolished from 2027."

Show rule card: `SA-2026-001` with effective_until banner.

### Step 4 — MKB-Winstvrijstelling

Always applicable for ZZP (no hours requirement).

Display: 12.7% of profit after ondernemersaftrek (ZA + SA if applicable).

Show calculation preview: "After your deductions, your taxable profit qualifies for a 12.7% exemption."

Show rule card: `MKB-2026-001`.

### Step 5 — ZVW Hidden Tax

Questions:
- Confirm: "Are you aware that ZZP workers pay a separate health contribution?"

Display: The ZVW calculation:
- 4.85% of profit after ondernemersaftrek
- Ceiling: €79,409 profit
- Maximum: €3,851/year

Show rule card: `ZVW-2026-001` with `AI INSTRUCTION: ALWAYS include ZVW` warning.
Mark this as a "frequently missed" item.

### Step 6 — Business Investment (KIA)

Questions:
- Did you invest in business assets this year? [yes/no]
- If yes: what was the total investment amount? [€ input]

Eligibility check (deterministic):
- Investment €2,901–€70,602: eligible for 28% KIA deduction
- Outside range: not eligible (or different rate — show table)

Show rule card: `KIA-2026-001` if eligible.

### Step 7 — Pension (Lijfrente / Jaarruimte)

Questions:
- Do you have a private pension product (lijfrente)? [yes/no]
- Did you contribute this year? [yes/no → amount input]

Eligibility: `LR-2026-001` — jaarruimte formula: 30% × (profit − €19,172)

Show: "Your maximum deductible pension contribution this year is: [calculated amount]"

Note: This requires calculation. Show the formula. Don't call the calculator for this step (wizard keeps it simple). Direct to full calculator for precise figure.

### Step 8 — Toeslagen Check

Questions:
- Annual income estimate (from Step 1 profit, adjusted by deductions so far)
- Do you pay rent? (if no: huurtoeslag not applicable)
- Do you have health insurance costs? (zorgtoeslag check)

Eligibility:
- Zorgtoeslag: income ≤ €40,857 (single) → `ZT-2026-001`
- Huurtoeslag: income threshold check + paying rent → `HT-2026-001`

**IMPORTANT for zorgtoeslag:** €1 over the €40,857 hard cutoff = €0 toeslag. Show this cliff clearly.

### Step 9 — Results Summary

Full results page showing:
1. Deductions found (YES):
   - Zelfstandigenaftrek: €1,200 (if eligible)
   - Startersaftrek: €2,123 (if eligible + 2026 warning)
   - MKB-winstvrijstelling: calculated amount
   - KIA: calculated if applicable
   - Pension: estimated jaarruimte

2. Hidden tax reminder:
   - ZVW: estimated amount (mark red as "easily missed")

3. Toeslagen:
   - Zorgtoeslag eligible: yes/no
   - Huurtoeslag eligible: yes/no

4. Estimated tax summary:
   - Taxable profit before deductions: €X
   - Total deductions: €Y
   - Profit after MKB: €Z
   - Estimated income tax: €A (refer to full calculator for accuracy)
   - Estimated ZVW: €B
   - Total estimated tax burden: €A + €B

5. Next steps CTA:
   - "Calculate your exact tax →" (links to full calculator)
   - "Ask the AI →" (opens chat with context pre-filled)
   - "Find an accountant →" (links to marketplace)

---

## AI Layer (Explanation Only)

The AI is used ONLY for explaining the results, not computing them.

After eligibility is determined:
- For each eligible deduction: AI generates a 2-sentence explanation in the user's language
- For each ineligible item: AI explains why and what the user could do differently next year
- AI explicitly says: "These calculations are estimates. Use the TaxWijs calculator for exact figures."

Prompt structure:
```
System: You are a Dutch tax assistant. Explain the following ZZP tax deduction results in [language].
        Only explain — do not recalculate. Cite the rule_id and source_url for each item.

Context: [RAG-assembled rule cards for all triggered rule_ids]

Task: Summarize the results for a ZZP worker with profit €X and Y hours, who is eligible for: [list]
      and not eligible for: [list]. Use plain language. Language: [nl/en/fa].
```

---

## Analytics Events

| Event | Properties |
|-------|-----------|
| `checker_started` | user_type, language |
| `checker_step_completed` | step_number, step_id |
| `checker_completed` | eligible_count, ineligible_count, estimated_tax |
| `checker_results_viewed` | — |
| `checker_cta_clicked` | cta_type (calculator/chat/marketplace) |
| `checker_waitlist_submitted` | user_type |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/checker/submit/` | Submit final answers, get eligibility results |
| GET | `/api/checker/rules/{year}/` | Get rule cards for all checker-relevant rules |
| POST | `/api/checker/explain/` | Get AI explanation for results (SSE stream) |

The checker does NOT require authentication — anonymous users can use it. Results are shown in-browser only (not saved). If user logs in after using the checker, they can save results to their profile.

---

## NFR

| Requirement | Target |
|-------------|--------|
| Step transition | < 100ms (no server call per step — all client-side) |
| Results page load | < 1 second (rules pre-fetched) |
| AI explanation latency | < 3 seconds (first token, SSE) |
| Anonymous access | Fully supported |
| Mobile | Fully responsive, tested on 375px viewport |
| RTL (FA) | Full RTL layout for all 9 steps |
