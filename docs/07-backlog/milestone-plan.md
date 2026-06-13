# Milestone Plan — TaxWijs

> High-level milestones, target dates, and completion criteria.

---

## Milestone Map

```
Phase 1  ──►  Phase 2  ──►  Phase 3  ──►  Phase 4  ──►  Phase 5
Jan 2026      Feb 2026      Mar 2026      Apr 2026      May 2026
  ✅ Done        ✅ Done       ✅ Done       →In Progress   ⏳ Next

Phase 6  ──►  Phase 7  ──►  Phase 8  ──►  Phase 9
Jun 2026      Jul 2026      Aug 2026      Sep 2026 (annual)
  ⏳            ⏳             ⏳            🔄 Recurring
```

---

## Milestone 1 — MVP Launch (End of Phase 8)

**Target:** August 2026

**Includes:**
- Authentication, firm setup, client management
- Engagement workspace with readiness scoring
- Document upload + OCR + classification + extraction
- Accountant review workflow
- AI chat (NL/EN/FA) with RAG + source citations
- Tax calculator (ZZP, employee, expat, DGA)
- Deduction opportunity scanner
- IB return guide
- Admin console

**Launch criteria:**
- [ ] All phase tests pass (validate.py, test_retrieval.py, test_scenarios.py)
- [ ] 97/97 backend tests pass
- [ ] 0 TypeScript errors in frontend build
- [ ] 5 pilot firms onboarded in staging
- [ ] Penetration test completed
- [ ] GDPR compliance review completed
- [ ] Belastingdienst data verified for 2026

---

## Milestone 2 — First Annual Update (Phase 9)

**Target:** December 2026 (for tax year 2027)

**Includes:**
- 2027 tax rules verified and published
- All 6 seed scenarios updated for 2027 values
- RAG corpus re-indexed
- Calculator validated for 2027
- Release tagged `v2.0.0`

**Trigger:** Prinsjesdag (third Tuesday of September 2026) → verify law is final → deploy December 31 at latest

---

## Milestone 3 — Scale (Post-MVP)

**Target:** Q1 2027

**Includes:**
- Supabase pgvector in production (replace ChromaDB)
- Multi-firm self-service onboarding
- BTW automation (automatic quarterly VAT return prep)
- Wet DBA continuous monitoring
- Mobile-first engagement workspace

---

## Phase Completion Criteria (Summary)

| Phase | Gate |
|-------|------|
| Phase 1 | validate.py 100%, 28 rules verified, 6 scenarios match |
| Phase 2 | precision@5 ≥ 95%, cross-lingual ≥ 72%, token budget ≤ 1,500 |
| Phase 3 | 0.0% error on 6 scenarios, calculator never hardcodes values |
| Phase 4 | AI responds in NL/EN/FA with citations, SSE streams in < 8s P95 |
| Phase 5 | Intake wizard completes, readiness score live, all personas work |
| Phase 6 | IB guide covers all 9 form fields in 3 languages |
| Phase 7 | 97+ tests pass, all quality gates in CI green |
| Phase 8 | Admin console + rule management live, GDPR fulfilled |
| Phase 9 | New year data deployed before January 1 of that year |
