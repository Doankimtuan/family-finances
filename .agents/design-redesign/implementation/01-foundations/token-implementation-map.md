# Token Implementation Map — ViNha Design Foundations (Task 01)

**Canonical Specification**: Task 11 Stitch Component System (`DS-01 Light: 5c6805523e9644b9b233449304419296`, `DS-01 Dark: b07644fd6dad4c7c81b8a4bf1a51baff`)  
**Design System Asset ID**: `assets/75087efd2c3c42baa6ce67405334331b` ("ViNha Warm Precision")  
**Primary CSS Location**: `styles/globals.css`  
**Primary TS Location**: `shared/theme/tokens.ts` & `shared/motion/tokens.ts`

---

## 1. Surfaces & Canvas Hierarchy

| Token Name          | CSS Variable                                              | Tailwind Utility       | Light Value | Dark Value | Semantic Role                       | Legacy Equivalent |
| ------------------- | --------------------------------------------------------- | ---------------------- | ----------- | ---------- | ----------------------------------- | ----------------- |
| `canvas`            | `--vinha-canvas` / `--color-canvas`                       | `bg-canvas`            | `#fcfbf9`   | `#141416`  | App viewport background             | `--background`    |
| `canvas-outer`      | `--vinha-canvas-outer` / `--color-canvas-outer`           | `bg-canvas-outer`      | `#ece8e1`   | `#0c0c0e`  | Desktop framing outer space         | none              |
| `surface`           | `--vinha-surface` / `--color-surface`                     | `bg-surface`           | `#ffffff`   | `#1c1c1f`  | Default cards, rows, sheets         | `--card`          |
| `surface-subtle`    | `--vinha-surface-subtle` / `--color-surface-subtle`       | `bg-surface-subtle`    | `#f6f4f2`   | `#242428`  | Subdued cards, secondary groupings  | none              |
| `surface-elevated`  | `--vinha-surface-elevated` / `--color-surface-elevated`   | `bg-surface-elevated`  | `#ffffff`   | `#28282d`  | Floating menus, dropdowns, dialogs  | `--popover`       |
| `surface-hover`     | `--vinha-surface-hover` / `--color-surface-hover`         | `bg-surface-hover`     | `#f3efea`   | `#25252a`  | Hovered state for list rows & tiles | none              |
| `surface-soft`      | `--vinha-surface-soft` / `--color-surface-soft`           | `bg-surface-soft`      | `#ede8e1`   | `#2d2d33`  | Segmented control track, pills      | none              |
| `surface-highlight` | `--vinha-surface-highlight` / `--color-surface-highlight` | `bg-surface-highlight` | `#e5dfd5`   | `#36363d`  | High-emphasis container highlight   | none              |

---

## 2. Text & Typography Colors

| Token Name       | CSS Variable                                        | Tailwind Utility      | Light Value | Dark Value | Semantic Role                       | Legacy Equivalent    |
| ---------------- | --------------------------------------------------- | --------------------- | ----------- | ---------- | ----------------------------------- | -------------------- |
| `text-primary`   | `--vinha-text-primary` / `--color-text-primary`     | `text-text-primary`   | `#191c1d`   | `#f4f4f5`  | Headlines, primary amounts, labels  | `--foreground`       |
| `text-secondary` | `--vinha-text-secondary` / `--color-text-secondary` | `text-text-secondary` | `#424748`   | `#a1a1aa`  | Descriptions, subtitles, timestamps | none                 |
| `text-muted`     | `--vinha-text-muted` / `--color-text-muted`         | `text-text-muted`     | `#727879`   | `#71717a`  | Placeholders, captions, minor info  | `--muted-foreground` |
| `text-inverse`   | `--vinha-text-inverse` / `--color-text-inverse`     | `text-text-inverse`   | `#ffffff`   | `#18181b`  | Text on inverted badges/buttons     | none                 |

---

## 3. Borders & Dividers

| Token Name      | CSS Variable                                      | Tailwind Utility       | Light Value | Dark Value | Semantic Role                             | Legacy Equivalent |
| --------------- | ------------------------------------------------- | ---------------------- | ----------- | ---------- | ----------------------------------------- | ----------------- |
| `border-subtle` | `--vinha-border-subtle` / `--color-border-subtle` | `border-border-subtle` | `#e2ded7`   | `#2e2e33`  | Hairline card boundaries, list dividers   | `--border`        |
| `border-strong` | `--vinha-border-strong` / `--color-border-strong` | `border-border-strong` | `#c6c2ba`   | `#3f3f46`  | Input fields, active tabs, dialog borders | none              |
| `border-focus`  | `--vinha-border-focus` / `--color-border-focus`   | `border-border-focus`  | `#0d9488`   | `#2dd4bf`  | Focus outline ring                        | `--ring`          |
| `divider-inset` | `--vinha-divider-inset`                           | -                      | `#ebefef`   | `#2e2e33`  | Subtle 1px row separators                 | none              |

