# Scope and Non-Goals

> What TaxWijs does, what it explicitly does not do, and what may come later.
> Updated: 2026-06-13

---

## In Scope (v1.0)

### Tax Knowledge
- Dutch income tax (inkomstenbelasting) for tax year 2026
- Box 1 (work income), Box 2 (substantial interest), Box 3 (savings/investments)
- All self-employed deductions (zelfstandigenaftrek, startersaftrek, MKB-winstvrijstelling, KIA, lijfrente)
- Healthcare contribution (ZVW) — including the commonly missed ZZP calculation
- Tax credits (heffingskortingen): AHK, arbeidskorting, IACK
- Government benefits (toeslagen): zorgtoeslag, huurtoeslag
- VAT (BTW): standard 21%, reduced 9%, KOR exemption
- DGA regime: gebruikelijk loon, Box 2 rates, dividend optimization
- 30% ruling for expats: eligibility, phase-down schedule
- Wet DBA risk assessment for freelancers
- IB return (aangifte) guidance: all 9 form fields (1a–8a)
- Annual tax deadlines (BTW quarterly, IB return 1 May)

### User Profiles
- ZZP workers (freelancers without employees)
- Employees (Dutch employment)
- Expats (30% ruling holders)
- DGA directors (≥5% BV shareholders)
- Accountants and their firms

### Languages
- Dutch (NL) — primary
- English (EN) — full parity
- Persian/Farsi (FA) — full parity, RTL layout, first-class language

### Core Features
- AI tax Q&A (streaming, sourced, trilingual)
- Tax calculator (deterministic, 6 verified scenarios)
- Deduction checker (9-step wizard for ZZP)
- IB return guide (conversational, AI-guided)
- Tax simulation (income → full tax picture)
- User intake and profile management
- Accountant portal (engagement workspace, 7 tabs)
- Client portal (readiness, tasks, documents, messages)
- Document upload, OCR extraction, accountant review
- Checklist engine (persona-specific templates)
- Readiness engine (0–100 score)
- Accountant-client invitation flow
- Push notifications (Web Push / VAPID)
- Tax calendar with ICS download
- ZZP workspace (quarterly VAT, revenue/expense tracking)
- Multi-tenant firm management
- GDPR account deletion
- Trilingual (NL/EN/FA) across all features

---

## Out of Scope (v1.0)

### What We Do NOT Do

| Item | Reason |
|------|--------|
| Actual e-filing to Belastingdienst | Requires Belastingdienst API integration — not available to third parties at this scale |
| Bookkeeping / invoicing | Tellow, Moneybird, Exact do this — not our core |
| Payroll administration | Different product category entirely |
| Corporate tax (vennootschapsbelasting / VPB) | Requires entirely different rule set — deferred |
| Wealth management advice | Out of scope for a tax product |
| Pension fund management | Different regulated domain |
| Legal contract drafting | Out of scope |
| Audit defense or tax authority representation | Requires licensed tax advisor (see GAP-L06) |
| Multi-country tax advice | Only Dutch tax; cross-border flows are noted but not calculated |
| Historical tax years (pre-2026) | Phase 9 (annual maintenance) adds previous years; v1 is 2026 only |
| WhatsApp/SMS notifications | Requires Twilio + Meta Business approval — deferred |
| Custom Figma integration | Figma API not integrated |

---

## Deferred (Future Scope)

| Item | Notes |
|------|-------|
| Historical tax years (2024, 2025) | Phase 9: annual data update process |
| Stripe billing and premium tiers | Data models exist, no active paywalls in v1 |
| Marketplace (accountant directory) | Basic spec exists, full build deferred |
| WhatsApp/SMS notifications | Twilio integration deferred — needs Meta Business account |
| Belastingdienst API e-filing | Requires official API partnership |
| SAML/SSO for enterprise accountant firms | GAP-I05: identity provider not selected |
| Mobile native app (iOS/Android) | v1 is mobile-responsive web only |
| Document co-signing / e-signatures | Deferred to v2 |
| Automatic bank transaction import | Not in scope for v1 |
| VPB (corporate tax) calculation | Deferred — major new rule set |
| Annual rule update tooling (non-technical) | Phase 9: admin UI for annual tax rule updates |

---

## Product Principles

1. **Explain, don't hide.** Users learn from TaxWijs. We never obscure complexity behind a black box.
2. **Source everything.** Every factual tax claim links to an official URL. No unsourced tax advice.
3. **AI explains, calculator computes.** The AI never does arithmetic. The deterministic calculator is always the source of numbers.
4. **Only verified rules reach users.** Pending or draft rules never appear in responses.
5. **Three languages, equal quality.** NL/EN/FA are co-equal. Persian is not an afterthought.
6. **Accountant-first, client-friendly.** The product is optimized for accountants but must be usable by clients without accountant help.
7. **Privacy by design.** GDPR compliance is built in, not bolted on. Minimal data collection, clear retention policies.
8. **No dark patterns.** No hidden cancellation flows, no manipulative urgency, no fake deadlines.
