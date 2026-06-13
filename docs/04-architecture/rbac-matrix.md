# RBAC Matrix

> Role × Action × Resource × Scope × Condition × Audit Requirement
> Updated: 2026-06-13

---

## Roles

| Role | Description | Who has it |
|------|-------------|-----------|
| `anonymous` | Not logged in | Unauthenticated visitors |
| `client` | Taxpayer using the platform | All registered users (default) |
| `accountant` | Tax professional managing client files | Users who register as accountant |
| `firm_manager` | Senior accountant / managing partner | Accountants with firm_manager designation |
| `admin` | TaxWijs staff with elevated access | `is_staff=True` users |
| `super_admin` | Full platform access | `is_superuser=True` users |

---

## Resource Definitions

| Resource | Description |
|----------|-------------|
| `public_content` | Tax guides, landing pages, deduction checker (unauthenticated) |
| `own_profile` | User's own account, intake profile, tax memory |
| `own_engagement` | Client's own portal engagement |
| `own_documents` | Client's own uploaded documents |
| `own_messages` | Client's own messages with accountant |
| `client_profile` | AccountantClientProfile — requires accountant ownership |
| `any_engagement` | Any engagement (admin only) |
| `firm_clients` | All clients belonging to accountant's firm |
| `tax_rules` | Tax rule records (read) |
| `rule_management` | Tax rule CRUD and approval workflow |
| `user_accounts` | All user accounts (admin) |
| `system_config` | Feature flags, platform settings |
| `billing` | Subscription and invoice records |
| `audit_log` | Audit trail (read-only) |
| `gdpr_ops` | GDPR deletion, DSAR fulfillment |

---

## Permission Matrix

### Anonymous

| Action | Resource | Allowed | Condition | Audit |
|--------|----------|---------|-----------|-------|
| READ | public_content | YES | None | No |
| USE | deduction_checker | YES | No auth required | PostHog event |
| USE | chat (limited) | YES | Session rate limit applies | PostHog event |
| USE | calculator | YES | No auth required | No |
| WRITE | email_capture | YES | Email + source only | No |
| ALL | own_profile | NO | Must register | — |

### Client

| Action | Resource | Allowed | Condition | Audit |
|--------|----------|---------|-----------|-------|
| READ/WRITE | own_profile | YES | Own user only | No |
| READ | own_engagement | YES | engagement.client_user == request.user | No |
| READ | own_documents | YES | document.engagement.client == request.user | No |
| WRITE | own_documents (upload) | YES | Engagement must exist | Yes |
| DELETE | own_documents | YES | Own documents, not yet approved | Yes |
| READ | own_messages | YES | Message thread linked to own engagement | No |
| WRITE | own_messages | YES | Own engagement only | Yes |
| WRITE | checklist_item (status only) | YES | PATCH status only, own engagement | Yes |
| READ | tax_rules | YES | Verified rules only | No |
| USE | chat | YES | Rate limits apply | PostHog |
| USE | calculator | YES | No restriction | No |
| USE | ib_guide | YES | No restriction | No |
| DELETE | own_profile (GDPR) | YES | Anonymize own account | Yes |
| READ | client_profile | NO | Cannot see accountant's view of themselves | — |
| WRITE | rule_management | NO | — | — |
| READ | firm_clients | NO | — | — |
| READ | any_engagement | NO | — | — |
| READ | user_accounts | NO | — | — |

### Accountant

| Action | Resource | Allowed | Condition | Audit |
|--------|----------|---------|-----------|-------|
| ALL | own_profile | YES | Own profile | No |
| READ/WRITE | client_profile | YES | profile.accountant_user == request.user | Yes |
| CREATE | client_profile | YES | Accountant creating for their own client | Yes |
| READ/WRITE | any_engagement | PARTIAL | engagement.accountant == request.user or is_staff | Yes |
| CREATE | engagement | YES | For own clients only | Yes |
| READ | firm_clients | YES | clients under accountant_user == request.user | No |
| READ/WRITE | documents (client's) | YES | document within own client's engagement | Yes |
| WRITE | extraction review | YES | Documents within own engagements | Yes |
| READ/WRITE | checklist_items | YES | Items within own engagements | Yes |
| READ/WRITE | own_messages | YES | Threads within own engagements | Yes |
| WRITE | invitations | YES | Send invitations to email addresses | Yes |
| READ | tax_rules | YES | Verified rules only | No |
| READ | audit_log | YES | audit_log entries for own engagements | No |
| WRITE | rule_management | NO | — | — |
| READ | user_accounts | NO | — | — |
| WRITE | gdpr_ops | NO | Only admin | — |

### Firm Manager

*All accountant permissions, plus:*

| Action | Resource | Allowed | Condition | Audit |
|--------|----------|---------|-----------|-------|
| READ | firm_clients | YES | All clients across the firm | No |
| READ | any_engagement | YES | All engagements in the firm | No |
| WRITE | client reassignment | YES | Reassign clients between firm accountants | Yes |
| READ | firm_audit_log | YES | Audit log for all firm engagements | No |

### Admin (is_staff)

*All previous permissions, plus:*

| Action | Resource | Allowed | Condition | Audit |
|--------|----------|---------|-----------|-------|
| READ | user_accounts | YES | All users | No |
| WRITE | user_accounts | YES | Activate/deactivate, set is_verified | Yes |
| READ/WRITE | rule_management | YES | Approve/reject pending rules | Yes |
| READ | any_engagement | YES | Any engagement in platform | No |
| WRITE | gdpr_ops | YES | Fulfill DSAR, anonymize accounts | Yes |
| READ | billing | YES | All subscription/invoice records | No |
| WRITE | system_config | YES | Feature flags | Yes |
| READ | audit_log | YES | All audit log entries | No |

### Super Admin (is_superuser)

All permissions. No restrictions.

---

## Implementation Notes

1. **Object-level permissions:** Enforced via `_can_access_client()`, `_is_portal_user()` helpers in `apps/portal/views.py`. These check `accountant_user == request.user` before any query.

2. **Role check:** `request.user.role in ("accountant", "admin")` for portal access. `request.user.is_staff` for admin operations.

3. **Audit requirement:** Any mutation to client data, document status, extraction review, or checklist items must write to `PortalAuditLog` with `user`, `action`, `resource_type`, `resource_id`, `old_value`, `new_value`, `timestamp`.

4. **Future RLS:** When migrating to PostgreSQL production, Row Level Security policies should enforce tenant isolation at the database level as a defense-in-depth measure alongside application-level checks.
