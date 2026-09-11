# Home Savings RPC Migration and Live Validation

Run date: 2026-09-10 UTC / 2026-09-11 ICT  
Project: `bbzffxvgocjwsdbujvgn` (`family-finances-2`)  
Scope: reconcile the known migration-history drift, deploy only the Home Savings read RPC, prove RLS and financial equivalence, remove the temporary fallback, and recapture Home performance.

## 1. Executive Summary

The migration-history reconciliation and Savings RPC deployment are complete.

- Remote-only version `20260908115411` was repaired as reverted.
- Local ledger version `20260908114845` was repaired as applied after proving the remote function already matched it.
- The dry run then listed only `20260910210229_home_savings_summary.sql`.
- Only that Savings migration was deployed.
- The deployed RPC is `SECURITY INVOKER`, uses `search_path = public`, and is executable by `authenticated` but not `anon`.
- Available active, empty, non-member, anonymous, and cross-household checks passed without financial-row mutation.
- The compatibility fallback was removed after the live RPC and equivalence checks passed.
- Five warm production-like Home loads show the Savings row marker visible on all runs and one Savings RPC per Home request.

The migration/RPC objective is complete. Repository-wide validation remains partial because the unchanged baseline still has four unrelated unit-test failures and ten generated profiler lint errors.

## 2. Pre-change Migration State

Before repair, `supabase migration list` showed:

| State            | Versions                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Local and remote | Through `20260908105528`                                                                    |
| Local only       | `20260908114845_get_account_ledger_balances.sql`; `20260910210229_home_savings_summary.sql` |
| Remote only      | `20260908115411`                                                                            |

The linked project was verified as `bbzffxvgocjwsdbujvgn`. No production financial rows were changed.

