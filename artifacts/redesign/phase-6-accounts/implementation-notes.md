# Phase 6 — Implementation notes

**Status:** Implemented. Does not overwrite `.agents/design-system.md`. Presentation only.

## What this phase did

Tighten Accounts + Cards so inventory stays on Money, detail is scan-first, and credit cards stay **liability-first**. Competitive products were principle sources only.

## Canonical composition

### Inventory (Money hub — already the accounts index)

1. TopAppBar (Money)
2. Accessible-money hero (Money owns this; Accounts do not duplicate it)
3. Grouped account rows (name → balance → type)
4. Credit cards as a separate owed list (outstanding primary; no available/limit on the hub)
5. Add account in the section header / empty CTA
6. FAB remains Add transaction

### Account detail

1. TopAppBar (name + type)
2. `FinancialAccountHero` (`Balance` current-state)
3. Ownership / zero-balance note
4. Add transaction (mutate only)
5. Recent activity preview (`TransactionRow`, elevated list) + View transactions
6. Manage → edit / archive sheets

### Credit-card detail

1. TopAppBar
2. `CreditCardHero`: **current outstanding** via `Amount` (not `Balance`)
3. Utilization only when `creditLimit > 0` (existing read-model rule)
4. Available + limit **secondary**; incomplete facility shows “Not available”, not ₫0
5. Statement / installments / activity (read-only when `!canMutate`)
6. Pay card stays the mutate primary

## Decisions

- **No standalone `/money/accounts` list.** Redirect preserved. Rebuilding an index would violate S4 and navigation IA.
- Incomplete credit facility: `creditLimit > 0` is already the domain’s “has limit” signal (`utilizationForDisplay`). UI does not invent a new formula; it stops formatting ₫0 as a fake limit/available amount.
- Hub does not show available/limit (already true; tests now lock it).
- Capture selector: compact tiles and the expanded `SelectField` share type / credit-card labels. Eligibility unchanged.
- Activity stays a preview. Transactions has no account query param; the existing ledger link is used.

## Shared components reused

`TopAppBar`, `Card`, `SectionHeader`, `Balance`, `Amount`, `FinancialValue`, `FinancialAccountHero`, `TransactionRow`, `EmptyState`, `StatusAlert`, `Sheet`, `ActionSheetLayout`, `SheetActionFooter`, `AmountField`, `SelectField`, `ChoiceTile`, `AppIcon`, `FinancialOwnershipBadge`, `FinancialPrivacyToggle`, `Progress`

## New / local pieces

- `modules/ledger/ui/credit-facility-presentation.ts` — presentation completeness only
- Hero supporting-fact path that **does not** run unavailable copy through `FinancialValue` (privacy must not mask “Not available”)

## i18n

EN + VI: hub/accounts empty copy, `accountDetail.recentEmptyDescription`, `creditCard.valueUnavailable`, `creditCard.owedAriaLabel`, `creditCard.activityEmptyDescription`.

## Contract safety

Database, API, RPC, auth, validation, ledger math, utilization math, account types: unchanged. Five tabs and 440px shell: unchanged. No mock accounts or balances.

## Known limitations

1. `/money/accounts` is a redirect — inventory is on Money.
2. Transactions list cannot deep-link by account (no existing filter); detail preview uses `listRecentTransactions` already scoped to the account.
3. Authenticated live flows may be blocked without a session; do not bypass auth.
