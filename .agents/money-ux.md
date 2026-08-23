# Money Hub UX — Information Architecture

Companion to `.agents/design-system.md` §25 (visual rules live there; this file
records what the Money hub shows and why). Read both before changing `/money`.

## Role

- Home = status & insight ("Tình hình tài chính đang thế nào?").
- Money = inventory, structure & management ("Tiền đang nằm ở đâu, vận hành
  thế nào, và tôi làm gì tiếp?").

## Screen hierarchy (current)

| #   | Section                            | Answers                              | Data source                                                                  |
| --- | ---------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| 1   | Header (`TopAppBar` primary)       | Where am I, how many accounts        | `createMoneyHubViewModel().activeAccountCount`                               |
| 2   | Position hero (`Card tone="hero"`) | How much is accessible right now     | `totalOwnedBalance` (active liquid accounts only)                            |
| 3   | Composition strip (elevated card)  | Where the money sits                 | `composition` segments per account group                                     |
| 4   | Accounts scan + credit cards       | Which containers, card debt state    | `accountGroups`, `creditCards` (+ per-card attention)                        |
| 5   | "Growing money" module card        | Savings principal, investment size   | `listSavings` → `buildSavingsOverviewModel`; `countActiveInvestmentHoldings` |
| 6   | "Borrowed & owed" module card      | Loan principal left, debts owed/lent | `listLoanSummaries` (light read); `listDebts` → `buildDebtSummary`           |
| 7   | Floating Add Transaction pill      | Fastest frequent action              | canonical `FloatingAction` (same as Home)                                    |

## Module destinations

- Savings → `/money/savings` (create: `/money/savings/new`)
- Investments → `/money/investments` (create: `/money/investments/new`)
- Loans & installments → `/money/loans`
- Debts → `/money/debts`
- Transactions → `/money/transactions` (hero link; capture via floating pill →
  `/money/transactions/new`, which also offers owned-account transfer)
- Account detail → `/money/accounts/[id]` (accounts index is retired; the hub
  owns the scan list + create flow)

## Summary semantics

- Hero total = sum of active **liquid** account balances (`isMoneyHubAssetAccount`);
  credit cards are excluded and reported separately as "Card debt" when > 0.
- Savings row = `totalPrincipal` of active savings + maturity attention count.
- Investments row = active holdings **count only**. No portfolio value on the
  hub: valuation totals carry coverage/staleness semantics that belong to the
  Investments screens.
- Loans row = remaining principal of active loans (same household currency
  only) + due-state attention (overdue > due soon priority).
- Debts row = remaining **borrowed** amount (neutral color); money lent out is
  a quiet meta signal ("Lent {value}"), never mixed into the owed total.
- Failed domain reads render "Unavailable" — never a fake zero.

## Attention states surfaced

| Signal                                     | Source rule                 | Treatment                        |
| ------------------------------------------ | --------------------------- | -------------------------------- |
| Savings matured/action required            | `isMaturityAttention` count | warning pill                     |
| Loan payment overdue                       | `getLoanDueState` = overdue | attention pill                   |
| Loan payment due soon/today                | `getLoanDueState`           | warning pill                     |
| Debt overdue / due soon                    | `buildDebtSummary` counts   | attention / warning pill         |
| Card overdue / due soon / high utilization | `MoneyCreditAttention`      | in-card badge (accounts section) |

## Ownership

Hub-level module rows show no ownership badges (not decision-essential at this
level). Account rows keep the compact `FinancialOwnershipBadge`. Child screens
keep their existing ownership behavior.

## Implementation notes

- Pure hub derivation lives in
  `modules/ledger/application/money-hub-view-model.ts`
  (`createMoneyHubViewModel`, `createMoneyHubModuleSummaries`).
- Light queries: `listLoanSummaries` (loans table, stored columns only) and
  `countActiveInvestmentHoldings` (head count). Do not replace them with the
  full `listLoans` / `listInvestmentPortfolio` reads for hub decoration.
- E2E anchors on the hub: `money-hub`, `money-real-position-summary`,
  `money-see-activity`, `money-link-{savings,investments,loans,debts}`,
  `money-create-account`, `money-capture`, `money-accounts-show-all`.
