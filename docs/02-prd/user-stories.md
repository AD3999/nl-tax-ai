# User Stories — TaxWijs
> 240 stories across 16 epics (15 per epic). Format: ID | Role | Story | Acceptance Criteria

---

## Epic 1: Authentication & Onboarding (E01)

| ID | As a | I want to | So that | Acceptance Criteria |
|----|------|-----------|---------|-------------------|
| E01-US001 | New accountant | Register with email + password | I can access the platform | Email + password required; email format validated; password min 8 chars |
| E01-US002 | New user | Receive email verification link after register | My account is confirmed | Email sent within 1 min; link expires 24h; clicking verifies account |
| E01-US003 | Accountant | Log in with email + password | I get a JWT session | Returns access + refresh token; 401 on wrong credentials |
| E01-US004 | Accountant | Enable TOTP-based MFA | My account is more secure | QR code shown; verify TOTP before enabling; subsequent logins require TOTP |
| E01-US005 | Invited user | Accept a firm invitation via email link | I join without registering separately | Link validates token; user created with correct role; expires in 7 days |
| E01-US006 | Accountant | Log out | My session ends | JWT revoked; subsequent requests with old token return 401 |
| E01-US007 | Accountant | Reset password via email | I recover a locked account | Reset email sent; link expires 1h; new password required |
| E01-US008 | User | See a session timeout warning | I don't lose unsaved work | Warning shown 5 min before expiry; auto-extend if active |
| E01-US009 | User | Refresh my access token | I stay logged in during a long session | Refresh endpoint returns new access token; old refresh token single-use |
| E01-US010 | Admin | View all active user sessions | I can revoke compromised sessions | List shows user, IP, created_at, last_seen; revoke button per session |
| E01-US011 | Firm manager | Invite multiple users at once | I onboard my team quickly | CSV upload of emails; each gets individual invitation email |
| E01-US012 | Accountant | Set my preferred language (NL/EN/FA) during setup | The app is in my language from day one | Preference saved; subsequent logins use that language |
| E01-US013 | Admin | Disable a user account | A departed team member can't log in | Account disabled immediately; existing sessions revoked |
| E01-US014 | User | See what permissions my role has | I understand what I can and can't do | Permissions list visible in My Profile |
| E01-US015 | Admin | View failed login attempts | I can detect brute force attacks | Failed attempts logged; alert after 5 failures in 10 min |

---

## Epic 2: Firm Management (E02)

| ID | As a | I want to | So that | Acceptance Criteria |
|----|------|-----------|---------|-------------------|
| E02-US001 | Firm manager | Create a firm profile | My team has a shared workspace | Name, KVK number, BTW number required; firm created immediately |
| E02-US002 | Firm manager | Upload a logo | Client portal shows our branding | PNG/SVG, max 2 MB; displays in header and client emails |
| E02-US003 | Firm manager | Set a primary brand color | White-label feel for clients | Hex color input; previewed in UI immediately |
| E02-US004 | Firm manager | Invite accountants by email | My team can start working | Email sent with invitation; accountant role assigned automatically |
| E02-US005 | Firm manager | Remove a team member | Access is revoked when someone leaves | User removed from firm; their pending work reassigned |
| E02-US006 | Firm manager | Change a team member's role | An accountant is promoted to manager | Role change takes effect immediately; audit logged |
| E02-US007 | Firm manager | View all team members | I have an overview of my team | List shows name, email, role, last active, pending invitations |
| E02-US008 | Firm manager | View subscription status | I know our plan limits | Shows current plan, usage vs. limits, renewal date |
| E02-US009 | Firm manager | Upgrade subscription | We need more client capacity | Redirect to billing; upgrade takes effect immediately |
| E02-US010 | Firm manager | View invoice history | I have billing records for accounting | PDF download per invoice; date, amount, period |
| E02-US011 | Firm manager | Set default language for new clients | Our Iranian clients get Persian by default | Default language preference saved; applies to new client profiles |
| E02-US012 | Admin | View all firms and their plans | I have operational oversight | Table with firm name, plan, client count, last active |
| E02-US013 | Admin | Enable a feature flag for a firm | I roll out features gradually | Toggle per firm; takes effect within 5 seconds |
| E02-US014 | Firm manager | Configure email notification preferences | I control what emails the firm receives | Checkboxes per notification type; saved per user |
| E02-US015 | Firm manager | Export a client list to CSV | I have an offline backup | CSV includes client name, email, persona, active engagements |

---

## Epic 3: Client Management (E03)

