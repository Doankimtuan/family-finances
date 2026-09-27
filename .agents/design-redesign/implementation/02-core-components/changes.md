# Changes Log — Implementation 02 Core Reusable Components

## Summary of Code Changes

Implementation 02 implemented and updated the shared component layer to establish the canonical primitives of Task 11 Warm Precision without disrupting existing product screens or business logic.

---

## Files Created

1. **`shared/ui/icon-button.tsx`**:
   - Canonical `IconButton` primitive with mandatory `aria-label`, 44px standard hit target, variants (`ghost`, `surface`, `destructive`, `primary`), and spinner loading state.
2. **`shared/ui/form/password-input.tsx`**:
   - Canonical `PasswordInput` with leading lock icon, integrated eye toggle button, accessible labels, and `FormField` integration.
3. **`shared/utils/vietnamese-words.ts`**:
   - Algorithmic Vietnamese currency spoken words generator (e.g. `25000000` -> "Hai mươi lăm triệu đồng") with comprehensive test coverage.
4. **`shared/ui/form/currency-input.tsx`**:
   - Canonical `CurrencyInput` with tabular numerals, ₫ prefix, thousand separators (`.`), real-time Vietnamese spoken words preview, and quick multiplier chips (`+50k`, `+100k`, `+500k`, `+1M`, `Làm tròn`).
5. **`shared/ui/form/quantity-input.tsx`**:
   - Investment holdings input with 4 decimal places, embedded `Tối đa` (MAX) button, and unit suffix (`CCQ`, `cổ phiếu`).
6. **`shared/ui/form/percentage-input.tsx`**:
   - Annual interest rate input with `% / năm` suffix, decimal parsing, and warning banner when rate > 30%.
7. **`shared/ui/form/number-input.tsx`**:
   - Integer stepping input with numeric inputmode and suffix support (`tháng`, `ngày`).
8. **`shared/ui/form/searchable-select.tsx`**:
   - Popover dropdown with sticky top search input, live filtering, and clean empty state.
9. **`shared/ui/form/date-input.tsx`**:
   - Date picker trigger with `DD/MM/YYYY` format, calendar icon, and quick shortcuts (`Hôm nay`, `Hôm qua`).
10. **`shared/ui/search-input.tsx`**:
    - Search input with search icon and interactive clear `×` button.
11. **`app/[locale]/(system)/design-foundations/core-components-section.tsx`**:
    - Dedicated interactive showcase demonstrating all implemented primitives on the verification harness.
12. **`tests/unit/components/core-reusable-components.test.tsx`**:
    - Comprehensive unit test suite covering all 22 components and their canonical states.

---

## Files Modified

1. **`shared/ui/button.tsx`**:
   - Added canonical variants (`primary`, `tonal`, `outline`, `ghost`, `destructive`) and sizes (`sm`, `md`, `lg`).
   - Integrated loading spinner (`Spinner`), `isPending`, disabled interaction, and press feedback (`active:scale-[0.98]`).
   - Preserved backward compatibility with HeroUI `button--${variant}` classes and legacy aliases (`secondary`, `tertiary`, `danger`, `flat`).
2. **`shared/ui/input.tsx`**:
   - Enforced 48px height, 10px radius, 16px mobile font, clear error border (`border-debt`), and distinct disabled (45% opacity) vs read-only (100% opacity, subtle background) visual states.
3. **`shared/ui/textarea.tsx`**:
   - Enforced 84px min-height, 10px radius, and real-time character counter (`45 / 200 ký tự`).
4. **`shared/ui/select.tsx`**:
   - Restyled closed trigger with 48px height, 10px radius, rotating chevron, and error styling.
   - Enhanced popover with 12px card radius, elevated surface, max-h-80, 44px min touch target rows, leading icons, secondary text, and teal checkmark indicator.
5. **`shared/ui/checkbox.tsx`**:
   - Implemented 20×20px box, 4px radius, primary teal fill with white checkmark when checked, horizontal minus when indeterminate, 44×44px touch target, and strict controlled/uncontrolled state safety.
6. **`shared/ui/radio.tsx`**:
   - Standardized 20×20px outer circle, 8px inner teal dot, 44×44px touch target, and keyboard arrow keys navigation.
7. **`shared/ui/switch.tsx`**:
   - Restyled 44×24px pill track, 20×20px knob, 150ms spring animation, `role="switch"`, `aria-checked`.
8. **`shared/ui/tabs.tsx`**:
   - Restyled 44px bar supporting Capsule Tabs and Underline Tabs variants with count badge integration.
9. **`shared/ui/segmented-control.tsx`**:
   - Standardized 36px height, 10px radius container, 8px active elevated pill with shadow.
10. **`shared/patterns/filter-chip.tsx` & `shared/ui/filter-chip.tsx`**:
    - Standardized 32px height, full pill radius, count badge, icon slot, and 44px touch target contract (`min-h-11`).
11. **`shared/ui/status-badge.tsx`**:
    - Enforced strict Task 11 6-tone palette (`positive`, `warning`, `danger`, `info`, `growth`, `neutral`) pairing text with tone while maintaining legacy test compatibility.
12. **`shared/ui/index.ts` & `shared/ui/form/index.ts`**:
    - Exported all new canonical components and types.
13. **`app/[locale]/(system)/design-foundations/page.tsx`**:
    - Integrated `CoreComponentsSection` to provide visual verification in development.
