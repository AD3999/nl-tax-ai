# Document Classification Specification — TaxWijs

> Defines the taxonomy of Dutch tax documents, classification method, confidence thresholds, multi-label handling, and versioning strategy.

---

## 1. Document Taxonomy

| Code | Dutch Name | English Name | Priority | Notes |
|------|-----------|--------------|----------|-------|
| `JAAROPGAVE` | Jaaropgave | Annual income statement | P0 | Issued by employers, mandatory for employees |
| `BTW_AANGIFTE` | BTW-aangifte | VAT return confirmation | P0 | Quarterly, required for ZZP |
| `BANKAFSCHRIFT` | Bankafschrift | Bank statement | P0 | Full year required for ZZP/DGA |
| `FACTUUR_UITGAAND` | Uitgaande factuur | Sales invoice | P0 | Required for ZZP revenue proof |
| `FACTUUR_INKOMEND` | Inkomende factuur | Purchase invoice | P0 | Business expenses proof |
| `WOZ_BESCHIKKING` | WOZ-beschikking | Property value statement | P1 | Issued by municipality each spring |
| `HYPOTHEEKJAAROPGAVE` | Hypotheekjaaropgave | Mortgage annual statement | P1 | Required for mortgage interest deduction |
| `PENSIOENOPGAVE` | Pensioenopgave | Pension statement | P1 | For lijfrente deduction |
| `DIVIDENDBEWIJS` | Dividendbewijs | Dividend certificate | P1 | DGA Box 2 income |
| `KVK_UITTREKSEL` | KVK-uittreksel | Chamber of Commerce extract | P1 | Business identity |
| `AANGIFTE_IB` | Aangifte inkomstenbelasting | Income tax return | P2 | Filed return (prior year reference) |
| `BELASTINGAANSLAG` | Belastingaanslag | Tax assessment notice | P2 | From Belastingdienst |
| `LOONSTROOK` | Loonstrook | Payslip | P2 | Monthly pay slip |
| `HOURS_LOG` | Urenstaat | Hours registration | P1 | ZZP urencriterium proof |
| `VERZEKERINGSOVERZICHT` | Verzekeringsoverzicht | Insurance overview | P2 | Business insurance |
| `LEASE_OVEREENKOMST` | Leaseovereenkomst | Lease agreement | P2 | Car/equipment lease |
| `OVERIG` | Overig | Other | P3 | Default for unrecognized documents |
| `UNKNOWN` | Onbekend | Unknown | P3 | Classification failed |

### 1.1 Taxonomy Versioning

Taxonomy is versioned as `taxonomy_v{N}`. Changes:
- New document type added → `taxonomy_v{N+1}`
- Field key renamed → `taxonomy_v{N+1}` (breaking change)
- Classification model retrained on new taxonomy

Each `document_classifications` row records the `classifier_version` used.

---

## 2. Classification Method

### 2.1 Approach: Few-Shot Prompting with Claude

Classification uses a few-shot prompt to Claude with the first page of OCR text. This was chosen over a fine-tuned model because:
- Dutch tax document vocabulary is distinctive (few hallucinations)
- Taxonomy changes frequently (law changes each year)
- No training data pipeline maintenance required
- Cost: ~€0.001 per document at current Claude pricing

### 2.2 Classification Prompt Template

```
You are a Dutch tax document classifier. Classify the following document into exactly one category.

Categories and their distinguishing features:
- JAAROPGAVE: Contains "Jaaropgave", employer name, BSN, "loon", "loonheffing"
- BTW_AANGIFTE: Contains "BTW", "aangifte", "OB", quarterly period
- BANKAFSCHRIFT: Contains IBAN, "saldo", date ranges, transaction rows
- FACTUUR_UITGAAND: Contains "Factuur", your KVK/BTW number as sender, client name
- FACTUUR_INKOMEND: Contains "Factuur", supplier name, your company as recipient
- WOZ_BESCHIKKING: Contains "WOZ", "beschikking", property address, municipality
- HYPOTHEEKJAAROPGAVE: Contains "hypotheek", "rente", "jaaropgave", lender name
- PENSIOENOPGAVE: Contains "pensioen", "lijfrente", "jaaropgave", premium amounts
- DIVIDENDBEWIJS: Contains "dividend", company name, dividend amount
- KVK_UITTREKSEL: Contains "Kamer van Koophandel", "KVK", registration number
- HOURS_LOG: Contains hours per week/month, project names, total hours
- UNKNOWN: None of the above clearly match

Document text (first 1000 characters):
{ocr_text[:1000]}

Respond in JSON only:
{"document_type": "JAAROPGAVE", "confidence": 0.95, "reasoning": "Contains jaaropgave header and BSN field"}
```

### 2.3 Multi-Label Classification

A document may be classified as multiple types (e.g., a combined bank + BTW statement). In this case:
- `document_classifications` gets one row per identified type
- One row is marked `is_primary=True` (highest confidence)
- Extraction runs on all identified types separately
- `documents.document_type` stores the primary classification only

### 2.4 Confidence Thresholds for Classification

| Confidence | Action |
|-----------|--------|
| ≥ 0.90 | Accept classification, proceed to extraction |
| 0.70 – 0.89 | Accept classification with flag for spot-check |
| 0.50 – 0.69 | Request accountant confirmation of document type |
| < 0.50 | Classify as `UNKNOWN`, require manual review |

---

## 3. Unknown Document Handling

If `document_type = UNKNOWN`:
1. Create `AccountantAction` priority=medium: "Unrecognized document — please classify manually"
2. UI shows document with type dropdown for accountant to select manually
3. After manual classification, extraction runs as normal
4. Accountant's manual classification saved as `is_primary=True`, AI classification retained for comparison

---

## 4. Classification Test Dataset

A minimum test dataset must be maintained in `phase1/data/test/classification/`:
- 5+ real (anonymized) examples per document type
- Each example: `{filename}.pdf` + `{filename}.expected.json`
- Test suite verifies correct classification + confidence ≥ threshold

Run classification tests: `python phase1/scripts/test_classification.py`

---

## 5. Year and Firm Detection

Alongside document type, the classifier also extracts:
- `tax_year_detected`: the tax year the document refers to (e.g., `2025` from "Jaaropgave 2025")
- Cross-checked against `engagement.tax_year` — mismatch triggers `AccountantAction`

If `tax_year_detected` is ambiguous or absent, set to `null` and flag for review.