| ID | As a | I want to | So that | Acceptance Criteria |
|----|------|-----------|---------|-------------------|
| E03-US001 | Accountant | Create a new client with name and email | I can start working on their taxes | Name required; email optional; client created immediately |
| E03-US002 | Accountant | Set a client's persona (ZZP/employee/expat/DGA) | The right checklist and rules apply | Single-select; can be changed until first engagement is filed |
| E03-US003 | Accountant | Set a client's preferred language | They receive communications in their language | NL/EN/FA; applies to all client-facing content |
| E03-US004 | Accountant | Enter client's KVK number | Business identity is on file | Optional; validates format |
| E03-US005 | Accountant | View all clients in a filterable list | I have an overview of all active work | Filter by status, persona, tax year; search by name |
| E03-US006 | Accountant | Archive an inactive client | Old clients don't clutter my view | Archived clients hidden by default; recoverable |
| E03-US007 | Client | View and update my own profile | My details are up to date | Edit name, email, language; changes saved immediately |
| E03-US008 | Accountant | Link a client to a portal user account | The client can log in and upload documents themselves | Client receives invitation email; account linked on acceptance |
| E03-US009 | Accountant | View client's tax history (previous years) | I see the full picture | List of past engagements with readiness scores |
| E03-US010 | Accountant | Add notes to a client profile | I remember important context | Free text notes; visible only to firm team |
| E03-US011 | Accountant | Mark a client as "Wet DBA risk" | I track compliance risk | Risk level (low/medium/high) stored on tax_profile |
| E03-US012 | Accountant | Filter clients by Wet DBA risk | I prioritize high-risk clients | Filter by risk level in client list |
| E03-US013 | Accountant | Bulk-create clients via CSV upload | I onboard many clients at once | CSV template downloadable; validation report shown before import |
| E03-US014 | Admin | Search for any client across all firms | I can assist with support requests | Admin-only search; firm isolation still shown in results |
| E03-US015 | Accountant | See a client's BSN on file | I can verify identity for the IB return | BSN shown masked (***-***-**) by default; reveal requires MFA confirmation |

---

## Epic 4: Engagement Workspace (E04)

| ID | As a | I want to | So that | Acceptance Criteria |
|----|------|-----------|---------|-------------------|
| E04-US001 | Accountant | Open a new engagement for a client + tax year | All work is organized in one place | (client, tax_year) must be unique per firm; created immediately |
| E04-US002 | Accountant | See the engagement status | I know where each client is in the process | Status shown: intake, documents_pending, in_review, ready, filed, archived |
| E04-US003 | Accountant | Transition an engagement to "ready" | I indicate the client's file is complete | Requires readiness score ≥ 80; transition recorded in status history |
| E04-US004 | Accountant | Mark an engagement as "filed" | I close out the year | Final status; no further document changes possible without accountant override |
| E04-US005 | Accountant | Assign an engagement to a colleague | Another accountant handles this client | Assigned user receives notification; filter by assigned_to in inbox |
| E04-US006 | Accountant | Leave a note on an engagement | I communicate context to colleagues | Note saved with author + timestamp; visible in engagement header |
| E04-US007 | Accountant | See a list of all open tasks | I know what actions are pending | Tasks grouped by priority; filter by status |
| E04-US008 | Accountant | Create a task for a specific engagement | I track action items | Title + priority + optional due date; assignable to team members |
| E04-US009 | Accountant | Mark a task as done | Completed items are cleared | Task status → done; timestamp recorded |
| E04-US010 | Client | View my own engagement status | I know how the process is going | Status shown in plain language (e.g., "Uw dossier wordt beoordeeld") |
| E04-US011 | Client | See which documents are still needed | I know what to upload | Pending checklist items shown with label in my preferred language |
| E04-US012 | Accountant | Filter engagements by status | I see only in-progress files | Filter applied to engagement list; persists during session |
| E04-US013 | Accountant | Sort engagements by readiness score | I prioritize lowest-scoring files | Sort ascending shows most incomplete engagements first |
| E04-US014 | Accountant | Search engagements by client name | I find a specific client quickly | Instant search; results appear within 300ms |
| E04-US015 | Firm manager | View all engagements across all team members | I have firm-wide oversight | Filter by assigned_to, status, tax_year |

---

## Epic 5: Document Upload & Intake (E05)

