# Event Catalog

> All system events with producer, consumers, payload schema, idempotency, and retry policy.
> Updated: 2026-06-13

---

## Event Naming Convention

`RESOURCE_ACTION_PAST_TENSE` — e.g. `DOCUMENT_UPLOADED`, `ENGAGEMENT_READINESS_UPDATED`

---

## Engagement Events

| Event | Producer | Consumers | Idempotency Key | Ordering | PII |
|-------|----------|-----------|-----------------|----------|-----|
| `ENGAGEMENT_CREATED` | API — CreateEngagementView | Checklist service, Readiness service | engagement_id | Required | No |
| `ENGAGEMENT_STATUS_CHANGED` | API — UpdateEngagementView | Notification service, Audit log | engagement_id + status + timestamp | Required | No |
| `ENGAGEMENT_READINESS_UPDATED` | Readiness service | Frontend (via polling), Audit log | engagement_id + score + timestamp | Not required | No |
| `ENGAGEMENT_READY_TO_FILE` | Readiness service | Notification service (push to client + accountant) | engagement_id | Required | No |
| `ENGAGEMENT_ARCHIVED` | API — ArchiveEngagementView | Audit log | engagement_id | Required | No |

### ENGAGEMENT_CREATED Payload
```json
{
  "event": "ENGAGEMENT_CREATED",
  "engagement_id": "uuid",
  "client_user_id": "uuid",
  "accountant_user_id": "uuid",
  "tax_year": 2026,
  "client_type": "zzp",
  "timestamp": "2026-06-13T10:00:00Z"
}
```

---

## Document Events

| Event | Producer | Consumers | Idempotency Key | PII |
|-------|----------|-----------|-----------------|-----|
| `DOCUMENT_UPLOADED` | API — ClientDocumentUploadView | Document worker (OCR), Audit log | document_id | Filename |
| `DOCUMENT_PROCESSING_STARTED` | Document worker | Audit log | document_id + attempt | No |
| `DOCUMENT_CLASSIFIED` | Document worker | Readiness service, Audit log | document_id | No |
| `DOCUMENT_NEEDS_REVIEW` | Document worker | Notification service (push to accountant) | document_id | No |
| `DOCUMENT_APPROVED` | API — ExtractionReviewView | Readiness service, Audit log | review_decision_id | No |
| `DOCUMENT_REJECTED` | API — ExtractionReviewView | Notification service (task to client), Audit log | review_decision_id | No |
| `DOCUMENT_DELETED` | API — DocumentDeleteView | File storage, Audit log | document_id | Filename |

### DOCUMENT_APPROVED Payload
```json
{
  "event": "DOCUMENT_APPROVED",
  "document_id": "uuid",
  "engagement_id": "uuid",
  "reviewed_by": "uuid",
  "decision": "approve_with_corrections",
  "field_corrections": [
    {"field_key": "gross_salary", "from": "5800", "to": "58800"}
  ],
  "readiness_impact": {"before": 72, "after": 82},
  "timestamp": "2026-06-13T10:15:00Z"
}
```

---

## Checklist Events

| Event | Producer | Consumers | Idempotency Key | PII |
|-------|----------|-----------|-----------------|-----|
| `CHECKLIST_TEMPLATE_CREATED` | Checklist service | Audit log | engagement_id + template_version | No |
| `CHECKLIST_ITEM_STATUS_CHANGED` | API — ChecklistItemUpdateView | Readiness service, Accountant notification, Audit log | checklist_item_id + status + timestamp | No |
| `CHECKLIST_COMPLETED` | Readiness service | Notification service, Audit log | engagement_id | No |

---

## Invitation Events

| Event | Producer | Consumers | Idempotency Key | PII |
|-------|----------|-----------|-----------------|-----|
| `INVITATION_SENT` | API — AccountantInvitationsView | Notification service (push + email to client) | invitation_id | Email |
| `INVITATION_ACCEPTED` | API — ClientInvitationsView | Notification service (push to accountant), Portal setup | invitation_id | No |
| `INVITATION_DECLINED` | API — ClientInvitationsView | Notification service (push to accountant) | invitation_id | No |
| `INVITATION_CANCELLED` | API — AccountantInvitationsView | Audit log | invitation_id | No |

