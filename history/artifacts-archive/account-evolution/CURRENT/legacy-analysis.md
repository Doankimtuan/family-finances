# Legacy Account domain analysis

Source: `archive/legacy-v1/` (reference only).  
Do not restore old architecture, UI, or technical debt.

## Domain shape

Legacy Money hub (`/accounts`) mixed:

1. **Liquid accounts** — `accounts` row + opening balance + ledger txs
2. **Credit cards** — same table + `credit_card_settings` + parallel billing ledger
3. **Term savings** — separate product tables
4. **Liabilities / debts** — amortization, not CC accounts
5. **Assets** — wealth lane (later de-scoped in v2)

## Account types (legacy DB)

`cash | checking | savings | ewallet | brokerage | credit_card | other`

Create UI offered: checking, savings, cash, ewallet, credit_card, other (no brokerage). Naming drift: helpers used `wallet` vs DB `ewallet`.

## Business rules recovered

| Rule | Legacy behavior |
|------|-----------------|
| Create | Name ≥ 2; opening ≥ 0 integer VND; soft flags `include_in_net_worth`, `is_archived=false` |
| Archive | Soft `is_archived=true` only; no restore UI; no hard delete in UI |
| Edit | **Not implemented** |
| CC create | Settings: credit_limit, statement_day (1–31 default 25), due_day hardcoded 15, optional linked bank; settings insert errors swallowed |
| CC spend | Expense/income → billing item via trigger; transfers ignored; **no credit-limit enforce** at spend |
| CC settle | FIFO across billing months; transfer source → card; no source balance check |
| EMI convert | Mark item converted; fee on month 1; blocks edit/delete of source tx |
| Cashback | Income on card rewired to latest unpaid cycle |
| Debt pay | principal+interest+fee ≤ amount; optional insufficient funds |

## State machines

- **Account:** created → listed → archived (hidden)
- **Billing month:** `open` → `partial` → `settled` (or statement ≤ 0 ⇒ settled)
- **Installment plan:** `active` → `completed` (`cancelled` in CHECK, no UI)
- **Liability:** active + principal reduced by payment principal

## User journeys

Create liquid/CC → list → (CC) detail settle/EMI/cashback → archive. Debt create/pay on separate surfaces. Transfer via activity. **No account edit.**

## Credit card subsystem (summary)

See `credit-card-analysis.md`. Highlights: statement_day cycles; due_date column never written; auto_pay unused; min payment was TDSR 5% proxy; available credit = max(0, limit − outstanding).

## Edge cases / debt (discard)

1. Dead link `/accounts/card/new`
2. `due_date` never populated; `calcDueDate` ignores statement_day
3. Convert preview math ≠ server; unused `createInstallmentPlanAction` double-counts fee
4. Phantom `card_billings` table in dashboard API
5. Hardcoded Vietnamese in settle/installment paths
6. Opening balance on CC unused for outstanding
7. Timezone billing-month bugs (migrated repeatedly)

## UX patterns worth recovering (intent only)

1. Money hub composition with clear liquid vs obligations
2. Progressive disclosure on create (CC settings only when type=CC — adapt to opening balance / type)
3. Usage / health signals (adapt to liquid health chips, not fake utilization)
4. FIFO payment storytelling (defer with CC proposal)
5. Empty billing / empty activity next-action copy
6. Soft archive over hard delete
