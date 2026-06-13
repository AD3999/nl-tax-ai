# Confidence Scoring Specification — TaxWijs

> Defines the four confidence dimensions, composite automation confidence, thresholds, degradation factors, and calibration methodology.

---

## 1. Four Confidence Dimensions

### 1.1 Document Confidence

How certain the classifier is about the document type.

```python
document_confidence = classifier_output["confidence"]  # 0.0 – 1.0
```

Factors that degrade document confidence:
- Poor scan quality (low DPI, blurry)
- Unusual formatting (non-standard jaaropgave templates)
- Mixed-language document
- Partial document (missing pages)

### 1.2 Field Confidence

How certain the extractor is about each extracted value.

```python
field_confidence = extraction_result.fields[field_key].confidence  # 0.0 – 1.0
```

Factors that degrade field confidence:
- Handwritten vs. printed text (handwritten: −0.15 penalty)
- Low OCR quality on the field region (< 70 DPI)
- Field value fails format validation (BSN elfproef fails: set confidence = 0.0)
- Multiple candidate values found (ambiguous extraction: set confidence = 0.4)
- Cross-document validation fails (mismatch: cap field confidence at 0.6)

### 1.3 Rule Confidence

How certain we are that a tax rule applies to this user's situation.

```python
rule_confidence = calculate_rule_applicability(rule, user_profile)
```

| Applicability | Confidence |
|--------------|-----------|
| All required conditions clearly met (verified by document) | 1.00 |
| Conditions met but unverified (based on user declaration) | 0.85 |
| Conditions partially met (e.g., hours estimated, not logged) | 0.65 |
| Edge case or ambiguous condition | 0.50 |
| Condition not met | 0.00 |

### 1.4 Deduction Confidence

How certain we are that a deduction opportunity is valid and claimable.

```python
deduction_confidence = rule_confidence × evidence_completeness
```

Where `evidence_completeness` = verified_evidence_items / total_required_evidence_items.

---

## 2. Composite Automation Confidence

Determines whether a document can proceed straight-through without human review.

```python
def composite_confidence(document: Document) -> float:
    doc_conf = document.classification_confidence
    
    field_confs = [f.confidence for f in document.extracted_fields]
    if not field_confs:
        return doc_conf * 0.5  # no fields extracted = lower confidence
    
    min_field_conf = min(field_confs)
    avg_field_conf = sum(field_confs) / len(field_confs)
    
    # Worst-case weighted: 40% minimum field, 60% average field
    field_score = 0.4 * min_field_conf + 0.6 * avg_field_conf
    
    # Document confidence × field score
    return round(doc_conf * field_score, 4)
```

---

## 3. Routing Thresholds

| Composite Confidence | Action | Review Task Priority |
|--------------------|--------|---------------------|
| ≥ 0.90 | **Straight-through:** auto-approve, no human review | None |
| 0.75 – 0.89 | **Spot-check:** approve with low-priority review flag | Low |
| 0.60 – 0.74 | **Human review required:** accountant must review all fields | Medium |
| < 0.60 | **Manual processing only:** no auto-fields applied to engagement | High |

---

## 4. Degradation Factors

| Factor | Impact on Field Confidence |
|--------|--------------------------|
| Handwritten text detected | −0.15 |
| Image DPI < 150 | −0.20 |
| Multi-column layout (harder to extract) | −0.10 |
| Document is a photograph of a screen | −0.25 |
| BSN elfproef fails | → 0.00 (hard fail) |
| IBAN checksum fails | → 0.00 (hard fail) |
| Amount < 0 when > 0 expected | → 0.00 (hard fail) |
| Cross-document mismatch | cap at 0.60 |

---

## 5. Per-Field Display in Review UI

The review UI displays confidence for each field:

| Confidence Range | Display | Color |
|----------------|---------|-------|
| ≥ 0.90 | ✓ High confidence | Green |
| 0.75 – 0.89 | ~ Medium confidence | Amber |
| 0.60 – 0.74 | ⚠ Review recommended | Orange |
| < 0.60 | ✗ Low confidence — verify | Red |

Hard-failed fields (confidence = 0.00 from format validation) always show in Red with the specific validation error.

---

## 6. Confidence Calibration

Every 30 days, confidence scores are calibrated against ground truth:

1. Sample 200 most recently reviewed documents where accountant reviewed and made corrections
2. For each corrected field: compare `confidence` vs. whether accountant accepted or corrected
3. Compute Expected Calibration Error (ECE):
   ```
   ECE = Σ (|avg_confidence_in_bucket − accuracy_in_bucket| × bucket_size / total)
   ```
4. If ECE > 0.05: retrain or adjust classification/extraction prompt
5. Publish calibration report to `ai_monitoring_evaluation.md`

---

## 7. Confidence in Context to Claude

When passing extracted data to the Claude AI response layer, confidence is communicated:

```
EXTRACTED INCOME DATA (from verified documents):
- Gross salary: €58,800 [confidence: HIGH — from verified Jaaropgave]
- Tax withheld: €12,140 [confidence: HIGH]
- Pension contribution: €2,400 [confidence: MEDIUM — review recommended]

IMPORTANT: Do not present any LOW confidence value as fact. 
For MEDIUM values, note they are based on AI extraction and may need verification.
```
