# Security Architecture

> Security controls, encryption, tenant isolation, and compliance posture.
> Aligned to OWASP ASVS 4.0.
> Updated: 2026-06-13

---

## Security Principles

1. **Defense in depth** — Application-level RBAC + DB-level constraints + Network-level isolation
2. **Least privilege** — Each role gets the minimum access required. No wildcard permissions.
3. **Zero trust for API** — Every API request requires valid JWT regardless of origin
4. **Audit everything** — All mutations to client data write to `PortalAuditLog`
5. **Fail secure** — If authorization check fails or throws, deny access
6. **No secrets in code** — All credentials in environment variables, never hardcoded

---

## Authentication

### JWT (Primary)

- Provider: `djangorestframework-simplejwt`
- Access token lifetime: 60 minutes
- Refresh token lifetime: 7 days
- Token storage: `localStorage` (frontend — not HttpOnly due to SPA architecture)
- Token rotation: refresh token rotated on each use (blacklist enabled)
- HTTPS only: tokens never transmitted over HTTP (enforced at reverse proxy)

### Google OAuth2

- Flow: Authorization code redirect (not popup, not implicit)
- Callback URL: `https://taxwijs.nl/auth/google/callback`
- Token exchange: backend validates Google access token, creates/updates local user
- PKCE: not currently implemented (IMPROVEMENT: add PKCE for OAuth2 flow)

### Session Timeout

- Frontend: auto-logout after 1 hour of inactivity (`AuthContext.tsx`)
- Backend: JWT access token expires after 60 minutes independently

---

## Authorization (RBAC)

See [rbac-matrix.md](rbac-matrix.md) for the full matrix.

**Implementation:**
- `User.role` field: `"client"` | `"accountant"` | `"admin"`
- `User.is_staff`: Django staff flag for admin access
- `User.is_superuser`: Full platform access
- Object-level: `_can_access_client()`, `_is_portal_user()` in `apps/portal/views.py`
- All portal views check `accountant_user == request.user` before any data access

---

## Tenant Isolation

TaxWijs is a multi-tenant platform. Isolation is enforced at three levels:

1. **Application level:** Every API view filters by `accountant_user == request.user`. Clients can only access their own engagement. Accountants can only access their own firm's clients.

2. **Database level (target):** PostgreSQL Row Level Security (RLS) policies on `tax_engagements`, `client_documents`, `extracted_income`, `checklist_items`, `portal_messages`. RLS ensures that even a raw database query cannot return cross-tenant data.

3. **File storage level:** Document files stored at `media/portal/documents/{engagement_id}/{uuid}`. Access requires a valid presigned URL or authenticated API response — no direct file URL access.

---

## Encryption

### In Transit
- All external traffic: TLS 1.2+ enforced at Railway / reverse proxy
- All API calls to Anthropic and OpenAI: HTTPS
- All SMTP: TLS (STARTTLS or SMTPS)
- Push notifications: HTTPS to Web Push endpoints

### At Rest
- Production database: PostgreSQL with platform-level encryption (Railway / cloud provider)
- File storage: S3 server-side encryption (SSE-S3 minimum, SSE-KMS target)
- Django SECRET_KEY: stored in environment variable, rotated annually
- VAPID keys: stored in environment variables

### Key Management (target)
- Currently: environment variables in Railway dashboard
- Target: HashiCorp Vault or AWS Secrets Manager (GAP-I01: cloud provider not selected)

---

## Input Validation

- **File upload:** MIME type whitelist (PDF, JPEG, PNG, HEIC, CSV, XLSX), max 20MB enforced at both frontend and backend
- **API input:** DRF serializers validate all request bodies
- **Tax calculations:** All input goes through `CalculateSerializer` with type and range checks
- **Chat:** No direct SQL or code execution from user input (AI-side prompt injection mitigated by structured system prompt)
- **XSS prevention:** React's JSX escapes all user content by default
- **SQL injection:** Django ORM parameterized queries throughout — no raw SQL with user input

---

## GDPR Compliance

### Data Minimization
- Only data required for tax preparation is collected
- `User.tax_memory` stores only tax-relevant profile data (no demographics)
- Conversation messages: retention max 12 months, then purged by Celery Beat

