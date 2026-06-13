# Deduction Scanner Logic — TaxWijs

> Specification for the automated deduction opportunity scanner: how opportunities are generated, scored, presented, and acted upon.

---

## 1. Overview

The deduction scanner fires after every document extraction approval. It analyzes the engagement's current state and generates `DeductionOpportunity` records for tax deductions, credits, or filing optimizations the user may have missed.

**Trigger events:** `DOCUMENT_APPROVED`, `CHECKLIST_ITEM_UPDATED` (status → accepted), `TAX_PROFILE_UPDATED`

---

## 2. Opportunity Generation Rules

### 2.1 ZZP Users

| Opportunity | Trigger Condition | Rule Linked | Estimated Value |
|-------------|------------------|-------------|----------------|
| Zelfstandigenaftrek | `hours_per_year >= 1225` and not yet applied | ZA-2026-001 | €1,200 |
| Startersaftrek | `years_as_entrepreneur <= 3` AND `is_starter=True` AND tax_year <= 2026 | SA-2026-001 | €2,123 |
| MKB-winstvrijstelling | Always for ZZP (no hours requirement) | MKB-2026-001 | 12.7% × profit_after_oa |
| KIA deduction | `kia_investments` between €2,901 and €132,746 | KIA-2026-001 | 28% × investments |
| ZVW bijdrage reminder | Always for ZZP — often forgotten | ZVW-2026-001 | 4.85% × profit (cost, not saving) |
| Lijfrente jaarruimte | `annual_revenue_zzp > 19172` | LR-2026-001 | 30% × (income − €19,172) |
| KOR eligibility | `annual_revenue_zzp < 20000` | KOR-2026-001 | VAT admin relief |
| Wet DBA risk alert | `single_client_percentage >= 65` | WD-2026-001 | Compliance risk (no value) |

### 2.2 Employee Users

| Opportunity | Trigger Condition | Rule Linked | Estimated Value |
|-------------|------------------|-------------|----------------|
| Mortgage interest deduction | Bank statement + mortgage statement uploaded | (external rule) | Interest paid × marginal rate |
| Healthcare cost deduction | Medical receipts uploaded | (external rule) | Costs above drempel × marginal rate |
| Giftenaftrek (donations) | Donation receipts from ANBI-registered charities | (external rule) | 1.25 × donations × marginal rate |
| Home office deduction | ⚠️ NOT applicable in NL for employees | QA-2026-012 | €0 (misconception alert) |
| Lijfrente jaarruimte | `employment_income > 19172` | LR-2026-001 | 30% × (income − €19,172) |

### 2.3 Expat Users

| Opportunity | Trigger Condition | Rule Linked | Estimated Value |
|-------------|------------------|-------------|----------------|
| 30% ruling | `uses_30pct_ruling=False` AND employment contract with Dutch employer uploaded | EXP-2026-001 | 30% × salary (years 1-3) |
| Foreign asset declaration | Foreign bank/investment balance > €0 | B3R-2026-001 | Compliance (Box 3) |
| M-form instead of C-form | arrival or departure in tax year | DL-2026-002 | Compliance |

### 2.4 DGA Users

| Opportunity | Trigger Condition | Rule Linked | Estimated Value |
|-------------|------------------|-------------|----------------|
| Gebruikelijk loon check | `employment_income < 56000` | DGA-2026-001 | Compliance risk alert |
| Box 2 dividend optimization | `box2_dividend > 0` | B2R-2026-001 | Rate comparison 24.5% vs 31% |
| Rekening-courant monitoring | BV accounts show director loan | (external rule) | Compliance |
| Pension within BV | If pension_contribution = 0 | LR-2026-001 | Pension planning suggestion |

---

## 3. Evidence Requirements

Each opportunity specifies required evidence before it can be marked `evidence_complete=True`:

```json
{
  "opportunity_type": "zelfstandigenaftrek",
  "evidence_requirements": [
    {
      "document_type": "HOURS_LOG",
      "is_required": true,
      "description": "Hours registration showing ≥1,225 hours for tax year"
    }
  ]
}
```

When evidence is incomplete:
1. Create `AccountantAction` for client: "Please upload your hours registration (urenregistratie)"
2. Set `opportunity.evidence_complete = False`
3. Display evidence gap in deduction panel with upload shortcut

---

## 4. Confidence Calculation

