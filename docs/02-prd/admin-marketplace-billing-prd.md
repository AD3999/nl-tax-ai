# Admin, Marketplace & Billing PRD

> Module: Admin Console + Marketplace + Billing | Version: 1.0 | Updated: 2026-06-13

---

## Overview

This PRD covers three interconnected modules:

1. **Admin Console** — Platform-operator tools for managing users, firms, rules, and system health
2. **Marketplace** — Public directory of accountants/firms that clients can discover and invite
3. **Billing** — Subscription and usage tracking (no active paywalls in v1.0, structure only)

---

## Part 1: Admin Console

### Access

URL: `/admin-console/` (separate from Django's built-in `/admin/`)

Roles with access: `admin`, `super_admin`

### Screens

#### 1.1 Dashboard

KPI overview of the entire platform:
- Total users (by role: client / accountant / admin)
- Total engagements (by status)
- Total documents processed today
- AI requests (Claude API calls in last 24h)
- Error rate (from Sentry)
- Feature flag status summary

#### 1.2 User Management

- Search users by name, email, role
- View user profile: registration date, last login, engagement count, language preference
- Actions: disable account, reset password, change role, trigger GDPR deletion
- Bulk actions: export user list, send announcement email

#### 1.3 Firm Management

- List all registered firms
- Per firm: name, accountant count, client count, engagement count, subscription tier
- Actions: approve new firm, suspend firm, reassign clients to new firm

#### 1.4 Rule Management

See `rule-engine-prd.md` for full spec. Admin console provides:
- Rule browser (all rules including draft/pending_review)
- Approve rule changes (super_admin)
- Run test cases
- Shadow mode toggle
- Annual maintenance workflow

#### 1.5 Feature Flags

Feature flags control rollout of new features. Stored in `FeatureFlag` model.

| Flag key | Type | Description |
|----------|------|-------------|
| `marketplace_enabled` | boolean | Enable public marketplace directory |
| `billing_enabled` | boolean | Enable subscription paywalls |
| `rule_management_ui` | boolean | Enable accountant rule view |
| `push_notifications_enabled` | boolean | Enable VAPID push |
| `ib_return_guide` | boolean | Enable IB return guide in chat |
| `deduction_scanner_employee` | boolean | Open scanner to employees (currently waitlist) |

Admin UI:
- Toggle any flag on/off
- Rollout percentage: show feature to X% of users (canary)
- Target user groups: enable only for specific roles or firms

#### 1.6 System Health

- API response time graphs (last 24h)
- Celery queue depth
- Database connection count
- Document processing queue
- AI (Claude) API success/error rate
- Sentry recent errors

#### 1.7 DSAR Workflow

When a user submits a data access request:
1. `DataSubjectRequest` record created
2. Admin receives notification
3. Admin console shows open DSAR requests
4. Admin generates export package (JSON of all user data)
5. Export link sent to user by email
6. Admin marks request as fulfilled

**SLA:** DSAR fulfilled within 30 days (GDPR Art. 15)

#### 1.8 Audit Log Browser

Global view of all `PortalAuditLog` entries across all users and engagements.

Filters: by user, by engagement, by action type, by date range.

Export: CSV (for compliance purposes).

---

## Part 2: Marketplace

### Overview

The Marketplace is a public-facing directory at `/marketplace` where taxpayers can discover and invite accountants who use TaxWijs. It is opt-in for accountants — they must explicitly create a listing.

### Accountant Listing

`AccountantListing` model:

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| accountant | FK(User, role=accountant) | One listing per accountant |
| display_name | string | Name shown to clients |
| bio_nl | text | Dutch bio |
| bio_en | text | English bio |
| bio_fa | text | Persian bio (if offered) |
| specializations | JSONField | `["zzp", "expat", "dga"]` |
| languages | JSONField | `["nl", "en", "fa"]` |
| hourly_rate_display | string | Nullable, e.g., "€75–€95" |
| accepts_new_clients | boolean | |
| calendly_url | URL | Nullable — for direct booking |
| verified_accountant | boolean | Admin-verified credentials |
| rating | float | 0–5, from client reviews |
| review_count | int | |
| is_active | boolean | Can be deactivated by admin |
| created_at | datetime | |

### Listing Discovery

Public URL: `/marketplace?specialization=zzp&language=fa`

Filters:
- Specialization (zzp / employee / expat / dga)
- Language (nl / en / fa)
- Accepts new clients (boolean)
- Location (future — currently Netherlands-wide only)

Sort:
- By rating (default)
- By review count
- By recently active

### Client → Accountant Connection

1. Client browses marketplace, clicks "Contact" on listing
2. Client is prompted to log in or register
3. After login: "Send invitation to [Accountant Name]"
4. Accountant receives invitation notification
5. Accountant accepts → engagement created, client linked to firm

This is the reverse of the accountant-inviting-client flow — same `Invitation` model, different direction.

### Reviews

After an engagement reaches `Filed` status, client is prompted to leave a review.

`AccountantReview` model:
| Field | Type |
|-------|------|
| accountant_listing | FK(AccountantListing) |
| engagement | FK(TaxEngagement) |
| rating | int (1–5) |
| text | text |
| submitted_at | datetime |
| is_anonymous | boolean |
| approved_by_admin | boolean |

Reviews are moderated by admin before appearing publicly.

### Accountant Verification

`verified_accountant=True` badge requires:
1. Upload of AA (accountancy) or tax advisor credential
2. Admin manually sets `verified_accountant=True` after checking

This is a manual process in v1.0. No automated credential check.

---

## Part 3: Billing

### v1.0 Position: No Active Paywalls

All features are free in v1.0. The billing system provides structure for future monetization.

### Subscription Model (future)

Three tiers planned for v2.0:

| Tier | Price | Limits | Features |
|------|-------|--------|----------|
| Free | €0 | 1 accountant, 5 clients, 10 docs/month | All core features |
| Professional | €49/month per accountant | 50 clients, 100 docs/month | + Marketplace listing, priority support |
| Firm | €199/month per firm | Unlimited clients/docs | + Firm dashboard, custom branding, API access |

### Models (structure for future use)

**Subscription:**
| Field | Type |
|-------|------|
| id | UUID |
| firm | FK(Firm) |
| plan | enum (free / professional / firm) |
| status | enum (active / cancelled / past_due) |
| current_period_start | date |
| current_period_end | date |
| stripe_subscription_id | string |
| created_at | datetime |

**Invoice:**
| Field | Type |
|-------|------|
| id | UUID |
| subscription | FK(Subscription) |
| amount_eur | decimal |
| status | enum (draft / open / paid / void) |
| due_date | date |
| paid_at | datetime |
| stripe_invoice_id | string |

**UsageRecord:**
| Field | Type |
|-------|------|
| id | UUID |
| firm | FK(Firm) |
| month | date (first day of month) |
| client_count | int |
| document_count | int |
| ai_request_count | int |
| recorded_at | datetime |

### Billing Admin

Admin can:
- View all subscriptions and their status
- Manually upgrade/downgrade a firm's tier
- View usage records per firm
- Generate an invoice manually (for invoicing outside Stripe)

---

## Feature Flag Integration

All three modules are gated by feature flags:

| Feature | Flag | Default in v1.0 |
|---------|------|----------------|
| Marketplace | `marketplace_enabled` | False (built, not launched) |
| Billing paywalls | `billing_enabled` | False |
| Accountant verification badge | `accountant_verification` | False |
| Client reviews | `marketplace_reviews` | False |
| Admin console | Always on | True |

---

## NFR

| Requirement | Target |
|-------------|--------|
| Marketplace page load | < 1 second (cached listing data) |
| Marketplace search | < 200ms (database-level) |
| DSAR fulfillment | < 30 days (GDPR legal requirement) |
| Admin actions | Audit logged (PortalAuditLog) |
| Billing accuracy | UsageRecord updated daily by Celery Beat |
| Review moderation | All reviews manually approved before showing |
