# Navigation Map — TaxWijs

> Every screen in the product, who sees it, and how they reach it.

---

## 1. Route Structure

```
/                               Public landing page (→ /login if unauthenticated)
/login                          Login page (all roles)
/register                       Self-registration (firm managers)
/invite/{token}                 Invitation acceptance
/forgot-password                Password reset flow

/app/                           Authenticated shell (role-gated)

  /app/dashboard                Firm manager: all clients overview
                                Accountant: my assigned engagements
                                Client: own engagements

  /app/clients/                 Client list (accountant / firm manager)
  /app/clients/new              Create client
  /app/clients/{id}/            Client detail (profile + engagements)
  /app/clients/{id}/edit        Edit client profile

  /app/engagements/             All engagements for firm (firm manager)
  /app/engagements/{id}/        Engagement workspace (THE main screen)
    → Tabs:
      /app/engagements/{id}/overview     Readiness score + status
      /app/engagements/{id}/checklist    Checklist items + document requests
      /app/engagements/{id}/documents    Uploaded documents + extraction status
      /app/engagements/{id}/review       Document review queue
      /app/engagements/{id}/ai-chat      AI tax assistant chat
      /app/engagements/{id}/calculator   Tax calculator + deduction scanner
      /app/engagements/{id}/ib-guide     IB return form guide
      /app/engagements/{id}/messages     Thread messages
      /app/engagements/{id}/tasks        Action items

  /app/inbox                    Accountant's review queue (cross-engagement)

  /app/admin/                   Admin area (admin role only)
    /app/admin/firms             All firms
    /app/admin/users             All users
    /app/admin/rules             Tax rule management
    /app/admin/audit-log         Audit log viewer
    /app/admin/incidents         Incident tracker
    /app/admin/feature-flags     Feature flag management
    /app/admin/privacy           DSAR management

  /app/settings/
    /app/settings/profile        User profile
    /app/settings/security       Password + MFA
    /app/settings/firm           Firm settings (firm manager)
    /app/settings/billing        Subscription + invoices
    /app/settings/members        Team members + invitations
```

---

## 2. Access Matrix

| Route | admin | firm_manager | accountant | client |
|-------|-------|-------------|-----------|--------|
| `/app/dashboard` | ✓ | ✓ | ✓ | ✓ (limited) |
| `/app/clients/*` | ✓ | ✓ | ✓ (own) | ✗ |
| `/app/engagements/{id}/*` | ✓ | ✓ | ✓ (assigned) | ✓ (own) |
| `/app/engagements/{id}/review` | ✓ | ✓ | ✓ | ✗ |
| `/app/inbox` | ✓ | ✓ | ✓ | ✗ |
| `/app/admin/*` | ✓ | ✗ | ✗ | ✗ |
| `/app/settings/firm` | ✓ | ✓ | ✗ | ✗ |
| `/app/settings/billing` | ✓ | ✓ | ✗ | ✗ |

---

## 3. Language Toggle

Language switcher (NL/EN/FA) appears in the top navigation bar on all `/app/` routes. It:
- Persists to `user.preferred_lang` via `PATCH /api/accounts/profile/`
- Immediately re-renders all static UI strings
- Does NOT affect document content or already-extracted field values
- For Persian: switches entire UI to RTL layout (`dir="rtl"`)

---

## 4. Deep Links

The following URLs can be shared directly:
- `taxwijs.nl/app/engagements/{id}/` — opens the engagement workspace
- `taxwijs.nl/app/engagements/{id}/review/` — opens review queue for that engagement
- `taxwijs.nl/invite/{token}` — direct invitation link (expires 7 days)

All deep links require authentication; unauthenticated users are redirected to `/login` with `?next=` redirect.
