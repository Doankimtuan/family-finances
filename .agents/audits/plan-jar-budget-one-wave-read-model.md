# Plan Jar Budget One-Wave Read Model

Date: 2026-09-11  
Scope: authenticated Plan hub (`/en/plan`) and the current jar-budget read path  
Database target: development Supabase project `family-finances-2` in `ap-southeast-2`  
Status: **ACCEPTED AND INTEGRATED**

## 1. Executive Summary

The first measured Plan optimization replaces the nine budget-specific remote reads behind `getCurrentJarBudgets()` with one authenticated, read-only RPC returning raw inputs. The financial formulas remain in TypeScript. The RPC is `SECURITY INVOKER`, accepts only `p_now`, resolves the active household from the authenticated identity, and relies on the existing RLS policies for every source-table read.

The acceptance gate passed:

| Gate                     | Result                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| Raw-input equivalence    | **PASS** — 20/20 paired runs matched semantically                                            |
| Final budget equivalence | **PASS** — 20/20 paired runs matched through the existing TypeScript summary pipeline        |
| RLS / tenancy            | **PASS** for member, anonymous, non-member, and caller-supplied-household probes             |
| Read-only behavior       | **PASS** — no write calls; pure-read unit test passed                                        |
| SQL execution            | **PASS** — 16.712 ms execution, 2,092 shared-hit blocks, 0 shared reads in `EXPLAIN ANALYZE` |
| Browser integration      | **PASS** — 10 authenticated 440px Plan loads rendered; one RPC returned 200 per load         |

The hosted paired benchmark reduced the budget branch from nine HTTP calls to one. In a disposable development fixture, candidate RPC median was 202.732 ms versus 212.066 ms for the interleaved nine-call wave; p95 improved from 568.528 ms to 261.250 ms. The median difference is intentionally modest because the old reads were parallel; the structural win is the removal of a dependent remote wave and eight request boundaries.

## 2. Baseline Being Optimized

The source investigation recorded the authenticated Plan hub at 27 warm Supabase/Auth fetches, four dependency waves, and a nine-call budget branch after the base pulse/settings dependency. Ten warm production-like browser loads had:

| Metric                         |       Baseline |
| ------------------------------ | -------------: |
| Content-complete median        |       1,607 ms |
| Content-complete range         | 1,120–1,667 ms |
| Document response-start median |         242 ms |
| Warm fetches per Plan load     |             27 |
| Budget-specific calls          |              9 |
| Dependency waves               |              4 |

The baseline numbers are from `.agents/audits/plan-performance-investigation.md`. PostgreSQL was already fast; the measured bottleneck was hosted request latency and dependency waves.

## 3. Existing Financial Contract

The current TypeScript path is the source of truth for financial behavior. The implementation deliberately keeps these functions and their semantics unchanged:

- `calculateQualifyingPostedIncome()` and `resolveQualifyingMonthlyIncome()`;
- `calculateJarRuleBudget()` and `calculateJarBudgetMetrics()`;
- `calculateJarSpentAmount()`;
- `resolveJarPlanForPeriod()`;
- `calculateRolloverCreditFromPreviousState()`;
- `summaryFromContext()`.

The RPC returns raw rows only. It does not calculate budgets, spent values, qualifying-income source, rollover credit, capacity, or final metrics.

## 4. Current Read Inventory

The replaced budget-specific reads were:

1. household settings;
2. current-period transactions;
3. current-period loan-payment IDs;
4. active recurring income rules;
5. current and previous snapshots;
6. previous-period transactions;
7. previous-period loan-payment IDs;
8. current-period adjustments;
9. previous-period adjustments.

The existing page-level `getPlanPulse()` jar read remains in place because it serves the pulse branch. The candidate includes jars as raw budget inputs so the budget computation no longer depends on a separate jar-ID discovery call within its own boundary.

## 5. Candidate Read Model

Migration: `supabase/migrations/20260911080208_plan_jar_budget_raw_inputs.sql`  
RPC: `public.get_plan_jar_budget_raw_inputs(timestamptz)`  
Application constant: `PLAN_QUERY_RPC.JAR_BUDGET_RAW_INPUTS`

The function is:

- `LANGUAGE sql`;
- `STABLE`;
- `SECURITY INVOKER`;
- `SET search_path TO 'public'`;
- executable by `authenticated` only;
- not executable by `public` or `anon`;
- parameterized only by `p_now`, never by a caller-supplied household ID.

The top-level JSON object contains household settings, current/previous period months, jar rows, current/previous transaction arrays, current/previous loan-payment ID arrays, recurring income rows, snapshots, and adjustments.

## 6. Raw Input Contract

