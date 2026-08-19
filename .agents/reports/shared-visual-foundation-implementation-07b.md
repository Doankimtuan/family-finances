# ViNha Shared Visual Foundation Implementation — 07B

## Summary

Established and normalized ViNha's shared visual foundation across the design-system primitives, typography roles, financial number styles, surface hierarchy, shape/radius tokens, elevation, section patterns, status badges, buttons, and interaction contracts.

This pass unifies the design language for Home and upcoming feature modules without rewriting business logic, altering financial calculations, introducing new UI/icon libraries, or executing the dedicated motion pass.

---

## Typography foundation

Clarified and enforced reusable typography roles across `Heading`, `Text`, `Balance`, `Amount`, and `SectionHeader`:

* **Page identity**: Compact strong heading (`TopAppBar` level 1/title, 24–30px mobile, short and balanced). Avoids giant dashboard headers.
* **Section heading**: Standardized on `SectionHeader` with `Heading level={2}` (18–22px, semibold, tracking-tight) and concise secondary description.
* **Hero financial value**: Supported via `Balance` with `size="hero"` / `size="lg"` (3xl, semibold, tabular numbers, tracking-tight, high-contrast text-primary). Capable of handling long VND values cleanly in both light and dark mode.
* **Supporting financial metric**: Provided via `Balance` or `Amount` with `size="md"` (xl) or `size="sm"` (lg), tabular numbers, subordinate to hero amounts.
* **Label**: Compact 14px secondary tone with relaxed line height.
* **Helper/metadata**: Secondary 12–13px (`text-xs`), preserving WCAG AA accessible contrast.

No custom typography library was added; Geist Sans and Geist Mono tokens remain canonical.

---

## Financial-number rules

Standardized the visual contract for financial numbers across `Balance` and `Amount`:

* **Tabular numerals**: All financial values strictly use `tabular-nums` to prevent horizontal layout shifting on dynamic value updates.
* **Balance vs. Amount separation**:
  * `Balance`: Strictly for authoritative real ledger balances (`text-text-primary`, no arbitrary coloring).
  * `Amount`: For intention, budget, plan, credit, or debit values.
* **Restrained semantic color**:
  * Positive flow / credit: `text-success` (or `text-income`).
  * Debit: `text-danger` only when representing a signed deduction / liability alert; ordinary expense rows default to `text-text-primary`.
  * Saving: `text-saving` (teal accent).
  * Neutral: `text-text-primary`.
  * Secondary metadata: `text-text-secondary`.
* **Context over color alone**: Negative or attention states pair visual labels, status badges, or explicit descriptions with numbers so meaning is never communicated by color alone.
* **Formatting**: Value formatting remains strictly owned by shared `formatCurrency` and `formatPercent` utilities.

---

## Surface hierarchy

Normalized surface layers to establish clear depth without card overload:

* **Level 0 — Page canvas**: Warm neutral backdrop (`--color-canvas-outer` / `--color-canvas`).
* **Level 1 — Standard section**: Open surface, spacing- and border-based grouping (`Section variant="plain"`).
* **Level 2 — Emphasized card**: Reserved for the single dominant financial hero per screen (`Section variant="emphasized"`, `KpiBlock variant="prominent"`).
* **Floating**: Dedicated only to true overlays, dialogs, sheets, and popovers (`--radius-overlay: 16px;`, `--elevation-2`/`--elevation-3`).

Home and feature screens maintain one prominent financial surface rather than a stack of competing cards.

---

## Radius and elevation

Normalized radius tokens across `@theme inline` and `:root` in `styles/globals.css`:

* **Small controls / chips**: `6px` (`--radius-sm`).
* **Default controls / buttons / inputs**: `10px` (`--radius-md` / `--radius-control`).
* **Cards and bounded rows**: `12px` (`--radius-lg` / `--radius-card`).
* **Sheets and dialog overlays**: `16px` (`--radius-xl` / `--radius-overlay`).
* **Pills**: `9999px` (`--radius-full`), strictly reserved for `FilterChip`, `StatusBadge`, and bottom-navigation active indicators. Content rows and action buttons avoid pill shapes.
* **Icon containers**: Normalized to `10px` (`rounded-[var(--radius-control)]`) across `IconContainer` and `EmptyState`.

Elevation remains subtle:
* `elevation-0`: Flat borders and tone contrast for standard regions.
* `elevation-1`: Subtle 1px/2px tone-contrast shadow for primary CTAs and hero surfaces.
* Large blur-heavy shadows are avoided for dark-mode quality and rendering performance.

---

## Section pattern

Solidified `Section` and `SectionHeader`:

* `Section` accepts `title`, optional `description`, optional `action`, and `children`.
* Supports `plain`, `surface`, and `emphasized` variants.
* `SectionHeader` enforces `[&_a]:min-h-11` and `[&_button]:min-h-11` (44px min touch target), `rounded-[var(--radius-control)]`, and focus-visible rings for all section actions.

