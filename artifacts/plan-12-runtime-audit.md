# PLAN 12 — Runtime and Source-of-Truth Audit

## Legacy path classification

| Reference | Classification | Finding | Action |
| --- | --- | --- | --- |
| `month_ritual_runs`, `approved`, `pending_review`, `previewed` | Historical compatibility | Existing rows and V1 migration history must remain queryable. | Keep storage and mapping; use informational `review_status` for V2. |
| `approveMonthRitual`, `previewMonthRitual`, `correctMonthRitual` | Intentional legacy-only support, but still exposed | The command file still contains preview/approve and lock-era branches. | Keep only as a deprecated adapter for historical callers; no V2 route should call it. |
| `assertPlanPeriodUnlocked` | Compatibility adapter | It is already a no-op and therefore does not enforce a hidden lock. | Keep thin and documented until all old callers are removed. |
| `runMonthRitualAutolockWorker` | Compatibility no-op | It returns zero changes and does not lock. | Keep only for old job callers; do not schedule or call from V2 routes. |
| `Quick Close`, completion streak, auto-lock fields | Deprecated historical behavior | No active V2 calculation should depend on them. | Preserve schema/history; remove active copy and logic where directly reachable. |
| `capacity_delta` | Legacy data field | V2 budget engine reads period adjustments; legacy migration must convert once. | Preserve column, add explicit deprecation comments, and prevent active runtime reads/writes. |
| `funded_amount` | Legacy manual field plus current database column | Linked Goals derive from sources; manual progress is compatibility-only for unlinked Goals. | Preserve value, avoid writing it for linked Goals, and label the UI as legacy. |
| `goal_contributions` / `contributeToGoal` | Compatibility-only | RPC refuses linked Goals and stores a legacy contribution audit row. | Keep for unlinked legacy Goals only; no linked Goal action may call it. |
| `buildAssistedSuggestions` | Compatibility adapter | It delegates to `getPlanRecommendations()` and does not rank independently. | Keep thin; document adapter status. |
| `getPlanRecommendations` | Authoritative | Single recommendation ranking engine used by Plan Home and Review. | Keep as the only implementation. |

## Source-of-truth matrix

| Concept | Source of truth | Verification result |
| --- | --- | --- |
| Money amount and account balance | Ledger/Money | Plan consumes transaction/account queries; no Plan mutation creates Money entries. |
| Savings value | Savings domain | Goal funding resolver reads current Savings values. |
| Investment value | Investment holdings/valuation | Goal funding resolver uses market value and marks missing/stale valuation. |
| Debt remaining | Loans/Debts domain | Payoff funding uses remaining principal/amount and original principal snapshots. |
| Jar rule | `jar_plans` plus current Jar configuration | Centralized in `jar-budget.ts`. |
| Jar spend | Historical `transactions.jar_id` assignment | Current category mappings are not consulted for past transactions. |
| Jar remaining | Derived budget minus spend | Centralized in `jar-budget.ts`; reallocation is Plan metadata only. |
| Goal links | `goal_funding_links` | Active links are unique per source and guarded by RLS/trigger/RPC checks. |
| Linked Goal funded/progress | Derived current source values | `goal-funding.ts` and Goal view-models derive it; linked Goals are blocked from manual contribution RPC. |
| Unlinked legacy Goal progress | `funded_amount` / `goal_contributions` | Compatibility-only and explicitly labeled in the Goal UI. |
| Monthly Review | `month_ritual_runs.review_status` and `review_snapshot` | Informational metadata; it does not lock Plan or Money. |
| Recommendations | `plan-recommendations.ts` | Shared by Plan Home and Monthly Review; Assisted adapter delegates. |

## Cross-domain security and concurrency findings

Plan queries are household-gated through the tenancy membership gate, while link mutations additionally validate the source household and goal type. Partial unique indexes enforce one active link per Savings, account, holding, loan, or debt source; inactive historical links do not block reuse. The Goal action migration must be repaired before deployment because its current local file contains malformed duplicated SQL and uses a mutable `search_path` in security-definer functions. Jar reallocation and Goal lifecycle/reassignment are expected to remain database RPC boundaries so their multi-row changes are atomic.

## Timezone and currency findings

The application period helper uses the household timezone, with `Asia/Ho_Chi_Minh` as the repository default. V2 migration backfills currently use UTC when selecting the current period; this is a deployment-time migration concern and must be changed to the household timezone. Household base currency is constrained to VND in the current tenancy preferences, and Goal source validation compares source currency to household currency before linking. Plan should continue rejecting mixed-currency aggregation rather than applying an implicit conversion.
