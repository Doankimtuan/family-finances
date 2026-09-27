# Compatibility Strategy — Implementation 02

## Strategic Approach

To ensure zero regression across the existing ViNha codebase while advancing to canonical Task 11 primitives:

1. **In-Place Evolution with Aliases**: Core shared UI primitives (`Button`, `Select`, `StatusBadge`, `FilterChip`) were restyled and evolved in place, maintaining backward-compatible prop interfaces, variant aliases, and CSS classes (e.g. `button--${variant}`).
2. **Dedicated Canonical Form Primitives**: Canonical financial inputs (`CurrencyInput`, `QuantityInput`, `PercentageInput`, `PasswordInput`, `DateInput`, `SearchableSelect`) are exposed in `shared/ui/form/index.ts` and `shared/ui/index.ts`.
3. **No Breaking Mass Migrations**: Existing screens (Login, Add Account, Savings form, Investment Sell, Loan Payment, Plan form, Together Invite) continue using their existing component imports without breakage until their scheduled screen-level redesign in Implementation 05+.

---

## Component Migration & Compatibility Map

| Legacy Component                       | Canonical Primitive                    | Migration Strategy                                                                                                                                                     | Breaking Changes | Deprecation Horizon                                                           |
| :------------------------------------- | :------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------: | :---------------------------------------------------------------------------- |
| `shared/ui/button.tsx`                 | `shared/ui/button.tsx`                 | In-place evolution. Canonical variants `primary`, `tonal`, `outline`, `ghost`, `destructive` added alongside legacy aliases `secondary`, `tertiary`, `danger`, `flat`. |       None       | Legacy variant aliases will be phased out in Task 09 cleanup.                 |
| Ad-hoc icon buttons                    | `shared/ui/icon-button.tsx`            | New canonical primitive with mandatory `aria-label` and standard 44px hit target.                                                                                      |       None       | Replace ad-hoc icon wrappers across screens during screen redesign.           |
| `shared/ui/input.tsx`                  | `shared/ui/input.tsx`                  | In-place evolution. Canonical 48px height, 10px radius, 16px mobile font, read-only vs disabled distinction.                                                           |       None       | Stable.                                                                       |
| Ad-hoc password fields                 | `shared/ui/form/password-input.tsx`    | Canonical composition wrapping lock icon and accessible visibility toggle button.                                                                                      |       None       | Adopt during auth screen redesign.                                            |
| `shared/ui/textarea.tsx`               | `shared/ui/textarea.tsx`               | In-place evolution. Min-height 84px, character counter support.                                                                                                        |       None       | Stable.                                                                       |
| `shared/ui/form/money-input.tsx`       | `shared/ui/form/currency-input.tsx`    | `CurrencyInput` introduced alongside legacy `MoneyInput`. Adds live Vietnamese spoken words preview and quick multiplier chips.                                        |       None       | `MoneyInput` retained for current forms; migrate during feature tasks.        |
| Ad-hoc holdings fields                 | `shared/ui/form/quantity-input.tsx`    | Canonical primitive with 4-decimal precision and embedded MAX button.                                                                                                  |       None       | Adopt in Investment operations redesign.                                      |
| Ad-hoc loan rate inputs                | `shared/ui/form/percentage-input.tsx`  | Canonical primitive with `% / năm` suffix and >30% warning alert.                                                                                                      |       None       | Adopt in Debt & Loan redesign.                                                |
| `shared/ui/select.tsx`                 | `shared/ui/select.tsx`                 | In-place evolution. Canonical 48px trigger, 12px radius popover, full keyboard navigation, `SelectItem` with checkmark.                                                |       None       | Retains `Select.Trigger`, `Select.Value`, `Select.Popover`, `Select.ListBox`. |
| Ad-hoc account pickers                 | `shared/ui/form/searchable-select.tsx` | Canonical searchable popover for long option lists.                                                                                                                    |       None       | Adopt for Bank/Account selection modals.                                      |
| `shared/ui/checkbox.tsx`               | `shared/ui/checkbox.tsx`               | In-place evolution. Strict controlled/uncontrolled safety, 20px box, 44px hit target.                                                                                  |       None       | Stable.                                                                       |
| `shared/ui/radio.tsx`                  | `shared/ui/radio.tsx`                  | In-place evolution. 20px outer circle, 8px inner teal dot, horizontal/vertical orientation.                                                                            |       None       | Stable.                                                                       |
| `shared/ui/switch.tsx`                 | `shared/ui/switch.tsx`                 | In-place evolution. 44×24px track, 20px knob, 150ms spring motion.                                                                                                     |       None       | Stable.                                                                       |
| `shared/ui/tabs.tsx`                   | `shared/ui/tabs.tsx`                   | In-place evolution. Supports both `capsule` and `underline` variants with count badges.                                                                                |       None       | Stable.                                                                       |
| `shared/ui/segmented-control.tsx`      | `shared/ui/segmented-control.tsx`      | In-place evolution. 36px height, elevated active pill.                                                                                                                 |       None       | Stable.                                                                       |
| `shared/patterns/filter-chip.tsx`      | `shared/patterns/filter-chip.tsx`      | In-place evolution. 32px visual height, 44px touch target contract (`min-h-11`), count badge.                                                                          |       None       | Stable.                                                                       |
| `shared/ui/status-badge.tsx`           | `shared/ui/status-badge.tsx`           | In-place evolution. Strict 6-tone domain palette (`positive`, `warning`, `danger`, `info`, `growth`, `neutral`) with legacy aliases (`success`, `attention`, `error`). |       None       | Stable.                                                                       |
| `shared/ui/search-field.tsx`           | `shared/ui/search-input.tsx`           | Canonical search input with clearable `×` button and search glyph.                                                                                                     |       None       | Deprecate `search-field.tsx` in Task 09.                                      |
| `shared/ui/form/date-picker-field.tsx` | `shared/ui/form/date-input.tsx`        | Canonical date trigger with `DD/MM/YYYY` format and quick shortcuts (`Hôm nay`, `Hôm qua`).                                                                            |       None       | `DatePickerField` retained as underlying picker foundation.                   |

---

## Regression Prevention Summary

1. **Zero Breaking Changes to Existing Test Suites**:
   - Every existing unit test expecting legacy variant classes (e.g. `button--secondary`, `button--danger`, `bg-danger/10 text-danger`) continues to pass without modification.
2. **Zero Form State Disruption**:
   - All input controls support React Hook Form, `Controller`, standard HTML input events, and controlled `value` / `onChange` patterns.
3. **Zero Financial Value Mutation**:
   - Presentation formatters format values for display only; underlying form state stores raw numbers.
