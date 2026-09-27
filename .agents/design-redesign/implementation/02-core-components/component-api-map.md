# Component API Map — Implementation 02

This document maps all canonical ViNha reusable UI primitives implemented in Task 02, documenting their APIs, variants, sizes, states, accessibility contracts, Stitch references, and backward compatibility mappings.

---

## 1. Actions

### Button

- **Path**: `shared/ui/button.tsx`
- **Purpose**: Canonical action trigger for all primary, secondary, and destructive user flows.
- **Variants**:
  - `primary`: Dominant filled teal (`bg-primary text-primary-fg shadow-sm`)
  - `tonal`: Soft tinted surface (`bg-primary-soft text-primary`)
  - `outline`: Hairline bordered surface (`border border-border-subtle bg-transparent text-text-secondary`)
  - `ghost`: Transparent action (`bg-transparent text-text-secondary hover:bg-surface-hover`)
  - `destructive`: Red debt action (`bg-debt text-white shadow-sm`)
  - Legacy Aliases: `secondary` (= tonal), `tertiary` (= outline), `danger` (= destructive), `flat` (= surface-subtle)
- **Sizes**:
  - `sm`: 36px height (`h-9 min-h-9 px-3 text-xs gap-1.5`)
  - `md`: 44px height (`h-11 min-h-11 px-4 text-sm gap-2`)
  - `lg`: 52px height (`h-13 min-h-13 px-5 text-base font-semibold gap-2.5`)
- **States**: Default, Hover, Pressed (`active:scale-[0.98]`), Focus Visible (`focus-ring`), Loading (`isLoading`, spinner, `isPending`, `data-loading`), Disabled (`disabled`, `opacity-45`, `pointer-events-none`).
- **Important Props**: `variant`, `size`, `isLoading`, `loadingText`, `leadingIcon`, `trailingIcon`, `fullWidth`, `isIconOnly`, `disabled`, `onClick`.
- **A11y**: `<button>` semantics, `aria-disabled`, `aria-busy` during loading, `data-pending="true"`, WCAG AA contrast.
- **Stitch Reference**: `DS-01 Button Group` (Frame `c1-btn-primary`, `c1-btn-tonal`, `c1-btn-outline`)
- **Legacy Equivalent**: HeroUI `Button` / `shared/ui/button.tsx` v1.

### IconButton

- **Path**: `shared/ui/icon-button.tsx`
- **Purpose**: Compact icon-only trigger for navigation, dismissal, editing, and utility controls.
- **Variants**: `ghost`, `surface`, `destructive`, `primary` (plus compatibility aliases `secondary`, `tertiary`, `outline`).
- **Sizes**: `md` (44×44px hit target), `sm` (36×36px with 44px touch-target-expand).
- **States**: Default, Hover, Pressed (`active:scale-95`), Focus Visible, Loading, Disabled.
- **Important Props**: `aria-label` (MANDATORY), `icon` or `children`, `variant`, `size`, `isLoading`, `disabled`, `onClick`.
- **A11y**: Strict non-empty `aria-label` required by TypeScript; minimum 44×44px interactive target area.
- **Stitch Reference**: `DS-01 Icon Buttons` (Back, Close, More, Edit, Search).
- **Legacy Equivalent**: None / ad-hoc `<button>` + SVG.

---

## 2. General Inputs

### TextInput

- **Path**: `shared/ui/input.tsx`
- **Purpose**: Base text field for short string entry (names, emails, codes).
- **Height / Radius**: 48px height (`h-12`), 10px radius (`rounded-[var(--radius-control)]`), 16px mobile font.
- **States**: Empty, Hover, Focus (`border-primary focus-ring`), Filled, Error (`border-debt`), Disabled (`opacity-45`), Read-only (`opacity-100 bg-surface-subtle border-dashed cursor-default select-text`).
- **Important Props**: `label`, `placeholder`, `value`, `onChange`, `leadingIcon`, `trailingElement`, `hasError`, `isReadOnly`, `isDisabled`.
- **A11y**: Works seamlessly with `FormField` for `id` + `aria-describedby` + `aria-errormessage`.
- **Stitch Reference**: `DS-01 Inputs / Text Input`.
- **Legacy Equivalent**: `shared/ui/input.tsx` v1.