| Source                      | Selected raw fields                                                                                  | Filters / period                                                    | TypeScript responsibility                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| `households`                | timezone, base currency, month-close mode, income-allocation mode, qualifying monthly income         | active authenticated household; Vietnam timezone fallback preserved | map settings and period                            |
| `jars` + latest `jar_plans` | id, name, kind, sort order, archive/pause state, rollover mode, plan kind, percent bps, fixed amount | household-scoped; latest plan row per jar                           | map active/paused/archived jars and plan           |
| `transactions` + `accounts` | id, type, amount, status, jar ID, savings event kind, reversal/correction IDs, reversal flag         | household financial scope; current or previous half-open period     | classify income/spend and reversal/correction legs |
| `loan_payments`             | transaction ID                                                                                       | household; current or previous `paid_at` period                     | mark budget transactions as loan payments          |
| `recurring_rules`           | existing recurring projection fields                                                                 | active household income rules only                                  | project events and resolve income fallback         |
| `jar_period_rule_snapshots` | existing snapshot fields                                                                             | current/previous month; active jars                                 | resolve historical plan and rollover state         |
| `jar_period_adjustments`    | jar ID, period month, amount                                                                         | current/previous month; active jars                                 | sum current/previous adjustments                   |

No aggregate or derived metric is emitted by the function.

## 7. TypeScript Integration

Only `getCurrentJarBudgets()` switched to the RPC. Its flow is now:

```text
assertMoneyActionAllowed()
  -> one RPC call with p_now
  -> validate and map raw JSON at the trust boundary
  -> mark loan-payment transactions
  -> project recurring income
  -> resolve qualifying income
  -> run unchanged summaryFromContext()
```

Malformed or cross-household RPC output returns `null` and is logged through the existing Plan failure path. `getJarBudgetsForPeriod()` and `collectCurrentPeriodSnapshotInserts()` retain the existing multi-read implementation because they serve historical/detail and write-preparation responsibilities outside this one current-hub optimization.

## 8. RLS / Tenancy Model

The candidate does not use a service role and does not bypass row-level security. It uses `public.investment_active_household()` only to resolve the authenticated user’s active household identity. That helper is an existing security-definer identity resolver; the candidate itself is invoker-security and all source-table reads execute under the caller’s RLS context.

Source tables touched are `households`, `jars`, `jar_plans`, `transactions`, `accounts`, `loan_payments`, `recurring_rules`, `jar_period_rule_snapshots`, and `jar_period_adjustments`. Existing policies scope these reads by household membership and, for transactions, by household financial scope.

## 9. RLS / Tenancy Matrix

| Probe                                          | Observed result                                                                        | Verdict |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- | ------- |
| Authenticated member with disposable household | HTTP 200; returned household ID exactly matched the fixture; no foreign household data | PASS    |
| Anonymous request                              | HTTP 401                                                                               | PASS    |
| Authenticated non-member                       | HTTP 200 with safe empty/null-shaped result; no foreign rows                           | PASS    |
| Arbitrary `household_id` request body          | HTTP 404; function has no such parameter                                               | PASS    |
| Cross-household caller selection               | Not caller-selectable; household is resolved from identity and RLS                     | PASS    |

The probes used disposable development data only. The fixture household and Auth user were cleaned up after verification.

## 10. SQL Plan Evidence

Executed on the development project with an authenticated fixture identity:

```sql
explain (analyze,buffers,format json)
select public.get_plan_jar_budget_raw_inputs(
  '2026-09-08T00:00:00.000Z'::timestamptz
);
```

Observed top-level metrics:

| Metric                   |    Result |
| ------------------------ | --------: |
| Planning time            |  0.015 ms |
| Execution time           | 16.712 ms |
| Actual total time        | 16.549 ms |
| Actual rows              |         1 |
| Shared hit blocks        |     2,092 |
| Shared read blocks       |         0 |
| Dirtied / written blocks |     0 / 0 |

PostgreSQL reports the SQL function boundary as a top-level `Result`; it does not expand the internal CTE scans and joins in this scalar JSONB function plan. The direct execution time is still far below the hosted request latency floor measured in the paired benchmark.

## 11. Raw Equivalence

Twenty interleaved paired samples compared the old nine-call raw-input wave with the candidate RPC using the same authenticated disposable fixture and the same `p_now`. Canonical comparison covered household settings, current/previous transaction fields, current/previous loan-payment IDs, recurring income, snapshots, and current/previous adjustments. The jar rows were also mapped through the live candidate path and covered by the final budget equivalence runs.

Result: **20/20 semantic raw-input comparisons passed**. No row, period, status, or household-scope mismatch was observed.

## 12. Final Budget Equivalence

The final comparison fed the old and candidate raw inputs through the same existing TypeScript context mapping and `summaryFromContext()` path. It compared the complete current summary and per-jar metrics over 20 paired runs.

Result: **20/20 passed**. The candidate did not move financial arithmetic into SQL and did not alter the public `CurrentJarBudgetSummary` contract.

## 13. Edge-Case Coverage

Application-level Plan tests cover fixed and percentage plans, configured/recurring/posted income precedence, excluded income classes, refunds and reversals, historical jar assignment, rollover reset/carry behavior, adjustments, snapshots, and pure-read no-write behavior.

The live disposable fixture intentionally stayed small and read-only: it exercised active jars and configured income, while current/previous transaction, loan-payment, recurring-income, snapshot, and adjustment arrays were empty. Those empty-array cases were matched exactly. No production financial data was changed to manufacture live edge cases.

