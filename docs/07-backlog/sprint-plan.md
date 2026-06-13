# Sprint Plan — TaxWijs

> 2-week sprints. Sprint goals and priority stories per sprint.
> Current status: Phase 3 complete. Ready for Phase 4 (AI Response Layer) implementation.

---

## Sprint 1 (Weeks 1–2): Foundation — Auth + Client CRUD

**Goal:** Working login, firm setup, and client creation end-to-end.

| Story | Points | Priority |
|-------|--------|----------|
| E01-F01-US001: User registration + email verification | 3 | P0 |
| E01-F02-US003: JWT login + refresh | 2 | P0 |
| E01-F02-US004: MFA (TOTP) | 3 | P1 |
| E01-F03-US005: Invitation acceptance flow | 3 | P0 |
| E02-F01-US001: Firm create/update | 2 | P0 |
| E02-F02-US003: Invite accountant by email | 2 | P0 |
| E03-F01-US001: Create client | 2 | P0 |
| E03-F01-US002: Set client persona | 1 | P0 |
| **Total** | **18** | |

---

## Sprint 2 (Weeks 3–4): Engagement Core + Checklist

**Goal:** Engagements exist with auto-generated checklists and a live readiness score.

| Story | Points | Priority |
|-------|--------|----------|
| E04-F01-US001: Create engagement | 2 | P0 |
| E04-F01-US002: Engagement status state machine | 3 | P0 |
| E08-F01-US001: Readiness score calculation | 5 | P0 |
| E09-F01-US001: Auto-generate checklist on engagement create | 3 | P0 |
| E09-F01-US002: Checklist in NL/EN/FA | 2 | P0 |
| E09-F02-US003: Waive checklist item | 1 | P1 |
| E04-F02-US003: Show readiness score in UI | 3 | P0 |
| **Total** | **19** | |

---

## Sprint 3 (Weeks 5–6): Document Upload + OCR

**Goal:** Documents can be uploaded, virus-scanned, and OCR'd.

| Story | Points | Priority |
|-------|--------|----------|
| E05-F01-US001: Drag-and-drop upload UI | 3 | P0 |
| E05-F01-US002: Upload confirmation | 1 | P0 |
| E05-F02-US004: Virus scan pipeline | 3 | P0 |
| E06-F01-US001: AWS Textract OCR | 5 | P0 |
| E06-F01-US002: Document classification (Claude) | 5 | P0 |
| E06-F02-US003: Field extraction | 5 | P0 |
| E06-F02-US004: Confidence scoring | 3 | P0 |
| **Total** | **25** | |

---

## Sprint 4 (Weeks 7–8): Document Review + Readiness Integration

**Goal:** Accountants can review extracted data; accepted documents improve the readiness score.

| Story | Points | Priority |
|-------|--------|----------|
| E07-F01-US001: Review queue UI | 3 | P0 |
| E07-F01-US002: Accept extracted field | 2 | P0 |
| E07-F01-US003: Correct extracted field | 2 | P0 |
| E07-F02-US005: Review lock (prevent concurrent edit) | 3 | P1 |
| E08-F01-US001: Score updates on document accept | 3 | P0 |
| E08-F01-US002: Formula breakdown in UI | 2 | P1 |
| **Total** | **15** | |

---

## Sprint 5 (Weeks 9–10): AI Chat Integration (Phase 4)

**Goal:** AI chat works for NL/EN/FA questions with RAG context and source citations.

| Story | Points | Priority |
|-------|--------|----------|
| E10-F01-US001: AI chat endpoint (SSE streaming) | 5 | P0 |
| E10-F01-US002: Same quality in English | 2 | P0 |
| E10-F01-US003: Persian (FA) support | 2 | P0 |
| E10-F02-US004: Source URL citations in responses | 3 | P0 |
| E10-F02-US005: Chat history visible to accountant | 2 | P1 |
| RAG: retrieve() wired to chat endpoint | 3 | P0 |
| **Total** | **17** | |

---

## Sprint 6 (Weeks 11–12): Calculator UI + Deduction Scanner

**Goal:** Tax calculator available in UI; deduction opportunities surfaced.

| Story | Points | Priority |
|-------|--------|----------|
| E11-F01-US001: Calculator form (ZZP) | 3 | P0 |
| E11-F01-US002: Step-by-step deduction breakdown | 3 | P0 |
| E11-F01-US003: ZVW bijdrage shown separately | 1 | P0 |
| E11-F02-US004: DGA Box 1 + Box 2 calculator | 3 | P1 |
| E12-F01-US001: Startersaftrek expiry alert | 2 | P0 |
| E12-F02-US003: Zorgtoeslag cliff warning | 2 | P1 |
| E12-F02-US004: Opportunities list for accountant | 2 | P1 |
| **Total** | **16** | |

---

## Backlog (Post-Sprint 6, prioritized)

| Story | Points | Phase |
|-------|--------|-------|
| E13-*: IB Return Guide (all stories) | 20 | Phase 6 |
| E14-*: Rule Management admin UI | 25 | Phase 8 |
| E15-*: Admin Console | 20 | Phase 8 |
| E02-F01-US002: Firm white-label logo | 3 | Phase 8 |
| E02-F03-US005: Billing dashboard | 5 | Phase 8 |
| E07-F02-US004: Conflicting value side-by-side UI | 3 | Phase 8 |
| E16-*: Annual maintenance tooling | 15 | Phase 9 |
