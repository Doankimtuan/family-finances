# Implementation 05 — Quality Assurance & Browser Evidence

**Test Date**: September 27, 2026  
**Status**: PASSED (Automated Tests + Real Browser Multi-Viewport QA)  
**Target Viewports**: 390px (Mobile Compact), 440px (Mobile Standard ViNha App Shell), 768px (Tablet / Desktop Centered Shell)  
**Themes**: Light Mode, Dark Mode

---

## 1. Automated Test Execution

### Shared Financial Rows Suite (`tests/unit/components/shared-financial-rows.test.tsx`)

```text
✓ Shared Financial & Row Components — Implementation 05 (30 tests) 111ms
  ✓ FinancialAmount > renders formatted whole VND with dot separator by default
  ✓ FinancialAmount > renders pre-formatted label strings when provided
  ✓ FinancialAmount > renders sign glyphs when showSign is true
  ✓ FinancialAmount > applies canonical color tones correctly
  ✓ FinancialAmount > masks amount when financial privacy mode is enabled
  ✓ FinancialMetric > renders label, formatted amount, and optional supporting text
  ✓ KeyValueList & KeyValueRow > renders semantic dl, dt, dd structure
  ✓ BaseRow > renders static container when neither href nor onClick is passed
  ✓ BaseRow > renders button when onClick is provided
  ✓ BaseRow > renders link when href is provided
  ✓ BaseRow > stops propagation on secondary action slot so row click is preserved
  ✓ BaseRow > applies minHeight variants
  ✓ NavigationRow > renders link with title, leading icon, and chevron
  ✓ FinancialRow > renders BaseRow with FinancialAmount trailing slot
  ✓ TransactionRow > strictly separates Transfer from Expense styling (never minus sign)
  ✓ TransactionRow > renders income with plus sign
  ✓ TransactionRow > supports legacy tone parameter for backward compatibility
  ✓ AccountRow > distinguishes credit card liabilities from asset balances
  ✓ SavingsRow > displays deposit name, interest rate, maturity date, and yield
  ✓ InvestmentRow > presents calm portfolio row with quantity, price, and gain/loss
  ✓ LoanRow > displays lender name, outstanding balance, and next installment
  ✓ PersonalDebtRow > mandates explicit textual direction (Cho vay vs Đi vay)
  ✓ InboxRow > renders urgency accent strip and impact amount
  ✓ MemberRow > renders member avatar initials, active status pip, and role
  ✓ ProviderLogo & ProviderRow > renders ProviderLogo with fallback initials when no logo URL
  ✓ ProviderLogo & ProviderRow > renders ProviderRow with connection status
  ✓ StatusRow > renders status icon, title, description, and action button
  ✓ ProgressSummary > renders current vs target amounts and clamps visual progress to 100%
  ✓ PersonIdentity & getPersonInitials > correctly generates initials for Vietnamese and international names
  ✓ PersonIdentity & getPersonInitials > renders PersonIdentity with avatar and display name

Test Files  1 passed (1)
Tests       30 passed (30)
```

### All Component Test Suites Combined

```text
✓ tests/unit/components/overlays-feedback-forms.test.tsx (19 tests)
✓ tests/unit/components/core-reusable-components.test.tsx (29 tests)
✓ tests/unit/components/shared-financial-rows.test.tsx (30 tests)

Test Files  3 passed (3)
Tests       78 passed (78)
```

---

## 2. Real Browser Visual Evidence

Browser verification was performed in a live running Chromium instance at `http://localhost:3000/vi/design-foundations`.

### Photographic Evidence Log

| Viewport     | Mode  | Artifact File                                   | Verified Criteria                                                                                                                                                                               |
| :----------- | :---- | :---------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **390×844**  | Light | `evidence/impl05_390px_1790506834910.png`       | `FinancialAmount` sizes and tone colors; `KeyValueList` pairs; `FinancialMetric` layout.                                                                                                        |
| **390×844**  | Light | `evidence/impl05_390px_part2_1790506853831.png` | `NavigationRow`, `FinancialRow`, `TransactionRow` (Transfer vs Expense), `AccountRow` (Asset vs Credit `"Hạn mức"`).                                                                            |
| **390×844**  | Light | `evidence/impl05_390px_part3_1790506873436.png` | `SavingsRow`, `InvestmentRow`, `LoanRow`, `PersonalDebtRow` (`"Cho vay"` / `"Đi vay"`), `InboxRow` (urgency strip), `MemberRow`, `ProviderRow`, `StatusRow`, `ProgressSummary` (100% clamping). |
| **440×900**  | Light | `evidence/impl05_440px_top_1790506935206.png`   | Standard mobile shell width: cards align to edges with consistent 16px inner padding.                                                                                                           |
| **440×900**  | Light | `evidence/impl05_440px_1790506914594.png`       | Financial presentation clarity, typography line-heights, tabular numeric alignment.                                                                                                             |
| **768×1024** | Light | `evidence/impl05_768px_1790506963124.png`       | Tablet/Desktop container: strictly centered at `max-width: 440px`, no awkward stretched rows.                                                                                                   |
| **440×900**  | Dark  | `evidence/impl05_dark_mode_1790507119360.png`   | Dark mode surface contrast: `--color-surface`, `--color-border-subtle`, text readability on all tones.                                                                                          |
| **440×900**  | Light | `evidence/impl05_light_mode_1790507055686.png`  | Light mode baseline confirmation after toggle cycle.                                                                                                                                            |

---

## 3. Financial Invariant Verification Checklist

| Rule                          | Verification Details                                                                                                                                                                                                   | Result   |
| :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- |
| **Transfer ≠ Expense**        | Verified in `TransactionRow`: `Chuyển sang tiết kiệm` displays neutral text color (`var(--color-text-primary)`), icon `arrow-right-left`, and **no minus sign**.                                                       | **PASS** |
| **Credit Card Liabilities**   | Verified in `AccountRow`: Credit card displays outstanding liability balance in debt tone (`text-debt`) and secondary line `"Hạn mức: 50.000.000 ₫"`. Cash asset displays `"Số dư khả dụng"`.                          | **PASS** |
| **Mandatory Debt Direction**  | Verified in `PersonalDebtRow`: Must render explicit Vietnamese text (`"Cho vay"` or `"Đi vay"`). Never relies solely on arrow direction or green/red color.                                                            | **PASS** |
| **Progress Clamping**         | Verified in `ProgressSummary`: `Chi tiêu ăn uống` with 110% progress has its visual progress bar clamped strictly to 100%, accompanied by a `"Vượt mục tiêu"` pill badge.                                              | **PASS** |
| **Interactive DOM Hierarchy** | Verified in `BaseRow`: Primary interactive element (`Link` or `button`) and secondary `action` slot are sibling elements in the flex container. Zero `<button>` inside `<button>` or `<button>` inside `<a>` warnings. | **PASS** |
| **Privacy Mode**              | Verified in `FinancialAmount`: When `useFinancialPrivacy().isHidden` is active, displays asterisks (`•••••• ₫`) and suppresses accessibility amount leaks.                                                             | **PASS** |

---

## 4. Code Quality & Lint Gates

- `npm run typecheck`: **0 errors**.
- `npm run lint`: **0 errors, 0 warnings**.
- No magic strings or hardcoded hex colors introduced.
- All tokens resolved from CSS custom properties (`var(--color-*)`, `var(--radius-*)`).
