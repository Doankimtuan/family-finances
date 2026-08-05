# Architecture Impact

## Module boundaries (preserved)

- Loan lives in `modules/ledger` (Real Ledger money products).
- Plan/Inbox/Health remain **read-side consumers** — no ledger → plan imports inverted.
- No Product/Architecture CURRENT pack rewrite (Constitution).

## Application API delta

| Before | After |
|--------|-------|
| `InstallmentPlan`, `cardLabel` | `Loan`, `lender`, `loanType`, … |
| `createInstallmentPlan` | `createLoan` |
| `recordInstallmentPayment` | `recordLoanPayment` (account + amount → Transaction) |
| `listInstallmentPlans` / `getInstallmentPlan` | `listLoans` / `getLoan` / `listLoanPayments` |
| `convertToInstallment` | Removed from exported Loan/Card surfaces |

## Routes

| Before | After |
|--------|-------|
| `APP_PATH.MONEY_CARDS` `/money/cards` | `APP_PATH.MONEY_LOANS` `/money/loans` |
| `moneyCardPath(id)` | `moneyLoanPath(id)` |
| `app/.../money/cards/*` | `app/.../money/loans/*` |

## Plan calendar

- `CalendarEventSource.INSTALLMENT` → `LOAN` (`"loan"`).
- Projection uses remaining principal ÷ monthly payment for remaining periods.

## Inbox / Health

- Storage kind `emi_complete` retained for DB compatibility.
- ReviewItemType remains `InstallmentComplete` Spec string; UI copy updated to Loan.
- Health EMI-complete insight continues to key off `EMI_COMPLETE` kind.

## Constants homes

- Loan enums → `modules/ledger/application/ledger-constants.ts`
- Routes → `modules/tenancy/application/app-path.ts`
- Calendar source → `modules/plan/application/plan-constants.ts`
