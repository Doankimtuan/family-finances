# Phase 7 — Implementation notes

**Status:** Presentation implemented. Does not overwrite `.agents/design-system.md`. Next phase is Investments — not started.

## What this phase did

Make Savings, Loans, and Debts **read as three different financial questions**, without changing domain rules:

- Savings → maturity-first product cards; principal primary
- Loans → remaining-principal-first rows; next payment secondary; principal vs interest labeled on detail
- Debts → counterpart + explicit owed direction; outstanding primary; grouped payable vs receivable

Money hub hierarchy is unchanged: Savings under **Growing money**; Loans/Debts under **Borrowed & owed**. Five tabs and the 440px shell are unchanged.

## Canonical composition

### Savings list

1. TopAppBar
2. Principal-held hero (`Amount`, `data-financial-object="savings"`)
3. Existing expected metrics (labeled Expected) + manage-providers pill **off the hero**
4. Bank vs App/platform **card stacks** (not one divided list)
5. Row: provider · rate/term → principal + “Principal” → maturity badge footer
6. FAB: Open savings product

### Savings detail

1. TopAppBar (product name)
2. Principal hero + maturity meta
3. Rate / term / dates
4. Lifecycle badge (existing maturity states)
5. Existing actions (settle early, renewal sheet, activity)

### Loans list

1. TopAppBar
2. Empty or grouped **elevated list** (intentionally not savings cards)
3. Row: lender/type → remaining principal caption → next payment text; no list progress bar
4. Add loan sheet

### Loan detail

1. Remaining-principal hero
2. Next payment card: amount, **principal**, **interest**, date (existing schedule fields)
3. Identity / terms
4. Progress only where mapper already has it
5. Pay / edit / archive sheets

### Debts list

1. TopAppBar
2. Empty, or **To repay** vs **Waiting to receive**
3. Row: counterpart → direction label → outstanding caption; icon tone follows direction; no list progress

### Debt detail

1. Outstanding hero + **direction label under the amount**
2. Counterpart / direction facts
3. Existing progress on detail only
4. Pay / receive / edit sheets

## Decisions

- **Do not unify the three lists.** Savings = interactive cards with maturity footers. Loans/Debts = elevated grouped lists. That difference is the UX.
- **Do not invent aggregates.** Savings hero uses existing `totalPrincipal` + product counts. No net worth / total wealth.
- **Do not calculate in the UI.** Principal vs interest on loans is `schedule` `principalDue` / `interestDue`. Debt outstanding is `remainingAmount`.
- **Forms:** field sets already matched the requested priority (savings product/principal/rate/term; loan lender/principal/terms; debt counterpart/direction/amount). Sheets were not rewritten.
- `data-financial-object` values `savings` / `loan` / `debt` follow the Phase 6 `credit-card` presentation marker pattern; tests lock them.

## Shared components reused

`TopAppBar`, `Page`, `Card`, `Amount`, `FinancialValue`, `FinancialOwnershipBadge`, `FinancialPrivacyToggle`, `StatusBadge`, `Progress` (detail only), `EmptyState`, `ErrorState`, `AppIcon`, `IconContainer`, `Section` titles, existing Sheets / `SheetActionFooter` / wizard forms, `MotionReveal`

## New / local pieces

No new shared financial-number primitive. Row components already lived next to the lists; they were re-hierarchied:

- `savings-product-row.tsx` — card + maturity footer
- `loan-product-row.tsx` — remaining principal + next payment
- `debt-product-row.tsx` — counterpart + direction text
- `debt-presentation.tsx` — required `directionLabel` on the hero

## i18n

EN + VI:

- Empty copy: savings ≠ cash; loans = remaining principal + payment context; debts do not assume owed vs receivable
- `debtsPage.youOwe` / `owedYou` / `payable` / `receivable` / `borrowedHint` / `lentHint`
- `debtDetail.direction`

## Contract safety

Database, API, RPCs, auth, validation, interest/maturity/repayment/debt math: unchanged. Navigation IA unchanged. No mock products, loans, or debts.
