# ViNha Component System — Design Foundations

## 1. Design Philosophy: Warm Precision

ViNha's design language, **Warm Precision**, balances modern financial rigor with warm, non-judgmental human craft. It is built specifically for bilingual (Vietnamese/English) households navigating complex, shared financial realities.

---

## 2. Color System & Semantic Tokens

### Canvas & Surface Structure

Hierarchy is established via tonal surface stepping and 1px hairline borders rather than aggressive drop shadows.

```css
:root {
  /* Canvas & Backgrounds */
  --vn-canvas: #fafaf9; /* Stone Canvas */
  --vn-surface: #ffffff; /* Crisp Card Surface */
  --vn-surface-subtle: #f6f4f2; /* Subtle Neutral Container */
  --vn-surface-elevated: #ffffff; /* Dialogs, Sheets, Popovers */

  /* Hairline Borders */
  --vn-border: #dde4e1; /* Primary Card Border (1px) */
  --vn-border-subtle: #ebefef; /* Divider & Table Border */
  --vn-border-focus: #0f766e; /* Active Focus Ring */

  /* Text & Foreground */
  --vn-text-primary: #18181b; /* High-contrast headings and amounts */
  --vn-text-secondary: #52525b; /* Body copy, labels, metadata */
  --vn-text-muted: #71717a; /* Inactive tabs, helper notes, timestamps */
  --vn-text-disabled: #a1a1aa; /* Disabled labels */

  /* Primary Brand & Agency */
  --vn-primary: #0f766e; /* Deep Teal */
  --vn-primary-hover: #0d655e;
  --vn-primary-active: #0a504b;
  --vn-primary-soft: #e7f5f1; /* Tonal Action Background */
  --vn-on-primary: #ffffff;

  /* Financial Domain Semantics */
  --vn-income: #047857; /* Deep Emerald: Deposits, yields, positive balance */
  --vn-income-soft: #ecfdf5;
  --vn-expense: #27272a; /* Slate: Routine expenses (neutral, non-alarmist) */
  --vn-expense-soft: #f4f4f5;
  --vn-debt: #be123c; /* Crimson Rose: Liabilities, overdues, credit balances */
  --vn-debt-soft: #fff1f2;
  --vn-transfer: #0369a1; /* Sky Blue: Inter-account transfers, non-net-worth shifts */
  --vn-transfer-soft: #f0f9ff;
  --vn-investment: #7c3aed; /* Violet: Wealth building, equities, funds */
  --vn-investment-soft: #f5f3ff;
  --vn-warning: #b45309; /* Warm Amber: Pending decisions, over-budget warnings */
  --vn-warning-soft: #fffbeb;

  /* Overlays & Scrim */
  --vn-scrim: rgba(24, 24, 27, 0.4);
  --vn-shadow-overlay:
    0 8px 24px -4px rgba(24, 24, 27, 0.08),
    0 2px 6px -1px rgba(24, 24, 27, 0.04);
}

[data-theme="dark"] {
  /* Canvas & Backgrounds */
  --vn-canvas: #141416; /* Dark Slate Canvas (no OLED black glare) */
  --vn-surface: #1c1c1f; /* Low-emission Card Surface */
  --vn-surface-subtle: #242428; /* Tonal Container */
  --vn-surface-elevated: #28282d; /* Elevated Dialogs & Sheets */

  /* Hairline Borders */
  --vn-border: #3f3f46; /* Dark Border */
  --vn-border-subtle: #2e2e33; /* Dark Divider */
  --vn-border-focus: #2dd4bf; /* Active Focus Ring */

  /* Text & Foreground */
  --vn-text-primary: #f4f4f5; /* Crisp Off-White */
  --vn-text-secondary: #a1a1aa; /* Light Gray */
  --vn-text-muted: #71717a; /* Slate Gray */
  --vn-text-disabled: #52525b; /* Dark Muted */

  /* Primary Brand & Agency */
  --vn-primary: #2dd4bf; /* Luminous Mint Teal */
  --vn-primary-hover: #14b8a6;
  --vn-primary-active: #0d9488;
  --vn-primary-soft: #173b37; /* Tonal Dark Mint */
  --vn-on-primary: #0f172a;

  /* Financial Domain Semantics */
  --vn-income: #34d399; /* Bright Emerald */
  --vn-income-soft: #064e3b;
  --vn-expense: #e4e4e7; /* Off-white Expense */
  --vn-expense-soft: #27272a;
  --vn-debt: #fb7185; /* Bright Rose */
  --vn-debt-soft: #4c0519;
  --vn-transfer: #38bdf8; /* Bright Sky Blue */
  --vn-transfer-soft: #082f49;
  --vn-investment: #a78bfa; /* Bright Violet */
  --vn-investment-soft: #2e1065;
  --vn-warning: #fbbf24; /* Bright Amber */
  --vn-warning-soft: #451a03;

  /* Overlays & Scrim */
  --vn-scrim: rgba(0, 0, 0, 0.65);
  --vn-shadow-overlay:
    0 8px 32px -4px rgba(0, 0, 0, 0.5), 0 2px 8px -1px rgba(0, 0, 0, 0.3);
}
```