### PasswordInput

- **Path**: `shared/ui/form/password-input.tsx`
- **Purpose**: Secure credential entry with leading lock glyph and accessible reveal toggle button.
- **States**: Hidden (`type="password"`), Visible (`type="text"`), Focus, Error, Disabled.
- **Important Props**: `id`, `label`, `value`, `onChange`, `error`, `description`.
- **A11y**: Reveal button includes screen-reader label "Hiện mật khẩu" / "Ẩn mật khẩu".
- **Stitch Reference**: `DS-01 Inputs / Password Input`.
- **Legacy Equivalent**: Ad-hoc password fields in auth modules.

### Textarea

- **Path**: `shared/ui/textarea.tsx`
- **Purpose**: Multi-line commentary and transaction notes.
- **Dimensions**: Min-height 84px (`min-h-[84px]`), 10px radius, 16px mobile font.
- **States**: Default, Focus, Filled, Error, Disabled, Read-only.
- **Important Props**: `value`, `onChange`, `maxLength`, `showCounter`, `hasError`, `isReadOnly`, `disabled`.
- **A11y**: Character count announced to screen readers.
- **Stitch Reference**: `DS-01 Inputs / Text Area`.
- **Legacy Equivalent**: `shared/ui/textarea.tsx` v1.

---

## 3. Financial Numeric Suite

### CurrencyInput

- **Path**: `shared/ui/form/currency-input.tsx`
- **Purpose**: High-speed, zero-error VND entry for transactions, budgets, and savings deposits.
- **Formatting**: Tabular numbers (`tabular-nums`), ₫ prefix, thousand separators (`.`). Never stores formatted string; emits clean numeric value.
- **Affordances**:
  - Live Vietnamese pronunciation preview (e.g. `25000000` -> "Hai mươi lăm triệu đồng" via `shared/utils/vietnamese-words.ts`).
  - Quick multiplier chips (`+50k`, `+100k`, `+500k`, `+1M`, `Làm tròn`).
  - Hero mode (`isHero`) with 32px prominent font for transaction entry.
- **Input Mode**: `inputMode="numeric"`.
- **States**: Empty, Focus, Typing, Error, Disabled, Read-only.
- **Important Props**: `value`, `onValueChange`, `showWordsPreview`, `showQuickChips`, `quickChips`, `isHero`, `label`, `error`.
- **Stitch Reference**: `DS-01 Financial Input / VND Amount`.
- **Legacy Equivalent**: `shared/ui/form/money-input.tsx` & `shared/patterns/amount-field.tsx`.

### QuantityInput

- **Path**: `shared/ui/form/quantity-input.tsx`
- **Purpose**: Investment share/fund unit entry with fractional precision.
- **Formatting**: 4 decimal places, numeric entry mode, unit suffix (e.g. `CCQ`, `cổ phiếu`).
- **Affordances**: Embedded `Tối đa` (MAX) button when `maxValue` is supplied. Clicking sets field to `maxValue` without affecting external state.
- **States**: Empty, Focus, Typing, Max-filled, Error, Disabled, Read-only.
- **Important Props**: `value`, `onValueChange`, `maxValue`, `unitSuffix`, `decimals`, `step`.
- **Stitch Reference**: `DS-01 Financial Input / Holdings Quantity`.
- **Legacy Equivalent**: Ad-hoc number inputs in investment screens.

### PercentageInput

- **Path**: `shared/ui/form/percentage-input.tsx`
- **Purpose**: Annual interest rate entry for loans and savings.
- **Formatting**: Up to 2 decimal places, `% / năm` suffix.
- **Affordances**: Warning alert when annual rate exceeds 30% (`>30%/năm`).
- **States**: Empty, Focus, Typing, Warning, Error, Disabled, Read-only.
- **Important Props**: `value`, `onValueChange`, `suffix`, `warningThreshold`, `min`, `max`.
- **Stitch Reference**: `DS-01 Financial Input / Interest Rate`.
- **Legacy Equivalent**: Ad-hoc percentage textboxes.

### NumberInput

