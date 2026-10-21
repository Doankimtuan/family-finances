# Phase 3D — implementation summary

## Root cause and fix

Plan Hub fetched jars twice on the successful budget path: once through `get_current_jar_budget_raw_inputs` and again through `getPlanPulse()`. The budget mapper already had the jar rows needed to build the pulse. The page now reuses that `PlanPulse` and retains `getPlanPulse()` as a fallback only when budget reads return `null`.

## Files changed for Phase 3D

- `modules/plan/application/queries/get-current-jar-budgets.ts` — expose the pulse already mapped from RPC inputs.
- `app/[locale]/(product)/plan/page.tsx` — remove the successful-path duplicate read and keep the unavailable-budget fallback.
- `tests/unit/jar-budget-get-pure-read.test.ts` — assert pulse jars match the RPC's mapped jar identity.
- `tests/unit/plan-hub-critical-promise.test.tsx` — assert the duplicate pulse read is skipped on success and retained for the null fallback.
- `tests/unit/plan-jar-detail-progressive-rendering.test.tsx` — update the typed budget fixture with its pulse.

The Plan page and test files were already modified in the shared worktree before this phase. Existing budget-availability work in those files remains intact; the Phase 3D contribution is limited to the read-model pulse and its tests. All other pre-existing worktree changes were preserved.

## Verification

- Focused Plan/budget checks: 4 files, 22 tests passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: 271 files, 1,882 tests passed.
- `npm run migrations:validate`: passed; no migration was added or applied.
- `npm run build`: passed; Next.js generated 111 pages.
- Authenticated production-browser benchmark: 105 transitions, 0 page errors.
- Supabase fixture cleanup restored the pre-run row counts; zero run-scoped households remained.

## Scope boundary

No UI behavior, database schema, RLS policy, RPC definition, financial calculation, or ledger mutation was changed. The only production behavior change avoids a repeated read of the same jar data on the successful Plan budget path.
