# Phase 2C — Financial Reconciliation

## F3 — partial sale valuation

The retained preexisting test holding has one 100-unit purchase at VND 100,000 (basis VND 10,000,000) and one 40-unit sale at VND 120,000. Persisted values after that sale were:

| Metric               |                 Expected |  Observed |
| -------------------- | -----------------------: | --------: |
| Remaining quantity   |                       60 |        60 |
| Remaining basis      |                6,000,000 | 6,000,000 |
| Sale proceeds        |                4,800,000 | 4,800,000 |
| Realized gain        |                  800,000 |   800,000 |
| Current market value | 60 × 120,000 = 7,200,000 | 7,200,000 |
| Unrealized gain      |                1,200,000 | 1,200,000 |

Authenticated replay of the original sale key returned an idempotent receipt. One sale operation and one linked cash proceeds transaction remained. The FPT holding itself was not changed during Phase 2C.

## Fresh synthetic lifecycle

The browser-created position bought 100 units at VND 100,000 and was marked at VND 120,000 before the sale sequence.

| Stage         |  Cash delta | Remaining position                         | Realized gain at stage |
| ------------- | ----------: | ------------------------------------------ | ---------------------: |
| Buy 100       | -10,000,000 | 100 units; basis 10,000,000                |                      0 |
| Sell 40       |  +4,800,000 | 60 units; basis 6,000,000; value 7,200,000 |                800,000 |
| Sell 20       |  +2,400,000 | 40 units; basis 4,000,000; value 4,800,000 |              1,200,000 |
| Sell final 40 |  +4,800,000 | 0 units; basis 0; value 0                  |              2,000,000 |

The three proceeds transactions sum to VND 12,000,000, each linked to one sell operation. The first sale replay did not create a duplicate transaction. At the first-sale checkpoint, cash was VND 54,400,000, the original FPT holding was worth VND 7,200,000, and the synthetic position was worth VND 7,200,000, reconciling to the Home screenshot’s VND 68,800,000 current assets. After liquidation, cash was VND 61,600,000 and the remaining FPT value was VND 7,200,000, still totaling VND 68,800,000.

After deleting only the fresh synthetic fixture, Supabase MCP recalculated aggregate account balances as B Checking VND 16,300,000, Cash VND 33,300,000, and Savings Products VND 10,000,000, totaling VND 59,600,000. This matches the pre-run cash total. The original FPT holding remains, so current assets returned to VND 66,800,000.

## F4 — loan schedules

The valid two-month RPC schedule reconciled to principal VND 12,000,000, interest VND 180,000, and repayment VND 12,180,000. The browser-created 12-month schedule reconciled to principal VND 12,000,000, interest VND 794,226, repayment VND 12,794,226, and final balance zero. Both created loan fixtures were removed after verification.

The rejected malformed RPC payloads rolled back. The separate zero-interest-for-12%-loan payload was internally balanced and **accepted**, so the schedule is numerically balanced yet financially inconsistent with its rate policy. This remains the blocking F4 finding; see [RPC security](rpc-security.md).
