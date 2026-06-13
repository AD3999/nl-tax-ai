# Epics, Features, and User Stories — TaxWijs

> 16 epics, each with features and representative user stories. Full 240-story list: see `user-stories.md` in docs/02-prd/.

---

## Epic 1: Authentication & Onboarding

**Goal:** Users can register, verify email, log in securely, and accept an invitation from their firm.

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| E01-F01-US001 | New accountant | Register with email + password | I can access the platform |
| E01-F01-US002 | New accountant | Receive an email verification link | My account is confirmed |
| E01-F02-US003 | Accountant | Log in with JWT | I stay authenticated across sessions |
| E01-F02-US004 | Accountant | Enable MFA (TOTP) | My account is protected |
| E01-F03-US005 | Invited user | Accept a firm invitation via email link | I join the firm's workspace |

---

## Epic 2: Firm Management

**Goal:** Firm managers can set up their firm, manage members, and configure branding.

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| E02-F01-US001 | Firm manager | Create a firm profile | My team has a shared workspace |
| E02-F01-US002 | Firm manager | Upload a logo for white-label | My clients see my branding |
| E02-F02-US003 | Firm manager | Invite accountants by email | My team can start working |
| E02-F02-US004 | Firm manager | Remove a member from the firm | Access control is maintained |
| E02-F03-US005 | Firm manager | View billing and subscription status | I know our usage and limits |

---

## Epic 3: Client Management

**Goal:** Accountants can create and manage clients, including their tax profiles.

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| E03-F01-US001 | Accountant | Create a new client | I can start working on their taxes |
| E03-F01-US002 | Accountant | Set a client's persona (ZZP/employee/expat/DGA) | The right checklist and rules apply |
| E03-F01-US003 | Accountant | View all my clients in a dashboard | I have an overview of all active work |
| E03-F02-US004 | Client | View my own profile | I can verify my details are correct |
| E03-F02-US005 | Accountant | Mark a client as inactive | Archived clients don't clutter my view |

---

## Epic 4: Engagement Workspace

**Goal:** Each client-year has a dedicated workspace where all work happens.

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| E04-F01-US001 | Accountant | Open an engagement for client + tax year | All work is organized in one place |
| E04-F01-US002 | Accountant | See the engagement status (intake → filed) | I know where each client is |
| E04-F02-US003 | Accountant | See the readiness score (0–100) | I know how complete this engagement is |
| E04-F02-US004 | Accountant | See which checklist items are missing | I can tell the client what to send |
| E04-F03-US005 | Accountant | Add a task to an engagement | I track action items I need to do |
| E04-F03-US006 | Accountant | Send a message in the engagement thread | I can communicate with the client |

---

## Epic 5: Document Upload & Intake

**Goal:** Clients and accountants can upload documents; the system acknowledges receipt.

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| E05-F01-US001 | Client | Upload a PDF or image via drag-and-drop | I submit my documents easily |
| E05-F01-US002 | Client | See upload confirmation | I know the document was received |
| E05-F02-US003 | Accountant | See newly uploaded documents in my inbox | I know when clients submit |
| E05-F02-US004 | System | Virus scan uploaded files automatically | Malware is caught before processing |
| E05-F02-US005 | Accountant | Re-upload a corrected document | Client mistakes can be fixed |

---

## Epic 6: Document Processing (OCR + Classification)

**Goal:** Uploaded documents are automatically classified and their key fields extracted.

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| E06-F01-US001 | System | Run OCR on uploaded PDFs | Text is available for classification |
| E06-F01-US002 | System | Classify the document type (JAAROPGAVE, BTW, etc.) | Correct extraction template is applied |
| E06-F02-US003 | System | Extract key fields (income, tax withheld, BSN) | Structured data is ready for review |
| E06-F02-US004 | System | Compute confidence scores per field | Low-confidence extractions are flagged |
| E06-F03-US005 | Accountant | See extracted fields with confidence badges | I know which fields to verify |

---

## Epic 7: Human-in-the-Loop Review

**Goal:** Accountants can review, accept, correct, or reject extracted document data.

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| E07-F01-US001 | Accountant | See a review queue for low-confidence documents | I process them in priority order |
| E07-F01-US002 | Accountant | Accept an extracted field as correct | The value is confirmed for tax use |
| E07-F01-US003 | Accountant | Correct an extracted field value | OCR errors are fixed before tax filing |
| E07-F02-US004 | Accountant | See two conflicting values side-by-side | I can choose the correct one |
| E07-F02-US005 | System | Prevent two accountants from reviewing the same document | No conflicting changes |

---

## Epic 8: Readiness Scoring

**Goal:** Each engagement shows a live readiness score based on documents, checklists, and accountant review.

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| E08-F01-US001 | Accountant | See the readiness score update when I accept a document | I see instant feedback |
| E08-F01-US002 | Accountant | See the formula breakdown (doc/checklist/verification/review) | I understand the score |
| E08-F02-US003 | Accountant | See which component is dragging the score down | I know what to prioritize |
| E08-F02-US004 | Client | See my own readiness progress | I feel motivated to complete the intake |
| E08-F03-US005 | Accountant | Override a score component with a reason | I can handle edge cases |

---

## Epic 9: Checklist Management

