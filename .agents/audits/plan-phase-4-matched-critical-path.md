# Plan Performance Phase 4 — Matched Baseline & Critical-Path Attribution

**Run date:** 2026-10-12
**Decision:** **PLAN PHASE 4 COMPLETE — VERIFIED IMPROVEMENT, NEXT BOTTLENECK IDENTIFIED**

## Result

Ten interleaved warm navigations per arm show the first financial summary at p50 **2,121 ms** on the pre-Phase-1 control and **1,646 ms** on the current candidate, a **475 ms (22.4%)** reduction between medians. At p75 the measurements are **2,139 ms** and **1,786 ms**. The first Jar row has the same timing in each arm.

The traces show why: on the control, the financial model becomes ready at the same time as Inbox attention (p50 2,039 ms). On the candidate, the financial model is ready at 1,598 ms and Inbox attention at 2,416 ms. The financial RSC chunk arrives at 1,615 ms and the summary is visible at 1,646 ms, before the secondary Inbox work finishes.

The next measured financial-path target is the candidate’s **serial household period-identity read after membership**. It adds p50 390 ms after membership is ready and precedes both Plan pulse and the budget RPC. No optimization was implemented in this phase.

## Control and candidate

| Arm       | Source                                                                                                                                                                                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Control   | Exact source at `563f23c74c215db28ad96c9543ac3f4b77e7082b`, the commit immediately before the uncommitted Plan Phase 1 work. The current `next.config.ts` was overlaid so both arms use identical relevant configuration.                                                                        |
| Candidate | Snapshot of the current working tree at run start, containing Plan Phases 1–3. It also contains pre-existing unrelated dirty Inbox and Investments work; therefore this comparison validates the current candidate as a whole and does not assign every millisecond exclusively to Plan Phase 1. |

Both isolated copies used the same installed dependencies, `.env.local`, hosted Supabase backend, `logging.serverFunctions = false`, Node **24.18.0**, Next.js **16.3.1** with Turbopack in `next dev`, and the same app configuration. The pre-instrumentation filtered source-manifest hashes were control `ea66983cd17521557711d6cacfdf997103e1c51f` and candidate `8df8ed1be1ec01303580c17b0eb1376d4236345337fe3784528bbc39907b0e8c`.

The browser was isolated Playwright Chromium **153.0.8010.12** (Playwright **1.63.0**), with separate contexts for each arm, viewport **390×844**, locale `en-US`, timezone `Asia/Ho_Chi_Minh`, and light color scheme. The approved E2E account signed in through the UI. Both arms used the same existing household and hosted backend; all warm financial-model traces reported **7 jars**. No fixtures or data were created.

The warm run used one unmeasured route warm-up per arm, then ten Home → Plan SPA navigations in alternating control/candidate order. Each sample began at the Plan navigation click and ended when its RSC response completed. A separate cold-ish run cleared only the two disposable `.next` caches, started fresh dev servers, warmed login/Home through the UI, and measured the first Plan route once per arm. Those single samples are reported separately and are not used for p50/p75.

## Read-only route safety

The Plan page and its shared Product layout were audited before navigation. The Plan route reads jars, period history, Inbox items and source details, upcoming data, household context, and current budget inputs. The shared unread badge uses a `HEAD` count on Inbox items. None of these paths invokes Inbox maintenance callbacks or a financial command. The automatic maintenance workers are reachable from `/inbox`; that route was not opened. Both local servers also used the verified, narrowly scoped `INBOX_READ_ONLY_BENCHMARK=true` guard.

The two data `POST` RPCs observed during Plan navigation were checked as read-only SQL functions:

- `get_plan_jar_budget_raw_inputs`: `STABLE` SQL with `SELECT` statements only (`supabase/migrations/20260911080208_plan_jar_budget_raw_inputs.sql` and the later definition in `20260925145853_plan_personal_jar_expenses.sql`).
- `get_money_credit_card_raw_inputs`: `STABLE` SQL with `SELECT` statements only (`supabase/migrations/20260911055502_money_credit_card_raw_inputs.sql`).

