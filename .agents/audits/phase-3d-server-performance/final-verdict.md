# Phase 3D — final verdict

## Verdict: COMPLETE IN TEST

Measured evidence identified one safe, verified duplicate read in Plan Hub and ruled out a database-index change for the current Inbox query. The change reuses the pulse already present in the Plan budget RPC result and retains the old independent pulse fallback when budget reads are unavailable.

## Findings

- Plan's redundant `GET /rest/v1/jars` is removed on the successful budget path. The Plan budget RPC executed in 25.008 ms on the test fixture; its PostgREST request took roughly 276–315 ms median on warm transitions.
- Inbox uses `inbox_items_open_read_cursor_idx`; its read-only query plan executed in 0.159 ms with 5 buffer hits on an empty test queue. An additional index is not justified.
- Home and Money already parallelize their module reads. Their server requests commonly take 250–350 ms each, while warm data-bearing content appears in roughly 0.9–1.0 seconds.
- The seven final browser transitions recorded 5 cold and 10 warm samples each, 105 total, with zero page errors. Results and limitations are in [before/after benchmark](before-after-benchmark.md).
- Financial semantics, household boundary, and fixture cleanup passed; the detailed scope is in [financial and RLS regression](financial-and-rls-regression.md).

## Changes and gates

Five application/test files changed for the Plan read-model optimization. No database migration or policy change is needed. Lint, typecheck, 271-file/1,882-test suite, migration validation, and production build all passed. Supabase returned the test database to its pre-fixture counts.

## Next phase

The next product phase can begin. Plan content still takes around 1.2 seconds on warm transitions, and other routes remain around 0.65–1.0 seconds. The remaining user-visible wait is handed to Antigravity for event-based active-state measurement if it remains visible; Phase 3D does not claim all navigation latency is solved.

## Evidence map

- [Baseline traces](baseline-traces.md)
- [Supabase query analysis](supabase-query-analysis.md)
- [Plan performance](plan-performance.md)
- [Inbox performance](inbox-performance.md)
- [Home and Money performance](home-money-performance.md)
- [Implementation summary](implementation-summary.md)
- [Before/after benchmark](before-after-benchmark.md)
- [Financial and RLS regression](financial-and-rls-regression.md)
- [Antigravity handoff](antigravity-handoff.md)
- [Remaining risks](remaining-risks.md)
