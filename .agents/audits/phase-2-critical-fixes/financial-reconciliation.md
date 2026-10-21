# Phase 2 — Financial Reconciliation

## Test fixture lifecycle

All amounts are VND. This is deterministic unit-test input and expected output; it is not a new production read or transaction.

| Step                          | Quantity after step | Remaining basis | Sale proceeds | Realized gain for step | Market value at ₫120,000/unit | Unrealized gain |
| ----------------------------- | ------------------: | --------------: | ------------: | ---------------------: | ----------------------------: | --------------: |
| Buy 100 at ₫100,000           |                 100 |     ₫10,000,000 |             — |                      — |                   ₫12,000,000 |      ₫2,000,000 |
| Sell 40 at ₫120,000           |                  60 |      ₫6,000,000 |    ₫4,800,000 |               ₫800,000 |                    ₫7,200,000 |      ₫1,200,000 |
| Sell 10 at ₫120,000           |                  50 |      ₫5,000,000 |    ₫1,200,000 |               ₫200,000 |                    ₫6,000,000 |      ₫1,000,000 |
| Sell remaining 50 at ₫120,000 |                   0 |              ₫0 |    ₫6,000,000 |             ₫1,000,000 |                            ₫0 |              ₫0 |

The unit test verifies each remaining quantity, basis, sale-level realized result, and derived value. Cumulative realized gain on liquidation is `₫2,000,000`, matching total proceeds `₫12,000,000` less original basis `₫10,000,000`. The portfolio-summary test verifies the partial-sale state at `₫7,200,000` market value and `₫1,200,000` unrealized gain.

The sale RPC source stores the proceeds transaction and investment operation in one PostgreSQL function and checks an operation idempotency key before creating them. A second browser/RPC submission was not run, so exactly-once behavior is source-inspected, not Phase 2 runtime-verified.

## Household aggregate reported by the prior audit

Using the prior audit's post-trade fixture balances (cash `₫33,300,000`, checking `₫16,300,000`, savings `₫10,000,000`) plus corrected remaining investment value `₫7,200,000`, the reported total is:

`₫33,300,000 + ₫16,300,000 + ₫10,000,000 + ₫7,200,000 = ₫66,800,000`.

Using the stale investment total `₫12,000,000` yields the reported overstated `₫71,600,000`, a difference of `₫4,800,000`. These balances come from the preserved V2 audit report; I did not independently read or mutate household rows in this phase. The cash balance is already post-sale, so sale proceeds are not added again in this aggregate.

## Historical records and repair

No `current_valuation` column exists on `investment_holdings`; correcting the shared resolver affects future reads without rewriting historical rows. Historical snapshots that include a unit price can be valued against current remaining quantity. A snapshot without a unit price cannot be safely recomputed from that snapshot alone.

No production repair was run. A later reconciliation should first identify holdings whose stored snapshot total differs from remaining quantity × unit price, preserve the original snapshot/audit trail, get owner review for any ambiguous or unit-price-missing record, and apply only an approved, recoverable repair plan.

## Loan calculations

The loan amortization suite passed (13 tests) and the loan-integrity suite passed (4 tests). They validate local schedule math and application contracts, not PostgreSQL persistence. No loan was created in a live or local database during this phase.