| ID | As a | I want to | So that | Acceptance Criteria |
|----|------|-----------|---------|-------------------|
| E05-US001 | Client | Upload a PDF via drag-and-drop | I submit my documents easily | Max 25 MB; PDF/JPG/PNG accepted; upload shows progress bar |
| E05-US002 | Client | Upload multiple files at once | I submit all my documents in one go | Multi-file upload; each processed independently |
| E05-US003 | Client | See upload confirmation | I know the document was received | "Ontvangen — wordt verwerkt" shown; document appears in list |
| E05-US004 | Client | See why an upload failed | I can fix the problem | Error in Dutch/English/Persian; actionable (e.g., "Bestand te groot") |
| E05-US005 | System | Virus-scan uploaded files automatically | Malware never enters the system | ClamAV scan within 30s; infected files rejected immediately |
| E05-US006 | Accountant | Upload a document on behalf of a client | I handle documents received by post | Same upload flow; document tagged as "uploaded_by_accountant" |
| E05-US007 | Accountant | See newly uploaded documents in my inbox | I know when clients submit | Inbox notification within 1 min of upload |
| E05-US008 | Client | Replace a previously uploaded document | I submitted the wrong file | New version created; old version archived (not deleted) |
| E05-US009 | Accountant | Download an uploaded document | I need to view the original file | S3 pre-signed URL; expires in 15 min |
| E05-US010 | Accountant | Delete an uploaded document | An irrelevant file was uploaded | Requires reason; document soft-deleted; audit logged |
| E05-US011 | System | Detect duplicate uploads (same hash) | Storage is not wasted | Warning shown: "Dit bestand is al geüpload" — allow override |
| E05-US012 | Client | Receive confirmation email after upload | I have a receipt | Email with filename + timestamp sent immediately |
| E05-US013 | Accountant | Filter documents by type | I find the right document quickly | Filter: JAAROPGAVE, BTW, BANKAFSCHRIFT, etc. |
| E05-US014 | Accountant | See which document request each upload fulfills | I track coverage | Document linked to document_request; checklist item auto-updated |
| E05-US015 | System | Store all document files encrypted at rest | Client data is secure | AES-256 at S3 level; metadata in DB never stores file content |

---

## Epic 6: Document Processing — OCR & Classification (E06)

| ID | As a | I want to | So that | Acceptance Criteria |
|----|------|-----------|---------|-------------------|
| E06-US001 | System | Run OCR on uploaded PDFs automatically | Structured text is available for processing | Textract called within 60s of upload; raw text stored in pipeline_run |
| E06-US002 | System | Classify the document type automatically | The right extraction template is applied | Claude classifier returns type + confidence within 30s |
| E06-US003 | System | Extract key fields from the document | Structured data is available for review | Required fields per document_type extracted; stored in extracted_fields |
| E06-US004 | System | Compute a confidence score per extracted field | Low-confidence fields are flagged | confidence in [0.0–1.0]; stored alongside normalized_value |
| E06-US005 | System | Compute composite automation confidence | Routing decision is automated | composite = doc_conf × field_score; routing: straight-through/spot-check/review/manual |
| E06-US006 | System | Auto-approve high-confidence documents | No human review needed for clear cases | Composite ≥ 0.90: document status → approved; checklist item auto-updated |
| E06-US007 | Accountant | See which documents are awaiting review | I know my queue | Filter documents by routing_decision = human_review |
| E06-US008 | Accountant | See the detected document type and confidence | I verify the classifier was correct | Classification shown on document card with confidence badge |
| E06-US009 | System | Detect when a document is from the wrong tax year | Mismatched documents are flagged | tax_year_detected compared to engagement.tax_year; mismatch → accountant action |
| E06-US010 | System | Normalize Dutch currency amounts (€ 58.800,-) | Structured data is usable | Normalized to decimal: 58800.00; stored in extracted_fields.normalized_value |
| E06-US011 | System | Validate BSN using the elfproef | Invalid BSNs never pass through | elfproef check; fail → confidence = 0.0; accountant action created |
| E06-US012 | System | Handle multi-page PDFs correctly | Multi-page documents are fully processed | All pages sent to OCR; extracted fields from full document, not just page 1 |
| E06-US013 | Accountant | Reclassify a misclassified document | OCR mistakes can be corrected | Manual classification override; re-runs extraction with new type |
| E06-US014 | System | Log each pipeline stage | Debugging is possible | pipeline_runs row per stage: virus_scan, ocr, classification, extraction, validation |
| E06-US015 | System | Retry failed OCR with exponential backoff | Transient Textract errors are handled | Max 3 retries: 1s, 4s, 16s; if all fail → manual processing route |

---

## Epic 7: Human-in-the-Loop Review (E07)

