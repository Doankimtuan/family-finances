# Component Implementation Checklist — ViNha Design System

**Canonical System**: Task 11 ViNha Component System (`DS-01`)  
**Design System Asset ID**: `assets/75087efd2c3c42baa6ce67405334331b` ("ViNha Warm Precision")  
**Initial Status Rule**: All components start in `NOT STARTED` status. No code is implemented during this handoff phase.

---

## 1. Primitives & Form Controls

| Component Name      | Canonical Variants                           | Interactive States                                | Responsive Rule                            | Dark Support                 | Accessibility                                      | Stitch Reference | Implementation Status |
| ------------------- | -------------------------------------------- | ------------------------------------------------- | ------------------------------------------ | ---------------------------- | -------------------------------------------------- | ---------------- | --------------------- |
| `Button`            | Primary, Tonal, Outlined, Destructive, Ghost | Default, Hover, Pressed, Focus, Loading, Disabled | `w-full` in mobile sheets, auto in headers | Yes (`#2DD4BF` / `#173B37`)  | `role="button"`, visible focus ring, aria-disabled | `DS-01` Strip 2  | COMPLETE              |
| `IconButton`        | Standard, Primary Tint, Danger               | Default, Hover, Pressed, Focus, Disabled          | Fixed 44×44px touch target                 | Yes (`#2DD4BF` / `#FB7185`)  | `aria-label` mandatory, focus ring                 | `DS-01` Strip 2  | COMPLETE              |
| `FloatingAddCTA`    | Floating pill (`+ Giao dịch`)                | Default, Pressed, Elevated                        | 16px bottom-right offset above nav         | Yes (Primary mint `#2DD4BF`) | `aria-label="Thêm giao dịch mới"`                  | `DS-01` Strip 2  | NOT STARTED           |
| `TextInput`         | Standard, Leading Icon, Trailing Icon        | Default, Focus, Error, Disabled, Read-only        | Flex 1, 16px font on mobile                | Yes (`#1C1C1F` surface)      | `aria-invalid`, aria-describedby for errors        | `DS-01` Strip 3  | COMPLETE              |
| `PasswordInput`     | Revealable password                          | Hidden, Visible, Error, Focus                     | 44px height, trailing eye toggle           | Yes (`#1C1C1F` surface)      | Eye button has `aria-label="Hiện mật khẩu"`        | `DS-01` Strip 3  | COMPLETE              |
| `HeroCurrencyInput` | 36px/32px Tabular Display                    | Tabular typing, Error, Read-only                  | Scales to 28px on 360px screens            | Yes (`#F4F4F5` on `#141416`) | Pronunciation rendered as `aria-live="polite"`     | `DS-01` Strip 3  | COMPLETE              |
| `AmountField`       | Standard monetary input                      | Default, Focus, Error, Read-only                  | Tabular nums, ₫ prefix, period thousand    | Yes (`#1C1C1F` surface)      | `inputmode="numeric"`, `tabular-nums`              | `DS-01` Strip 3  | COMPLETE              |
| `QuantityInput`     | Fractional holding input                     | Default, Focus, Error, with `MAX` button          | Flex input with inline 32px MAX pill       | Yes (`#1C1C1F` surface)      | `inputmode="decimal"`, min=0 validation            | `DS-01` Strip 3  | COMPLETE              |
| `PercentageField`   | Rate input with `% / năm`                    | Default, Focus, Error                             | Fixed suffix container                     | Yes (`#1C1C1F` surface)      | `inputmode="decimal"`, formatted %                 | `DS-01` Strip 3  | COMPLETE              |
| `NumberInput`       | Integer step input                           | Default, Focus, Error                             | Positive integers only                     | Yes (`#1C1C1F` surface)      | `inputmode="numeric"`                              | `DS-01` Strip 3  | COMPLETE              |
| `DateInput`         | Due / valuation date picker                  | Default, Open, Selected, Read-only                | Accessible calendar popover                | Yes (`#28282D` popover)      | `aria-haspopup="dialog"`, keyboard nav             | `DS-01` Strip 3  | COMPLETE              |
| `SearchInput`       | Header / in-page search                      | Inactive, Active, with Clear `×`                  | Full-width or compact 40px                 | Yes (`#1C1C1F` surface)      | `role="searchbox"`, aria-label                     | `DS-01` Strip 3  | COMPLETE              |
| `Textarea`          | Multiline note input                         | Default, Focus, Error, Counter                    | Min 80px, character counter                | Yes (`#1C1C1F` surface)      | Accessible character counter feedback              | `DS-01` Strip 3  | COMPLETE              |

