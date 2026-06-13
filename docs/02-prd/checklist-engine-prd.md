# Checklist Engine PRD

> Module: Checklist Engine | Version: 1.0 | Updated: 2026-06-13

---

## Overview

The Checklist Engine generates, manages, and evaluates tax preparation checklists. A checklist is a set of `ChecklistItem` records, one per (engagement, checklist_key) pair. Items are generated from persona-specific templates using the `stable_key` pattern, which guarantees idempotent creation — running generation twice produces identical results with no duplicates.

---

## Core Concepts

### stable_key Pattern

Every checklist item has a `stable_key` — a deterministic string derived from the engagement and the item type. The system uses this to find-or-create: if an item with this key already exists, it is updated, not duplicated.

```python
stable_key = f"{engagement_id}:{checklist_category}:{item_slug}"
# Example: "a3f2...:{income}:{jaaropgaaf_2025}"
```

**Why this matters:** The checklist generator can be run multiple times (e.g., after intake profile update) without creating duplicate items. It only adds new items that the profile now requires.

### ChecklistItem Model

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| engagement | FK(TaxEngagement) | Scoped to one engagement |
| stable_key | string | Unique constraint: (engagement_id, stable_key) |
| category | enum | income / expenses / deductions / identification / compliance |
| slug | string | Machine-readable item name (e.g., "jaaropgaaf_2025") |
| label_nl | string | Dutch label |
| label_en | string | English label |
| label_fa | string | Persian label |
| description_nl | string | Instructions in Dutch |
| description_en | string | Instructions in English |
| description_fa | string | Instructions in Persian |
| priority | enum | required / recommended / optional |
| status | enum | todo / waiting_client / uploaded / needs_review / accepted / rejected / waived |
| linked_document | FK(ClientDocument) | Nullable — set when a document is uploaded for this item |
| accountant_note | text | Nullable — internal note for the accountant |
| client_note | text | Nullable — visible to client |
| due_date | date | Nullable — shown in client task list |
| created_at | datetime | |
| updated_at | datetime | |

---

## Template System

### Templates by User Type

Each user type has a base template. Templates are stored in the database as `ChecklistTemplate` records (not hardcoded in Python).

**ZZP Template (base):**
| Category | Item slug | Priority | Label (EN) |
|----------|-----------|----------|-----------|
| income | zzp_invoices_year | required | All ZZP invoices for tax year |
| income | bank_statements_year | required | Bank statements (full year) |
| income | kvk_extract | required | KVK registration extract |
| expenses | business_expenses_list | required | Business expenses summary |
| deductions | urenregistratie | required | Hours registration (1,225+ hours record) |
| deductions | home_office_assessment | optional | Home office check (usually not eligible) |
| deductions | pension_jaarruimte | recommended | Pension contribution calculation |
| compliance | btw_returns_q1_q4 | required | All 4 BTW returns filed confirmation |
| identification | bsn_copy | required | BSN identification document |
| identification | iban_confirmation | required | Bank account number confirmation |

**Employee Template (base):**
| Category | Item slug | Priority | Label (EN) |
|----------|-----------|----------|-----------|
| income | jaaropgaaf_employer | required | Jaaropgaaf from employer(s) |
| income | other_income_sources | recommended | Other income (rental, dividends) |
| deductions | reiskosten | optional | Commuting expenses (if applicable) |
| deductions | lijfrente | optional | Pension contributions |
| identification | bsn_copy | required | BSN identification document |

**Expat Template (base — extends Employee):**
Adds:
| deductions | ruling_30_percent_proof | required | 30% ruling decision letter |
| income | foreign_income_declaration | recommended | Foreign income declaration |

**DGA Template (base):**
| Category | Item slug | Priority | Label (EN) |
|----------|-----------|----------|-----------|
| income | bv_salary_slip | required | BV salary slip (gebruikelijk loon) |
| income | dividend_distribution | recommended | Dividend distribution record |
| income | bv_annual_report | required | BV annual report excerpt |
| deductions | dga_pension_actuarial | optional | DGA pension actuarial statement |
| compliance | vennootschapsbelasting_iou | required | VPB obligation confirmation |
| identification | bsn_copy | required | BSN identification |

