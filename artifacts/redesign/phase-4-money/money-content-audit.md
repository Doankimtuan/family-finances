# Phase 4 — Money content audit

Money answers: **where is the household’s real money, and how is it moving at the inventory level?**

Inspected before changing: Money hub (`/money`), `getRealPosition`, `createMoneyHubViewModel`, `calculateMoneyAssetOverview`, `createMoneyHubModuleSummaries`, Accounts (list redirects to hub), Cards (redirects to Loans), Savings / Investments / Loans / Debts / Transactions destinations, Phase 2 shell, Phase 3 Home.

Hero number: **`totalOwnedBalance`** from `createMoneyHubViewModel` — sum of active liquid asset accounts (`isMoneyHubAssetAccount`). Not net worth. Not Home’s total-assets figure.

| Element | Current purpose | User question | Data source | Keep/Change/Remove | Reason |
| ------- | --------------- | ------------- | ----------- | ------------------ | ------ |
| TopAppBar | Identify Money hub | Where am I? | i18n + account count | KEEP | Hub chrome |
| Offline banner | Fail-closed mutations | Can I change money? | `MutationOfflineBanner` | KEEP | Existing offline contract |
| Position hero | Accessible liquid total | Where is usable money? | `viewModel.totalOwnedBalance` | REDESIGN | Same number; clearer current-state label, hint vs Plan/investments, a11y group |
| View transactions pill | Enter movement history | What changed recently? | `APP_PATH.MONEY_TRANSACTIONS` | KEEP | Movement entry; no second ledger |
| Allocation strip | Where resources sit | How is inventory composed? | `calculateMoneyAssetOverview` | REDESIGN | Same segments; investments stamped `estimate`; not a new aggregate |
| Accounts scan | Scan → open containers | Which accounts hold cash? | Real position accounts | REDESIGN | One inventory card + rows instead of one card per account |
| Add account | Empty / header create | How do I start? | Existing sheet | KEEP | Empty-state next action |
| Credit cards | Liability inventory | What do we owe on cards? | `listCreditCards` | REDESIGN | Separate grouped list; outstanding is current-state owed, not Balance-as-cash |
| Growing: Savings | Real savings products | What savings instruments exist? | `getSavingsHomeSummary` principal | KEEP | Principal current-state; destination owns detail |
| Growing: Investments | Holdings / estimated value | What is tracked, at what estimate? | `listInvestmentHomeSummary.marketValue` | REDESIGN | Show existing market value as `estimate`; coverage as meta; count fallback if no value |
| Borrowed: Loans | Remaining principal | What loans remain? | `listLoanSummaries` | KEEP | Destination owns schedule |
| Borrowed: Debts | Borrowed vs lent | What is owed / lent? | `buildDebtSummary` | KEEP | Neutral magnitude; lent as meta |
| FAB Add transaction | Global capture | How do I record movement? | `APP_PATH.MONEY_ADD` | KEEP | Phase 2 FAB |
| Period cash-flow / Home story | Home orientation | How did this period go? | Home dashboard | DEFER / not on Money | Home owns period story; Money has no period read model |
| Recent transaction list | Full history | What posted? | Transactions screen | MOVE | Remains on `/money/transactions` |
| Hũ / Plan | Intention | What should money do? | Plan | KEEP off Money | Reality vs intention; no Hũ-as-cash |
| Net Worth / Total Money / Free to Spend | Competitor metrics | Invented totals | — | REMOVE (never ship) | Contract rejects |
| `/money/accounts` index | Standalone list | Browse accounts | Redirect | KEEP redirect | Hub owns the scan |
| `/money/cards` | Cards app | Card index | Redirect to loans | KEEP redirect | D-028; credit lives on hub + account detail |

## Priority

- **P0** Hero, accounts inventory, credit liabilities, FAB, transactions entry
- **P1** Growing / borrowed module rows, allocation strip, empty/partial/unavailable
- **P2** Show-all accounts, ownership badges, coverage notes

## MOVE / REMOVE notes

- **MOVE:** Full transaction list, savings/investment/loan/debt detail — destinations unchanged.
- **REMOVE from surface:** Per-account Card soup; credit available/limit as competing hub numbers (still on account detail via existing CreditCardCard / credit hero).
- **DEFER:** Period income/spending on Money (no hub movement read model; do not duplicate Home).
