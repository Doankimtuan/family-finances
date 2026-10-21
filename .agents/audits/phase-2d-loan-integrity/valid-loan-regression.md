# Phase 2D — Valid schedule regression

**Status: PASS — all authenticated schedule cases reconciled**

Each case was submitted through an authenticated RPC context. Expected summaries were calculated independently using Decimal arithmetic and half-up rounding. Persisted row counts, principal and interest sums, repayment totals, first payment, and final balance matched.

| Scenario                                | Principal / rate / term      | Rows | Expected and actual interest | Repayment total | First payment | Final balance |
| --------------------------------------- | ---------------------------- | ---: | ---------------------------: | --------------: | ------------: | ------------: |
| Fixed monthly                           | 12,000,000 / 12% / 2 months  |    2 |                      180,299 |      12,180,299 |     6,090,149 |             0 |
| Declining balance                       | 12,000,000 / 12% / 2 months  |    2 |                      180,000 |      12,180,000 |     6,120,000 |             0 |
| Floating rate                           | 5,000,000 / 8% / 3 months    |    3 |                       66,814 |       5,066,814 |     1,688,938 |             0 |
| Promotional fixed 5%, then floating 12% | 12,000,000 / 12 months       |   12 |                      452,962 |      12,452,962 |     1,027,290 |             0 |
| One installment / final rounding        | 1,000,001 / 12% / 1 month    |    1 |                       10,000 |       1,010,001 |     1,010,001 |             0 |
| Twelve-installment declining balance    | 12,000,000 / 12% / 12 months |   12 |                      780,000 |      12,780,000 |     1,120,000 |             0 |
| Non-divisible principal                 | 12,000,001 / 12% / 3 months  |    3 |                      240,000 |      12,240,001 |     4,120,000 |             0 |
| Explicit zero interest                  | 1,000,000 / 0% / 3 months    |    3 |                            0 |       1,000,000 |       333,333 |             0 |
| Idempotent replay                       | 2,000,000 / 12% / 2 months   |    2 |                       30,050 |       2,030,050 |     1,015,025 |             0 |
| Partner-created loan                    | 1,500,000 / 0% / 3 months    |    3 |                            0 |       1,500,000 |       500,000 |             0 |
| Second-household loan                   | 500,000 / 5% / 2 months      |    2 |                        3,127 |         503,127 |       251,564 |             0 |

For every case, schedule principal summed to the original principal, interest summed to the stored total interest, and repayment equaled principal plus interest. Replaying the idempotent operation returned success without creating a duplicate loan or schedule. Invalid JSON shape and manipulated totals were rejected with atomic rollback; see [RPC exploit regression](rpc-exploit-regression.md).

The 12-month declining schedule is also verified in the browser. Its monthly principal is 1,000,000 VND, monthly interest declines from 120,000 to 10,000 VND, and the last remaining balance is zero. The previous Phase 2C test that was called “reducing balance” used fixed-monthly values; see the method-label clarification in [loan policy review](loan-policy-review.md).