---

## 3. Typography Scale & Vietnamese Diacritics

### Typography Principles

1. **Typeface**: `Geist` (system fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`).
2. **Vietnamese Diacritic Safeguard**: Vietnamese diacritics stack above uppercase and lowercase characters (`ễ`, `ẩ`, `ộ`, `đ`). All line-heights are locked to minimum **1.35× to 1.5×** font size to prevent character clipping.
3. **Tabular Numerals (`font-variant-numeric: tabular-nums`)**: Mandatory on all monetary amounts, dates, percentages, and metrics to ensure columnar alignment.

### Type Scale Tokens

| Token                    | Font Size | Line Height | Weight         | Letter Spacing | Usage                                                  |
| ------------------------ | --------- | ----------- | -------------- | -------------- | ------------------------------------------------------ |
| `--vn-font-display-hero` | 32px      | 38px (1.19) | 600 (Semibold) | -0.03em        | Top net worth hero, large transaction input            |
| `--vn-font-display-md`   | 24px      | 30px (1.25) | 600 (Semibold) | -0.02em        | Section headers, card headline figures                 |
| `--vn-font-title-lg`     | 20px      | 26px (1.30) | 600 (Semibold) | -0.015em       | Screen titles, modal titles, sheet headers             |
| `--vn-font-title-md`     | 18px      | 24px (1.33) | 500 (Medium)   | -0.01em        | Group headers, card titles                             |
| `--vn-font-body-lg`      | 16px      | 24px (1.50) | 400 (Regular)  | 0.00em         | Form inputs (prevents iOS auto-zoom), descriptive body |
| `--vn-font-body-md`      | 14px      | 20px (1.43) | 400 (Regular)  | 0.00em         | Standard list row titles, table text, secondary copy   |
| `--vn-font-body-sm`      | 13px      | 18px (1.38) | 400 (Regular)  | 0.00em         | Metadata rows, transaction dates, subtitle text        |
| `--vn-font-label-md`     | 12px      | 16px (1.33) | 500 (Medium)   | +0.01em        | Input field labels, table headers, badge labels        |
| `--vn-font-label-sm`     | 11px      | 14px (1.27) | 500 (Medium)   | +0.02em        | Bottom nav labels, status dots, micro-timestamps       |

---

## 4. Spacing Rhythm (4px Coordinate Base)

ViNha adheres strictly to a 4px baseline rhythm. Arbitrary spacing values (e.g. 7px, 13px, 17px) are strictly forbidden.

| Token           | Value | Semantic Usage                                                                   |
| --------------- | ----- | -------------------------------------------------------------------------------- |
| `--vn-space-1`  | 4px   | Micro gap: between icon and label, badge internal vertical padding               |
| `--vn-space-2`  | 8px   | Compact gap: between sibling chips, badge horizontal padding, list item text gap |
| `--vn-space-3`  | 12px  | Element padding: compact card padding, list row internal vertical padding        |
| `--vn-space-4`  | 16px  | Standard padding: card internal padding, page gutter, input horizontal padding   |
| `--vn-space-5`  | 20px  | Component stack gap: distance between form field groups, section spacing         |
| `--vn-space-6`  | 24px  | Major section delimiter: gap between distinct cards or dashboard widgets         |
| `--vn-space-8`  | 32px  | Page header delimiter: clearance above sticky bottom navigation bars             |
| `--vn-space-10` | 40px  | Hero clearance: top padding for dashboard summary cards                          |

---

## 5. Corner Radius System

ViNha avoids arbitrary mixed radii. Every component belongs to one of 5 calibrated geometric tiers:

| Tier                    | Radius Value     | Semantic Role & Allowed Components                                                |
| ----------------------- | ---------------- | --------------------------------------------------------------------------------- |
| **Pill / Circular**     | `9999px` / `50%` | Avatars, atomic status dots, filter chips, status badges, floating add CTA        |
| **Control / Item**      | `10px`           | Buttons, text inputs, selects, dropdown menus, icon containers (32/40px), toast   |
| **Card / Container**    | `12px`           | Account cards, budget jars, transaction groups, list card containers, alert boxes |
| **Overlay / Sheet**     | `16px`           | Modal dialogs, bottom action sheets, confirmation drawers                         |
| **Micro / Sub-element** | `4px`            | Checkboxes, focus rings, progress bar ends                                        |

---

## 6. Control Height & Touch Target Scale

Every interactive control guarantees WCAG AA compliance (minimum **44×44px** interactive bounding box).

| Control Type                                 | Visual Height    | Touch Target                        | Internal Horizontal Padding |
| -------------------------------------------- | ---------------- | ----------------------------------- | --------------------------- |
| **Button (sm)**                              | 36px             | 44px (with 4px touch hit-expansion) | 12px                        |
| **Button (md / standard)**                   | 44px             | 44px                                | 16px                        |
| **Button (lg / hero)**                       | 52px             | 52px                                | 20px                        |
| **Icon Button**                              | 44×44px          | 44×44px                             | Centered (20px icon)        |
| **Form Inputs (Text, Number, Date, Select)** | 48px             | 48px                                | 14px                        |
| **Currency Hero Input**                      | 64px             | 64px                                | 16px                        |
| **Bottom Navigation Bar**                    | 56px + safe-area | 56px                                | 5 equal slots               |
| **Filter Chip**                              | 32px             | 44px (with 6px touch hit-expansion) | 12px                        |

---

## 7. Focus & Accessibility System

### Focus Visible Ring

- When navigated via keyboard (Tab / Shift-Tab):
  - Ring: `2px solid var(--vn-border-focus)`
  - Offset: `2px` (`outline-offset: 2px`)
  - Outline radius: matches element radius + 2px.
- Never remove focus rings without replacing with this token.

### Contrast Standards (WCAG AA & AAA)

- All primary text (`#18181B` / `#F4F4F5`) exceeds **7:1** against canvas and card surfaces (WCAG AAA).
- All secondary text (`#52525B` / `#A1A1AA`) exceeds **4.5:1** against canvas and card surfaces (WCAG AA).
- Color is NEVER the sole signifier of state: Badges, progress bars, and transactions combine an explicit text label or signed glyph (`+`, `−`) with the semantic tint.

---

## 8. Disabled vs. Read-Only Global Laws

| Characteristic      | Disabled State (`[disabled]`)                                        | Read-Only State (`[readonly]`)                                          |
| ------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Semantic Intent** | User _cannot_ interact and value is _not applicable_ or unsubmitted. | User _cannot edit_, but the value is _critical informational data_.     |
| **Visual Opacity**  | `opacity: 0.45`                                                      | `opacity: 1.0` (Full contrast)                                          |
| **Background**      | Subdued / faded neutral (`--vn-surface-subtle`)                      | Crisp surface (`--vn-surface`) with subtle lock or read-only glyph      |
| **Border**          | Muted dashed or faint hairline                                       | Solid hairline (`--vn-border`)                                          |
| **Text Contrast**   | Faded (`--vn-text-disabled`)                                         | High contrast (`--vn-text-primary` / `--vn-text-secondary`)             |
| **Interaction**     | `pointer-events: none`; skipped in Tab order                         | Selectable, copyable; included in Tab order with `aria-readonly="true"` |

---

## 9. Z-Index & Elevation Scale

```css
:root {
  --vn-z-canvas: 0;
  --vn-z-surface: 1;
  --vn-z-sticky-header: 10;
  --vn-z-bottom-nav: 20;
  --vn-z-floating-cta: 30;
  --vn-z-dropdown-popover: 40;
  --vn-z-scrim: 50;
  --vn-z-modal-sheet: 60;
  --vn-z-toast: 70;
}
```

---

## 10. Motion & Animation Tokens

ViNha avoids gratuitous bouncy motion in favor of responsive, calming physics:

```css
:root {
  /* Durations */
  --vn-duration-instant: 100ms; /* Checkbox, radio toggle */
  --vn-duration-micro: 150ms; /* Button press, hover state */
  --vn-duration-standard: 250ms; /* Dropdown open, accordion expand */
  --vn-duration-overlay: 300ms; /* Bottom sheet slide, modal fade */

  /* Easings */
  --vn-ease-standard: cubic-bezier(
    0.2,
    0,
    0,
    1
  ); /* Decelerate / Clean entrance */
  --vn-ease-exit: cubic-bezier(0.3, 0, 1, 1); /* Accelerate / Swift exit */
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --vn-duration-instant: 0ms;
    --vn-duration-micro: 0ms;
    --vn-duration-standard: 0ms;
    --vn-duration-overlay: 0ms;
  }
}
```