- **Path**: `shared/ui/form/number-input.tsx`
- **Purpose**: Integer term/period input (e.g. loan tenor in months, days).
- **Dimensions**: 48px height, 10px radius, unit suffix support.
- **Important Props**: `value`, `onValueChange`, `min`, `max`, `step`, `suffix`.
- **Stitch Reference**: `DS-01 Financial Input / Number Field`.
- **Legacy Equivalent**: `shared/ui/number-field.tsx`.

---

## 4. Selection & Pickers

### Select & SelectDropdown

- **Path**: `shared/ui/select.tsx`
- **Purpose**: Canonical single-item picker for accounts, categories, and payment channels.
- **Closed Trigger**: 48px height, 10px radius, rotating chevron, error/disabled/read-only styling.
- **Open Popover**: 12px card radius, elevated surface, max-h-80, 44px min touch target rows with optional leading icon, label, secondary text, and teal checkmark.
- **States**: Placeholder, Selected, Hover, Focus, Open, Error, Disabled, Read-only.
- **A11y**: Full keyboard navigation (Arrow Up/Down, Enter/Space, Escape, Tab), ARIA listbox attributes.
- **Stitch Reference**: `DS-01 Select & Dropdown` (Frame `c1-select-closed`, `c1-select-open`).
- **Legacy Equivalent**: HeroUI `Select` / `shared/ui/select.tsx` v1.

### SearchableSelect

- **Path**: `shared/ui/form/searchable-select.tsx`
- **Purpose**: Dropdown for long option lists (bank list, payee directory, global accounts).
- **Affordances**: Sticky search input at the top of the popover, instant client-side filtering, no results empty state.
- **States**: Closed, Open, Searching, Filtered, Empty, Selected.
- **Important Props**: `id`, `options`, `value`, `onChange`, `placeholder`, `searchPlaceholder`.
- **Stitch Reference**: `DS-01 Searchable Select`.
- **Legacy Equivalent**: None / ad-hoc modals.

### Checkbox

- **Path**: `shared/ui/checkbox.tsx`
- **Purpose**: Multi-selection and confirmation toggles.
- **Dimensions**: 20×20px box, 4px radius, 44×44px interactive tap area.
- **States**: Unchecked, Checked (teal + white checkmark), Indeterminate (teal + white minus), Hover, Pressed, Focus Visible, Disabled.
- **Important Props**: `checked`, `onChange`, `indeterminate`, `label`, `description`, `disabled`.
- **A11y**: Native checkbox semantics, `aria-checked="mixed"` when indeterminate.
- **Stitch Reference**: `DS-01 Selection / Checkbox`.
- **Legacy Equivalent**: HeroUI `Checkbox` / `shared/ui/checkbox.tsx` v1.

### Radio & RadioGroup

- **Path**: `shared/ui/radio.tsx`
- **Purpose**: Mutually exclusive selection among 2-5 options.
- **Dimensions**: 20×20px outer circle, 8px inner teal dot, 44×44px interactive tap area.
- **States**: Unchecked, Checked, Hover, Focus Visible, Disabled.
- **Important Props**: `value`, `onChange`, `label`, `description`, `disabled`.
- **A11y**: Arrow keys keyboard navigation between radio items in group.
- **Stitch Reference**: `DS-01 Selection / Radio`.
- **Legacy Equivalent**: HeroUI `Radio` / `shared/ui/radio.tsx` v1.

### Switch

- **Path**: `shared/ui/switch.tsx`
- **Purpose**: Instant binary setting activation (e.g. notifications, biometric auth).
- **Dimensions**: 44×24px pill track, 20×20px circular knob, 150ms spring animation.
- **States**: Off (`bg-surface-subtle border-border-subtle`), On (`bg-primary border-primary`), Focus Visible, Disabled.
- **Important Props**: `checked`, `onChange`, `disabled`, `aria-label`.
- **A11y**: `role="switch"`, `aria-checked`, keyboard Space/Enter toggling.
- **Stitch Reference**: `DS-01 Selection / Switch`.
- **Legacy Equivalent**: HeroUI `Switch` / `shared/ui/switch.tsx` v1.

---

## 5. Navigation & Filtering Primitives

### Tabs

- **Path**: `shared/ui/tabs.tsx`
- **Purpose**: High-level view and section switching.
- **Variants**:
  - `capsule`: Filled pill background with active white card pill.
  - `underline`: Clean border-b bar with teal underline indicator.