| ID | As a | I want to | So that | Acceptance Criteria |
|----|------|-----------|---------|-------------------|
| E07-US001 | Accountant | See a prioritized review queue | I process the most urgent documents first | Queue sorted by priority (high→low); high = red badge |
| E07-US002 | Accountant | Accept an extracted field as correct | The value is confirmed | review_state = accepted; final_value = normalized_value |
| E07-US003 | Accountant | Correct an extracted field value | OCR errors are fixed | New value entered; review_state = corrected; original stored |
| E07-US004 | Accountant | Reject a document | It cannot be processed | document.status = rejected; client notified to resubmit |
| E07-US005 | System | Lock a document while in review | No conflicting changes | locked_by set when accountant opens; expires in 30 min; auto-released |
| E07-US006 | Accountant | See a lock conflict message | I know someone else is reviewing | "In behandeling door [Name] — vrij om [time]" displayed |
| E07-US007 | System | Prevent concurrent review submissions | No data conflicts | Optimistic locking with If-Match header; 409 on conflict |
| E07-US008 | Accountant | See two conflicting field values side-by-side | I can choose the right one | Conflict UI shows source A vs source B with provenance |
| E07-US009 | Accountant | Submit a review with a reason code | The audit trail is meaningful | reason_code dropdown (ocr_error, format_difference, etc.); required on corrections |
| E07-US010 | System | Notify the client when a document is rejected | They know to resubmit | Email sent in client's preferred language within 5 min |
| E07-US011 | Accountant | See the bounding box of an extracted field on the document image | I can verify accuracy visually | Field highlighted on document image (Textract bounding box data) |
| E07-US012 | System | Require human review for Box 2 income > €10,000 | High-value items always have oversight | Mandatory flag; cannot auto-approve regardless of confidence |
| E07-US013 | Accountant | See the full extraction history for a field | I can audit what changed | Timeline of raw→normalized→corrected values with timestamps |
| E07-US014 | Accountant | Approve multiple fields at once (bulk accept) | I process clean documents quickly | Select all high-confidence fields → bulk accept |
| E07-US015 | System | Update the readiness score immediately on review completion | Engagement dashboard reflects reality | Score recalculated within 2 seconds of review submission |

---

## Epic 8: Readiness Scoring (E08)

| ID | As a | I want to | So that | Acceptance Criteria |
|----|------|-----------|---------|-------------------|
| E08-US001 | Accountant | See the readiness score on the engagement | I know at a glance how complete it is | Score 0–100 shown as circular gauge; color-coded |
| E08-US002 | Accountant | See the formula breakdown | I understand the score | doc_score×0.40, checklist×0.30, verification×0.20, review×0.10 shown |
| E08-US003 | System | Recalculate score automatically on every change | Score is always up to date | Triggers: document accepted, checklist updated, review submitted |
| E08-US004 | Accountant | See which component is dragging the score down | I know what to prioritize | Lowest-scoring component highlighted with actionable tip |
| E08-US005 | Client | See my readiness progress | I know how complete my intake is | Score shown in client portal (without formula breakdown) |
| E08-US006 | System | Store a snapshot of every score calculation | Audit trail is complete | readiness_snapshots row per recalculation with all 4 components |
| E08-US007 | Accountant | Override a score component | Edge cases are handled | Override requires reason; shown as "Score overschreven" badge; audit logged |
| E08-US008 | System | Treat a waived DocumentRequest as "accepted" for doc_score | Waivers count | req_{stable_key} inherits checklist item accepted/waived status |
| E08-US009 | Accountant | See the score history over time | I understand the engagement trajectory | Score history chart in overview tab (readiness_snapshots) |
| E08-US010 | Firm manager | See readiness scores across all engagements | I have portfolio-level view | Dashboard sorted by score; filter by threshold (e.g., < 80) |
| E08-US011 | System | Send notification when score reaches 80 | Accountant is alerted at ready-for-review | Notification created; email sent to assigned accountant |
| E08-US012 | System | Never allow score > 100 or < 0 | Data integrity | Clamped to [0, 100] always |
| E08-US013 | Accountant | See how many engagements are below 50% | I prioritize laggards | Count shown in firm dashboard with link to filtered list |
| E08-US014 | System | Handle the case where no checklist items exist | Score is still meaningful | If checklist empty: checklist_score = 100 (N/A gives full credit) |
| E08-US015 | Accountant | See persona-specific score adjustments | ZZP: Wet DBA must be resolved | Persona adjustments shown as warnings below score (not affecting formula) |

---

## Epic 9: Checklist Management (E09)