---

## 4. Brand & Primary Action

| Token Name       | CSS Variable                                        | Tailwind Utility             | Light Value | Dark Value | Semantic Role                            | Legacy Equivalent      |
| ---------------- | --------------------------------------------------- | ---------------------------- | ----------- | ---------- | ---------------------------------------- | ---------------------- |
| `primary`        | `--vinha-primary` / `--color-primary`               | `bg-primary`, `text-primary` | `#0d9488`   | `#2dd4bf`  | Primary CTA, active nav icon, links      | `--primary`            |
| `primary-hover`  | `--vinha-primary-hover` / `--color-primary-hover`   | `bg-primary-hover`           | `#0f766e`   | `#14b8a6`  | Hover state for primary buttons          | none                   |
| `primary-active` | `--vinha-primary-active` / `--color-primary-active` | `bg-primary-active`          | `#115e59`   | `#0d9488`  | Pressed state for primary buttons        | none                   |
| `primary-fg`     | `--vinha-primary-fg` / `--color-primary-fg`         | `text-primary-fg`            | `#ffffff`   | `#042f2e`  | Text/icon on primary buttons             | `--primary-foreground` |
| `primary-soft`   | `--vinha-primary-soft` / `--color-primary-soft`     | `bg-primary-soft`            | `#ccfbf1`   | `#173b37`  | Tonal button background, active tab pill | none                   |

---

## 5. Financial Domain Semantics

| Token Name        | CSS Variable                                          | Tailwind Utility     | Light Value | Dark Value | Semantic Meaning                               |
| ----------------- | ----------------------------------------------------- | -------------------- | ----------- | ---------- | ---------------------------------------------- |
| `income`          | `--vinha-income` / `--color-income`                   | `text-income`        | `#059669`   | `#34d399`  | Inflows, positive yield, received payments     |
| `income-soft`     | `--vinha-income-soft` / `--color-income-soft`         | `bg-income-soft`     | `#ecfdf5`   | `#064e3b`  | Income category icon backgrounds, badges       |
| `expense`         | `--vinha-expense` / `--color-expense`                 | `text-expense`       | `#e11d48`   | `#fb7185`  | Outflows, spending, costs                      |
| `expense-soft`    | `--vinha-expense-soft` / `--color-expense-soft`       | `bg-expense-soft`    | `#f4f4f5`   | `#27272a`  | Neutral expense icon containers (Task 11 spec) |
| `debt`            | `--vinha-debt` / `--color-debt`                       | `text-debt`          | `#be123c`   | `#f43f5e`  | Liabilities, obligations, loans owed           |
| `debt-soft`       | `--vinha-debt-soft` / `--color-debt-soft`             | `bg-debt-soft`       | `#fff1f2`   | `#4c0519`  | Debt alert containers, urgency pills           |
| `transfer`        | `--vinha-transfer` / `--color-transfer`               | `text-transfer`      | `#0284c7`   | `#38bdf8`  | Account-to-account internal movements          |
| `transfer-soft`   | `--vinha-transfer-soft` / `--color-transfer-soft`     | `bg-transfer-soft`   | `#f0f9ff`   | `#082f49`  | Transfer badges and icon containers            |
| `investment`      | `--vinha-investment` / `--color-investment`           | `text-investment`    | `#7c3aed`   | `#a78bfa`  | Portfolio assets, capital investments          |
| `investment-soft` | `--vinha-investment-soft` / `--color-investment-soft` | `bg-investment-soft` | `#f5f3ff`   | `#2e1065`  | Asset pills and investment badges              |
| `savings`         | `--vinha-savings` / `--color-savings`                 | `text-savings`       | `#0d9488`   | `#2dd4bf`  | Target savings, accumulated reserves           |
| `savings-soft`    | `--vinha-savings-soft` / `--color-savings-soft`       | `bg-savings-soft`    | `#ccfbf1`   | `#173b37`  | Savings milestone badges                       |
| `warning`         | `--vinha-warning` / `--color-warning`                 | `text-warning`       | `#d97706`   | `#fbbf24`  | Review required, maturity near                 |
| `warning-soft`    | `--vinha-warning-soft` / `--color-warning-soft`       | `bg-warning-soft`    | `#fffbeb`   | `#451a03`  | Warning banners and pills                      |

---

## 6. Interactive States: Disabled vs Read-Only

