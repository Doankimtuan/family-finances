# Phase 3D — Plan Hub performance

## Read graph

The Plan page authenticates and resolves household membership before starting page data. It then overlaps the selected-period identity, current budget reads, translations, budget history, Inbox preview, and upcoming events. Upcoming events fan out across recurring rules, cards, loans, liabilities, and loan schedules. The existing `get_plan_jar_budget_raw_inputs` RPC already returns jars with the current period's financial inputs; the application maps these once into budget calculations and a `PlanPulse` summary.

Before this change, `loadCurrentPlanReads` also called `getPlanPulse()` concurrently. That read fetched `jars` again and fetched household context, duplicating the jar REST request even when the budget RPC succeeded.

## Change

`CurrentJarBudgetSummary` now exposes the `pulse` already derived from its RPC response. The page uses `budgets.pulse` on success and calls the standalone `getPlanPulse()` only if budgets are unavailable. This keeps the old standalone fallback while removing the successful-path duplicate jar request. No plan formula, period rule, account scope, balance, or mutation changed.

## Measurements

- Final Plan transitions made a median 11 Supabase HTTP requests per sample, including membership and upcoming-event sources. Plan's budget RPC response measured 276–315 ms median warm, with observed tails up to 623 ms.
- PostgreSQL execution of the Plan budget RPC measured 25.008 ms with 1,765 shared-buffer hits on the tiny fixture. PostgREST request latency therefore dominates this RPC's database execution time in this run.
- Plan data-bearing content appeared at 1,207 ms median / 1,359 ms p95 on warm Add → Plan and 1,225 / 1,327 ms on warm Home → Plan.
- The comparable pre-change browser run recorded 1,612 / 1,643 ms on warm Add → Plan and 1,609 / 2,120 ms on warm Home → Plan. This is a directional improvement; run-to-run cache/network variation means it is not attributed entirely to the removed request.

## Decision

Keep the small deduplication because it removes a verified successful-path request while retaining fallback behavior. Do not add a summary RPC or alter caching: current query fan-out is parallel, and the isolated SQL execution is not the dominant measured delay.

## Source files

- [Plan route](<../../../app/[locale]/(product)/plan/page.tsx>)
- [Current jar budget query and pulse mapper](../../../modules/plan/application/queries/get-current-jar-budgets.ts)
- [Standalone Plan pulse fallback](../../../modules/plan/application/queries/get-plan-pulse.ts)
