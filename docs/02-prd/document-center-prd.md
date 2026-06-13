# Document Center PRD

> Module: Document Center | Version: 1.0 | Updated: 2026-06-13

---

## Overview

The Document Center handles the full lifecycle of tax documents: upload, storage, OCR processing, AI-powered field extraction, accountant review, and approval. It is the data entry point for all structured financial data (income amounts, tax withheld, deductions). Every piece of financial data that enters the system must be traceable to an approved document or a manually entered record with an audit trail.

---

## Document Types Supported

| Type Slug | Label (EN) | Common Source | Key Fields |
|-----------|-----------|---------------|-----------|
| `jaaropgaaf` | Annual income statement | Employer | gross_salary, tax_withheld, zvw_withheld |
| `zzp_invoice` | ZZP invoice | Client invoice | invoice_date, amount_excl_vat, vat_amount, client_name |
| `kvk_extract` | KVK registration | KVK portal | company_name, kvk_number, sbi_code, start_date |
| `btw_return` | VAT return | Belastingdienst portal | period, turnover, vat_due, vat_paid |
| `bank_statement` | Bank statement | Bank | period, opening_balance, closing_balance, transaction_count |
| `mortgage_statement` | Mortgage interest statement | Bank | year, interest_paid, remaining_principal |
| `pension_statement` | Pension contribution statement | Insurer | year, premiums_paid, type_of_pension |
| `ruling_30pct` | 30% ruling decision letter | Belastingdienst | start_date, end_date, percentage, employer |
| `dividend_slip` | Dividend distribution | Notary/BV | dividend_gross, dividend_tax_withheld, date |
| `expense_receipt` | Business expense receipt | Supplier | date, amount, category, supplier_name, vat_amount |
| `rental_income` | Rental income overview | Self-prepared | property_address, year, total_income, expenses |
| `other_income` | Other income document | Various | description, amount, date |

---

## Upload Constraints

- Maximum file size: 20 MB
- Accepted MIME types: `application/pdf`, `image/jpeg`, `image/png`, `image/heic`
- Accepted via: browser drag-and-drop, file picker, camera (mobile)
- Multi-file upload: up to 10 files in one upload session
- Virus scan: ClamAV or cloud virus scan before processing (target — gap if not implemented)

---

## Document Lifecycle

```
UPLOADED ──► PROCESSING ──► CLASSIFIED ──► NEEDS_REVIEW ──► APPROVED
                                │
                                └──► (auto-approved if confidence > 0.95)
                                          │
                                    REJECTED ──► (client re-uploads)
                                          │
                                    SUPERSEDED ──► (newer version uploaded)
```

### State Definitions

| State | Description |
|-------|-------------|
| UPLOADED | File received, stored in file storage, Celery task queued |
| PROCESSING | OCR running in Celery worker |
| CLASSIFIED | Document type identified, field extraction complete |
| NEEDS_REVIEW | Extraction confidence below threshold OR mandatory fields missing — accountant must review |
| APPROVED | Accountant confirmed all extracted fields; data is authoritative |
| REJECTED | Accountant rejected (wrong document, unreadable, wrong year) — client must re-upload |
| SUPERSEDED | A newer version of this document was uploaded and approved — old one is read-only |

---

## OCR + Extraction Pipeline

### Step 1 — Storage
On upload, file is:
1. Validated (MIME type, size)
2. Given a UUID filename (original filename preserved in `original_filename` field)
3. Stored at `media/portal/documents/{engagement_id}/{uuid}.{ext}`
4. `ClientDocument` record created with status=UPLOADED

### Step 2 — Celery OCR Task
`process_document_ocr.delay(document_id)` is queued.

The Celery worker:
1. Reads file from storage
2. Calls OCR (target: Google Document AI or AWS Textract — GAP-I03)
3. Stores raw OCR text in `ClientDocument.ocr_raw_text`
4. Updates status to PROCESSING

### Step 3 — Claude Extraction
`extract_document_fields.delay(document_id)` is queued after OCR completes.

The Celery worker sends a structured prompt to Claude:
- System: "You are a document field extractor. Extract the fields from this Dutch tax document. Return only valid JSON. Do not invent values."
- User: raw OCR text + document type hint + field schema
- Response: structured JSON with field name, raw_value, normalized_value, confidence (0.0–1.0)

