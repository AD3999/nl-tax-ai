# Extraction and Validation Specification — TaxWijs

> Field-level extraction targets per document type, normalization rules, cross-document validation, and conflict resolution logic.

---

## 1. Extraction Targets by Document Type

### 1.1 JAAROPGAVE (Annual Income Statement)

| Field Key | Label (NL) | Label (EN) | Type | Validation |
|-----------|-----------|-----------|------|-----------|
| `gross_salary` | Bruto loon | Gross salary | decimal | > 0; < 10,000,000 |
| `tax_withheld` | Ingehouden loonheffing | Tax withheld | decimal | ≥ 0; < gross_salary |
| `bsn` | Burgerservicenummer | BSN | string | 9 digits; elfproef |
| `employer_name` | Naam werkgever | Employer name | string | non-empty |
| `employer_loonheffingen_number` | Loonheffingennummer | Payroll tax number | string | format: 8 digits + L01 |
| `tax_year` | Belastingjaar | Tax year | int | must match engagement year |
| `holiday_pay` | Vakantiegeld | Holiday pay | decimal | ≥ 0 |
| `pension_contribution` | Pensioenpremie | Pension contribution | decimal | ≥ 0 |
| `net_salary` | Netto loon | Net salary | decimal | > 0 |

### 1.2 BTW_AANGIFTE (VAT Return)

| Field Key | Label | Type | Validation |
|-----------|-------|------|-----------|
| `period` | Tijdvak | string | Q1/Q2/Q3/Q4 or month |
| `taxable_turnover_high` | Belaste omzet hoog (21%) | decimal | ≥ 0 |
| `taxable_turnover_low` | Belaste omzet laag (9%) | decimal | ≥ 0 |
| `vat_due_high` | BTW verschuldigd 21% | decimal | = taxable_turnover_high × 0.21 ± 1 |
| `vat_due_low` | BTW verschuldigd 9% | decimal | = taxable_turnover_low × 0.09 ± 1 |
| `vat_paid` | BTW betaald | decimal | ≥ 0 |
| `net_vat` | Te betalen/terugvragen | decimal | vat_due − vat_paid |

### 1.3 BANKAFSCHRIFT (Bank Statement)

| Field Key | Type | Validation |
|-----------|------|-----------|
| `account_iban` | string | ISO 13616; NL format: NLxx + 10 chars |
| `account_holder` | string | non-empty |
| `period_start` | date | ISO 8601 |
| `period_end` | date | ISO 8601; > period_start |
| `opening_balance` | decimal | any |
| `closing_balance` | decimal | any |
| `total_credits` | decimal | ≥ 0 |
| `total_debits` | decimal | ≥ 0 |

### 1.4 HYPOTHEEKJAAROPGAVE (Mortgage Statement)

| Field Key | Type | Validation |
|-----------|------|-----------|
| `lender_name` | string | non-empty |
| `outstanding_balance` | decimal | > 0 |
| `interest_paid` | decimal | ≥ 0; typically > 0 for active mortgage |
| `tax_year` | int | matches engagement year |
| `loan_reference` | string | lender's loan number |

---

## 2. Normalization Rules

### 2.1 Currency

| Raw Format | Normalized |
|-----------|-----------|
| `€ 58.800,-` | `58800.00` |
| `58.800,00` | `58800.00` |
| `€58,800.00` | `58800.00` |
| `-€ 1.200` | `-1200.00` |
| `1.200` (ambiguous) | flag for review if context is unclear |

Algorithm:
1. Strip `€` and whitespace
2. If contains both `.` and `,`: if `,` is last → Dutch format (`.`=thousands, `,`=decimal)
3. Replace `.` thousands separator → empty; replace `,` decimal → `.`
4. Parse as float; round to 2 decimal places

### 2.2 Dates

| Raw Format | Normalized |
|-----------|-----------|
| `1 januari 2026` | `2026-01-01` |
| `01-01-2026` | `2026-01-01` |
| `01/01/2026` | `2026-01-01` |
| `2026-01-01` | `2026-01-01` (no change) |
| `Q1 2026` | period_start: `2026-01-01`, period_end: `2026-03-31` |

Dutch month names: januari, februari, maart, april, mei, juni, juli, augustus, september, oktober, november, december

### 2.3 BSN (Burgerservicenummer)

Validation: **Elfproef** (11-check):
```python
def validate_bsn(bsn: str) -> bool:
    if not bsn.isdigit() or len(bsn) != 9:
        return False
    total = sum((9 - i) * int(d) for i, d in enumerate(bsn[:8]))
    total -= int(bsn[8])
    return total % 11 == 0
```

Store encrypted (`bsn_enc`) — never store plaintext BSN in extractedfields.normalized_value.

---

## 3. Cross-Document Validation

### 3.1 Salary vs. Bank Deposits

When both `JAAROPGAVE` and `BANKAFSCHRIFT` are present for the same year:

```python
jaaropgave_gross = extracted_fields["gross_salary"].normalized_value  # e.g. 58800.00
bank_total_credits = extracted_fields["total_credits"].normalized_value  # e.g. 55000.00

# Allow 10% tolerance (net salary + holiday pay, timing differences)
if abs(jaaropgave_gross - bank_total_credits) / jaaropgave_gross > 0.10:
    create_accountant_action(
        priority="medium",
        title=f"Salary mismatch: Jaaropgave shows €{jaaropgave_gross:,.0f} "
              f"but bank credits total €{bank_total_credits:,.0f}"
    )
```

### 3.2 BTW Cross-Check

When `BTW_AANGIFTE` and `FACTUUR_UITGAAND` are both present:
- Sum of all sales invoices BTW should ≈ sum of BTW declared in BTW_AANGIFTE
- Tolerance: ± €50 (timing differences between invoice date and BTW period)

### 3.3 Tax Year Mismatch

```python
if document.tax_year_detected and document.tax_year_detected != engagement.tax_year:
    create_accountant_action(
        priority="high",
        title=f"Document year mismatch: document is from {document.tax_year_detected}, "
              f"engagement is for {engagement.tax_year}"
    )
    update document.status = "needs_review"
```

---

## 4. Conflicting Evidence Handling

When two documents provide the same field with different values:

| Scenario | Resolution |
|----------|-----------|
| Two jaaropgave docs (different employers) | Both are valid — sum gross_salary values |
| Two bank statements (same account, overlapping periods) | Use most recent; flag overlap |
| Corrected invoice (same invoice number, different amount) | "Most recent wins" — use document with later `created_at` |
| BSN on jaaropgave ≠ BSN in client profile | Manual resolution required — accountant confirms |

**"Most recent wins" rule applies when:**
- Documents are of the same type
- Cover the same period
- One is explicitly marked as a correction/replacement

**"Manual resolution required" when:**
- Fundamental identity fields conflict (BSN, IBAN account holder)
- Amount differences exceed 5% with no clear supersession
- Documents from different authoritative sources disagree

In manual resolution cases:
- Create `AccountantAction` priority=high
- Both values shown in review UI side-by-side
- Accountant selects canonical value
- Decision recorded in `extracted_fields.final_value` with `review_state=corrected`
