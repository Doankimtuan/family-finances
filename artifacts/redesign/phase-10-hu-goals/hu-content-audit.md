# Phase 10 — Hũ content audit

Presentation-only. Domain, APIs, queries, mutations, and jar budget algorithms were inspected and left unchanged.

## Canonical routes (from `APP_PATH` / path builders)

Discovered in `modules/shared-kernel/app-path.ts` and re-exported from `modules/tenancy/application/app-path.ts`.

| Route | Builder | Role |
| --- | --- | --- |
| `/plan` | `APP_PATH.PLAN` | Plan hub (Phase 9). Links into Hũ; not a Hũ inventory. |
| `/plan/jars` | `APP_PATH.PLAN_JARS` | Hũ list (this phase) |
| `/plan/jars/[id]` | `planJarPath(id)` | Hũ detail (this phase) |

English product term is **Jar**. Vietnamese product term is **Hũ**. Both remain intention envelopes.

There is no extra Hũ tab. Five product tabs remain Home · Money · Plan · Inbox · Together.

## Current Hũ IA (after this phase)

1. `TopAppBar` (detail variant) — title, intention subtitle, back to Plan, `PlanPrivacyToggle`
2. Concise list context (intention, not cash)
3. Allocation health alert when active jars exist (existing `calculateAllocationHealth`)
4. Income placement mode (existing `IncomeAllocateMode`)
5. Active Hũ collection — scan-first rows in one elevated card
6. Paused & archived behind `PlanDisclosure`
7. Existing create jar + create category actions

Detail:

1. `TopAppBar` — identity, back to list
2. Intention hero (`plan-jar-hero`) — planned percent/fixed/none, not a cash `Balance`
3. Remaining / over-by from existing `JarBudgetMetrics`
4. Metrics strip only when budget metrics **and** `usagePercent` already exist
5. Allocation-rules copy
6. Existing reallocate sheet + edit/pause/archive controls

## Existing Hũ fields (unchanged)

From `PlanJar` / `JarDetail`:

- `id`, `name`, `isNameCustom`, `kind`, `state`, `sortOrder`
- `capacityDelta` (deprecated V1 compatibility; not presented as cash)
- `rolloverMode`
- `plan` — `JarPlanKind.PERCENT` (`percentBps`) or `JarPlanKind.FIXED` (`fixedAmount`), or none

From `JarBudgetMetrics` (existing read model):

- `budgetAmount`, `spentAmount`, `remainingAmount`, `usagePercent`, `state`
- optional `ruleBudget`, `rolloverCredit`, `periodAdjustment`, `qualifyingIncome`, `incomeSource`

States: `JarState.ACTIVE` | `PAUSED` | `ARCHIVED`. Budget states include `HEALTHY`, `NEAR_LIMIT`, `OVERSPENT`, `NO_BUDGET`.

## Allocation semantics (preserved)

- Remaining / over-by is **budget vs plan**, not cash in a jar.
- `QualifyingIncomeSource.NONE` + `NO_BUDGET` → no remaining figure (do not show ₫0 as cash).
- `NO_BUDGET` without a usable remaining figure → progress omitted (`jarBudgetProgressPercent` returns `undefined`; missing data is not normalized to 0).
- Overspent uses existing `remainingAmount` absolute value + “over by” copy.
- Reallocate still calls `reallocateJarCapacityAction`. `availableToMove={Math.max(0, budgetMetrics?.remainingAmount ?? 0)}` is the **existing mutation constraint**, not a new household-cash calculation.
- Create/edit still uses `JarConfigurationForm` + existing actions. Copy states the plan is virtual allocation.

## Lifecycle / state

- Active jars are allocation targets.
- Paused and archived are secondary (`PlanDisclosure`).
- Archive confirmation copy already says no money moves.

## Current UX issues this phase addressed

- List used heavier cards; scan-first rows were needed.
- Amounts could be read as a jar “balance”.
- Missing budget was at risk of looking like ₫0.
- Reallocate “available to move” needed intention labeling.

## Proposed / implemented hierarchy

Scan-first rows (`JarCard`): name + kind · remaining or planned (`FinancialNumberKind.INTENTION`) · state badge · existing progress when `usagePercent` is present.

Hero communicates **purpose/planned intention**, not a giant Hũ cash balance. `FinancialAccountHero` / `Balance` are not used.

## Intention / cash boundary

| Amount | Kind | Meaning |
| --- | --- | --- |
| Planned percent / fixed | `INTENTION` | Envelope rule |
| Remaining / over-by | `INTENTION` | Plan tracking vs spend classified to the jar |
| Budget / spent columns | `INTENTION` | Same budget metrics; not an account ledger |
| Reallocate amount | `INTENTION` | Virtual capacity shift |

Cash remains in Money. Hũ does not answer “where is the cash?”