---

## AI & Chat Events

| Event | Producer | Consumers | Idempotency Key | PII |
|-------|----------|-----------|-----------------|-----|
| `CHAT_MESSAGE_SENT` | API — ChatMessageView | Audit log | conversation_id + message_index | Message content |
| `CHAT_AI_RESPONSE_COMPLETE` | Chat streaming | Audit log | conversation_id + message_index | AI response |
| `PROFILE_UPDATE_DETECTED` | Chat streaming parser | User profile service | user_id + field + timestamp | Profile data |
| `IB_RETURN_COMPLETED` | Chat streaming parser | Dashboard service | user_id + tax_year | IB field values |
| `SAVE_TO_DASHBOARD_CONFIRMED` | API — DashboardSaveView | Dashboard records | user_id + type + timestamp | Tax figures |

---

## Notification Events

| Event | Producer | Consumers | Idempotency Key | PII |
|-------|----------|-----------|-----------------|-----|
| `PUSH_NOTIFICATION_SENT` | push_utils.py | Audit log | subscription_id + notification_hash | Title/body |
| `EMAIL_SENT` | Django email backend | Audit log | email_hash + template + timestamp | Email address |
| `REMINDER_TRIGGERED` | Celery Beat | Notification service, Audit log | reminder_id + scheduled_date | No |

---

## Rule Engine Events

| Event | Producer | Consumers | Idempotency Key | PII |
|-------|----------|-----------|-----------------|-----|
| `RULE_CREATED` | Admin API | Audit log | rule_id + version | No |
| `RULE_SUBMITTED_FOR_REVIEW` | Rule management UI | Notification (admin) | rule_id + version + submitter | No |
| `RULE_APPROVED` | Admin API | Rule versioning service, RAG re-index trigger | rule_id + version + approver | No |
| `RULE_DEPRECATED` | Admin API | Notification service, Audit log | rule_id + effective_until | No |
| `RAG_INDEX_REBUILD_TRIGGERED` | Rule approval | build_index.py (Celery task) | rebuild_job_id | No |

---

## GDPR / Security Events

| Event | Producer | Consumers | Idempotency Key | PII |
|-------|----------|-----------|-----------------|-----|
| `ACCOUNT_DELETION_REQUESTED` | API — DeleteAccountView | GDPR worker, Audit log | user_id + request_timestamp | User ID |
| `ACCOUNT_ANONYMIZED` | GDPR worker | Audit log | user_id + anonymization_timestamp | User ID |
| `DSAR_REQUESTED` | Admin API / User API | GDPR worker | dsar_id | User ID, email |
| `DSAR_FULFILLED` | GDPR worker | Notification service | dsar_id | No |
| `SECURITY_EVENT_DETECTED` | Auth middleware | Sentry, Admin notification | event_type + user_id + timestamp | User ID |

---

## Billing Events

| Event | Producer | Consumers | Idempotency Key | PII |
|-------|----------|-----------|-----------------|-----|
| `SUBSCRIPTION_CREATED` | Billing API | Audit log, Feature flags | subscription_id | User ID |
| `SUBSCRIPTION_UPGRADED` | Billing API | Feature flags update | subscription_id + plan | User ID |
| `SUBSCRIPTION_CANCELLED` | Billing API | Feature flags, Notification | subscription_id | User ID |
| `INVOICE_GENERATED` | Billing API | Email service | invoice_id | User ID, amount |
| `PAYMENT_SUCCEEDED` | Payment webhook | Invoice update, Notification | payment_intent_id | No |
| `PAYMENT_FAILED` | Payment webhook | Subscription downgrade, Notification | payment_intent_id | No |

---

## Retry Policy (Default)

| Event Type | Max Retries | Backoff | Dead Letter |
|-----------|-------------|---------|-------------|
| Notification events | 3 | Exponential (1s, 4s, 16s) | Yes — alert admin |
| Document processing | 3 | Exponential | Yes — mark doc as failed |
| GDPR operations | 5 | Fixed 60s | Yes — alert admin |
| Readiness recalculation | 3 | Immediate | Log warning |
| Billing events | 5 | Exponential | Yes — alert admin |