| State                                           | CSS Background                                | CSS Border                                        | CSS Text                                        | Opacity | Interactive / Tab Order                 | ARIA Semantics         |
| ----------------------------------------------- | --------------------------------------------- | ------------------------------------------------- | ----------------------------------------------- | ------- | --------------------------------------- | ---------------------- |
| **Disabled** (`[disabled]`, `.state-disabled`)  | `--vinha-disabled-bg` (`#f4f4f5` / `#242428`) | `--vinha-disabled-border` (`#e4e4e7` / `#2e2e33`) | `--vinha-disabled-text` (`#a1a1aa` / `#71717a`) | `0.45`  | Not interactive, removed from tab order | `aria-disabled="true"` |
| **Read-Only** (`[readonly]`, `.state-readonly`) | `--vinha-readonly-bg` (`#ffffff` / `#1c1c1f`) | `--vinha-readonly-border` (`#e2ded7` / `#3f3f46`) | `--vinha-readonly-text` (`#191c1d` / `#f4f4f5`) | `1.00`  | Focusable, selectable, copyable         | `aria-readonly="true"` |

---

## 7. Corner Radii Scale

| Tier Name | CSS Variable                               | Value    | Canonical Component Role                     |
| --------- | ------------------------------------------ | -------- | -------------------------------------------- |
| `xs`      | `--radius-xs` / `--vn-radius-xs`           | `4px`    | Tiny micro-badges, indicators                |
| `sm`      | `--radius-sm` / `--vn-radius-sm`           | `8px`    | Segmented control segments, compact pills    |
| `control` | `--radius-control` / `--vn-radius-control` | `10px`   | Buttons, inputs, search fields, selects      |
| `card`    | `--radius-card` / `--vn-radius-card`       | `12px`   | Standard transaction cards, jar cards, tiles |
| `xl`      | `--radius-xl` / `--vn-radius-xl`           | `14px`   | Hero cards, invariant summary banners        |
| `2xl`     | `--radius-2xl` / `--vn-radius-2xl`         | `16px`   | Modal action sheets, bottom drawers          |
| `full`    | `--radius-full` / `--vn-radius-full`       | `9999px` | Circular buttons, avatars, filter pills      |

---

## 8. Spacing Scale & Screen Gutter

| Token           | Value  | Semantic Role                                            |
| --------------- | ------ | -------------------------------------------------------- |
| `screen-gutter` | `16px` | Screen left and right margins across 360px, 390px, 430px |
| `section-gap`   | `24px` | Vertical spacing between primary page sections           |
| `component-gap` | `16px` | Spacing between cards and form blocks                    |
| `field-gap`     | `12px` | Vertical gap between adjacent input fields               |
| `label-gap`     | `6px`  | Gap between field label and input box                    |
| `inline-gap`    | `8px`  | Gap between inline elements (icons + labels)             |
| `card-padding`  | `16px` | Internal padding for surface cards                       |
| `row-padding`   | `12px` | Internal vertical padding for list rows                  |

---

## 9. Control Dimensions & Touch Target Safety

| Control Metric            | Token / Value                           | Rule                                                                   |
| ------------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| Minimum Touch Target      | `44px × 44px` (`--vn-touch-target-min`) | WCAG AA mandatory; touch target expansion utilities `.touch-target-44` |
| Primary Input Height      | `48px` (`--vn-input-height`)            | Standard text and monetary input containers                            |
| Compact Control Height    | `40px` (`--vn-control-height-compact`)  | Header buttons, compact filters                                        |
| Top/Bottom Navigation Bar | `56px` (`--vn-bar-height`)              | Canonical TopAppBar and BottomNavigation height                        |
| Hero Input Height         | `64px` (`--vn-hero-input-height`)       | Big monetary amount entry fields                                       |
| Maximum App Width         | `440px` (`--vn-viewport-max-width`)     | Centered mobile-first constraint at all viewports                      |

---

## 10. Motion Primitives & Spring Presets

| Name              | Duration / Stiffness / Damping | Semantic Role                                        | Reduced Motion Strategy                 |
| ----------------- | ------------------------------ | ---------------------------------------------------- | --------------------------------------- |
| `instant`         | `0ms`                          | Immediate updates, tab switches                      | Unchanged                               |
| `snappy`          | `stiffness: 400, damping: 30`  | Checkbox toggles, button presses, micro-interactions | Fallback to immediate                   |
| `gentle`          | `stiffness: 200, damping: 25`  | Sheet entrance, drawer sliding, card expansion       | Fallback to short opacity (`150ms`)     |
| `duration-fast`   | `150ms` (`--vn-motion-fast`)   | Simple hover / color transitions                     | Standard CSS transition                 |
| `duration-normal` | `250ms` (`--vn-motion-normal`) | Modals, dropdown menus                               | Standard CSS transition                 |
| `duration-slow`   | `350ms` (`--vn-motion-slow`)   | Full view screen transitions                         | Disabled under `prefers-reduced-motion` |