- **Dimensions**: 44px height, 44px min hit targets.
- **Affordances**: Numerical count badge integration (`count: 48`).
- **Important Props**: `tabs`, `activeTab`, `onChange`, `variant`.
- **Stitch Reference**: `DS-01 Navigation / Tabs`.
- **Legacy Equivalent**: HeroUI `Tabs` / `shared/ui/tabs.tsx` v1.

### SegmentedControl

- **Path**: `shared/ui/segmented-control.tsx`
- **Purpose**: Inline mode switcher (e.g. `Tháng / Quý / Năm`).
- **Dimensions**: 36px height, 10px radius container, 8px radius active pill with subtle elevation.
- **States**: Default, Selected, Hover, Pressed, Focus Visible, Disabled.
- **Important Props**: `options`, `value`, `onChange`, `disabled`.
- **Stitch Reference**: `DS-01 Selection / Segmented Control`.
- **Legacy Equivalent**: `shared/ui/segmented-control.tsx` v1.

### FilterChip

- **Path**: `shared/patterns/filter-chip.tsx` & `shared/ui/filter-chip.tsx`
- **Purpose**: Horizontal-scrollable filter toggles for transactions and accounts.
- **Dimensions**: 32px height, full pill radius, 44px touch target contract (`min-h-11`).
- **States**: Unselected, Selected (`border-primary bg-primary-soft text-primary font-semibold`), Pressed (`scale-95`), Disabled.
- **Important Props**: `children`, `selected`, `onPress`, `count`, `icon`, `disabled`.
- **A11y**: `aria-pressed`, WCAG AA 44px touch target.
- **Stitch Reference**: `DS-01 Chips / Filter Chip`.
- **Legacy Equivalent**: `shared/patterns/filter-chip.tsx` v1.

---

## 6. Display & Utility Inputs

### StatusBadge

- **Path**: `shared/ui/status-badge.tsx`
- **Purpose**: Semantic status indicator for transactions, debts, goals, and memberships.
- **Canonical Tones**:
  - `positive` / `success`: Green (`bg-success/10 text-success border border-income/20`)
  - `warning`: Amber (`bg-warning/10 text-warning border border-warning/25`)
  - `danger` / `error` / `attention`: Crimson (`bg-danger/10 text-danger border border-debt/20`)
  - `info`: Blue (`bg-info/10 text-info border border-transfer/20`)
  - `growth`: Purple (`bg-investment-soft text-investment border border-investment/20`)
  - `neutral`: Slate (`bg-surface-muted text-text-secondary border border-border-subtle`)
- **Accessibility Law**: Never communicates status through color alone; always pairs semantic tint with descriptive Vietnamese/English copy.
- **Stitch Reference**: `DS-01 Badges / Status Badge`.
- **Legacy Equivalent**: `shared/ui/status-badge.tsx` v1.

### SearchInput

- **Path**: `shared/ui/search-input.tsx`
- **Purpose**: Search query input with integrated search icon and interactive clear button.
- **Dimensions**: 44px height, 10px radius.
- **States**: Empty, Focused, Typing, Clearable (displays `×` button when query > 0).
- **Important Props**: `value`, `onChange`, `onClear`, `placeholder`, `disabled`.
- **A11y**: `role="searchbox"`, clear button has accessible name "Xóa tìm kiếm".
- **Stitch Reference**: `DS-01 Inputs / Search Field`.
- **Legacy Equivalent**: `shared/ui/search-field.tsx`.

### DateInput

- **Path**: `shared/ui/form/date-input.tsx`
- **Purpose**: Accessible date trigger with calendar icon and quick shortcut buttons (`Hôm nay`, `Hôm qua`).
- **Format**: `DD/MM/YYYY` (Vietnamese locale format).
- **States**: Empty, Selected, Focus, Error, Disabled, Read-only.
- **Important Props**: `id`, `label`, `value`, `onChange`, `showShortcuts`, `todayLabel`, `yesterdayLabel`.
- **Stitch Reference**: `DS-01 Inputs / Date Picker Trigger`.
- **Legacy Equivalent**: `shared/ui/form/date-picker-field.tsx`.