The Supabase migration guidance distinguishes migration-history repair from applying a migration: repair updates the tracking history, while `db push` applies pending migrations. See [Supabase database migration documentation](https://supabase.com/docs/guides/deployment/database-migrations.md).

## 3. Equivalence Proof for Version Drift

The remote-only `20260908115411` object was inspected before repair and compared with local `20260908114845_get_account_ledger_balances.sql`.

| Property              | Local migration                           | Remote function                      | Result |
| --------------------- | ----------------------------------------- | ------------------------------------ | ------ |
| Function              | `public.get_account_ledger_balances`      | `public.get_account_ledger_balances` | Match  |
| Argument              | `p_account_ids uuid[]`                    | `p_account_ids uuid[]`               | Match  |
| Result                | `TABLE(account_id uuid, balance numeric)` | Same                                 | Match  |
| Language / volatility | SQL / `STABLE`                            | SQL / `STABLE`                       | Match  |
| Security              | Invoker                                   | `prosecdef = false`                  | Match  |
| Search path           | `public`                                  | `search_path=public`                 | Match  |
| Grants                | `authenticated`, `postgres`               | `authenticated`, `postgres`          | Match  |
| Body                  | Batched ledger balance aggregation        | Same definition                      | Match  |

The inspected remote definition hash was `4725006e7a799aab324cfc9b897a6342`. Because the object was already present and semantically equivalent, the repair did not re-run that migration or recreate the function.

## 4. Migration-History Repair

Only the two authorized history repairs were run:

```text
supabase migration repair 20260908115411 --status reverted --linked
supabase migration repair 20260908114845 --status applied --linked
```

Both completed successfully. These commands changed migration metadata only; they did not mutate application or financial data.

## 5. Dry Run

Immediately after the repair and before deployment:

```text
supabase db push --linked --dry-run
Would push these migrations:
  20260910210229_home_savings_summary.sql
```

This was marked safe because the dry run contained exactly the one authorized Savings migration.

After deployment, the same dry run returned:

```text
Remote database is up to date.
```

## 6. Savings RPC Deployment

Only `supabase/migrations/20260910210229_home_savings_summary.sql` was deployed with:

```text
supabase db push --linked
```

The deployed function is:

```text
public.get_home_savings_summary()
RETURNS TABLE(
  active_count bigint,
  principal numeric,
  upcoming_maturity_count bigint,
  action_required_count bigint,
  nearest_maturity_date date
)
LANGUAGE sql
STABLE
SECURITY INVOKER
search_path=public
```

ACL verification:

| Role            | Execute |
| --------------- | ------- |
| `authenticated` | Allowed |
| `postgres`      | Allowed |
| `anon`          | Denied  |

## 7. RLS / Tenancy Matrix

Runtime checks used the public client with real authenticated tokens and read-only table/RPC calls.

| Identity / case                       | Active memberships |   Savings rows | Cycle rows | RPC result                             | Result       |
| ------------------------------------- | -----------------: | -------------: | ---------: | -------------------------------------- | ------------ |
| Active household with savings         |                  1 |             30 |         30 | `30 / 184253507 / 30 / 0 / 2026-09-12` | PASS         |
| Active household with no savings      |                  1 |              0 |          0 | `0 / 0 / 0 / 0 / null`                 | PASS         |
| Authenticated non-member              |                  0 |              0 |          0 | `0 / 0 / 0 / 0 / null`                 | PASS         |
| Anonymous caller                      |                N/A |            N/A |        N/A | PostgreSQL `42501`                     | PASS: denied |
| Cross-household read, both directions |     0 foreign rows | 0 foreign rows |        N/A | User-scoped RPC unchanged              | PASS         |

The RPC accepts no household identifier. Its result is derived from invoker-visible `savings` and `saving_cycles` rows, so the tenancy boundary remains the existing table RLS policy rather than an application-supplied household argument.

## 8. Financial Equivalence

For the active Savings fixture, the old two-read calculation and the new RPC returned exactly the same values:

```text
active_count:             30
principal:                184253507
upcoming_maturity_count:  30
action_required_count:    0
nearest_maturity_date:    2026-09-12
```

The active-empty and non-member cases also matched exactly at zero/null values. The source query preserves the existing business rules: exclude `closed` and `early_closed` savings, select the current cycle per saving, prefer active over matured, and use the highest cycle number for the tie-break.

## 9. EXPLAIN ANALYZE

The deployed function was explained without changing data:

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM public.get_home_savings_summary();
```

Observed result:

```text
Function Scan on get_home_savings_summary
  actual time=4.558..4.559 rows=1 loops=1
Buffers: shared hit=1070
Planning Time: 0.064 ms
Execution Time: 4.647 ms
```

PostgreSQL reports the wrapper as a `Function Scan`; the internal table/index nodes are not expanded in this output. The measured database execution is still far below the approximately 275 ms hosted request boundary measured in the prior benchmark.

## 10. Compatibility Fallback

The temporary `PGRST202` fallback was removed after deployment and live equivalence verification.

Changes:

- `getSavingsHomeSummary()` now uses the deployed RPC as the authoritative read path.
- `SAVINGS_RPC_ERROR_CODE` was removed.
- `savings-home-summary-legacy.ts` was deleted.
- The fallback-specific unit test and mocks were removed.
- Other RPC errors still log and return the existing unavailable state; they are not silently converted into a second query path.

## 11. Application Validation

| Check                       | Result                                                                       |
| --------------------------- | ---------------------------------------------------------------------------- |
| Focused Home/Savings tests  | PASS: 3 files, 12 tests                                                      |
| Typecheck                   | PASS                                                                         |
| Production build            | PASS: Next.js 16.3.1 optimized build                                         |
| Migration freeze validation | PASS: baseline plus 19 forward migrations                                    |
| Final migration list        | PASS: local and remote aligned through `20260910210229`                      |
| Full unit suite             | 1,442 passed; 4 unchanged failures                                           |
| ESLint                      | 10 unchanged `no-console` errors in `output/vinha-*.mjs`; 1 existing warning |

The four full-suite failures are unrelated existing assertions in the app-shell, Welcome preview, transaction pagination, and Savings date-domain tests. The only source mismatch fixed in this phase was the explicitly authorized `welcome-screen.tsx:116` translation key: `previewNetLabel` was corrected to the existing `previewHint` key so typecheck and build pass.

## 12. Home Performance Before vs After

The after profile used the existing `VINHA_PERF_TRACE=1` production server, a 390x844 Chromium viewport, the existing E2E account, and five warm document loads. No fixture setup or data mutation was run.

| Metric                         |                        Before: P8 |        After: five warm loads |                   Change |
| ------------------------------ | --------------------------------: | ----------------------------: | -----------------------: |
| Home wall-load median          |                          1,576 ms |                      1,420 ms |          -156 ms / -9.9% |
| Home TTFB median               |                            437 ms |                        373 ms |          -64 ms / -14.6% |
| Home load-event median         |        Not retained in P8 summary |                      1,317 ms |           Measured after |
| Total Supabase/Auth fetches    |                                20 |                            20 | No total-count reduction |
| Savings remote fetches         | 2: `savings` then `saving_cycles` | 1: `get_home_savings_summary` |              -1 boundary |
| Savings RPC median server span |                               N/A |                        291 ms |          New measurement |
| Savings row marker visible     |                      Not measured |                     5/5 loads |                     PASS |

After Home fetch inventory was identical on all five runs at 20 server fetch spans. Each run contained exactly one `get_home_savings_summary` call, zero legacy `savings` calls, and zero `saving_cycles` calls. The total Home fan-out therefore remained 20 in this trace even though the Savings portion dropped from two remote reads to one.

Raw after Home values:

```text
wall: 1420 / 1777 / 1194 / 1216 / 1769 ms; median 1420 ms
ttfb: 511 / 373 / 317 / 293 / 385 ms; median 373 ms
fetches: 20 / 20 / 20 / 20 / 20
Savings RPC spans: 291 / 301 / 370 / 282 / 289 ms; median 291 ms
```

The standalone Savings page continued to use its existing combined read path: one `savings` request and zero `saving_cycles` requests on each measured run. The profiler’s write scan found no calls to `backfill_legacy_savings_accounts`, `detect_matured_savings`, `enqueue_savings_maturity_cascade`, or `syncSavingsLifecycleAction`.

## 13. Remaining Bottlenecks

| Bottleneck                    | Evidence                                                                     | Status                     |
| ----------------------------- | ---------------------------------------------------------------------------- | -------------------------- |
| Hosted Supabase/Auth boundary | Existing direct medians around 273–283 ms; new Savings RPC median 291 ms     | Confirmed                  |
| Auth/membership gate          | After TTFB median 373 ms                                                     | Confirmed                  |
| Home fan-out                  | Still 20 fetch spans after Savings consolidation                             | Confirmed                  |
| Investment dependency wave    | Holdings, market instruments, prices, FX, and investment RPC remain separate | Confirmed                  |
| Account dependency wave       | Accounts still feed ledger-balance and owner-membership reads                | Confirmed                  |
| PostgreSQL execution          | Savings wrapper execution 4.647 ms                                           | Not the primary bottleneck |
| Region/network hypothesis     | No region experiment was authorized                                          | Inconclusive               |

## 14. Recommended Next Step

Stop the Savings work here. The RPC is live, equivalent, RLS-safe, and removes one dependent remote boundary.

If another Home improvement is required, benchmark one read-only investment or account aggregate next, with the same equivalence and tenancy gates. Do not add a broader multi-domain RPC until that benchmark proves a material critical-path reduction.

## 15. Raw Evidence

Migration and deployment commands:

```text
supabase migration list
supabase migration repair 20260908115411 --status reverted --linked
supabase migration repair 20260908114845 --status applied --linked
supabase db push --linked --dry-run
supabase db push --linked
supabase db push --linked --dry-run
supabase migration list
```

Final migration state included:

```text
20260908105528 │ 20260908105528
20260908114845 │ 20260908114845
20260910210229 │ 20260910210229
```

Final dry run:

```text
Remote database is up to date.
```

Validation artifacts:

- Focused test command: `npm run test -- tests/unit/home-dashboard-orchestration.test.ts tests/unit/home-product-summary-query-shape.test.ts tests/unit/money-summary-query-shape.test.ts`
- Profile output: `/tmp/vinha-rsc-profile-p8/profile.json`
- Server trace: `/tmp/vinha-perf-p8-server.log`
- Migration: `supabase/migrations/20260910210229_home_savings_summary.sql`

Safety statement: no production financial rows were inserted, updated, deleted, or otherwise mutated; no unrelated migration was deployed; and no infrastructure, project region, or Supabase configuration was changed.
