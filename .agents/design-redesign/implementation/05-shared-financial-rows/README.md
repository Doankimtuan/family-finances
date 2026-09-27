# Implementation 05 — Shared Financial & Row Components

**Status**: COMPLETE  
**Canonical Design System**: Task 11 ViNha Component System (`Warm Precision`, Design System Asset `75087efd2c3c42baa6ce67405334331b`)  
**Foundations Consumed**: Implementation 01 (Tokens), 02 (Core Primitives), 03 (Overlays & Feedback), 04 (Shell & Navigation)  
**Date**: September 27, 2026

---

## 1. Scope & Primary Objectives

Implementation 05 implements the reusable composite components that sit between core UI primitives (`shared/ui`) and domain screens (`modules/*/ui`, `app/*`).

The primary objective is to eliminate duplicated row, card, and financial presentation patterns across features while enforcing strict financial design invariants:

```text
Presentation-Only Discipline:
- Zero financial calculations in presentation components (rates, interest, amortization are owned by application modules).
- Explicit transaction types: Transfer ≠ Income and Transfer ≠ Expense. Transfers never show negative/minus signs or expense styling.
- Balance Sheet Distinction: Credit liabilities (AccountRow) never look like cash assets; credit limits are explicitly labeled "Hạn mức".
- Explicit Directionality: Peer debts (PersonalDebtRow) mandate explicit Vietnamese text ("Cho vay" vs "Đi vay"), never relying on color/arrows alone.
- Progress Clamping: ProgressSummary fills strictly clamp at 100%; overages (>100%) render textual badges ("Vượt mục tiêu").
- Privacy Integration: Full support for FinancialPrivacyProvider with asterisks masking and aria-label suppression.
- Semantic HTML: Zero nested interactive elements (<button> inside <button> or <a>).
```

---

## 2. Directory Structure & Documentation Artifacts

```text
.agents/design-redesign/implementation/05-shared-financial-rows/
├── README.md                          # Executive summary, principles, and architectural overview
├── existing-component-audit.md        # Audit of existing patterns across shared/ui & shared/patterns
├── financial-presentation-contract.md # Core presentation rules, rounding, and color invariants
├── component-architecture.md          # Composition hierarchy: BaseRow -> Specialized Rows
├── row-semantics.md                   # Semantic HTML, interactive slots, and accessibility
├── component-api-map.md               # Complete TypeScript API specifications and props
├── qa.md                              # Browser verification report across 390px, 440px, 768px & dark mode
├── changes.md                         # Detailed changelog of added/modified files
└── evidence/                          # Real browser photographic screenshots
    ├── impl05_390px_1790506834910.png
    ├── impl05_390px_part2_1790506853831.png
    ├── impl05_390px_part3_1790506873436.png
    ├── impl05_440px_1790506914594.png
    ├── impl05_440px_top_1790506935206.png
    ├── impl05_768px_1790506963124.png
    ├── impl05_light_mode_1790507055686.png
    └── impl05_dark_mode_1790507119360.png
```

---

## 3. Implemented Components Summary

| Component                          | Path                                    | Responsibility & Semantics                                                                                                                                                |
| :--------------------------------- | :-------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`FinancialAmount`**              | `shared/ui/financial-amount.tsx`        | Canonical tabular numeric formatter with safe locale fallback, explicit tone colors, sign prefixes, and financial privacy masking.                                        |
| **`FinancialMetric`**              | `shared/patterns/financial-metric.tsx`  | Dashboard metric card displaying label, primary financial amount, delta chip/badge, and supporting change text.                                                           |
| **`KeyValueList` & `KeyValueRow`** | `shared/ui/key-value.tsx`               | Semantic `<dl>`, `<dt>`, `<dd>` pairs for transaction receipt details, audit rows, and metadata summaries.                                                                |
| **`BaseRow`**                      | `shared/patterns/base-row.tsx`          | Architectural row primitive with leading icon/artwork slot, title/subtitle stack, trailing value slot, and separated secondary action. Zero nested interactive DOM nodes. |
| **`NavigationRow`**                | `shared/patterns/navigation-row.tsx`    | Specialized navigation link row with leading icon, badge, chevron, and accessible touch target.                                                                           |
| **`FinancialRow`**                 | `shared/patterns/financial-row.tsx`     | General financial row binding `BaseRow` with trailing `FinancialAmount`.                                                                                                  |
| **`TransactionRow`**               | `shared/patterns/transaction-row.tsx`   | Domain transaction row with explicit `TransactionType` (`income`, `expense`, `transfer`, `refund`, `neutral`). Strictly forbids minus sign on transfers.                  |
| **`AccountRow`**                   | `shared/patterns/account-row.tsx`       | Balance sheet row distinguishing depository accounts (cash balance) from credit liabilities (debt balance + `"Hạn mức: ..."`).                                            |
| **`SavingsRow`**                   | `shared/patterns/savings-row.tsx`       | Term deposit row showing deposit name, interest rate (`% / năm`), maturity date, principal, and accrued interest yield.                                                   |
| **`InvestmentRow`**                | `shared/patterns/investment-row.tsx`    | Calm asset row showing ticker, institution name, holdings (`qty × price`), total market value, and unrealized gain/loss.                                                  |
| **`LoanRow`**                      | `shared/patterns/loan-row.tsx`          | Installment loan row showing lender, remaining principal balance, next payment due date, and installment amount.                                                          |
| **`PersonalDebtRow`**              | `shared/patterns/personal-debt-row.tsx` | Peer debt row mandating explicit Vietnamese directionality (`"Cho vay"` vs `"Đi vay"`), counterparty name, remaining amount, and due date.                                |
| **`InboxRow`**                     | `shared/patterns/inbox-row.tsx`         | Actionable notification/task row with 3px vertical urgency strip (`urgent`, `normal`, `low`), category badge, and impact amount.                                          |
| **`MemberRow`**                    | `shared/patterns/member-row.tsx`        | Household member row displaying avatar initials, active presence indicator pip, role badge (`Chủ hộ`, `Thành viên`), and email.                                           |
| **`ProviderLogo`**                 | `shared/patterns/provider-row.tsx`      | 40×40 financial institution logo with Unicode-safe two-letter fallback initials.                                                                                          |
| **`ProviderRow`**                  | `shared/patterns/provider-row.tsx`      | Financial provider connection/catalog row displaying logo, institution name, institution code, account count, and status badge.                                           |
| **`StatusRow`**                    | `shared/patterns/status-row.tsx`        | Diagnostic/operational row displaying status icon, title, description, and action button.                                                                                 |
| **`ProgressSummary`**              | `shared/ui/progress-summary.tsx`        | Progress bar with label, ratio values, 100% clamped visual bar, and explicit overage badge when >100%.                                                                    |
| **`PersonIdentity`**               | `shared/patterns/person-identity.tsx`   | User/member identity block with avatar, Vietnamese initials generator (`getPersonInitials`), and secondary metadata.                                                      |

---

## 4. Verification & Hardening Results

- **Automated Unit Tests**: All 30 unit tests in `tests/unit/components/shared-financial-rows.test.tsx` pass.
- **Suite-Wide Component Tests**: 78/78 component tests across implementations 02, 03, and 05 pass cleanly.
- **Typecheck & Lint**: `npm run typecheck` and `npm run lint` report 0 errors and 0 warnings.
- **Real Browser QA**: Verified at 390px, 440px, and 768px viewports in both Light and Dark modes. All screenshots captured and preserved in `evidence/`.
