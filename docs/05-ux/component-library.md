# Component Library — TaxWijs

> All shared UI components, their props interface, and usage guidance. Implementation in `ui/new-ui/src/components/`.

---

## 1. ReadinessScore

Circular progress indicator showing engagement readiness.

**Props:**
```typescript
interface ReadinessScoreProps {
  score: number;           // 0–100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  breakdown?: {
    doc_score: number;
    checklist_score: number;
    verification_score: number;
    accountant_review_score: number;
  };
}
```

**Variants:** sm (40px, used in client list), md (80px, used in sidebar), lg (120px, used in workspace header)

**Colors:** 0–39: red, 40–59: orange, 60–79: amber, 80–89: green, 90–100: dark green

---

## 2. DocumentUpload

Drag-and-drop file upload with progress and status.

**Props:**
```typescript
interface DocumentUploadProps {
  engagementId: string;
  documentRequestId?: string;  // if uploading for a specific request
  onSuccess: (document: Document) => void;
  onError?: (error: Error) => void;
  accept?: string;             // default: '.pdf,.jpg,.jpeg,.png'
  maxSizeMb?: number;          // default: 25
}
```

---

## 3. ChecklistPanel

Collapsible list of checklist items with status badges.

**Props:**
```typescript
interface ChecklistPanelProps {
  engagementId: string;
  items: ChecklistItem[];
  onItemUpdate: (stableKey: string, status: string) => void;
  readOnly?: boolean;
}
```

---

## 4. AIChat

Streaming chat interface with SSE support.

**Props:**
```typescript
interface AIChatProps {
  engagementId: string;
  threadId?: string;           // if continuing an existing thread
  userType: 'zzp' | 'employee' | 'expat' | 'dga';
  lang: 'nl' | 'en' | 'fa';
}
```

**Features:**
- Auto-detects RTL when `lang='fa'`
- Shows "typing" indicator while streaming
- Renders Markdown in responses
- Shows source URLs as clickable badges below each response

---

## 5. LanguageSwitcher

NL / EN / FA toggle button group.

**Props:**
```typescript
interface LanguageSwitcherProps {
  current: 'nl' | 'en' | 'fa';
  onChange: (lang: 'nl' | 'en' | 'fa') => void;
  compact?: boolean;  // icon-only for mobile
}
```

**Visual:** Three pills — selected one is filled, others are outlined. FA pill shows ف character.

---

## 6. StatusBadge

Coloured pill for status fields.

**Props:**
```typescript
interface StatusBadgeProps {
  status: string;
  type: 'engagement' | 'document' | 'checklist' | 'task' | 'review';
}
```

**Color mapping (engagement):**
- `intake` → grey
- `documents_pending` → blue
- `in_review` → amber
- `ready` → green
- `filed` → dark green
- `archived` → grey strikethrough

---

## 7. ConfidenceBadge

Shows OCR extraction confidence level.

**Props:**
```typescript
interface ConfidenceBadgeProps {
  confidence: number;  // 0.0–1.0
  showValue?: boolean;
}
```

**Display:**
- ≥ 0.90: Green "✓ Hoog"
- 0.75–0.89: Amber "~ Middel"
- 0.60–0.74: Orange "⚠ Controleer"
- < 0.60: Red "✗ Laag"

---

## 8. DeductionOpportunityCard

Displays a deduction opportunity with estimated saving and evidence requirements.

**Props:**
```typescript
interface DeductionOpportunityCardProps {
  opportunity: DeductionOpportunity;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  lang: 'nl' | 'en' | 'fa';
}
```

**Structure:** Rule name + estimated saving + confidence badge + evidence checklist + Accept / Dismiss buttons

---

## 9. TaxCalculatorForm

Multi-step form for tax calculation input.

**Steps:**
1. Persona selection (ZZP / employee / expat / DGA)
2. Income inputs (persona-specific)
3. Deductions and hours (ZZP: urencriterium, KIA, etc.)
4. Personal details (AOW age, children, mortgage)

**Output:** Triggers `POST /api/ai/calculator/` → renders `TaxCalculatorResult`

---

## 10. RTLWrapper

Wraps content in `dir="rtl"` when language is Persian. Used by AIChat and all text display components.

```typescript
interface RTLWrapperProps {
  lang: 'nl' | 'en' | 'fa';
  children: React.ReactNode;
}
// Renders: <div dir={lang === 'fa' ? 'rtl' : 'ltr'}>...</div>
```
