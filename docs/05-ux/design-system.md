# Design System

> TaxWijs UI design tokens, components, and patterns.
> Standard: WCAG 2.1 Level AA. Supports NL/EN (LTR) and FA (RTL).
> Updated: 2026-06-13

---

## Design Principles

1. **Clarity over cleverness** — Tax is already confusing. The UI makes things simpler.
2. **Progressive disclosure** — Show only what's needed. Reveal complexity on demand.
3. **Multilingual-first** — Every component supports NL, EN, and FA. FA uses RTL layout.
4. **Accessible by default** — Color is never the only signal. Contrast ratios enforced.
5. **Data-dense but not overwhelming** — Tables and lists use whitespace, not decoration.

---

## Color Tokens

### Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-brand-primary` | `#2563EB` | Primary buttons, active nav, links |
| `--color-brand-primary-hover` | `#1D4ED8` | Hover state for primary |
| `--color-brand-primary-light` | `#EFF6FF` | Backgrounds, selected rows |
| `--color-brand-accent` | `#0EA5E9` | Secondary highlights |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | `#22C55E` | Readiness ≥75, approved status |
| `--color-success-light` | `#DCFCE7` | Success backgrounds |
| `--color-warning` | `#F59E0B` | Readiness 50–74, due-soon |
| `--color-warning-light` | `#FEF3C7` | Warning backgrounds |
| `--color-error` | `#EF4444` | Readiness <50, rejected, error |
| `--color-error-light` | `#FEE2E2` | Error backgrounds |
| `--color-info` | `#6366F1` | Informational, AI responses |
| `--color-info-light` | `#EEF2FF` | Info backgrounds |

### Neutral Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-gray-50` | `#F9FAFB` | Page backgrounds |
| `--color-gray-100` | `#F3F4F6` | Card backgrounds, alternating rows |
| `--color-gray-200` | `#E5E7EB` | Borders, dividers |
| `--color-gray-400` | `#9CA3AF` | Placeholder text, disabled |
| `--color-gray-600` | `#4B5563` | Secondary text |
| `--color-gray-800` | `#1F2937` | Primary text |
| `--color-gray-900` | `#111827` | Headings |

### Readiness Ring Colors (functional, not semantic)

| Score Range | Color | Token |
|-------------|-------|-------|
| 0–49 | `#EF4444` | `--color-error` |
| 50–74 | `#F59E0B` | `--color-warning` |
| 75–84 | `#22C55E` | `--color-success` |
| 85–100 | `#16A34A` | `--color-success-dark` |

---

## Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-family-sans` | `Inter, system-ui, sans-serif` | All UI text |
| `--font-family-mono` | `JetBrains Mono, monospace` | Code, rule_ids, form field codes |
| `--font-family-fa` | `Vazir, system-ui, sans-serif` | Persian text (RTL) |
| `--font-size-xs` | `0.75rem` (12px) | Labels, badges |
| `--font-size-sm` | `0.875rem` (14px) | Body small, table cells |
| `--font-size-base` | `1rem` (16px) | Body text |
| `--font-size-lg` | `1.125rem` (18px) | Subheadings |
| `--font-size-xl` | `1.25rem` (20px) | Section headings |
| `--font-size-2xl` | `1.5rem` (24px) | Page headings |
| `--font-size-3xl` | `1.875rem` (30px) | Hero headings |
| `--font-weight-regular` | `400` | |
| `--font-weight-medium` | `500` | Labels, nav items |
| `--font-weight-semibold` | `600` | Headings, important values |
| `--font-weight-bold` | `700` | Prominent figures (tax amounts) |
| `--line-height-tight` | `1.25` | Headings |
| `--line-height-base` | `1.5` | Body text |
| `--line-height-relaxed` | `1.75` | AI chat responses, explanations |

---

## Spacing Scale

Follows a 4px base unit:

| Token | Value |
|-------|-------|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |
| `--space-16` | `64px` |

---

## Breakpoints

| Name | Min Width | Usage |
|------|-----------|-------|
| `xs` | 0 | Mobile portrait (minimum supported: 375px) |
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop (primary target) |
| `xl` | 1280px | Wide desktop |

---

## Core Components

### Button

Variants: `primary` | `secondary` | `ghost` | `danger`

Sizes: `sm` | `md` (default) | `lg`

States: default | hover | active | disabled | loading (spinner)

```
Primary:  bg-brand-primary, text-white, rounded-lg, px-4 py-2
Secondary: bg-white, border-gray-200, text-gray-800
Ghost:    transparent, text-brand-primary, underline on hover
Danger:   bg-error, text-white
```

All buttons: `min-height: 44px` (touch target) when interactive.

### Badge / Status Pill

Used for engagement status, document status, priority.

```
Variants: success | warning | error | info | neutral
Sizes: sm | md
Shape: rounded-full
```

