# Definition of Done — TaxWijs

> A user story or task is DONE only when all of the following are true. Partial completion is not done.

---

## 1. Code Quality

- [ ] Code passes Ruff (Python) and ESLint (TypeScript) with zero warnings
- [ ] No `any` types in new TypeScript code
- [ ] No hardcoded tax values (always read from Phase 1 JSON)
- [ ] No raw SQL (use Django ORM)
- [ ] No plaintext BSN in logs or DB (always use `bsn_enc`)
- [ ] All user-visible strings in NL + EN + FA (no hardcoded strings)

## 2. Testing

- [ ] Unit tests written for all new business logic functions
- [ ] API endpoint has at least one happy-path integration test
- [ ] `pytest` passes with 0 failures
- [ ] Coverage does not drop below 80% on `apps/`
- [ ] `npm run build` exits 0 (0 TypeScript errors)
- [ ] `npm test` passes

## 3. AI & Data Integrity

- [ ] `python phase1/scripts/validate.py` passes 100%
- [ ] If Phase 2 or Phase 3 touched: respective test suite passes
- [ ] Calculator called for all numbers (AI never computes)
- [ ] Only `verified` rules served to users
- [ ] All AI responses have `source_url`

## 4. Security

- [ ] New endpoint validates JWT and filters by `firm_id`
- [ ] No new endpoint bypasses the permissions system
- [ ] Sensitive fields not exposed in API responses (no BSN, no password_hash)
- [ ] New file uploads validated: mime type + size limit
- [ ] State-changing POSTs accept `Idempotency-Key`

## 5. Audit & GDPR

- [ ] State-changing operations write to `audit_log`
- [ ] PII fields follow encryption / access-log requirements
- [ ] New data with retention obligations has an entry in `retention_policies`

## 6. Documentation

- [ ] `PROGRESS.md` updated if a phase milestone is reached
- [ ] OpenAPI spec updated if a new endpoint is added
- [ ] AsyncAPI spec updated if a new domain event is added
- [ ] Relevant `docs/` files updated if design decisions changed

## 7. Deployment

- [ ] Feature works locally with `python manage.py runserver` + `npm run dev`
- [ ] No uncommitted changes
- [ ] Committed to the correct branch
- [ ] PR reviewed (self-review minimum; peer review for critical paths)
- [ ] All CI checks green