| ID | As a | I want to | So that | Acceptance Criteria |
|----|------|-----------|---------|-------------------|
| E09-US001 | System | Auto-generate checklist on engagement creation | No manual setup needed | Template matched by persona + year; items created with status=todo |
| E09-US002 | Accountant | See checklist items in NL, EN, or FA | My client understands | Label shown in the user's current language preference |
| E09-US003 | Accountant | Mark a checklist item as waived | Optional items can be dismissed | Item status → waived; score updated; reason stored |
| E09-US004 | Accountant | Add a custom checklist item | Edge cases not in the template | Free-form label in NL/EN/FA; stable_key auto-generated |
| E09-US005 | Accountant | Remove a custom checklist item | It was added by mistake | Soft-delete; only before it is accepted |
| E09-US006 | System | Update checklist item status when document is accepted | Checklist reflects document pipeline | checklist_item_states updated when document_request linked to stable_key is accepted |
| E09-US007 | Accountant | See which items are blocking the score | I know what the client still needs to do | Items marked todo/rejected shown with priority indicator |
| E09-US008 | Client | See the checklist in my preferred language | I know what to submit in my language | Labels in NL/EN/FA based on client.preferred_lang |
| E09-US009 | Accountant | Reorder checklist items | I surface the most urgent items | Drag-to-reorder; sort_order updated |
| E09-US010 | Admin | Create a new checklist template | A new year's template is ready | Template with persona + year; items added to it |
| E09-US011 | Admin | Update an existing checklist template | Rules change between years | New version created; existing engagements not affected |
| E09-US012 | Accountant | Copy a checklist template from last year | I don't start from scratch | Copies items; strips stable_keys that no longer apply |
| E09-US013 | Accountant | See completion % of the checklist | I know overall progress | (accepted + waived) / total × 100 |
| E09-US014 | System | Link each document request to a checklist item | Score integration works | document_requests.stable_key = 'req_' + checklist_items.stable_key |
| E09-US015 | Accountant | Send a reminder to the client for pending items | Client uploads complete | Email in client's language listing all todo items |

---

## Epic 10: AI Tax Q&A (E10)

| ID | As a | I want to | So that | Acceptance Criteria |
|----|------|-----------|---------|-------------------|
| E10-US001 | ZZP client | Ask a tax question in Dutch | I get an accurate answer | Response cites source_url; follows expected_ai_behavior |
| E10-US002 | Expat client | Ask a tax question in English | I get the same quality answer in English | RAG retrieves same chunks; response in English |
| E10-US003 | Iranian client | Ask a tax question in Persian | I get a full answer in Persian | Response in Persian; RTL layout; no incomplete translations |
| E10-US004 | Client | See the source URL for every tax fact cited | I can verify the answer | Source URLs shown as badges below each claim |
| E10-US005 | Client | Get a streaming response | I see the answer appearing while it's generated | SSE stream; first token within 2s; full response within 8s |
| E10-US006 | Accountant | See the full chat history for an engagement | I know what the AI told my client | Chat thread visible in engagement workspace |
| E10-US007 | Client | Ask a follow-up question in the same thread | Context is maintained | Thread persists; previous messages in context |
| E10-US008 | System | Apply the expected_ai_behavior field to the response | AI calibrates its confidence correctly | answer_directly / answer_with_caveat / refer_to_advisor respected |
| E10-US009 | System | Fall back to mock mode when API key is absent | Dev environment works without billing | Mock response returned; yellow "mock mode" banner shown |
| E10-US010 | Client | Ask about the home office deduction | I learn it's generally not applicable for ZZP | AI gives direct answer citing the misconception rule |
| E10-US011 | Client | Ask about startersaftrek | I'm warned it's the last year in 2026 | AI notes expiry clearly; cites SA-2026-001 |
| E10-US012 | System | Cascade-retrieve rule_ids from Q&A pairs | Full context is in the response | When Q&A chunk retrieved, its rule_ids are also fetched |
| E10-US013 | Client | See suggested questions when chat is empty | I know what to ask | 3 suggested questions shown in the user's language |
| E10-US014 | System | Filter RAG results by user_type | Employee doesn't get ZZP-only rules | user_type metadata filter applied on every retrieve() call |
| E10-US015 | Client | Start a new conversation | Old context doesn't contaminate my new question | New thread created; previous messages not in context |

---

## Epic 11: Tax Calculator (E11)

