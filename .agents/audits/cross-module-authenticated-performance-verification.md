# Cross-Module Authenticated Performance Verification

Date: 2026-10-12
Status: Partial — authenticated read-only verification completed where existing records allowed.

## Authentication environment

- Authenticated through the normal application login with the dedicated E2E identity configured in `.env.local`. Credentials were read in-process and never printed; the captured server log contained neither configured credential string nor cookie/authorization header values. No password rotation was performed, per the accepted test-account exception.
- Each Playwright run used a new ephemeral Chromium context. No saved browser state or personal Brave profile was used.
- The app ran as local `next dev` on an isolated port from a temporary project copy. Inbox verification used `INBOX_READ_ONLY_BENCHMARK=true` and `VINHA_PERF_TRACE=1`. `logging.serverFunctions` remained `false` in both the workspace and isolated runtime config.
- Before opening Inbox, `npx vitest run tests/unit/inbox-maintenance-safety.test.tsx` passed all 8 tests. The route’s development-only flag guard was confirmed, and the trace contained zero calls to either automatic maintenance callback.
- All checks used ordinary authenticated routes. No fixture/global setup ran; no Auth, household, account, holding, transaction, budget, goal, or Inbox records were changed. Buy/Sell forms were opened and canceled without submission.

## Existing fixture coverage

| Module      | Existing data and route coverage                                                                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inbox       | 0 open items, 0 archived items; no detail route available.                                                                                                                   |
| Plan        | Overview available; 7 jars and one jar detail available; 0 goals, so no goal detail route.                                                                                   |
| Investments | 20 active holdings. Across their detail routes, 12 exposed Buy and 12 exposed Sell; no holding exposed a valuation operation. Buy and Sell routes were available and opened. |

Counts are reported without financial values, names, or private identifiers.

## Inbox request topology and navigation timings

All Inbox samples are warm development-mode measurements. The queue reached its shell/empty state; there was no item content to time.

| Transition                      | Samples | First useful state p50 / p75 |                                    RSC requests |
| ------------------------------- | ------: | ---------------------------: | ----------------------------------------------: |
| Bottom Navigation → Inbox queue |      10 |             2,361 / 2,730 ms |                 10 total; 168,498 encoded bytes |
| Open → Archived                 |      10 |             2,342 / 2,364 ms | Included in 30 total across both tab directions |
| Archived → Open                 |      10 |             2,258 / 2,358 ms | Included in 30 total across both tab directions |

Each measured Inbox transition issued 6 Supabase HTTP requests (p50/p75), in 5 inferred overlapping waves (p50/p75); every response was HTTP 200. Per transition, the requests were one `/auth/v1/user`, two `/rest/v1/household_members`, one `/rest/v1/inbox_items`, one `/rest/v1/savings`, and one `/rest/v1/transactions`. The 20 tab switches produced 30 RSC requests and 170,959 encoded bytes.

Inbox → Detail, Detail → App Back, and Detail → Browser Back could not be measured because no open item existed. No read/unread or archive action was used.

## Plan rendering milestones

Ten warm Bottom Navigation → Plan samples produced:

| Milestone                           |      p50 |      p75 |
| ----------------------------------- | -------: | -------: |
| Plan heading visible                |    44 ms |    49 ms |
| Selected period and summary visible | 1,877 ms | 2,341 ms |
| First jar row visible               | 1,877 ms | 2,341 ms |

The Plan route issued 16 Supabase HTTP requests per sample (p50/p75), in 5 inferred overlapping waves (p50/p75); all returned HTTP 200. The ten-sample run contained 14 RSC requests and 373,448 encoded bytes.

The jar list showed 7 existing jars. One jar detail read reached its hero at 2,313 ms, with its budget metrics present. The goal list had 0 rows; its single observed route reached the heading at 2,668 ms. No goal detail benchmark was possible.

## Investments operations and Back navigation

The overview reached its loaded state in 2,162 ms in one sample. A selected holding detail hero appeared in 3,323 ms in one sample. A separate authorized scan opened all 20 existing holding details to count available operation controls.

Ten warm operation-route samples per operation produced:

| Operation | Route-ready p50 / p75 | Supabase HTTP per sample p50 / p75 | Inferred request waves p50 / p75 |                                 RSC requests |
| --------- | --------------------: | ---------------------------------: | -------------------------------: | -------------------------------------------: |
| Buy       |      1,845 / 2,342 ms |                            13 / 13 |                            2 / 3 | 2 per sample; 20 total, 74,415 encoded bytes |
| Sell      |      1,846 / 2,342 ms |                            13 / 13 |                            2 / 3 | 2 per sample; 20 total, 74,369 encoded bytes |

All operation-route Supabase responses were HTTP 200. The operation sheet’s Cancel control returned to the holding detail in a read-only check.

Detail → Investments list Back navigation was measured for five warm samples per path:

| Path         |    p50 / p75 | Supabase HTTP | RSC |
| ------------ | -----------: | ------------: | --: |
| App Back     | 131 / 139 ms |             0 |   0 |
| Browser Back |   80 / 85 ms |             0 |   0 |

The overview/detail visit recorded 4 RSC requests and 70,358 encoded bytes total. These are separate from the operation-route counts above.

## Confirmed regressions

No performance regression or improvement can be established against a matched control. All new timing evidence is from `next dev`; no production-build timing was collected. The prior Investments Phase 0 Buy trace is a single older sample from a different, unmatched context, so it is not a valid comparison. Plan has no runtime control arm.

The initial login redirect emitted a development stream-closed warning, and the browser emitted a HeroUI PressResponder warning. Neither recurred as a failed measured transition; this run does not establish either as a product regression.

## Remaining blockers

- Missing Inbox items prevent detail and detail-return benchmarks; no archived items were available.
- Missing goals prevent goal-detail and its Back-navigation benchmark.
- No matched control arm or production build was run, so development timings support no performance-gain claim.

## Recommended next performance optimization

Use the measured Plan hub path as the next candidate: its first summary and jar row appeared at p50 1,877 ms / p75 2,341 ms while each navigation made 16 Supabase requests across 5 inferred waves. Measure a matched baseline, then evaluate whether secondary attention/history reads can leave the primary summary’s critical path while preserving the existing household checks and financial read models. No performance implementation was changed in this verification.

**AUTHENTICATED VERIFICATION PARTIAL — MISSING TEST DATA**