---

## 2. Selection Controls & Filters

| Component Name     | Canonical Variants          | Interactive States                          | Responsive Rule                    | Dark Support                 | Accessibility                              | Stitch Reference | Implementation Status |
| ------------------ | --------------------------- | ------------------------------------------- | ---------------------------------- | ---------------------------- | ------------------------------------------ | ---------------- | --------------------- |
| `Select` (Closed)  | Form select, Compact filter | Placeholder, Selected, Focus, Disabled      | 44px height, chevron indicator     | Yes (`#1C1C1F` surface)      | `aria-haspopup="listbox"`, `aria-expanded` | `DS-01` Strip 4  | COMPLETE              |
| `SelectDropdown`   | Floating Popover Listbox    | Open, Hovered item, Selected, Scrollable    | Max 280px height, fixed popover    | Yes (`#28282D` surface)      | `role="listbox"`, `aria-activedescendant`  | `DS-01` Strip 4  | COMPLETE              |
| `ChoiceTile`       | Single card selection       | Default, Selected, Disabled                 | 12px radius, full-width or grid    | Yes (`#173B37` / `#2DD4BF`)  | `role="radio"`, `aria-checked`             | `DS-01` Strip 4  | NOT STARTED           |
| `ChoiceTileGroup`  | Radio tile container        | Group state, Validation error               | Vertical stack on 360px/390px      | Yes (`#1C1C1F` background)   | `role="radiogroup"`, arrow keys nav        | `DS-01` Strip 4  | NOT STARTED           |
| `Checkbox`         | Form consent, Remember me   | Unchecked, Checked, Indeterminate, Disabled | 20×20px box, 44px tap target       | Yes (`#2DD4BF` checkmark)    | `role="checkbox"`, `aria-checked`          | `DS-01` Strip 4  | COMPLETE              |
| `Switch`           | Policy toggle               | Off, On, Disabled                           | 44×24px track, 20px knob           | Yes (`#2DD4BF` active track) | `role="switch"`, `aria-checked`            | `DS-01` Strip 4  | COMPLETE              |
| `SegmentedControl` | 2 or 3-segment switcher     | Segment Active, Inactive, Focus             | Sliding pill container, full-width | Yes (`#242428` container)    | `role="tablist"`, `role="tab"`             | `DS-01` Strip 4  | COMPLETE              |
| `FilterChip`       | Horizontal scroll pill      | Inactive, Active (Primary Tint)             | 32px height, horizontal scroll     | Yes (`#173B37` active)       | `role="button"`, aria-pressed              | `DS-01` Strip 4  | COMPLETE              |

---

## 3. Rows, Cards & Visual Displays

