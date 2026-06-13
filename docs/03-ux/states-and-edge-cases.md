# States and Edge Cases — TaxWijs

> All meaningful UI states and edge cases per component. These must be designed, not discovered at runtime.

---

## 1. Readiness Score Component

| State | Score | Display |
|-------|-------|---------|
| Fresh engagement | 0 | Grey circle "0%" — "Nog geen documenten" |
| Low progress | 1–39 | Red circle |
| Medium progress | 40–59 | Orange circle |
| Good progress | 60–79 | Amber circle |
| Ready for review | 80–89 | Green circle — "Klaar voor review" |
| Complete | 90–100 | Dark green — "Compleet" |
| Score override active | any | Orange badge "Score overschreven door accountant" |

**Edge cases:**
- Score drops after a previously-accepted document is superseded → animate downward
- Score is exactly 80.0 (boundary) → show green "Ready"
- All documents accepted but checklist items outstanding → show which component lags

---

## 2. Document Upload Component

| State | Display |
|-------|---------|
| Idle | Drag-and-drop area with cloud icon |
| Dragging | Blue highlight border + "Laat los om te uploaden" |
| Uploading | Progress bar |
| Virus scan | Spinner "Beveiliging controleren..." |
| Classification | Spinner "Document herkennen..." |
| Success | Green checkmark + detected document type |
| Virus found | Red error "Bestand bevat een bedreiging — upload opnieuw" |
| File too large | Error "Bestand te groot (max 25 MB)" |
| Wrong mime type | Error "Alleen PDF, JPG, PNG toegestaan" |
| Network error | Error + "Opnieuw proberen" button |

**Edge cases:**
- User uploads same document twice → system detects duplicate (same hash) → warn: "Dit lijkt een duplicaat" — but allow if different filename
- User uploads a document after the accountant has already accepted one of the same type → "Er is al een goedgekeurde [JAAROPGAVE]. Weet je zeker dat je dit wil vervangen?"
- Upload of 0-byte file → "Leeg bestand — selecteer een geldig document"

---

## 3. AI Chat Component

| State | Display |
|-------|---------|
| Idle | Empty chat with suggested questions |
| Loading (waiting for first token) | Typing indicator (3 dots) |
| Streaming | Text appears word by word |
| Complete | Full response with source citations |
| Error (API down) | "AI tijdelijk niet beschikbaar — probeer het later opnieuw" |
| Mock mode | Yellow banner: "Mock mode actief — verbind ANTHROPIC_API_KEY voor echte antwoorden" |
| Context limit | "Te veel berichten — start een nieuw gesprek" |

**Edge cases:**
- User types in Persian → response in Persian (RTL layout activates for response bubble)
- User switches language mid-conversation → "Taalwissel gedetecteerd — volgende antwoord in [new lang]"
- Response cites a URL that is now 404 → show citation but mark as "[link niet beschikbaar]"
- Question about a misconception (home office) → AI answers directly with "Dit is een veelgemaakte misvatting"
- Startersaftrek question in 2027 → AI explains it was abolished after 2026

---

## 4. Checklist Panel

| State | Item Display |
|-------|-------------|
| todo | Grey circle + label |
| uploaded | Blue circle + "Wacht op beoordeling" |
| accepted | Green checkmark + "Goedgekeurd" |
| waived | Grey strikethrough + "Niet van toepassing" |
| rejected | Red X + reason |

**Edge cases:**
- Waived required item → score still counts it as waived (not accepted = no full credit)
- All items accepted but readiness < 80 → show which other component is still low
- Accountant tries to accept a checklist item without a linked document → "Koppel eerst een document"

---

## 5. Review Queue (Accountant)

| State | Display |
|-------|---------|
| Empty queue | "Geen documenten in wachtrij" with green checkmark |
| Item locked by another accountant | Greyed out with "In behandeling door [Name] — vrij om [time]" |
| Lock expired | Available again with "Slot verlopen" note |
| High priority | Red badge "DRINGEND" |

**Edge cases:**
- Network timeout during review submission → show retry prompt; don't lose field decisions already made
- Accountant submits review while another has already submitted (race) → 409 OPTIMISTIC_LOCK_FAILED → reload and show merged result

---

## 6. Empty States

Every list view has an intentional empty state:

| View | Empty State Copy (NL) |
|------|----------------------|
| Client list | "Nog geen klanten — voeg je eerste klant toe" + "Klant toevoegen" button |
| Engagement list | "Nog geen dossiers voor dit jaar" + "Dossier starten" button |
| Document list | "Nog geen documenten geüpload" + "Document uploaden" button |
| Review queue | "Wachtrij is leeg — alle documenten zijn beoordeeld ✓" |
| Tasks | "Geen openstaande taken" |
| AI chat | "Stel een belastingvraag..." with 3 suggested questions |
| Notifications | "Geen nieuwe meldingen" |
