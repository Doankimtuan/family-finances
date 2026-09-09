# Phase 4 — Implementation notes

**Status:** Implemented. Does not overwrite `.agents/design-system.md`.

## What this phase did

Redesign Money into the **Financial Reality Hub**: one accessible-money hero, a scannable inventory, and labeled paths into existing destinations. Competitive products were principle sources only.

Money’s question:

> Where is our real money, and how is it sitting in the household inventory?

Home remains “how are we doing this period.” Money does not copy Home’s period story, Inbox preview, or Plan pulse.

## Hero decision

Primary number: **`totalOwnedBalance`** (active liquid accounts from `createMoneyHubViewModel`).

Financial kind: **current-state**.

Not used as hero: `calculateMoneyAssetOverview.total` (that mix includes estimated investments — Home already uses it as Total assets), Hũ, net worth, Free to Spend.

## Final composition (top → bottom)

1. **TopAppBar** — Money title, subtitle, account meta  
2. **Offline banner**  
3. **Hero** — accessible money + hint + account/card-debt meta + View transactions  
4. **Allocation strip** — accounts / savings current-state vs investments estimate  
5. **Accounts** — grouped rows in one elevated card; Add account  
6. **Credit cards** — separate liability list (outstanding, utilization, due/attention)  
7. **Growing money** — Savings principal, Investments estimate  
8. **Borrowed & owed** — Loans remaining principal, Debts borrowed (+ lent meta)  
9. **FAB** — Add transaction  

## Section decisions

| Section | Why it is here |
| --- | --- |
| Hero | P0 answer: accessible money |
| Allocation | P1 composition, analytics ceiling (no charts) |
| Accounts | P0 scan → open |
| Credit cards | P0 liabilities ≠ cash |
| Growing / Borrowed | P1 inventory groups + destinations |
| FAB | Canonical capture |

Empty Growing/Borrowed rows stay (“None yet”) so destinations remain visible. Empty accounts use the existing Add account sheet.

## Competitive principles applied

- **Monarch:** household inventory and grouping; reject net worth and widget soup  
- **Monzo:** fast scan, progressive disclosure, FAB capture; reject Pots-as-cash  
- **Copilot:** row hierarchy and restraint; reject Free to Spend  
- **YNAB:** intention stays on Plan; reject category grid / Ready to Assign / Age of Money  

## Shared components reused

`Page`, `TopAppBar`, `Card`, `Section`, `SectionHeader`, `Balance`, `Amount`, `FinancialValue`, `HeroPillLink`, `EmptyState`, `Skeleton`, `StatusAlert`, `FloatingAction` / `FloatingActionButton`, `MotionReveal`, `FinancialPrivacyToggle`, `AppIcon`, `IconContainer`, `StatusBadge`, `Progress`

## New / hub-local composition

No new shared primitives. Hub-local row composition lives in `money-accounts-scan.tsx` (`AccountInventoryRow`, `CreditLiabilityRow`) so AccountCard / CreditCardCard remain for destination and primitive tests.

## Contract safety

- Database / API / RPC / auth / validation / ledger math: unchanged  
- View models unchanged (presentation only)  
- Routes and five-tab IA: unchanged  
- 440px shell: unchanged  
- No mock or seed data  

## Known limitations

1. Money has **no period movement read model**; income/spending stay on Home. Transactions pill is the movement path.  
2. Investment estimate on the hub uses existing `marketValue` / coverage — incomplete valuations stay labeled, never zero-filled.  
3. Authenticated live Money may be blocked without a session in this environment.

## Recommended next phase

**PHASE 5 — TRANSACTIONS + ADD TRANSACTION**