---

## Generation Algorithm

```python
def generate_checklist(engagement: TaxEngagement) -> list[ChecklistItem]:
    profile = engagement.client_user.intake_profile
    user_type = profile.get("user_type", "employee")

    # 1. Select base template
    template = ChecklistTemplate.objects.get(user_type=user_type, year=engagement.tax_year)

    # 2. Apply profile-based additions
    additional_items = []
    if profile.get("has_30pct_ruling"):
        additional_items += template.get_expat_additions()
    if profile.get("has_zzp_pension"):
        additional_items += template.get_pension_items()
    if profile.get("box3_assets_over_threshold"):
        additional_items.append(ITEM_BOX3_ASSETS)
    if profile.get("has_rental_income"):
        additional_items.append(ITEM_RENTAL_INCOME)
    if profile.get("has_mortgage"):
        additional_items.append(ITEM_MORTGAGE_STATEMENT)

    # 3. Find-or-create with stable_key (idempotent)
    items = []
    for item_def in template.items + additional_items:
        stable_key = f"{engagement.id}:{item_def.category}:{item_def.slug}"
        item, created = ChecklistItem.objects.get_or_create(
            engagement=engagement,
            stable_key=stable_key,
            defaults={
                "category": item_def.category,
                "slug": item_def.slug,
                "label_nl": item_def.label_nl,
                "label_en": item_def.label_en,
                "label_fa": item_def.label_fa,
                "priority": item_def.priority,
                "status": "todo",
            }
        )
        items.append(item)

    return items
```

---

## Status Transitions

```
TODO ──────────────────────────────────────────────►
  │                                                  │
  ▼                                                  │
WAITING_CLIENT ─(client uploads doc)──────────────►  │
  │                                                  │
  ▼                                                  │
UPLOADED ─(accountant reviews)──────────────────────►│
  │                                                  │
  ▼                                                  │
NEEDS_REVIEW ─(accountant approves)────────────────►│
  │                                                  │
  ├──► ACCEPTED ◄─────────────────────────────────┘
  │         │
  │    WAIVED (accountant decision — counts as done)
  │
  └──► REJECTED ─(client re-uploads)─────────────► back to WAITING_CLIENT
```

**Transition rules:**
- `TODO → WAITING_CLIENT`: accountant sends request to client
- `WAITING_CLIENT → UPLOADED`: client uploads a document and links it
- `UPLOADED → NEEDS_REVIEW`: OCR completes, requires accountant review
- `NEEDS_REVIEW → ACCEPTED`: accountant approves extraction
- `NEEDS_REVIEW → REJECTED`: accountant rejects, client must re-upload
- `ANY → WAIVED`: accountant decides item is not applicable
- `WAIVED/ACCEPTED` are terminal states (unless accountant manually reverses)

---

## Checklist Template Model

`ChecklistTemplate` lives in the database and can be updated by admins via the rule management UI.

| Field | Type |
|-------|------|
| id | UUID |
| user_type | enum (zzp / employee / expat / dga) |
| year | int (2026) |
| items | JSONField (list of item definitions) |
| version | int |
| created_by | FK(User) |
| approved_at | datetime |
| is_active | boolean |

Templates follow the same versioning pattern as tax rules — a new version is created each year.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/portal/engagements/{id}/checklist/` | accountant/client | List all checklist items |
| PATCH | `/api/portal/checklist-items/{id}/` | accountant | Update status, note |
| POST | `/api/portal/engagements/{id}/checklist/generate/` | accountant/admin | Re-run generation (idempotent) |
| POST | `/api/portal/checklist-items/{id}/request-from-client/` | accountant | Send task to client |
| GET | `/api/portal/checklist-templates/` | admin | List templates |
| PUT | `/api/portal/checklist-templates/{id}/` | admin | Update template |

---

## NFR

| Requirement | Target |
|-------------|--------|
| Generation time (all items) | < 500ms |
| Idempotency | 100% — two runs with same profile produce zero new items |
| Status audit | Every status change written to PortalAuditLog |
| Template update safety | New template version is active only after admin approval |
| Persian labels | All item labels and descriptions available in FA |