### Consent
- Account creation = acceptance of Terms of Service + Privacy Policy
- Cookie consent: analytics (PostHog) loaded only after acceptance
- Push notification permission: explicit browser permission prompt

### Data Subject Rights
- **Access (DSAR):** `DataSubjectRequest` model + admin workflow — exports all data for a user
- **Deletion:** `DELETE /api/users/me/` anonymizes account: replaces name/email with `deleted_{uuid}`, deletes intake_profile and tax_memory, retains anonymized records for legal/audit purposes
- **Portability:** DSAR export includes all conversations, documents (metadata only, not file bytes), profile data in JSON format

### Data Retention
- User account data: indefinite while active, anonymized 30 days after deletion request
- Chat messages: 12 months, then purged
- Uploaded documents: retained for tax year + 7 years (Dutch legal requirement for financial records)
- Audit logs: 7 years (immutable)
- Push subscriptions: deleted when subscription expires or user unsubscribes

---

## Secrets Management

### Current State (Railway)
All secrets in Railway environment variables:
```
ANTHROPIC_API_KEY
OPENAI_API_KEY
DJANGO_SECRET_KEY
DATABASE_URL
REDIS_URL
VAPID_PRIVATE_KEY
VAPID_PUBLIC_KEY
VAPID_CLAIMS_EMAIL
EMAIL_HOST_USER
EMAIL_HOST_PASSWORD
VITE_GOOGLE_CLIENT_ID
```

### Target State
- Secrets rotated quarterly
- No secrets in git history (`.gitignore` covers `.env`)
- `DJANGO_SECRET_KEY` rotation plan: rotate, invalidate all existing JWT tokens (users re-login)

---

## OWASP ASVS Alignment

| ASVS Category | Target Level | Current Status | Notes |
|--------------|-------------|----------------|-------|
| V1 Architecture | L1 | Partial | Architecture docs being created |
| V2 Authentication | L2 | Implemented | JWT + Google OAuth, session timeout |
| V3 Session Management | L2 | Implemented | JWT rotation, 60min access token |
| V4 Access Control | L2 | Implemented | RBAC + object-level checks |
| V5 Validation | L2 | Implemented | DRF serializers, file validation |
| V6 Cryptography | L2 | Partial | TLS enforced, at-rest encryption via provider |
| V7 Error Handling | L1 | Partial | Sentry configured, needs log redaction |
| V8 Data Protection | L2 | Implemented | GDPR deletion, retention policies |
| V9 Communications | L2 | Implemented | HTTPS everywhere |
| V10 Malicious Code | L1 | Partial | No dependency scanning CI yet |
| V11 Business Logic | L2 | Implemented | AI never computes, verified-only data |
| V12 File Upload | L2 | Implemented | MIME whitelist, 20MB limit |
| V13 API | L2 | Partial | JWT auth, needs rate limiting improvement |
| V14 Configuration | L1 | Partial | Secrets in env, DEBUG=False in prod |

---

## Rate Limiting

| Endpoint | Limit | Current Implementation |
|----------|-------|----------------------|
| `POST /api/chat/` | 60 req/hour/user | Partial — session limit was disabled for UX |
| `POST /api/users/register/` | 5 req/hour/IP | Not implemented (IMPROVEMENT needed) |
| `POST /api/users/login/` | 10 req/minute/IP | Not implemented (IMPROVEMENT needed) |
| `POST /api/portal/*/upload/` | 20 req/hour/user | Not implemented (IMPROVEMENT needed) |

**Target:** Implement DRF throttle classes for login and registration endpoints before public launch.

---

## Security Incident Response

1. **Detection:** Sentry alerts on unhandled exceptions and performance anomalies
2. **Triage:** Admin receives Sentry notification → assess severity
3. **Containment:** Invalidate compromised JWT via Django SimpleJWT blacklist, rotate secrets
4. **Communication:** Notify affected users within 72 hours if personal data breach (GDPR Art. 33)
5. **Post-mortem:** Document in `docs/08-ops/operational-runbooks.md`
