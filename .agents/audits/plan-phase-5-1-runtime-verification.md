# Plan Performance Phase 5.1 — Runtime Verification

**Run date:** 2026-10-12  
**Result:** Runtime comparison blocked before either arm reached `/plan`.

## 1. Login timeout root cause

The failure was before authentication in the latest isolated Chromium attempt. The login page returned HTTP 200 in a fresh context with zero cookies, but the runner marked its form-readiness check false and stopped before filling or submitting credentials. A separate read-only inspection of the same login screen found both `#login-email` and `#login-password` visible, with no browser console or page errors. No Auth request was sent in that attempt.

An earlier fresh-context Chromium sign-in did succeed: the page and Supabase token request returned HTTP 200 (token request: 1,353 ms), the Next server-action POST returned HTTP 200, the client URL changed to `/en/home`, and the app became visible. That run took about 9.455 seconds through the redirect. This rules out a consistent Supabase Auth or redirect failure in Chromium. The later false negative is consistent with a runner readiness/locator or timing problem, but its exact cause is not established. The original Brave attempt’s raw logs were not retained, so its precise failure point cannot be reconstructed. No additional login attempt was made.

## 2. Control and candidate identities

Both sources share repository base `563f23c74c215db28ad96c9543ac3f4b77e7082b`; the relevant files were dirty working-tree sources, so the base commit alone does not identify either arm.

| Arm       | Source identity                                                                  | Plan page SHA-256                                                  |
| --------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Control   | Frozen Phase 4 candidate snapshot, pre-Phase-5 source (`/tmp/vinha-perf.IwBQCw`) | `44d5128cd68aed345d0b57682839d32a81bca633068e03115c20f9aa09fe9528` |
| Candidate | Phase 5 source copied from the current working tree                              | `b8e58fc016f4bb81626d51bfe43b6615fa3a3e0b0415bca91c64d434e8096e27` |

The two disposable arms used matching dependencies and configuration. Benchmark instrumentation and development outputs were confined to those copies; production source was not edited for the benchmark. No historical Phase 4 timing was used as a control measurement.

## 3. Runtime environment

- Node.js `v24.18.0`; Next.js `16.3.1` using `next dev` with Turbopack.
- Isolated Playwright Chromium `153.0.8010.12` with Playwright `1.63.0`; no personal browser profile. Brave was not used for the recovered comparison.
- Viewport `390×844`, locale `en-US`, household timezone `Asia/Ho_Chi_Minh`, light theme.
- Separate disposable source copies and `.next` outputs; same hosted Supabase configuration and approved existing E2E account. Login diagnostics used fresh browser contexts.
- Sensitive server-function logging remained disabled. No credentials or tokens were written to this report.

## 4. Read-only safety evidence

`next.config.ts` sets `logging.serverFunctions: false`; the disposable benchmark environment set `INBOX_READ_ONLY_BENCHMARK=true`. The run did not execute Playwright global setup or fixture scripts, create fixtures, or modify users, households, jars, goals, transactions, budgets, Inbox items, or investments. It did not navigate to `/inbox`.

Source inspection shows the current budget path calls `get_plan_jar_budget_raw_inputs`; its SQL function is declared `STABLE`, `SECURITY INVOKER`, and uses read-only CTE/select statements. The Plan route’s Inbox access is through `listOpenInboxItems`. No Plan route or shared-layout mutation was observed at runtime because authentication did not reach `/plan`; runtime absence of writes therefore remains unverified.

## 5. Actual request topology

The only captured application flow was sign-in: one Supabase `/auth/v1/token` POST returned 200, followed by a successful Next server-action POST and client-side navigation to `/en/home`. No Plan RSC response, Plan RPC, or Plan Supabase request wave was captured. Counts, RSC chunk counts, response sizes, and request sequencing for `/plan` are **not measured**, not zero.

From source, the default Plan route starts `getPlanPulse()` and `getCurrentJarBudgets()` together after session and membership checks, while household period identity resolves separately. This is source-derived topology, not an observed network trace.

## 6. Budget/context overlap measurement

The deterministic critical-promise test proves the current budget and pulse reads can start while household context is unresolved, and that financial content still waits for the required period/context data. Runtime RPC start, context completion, overlap duration, and critical-path elapsed time were not captured. The prior Phase 4 context-stage duration must not be treated as eliminated.

## 7. Matched benchmark results

There were **0 accepted cold Plan samples per arm** and **0/10 valid interleaved warm pairs**. Consequently p50, p75, per-pair differences, and statistical variability are unavailable.

| Milestone                       | Control p50 / p75 | Candidate p50 / p75 | Delta         |
| ------------------------------- | ----------------- | ------------------- | ------------- |
| Session ready                   | Not measured      | Not measured        | Not available |
| Membership ready                | Not measured      | Not measured        | Not available |
| Household context ready         | Not measured      | Not measured        | Not available |
| Period identity ready           | Not measured      | Not measured        | Not available |
| Budget RPC start / finish       | Not measured      | Not measured        | Not available |
| Plan pulse completion           | Not measured      | Not measured        | Not available |
| Financial model ready           | Not measured      | Not measured        | Not available |
| Financial RSC chunk delivered   | Not measured      | Not measured        | Not available |
| Summary / first Jar row visible | Not measured      | Not measured        | Not available |
| Full RSC response complete      | Not measured      | Not measured        | Not available |

No performance benefit, regression, or request-count change can be inferred from this run.

## 8. Financial fingerprint equality

No runtime fingerprints were collected for either arm. Current period, household timezone, currency, qualifying income, planned budget, spending, remaining amount, Jar count/order, overspending, rollover, and signed adjustments were therefore not compared between control and candidate. Deterministic domain regressions passed, but runtime financial equality is unverified.

## 9. Regression tests

All **47 tests passed** across these seven focused files:

- `plan-hub-critical-promise.test.tsx` — default current reads overlap unresolved context while content remains gated.
- `plan-jar-budget.test.ts`, `plan-budget-history.test.ts` — current budget and historical snapshot behavior.
- `home-household-context.test.ts` — request-scoped household context.
- `plan-jar-calculation-plan03.test.ts` — includes household-local month-boundary cases at `2026-07-31T16:59:59Z` and `2026-07-31T17:30:00Z`.
- `plan-month-ritual.test.ts` — deterministic period helpers and period rules.
- `jar-budget-get-pure-read.test.ts` — GET budget path does not insert snapshots.

Commands were focused Vitest runs only; no E2E global setup ran.

## 10. Recommendation

The structural overlap remains supported by source and deterministic tests. Runtime latency, actual request topology, and financial fingerprint equality remain unverified because the harness stopped before Plan navigation. Keep the Phase 5 code unchanged pending a stable isolated-browser run; do not start Phase 6 or claim a user-visible performance gain from this evidence.

Skipped matched timing and runtime fingerprint checks; the user-visible latency effect remains unknown.

**PLAN PHASE 5.1 INCONCLUSIVE — BENCHMARK ENVIRONMENT BLOCKED**
