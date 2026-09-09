# Phase 6 — Accounts + Cards content audit

Accounts answer: **where is our real money kept?**  
Account detail answers: **what is this account, what is its current state, and what happened recently?**  
Credit cards answer: **how much do we currently owe on this card?**

Inspected before changing: `.agents/design-system.md` (S4), Phase 4 Money hub, Phase 5 Transactions, `APP_PATH`, Money hub scan, account detail, credit-card detail, create/edit/archive sheets, capture account selector, ledger account + credit-card types, i18n EN/VI.

## Canonical routes (discovered, not invented)

| Surface | Route | Notes |
| --- | --- | --- |
| Accounts inventory | `/money` | Design system + implementation: `/money/accounts` **redirects** to Money. Do not rebuild a standalone index. |
| Account detail | `/money/accounts/[id]` via `moneyAccountPath(id)` | Liquid/cash accounts |
| Credit card detail | `/money/accounts/[id]` | Same route; `account.type === credit_card` |
| Create | Money hub `AddAccountForm` sheet | No dedicated create route |
| Edit / archive | Account detail management sheet | Same sheet, modes `edit` / `archive` |
| Cards index | `/money/cards` | Existing redirect (D-028); not a Phase 6 destination |

## Account types (existing domain only)

Create options: `cash`, `checking`, `ewallet`, `credit_card`, `other`.  
Also in the model (not create-here): `savings`, `brokerage`, `savings_product`.

Money hub grouping keys already exist: cash / bank / wallet / savings / investment / other. Credit cards are a **separate liability list**, not an asset group.

## Fields

| Field | Source | Kind |
| --- | --- | --- |
| `id`, `name`, `type` | Server account row | persisted |
| `balance` | Ledger / `getAccount` | server-provided current-state |
| `financialScope`, ownership | ownership helpers | server-provided |
| `canMutate` | ownership | derived capability |
| Credit `outstanding` | `computeOutstanding(months)` in application | **not recalculated in UI** |
| Credit `creditLimit` | settings | server-provided; `<= 0` already means no limit for utilization display |
| `availableCredit`, `utilizationPct` | application helpers | server/read-model; UI only formats or hides |
| Recent activity | `listRecentTransactions(limit, accountId)` | existing preview query |
| Card activity | `card.items` already on `getCreditCardDetail` | no extra transaction query |

## Actions (existing only)

- Add account (hub sheet)
- Add transaction (account `QuickAction` → `/money/add`; global FAB unchanged)
- View transactions (`APP_PATH.MONEY_TRANSACTIONS` — no account filter in the events list)
- Edit name/type (type locked for credit cards)
- Archive (confirm; history remains)
- Pay card / convert installment / refund (credit, mutate-only)

Not invented: transfer, sync, statements as a new product, utilization formula, Net Worth.

## Validation

Unchanged Zod: `createAccountInputSchema`, `updateAccountInputSchema`. Opening balance is current-state, not income. Edit never exposes balance.