| ID | As a | I want to | So that | Acceptance Criteria |
|----|------|-----------|---------|-------------------|
| E11-US001 | ZZP user | Enter my profit and get a total tax estimate | I know how much to reserve monthly | calculator(profile) returns total_tax, effective_rate, monthly_reserve |
| E11-US002 | ZZP user | See each deduction applied step-by-step | I understand my tax bill | Breakdown: profit → ZA → SA → MKB → taxable income → Box1 → credits |
| E11-US003 | ZZP user | See ZVW bijdrage calculated separately | I'm aware of the hidden health tax | ZVW shown as separate line item; "Vergeet de ZVW niet" note |
| E11-US004 | Employee | Calculate my tax with jaaropgave data | I verify what my employer already withheld | Input: gross salary, tax_withheld; output: balance due/refund |
| E11-US005 | Expat | Calculate with 30% ruling applied | I see my effective rate correctly | 30% ruling reduction applied to taxable income per year 1-3/4/5 |
| E11-US006 | DGA | Calculate Box 1 (salary) + Box 2 (dividend) | I optimize the salary/dividend split | Separate Box 1 and Box 2 calculations; combined effective rate shown |
| E11-US007 | System | Read all tax rates from phase1/data/seed JSON | No hardcoded values are used | data_loader.py reads all values; no literals in calculator code |
| E11-US008 | System | Run 6 seed scenarios with 0.0% error | Calculator is deterministic and accurate | test_scenarios.py passes with 0.0% error on all 6 scenarios |
| E11-US009 | ZZP user | See my zorgtoeslag eligibility | I know if I qualify | If income < €40,857: zorgtoeslag_eligible=True; cliff warning at €40,800 |
| E11-US010 | ZZP user | See my huurtoeslag eligibility | I claim all benefits I qualify for | Checked with 2026 reform (no rent ceiling) |
| E11-US011 | ZZP user | See Wet DBA risk assessment | I know my compliance status | Risk level: low/medium/high + reasons |
| E11-US012 | Client | See calculation in my preferred language | I understand the output | All labels in NL/EN/FA; amounts formatted per language |
| E11-US013 | System | Return calculation within 100ms (P95) | UI feels responsive | Performance test in CI; alert if P95 > 100ms |
| E11-US014 | Accountant | See the client's last calculator result | I understand their situation | Most recent TaxResult stored per engagement |
| E11-US015 | ZZP user | Calculate pension deduction (lijfrente jaarruimte) | I maximize pension savings | LR-2026-001: 30% × (income − €19,172) with floor 0 |

---

## Epic 12: Deduction Opportunity Scanner (E12)

| ID | As a | I want to | So that | Acceptance Criteria |
|----|------|-----------|---------|-------------------|
| E12-US001 | ZZP user | See a list of deductions I may have missed | I don't leave money on the table | Opportunities listed with estimated saving and confidence |
| E12-US002 | ZZP user | Be warned startersaftrek ends after 2026 | I claim it this year | Alert shown if user qualifies and tax_year = 2026; expires 2026-12-31 |
| E12-US003 | ZZP user with 1200 hrs | See zelfstandigenaftrek opportunity | I don't miss €1,200 | rule_confidence = 0.65 (hours estimated); note "Upload urenstaat to increase confidence" |
| E12-US004 | ZZP user near €40,857 | See zorgtoeslag cliff warning | I can plan my invoicing | Warning at €40,000+; "Stay below €40,857 to keep zorgtoeslag" |
| E12-US005 | Expat | See 30% ruling phase-down status | I adjust my expectations | Year 4 = 20%, Year 5 = 10%; shown clearly |
| E12-US006 | DGA | See gebruikelijk loon reminder | I pay myself at least €56,000 | Alert if DGA salary < €56,000 |
| E12-US007 | ZZP user | See KIA opportunity if investing > €2,901 | I claim the investment deduction | KIA-2026-001; requires FACTUUR_INKOMEND evidence |
| E12-US008 | Accountant | Review all opportunities before client sees them | No incorrect advice is delivered | Opportunities in "presented" status only after accountant approval |
| E12-US009 | System | Expire SA-2026-001 after 2026-12-31 | Outdated opportunities are removed | effective_until filter removes expired opportunities automatically |
| E12-US010 | Client | Dismiss a deduction opportunity | It's not applicable to me | Status → dismissed; won't re-appear; accountant notified |
| E12-US011 | Client | Accept a deduction opportunity | I want to pursue it | Status → accepted; evidence requirements shown |
| E12-US012 | System | Compute deduction confidence as rule × evidence | Confidence reflects completeness | deduction_confidence = rule_confidence × evidence_completeness |
| E12-US013 | Client | Upload evidence for a deduction opportunity | I prove I qualify | Document upload linked to evidence_requirement; completeness recalculated |
| E12-US014 | System | Show misconception alert for home office | A common mistake is avoided | alert shown when home office keyword detected in chat |
| E12-US015 | Accountant | See estimated tax saving per opportunity | I prioritize the most valuable | Sorted by estimated_saving descending by default |

---

