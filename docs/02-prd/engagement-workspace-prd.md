# Engagement Workspace PRD

> Module: Engagement Workspace | Version: 1.0 | Updated: 2026-06-13

---

## Overview

The engagement workspace is the primary accountant-facing interface for managing one client's tax preparation for one tax year. It is a tabbed workspace at `/accountant/engagements/{id}` with 7 tabs, a readiness ring, and an AI-powered next-actions panel.

---

## Core Entity

**TaxEngagement** — one record per (client, tax_year) pair.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| client_user | FK(User) | The taxpayer |
| accountant_user | FK(User) | The managing accountant |
| firm | FK(Firm) | The accountant's firm |
| tax_year | integer | 2026 |
| status | enum | Draft / Collecting / Review / ReadyToFile / Filed / Archived |
| readiness_score | 0–100 | Current readiness score |
| ready_to_file | boolean | True when score ≥85 + no gaps |
| risk_level | low/medium/high | Wet DBA and compliance risk |
| missing_items_count | integer | Open mandatory items |
| assigned_accountant | FK(User) | Can differ from firm manager |

---

## 7 Tabs

### Tab 1: Overview

**Purpose:** At-a-glance status for the engagement.

**Contents:**
- Readiness ring (ProgressRing component, 0–100, color-coded: red<50, amber<75, green≥75)
- Readiness breakdown (4 dimensions: Documents, Checklist, Verification, Accountant Review)
- Explanation text: what is missing and why the score is at its current level
- Next actions panel (AI-generated, max 5 rows): colored dot + client name + issue + action link
- Summary stats: total documents, approved extractions, open checklist items
- Engagement status badge + last updated timestamp
- Quick-action buttons: Recalculate, Send reminder, Generate actions

**Functional requirements:**
- FR-ENG-001: Overview tab must refresh readiness score within 5 seconds of any document or checklist event
- FR-ENG-002: Next actions panel shows the highest-priority open items across all categories
- FR-ENG-003: Status badge is always visible and reflects current engagement.status
- FR-ENG-004: "Ready to file" badge appears when ready_to_file=True

### Tab 2: Checklist

**Purpose:** Manage the tax preparation checklist for this engagement.

**Contents:**
- List of all ChecklistItems grouped by category (income, expenses, deductions, identification)
- Each item: status dropdown, priority badge, category, description (multilingual)
- Actions per item: mark accepted/rejected/waived, add note, request from client
- Filter: by status, by category, by priority
- Progress bar: X/N items complete

**Functional requirements:**
- FR-ENG-005: Accountant can change any checklist item status
- FR-ENG-006: Status change must write to PortalAuditLog and trigger readiness recalculation
- FR-ENG-007: Waived items do not lower readiness score
- FR-ENG-008: "Required" items (priority=required) block ready_to_file until accepted or waived

### Tab 3: Documents

**Purpose:** Review uploaded documents and approve/reject AI extractions.

**Contents:**
- Left panel (280px): document list with filename, type, status badge, confidence score
- Right panel: document preview + extraction review table
  - Each extracted field: label, OCR raw value, normalized value, confidence bar, bounding box highlight, accept/correct/reject action
- Upload button: accountant can upload documents on behalf of client
- Document actions: approve, reject, request replacement, mark superseded

**Functional requirements:**
- FR-ENG-009: Split-panel layout on desktop; stacked on mobile
- FR-ENG-010: Accountant correction of extracted values must store corrected value separately from raw OCR value
- FR-ENG-011: Approving an extraction triggers readiness recalculation
- FR-ENG-012: Document approval requires at least all mandatory fields to be in accepted/corrected state
- FR-ENG-013: Rejected documents generate a client task to re-upload

### Tab 4: Income

**Purpose:** Review extracted income data and approve for use in tax calculation.

**Contents:**
- List of approved income extractions (jaaropgaaf, ZZP invoices, rental income)
- Each: source document, amount, category, verification status
- Manual income entry (accountant can add income without a document)
- Totals: gross, tax withheld, net, by category and in total

**Functional requirements:**
- FR-ENG-014: Income data marked "candidate" cannot be used in readiness calculation
- FR-ENG-015: Approved income totals feed into the engagement's tax calculation summary
- FR-ENG-016: Manual entries are flagged as "manually entered" in audit log

### Tab 5: Expenses (Deductions)

**Purpose:** Review business expenses and deduction eligibility.

**Contents:**
- Extracted expense items from documents
- Manual expense entry per category (12 business expense categories)
- Deduction eligibility per line item (eligible / needs confirmation / not eligible)
- Total: qualifying deductions amount

**Functional requirements:**
- FR-ENG-017: Each expense item links to the document it was extracted from
- FR-ENG-018: Accountant can add deduction opportunities manually
- FR-ENG-019: Deduction total feeds into tax calculation

### Tab 6: Risks & Deductions

**Purpose:** AI-identified tax opportunities and compliance risks.

**Contents:**
- Deduction opportunities (AI-generated): opportunity name, confidence, evidence status, recommended action
- Risk factors: Wet DBA risk score and reasons, Box 3 threshold proximity, missed deadlines
- Filter by confidence level (high/medium/low)
- Action per opportunity: dismiss, request evidence, mark as confirmed

**Functional requirements:**
- FR-ENG-020: Deduction opportunities are generated by the AI deduction scanner, not entered manually
- FR-ENG-021: Each risk factor links to the relevant tax rule (rule_id)
- FR-ENG-022: Confirmed deductions appear in the Expenses tab

### Tab 7: Audit

**Purpose:** Immutable record of all actions taken on this engagement.

**Contents:**
- Chronological log of all PortalAuditLog entries for this engagement
- Each entry: timestamp, actor (user name + role), action, resource affected, old/new value
- Filter by: actor, action type, date range
- Export: CSV download of audit log

**Functional requirements:**
- FR-ENG-023: Audit log is read-only — no entry can be edited or deleted
- FR-ENG-024: All mutations to engagement, checklist, documents, and extractions write to audit log
- FR-ENG-025: Audit log export respects GDPR (no PII beyond what's needed for the record)

---

## RBAC

| Action | Role Required | Additional Condition |
|--------|---------------|---------------------|
| View engagement | accountant, admin | engagement.accountant == user or is_staff |
| Update checklist | accountant, admin | Same as view |
| Approve extraction | accountant, admin | Same as view |
| View audit log | accountant, firm_manager, admin | Same as view |
| Archive engagement | accountant, admin | Status must be Filed |
| Reassign accountant | firm_manager, admin | — |

---

## Edge Cases

- **Concurrent review:** If two accountants try to approve the same extraction simultaneously, the second request gets a 409 Conflict with the current version number
- **Empty engagement:** New engagement with no documents shows 0% readiness and a checklist with all items in TODO state
- **Client self-service:** If client has no accountant, portal auto-creates engagement and allows self-service (no accountant review step — client marks items done themselves)
- **Archived engagement:** Read-only. No mutations allowed. Status badge shows "Archived."
- **Tax year mismatch:** Documents from wrong tax year detected by OCR flagged with warning in Documents tab

---

## Analytics Events

| Event | Trigger |
|-------|---------|
| `engagement_tab_viewed` | User opens any tab (tab_name property) |
| `extraction_approved` | Accountant approves document extraction |
| `extraction_corrected` | Accountant corrects a field value |
| `readiness_milestone` | Score crosses 25/50/75/85 |
| `reminder_sent` | Accountant clicks "Send reminder" |
| `actions_generated` | AI generates next-action panel |
