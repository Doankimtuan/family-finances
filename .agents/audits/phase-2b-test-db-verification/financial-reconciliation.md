# Phase 2B — Financial Reconciliation

**Status:** PASS for deterministic investment unit arithmetic; BLOCKED for persisted database and household aggregate reconciliation. Loan runtime reconciliation is BLOCKED.

All amounts are VND. The following is deterministic test input/output, not a database fixture or observed account state.

| Step                         | Remaining quantity | Remaining cost basis | Sale proceeds | Realized gain for step | Market value at 120,000/unit | Unrealized gain |
| ---------------------------- | -----------------: | -------------------: | ------------: | ---------------------: | ---------------------------: | --------------: |
| Buy 100 at 100,000           |                100 |           10,000,000 |             — |                      — |                   12,000,000 |       2,000,000 |
| Sell 40 at 120,000           |                 60 |            6,000,000 |     4,800,000 |                800,000 |                    7,200,000 |       1,200,000 |
| Sell 10 at 120,000           |                 50 |            5,000,000 |     1,200,000 |                200,000 |                    6,000,000 |       1,000,000 |
| Sell remaining 50 at 120,000 |                  0 |                    0 |     6,000,000 |              1,000,000 |                            0 |               0 |

The lifecycle unit test checks each step. Cumulative realized gain after liquidation is 2,000,000, equal to total proceeds of 12,000,000 less original basis of 10,000,000. The portfolio summary test verifies the first partial-sale state: 7,200,000 market value, 6,000,000 remaining basis, and 1,200,000 unrealized gain.

**Not reconciled:** browser refresh values, persisted sale proceeds exactly once, duplicate/replay behavior, cash-account state, and the actual household Home/net-worth aggregate. The preserved Phase 2 report's household numbers were inherited from the earlier audit and were not independently re-read in Phase 2B; they are not presented as current verification.

Loan amortization and integrity unit tests pass. No loan rows or installments were created, so schedule principal/interest totals and household debt aggregates were not reconciled against PostgreSQL.