| Component Name    | Canonical Variants                      | Interactive States           | Responsive Rule                 | Dark Support                      | Accessibility                       | Stitch Reference | Implementation Status |
| ----------------- | --------------------------------------- | ---------------------------- | ------------------------------- | --------------------------------- | ----------------------------------- | ---------------- | --------------------- |
| `TransactionRow`  | Expense (−), Income (+), Transfer (↔)   | Default, Pressed             | 40px icon, title + meta, amount | Yes (Rose, Emerald, Sky tokens)   | Semantic screen-reader announcement | `DS-01` Strip 5  | COMPLETE              |
| `InstrumentRow`   | Bank, Savings, Loan, Debt, Investment   | Default, Pressed             | 40px icon, name + mask, balance | Yes (`#1C1C1F` surface)           | Mask read as "đuôi số 4821"         | `DS-01` Strip 5  | COMPLETE              |
| `MemberRow`       | Admin, Partner                          | Default, Action menu trigger | 40px avatar, role badge, email  | Yes (`#1C1C1F` surface)           | Role announced to screen reader     | `DS-01` Strip 5  | COMPLETE              |
| `ReviewCard`      | Unmapped Tx, Maturity decision          | Pending, Resolving, Resolved | 12px radius card with deep link | Yes (`#1C1C1F` surface)           | Decision urgency announced          | `DS-01` Strip 5  | NOT STARTED           |
| `Card`            | Canvas (0), Surface (1), Elevated (2)   | Resting                      | 12px/14px radius, 1px border    | Yes (`#1C1C1F` / `#242428`)       | Structural landmark                 | `DS-01` Strip 6  | COMPLETE              |
| `InvariantBanner` | Blue Callout Notice                     | Persistent advisory          | 10px radius, Sky blue container | Yes (`#082F49/50` container)      | `role="note"`, invariant copy       | `DS-01` Strip 6  | COMPLETE              |
| `StatusBadge`     | Success, Warning, Danger, Info, Neutral | Static indicator             | 22px height, pill radius        | Yes (Emerald, Amber, Rose tokens) | Not color-only; text conveys status | `DS-01` Strip 6  | COMPLETE              |
| `ProgressBar`     | Clamped ratio bar                       | 0% to 100% clamped           | 4px or 6px height               | Yes (Emerald, Rose, Amber tokens) | `role="progressbar"`, aria-valuenow | `DS-01` Strip 6  | COMPLETE              |

---

## 4. Shell & Overlays

| Component Name     | Canonical Variants              | Interactive States           | Responsive Rule                    | Dark Support                   | Accessibility                            | Stitch Reference | Implementation Status |
| ------------------ | ------------------------------- | ---------------------------- | ---------------------------------- | ------------------------------ | ---------------------------------------- | ---------------- | --------------------- |
| `TopAppBar`        | Hub title, Back, Avatar, Search | Scrolled, Resting            | 56px height, safe-area top         | Yes (`#141416` background)     | `role="banner"`, heading level 1         | `DS-01` Strip 1  | COMPLETE              |
| `BottomNavigation` | 5 equal tabs                    | Active tab, Inactive, Badge  | 56px height, safe-area bottom      | Yes (`#141416` background)     | `role="navigation"`, aria-current="page" | `DS-01` Strip 7  | COMPLETE              |
| `AppViewport`      | Centered 440px frame            | Viewport container           | Fixed 440px desktop, 100% mobile   | Yes (`#141416` dark canvas)    | Landmarks properly nested                | `DS-01` Frame    | COMPLETE              |
| `ActionSheet`      | Modal bottom drawer             | Closed, Open, Dragging       | 16px top radius, max-h-[90vh]      | Yes (`#1C1C1F` sheet surface)  | `role="dialog"`, focus trap, escape key  | SCR-03, SCR-50   | COMPLETE              |
| `EmptyState`       | Zero Pending, Zero Accounts     | Static presentation with CTA | Centered 56px icon, copy, CTA      | Yes (`#173B37` icon container) | Clear status explanation                 | SCR-45           | COMPLETE              |
| `LoadingState`     | Skeleton rows, Spinner          | Loading                      | Shimmer animation, matches rows    | Yes (`#2E2E33` shimmer)        | `aria-busy="true"`                       | System specs     | COMPLETE              |
| `ErrorState`       | Error card with Retry CTA       | Error surface                | Centered alert, Primary Retry CTA  | Yes (`#3B1219` alert surface)  | `role="alert"`, retry focus              | System specs     | COMPLETE              |
| `FloatingAddCTA`   | Floating pill (`+ Giao dịch`)   | Default, Pressed, Elevated   | 16px bottom-right offset above nav | Yes (Primary mint `#2DD4BF`)   | `aria-label="Thêm giao dịch mới"`        | `DS-01` Strip 2  | COMPLETE              |
