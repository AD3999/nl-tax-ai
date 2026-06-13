# Accessibility Specification

> Standard: WCAG 2.1 Level AA
> Updated: 2026-06-13

---

## Target Standard

TaxWijs targets **WCAG 2.1 Level AA** compliance across all P0 and P1 screens. Level AAA is aspirational for high-traffic screens (dashboard, chat).

---

## Testing Requirements

Every P0 screen must pass:

1. **Automated scan** — axe-core (via `@axe-core/react`) with 0 critical violations
2. **Keyboard navigation** — Every interactive element reachable and operable via keyboard only
3. **Color contrast check** — All text meets 4.5:1 (normal) or 3:1 (large ≥18px or bold ≥14px)
4. **Screen reader test** — Tested with NVDA (Windows) + Chrome, VoiceOver (Mac) + Safari
5. **Zoom test** — Content readable and functional at 200% browser zoom without horizontal scrolling

---

## Keyboard Navigation

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` / `Shift+Tab` | Move through interactive elements |
| `Enter` / `Space` | Activate button or link |
| `Escape` | Close modal, dropdown, or tooltip |
| `Arrow keys` | Navigate within a component (tabs, dropdown options) |

### Skip Links

Every page must have a "Skip to main content" link as the first focusable element:

```html
<a href="#main-content" class="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Tab Order

Tab order must follow the visual reading order. Specific requirements:

- Modal dialogs trap focus until closed
- After closing a modal, focus returns to the triggering element
- Dropdown menus: `Arrow keys` to navigate options, `Enter` to select, `Escape` to close
- Chat input: `Tab` enters the input, `Enter` sends the message, `Shift+Enter` inserts newline

---

## Color Contrast Ratios

| Element | Requirement | Implementation |
|---------|-------------|---------------|
| Normal body text (< 18px) | ≥ 4.5:1 | `#1F2937` on `#FFFFFF` = 15.3:1 ✓ |
| Large text (≥ 18px or bold ≥ 14px) | ≥ 3:1 | `#4B5563` on `#FFFFFF` = 7.5:1 ✓ |
| Placeholder text | ≥ 4.5:1 | `#9CA3AF` on `#FFFFFF` = 2.8:1 ✗ → use `#6B7280` (5.9:1) |
| Disabled text | No requirement | Clearly visually distinct |
| Focus ring | ≥ 3:1 against adjacent colors | `#2563EB` on white = 5.9:1 ✓ |
| Error text | ≥ 4.5:1 | `#B91C1C` on white = 5.7:1 ✓ |
| Status badge text | ≥ 4.5:1 | Verified per badge variant |

**Note:** `#9CA3AF` (gray-400) fails 4.5:1 and must NOT be used for meaningful text. Use only for decorative elements.

---

## ARIA Patterns

### Status Badges

```html
<span class="badge badge-warning" role="status" aria-label="Status: Needs review">
  Needs review
</span>
```

### ProgressRing

```html
<div role="progressbar" aria-valuenow="72" aria-valuemin="0" aria-valuemax="100"
     aria-label="Readiness score: 72%">
  <!-- SVG circle -->
</div>
```

### Loading States

```html
<div aria-live="polite" aria-atomic="true">
  <span class="sr-only">Loading documents...</span>
</div>
```

For skeleton screens: `aria-busy="true"` on the containing region.

### Chat Streaming

```html
<div role="log" aria-live="polite" aria-label="AI response">
  <!-- Streaming tokens appended here -->
</div>
```

### Document Upload

```html
<div role="region" aria-label="Document upload area"
     aria-dropeffect="copy">
  <input type="file" aria-describedby="upload-help" />
  <p id="upload-help">PDF, JPG, PNG or HEIC — maximum 20 MB</p>
</div>
```

### Error Messages

```html
<label for="email">Email address</label>
<input id="email" type="email" aria-invalid="true"
       aria-describedby="email-error" />
<span id="email-error" role="alert">
  Please enter a valid email address
</span>
```

### Modal Dialog

```html
<div role="dialog" aria-modal="true" aria-labelledby="modal-title"
     aria-describedby="modal-description">
  <h2 id="modal-title">Confirm account deletion</h2>
  <p id="modal-description">This action is irreversible...</p>
  <!-- content -->
</div>
```

### Navigation

```html
<nav aria-label="Client portal navigation">
  <ul role="list">
    <li>
      <a href="/portal" aria-current="page">Dashboard</a>
    </li>
    <!-- ... -->
  </ul>
</nav>
```

---

## Screen Reader Support

### NVDA (Windows) + Chrome — Primary

All interactive elements must be announced correctly:
- Buttons: announced as "button"
- Links: announced as "link"
- Form fields: announced with label
- Error messages: announced via `role="alert"` or `aria-live="polite"`
- Status changes (readiness update): announced via `aria-live`

### VoiceOver (Mac) + Safari — Secondary

Same requirements. Test particularly:
- Carousel/tab navigation (`role="tablist"`, `role="tab"`, `aria-selected`)
- Chat message feed (`role="log"`, `aria-live="polite"`)

---

## RTL Accessibility (Persian / FA)

When `lang="fa"` and `dir="rtl"`:

- `lang` attribute on `<html>` element must be updated to `"fa"` — screen readers use this for pronunciation
- `dir="rtl"` on `<body>` — affects CSS mirroring
- Persian numerals: use `Intl.NumberFormat` with `{locale: "fa-IR"}` for Farsi number display
- Tab order: follows visual order in RTL direction
- Icons that convey direction (arrows, back/forward) must be mirrored via CSS `scale(-1, 1)` or SVG flip

---

## Motion and Animation

All animations must respect `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  .readiness-ring { transition: none; }
  .skeleton-shimmer { animation: none; background: var(--color-gray-100); }
  .chat-typing-dots { animation: none; }
}
```

Motion that may cause vestibular issues (parallax, auto-playing video) is not used in TaxWijs.

---

## Form Accessibility Requirements

Every form field must have:
1. A visible `<label>` or an `aria-label` / `aria-labelledby`
2. An associated error message when invalid (`aria-describedby`)
3. `aria-invalid="true"` when the field has a validation error
4. Required fields marked with both `required` attribute AND a visual indicator (asterisk + legend)

Currency inputs:
- Labeled clearly: "Annual profit (€)" — unit in the label
- Input accepts numbers with comma or period decimal separators

---

## Automated Testing Integration

```bash
# Run axe-core in CI via Playwright
npx playwright test --grep "@accessibility"

# Per-page accessibility test example:
test('Portal dashboard has no critical a11y violations', async ({ page }) => {
  await page.goto('/portal');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
});
```

Target: 0 critical axe violations on all P0 screens.

---

## Compliance Statement

TaxWijs is committed to WCAG 2.1 Level AA compliance. Known gaps (from screen_inventory.md status) are tracked in the backlog and addressed before public launch. An accessibility audit by an independent expert is planned for Q3 2026 (before the belastingaangifte season).