**Goal:** Each persona has a pre-populated checklist of required documents and tasks.

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| E09-F01-US001 | System | Auto-generate a checklist when an engagement is created | No manual setup needed |
| E09-F01-US002 | Accountant | See checklist items in NL, EN, or FA | My client understands what's needed |
| E09-F02-US003 | Accountant | Mark a checklist item as waived | Optional items can be dismissed |
| E09-F02-US004 | Accountant | Add a custom checklist item | Edge case needs not in the template |
| E09-F03-US005 | Accountant | See which items are blocking the readiness score | I know what the client still needs to do |

---

## Epic 10: AI Tax Q&A

**Goal:** Users can ask tax questions in NL, EN, or FA and get accurate, cited answers.

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| E10-F01-US001 | ZZP client | Ask "what is the zelfstandigenaftrek?" in Dutch | I understand my deductions |
| E10-F01-US002 | Expat client | Ask the same question in English | I get the same quality answer |
| E10-F01-US003 | Iranian client | Ask the same question in Persian | I get an answer in my language |
| E10-F02-US004 | Client | See the source URL for every tax fact cited | I can verify the answer |
| E10-F02-US005 | Accountant | See what the AI told the client | I know what advice was given |

---

## Epic 11: Tax Calculator

**Goal:** Users can calculate their total tax liability with full step-by-step breakdown.

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| E11-F01-US001 | ZZP user | Enter my profit and get a total tax estimate | I know how much to reserve |
| E11-F01-US002 | ZZP user | See each deduction applied (ZA, SA, MKB) | I understand my tax bill |
| E11-F01-US003 | ZZP user | See ZVW bijdrage calculated separately | I'm aware of the hidden health tax |
| E11-F02-US004 | DGA user | Calculate Box 1 + Box 2 tax separately | I optimize salary vs. dividend |
| E11-F02-US005 | System | Read all tax rates from phase1 JSON (never hardcode) | Numbers are always up to date |

---

## Epic 12: Deduction Opportunity Scanner

**Goal:** The system proactively identifies deductions and optimizations the user may have missed.

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| E12-F01-US001 | ZZP user | Be shown that startersaftrek ends after 2026 | I claim it before it's gone |
| E12-F01-US002 | ZZP user with 1200 hours | See zelfstandigenaftrek as an applicable deduction | I don't miss €1,200 |
| E12-F02-US003 | ZZP user near €40,857 | Be warned that zorgtoeslag stops at that threshold | I can plan my invoicing |
| E12-F02-US004 | Accountant | See all identified opportunities for a client | I review them before the client does |
| E12-F03-US005 | Expat | See that 30% ruling is in phase-down year 4 (20%) | I adjust my expectations |

---

## Epic 13: IB Return Guide

**Goal:** Walk users through the income tax return (aangifte IB) form field by field.

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| E13-F01-US001 | ZZP user | See what belongs in field "1a" in plain Dutch | I don't make entry mistakes |
| E13-F01-US002 | Expat | See the same explanation in English | I file correctly as a non-Dutch speaker |
| E13-F02-US003 | Client | See common mistakes for each field | I avoid them |
| E13-F02-US004 | Client | See follow-up AI questions per field | I get proactive guidance |
| E13-F03-US005 | Accountant | See the full IB form field mapping | I can review client entries |

---

## Epic 14: Rule Management (Admin)

**Goal:** Tax SMEs can add, update, and publish tax rules; rules go through an approval workflow.

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| E14-F01-US001 | Tax SME | Create a new tax rule with NL/EN/FA content | New rules are in the knowledge base |
| E14-F01-US002 | Tax SME | Update an existing rule's value | 2027 values can be staged in advance |
| E14-F02-US003 | Tax SME | Run a test case against a rule | I verify the rule logic before publishing |
| E14-F02-US004 | Firm manager | Approve a rule update for publishing | Four-eyes principle is enforced |
| E14-F03-US005 | System | Shadow-test new rules against 1% of traffic | Rollout is safe |

---

## Epic 15: Admin Console

**Goal:** Admins can manage firms, users, feature flags, and incidents.

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| E15-F01-US001 | Admin | View all firms and their subscription status | I have operational oversight |
| E15-F01-US002 | Admin | Enable a feature flag for a specific firm | I roll out features gradually |
| E15-F02-US003 | Admin | Fulfill a data subject access request (DSAR) | GDPR compliance is maintained |
| E15-F02-US004 | Admin | View the audit log for any engagement | Full traceability is available |
| E15-F03-US005 | Admin | Create an incident record during an outage | Post-mortem tracking is in place |

---

## Epic 16: Annual Maintenance (Phase 9)

**Goal:** Each September, tax data is updated for the new tax year.

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| E16-F01-US001 | Tax SME | Update tax_rules_{year}.json after Prinsjesdag | 2027 rules are ready for January 1 |
| E16-F01-US002 | System | Validate all rules pass validate.py | No broken data is deployed |
| E16-F02-US003 | Tax SME | Update scenario expected values for new year | Calculator accuracy tests still pass |
| E16-F02-US004 | Tax SME | Re-run phase2/build_index.py | RAG corpus reflects new rules |
| E16-F03-US005 | Firm manager | See a "2027 tax year ready" banner in December | I know the system is ready |
