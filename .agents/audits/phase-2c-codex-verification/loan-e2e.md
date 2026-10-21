# Phase 2C — Loan E2E

**Status:** Browser happy path PASS; F4 overall is not FIXED IN TEST because policy-invalid amortization is accepted by the RPC.

## Browser flow

**Action and environment:** Account A created a unique 12-month, VND 12,000,000, 12% reducing-balance loan in the local app. The app submitted the loan, the detail page was opened and refreshed, the full repayment schedule was opened, and a separate Account B browser context opened the shared loan.

| Check                   | Expected                                                                         | Observed                                                                                                                             | Result |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| Create                  | Save the requested terms and schedule                                            | Loan creation succeeded and 12 installments persisted.                                                                               | PASS   |
| Schedule reconciliation | Principal 12,000,000; interest 794,226; repayment 12,794,226; final balance zero | Authenticated data read matched all totals. First row: principal 946,185, interest 120,000, balance 11,053,815.                      | PASS   |
| Detail and refresh      | Terms and next payment persist                                                   | Detail showed 12% rate, next payment 1,066,185 (946,185 principal + 120,000 interest), and total repayment 12,794,226 after refresh. | PASS   |
| Full schedule           | Schedule page contains installment rows                                          | Page title was “Full repayment schedule”; first and subsequent installment rows matched database values.                             | PASS   |
| Account B               | Shared household loan and rows are visible                                       | Separate Account B browser context opened the same loan detail; authenticated read returned all 12 rows.                             | PASS   |

Screenshots: [create terms](evidence/loan-create-terms-a-440.png), [detail](evidence/loan-detail-a-440.png), [schedule](evidence/loan-schedule-a-440.png), and [Account B detail](evidence/loan-detail-b-440.png). The schedule-page check uses its visible title and installment rows, not the loan name, which the page does not render.

The form preview briefly showed zero interest while the 12% field remained focused. After blur, it recalculated to VND 794,226 interest and VND 12,794,226 repayment; the saved schedule matched. This is a transient preview refresh issue, not a persisted financial mismatch. Evidence: [preview after blur](evidence/loan-preview-after-blur-440.png).

## Cleanup

The uniquely named test loan was removed by exact run scope after Account B verification. The final Supabase inventory reports zero loans and zero schedule entries. No existing household loans were present before or after the run.

The project has no separate household fixture, so an unauthorized cross-household browser denial was not attempted. Same-household Account B access passed; see [RPC security](rpc-security.md).