```python
def opportunity_confidence(rule_confidence: float, evidence_completeness: float) -> float:
    """
    rule_confidence: how certain the rule applies (from rule_engine)
    evidence_completeness: fraction of required evidence uploaded and verified
    """
    return round(rule_confidence * evidence_completeness, 4)
```

| Rule Confidence | Evidence | Opportunity Confidence | Display |
|----------------|----------|----------------------|---------|
| 1.00 (rule clearly applies) | 1.0 (all docs verified) | 1.00 | ✅ Confirmed |
| 0.90 | 0.80 | 0.72 | ⚠️ Likely — missing 1 document |
| 0.70 | 0.50 | 0.35 | ❓ Possible — review needed |
| < 0.50 | Any | < 0.50 | 🔍 Investigate — low certainty |

---

## 5. Scanner Output (DeductionOpportunity Record)

```json
{
  "id": "uuid",
  "engagement_id": "uuid",
  "rule_id": "uuid-of-ZA-2026-001",
  "opportunity_type": "zelfstandigenaftrek",
  "title_nl": "Zelfstandigenaftrek — €1.200 aftrek mogelijk",
  "title_en": "Self-employment deduction — €1,200 possible",
  "title_fa": "کسر خوداشتغالی — ۱٬۲۰۰ یورو ممکن است",
  "description_nl": "U heeft recht op de zelfstandigenaftrek van €1.200 als u in 2026 minimaal 1.225 uur als ondernemer heeft gewerkt.",
  "estimated_value": 1200.00,
  "confidence": 0.85,
  "status": "pending",
  "evidence_complete": false,
  "expires_at": null,
  "created_at": "2026-06-13T12:00:00Z"
}
```

---

## 6. Expiry Tracking

Opportunities linked to deadline-sensitive rules get `expires_at` populated:

| Rule | Opportunity Expires |
|------|-------------------|
| SA-2026-001 (Startersaftrek) | 2026-12-31 (last year this deduction exists) |
| DL-2026-001 (BTW Q1) | 2026-04-30 |
| DL-2026-002 (IB return) | 2026-05-01 |

Expired opportunities:
- Status → `expired`
- Removed from active deduction panel
- Remain in history for audit

---

## 7. Recommendation Text Patterns

All recommendation text is generated in all 3 languages. Pattern:

```python
# NL
f"Als ZZP'er met {hours} uur per jaar heeft u recht op de zelfstandigenaftrek "
f"van €{amount:,.0f}. Controleer uw urenregistratie om dit te bevestigen."

# EN  
f"As a self-employed person working {hours} hours per year, you qualify for the "
f"self-employment deduction of €{amount:,.0f}. Verify your hours log to confirm."

# FA
f"به عنوان فریلنسر با {hours} ساعت کار در سال، شما واجد شرایط کسر خوداشتغالی "
f"به مبلغ €{amount:,.0f} هستید. ساعت‌کارکرد خود را تأیید کنید."
```

**Misconception alert (home office for employees):**

```
⚠️ Home office deduction does not apply in the Netherlands for employees.
Unlike some countries, Dutch employees cannot deduct home office costs 
from their income tax return. (Source: Belastingdienst — see QA-2026-012)
```

---

## 8. Review and Disposition Workflow

```
pending → accountant reviews → accept (add to engagement tax data)
                             → dismiss (with reason: "not applicable", "already claimed", "insufficient evidence")
```

Accepted opportunities:
- Linked deduction value passed to tax calculator profile
- Readiness recalculated
- Opportunity status → `accepted`

Dismissed opportunities:
- Status → `dismissed`
- Reason recorded for audit
- Not re-surfaced unless profile changes significantly

---

## 9. Deduction Summary Report

Available at `GET /api/portal/engagements/{id}/deductions/summary/`:

```json
{
  "total_estimated_savings": 4850,
  "confirmed_savings": 1200,
  "pending_review": 3650,
  "currency": "EUR",
  "opportunities": [
    {"type": "zelfstandigenaftrek", "value": 1200, "status": "accepted", "confidence": 1.0},
    {"type": "lijfrente_jaarruimte", "value": 3650, "status": "pending", "confidence": 0.75}
  ],
  "alerts": [
    {"type": "zvw_reminder", "message": "ZVW bijdrage of €2,394 due — set aside monthly"}
  ]
}
```
