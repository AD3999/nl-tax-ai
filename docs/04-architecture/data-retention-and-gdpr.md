# Data Retention and GDPR — TaxWijs

> Lawful basis, retention periods, subject rights implementation, encryption requirements, and deletion procedures.

---

## 1. Lawful Basis

| Data Category | Lawful Basis (GDPR Art.) | Notes |
|--------------|--------------------------|-------|
| Client tax documents | Article 6(1)(b) — contract performance | Needed to deliver the tax service |
| BSN (Burgerservicenummer) | Article 9 / AVG Art. 87 — national ID | Encrypted at rest; access-logged |
| Audit logs | Article 6(1)(c) — legal obligation | Belastingdienst requires 7-year retention |
| AI conversation history | Article 6(1)(b) — contract performance | User can delete via DSAR |
| Marketing emails | Article 6(1)(a) — explicit consent | Opt-in only; unsubscribe immediately effective |
| Usage analytics | Article 6(1)(f) — legitimate interest | Anonymized; no individual tracking without consent |

---

## 2. Retention Periods

| Data Type | Retention Period | Deletion Method | Trigger |
|-----------|-----------------|----------------|---------|
| Tax documents (original) | 7 years from filing date | Secure delete + audit log | Belastingdienst requirement |
| Extracted fields | 7 years from filing date | Cascade delete with document | Dutch accounting law |
| Audit logs | 5 years | Archive to cold storage; delete after 5y | Compliance |
| AI chat history | 2 years | Hard delete from DB | Privacy |
| RAG embeddings (public rules) | Indefinite — not personal data | N/A | N/A |
| User sessions | 30 days after last activity | Auto-expire | Security |
| Invitations (unused) | 7 days | Auto-delete via scheduled task | Hygiene |
| Usage records | 3 years | Anonymize after 1 year | Billing disputes |
| Deleted account data | 90 days in soft-delete state | Hard delete after 90 days | GDPR Art. 17 |

---

## 3. Data Subject Rights Implementation

### 3.1 Right of Access (Article 15) — Data Export

```
POST /api/privacy/dsar/
{
  "request_type": "access",
  "subject_email": "client@example.com"
}
```

Response: JSON export containing all personal data held, including:
- Client profile, tax profiles, engagements
- All uploaded documents (links, not binaries — download separately)
- All AI conversation history
- All extracted fields
- Audit log entries referencing the subject

Delivery: encrypted ZIP file via secure download link (expires 72h). SLA: 30 days per GDPR Article 12(3).

### 3.2 Right to Erasure (Article 17) — Deletion Request

```
POST /api/privacy/dsar/
{
  "request_type": "erasure",
  "subject_email": "client@example.com",
  "reason": "contract_ended"
}
```

Soft-delete immediately (sets `deleted_at` on user + client). Hard delete after 90 days. Exception: documents with a 7-year legal retention obligation are anonymized (name replaced with `ANONYMIZED`) rather than deleted.

### 3.3 Right to Rectification (Article 16)

Clients can update their own profile via `PATCH /api/portal/profile/`. Firms can update client data. All changes are audit-logged.

### 3.4 Right to Portability (Article 20)

Same endpoint as access (`request_type: "portability"`). Response format is machine-readable JSON + CSV for tabular data.

---

## 4. Encryption Requirements

### 4.1 At Rest

| Data | Encryption | Key Management |
|------|-----------|---------------|
| BSN (Burgerservicenummer) | AES-256-GCM, stored in `bsn_enc` | App-level key in `.env`; rotate annually |
| Document binary files | AES-256 at storage layer | Cloud provider managed keys (AWS KMS / GCP KMS) |
| Database volume | AES-256 at disk level | Cloud provider managed |
| Extracted PII fields | Stored in `extracted_fields.normalized_value` — see note | App-level encryption for BSN only |

> Note: Non-BSN fields (salary, dates) are stored unencrypted in the database but access-controlled via row-level security. BSN is the only field encrypted at application level.

### 4.2 In Transit

- All API traffic: TLS 1.3 minimum (TLS 1.2 allowed until 2027)
- Internal service-to-service: mTLS in production Kubernetes cluster
- Document upload URLs: pre-signed S3 URLs (HTTPS only, expire in 15 minutes)
- Webhook payloads: HMAC-SHA256 signature on all outbound webhooks

---

## 5. Data Minimization

Principles enforced in code:

1. **No BSN logging** — BSN is never written to application logs or audit logs in plaintext
2. **No document content in logs** — OCR text is never logged, only metadata
3. **AI prompts** — client name is substituted with "the client" in Claude prompts; BSN is never sent to Claude
4. **Analytics events** — all analytics events strip name/email before sending to third-party tools

---

## 6. Third-Party Data Processors

| Processor | Purpose | Data Shared | DPA Status |
|-----------|---------|------------|-----------|
| Anthropic (Claude) | AI responses | Question text (no PII, no BSN) | See Anthropic DPA |
| AWS Textract | OCR processing | Document images (may contain PII) | AWS DPA / SCCs |
| Supabase | Production database | All data | Supabase DPA / SCCs |
| SendGrid | Email delivery | Email address, name | SendGrid DPA / SCCs |

---

## 7. Breach Response

In the event of a suspected data breach:
1. Security team notified within 1 hour
2. Affected accounts locked within 2 hours
3. Autoriteit Persoonsgegevens (AP) notified within 72 hours if required (Art. 33)
4. Affected data subjects notified without undue delay if high risk (Art. 34)
5. Incident recorded in `incidents` table with timeline and remediation steps
