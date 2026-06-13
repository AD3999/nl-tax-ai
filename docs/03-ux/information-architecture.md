# Information Architecture

> TaxWijs — Navigation structure, screen inventory, and URL map.
> Updated: 2026-06-13

---

## Navigation Zones

TaxWijs has four distinct navigation zones served from the same domain:

| Zone | Root URL | Audience | Auth Required |
|------|----------|----------|---------------|
| Public / Marketing | `/` | Anyone | No |
| Client Portal | `/portal/*` | Clients (taxpayers) | Yes (client role) |
| Accountant Portal | `/accountant/*` | Accountants + firm managers | Yes (accountant role) |
| Admin Console | `/admin-console/*` | Platform admins | Yes (admin role) |

Plus:
- `/marketplace` — public-facing, optional auth for contact action
- `/auth/*` — authentication flows, no zone-specific auth

---

## Site Map

```
/ (landing page)
├── /features
├── /pricing
├── /marketplace (public accountant directory)
│   └── /marketplace/{listing_id}
├── /auth
│   ├── /auth/login
│   ├── /auth/register
│   ├── /auth/google/callback
│   ├── /auth/forgot-password
│   └── /auth/reset-password/{token}
│
├── /portal (client zone — requires login as client)
│   ├── /portal (dashboard)
│   ├── /portal/tasks
│   ├── /portal/documents
│   ├── /portal/messages
│   ├── /portal/chat
│   │   └── /portal/chat?mode=ib_guide
│   │   └── /portal/chat?mode=simulation
│   ├── /portal/calendar
│   ├── /portal/deduction-checker (9-step wizard)
│   └── /portal/settings
│
├── /accountant (accountant zone — requires login as accountant)
│   ├── /accountant (dashboard)
│   ├── /accountant/clients
│   ├── /accountant/engagements/{id}
│   │   ├── ?tab=overview (default)
│   │   ├── ?tab=checklist
│   │   ├── ?tab=documents
│   │   ├── ?tab=income
│   │   ├── ?tab=expenses
│   │   ├── ?tab=risks
│   │   └── ?tab=audit
│   ├── /accountant/actions (AI actions center)
│   ├── /accountant/invite
│   ├── /accountant/firm (firm_manager role only)
│   ├── /accountant/rules (read-only rule browser)
│   └── /accountant/settings
│
└── /admin-console (admin zone — requires login as admin)
    ├── /admin-console (platform dashboard)
    ├── /admin-console/users
    │   └── /admin-console/users/{id}
    ├── /admin-console/firms
    │   └── /admin-console/firms/{id}
    ├── /admin-console/rules
    │   └── /admin-console/rules/{id}
    ├── /admin-console/flags
    ├── /admin-console/dsar
    ├── /admin-console/audit
    └── /admin-console/health
```

---

## Navigation Structure

### Client Portal — Bottom Tab Bar (mobile) / Left Sidebar (desktop)

| Order | Label (EN) | Label (NL) | Label (FA) | Icon | Badge |
|-------|-----------|-----------|-----------|------|-------|
| 1 | Dashboard | Dashboard | داشبورد | Home | — |
| 2 | Tasks | Taken | وظایف | Checkbox | Open required count |
| 3 | Documents | Documenten | اسناد | File | — |
| 4 | Messages | Berichten | پیام‌ها | Chat bubble | Unread count |
| 5 | AI Chat | AI Chat | چت هوش مصنوعی | Sparkle | — |
| 6 | Calendar | Kalender | تقویم | Calendar | Deadlines <14 days |
| 7 | Settings | Instellingen | تنظیمات | Gear | — |

### Accountant Portal — Left Sidebar

| Order | Label (EN) | Icon | Badge |
|-------|-----------|------|-------|
| 1 | Dashboard | Dashboard | — |
| 2 | Clients | Users | — |
| 3 | AI Actions | Lightning bolt | Open actions count |
| 4 | Invite Client | Plus | — |
| 5 | Firm (manager only) | Building | — |
| 6 | Rules | Book | — |
| 7 | Settings | Gear | — |

### Engagement Workspace — Tab Bar

| Tab | Label | When Visible |
|-----|-------|-------------|
| 1 | Overview | Always |
| 2 | Checklist | Always |
| 3 | Documents | Always |
| 4 | Income | After first document approved |
| 5 | Expenses | After first document approved |
| 6 | Risks & Deductions | After readiness > 25 |
| 7 | Audit | Always (accountant only) |

---

## URL Design Conventions

- All URLs lowercase, hyphens (not underscores)
- UUIDs for resource IDs: `/portal/engagements/a3f2...`
- Query params for tab state, language override, mode
- No trailing slashes in frontend routes (backend API has trailing slashes per Django convention)
- Language NOT in URL path — uses `Accept-Language` header and user profile preference

---

## Redirect Rules

| From | To | Condition |
|------|----|-----------|
| `/` | `/portal` | Authenticated client |
| `/` | `/accountant` | Authenticated accountant |
| `/` | `/admin-console` | Authenticated admin |
| `/accountant/engagements` | `/accountant/clients` | No ID provided |
| `/portal` | `/auth/login?next=/portal` | Unauthenticated |
| `/auth/login` | `/portal` | Already authenticated (client) |
| `/auth/login` | `/accountant` | Already authenticated (accountant) |
| `/portal/deduction-checker` | `/auth/login?next=...` | Unauthenticated — prompt login to save results |

---

## Deep Link Support

Push notifications and emails contain deep links:

| Notification Type | Deep Link |
|------------------|-----------|
| Document rejected | `/portal/documents?highlight={doc_id}` |
| New message | `/portal/messages?engagement={id}` |
| Readiness milestone | `/portal` (dashboard shows updated ring) |
| Engagement ready to file | `/accountant/engagements/{id}?tab=overview` |
| Invitation | `/auth/register?token={invitation_token}` |
| DSAR export ready | `/portal/settings#privacy` |

---

## Breadcrumb Pattern

Desktop views show breadcrumbs for deep navigation:

```
Accountant Portal > Clients > [Client Name] > Engagement 2026 > Documents
```

```
Admin Console > Rules > ZA-2026-001 > Version History
```

Mobile views omit breadcrumbs — back button navigation only.
