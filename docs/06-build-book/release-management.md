# Release Management — TaxWijs

> Branching strategy, release cadence, versioning, and hotfix process.

---

## 1. Branching Strategy

```
main ─────────────────────────────────────────────► (production)
  │
  ├── feature/phase3-calculator ──────────► PR → main
  ├── feature/ux-engagement-workspace ────► PR → main
  ├── fix/readiness-score-doc-weight ─────► PR → main
  └── hotfix/btw-rate-correction ─────────► PR → main (emergency)
```

Rules:
- `main` is always deployable
- All work happens in `feature/*` or `fix/*` branches
- PRs require passing CI + self-review (peer review for risk-rated PRs)
- No direct commits to `main`
- Hotfixes branch from `main`, merge back to `main`, and are tagged

---

## 2. Versioning

Semantic versioning: `MAJOR.MINOR.PATCH`

| Increment | When |
|-----------|------|
| MAJOR | Breaking API change or complete UI overhaul |
| MINOR | New feature shipped (new phase complete, new endpoint) |
| PATCH | Bug fix, copy change, dependency update |

Tax data updates (new year's rules) are `MINOR` versions.

Version is set in:
- `backend/config/settings.py` → `APP_VERSION`
- `ui/new-ui/package.json` → `version`
- Git tag: `v1.2.3`

---

## 3. Release Cadence

| Type | Frequency | Trigger |
|------|-----------|---------|
| Feature release | Monthly (or per-phase) | Phase complete + QA pass |
| Patch release | As needed | Bug fix merged to main |
| Tax data release | Annually (December) | Prinsjesdag → verified → December deploy |
| Hotfix | Emergency only | P0/P1 incident |

---

## 4. Release Process

1. **Create release PR**: `feature/phase{N}-*` → `main`
2. **CI must be green**: all quality gates pass (see `definition-of-done.md`)
3. **Merge PR** (squash merge for features; merge commit for phases)
4. **Tag the release**: `git tag v1.2.0 && git push origin v1.2.0`
5. **CI/CD triggers deployment** (see `.github/workflows/deploy-production.yml`)
6. **Update PROGRESS.md** with phase completion entry
7. **Monitor**: watch Sentry for new errors in the 30 minutes after deploy

---

## 5. Hotfix Process

For P0/P1 incidents requiring immediate fix:

```bash
git checkout main
git checkout -b hotfix/btw-rate-2026
# make the fix
git commit -m "fix: correct BTW accommodation rate 9%→21%"
git push origin hotfix/btw-rate-2026
# open PR → main
# merge → tag → deploy
```

Hotfixes bypass the feature freeze. Tax rate corrections are always hotfix-eligible.

---

## 6. Annual Tax Data Release (Phase 9 — September)

Each September after Prinsjesdag (Budget Day):

| Week | Action |
|------|--------|
| Week 1 | Tax SME reads new tax proposals; identifies changes |
| Week 2 | Update `tax_rules_{year+1}.json` with new values |
| Week 3 | Run `validate.py`; update scenario expected values |
| Week 4 | Peer review by second Tax SME |
| Week 5 | Deploy to staging; run full test suite |
| Week 6–12 | Monitor for law changes before December 31 |
| December | Tag `v{N+1}.0.0` and deploy to production |

New year's data must NEVER be deployed before January 1 of that year.
