# Implementation 02 — Core Reusable Components

## Overview

Implementation 02 delivers the canonical reusable UI component layer for ViNha, strictly adhering to the Warm Precision design system established in Task 11 (`DS-01 Light: 5c6805523e9644b9b233449304419296`, `DS-01 Dark: b07644fd6dad4c7c81b8a4bf1a51baff`) and consuming the foundational design tokens implemented in Task 01.

Every primitive is built mobile-first within the 440px app shell, strictly avoids magic strings or ad-hoc colors, maintains 100% Light/Dark visual parity, enforces WCAG AA touch targets (44x44px min hit targets), and separates financial presentation from underlying numeric values.

## Implemented Component Families

### 1. Actions

- **Button** (`shared/ui/button.tsx`): 5 canonical variants (`primary`, `tonal`, `outline`, `ghost`, `destructive`) + legacy aliases (`secondary`, `tertiary`, `danger`, `flat`). 3 standardized heights (`sm: 36px`, `md: 44px`, `lg: 52px`). Built-in loading state with spinner, `isPending`, disabled interaction, and press feedback (`active:scale-[0.98]`).
- **IconButton** (`shared/ui/icon-button.tsx`): Canonical 44×44px container (with 36px `sm` variant), mandatory `aria-label`, 4 variants (`ghost`, `surface`, `destructive`, `primary`).

### 2. General Inputs

- **TextInput** (`shared/ui/input.tsx`): 48px height, 10px radius, 16px mobile font (prevents iOS auto-zoom), leading/trailing slots, clear error border, distinct disabled (45% opacity) vs read-only (100% opacity, selectable) styling.
- **PasswordInput** (`shared/ui/form/password-input.tsx`): Leading lock icon, integrated eye toggle button with localized accessible text ("Hiện mật khẩu" / "Ẩn mật khẩu").
- **Textarea** (`shared/ui/textarea.tsx`): 84px min-height, 10px radius, real-time character counter (`45 / 200 ký tự`).
- **FormField** (`shared/ui/form/form-field.tsx`): Reusable layout primitive unifying label, required asterisk, description, error messaging, and ARIA relationships (`aria-describedby`, `aria-errormessage`).

### 3. Financial Numeric Suite

- **CurrencyInput** (`shared/ui/form/currency-input.tsx`): VND formatted input with tabular numerals, ₫ prefix, thousand separators (`.`), real-time Vietnamese spoken pronunciation words preview (via `shared/utils/vietnamese-words.ts`), and quick multiplier chips (`+50k`, `+100k`, `+500k`, `+1M`, `Làm tròn`).
- **QuantityInput** (`shared/ui/form/quantity-input.tsx`): Designed for investment holdings (4 decimal precision, unit suffix e.g. `CCQ`, `cổ phiếu`, embedded `Tối đa` / MAX button).
- **PercentageInput** (`shared/ui/form/percentage-input.tsx`): Interest rate input with `% / năm` suffix, decimal parsing, and warning banner when annual rate > 30%.
- **NumberInput** (`shared/ui/form/number-input.tsx`): Integer step counter with unit suffix (`tháng`, `ngày`), 48px height.

### 4. Selection & Pickers

- **Select & SelectDropdown** (`shared/ui/select.tsx`): Canonical closed trigger (48px height, 10px radius, rotating chevron, error/disabled/read-only) and Open Popover (12px radius, elevated surface, max-h-80, 44px min touch target rows with icons, secondary text, teal checkmark indicator, keyboard navigation).
- **SearchableSelect** (`shared/ui/form/searchable-select.tsx`): Dropdown with sticky search input at top of popover, live client-side filtering, and clean empty state.
- **Checkbox** (`shared/ui/checkbox.tsx`): 20×20px box, 4px radius, primary teal fill with white checkmark when checked, horizontal minus when indeterminate, 44×44px touch target.
- **Radio & RadioGroup** (`shared/ui/radio.tsx`): 20×20px outer circle, 8px inner teal dot, 44×44px touch target, arrow keys navigation.
- **Switch** (`shared/ui/switch.tsx`): 44×24px pill track, 20×20px knob, 150ms spring animation, `role="switch"`, `aria-checked`.

### 5. Navigation & Filtering Primitives

- **Tabs** (`shared/ui/tabs.tsx`): 44px bar, Capsule Tabs and Underline Tabs variants, badge/count integration, smooth indicators, keyboard navigation.
- **SegmentedControl** (`shared/ui/segmented-control.tsx`): 36px height, 10px radius container, 8px active elevated pill with shadow, mode switching (`Tháng / Quý / Năm`).
- **FilterChip** (`shared/patterns/filter-chip.tsx` & `shared/ui/filter-chip.tsx`): 32px height, full pill radius, count badge, icon slot, horizontal scroll friendly.

### 6. Display & Utility Inputs

- **Badge** (`shared/ui/badge.tsx`): Visual indicator with count and status roles.
- **StatusBadge** (`shared/ui/status-badge.tsx`): Strict Task 11 6-tone palette (Positive, Warning, Danger, Info, Neutral, Growth) with mandatory text label alongside semantic tint.
- **SearchInput** (`shared/ui/search-input.tsx`): 44px height, search glyph, interactive `×` clear button that clears text while preserving focus.
- **DateInput** (`shared/ui/form/date-input.tsx`): Canonical DateInput trigger with `DD/MM/YYYY` format, calendar icon, and quick shortcuts (`Hôm nay`, `Hôm qua`).

## Scope Boundaries

This implementation strictly conforms to reusable UI primitives. The following remain intentionally deferred to later implementation tasks:

- Overlays: Dialog, BottomSheet, ActionSheet, Toast, Popover (generic).
- Navigation: BottomNavigation, TopAppBar, PageHeader.
- Compound Rows & Cards: TransactionRow, AccountCard, JarCard, FinancialSummary.
- Domain Screens: Auth, Ledger, Plan, Together, Reports.
- Backend/Data: Supabase schema, RPCs, financial formulas remain completely untouched.