## Epic 13: IB Return Guide (E13)

| ID | As a | I want to | So that | Acceptance Criteria |
|----|------|-----------|---------|-------------------|
| E13-US001 | ZZP user | See plain-language explanation for field "1a" | I don't make entry mistakes | label_nl, label_en, label_fa all populated; explanation shown |
| E13-US002 | Expat | See the IB guide in English | I file correctly as a non-Dutch speaker | All 9 IB fields explained in English |
| E13-US003 | Iranian client | See the IB guide in Persian | I understand the form in my language | All 9 IB fields explained in Persian; RTL layout |
| E13-US004 | Client | See common mistakes for each field | I avoid known errors | common_mistakes shown as a warning list per field |
| E13-US005 | Client | See AI follow-up questions for each field | I get proactive guidance | ai_follow_up_questions trigger AI chat suggestions |
| E13-US006 | Client | Navigate fields in order | I complete the form systematically | Previous/Next navigation; progress indicator |
| E13-US007 | Client | See which IB fields are relevant to my persona | Irrelevant fields are filtered out | ZZP-specific fields shown to ZZP users; employee fields for employees |
| E13-US008 | System | Map IB form fields to tax rules | Context is complete | ib_form_mapping.json has rule_ids for each field; RAG retrieves them |
| E13-US009 | Accountant | Add a note to a specific IB field for a client | I give client-specific guidance | Note attached to ib_field × engagement; visible to client |
| E13-US010 | Client | See the Belastingdienst source URL for each field | I can go to the official source | source_url from ib_form_mapping.json shown as link |
| E13-US011 | Client | See a worked example for a complex field | I understand what values to enter | Scenario-based example (e.g., "For a ZZP with €72k profit, field 1a = ...") |
| E13-US012 | Accountant | See all IB guide interactions for a client | I know where they struggled | Chat thread shows IB-related questions |
| E13-US013 | System | Link IB guide to AI chat | Questions about fields trigger relevant RAG | ib_field_chunker data in RAG corpus; retrieved when field is mentioned |
| E13-US014 | Client | Mark a field as "completed" | I track my progress through the form | Field status persisted per engagement; progress bar advances |
| E13-US015 | Client | Export the IB guide as a PDF checklist | I have a reference for filing | PDF with all fields, explanations, and their notes |

---

## Epic 14: Rule Management (E14)

| ID | As a | I want to | So that | Acceptance Criteria |
|----|------|-----------|---------|-------------------|
| E14-US001 | Tax SME | Create a new tax rule | New rules are in the knowledge base | All required fields; starts as draft; not served until verified |
| E14-US002 | Tax SME | Update a rule's value (e.g., new year's rate) | The calculator uses the latest value | New rule_version created; old version archived |
| E14-US003 | Tax SME | Set effective_until for expiring rules | SA-2026-001 stops being served after 2026 | effective_until filter applied in RAG retriever |
| E14-US004 | Tax SME | Add AI prompt hint to a rule | AI behavior for this rule is guided | ai_prompt_hint appears in assembled context |
| E14-US005 | Tax SME | Add NL/EN/FA content to every rule | Three-language parity is maintained | All three plains required; validation error if any missing |
| E14-US006 | Tax SME | Run test cases against a rule | Logic is verified before publishing | rule_test_cases run; results shown; fail = blocked from publishing |
| E14-US007 | Firm manager | Approve a rule update | Four-eyes principle is enforced | Approve button; requires role = firm_manager or tax_sme (different from author) |
| E14-US008 | Admin | Publish an approved rule | It goes live in RAG | verification_status → verified; build_index.py queued to re-embed |
| E14-US009 | Tax SME | Supersede an old rule with a new one | Prior year rules are linked | supersedes field points to old rule_id |
| E14-US010 | Tax SME | View rule version history | I can track changes over time | All versions shown with diff view |
| E14-US011 | System | Shadow-test new rules on 1% of traffic | Rollout is safe | Shadow mode flag; result logged but not served to user |
| E14-US012 | Tax SME | Add test cases with expected outputs | Regression testing is automatic | test case stored; runs in CI via test_scenarios.py |
| E14-US013 | Admin | View all rules with filters | I have an overview of the rule set | Filter by year, category, user_type, verification_status |
| E14-US014 | Tax SME | Export the full rule set to JSON | I have an offline reference | Exports tax_rules_{year}.json format (Phase 1 compatible) |
| E14-US015 | System | Trigger RAG re-index after rule publish | New rule appears in retrieval immediately | build_index.py triggered automatically after publish; email confirmation |

---

## Epic 15: Admin Console (E15)