The only authentication `POST` was the UI sign-in token exchange, outside the measured Plan window. No financial or Inbox mutation endpoint was observed. The focused Inbox maintenance and Next config security unit tests passed **9/9** in the disposable candidate copy. No global E2E setup or broad test suite was run.

## Supabase request topology

Each warm Plan navigation returned HTTP 200 for every recorded Supabase request. Counts below are per navigation; the two Plan-adjacent sources in the last row can also serve Inbox source enrichment, so endpoint counts are not a count of independent UI dependencies.

| Group                                  | Control calls | Candidate calls | Request paths                                                                                                                                                    |
| -------------------------------------- | ------------: | --------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth                                   |             1 |               1 | `GET /auth/v1/user`                                                                                                                                              |
| Membership                             |             2 |               2 | `GET /rest/v1/household_members`                                                                                                                                 |
| Household context                      |             3 |               2 | `GET /rest/v1/households`                                                                                                                                        |
| Plan pulse                             |             1 |               1 | `GET /rest/v1/jars`                                                                                                                                              |
| Current budget                         |             1 |               1 | `POST /rest/v1/rpc/get_plan_jar_budget_raw_inputs`                                                                                                               |
| History options                        |             1 |               1 | `GET /rest/v1/jar_period_rule_snapshots`                                                                                                                         |
| Inbox attention list                   |             1 |               1 | `GET /rest/v1/inbox_items`                                                                                                                                       |
| Upcoming and shared Inbox source reads |             7 |               7 | `GET` on `recurring_rules`, `loans`, `liabilities`, `loan_schedule_entries`, `savings`, and `transactions`; `POST /rest/v1/rpc/get_money_credit_card_raw_inputs` |
| **Total**                              |        **17** |          **16** | Candidate removes one household-row read.                                                                                                                        |

The request observer recorded start, response headers, and full-body completion. Values below are p50/p75 milliseconds from request start, pooled across the requests in each group and arm.

| Group                        | Control headers | Control body complete | Candidate headers | Candidate body complete |
| ---------------------------- | --------------: | --------------------: | ----------------: | ----------------------: |
| Auth                         |       319 / 338 |             321 / 340 |         304 / 316 |               306 / 317 |
| Membership                   |       393 / 399 |             395 / 400 |         386 / 394 |               388 / 395 |
| Household context            |       404 / 448 |             406 / 450 |         386 / 414 |               389 / 415 |
| Plan pulse                   |       407 / 412 |             410 / 414 |         410 / 433 |               413 / 437 |
| Current budget RPC           |       444 / 466 |             458 / 468 |         431 / 462 |               448 / 474 |
| History options              |       395 / 411 |             397 / 412 |         446 / 480 |               455 / 487 |
| Inbox item list              |       396 / 420 |             403 / 422 |         439 / 504 |               452 / 514 |
| Upcoming/shared source reads |       421 / 473 |             422 / 476 |         418 / 461 |               421 / 463 |

Overlapping start-to-header intervals have p50/p75 of **5 inferred request clusters** in both arms. Counts ranged from 4–5 in control (4 samples had 4; 6 had 5) and 4–6 in candidate (1 had 4; 7 had 5; 2 had 6). This is a timing heuristic, not proof that these are serial database waterfalls. Query spans and the route code confirm that several reads start in parallel. HTTP timing is not PostgreSQL execution time; no database query plan or server-side database timing was collected.

The shared Product layout keeps the unread badge mounted across the measured SPA navigation. Its `HEAD /rest/v1/inbox_items` count was observed outside the Plan click windows, with no badge request on a measured Plan navigation. It is not included in the 17/16 per-navigation totals.

## Warm matched timings

All values are milliseconds from the navigation click. p50 is the median; p75 uses nearest-rank on ten samples. “Ready” refers to the traced server stage; browser milestones use the same test IDs in both arms.

