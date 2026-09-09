# Phase 7 — Savings content audit

Savings answers: **how much have we committed to this savings product, and when does it mature?**

Inspected before changing: `.agents/design-system.md` (S7), Phase 1–6 artifacts, `APP_PATH`, savings list/detail/create/early-withdraw/providers, `modules/savings` presentation + RPCs, i18n EN/VI.

This is presentation only. No savings calculation, maturity math, rollover policy, or RPC shape was changed.

## Canonical routes (discovered)

| Surface | Route | Notes |
| --- | --- | --- |
| List | `/money/savings` | Inventory under Money → Growing money |
| Detail | `/money/savings/[id]` via `moneySavingsPath(id)` | Principal hero + lifecycle |
| Create | `/money/savings/new` | Existing 3-step wizard |
| Providers | `/money/savings/providers` | Catalog management; off the hero |
| Early withdraw | `/money/savings/[id]/early-withdraw` | Existing preview + confirm |
| Field edit | **none** | Renewal / maturity instruction is a sheet on detail |
| Rollover / settle | Detail sheets | Existing mutations only |

## Domain object

Savings is a **real financial product / asset**, not Hũ, Goal, cash account, or investment.

Families: `BANK` / `PLATFORM` (`SavingsFamily`). Types: `bank_deposit`, `digital_saving`, `flexible_saving`, `manual_saving`.

## Lifecycle (existing only)

Persisted `SavingStatus`: `active`, `matured`, `early_closed`, `closed`.

Presentation `SavingsMaturityState`: `active`, `maturing_soon`, `mature_today`, `matured`, `action_required`, `settled`, `early_settled`.

Cycle statuses include `rolled`. UI communicates lifecycle with **badge + label + meta text**, not color alone (`SavingsMaturityBadge`).

## Fields

| Field | Source | Kind |
| --- | --- | --- |
| Principal | Saving / cycle | server-provided current-state |
| Rate / term / maturity date | Product + cycle | server-provided |
| Family / provider / package | Catalog | server-provided |
| Maturity state | Presentation mapper | derived from existing dates/status |
| Expected net interest / received / tax | `buildSavingsOverviewModel` | existing overview; labeled **Expected**, not cash |
| Term progress (days elapsed) | Detail page from cycle dates | existing display, not a new formula |
| Ownership | ownership helpers | server-provided |

## Actions (existing only)

- Open product (`/money/savings/new`)
- Manage providers
- Early withdraw / settle early (capability-gated)
- Record renewal / maturity instruction (sheet)
- Settle / rollover via existing RPCs when the cycle state allows

Not invented: APY, projected wealth, net worth, guaranteed interest as cash, Hũ semantics.

## Validation

Unchanged. Create wizard still owns package, principal, rate/term/maturity from the catalog. UI did not add or remove fields.

## Unavailable / deferred

- No dedicated savings **edit** route for product fields.
- Expected interest remains on the list “At a glance” card because the overview model already exposes it; it is not treated as guaranteed principal.
- Bank family can be empty while platform products exist — empty copy is inventory, not fake products.
