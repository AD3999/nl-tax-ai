# Screen Inventory

> Complete list of all screens in TaxWijs v1.0.
> Updated: 2026-06-13

---

## Public / Marketing Zone

| Screen ID | Screen Name | URL | Priority | Status |
|-----------|-------------|-----|----------|--------|
| PUB-01 | Landing page | `/` | P0 | Built |
| PUB-02 | Features page | `/features` | P1 | Not built |
| PUB-03 | Pricing page | `/pricing` | P2 | Not built |
| PUB-04 | Marketplace directory | `/marketplace` | P1 | Not built |
| PUB-05 | Accountant listing detail | `/marketplace/{id}` | P1 | Not built |

---

## Authentication Zone

| Screen ID | Screen Name | URL | Priority | Status |
|-----------|-------------|-----|----------|--------|
| AUTH-01 | Login | `/auth/login` | P0 | Built |
| AUTH-02 | Register | `/auth/register` | P0 | Built |
| AUTH-03 | Google OAuth callback | `/auth/google/callback` | P0 | Built |
| AUTH-04 | Forgot password | `/auth/forgot-password` | P1 | Built |
| AUTH-05 | Reset password | `/auth/reset-password/{token}` | P1 | Built |
| AUTH-06 | Accept invitation | `/auth/register?token={token}` | P0 | Partial |

---

## Client Portal Zone

| Screen ID | Screen Name | URL | Priority | Status |
|-----------|-------------|-----|----------|--------|
| CP-01 | Dashboard | `/portal` | P0 | Built (partial) |
| CP-02 | Task list | `/portal/tasks` | P0 | Not built |
| CP-03 | Documents | `/portal/documents` | P0 | Built (partial) |
| CP-04 | Messages | `/portal/messages` | P0 | Built (partial) |
| CP-05 | AI Chat | `/portal/chat` | P0 | Built |
| CP-06 | AI Chat — IB Guide mode | `/portal/chat?mode=ib_guide` | P1 | Built (partial) |
| CP-07 | AI Chat — Simulation mode | `/portal/chat?mode=simulation` | P1 | Not built |
| CP-08 | Tax Calendar | `/portal/calendar` | P1 | Not built |
| CP-09 | Deduction Checker (step 1) | `/portal/deduction-checker` | P0 | Built (partial) |
| CP-10 | Deduction Checker (steps 2–9) | `/portal/deduction-checker?step=N` | P0 | Built (partial) |
| CP-11 | Deduction Checker — Results | `/portal/deduction-checker/results` | P0 | Built (partial) |
| CP-12 | Settings | `/portal/settings` | P1 | Built (partial) |
| CP-13 | ZZP Workspace | `/portal/zzp` | P1 | Built (partial) |
| CP-14 | ZZP Workspace — VAT quarter | `/portal/zzp/vat/{quarter}` | P1 | Not built |
| CP-15 | ZZP Workspace — P&L | `/portal/zzp/pl` | P1 | Not built |

---

## Accountant Portal Zone

| Screen ID | Screen Name | URL | Priority | Status |
|-----------|-------------|-----|----------|--------|
| AP-01 | Accountant Dashboard | `/accountant` | P0 | Not built |
| AP-02 | Client list | `/accountant/clients` | P0 | Not built |
| AP-03 | Invite client | `/accountant/invite` | P0 | Not built |
| AP-04 | AI Actions center | `/accountant/actions` | P0 | Not built |
| AP-05 | Engagement — Overview tab | `/accountant/engagements/{id}?tab=overview` | P0 | Not built |
| AP-06 | Engagement — Checklist tab | `/accountant/engagements/{id}?tab=checklist` | P0 | Not built |
| AP-07 | Engagement — Documents tab | `/accountant/engagements/{id}?tab=documents` | P0 | Not built |
| AP-08 | Engagement — Income tab | `/accountant/engagements/{id}?tab=income` | P1 | Not built |
| AP-09 | Engagement — Expenses tab | `/accountant/engagements/{id}?tab=expenses` | P1 | Not built |
| AP-10 | Engagement — Risks tab | `/accountant/engagements/{id}?tab=risks` | P1 | Not built |
| AP-11 | Engagement — Audit tab | `/accountant/engagements/{id}?tab=audit` | P1 | Not built |
| AP-12 | Firm management | `/accountant/firm` | P1 | Not built |
| AP-13 | Rule browser (read-only) | `/accountant/rules` | P2 | Not built |
| AP-14 | Accountant Settings | `/accountant/settings` | P1 | Not built |
| AP-15 | Marketplace listing editor | `/accountant/listing` | P2 | Not built |

---

## Admin Console Zone

| Screen ID | Screen Name | URL | Priority | Status |
|-----------|-------------|-----|----------|--------|
| ADM-01 | Platform dashboard | `/admin-console` | P0 | Not built |
| ADM-02 | User list | `/admin-console/users` | P0 | Not built |
| ADM-03 | User detail | `/admin-console/users/{id}` | P0 | Not built |
| ADM-04 | Firm list | `/admin-console/firms` | P1 | Not built |
| ADM-05 | Firm detail | `/admin-console/firms/{id}` | P1 | Not built |
| ADM-06 | Rule browser (all statuses) | `/admin-console/rules` | P0 | Not built |
| ADM-07 | Rule editor | `/admin-console/rules/{id}` | P0 | Not built |
| ADM-08 | Rule version history | `/admin-console/rules/{id}/history` | P1 | Not built |
| ADM-09 | Feature flags | `/admin-console/flags` | P0 | Not built |
| ADM-10 | DSAR requests | `/admin-console/dsar` | P0 | Not built |
| ADM-11 | Audit log browser | `/admin-console/audit` | P1 | Not built |
| ADM-12 | System health | `/admin-console/health` | P0 | Not built |

---

## Priority Legend

| Priority | Meaning |
|----------|---------|
| P0 | Launch blocker — must exist for MVP |
| P1 | Required before public launch, not launch blocker |
| P2 | Post-launch, tracked for v1.1 |

---

## Status Legend

| Status | Meaning |
|--------|---------|
| Built | Screen exists and is functionally complete |
| Built (partial) | Screen exists but is missing features from this spec |
| Not built | Screen does not yet exist |

---

## Screen Count Summary

| Zone | Total | Built | Partial | Not built |
|------|-------|-------|---------|-----------|
| Public | 5 | 1 | 0 | 4 |
| Auth | 6 | 5 | 1 | 0 |
| Client Portal | 15 | 3 | 6 | 6 |
| Accountant Portal | 15 | 0 | 0 | 15 |
| Admin Console | 12 | 0 | 0 | 12 |
| **Total** | **53** | **9** | **7** | **37** |

---

## P0 Gap List (launch blockers not yet built)

The following P0 screens are missing and must be built before MVP:

1. CP-02: Client task list — `/portal/tasks`
2. AP-01 to AP-11: Full accountant portal (all engagement workspace tabs)
3. AP-03: Invite client flow
4. AP-04: AI Actions center
5. ADM-01: Platform dashboard
6. ADM-02/03: User management
7. ADM-06/07: Rule management UI
8. ADM-09: Feature flags
9. ADM-10: DSAR workflow
10. ADM-12: System health

These correspond to the F-1 to F-7 build tasks in the execution plan.