Verdict: **PASS for preserved application semantics; live non-empty edge-row coverage remains the existing test suite’s responsibility.**

## 14. Benchmark Method

The direct benchmark used 20 interleaved pairs against hosted Supabase REST with the same authenticated session and timestamp. The current side issued the nine existing reads in the existing parallel shape. The candidate side issued one RPC. Each pair canonicalized raw results before recording latency. Errors were zero.

The response-size comparison is not treated as a success metric because the disposable fixture had mostly empty arrays: current total median/p75/p95/max was 107 bytes, while the candidate JSON envelope was 1,234 bytes.

## 15. Direct Benchmark Results

| Path                    | Calls |     Median |        P75 |        P95 |        Max |
| ----------------------- | ----: | ---------: | ---------: | ---------: | ---------: |
| Existing nine-call wave |     9 | 212.066 ms | 377.449 ms | 568.528 ms | 967.773 ms |
| Candidate raw-input RPC |     1 | 202.732 ms | 215.625 ms | 261.250 ms | 432.274 ms |

The optimization is accepted for request-boundary and tail-latency reduction. A larger median improvement would require changing the broader Plan page graph, which is outside this first measured slice.

## 16. Browser Reprofile

After integration, a dedicated development server ran with `VINHA_PERF_TRACE=1`. Chromium loaded `/en/plan` ten consecutive times at 440×956 after authentication.

| Metric                                     |                 Post-change sample |
| ------------------------------------------ | ---------------------------------: |
| Successful loads                           |                              10/10 |
| `plan-hub` and `plan-period-pulse` visible |                              10/10 |
| Median load-to-pulse-visible               |                         971.245 ms |
| P75                                        |                       1,059.071 ms |
| P95 / max                                  |                       1,633.290 ms |
| Min                                        |                         633.041 ms |
| New RPC responses                          | one HTTP 200 per sampled Plan load |

This is a development-server fixture sample using a pulse-visible marker, so it is not presented as a like-for-like replacement for the baseline production-like content-complete metric. The deterministic request inventory changes from 27 to 19: 9 budget-specific reads become 1 RPC. The trace confirmed the new RPC path on every sampled load.

## 17. Fetch and Wave Effect

| Measure                     |                  Before |                                          After |
| --------------------------- | ----------------------: | ---------------------------------------------: |
| Plan warm fetch inventory   |                      27 |               19 expected from unchanged graph |
| Budget-specific calls       |                       9 |                                              1 |
| Budget dependency wave      | 1 dependent remote wave |                      1 RPC in the page fan-out |
| Total page dependency waves |                       4 | 3 expected; the conditional inbox tail remains |

The page still has other broad parallel branches and the inbox enrichment tail. This change does not claim to solve those independent bottlenecks.

## 18. Advisor Review

Supabase security and performance advisors were run after applying the migration. No new finding targeted `get_plan_jar_budget_raw_inputs` or the new migration. Existing project-wide findings remain, including unrelated security-definer/search-path notices and existing unindexed foreign-key / unused-index notices. The candidate’s explicit invoker mode, fixed search path, authenticated-only grant, and no-parameter household selection were retained because they directly address the relevant RPC boundary risks.

## 19. Verification and Decision Gate

Checks run:

- targeted ESLint on all changed TypeScript files: **PASS**;
- TypeScript typecheck: **PASS**;
- targeted Plan budget tests: **23 passed**;
- full Vitest: **1,446 passed, 4 pre-existing failures** in unrelated query-shape/UI files;
- full repository lint: **10 pre-existing errors** in `output/` profiling scripts, plus warnings;
- changed-file Prettier check: **PASS**;
- repository-wide Prettier check: existing unrelated formatting warnings;
- migration applied successfully to the development Supabase project;
- live browser and RLS/tenancy checks: **PASS**.

Decision: **ACCEPT**. The one-wave raw-input read model is safe to retain and is integrated only on the current jar-budget hub path. The unrelated full-suite failures were not modified.

## 20. Raw Evidence

Implementation evidence:

- `supabase/migrations/20260911080208_plan_jar_budget_raw_inputs.sql` — RPC definition, grants, and source-table contract;
- `modules/plan/application/plan-constants.ts` — centralized RPC name;
- `modules/plan/application/queries/get-current-jar-budgets.ts` — boundary validation/mapping and current-budget switch;
- `tests/unit/jar-budget-get-pure-read.test.ts` — no-write current-budget regression test;
- `.agents/audits/plan-performance-investigation.md` — measured baseline and original request graph.

Development evidence:

- Supabase migration list contains `20260911080208 / plan_jar_budget_raw_inputs`;
- SQL `EXPLAIN ANALYZE` returned 16.712 ms execution with 2,092 shared hits and zero shared reads;
- 20/20 direct raw-input paired comparisons passed;
- 20/20 final budget equivalence comparisons passed;
- 10/10 authenticated browser loads rendered the Plan hub at 440px;
- disposable Auth user and household were cleaned up after verification.