| Metric                        | Control p50 / p75 | Candidate p50 / p75 |
| ----------------------------- | ----------------: | ------------------: |
| Session ready                 |         369 / 382 |           354 / 363 |
| Plan heading visible          |     2,121 / 2,139 |           768 / 829 |
| Period identity ready         |         764 / 778 |       1,133 / 1,205 |
| Budget RPC complete           |     1,219 / 1,243 |       1,579 / 1,652 |
| Financial model ready         |     2,039 / 2,066 |       1,598 / 1,653 |
| RSC financial chunk delivered |     2,091 / 2,106 |       1,615 / 1,671 |
| Summary visible               |     2,121 / 2,139 |       1,646 / 1,786 |
| First Jar row visible         |     2,121 / 2,139 |       1,646 / 1,786 |
| History options ready         |     1,562 / 1,605 |       1,606 / 1,643 |
| Inbox attention ready         |     2,039 / 2,066 |       2,416 / 2,630 |
| Full RSC response complete    |     2,610 / 3,136 |       2,427 / 2,639 |

| Additional route data                 | Control p50 / p75 | Candidate p50 / p75 |
| ------------------------------------- | ----------------: | ------------------: |
| Plan pulse SDK span                   |         427 / 453 |           420 / 444 |
| Budget RPC SDK span                   |         461 / 471 |           454 / 480 |
| Period identity work after membership |             0 / 0 |           390 / 401 |
| Financial model elapsed span          |     1,262 / 1,300 |           855 / 895 |
| Inbox list SDK span                   |         406 / 426 |           458 / 522 |
| Inbox source-enrichment span          |         842 / 866 |           804 / 827 |
| History query SDK span                |         398 / 413 |           462 / 494 |
| Upcoming parallel-query span          |       532 / 1,057 |           566 / 605 |

The Plan pulse and budget projections completed within trace precision of their SDK spans (0–1 ms). The Inbox enrichment span includes its asynchronous source reads, so it is not a pure CPU mapping measurement.

## Cold-ish first navigation

Single observation per arm, in milliseconds from the navigation click. Login and Home were warmed by the harness; the first Plan route compilation was included after clearing each disposable Next cache. This is a development-mode cold-ish sample, not a production cold-start estimate.

| Metric                        | Control n=1 | Candidate n=1 |
| ----------------------------- | ----------: | ------------: |
| Session ready                 |       2,601 |         1,677 |
| Period identity ready         |       3,025 |         2,577 |
| Budget RPC complete           |       3,700 |         3,239 |
| Financial model ready         |       4,490 |         3,241 |
| RSC financial chunk delivered |       4,548 |         3,265 |
| Summary visible               |       4,611 |         3,521 |
| First Jar row visible         |       4,611 |         3,521 |
| History options ready         |       4,094 |         3,189 |
| Inbox attention ready         |       4,490 |         4,161 |
| Full RSC response complete    |       5,134 |         4,179 |

Both cold-ish navigations produced one RSC response. Decoded RSC body sizes were 117,825 bytes for control and 118,309 bytes for candidate. The sample count and dev compilation variance are too small to infer a cold-start improvement.

## Financial correctness and streaming

The harness compared per-pair HMAC fingerprints without writing raw values, identifiers, or fingerprint digests into this report. All **10/10 warm pairs** matched for selected period and currency, financial summary (including qualifying income, planned, spent, and remaining), and ordered jar state/allocation/budget metrics (including overspend state, rollover, and signed period adjustment). The browser fingerprint of the selected period, visible summary, and rendered jar rows also matched **10/10**. The single cold-ish pair's browser fingerprint matched as well.

All 10 warm financial-model traces reported 7 jars. The candidate's household-timezone/current-period consistency check passed on all 10 measured warm routes and the cold-ish route. Its period-timezone fingerprint matched the control's in both warm and cold-ish comparisons; no raw timezone or financial values were retained in the report. The selected period was not changed, and historical months were not selected or compared.

