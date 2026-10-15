# Plan Performance Phase 5 — Household Period-Context Latency

**Run date:** 2026-10-12

## Result

The default Plan Overview route now starts its existing current-period Plan pulse and budget reads as soon as the page has verified the session and active membership. Household timezone lookup and period classification continue in parallel. The financial sections still wait for both the authorized period identity and the shared current financial model.

Historical requests with an explicit `month` query are classified before reads start, so historical routes do not begin current-only reads. The existing history snapshot path remains authoritative. This is a structural reduction of the dependency chain; a matched runtime improvement was not measured in this phase.

## Change and safety

- `loadCurrentPlanReads()` starts the existing `getPlanPulse()` and `getCurrentJarBudgets()` calls together. The page starts that promise only when `requestedMonth` is absent, after session and active-membership checks have passed.
- `getCurrentJarBudgets()` uses the existing authenticated membership gate and read-only budget RPC. It does not require the household timezone context before starting that RPC. The period resolver still reads the authorized household context, and the selected current month comes from the budget result when available, keeping the visible period aligned with the financial model.
- `getPlanPulse()` and the period resolver use the existing request-cached household context. No new data API, query, RPC, cache, migration, or browser-supplied household identity was added.
- Historical selections continue to use frozen period snapshots. Explicit `month` selections, including an explicit current month, retain the existing classify-then-read sequence; only the default current route is overlapped.
- Summary and Jar rows continue to consume the same `PlanHubData` promise. Authentication, active membership, RLS, calculations, and server-side household isolation are unchanged.

The new deferred-promise test proves that the default current budget and pulse calls start while household context is unresolved, while critical financial content remains pending until context resolves. Existing tests cover request-scoped household-context deduplication, household timezone/month boundaries, history snapshots, shared summary/Jar data, and slow secondary sections.

## Matched benchmark status

The requested matched benchmark was prepared with exact Phase 4 candidate source as control and the Phase 5 source as candidate. Both disposable copies used the same dependencies, `.env.local`, hosted Supabase project, Node 24.18.0, Next.js 16.3.1 `next dev`, and `INBOX_READ_ONLY_BENCHMARK=true`. The isolated headless Brave target was version 154.0.8037.98 at 390×844, `en-US`, `Asia/Ho_Chi_Minh`, light theme. No fixtures were created and no financial or Inbox mutations were issued.

A clean-cache run timed out waiting for the UI sign-in redirect to the authenticated route. Earlier partial runs reached a Plan page but did not finish a matched pair; their in-memory browser output was discarded. Therefore this phase has **0/10 accepted warm pairs**, no accepted cold pair, no financial fingerprint comparison, and no Phase 5 request-topology sample. The Phase 5 measurement cells below are intentionally blank; they must not be inferred from partial attempts.

| Metric                                    |     Phase 4 candidate reference p50 / p75 (ms) | Phase 5 matched p50 / p75 (ms) |         Delta |
| ----------------------------------------- | ---------------------------------------------: | -----------------------------: | ------------: |
| Session ready                             |                                      354 / 363 |                   Not measured | Not available |
| Membership ready                          |                            ~744 / not reported |                   Not measured | Not available |
| Household context / period identity ready |                                  1,133 / 1,205 |                   Not measured | Not available |
| Budget RPC started                        | Not separately reported; after period identity |                   Not measured | Not available |
| Budget RPC complete                       |                                  1,579 / 1,652 |                   Not measured | Not available |
| Financial model ready                     |                                  1,598 / 1,653 |                   Not measured | Not available |
| Financial RSC chunk delivered             |                                  1,615 / 1,671 |                   Not measured | Not available |
| Summary visible                           |                                  1,646 / 1,786 |                   Not measured | Not available |
| First Jar row visible                     |                                  1,646 / 1,786 |                   Not measured | Not available |
| Full RSC response complete                |                                  2,427 / 2,639 |                   Not measured | Not available |

Phase 4 recorded 16 Supabase HTTP requests per warm Plan navigation, including 2 household reads, 1 current-budget RPC, and 1 Plan pulse jars read. Phase 5 uses the same calls and adds no call site, so unchanged counts are source-derived; actual Phase 5 HTTP counts, start waves, RSC count/bytes, browser tail, and fingerprints were not measured. The route is expected to start the budget RPC before household context completes, but that timing also remains unverified at runtime.

## Validation

- Focused tests: **23/23 passed** across `plan-hub-critical-promise`, `plan-jar-budget`, and `home-household-context`.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Full `npm run test`: 266 files passed and 3 unrelated files failed; 1,844 tests passed and 5 failed. Failures were the English/Vietnamese `savingsPage.summaryCaption` parity assertion, the `break-words` versus `truncate` assertion, and three Phase 6 presentation tests missing `NextIntlClientProvider`. None are in the changed Plan code.
- No UI presentation changed. No database or fixture setup was run.

## Limits and next evidence

This phase proves overlap in deterministic tests and source flow, but not a user-visible timing gain or unchanged runtime request count. The required matched evidence still needs ten interleaved warm pairs, a cold-ish pair, RSC/request traces, and financial fingerprint equality after the E2E identity can complete sign-in in the isolated Brave context. The Phase 4 reference shows the opportunity but is not a Phase 5 result.

**Decision:** **PLAN PHASE 5 COMPLETE — STRUCTURAL IMPROVEMENT, TIMING INCONCLUSIVE**
