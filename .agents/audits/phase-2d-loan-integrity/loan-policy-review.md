# Phase 2D — Loan policy review

**Status: PASS for reviewed supported strategies and regression cases**

The database validator was reviewed against the existing loan domain implementation in `modules/ledger/application/loan-amortization.ts`. It enforces the declared strategy at the authenticated RPC boundary without changing the product policy.

| Contract          | Existing application rule                                                                                                         | Database validation                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Monthly interest  | Annual percentage divided by 12 and 100; interest rounded half-up on the opening balance.                                         | Same annual-to-monthly conversion and PostgreSQL numeric rounding for each row.                                                        |
| Declining balance | Equal principal slices rounded half-up; final installment uses the remaining principal.                                           | Recomputes each principal slice and final residual from the loan row.                                                                  |
| Fixed monthly     | Rounded annuity payment; recalculates for remaining periods when the annual rate changes; final installment clears the residual.  | Recomputes the same payment at the start and on rate changes, then validates each principal, interest, payment, and remaining balance. |
| Promotional rate  | Uses the fixed rate until the configured switch date, then the floating rate; the payment is recalculated for the remaining term. | Recomputes the effective rate and expected payment for each due date and validates rate periods.                                       |
| Dates             | First payment date anchors every monthly due date; month-end dates clamp to the target month.                                     | Requires each due date to equal the first-payment date plus the sequence month.                                                        |
| Reconciliation    | Principal sums to original principal; repayment equals principal plus interest; final balance is zero.                            | Checks the same totals and the zero final balance before inserting schedule rows.                                                      |

Both implementations round nonnegative VND values half-up. The SQL numeric and application Number arithmetic can differ at extreme floating-point boundaries; this audit compared supported cases using independent Decimal/ROUND_HALF_UP arithmetic and exercised those cases through authenticated RPCs. It did not exhaust every possible principal/rate/term combination.

### Historical report correction

The Phase 2C loan E2E report labels a 12,000,000 VND, 12%, 12-month schedule as “reducing balance” while reporting first principal 946,185 VND and total interest 794,226 VND. Those figures match the existing fixed-monthly annuity calculation, not the app’s equal-principal reducing-balance method. The current database validator agrees with the TypeScript implementation; the earlier report’s method label is a documentation discrepancy, not a runtime mismatch.
