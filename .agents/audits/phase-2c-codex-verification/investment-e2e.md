# Phase 2C — Investment E2E

**Status:** F3 FIXED IN TEST.

## Fresh synthetic flow

**Action and environment:** Chromium at 440px, local app against the verified `family-finances-2` project, Account A (`@family-finances.test`). The app created a uniquely named fund position by buying 100 units at VND 100,000 from the existing `B Checking` account. The app then recorded a manual VND 120,000 unit price, sold 40 units, replayed that sale through `record_investment_sell` using the same idempotency key from an authenticated API client, sold 20 units, then liquidated the remaining 40 units.

| Check                 | Expected                                                                                                    | Observed                                                                                                                                                                 | Result |
| --------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| Initial purchase      | 100 units; 10,000,000 VND purchase and cash debit                                                           | App created one buy operation and one linked transaction, with 100 units and 10,000,000 VND basis.                                                                       | PASS   |
| First sale            | 60 units; basis 6,000,000; value 7,200,000; unrealized 1,200,000; realized 800,000; cash proceeds 4,800,000 | Browser detail after refresh showed all values. Database operation recorded 4,000,000 basis consumed, 800,000 realized result, and 4,800,000 cash delta.                 | PASS   |
| Idempotent replay     | Same receipt; proceeds recorded once                                                                        | Authenticated RPC returned `idempotentReplay: true`; the linked 4,800,000 proceeds transaction count remained one.                                                       | PASS   |
| Account B shared read | Same household holding and permitted values                                                                 | Separate Account B browser context opened the synthetic holding and showed 7,200,000 market value and 800,000 realized gain.                                             | PASS   |
| Portfolio overview    | Includes current market values and gain totals                                                              | Overview showed 14,400,000 across the original FPT position and synthetic position, 12,000,000 known cost basis, 2,400,000 unrealized gain, and 1,600,000 realized gain. | PASS   |
| Home aggregate        | Cash plus valued assets reconcile                                                                           | Home showed current assets of 68,800,000 VND.                                                                                                                            | PASS   |
| Second partial sale   | 40 units remain; 4,000,000 basis; 4,800,000 market value; total realized 1,200,000                          | Database recorded 20 units sold for 2,400,000, consumed 2,000,000 basis, and realized 400,000.                                                                           | PASS   |
| Full liquidation      | Zero units and basis; realized gain includes all sales                                                      | Database recorded the final 40 units sold for 4,800,000, consumed the final 4,000,000 basis, and realized 800,000.                                                       | PASS   |

The three sales produced exactly three sale operations and three linked proceeds transactions totaling VND 12,000,000. Their realized results totaled VND 2,000,000. The position reached zero quantity and zero basis before cleanup.

## Existing FPT corroboration

The preexisting synthetic FPT holding was left unchanged. Its persisted history was one 100-unit buy at VND 100,000 and one 40-unit sale at VND 120,000. The authenticated replay using its original idempotency key left one sale operation and one proceeds transaction. Account A and Account B detail pages showed 60 units, 6,000,000 basis, 7,200,000 value, 1,200,000 unrealized gain, and 800,000 realized gain. Both Home pages showed the original household total of VND 66,800,000.

## Browser evidence

- [Synthetic Account A detail after refresh](evidence/investment-synthetic-partial-a-440.png)
- [Synthetic Account B shared detail](evidence/investment-synthetic-partial-b-440.png)
- [Portfolio overview](evidence/investment-synthetic-overview-a-440.png)
- [Home aggregate during the fixture](evidence/investment-synthetic-home-a-440.png)
- [Original FPT Account A detail](evidence/investment-detail-a-440.png)
- [Original FPT Account B detail](evidence/investment-detail-b-440.png)
- [Original FPT portfolio overview](evidence/investments-overview-a-440.png)
- [Original household Home](evidence/account-a-home-440.png) and [Account B Home](evidence/account-b-home-440.png)

## Cleanup and risk

After evidence capture, the run-scoped lot, valuation, four events, four operations, four related transactions, and synthetic holding were deleted by exact holding ID. A final MCP query confirmed zero rows with the run marker, one original FPT holding, and cash balances restored to VND 59,600,000. No unrelated rows were removed.

The separate foreign-household denial case remains untested because no second household exists in the project. Same-household access by the second member is verified. See [environment](supabase-environment.md).