| RSC measure                  | Control p50 / p75 | Candidate p50 / p75 |
| ---------------------------- | ----------------: | ------------------: |
| RSC responses per navigation |             1 / 1 |               1 / 1 |
| Decoded RSC body bytes       | 117,661 / 117,829 |   117,804 / 117,949 |

The browser read the real `text/x-component` response stream and recorded when the shared financial marker arrived. On the candidate, the financial model was ready at p50 1,598 ms, the financial chunk arrived at 1,615 ms, and the summary/first row became visible at 1,646 ms. The median per-navigation gap from chunk delivery to visible summary was 25 ms (the difference between the stage p50s is 31 ms). Control's median per-navigation gap was 33 ms (29 ms between the stage p50s). These gaps do not suggest meaningful browser CPU work, so no CPU profile was taken.

The candidate's median per-navigation gap from visible summary to full response is 752 ms (the difference between the stage p50s is 781 ms). Inbox attention readiness has p50 2,416 ms and full response completion has p50 2,427 ms. In the control, the median per-navigation summary-to-response gap is 469 ms; upcoming events have p50 2,604 ms and full response completion p50 2,610 ms. Thus the candidate streams useful financial content well before the remaining Inbox tail, while full-response timing improves less than first-content timing.

## Remaining critical path and one next target

On the candidate's warm route, session is ready at 354 ms and membership at 744 ms. Period identity then takes another 390 ms (p75 401 ms); each measured route has one `GET /rest/v1/households` between membership readiness and period identity readiness. `resolvePlanPeriodIdentity()` awaits `getHomeHouseholdContext()`, and `resolvePlanHubData()` awaits that period promise before starting Plan pulse and current budget work. Control's 0 ms period stage comes from its fixed Vietnam timezone calculation; the candidate intentionally reads household timezone to calculate the current period correctly. Plan pulse and the budget RPC themselves each take about 0.4–0.5 seconds, and the RPC's own SDK duration is similar in both arms. The extra serialized context read is therefore the remaining measured delay on the first financial-content path.

**Next target:** remove the serial household-context dependency from Plan period identity by reusing the already-resolved request-scoped household context while preserving the candidate's household-timezone behavior. The measured 390 ms is an upper bound on recoverable time because a revised dependency may overlap other work. Do not repeat Phase 1's Inbox/history separation; the candidate already renders financial content before those secondary sections finish.

## Instrumentation, limits, and cleanup

- Temporary server and browser instrumentation recorded method/path/status, timing, byte counts, stage durations, and HMAC fingerprints only. It did not log credentials, cookies, auth headers, household IDs, or raw financial values. The same stream-cloning instrumentation was applied to both arms and may add small overhead; absolute values are instrumented `next dev` measurements.
- The user tagged Brave, but no isolated Brave automation target was available. The personal Brave profile was not used; the run used isolated Playwright Chromium. Results can differ in Brave or on a real device.
- The candidate snapshot includes pre-existing unrelated dirty Inbox/Investments files. That limits attributing every difference to only the Plan phases, although the matched fingerprints, route traces, and code path show the financial model moving ahead of Inbox attention.
- One `destination stream closed early` was logged only for the candidate's final Home cleanup response after its last Plan sample. All measured Plan RSC responses completed; this cleanup response was outside the measured Plan windows.
- This phase measured one viewport (390×844), one existing household, current-period data, one locale/theme, and `next dev`; it did not validate historical-month boundary behavior or production performance.
- Temporary source copies, `.next` caches, browser traces, logs, and the ephemeral HMAC key were removed after capture. The repository worktree was not used for instrumentation; this report is the only file added by Phase 4.

**Decision:** **PLAN PHASE 4 COMPLETE — VERIFIED IMPROVEMENT, NEXT BOTTLENECK IDENTIFIED**
