# Message Schemas — TaxWijs

> Defines every domain event published internally (Django signals / Celery tasks). These are the event schemas referenced by `events/asyncapi.yaml`.

---

## 1. Event Envelope

All events share a common envelope:

```json
{
  "event_id": "evt_01J5XKZM1N3P7Q2R4S6T8V9W0",
  "event_type": "document.extraction_complete",
  "schema_version": "1.0",
  "occurred_at": "2026-06-13T10:15:42.123Z",
  "producer": "taxwijs-backend",
  "payload": { ... }
}
```

---

## 2. Identity & Access Events

### `user.registered`
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "role": "accountant",
  "firm_id": "uuid",
  "invited_by": "uuid | null"
}
```

### `user.email_verified`
```json
{ "user_id": "uuid", "email": "user@example.com" }
```

### `user.login_failed`
```json
{ "email": "user@example.com", "ip_address": "1.2.3.4", "reason": "wrong_password | account_locked" }
```

---

## 3. Engagement Events

### `engagement.created`
```json
{
  "engagement_id": "uuid",
  "client_id": "uuid",
  "firm_id": "uuid",
  "tax_year": 2026,
  "persona": "zzp | employee | expat | dga"
}
```

### `engagement.status_changed`
```json
{
  "engagement_id": "uuid",
  "from_status": "intake",
  "to_status": "in_review",
  "changed_by": "uuid",
  "reason": "string | null"
}
```

### `engagement.readiness_score_changed`
```json
{
  "engagement_id": "uuid",
  "previous_score": 65.0,
  "new_score": 80.0,
  "snapshot_id": "uuid",
  "trigger": "document_accepted | checklist_updated | manual_override"
}
```

### `engagement.completed`
```json
{
  "engagement_id": "uuid",
  "client_id": "uuid",
  "firm_id": "uuid",
  "tax_year": 2026,
  "final_readiness_score": 95.0,
  "completed_by": "uuid"
}
```

---

## 4. Document Events

### `document.upload_requested`
```json
{
  "document_id": "uuid",
  "engagement_id": "uuid",
  "filename": "jaaropgave_2025.pdf",
  "mime_type": "application/pdf",
  "file_size_bytes": 245760,
  "uploaded_by": "uuid",
  "s3_key": "engagements/uuid/documents/uuid.pdf"
}
```

### `document.virus_scan_complete`
```json
{
  "document_id": "uuid",
  "result": "clean | infected",
  "scanner": "clamav",
  "threat_name": "null | Eicar-Test-Signature"
}
```

### `document.classification_complete`
```json
{
  "document_id": "uuid",
  "document_type": "JAAROPGAVE",
  "confidence": 0.95,
  "is_primary": true,
  "classifier_version": "taxonomy_v3"
}
```

### `document.extraction_complete`
```json
{
  "document_id": "uuid",
  "extraction_id": "uuid",
  "document_type": "JAAROPGAVE",
  "composite_confidence": 0.87,
  "fields_extracted": 9,
  "fields_failed": 0,
  "routing_decision": "spot_check"
}
```

### `document.needs_review`
```json
{
  "document_id": "uuid",
  "engagement_id": "uuid",
  "reason": "low_confidence | mandatory_review | contradictory_evidence",
  "priority": "low | medium | high",
  "assigned_to": "uuid | null"
}
```

### `document.review_complete`
```json
{
  "document_id": "uuid",
  "review_id": "uuid",
  "decision": "approved | rejected | needs_client_correction",
  "reviewed_by": "uuid",
  "corrections_made": 2
}
```

### `document.superseded`
```json
{
  "old_document_id": "uuid",
  "new_document_id": "uuid",
  "engagement_id": "uuid",
  "reason": "client_reupload | accountant_replacement"
}
```

---

## 5. AI Events

### `ai.chat_message_sent`
```json
{
  "thread_id": "uuid",
  "message_id": "uuid",
  "engagement_id": "uuid",
  "user_type": "zzp | employee | expat | dga",
  "language": "nl | en | fa",
  "input_tokens": 850,
  "output_tokens": 320,
  "model": "claude-sonnet-4-6",
  "prompt_version": 12,
  "rag_chunks_retrieved": 5,
  "mock_mode": false
}
```

### `ai.deduction_opportunity_found`
```json
{
  "engagement_id": "uuid",
  "rule_id": "ZA-2026-001",
  "opportunity_type": "zelfstandigenaftrek",
  "estimated_saving": 1200.00,
  "confidence": 0.85,
  "evidence_required": ["HOURS_LOG"]
}
```

---

## 6. Billing Events

### `subscription.created`
```json
{
  "firm_id": "uuid",
  "plan": "starter | professional | enterprise",
  "billing_cycle": "monthly | annual",
  "starts_at": "2026-01-01"
}
```

### `subscription.usage_limit_approaching`
```json
{
  "firm_id": "uuid",
  "metric": "engagements | ai_calls | documents",
  "used": 180,
  "limit": 200,
  "pct_used": 90
}
```

---

## 7. Privacy Events

### `dsar.request_received`
```json
{
  "request_id": "uuid",
  "request_type": "access | erasure | portability | rectification",
  "subject_email": "client@example.com",
  "requested_by": "uuid",
  "deadline": "2026-07-13"
}
```

### `dsar.fulfilled`
```json
{
  "request_id": "uuid",
  "fulfilled_at": "2026-06-28T14:30:00Z",
  "fulfilled_by": "uuid",
  "download_url": "https://... (expires in 72h)"
}
```
