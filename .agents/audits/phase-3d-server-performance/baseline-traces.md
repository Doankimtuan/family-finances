# Phase 3D — baseline and server traces

## Environment and method

- Supabase MCP confirmed `family-finances-2` (`bbzffxvgocjwsdbujvgn`) as `ACTIVE_HEALTHY`, PostgreSQL 17.6.1, `ap-southeast-2`.
- Next.js 16.3.1 production build, served locally at port 3100 with safe path-only server timing enabled.
- Chromium, 440 × 900 viewport, authenticated run-scoped synthetic household.
- Seven requested route transitions; five fresh-context samples and ten reused-client samples per transition (105 samples total).
- Browser timing began before Playwright clicked the visible app link. A DOM observer recorded the first route loading marker when present and the first data-bearing content marker. Browser Resource Timing recorded `_rsc` request durations and counts. Server traces recorded Supabase REST/RPC request duration and selected auth/membership spans.
- Cold means a new browser context with the authenticated storage state. Warm means a reused page that navigated back to the source route between samples. These are browser-context conditions; Supabase/network caches were not reset.

## Pre-change baseline

The pre-optimization production run used the same test project and viewport, with five cold and ten warm samples per route. Its server trace summary reported these request durations (milliseconds):

| Supabase request                     | Calls | Median |   p95 |
| ------------------------------------ | ----: | -----: | ----: |
| `get_plan_jar_budget_raw_inputs`     |     4 |    268 |   344 |
| `inbox_items`                        |    30 |    347 |   789 |
| `household_members`                  |    39 |    340 | 1,076 |
| `get_home_account_ledger_raw_inputs` |    20 |    306 |   783 |
| `get_home_investment_raw_inputs`     |    20 |    312 |   624 |
| `get_home_savings_summary`           |    19 |    291 |   806 |
| `get_money_credit_card_raw_inputs`   |    10 |    281 |   612 |
| `loans`                              |    23 |    273 |   809 |
| `liabilities`                        |    24 |    279 |   618 |
| `transactions`                       |    28 |    297 |   782 |
| `households`                         |    29 |    285 |   654 |

The baseline log also showed `getUser` around 320 ms median, `membership.resolve` around 341 ms, and `getClaims` around 1 ms median. These timings include Supabase API/network time; they are not PostgreSQL-only execution times. The logger did not record full route-level render spans.

## Final trace summary

The final 105 browser samples recorded zero page errors. Across route groups, the median longest Supabase request in a sample was typically 264–357 ms; network tails reached 760 ms on Plan and 747 ms on Inbox → Home. The Plan route made a median of 11 REST/RPC requests per transition, Inbox 4, and Money 8. Counts include household authorization reads and, for Inbox, post-response worker calls when they fell inside the capture window.

The Plan transition traces no longer contained a `GET /rest/v1/jars` call. The existing budget RPC supplied both its budget rows and the `PlanPulse` jar summary. Other Plan requests remained parallel, including Inbox preview and upcoming-event sources.

## Timing interpretation

- The server wrapper logs one duration per Supabase HTTP request, not its internal SQL time.
- Browser `_rsc` duration is the resource's full observed network duration. Link pointer movement may trigger the app's existing pointerdown prefetch before navigation commits.
- The Plan database function received one separate read-only `EXPLAIN ANALYZE` measurement; see [Supabase query analysis](supabase-query-analysis.md).
- The Phase 3C benchmark reported only three samples per warm transition. Its raw runner was not retained, so those numbers are historical context and are not directly pooled with these 5/10-sample observations.