---

## FilterChip decision

* `FilterChip` enforces a minimum 44px touch target (`min-h-11`) across the product.
* Retains compact horizontal padding (`px-(--space-3)`), text/icon alignment, `aria-pressed` semantics, primary-ring selected states, and reduced-motion safe active press scaling.
* Verified across all current consumers (`home-period-control.tsx`, `inbox-queue-list.tsx`).

---

## Buttons and actions

Standardized button hierarchy in `shared/ui/button.tsx` and `shared/patterns/quick-action.tsx`:

* **Standard buttons**: Minimum 44px height (`min-h-11`), `rounded-[var(--radius-control)]`, `font-medium`, active scale feedback.
* **Icon-only buttons**: Minimum 44px × 44px target (`min-h-11 min-w-11`), zero padding.
* **QuickAction**: 48px height (`min-h-12 w-full`), clear icon-label pairing.
* **States**: Distinct `disabled:cursor-not-allowed disabled:opacity-50`, visible focus rings with `focus-visible:outline-focus-ring`.

---

## Status and semantic color system

* **StatusBadge**: Expanded tone support to include all semantic roles (`neutral`, `positive`, `info`, `warning`, `attention`, `selected`, `success`, `danger`, `error`).
* **Semantic roles**:
  * *Info*: Neutral contextual information (`bg-info/10 text-info`).
  * *Attention / Danger / Error*: Requires user action / failed state (`bg-danger/10 text-danger`).
  * *Warning*: Potential consequence or approaching deadline (`bg-warning/10 text-warning`).
  * *Positive / Success*: Confirmed positive outcome (`bg-success/10 text-success`).
  * *Selected*: Active filter or current selection (`bg-primary-soft text-primary ring-1 ring-primary/20`).
* **StatusAlert**: Supports `variant` (`info`, `warning`, `danger`, `success`), `title`, optional `description`, optional `action` slot, and `data-testid`.

---

## Icons

* Low-level icon rendering is strictly owned by `AppIcon` wrapping Free Hugeicons.
* Common icon sizes standardized: `xs: 14`, `sm: 16`, `md: 20`, `lg: 24`, `xl: 32`, `display: 40`.
* Stroke width standardized: `1.5` regular, `1.9` when `emphasized`.
* Decorative vs. semantic accessibility: automatically assigns `aria-hidden` unless an explicit accessible `label` is provided.

---

## Accessibility

* **Hit targets**: All interactive buttons, chips, section actions, and icon buttons enforce at least 44px (`min-h-11`).
* **Focus rings**: Universal visible 2px focus ring with 2px offset (`outline-focus-ring`).
* **Announced meaning**: Financial values maintain contextual labels and group descriptions.
* **Color independence**: Status badges and financial numbers combine text labels, icons, and tone rather than color alone.

---

## Dark mode

Verified dark mode tokens in `styles/globals.css`:
* Deep charcoal surfaces (`#141416` canvas, `#1c1c1f` surface, `#27272b` elevated surface) preventing OLED black glare while maintaining clear tonal separation.
* Subtle borders (`#3f3f46` subtle, `#52525b` strong) ensuring cards and rows do not merge in dark mode.
* High-contrast text tokens (`#f4f4f5` primary, `#a1a1aa` secondary, `#71717a` muted).
* Accessible teal primary brand tone (`#2dd4bf`) and semantic alerts.

---

## Home adoption

Minimal changes applied to Home to consume the shared visual foundation:
* `HomeCaptureAction`: Upgraded from 40px pill to 44px (`min-h-11`) with standardized control radius (`rounded-[var(--radius-control)]`).
* `HomePage`: Normalized Plan destination link to 44px (`min-h-11`) with standardized control radius (`rounded-[var(--radius-control)]`).
* Preserved existing Home read models, IA structure, calculations, and routes.

---

## Deferred work

Explicitly deferred to subsequent batches:
* Full Home visual polish pass.
* Point-by-point chart accessibility table and chart visual refinements.
* Dedicated Home Motion pass (reducing cascade wrappers, crossfade transitions).
* Freshness/stale/partial read-model contracts.
* Feature-module visual rollout (Money, Plan, Inbox, Together screens).

---

## Validation

1. **Visual Foundation Unit Tests**: `tests/unit/shared-visual-foundation.test.tsx` (9 tests passed).
2. **Home IA/UX Unit Tests**: `tests/unit/home-ia-ux.test.tsx` (4 tests passed).
3. **Full Unit Test Suite**: `npm run test` (122 test files, 914 tests passed).
4. **Typecheck**: `npm run typecheck` (`tsc --noEmit` passed with 0 errors).
5. **Lint**: `npm run lint` (`eslint .` passed with 0 errors).
6. **Production Build**: `npm run build` (compiled successfully, 94 static and dynamic routes generated).