| ID | As a | I want to | So that | Acceptance Criteria |
|----|------|-----------|---------|-------------------|
| E15-US001 | Admin | View all firms with subscription status | I have operational oversight | Table with firm, plan, usage, last_active; export to CSV |
| E15-US002 | Admin | Enable a feature flag for a specific firm | I roll out features gradually | Toggle per firm; effective within 5s |
| E15-US003 | Admin | Fulfill a DSAR access request | GDPR compliance is maintained | Export JSON of all data for the subject; link expires 72h |
| E15-US004 | Admin | Fulfill a DSAR erasure request | Right to be forgotten is honored | Soft-delete user + client; 90-day window; legal retention exceptions |
| E15-US005 | Admin | View the audit log filtered by firm | Full traceability per firm | Filter by firm, user, action, date range |
| E15-US006 | Admin | Search audit log for a specific action | I investigate an incident | Text search across action and resource_type |
| E15-US007 | Admin | Create an incident record | Post-mortem tracking is in place | Title, severity, description, affected_system required |
| E15-US008 | Admin | Update incident status | I track resolution | Status: open → investigating → resolved → closed |
| E15-US009 | Admin | View usage metrics across all firms | I monitor platform health | AI calls, document count, engagement count per firm per month |
| E15-US010 | Admin | Impersonate a user for debugging | I can reproduce reported issues | Impersonation logged; session flagged as impersonated; time-limited |
| E15-US011 | Admin | View model and prompt versions in use | I track what AI is running in production | Table of model_versions + prompt_versions with deployed_at |
| E15-US012 | Admin | View the retention policy table | I know what data is kept how long | retention_policies CRUD; not deletable once created |
| E15-US013 | Admin | Send a platform-wide announcement | I notify all users of an important change | Message sent as in-app notification + email to all active users |
| E15-US014 | Admin | View real-time error rate from Sentry | I monitor deployment health | Embedded Sentry widget in admin console |
| E15-US015 | Admin | Rotate API keys for a firm's API client | A leaked key is invalidated | New secret generated; old one immediately revoked |

---

## Epic 16: Annual Maintenance — Phase 9 (E16)

| ID | As a | I want to | So that | Acceptance Criteria |
|----|------|-----------|---------|-------------------|
| E16-US001 | Tax SME | Update tax_rules_{year}.json after Prinsjesdag | New year's rules are ready | All 28+ rules updated with new values; validate.py passes 100% |
| E16-US002 | Tax SME | Update scenario expected values for new year | Calculator accuracy tests still pass | All 6 scenarios updated; test_scenarios.py passes with 0.0% error |
| E16-US003 | System | Re-run validate.py automatically in CI | No broken data is deployed | CI job fails if validate.py < 100% |
| E16-US004 | Tax SME | Re-build the RAG index with new rules | AI retrieves current-year rules | build_index.py run; precision@5 ≥ 95% confirmed |
| E16-US005 | Tax SME | Archive prior-year rules | Old rules don't contaminate current-year queries | verification_status → archived; year filter in retriever excludes them |
| E16-US006 | Tax SME | Create new checklist templates for the new year | Engagements for the new year use the right template | New templates: ZZP/employee/expat/DGA for year+1 |
| E16-US007 | Tax SME | Update IB form mapping for new year | Guide reflects any form changes | ib_form_mapping_{year}.json updated; validated |
| E16-US008 | Firm manager | See a "2027 tax year ready" banner | I know the system is prepared | Banner appears December 15 when all tests pass for new year |
| E16-US009 | System | Never deploy new-year data before January 1 | 2026 rules only served in 2026 | year filter enforced; effective_from = '2027-01-01' blocks premature serving |
| E16-US010 | Tax SME | Stage new-year rules in shadow mode | Soft launch before January 1 | Shadow mode serves new rules to 0% of traffic; test only |
| E16-US011 | Tax SME | Publish a "What changed in {year}" summary | Accountants understand new rules | Summary document in docs/ with diff table of changed values |
| E16-US012 | System | Run the full test suite on the new year's data | No regressions | CI pipeline with new-year data: all gates pass |
| E16-US013 | Admin | Create a new rule_sets row for the new year | Database is structured correctly | rule_sets.year = {year+1}; is_active = True from January 1 |
| E16-US014 | Tax SME | Update Q&A pairs for new year | Knowledge base reflects law changes | qa_pairs_{year+1}.json created; 12+ pairs; ground-truth rule_ids updated |
| E16-US015 | Tax SME | Run a full regression across all personas | No persona is broken by new rules | All 4 persona calculator tests pass; AI responses sampled for quality |