Each extracted field is stored as an `ExtractedField` record:
| Field | Type |
|-------|------|
| document | FK(ClientDocument) |
| field_name | string (e.g., "gross_salary") |
| raw_value | string (as OCR read it) |
| normalized_value | string (cleaned: "€ 48.500,00" → "48500.00") |
| confidence | float (0.0–1.0) |
| bounding_box | JSONField (optional, for highlighting) |
| status | enum (candidate / accepted / corrected / rejected) |
| corrected_value | string (nullable — set if accountant corrects) |

### Step 4 — Classification Decision

If all mandatory fields are extracted with confidence ≥ 0.85:
- Status → CLASSIFIED
- If auto-approve threshold met (ALL fields confidence ≥ 0.95): status → APPROVED directly

Otherwise:
- Status → NEEDS_REVIEW

### Step 5 — Accountant Review (for NEEDS_REVIEW documents)

The accountant sees the split-panel review UI (left: document preview, right: extraction table).

For each extracted field:
- Accept: mark status=accepted, keep normalized_value
- Correct: enter a corrected value → status=corrected, corrected_value stored
- Reject: mark status=rejected (field will not be used in calculations)

When all mandatory fields are accepted or corrected:
- Accountant clicks "Approve document"
- All fields get status=accepted (or corrected)
- Document status → APPROVED
- Readiness recalculation triggered

---

## ClientDocument Model

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| engagement | FK(TaxEngagement) | |
| uploaded_by | FK(User) | Client or accountant |
| original_filename | string | |
| storage_path | string | Relative path in file storage |
| doc_type | string | From document type list above |
| tax_year | int | Auto-detected from content or user-specified |
| status | enum | See lifecycle above |
| ocr_raw_text | text | Full raw OCR output |
| confidence_score | float | Average confidence across all extracted fields |
| accountant_notes | text | Internal notes |
| rejection_reason | text | Shown to client on rejection |
| superseded_by | FK(self) | Points to newer version |
| uploaded_at | datetime | |
| processed_at | datetime | When OCR completed |
| reviewed_at | datetime | When accountant reviewed |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/portal/engagements/{id}/documents/upload/` | client/accountant | Upload a document |
| GET | `/api/portal/engagements/{id}/documents/` | accountant/client | List documents |
| GET | `/api/portal/documents/{id}/` | accountant/client | Get document detail + extracted fields |
| PATCH | `/api/portal/documents/{id}/approve/` | accountant | Approve all fields |
| PATCH | `/api/portal/documents/{id}/reject/` | accountant | Reject document |
| PATCH | `/api/portal/extracted-fields/{id}/` | accountant | Accept/correct/reject a field |
| DELETE | `/api/portal/documents/{id}/` | client | Delete UPLOADED (not-yet-reviewed) doc |

---

## Document Preview

- PDF: rendered in browser via PDF.js embed
- Images: `<img>` tag with responsive sizing
- HEIC: converted to JPEG on server before storage
- For accountant review: side-by-side with extraction table
- Bounding boxes: overlay on image/PDF showing where each field was found (if bounding box data available)

---

## Versioning (Superseded Documents)

When a client re-uploads a document of the same type:
1. New `ClientDocument` created with status=UPLOADED
2. Old document status set to SUPERSEDED (`superseded_by = new_doc`)
3. All extractions from old document are archived
4. Accountant must review the new document
5. Readiness recalculation triggered

---

## GDPR Considerations

- Document files are retained for: tax year + 7 years
- After 7-year retention: files are deleted from storage, `ClientDocument` record is anonymized
- DSAR export includes: document metadata (name, type, status, dates), extracted field values — NOT the file bytes themselves (too large, contains PII in bulk)
- Deletion request: document metadata is anonymized, file is deleted immediately

---

## NFR

| Requirement | Target |
|-------------|--------|
| Upload acknowledgement | < 5 seconds |
| OCR end-to-end (PDF) | < 60 seconds |
| Claude extraction | < 15 seconds |
| Auto-classification accuracy | > 90% of documents correctly typed |
| Auto-extraction confidence | > 85% of fields at ≥ 0.85 confidence for standard docs |
| Storage | S3-compatible, encrypted at rest |
| Virus scan | Before processing (pre-launch requirement) |
