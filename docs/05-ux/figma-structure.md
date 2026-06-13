# Figma Structure — TaxWijs

> Organization of the Figma design file. Reference for designers and developers.

---

## 1. File Organization

```
TaxWijs Design System
│
├── 📁 00 — Foundations
│   ├── Colors
│   │   ├── Brand: #1A56DB (primary blue), #E1EFFE (light blue)
│   │   ├── Success: #03543F / #DEF7EC
│   │   ├── Warning: #8E4B10 / #FDFDEA
│   │   ├── Danger: #9B1C1C / #FDE8E8
│   │   └── Neutral: #111827 → #F9FAFB (9 steps)
│   ├── Typography
│   │   ├── Font: Inter (LTR) / Vazirmatn (RTL/Persian)
│   │   ├── Scale: 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 / 48
│   │   └── Weights: Regular (400), Medium (500), SemiBold (600), Bold (700)
│   ├── Spacing: 4px grid (4, 8, 12, 16, 24, 32, 48, 64, 96)
│   ├── Shadows: sm, md, lg, xl
│   └── Border radius: 4, 6, 8, 12, 16, full
│
├── 📁 01 — Components
│   ├── Atoms: Button, Input, Badge, Avatar, Icon, Tooltip
│   ├── Molecules: FormField, SearchInput, Dropdown, DatePicker
│   ├── Organisms
│   │   ├── ReadinessScore (3 sizes)
│   │   ├── DocumentUpload
│   │   ├── ChecklistPanel
│   │   ├── AIChat
│   │   ├── LanguageSwitcher
│   │   ├── StatusBadge (5 types)
│   │   ├── ConfidenceBadge
│   │   ├── DeductionOpportunityCard
│   │   └── TaxCalculatorForm
│   └── RTL Variants (duplicates of above, mirrored for Persian)
│
├── 📁 02 — Pages (Desktop)
│   ├── Login / Register / Invite Acceptance
│   ├── Dashboard (Accountant / Firm Manager / Client views)
│   ├── Client List
│   ├── Engagement Workspace (9 tabs)
│   ├── Document Review
│   ├── Admin Console
│   └── Settings
│
├── 📁 03 — Pages (Mobile)
│   ├── Client Mobile Dashboard
│   ├── Document Upload (mobile)
│   ├── AI Chat (mobile)
│   └── Checklist (mobile)
│
├── 📁 04 — Persian (RTL) Variants
│   ├── All desktop pages mirrored
│   └── Font switched to Vazirmatn
│
└── 📁 05 — Prototype Flows
    ├── Accountant: New client onboarding
    ├── Client: Upload + checklist
    ├── Accountant: Document review
    └── Client: AI chat Q&A
```

---

## 2. Color Token Naming

All colors use semantic tokens, not raw hex:

| Token | Value | Usage |
|-------|-------|-------|
| `color.brand.primary` | #1A56DB | Primary buttons, links |
| `color.brand.light` | #E1EFFE | Highlighted items, selected state |
| `color.success.text` | #03543F | Accepted status text |
| `color.success.bg` | #DEF7EC | Accepted status background |
| `color.warning.text` | #8E4B10 | Medium confidence text |
| `color.warning.bg` | #FDFDEA | Medium confidence background |
| `color.danger.text` | #9B1C1C | Low confidence, errors |
| `color.danger.bg` | #FDE8E8 | Error backgrounds |
| `color.neutral.900` | #111827 | Primary text |
| `color.neutral.500` | #6B7280 | Secondary text |
| `color.neutral.100` | #F3F4F6 | Page backgrounds |

---

## 3. Responsive Breakpoints

| Name | Width | Target |
|------|-------|--------|
| mobile | < 640px | Client phone use |
| tablet | 640–1024px | Accountant tablet |
| desktop | > 1024px | Accountant primary workspace |

Mobile-first CSS. Desktop breakpoints add complexity.

---

## 4. SVG Wireframe Cross-Reference

Wireframes in `wireframes/` match these Figma pages:

| SVG File | Figma Page |
|----------|-----------|
| `engagement-workspace-desktop.svg` | 02 Pages > Engagement Workspace |
| `engagement-workspace-mobile.svg` | 03 Pages > Engagement Workspace (mobile) |
| `client-dashboard-mobile.svg` | 03 Pages > Client Mobile Dashboard |
| `accountant-inbox-desktop.svg` | 02 Pages > Accountant Inbox |
| `readiness-view.svg` | 02 Pages > Engagement > Overview tab |
| `document-review.svg` | 02 Pages > Document Review |
| `rule-management.svg` | 02 Pages > Admin > Rule Management |
| `admin-console.svg` | 02 Pages > Admin Console |
