# Implementation 05 — Record of Changes

**Implementation**: 05 — Shared Financial & Row Components  
**Date**: September 27, 2026  
**Status**: COMPLETE

---

## 1. Created Files

### UI Primitives & Patterns

1. **`shared/ui/financial-amount.tsx`**
   - Canonical tabular numeric currency formatter.
   - Built-in `useSafeLocale()` preventing SSR/test crashes outside intl provider.
   - Support for `tone` (`neutral`, `income`, `expense`, `debt`, `invest`, `subtle`).
   - Support for `showSign` (+ for positive, − for negative, ⇄ for neutral transfer).
   - Support for financial privacy masking with asterisks (`•••••• ₫`).
   - Exports `FinancialAmountSize`, `FinancialAmountTone`.

2. **`shared/ui/key-value.tsx`**
   - Semantic `<dl>`, `<dt>`, `<dd>` pairs for transaction receipt details, audit rows, and metadata summaries.
   - Density variants: `comfortable` (py-3), `compact` (py-2).
   - Separator lines support.
   - Highlight support with `isHighlighted` (and `highlight` alias for backward compatibility).

3. **`shared/ui/progress-summary.tsx`**
   - Goal/budget progress presentation component.
   - Clamps visual `Progress` bar fill strictly to 100%.
   - Overages (>100%) render textual `"Vượt mục tiêu"` or custom overage notice.
   - Dual amount formatting for current and target figures.

4. **`shared/patterns/base-row.tsx`**
   - Architectural foundation for all domain and navigation rows.
   - Enforces clean interactive DOM structure: primary tap target (`Link` or `<button>`) is a flex sibling to the secondary action slot, guaranteeing zero `<button>` inside `<button>` or `<button>` inside `<a>` violations.
   - Standardized `minHeight` options: `compact` (48px), `standard` (56px), `tall` (68px).

5. **`shared/patterns/navigation-row.tsx`**
   - General navigation row with leading icon, badge, chevron, and accessible touch target.

6. **`shared/patterns/financial-row.tsx`**
   - General financial item row binding `BaseRow` with trailing `FinancialAmount`.
   - Supports both raw numeric amount and pre-formatted value string.

7. **`shared/patterns/financial-metric.tsx`**
   - High-level metric card with primary financial amount, delta badge, and supporting trend text.

8. **`shared/patterns/account-row.tsx`**
   - Specialized row for depository accounts and credit liabilities.
   - Distinct presentation for credit card liabilities: debt tone + explicit `"Hạn mức: ..."` text.

9. **`shared/patterns/savings-row.tsx`**
   - Specialized row for savings deposits.
   - Explicitly displays deposit name, interest rate (`% / năm`), maturity date, principal, and accrued interest yield.

10. **`shared/patterns/investment-row.tsx`**
    - Specialized row for investment holdings (stocks, funds, assets).
    - Displays ticker, asset name, quantity × current price, total market value, and unrealized gain/loss with percentage.

11. **`shared/patterns/loan-row.tsx`**
    - Specialized row for loans and installment debt.
    - Displays lender name, outstanding principal balance, upcoming payment due date, and installment amount.

12. **`shared/patterns/personal-debt-row.tsx`**
    - Specialized row for peer lending/borrowing.
    - Enforces mandatory Vietnamese directionality (`"Cho vay"` vs `"Đi vay"`), counterparty name, remaining debt amount, and due date.

13. **`shared/patterns/inbox-row.tsx`**
    - Specialized row for actionable financial notifications and tasks.
    - 3px vertical urgency strip (`urgent`, `normal`, `low`), category badge, title, subtitle, and impact amount.

14. **`shared/patterns/member-row.tsx`**
    - Household member row displaying avatar initials, active presence indicator pip, role badge (`Chủ hộ`, `Thành viên`), and email.

15. **`shared/patterns/provider-row.tsx`**
    - Contains `ProviderLogo`: 40×40 financial institution logo with Unicode-safe fallback initials.
    - Contains `ProviderRow`: Provider catalog and connected account row displaying logo, institution name, institution code, account count, and status badge.

16. **`shared/patterns/status-row.tsx`**
    - Diagnostic and operational status row with status icon, title, description, and action button.

17. **`shared/patterns/person-identity.tsx`**
    - User/person identity display primitive with avatar, display name, secondary role/email, and `getPersonInitials` helper.

### Testing & Verification Files

18. **`tests/unit/components/shared-financial-rows.test.tsx`**
    - Comprehensive unit test suite covering all 17 components with 30 passing tests.
19. **`app/[locale]/(system)/design-foundations/shared-financial-rows-section.tsx`**
    - Interactive showcase section demonstrating all components across realistic domain scenarios.

---

## 2. Modified Files

1. **`shared/patterns/transaction-row.tsx`**
   - Refactored to support canonical `TransactionType` (`income`, `expense`, `transfer`, `refund`, `neutral`).
   - Enforced Transfer ≠ Expense invariant (neutral tone, `arrow-right-left` icon, no minus sign).
   - Integrated `useFinancialPrivacy()` with aria-label suppression.
   - Retained backward-compatible styling (`group border-b border-border-subtle/70 bg-transparent`) and legacy props (`tone`, `formattedAmount`).

2. **`shared/ui/index.ts`**
   - Exported `FinancialAmount`, `FinancialAmountSize`, `FinancialAmountTone`.
   - Exported `KeyValueList`, `KeyValueRow`.
   - Exported `ProgressSummary`.

3. **`shared/patterns/index.ts`**
   - Exported all new pattern components and their associated types:
     `BaseRow`, `BaseRowMinHeight`, `NavigationRow`, `FinancialRow`, `FinancialMetric`,
     `TransactionRow`, `TransactionType`, `TransactionAmountTone`,
     `AccountRow`, `SavingsRow`, `InvestmentRow`, `LoanRow`, `PersonalDebtRow`,
     `InboxRow`, `MemberRow`, `ProviderRow`, `ProviderLogo`, `StatusRow`,
     `PersonIdentity`, `getPersonInitials`.

4. **`app/[locale]/(system)/design-foundations/page.tsx`**
   - Added tab 7: `Shared Financial & Row Components (Implementation 05)` importing `SharedFinancialRowsSection`.

5. **`tests/setup.ts`**
   - Added typed mock for `next/navigation` and `@/i18n/navigation` to enable Vitest execution of Next.js Link components.

---

## 3. Deprecations & Architectural Upgrades

- **Ad-hoc Row Wrappers**: Replaced bespoke flex row layouts in features with canonical `BaseRow` variants.
- **Negative Sign on Transfers**: Discontinued applying minus sign or `text-expense` to transfer transactions.
- **Credit Limit Hidden**: Credit cards now mandate explicit display of credit limit (`"Hạn mức"`).
- **Silent Peer Debt Arrows**: Personal debt now mandates explicit textual direction (`"Cho vay"` or `"Đi vay"`).