Examples:
- `verified` → success badge (green)
- `needs_review` → warning badge (amber)
- `rejected` → error badge (red)
- `required` → error badge (red)
- `recommended` → info badge (blue)

### ProgressRing

SVG-based circular progress indicator for readiness score.

```
Props:
  score: 0-100
  size: "sm" (48px) | "md" (80px) | "lg" (120px)
  showLabel: boolean (shows score number in center)
  animated: boolean (transition on mount)

Color: determined by score range (see color tokens above)
Accessible: aria-valuenow={score}, aria-label="Readiness {score}%"
```

### ProgressBar

Linear progress bar for checklist completion and dimension breakdowns.

```
Props:
  value: 0-100
  color: "success" | "warning" | "error" | "brand"
  label: string
  showValue: boolean
Height: 8px, border-radius: 4px
```

### DataTable

Reusable table with sorting, filtering, and pagination.

Features:
- Column headers are sortable (click to sort ascending/descending)
- Row hover state
- Sticky header on scroll
- Empty state with illustration
- Loading skeleton rows (3 rows, animated)
- Pagination: "Showing X–Y of Z"

### DocumentUploadZone

Drag-and-drop file upload area.

```
States: idle | dragging-over | uploading | success | error
Accepted types: shown in the zone (PDF, JPG, PNG, HEIC)
Max size: shown in the zone (20 MB)
Mobile: "Browse files" button instead of drag text
```

### ConfidenceBar

Shows OCR confidence score as a colored bar (0.0–1.0).

```
0.0–0.70: error (red)
0.71–0.84: warning (amber)
0.85–1.00: success (green)
```

### ChatBubble

Used in both AI chat and portal messaging.

```
User bubble: right-aligned, brand-primary-light background
Assistant/accountant bubble: left-aligned, gray-100 background
System message: centered, gray-400 text, smaller font
Citations: below assistant bubble, linked as underlined URLs
Streaming: animated typing indicator (3 dots) while SSE is active
```

### ReadinessRing + Breakdown (composite)

Used on both portals' dashboards and engagement overview tab.

Layout:
```
[ProgressRing (lg)]   [Score: 72%]
                      Documents:   ████████░░  80%  (40% weight)
                      Checklist:   ██████░░░░  60%  (30% weight)
                      Verification:████░░░░░░  40%  (20% weight)
                      Acct Review: █████░░░░░  50%  (10% weight)
```

### AlertBanner

Full-width banner for important notices (above the main content).

Variants: `info` | `warning` | `error` | `success`

Used for:
- Startersaftrek expiry warning (2026 last year)
- ZVW "hidden tax" reminder
- Zorgtoeslag income cliff warning
- Engagement ready to file

---

## Layout Patterns

### Split Panel (Document Review)

```
┌─────────────────┬──────────────────────────────┐
│ Document List   │ Document Preview              │
│ (280px fixed)   │ ─────────────────────────── │
│                 │ Extracted Fields Table        │
│ • Filename      │ ┌──────────┬────────────┐   │
│ • Type badge    │ │ Field    │ Value      │   │
│ • Status        │ ├──────────┼────────────┤   │
│ • Confidence    │ │ Salary   │ €48,000    │   │
│                 │ │ Tax wth. │ €8,200     │   │
└─────────────────┴──────────────────────────────┘
```

On mobile: stacked vertically (list first, detail second on tap).

### KPI Tiles Row

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Active   │ │ Ready to │ │ Missing  │ │ Avg      │
│ 24       │ │ File  3  │ │ Docs  7  │ │ Score 68%│
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

## Accessibility Requirements

| Requirement | Implementation |
|-------------|---------------|
| Color contrast | ≥ 4.5:1 for normal text, ≥ 3:1 for large text (tested) |
| Focus ring | `outline: 2px solid var(--color-brand-primary)` on all focusable elements |
| Keyboard navigation | Tab order follows visual order. All interactions keyboard-reachable. |
| Screen reader | ARIA labels on all icons, status badges, progress rings |
| Error messages | Linked to form fields via `aria-describedby`. Not only colored. |
| Motion | All animations respect `prefers-reduced-motion` media query |
| Language | `<html lang="nl">` (or `en`/`fa`), updated on language switch |
| RTL | `<body dir="rtl">` when FA active. All flex/grid mirrors correctly. |

---

## RTL (Persian) Adaptations

When language = FA:
- `dir="rtl"` on `<body>` and all text containers
- Flex row reverses: left sidebar becomes right sidebar
- Icon positions mirror (checkmark, arrow directions)
- Font switches to `Vazir` (Persian-optimized, includes correct numeral forms)
- Navigation order reverses on mobile bottom bar
- Chat bubbles: user bubble on left (natural RTL reading direction)
- Form inputs: text-align right, labels on right

---

## Dark Mode

Dark mode is a **v2 feature** (not in v1.0 scope). Color tokens are named semantically to enable a future dark theme by overriding CSS custom properties.
