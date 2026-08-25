# TRANSACTIONS 17B — Grouped Loan Semantics + Bounded Pagination

Date: 2026-08-24

## Verdict

**TRANSACTIONS FOUNDATION READY**

Both P1 findings from 17A are implemented. No concrete Transactions blocker
remains in the scoped behavior.

## Implemented

### Grouped Loan payment semantics

- Loan principal and interest remain one user-facing activity.
- The typed activity contract now carries a discriminated Loan breakdown:
  total paid, principal amount, interest amount, Expense contribution, and
  neutral contribution.
- Principal-only payments remain neutral.
- A grouped payment with interest is included by the Expense filter and uses
  the Expense tone; its principal contribution remains neutral.
- The activity retains source account, loan payment identity, date/status, and
  related transaction IDs.
- Loan detail shows a compact Principal / Interest / Total paid breakdown.
- Every breakdown amount uses `FinancialValue`.

### Bounded cursor pagination

- The Transactions event path no longer calls `listTransactions({ limit: null
})`.
- Reads use household-scoped keyset ordering by transaction date, created time,
  and stable anchor ID.
- Requested pages use bounded raw-row lookahead for two-row transfer/Loan
  groups.
- Group activities carry a pagination anchor so grouped rows are not split or
  repeated across page boundaries.
- Active type and tag filters are applied to the bounded event query; semantic
  filtering still occurs on the projected activity.
- Existing Savings grouping behavior is unchanged; no same-day heuristic was
  added.

## Regression audit

PASS:

- Loan interest remains canonical Home Expense.
- Grouped Transactions Expense filtering includes interest-bearing payments.
- Loan principal remains neutral.
- Transfer, card payment, Savings principal, Investment principal, and Debt
  principal remain neutral.
- Investment fee and Savings tax/fee remain Expense.
- Refund, correction, reversal, opening-position, ownership, and privacy
  contracts remain unchanged.

## Validation

- Focused affected suite: **28 files, 234 tests passed**.
- Added pagination/query-shape and synthetic 1,000-row grouping coverage.
- Changed-file ESLint: **passed**.
- Focused authenticated Transactions/capture browser smoke: **5 passed**.
- Money i18n key parity: **1,981 keys matched**.
- Typecheck: **passed**.
- Build: **passed**.

The existing full i18n parity test still reports an unrelated pre-existing
`plan.unknownGoal` / `plan.unknownJar` mismatch; the Money namespace parity and
affected i18n tests pass. The disposable authenticated household contained no
Loan payment rows, so grouped-payment row/detail runtime coverage was verified
through the typed projector, detail contract test, and synthetic fixture rather
than by fabricating ledger data. Existing 09F browser evidence remains the
baseline for the 390/440/768/1280 Transactions matrix, privacy, reduced motion,
and overflow behavior.

The full unit suite and repository-wide lint were intentionally not run.
