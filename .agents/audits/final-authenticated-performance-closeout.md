# Final Authenticated Performance Closeout

## 1. Executive Summary

**Final verdict: NOT READY TO CLOSE.** All eight primary routes and the optional Transactions route completed successfully in the same authenticated production build. Every measured navigation returned HTTP 200, with no browser errors or horizontal overflow. All accepted read-model, one-wave, streaming, and prefetch contracts checked here remain intact; no application regression was found.

Inbox is the remaining closeout blocker: first useful queue content had a 1,684 ms median and exceeded the 1,600 ms investigation threshold in all 10 measured samples. Its reads are split across four dependency stages including the auth/session gate. The source enrichment reads themselves remain parallel, but the repeated latency over three route stages makes this a route-architecture target miss compounded by the hosted request floor. This warrants a focused Inbox read-only follow-up before closing the workstream. No production changes were made.

**Closeout checks:** accepted optimizations PASS; prefetch regressions NONE; PostgreSQL FAST / NOT DOMINANT; application regressions 0; six evidence-backed debt entries remain (the Inbox target miss plus five accepted secondary-route items).

A preflight caveat is recorded in Environment: one preliminary unfiltered pass allowed Inbox's existing after-response workers to run. The final calibrated measurements suppressed those workers before network egress.

## 2. Environment

- Production build: Next.js 16.3.1 / React 19, built successfully with `npm run build`; TypeScript and 98 static pages completed. Served with `VINHA_PERF_TRACE=1 npm run start` on port 3132, one server process.
- The build ran in an isolated worktree at `ff4f1bf4`, with the current Inbox row prefetch source edit copied in. The actual workspace was clean at `52fd26da`; comparison confirmed its production source matched the build. Differences were audit/test files and that same Inbox row edit. No development-server timings were mixed in.
- Playwright Chromium, authenticated E2E household/session, Vietnamese locale, 440×900 viewport, light theme, reduced motion. One discarded warmup then 10 measured document navigations per primary route. Optional Money Transactions: one warmup, three measurements. Same production server and browser session throughout.
- Home's canonical product path is `/vi/home` (the locale root redirects). Every measured request was HTTP 200 and reached `networkidle`. There were 80 primary samples and 3 secondary samples; no console/page errors or horizontal overflow. Displayed fixture counts: Savings 30, Investments 16, Loans 0, Inbox open queue 6; Together member preview visible. No fixture setup was run.
- Percentiles use nearest rank: `sorted[ceil(p*n)-1]`. With 10 observations, p95 is the maximum. Timings are wall-clock milliseconds. “First useful” and “full content” are app-specific DOM markers; navigation `load` is reported separately because streamed sections may arrive after that event.
- Request traces were assigned to browser samples by calibrated server-clock request start time, avoiding log-arrival attribution skew. Captured traces contain sanitized path/method/status/timing only; no query values, user identifiers, tokens, response bodies, or financial amounts.
- **Preflight side-effect caveat:** before the final harness was in place, an unfiltered 83-sample preflight completed and allowed the normal `after()` Inbox workers on 11 Inbox navigations (warmup plus 10 samples). The two RPCs were `run_inbox_staleness_worker` and `sync_loan_debt_attention_inbox`; their known scope is Inbox-row updates in `public.inbox_items` and reads of loan/liability data. No financial-table writes were issued. The exact RPC results were not captured, so whether an Inbox row changed is unconfirmed. No compensating write was attempted.
- **Final official run:** a temporary Node preload intercepted those two post-response RPC paths before network egress and returned zero-result JSON. The trace confirms 22 calls blocked (11 navigations × 2 RPCs); all page data and read requests remained live and unchanged. No financial data mutation, schema/Auth/RLS/infra change, or production edit was made for this closeout.
- Repository checks: `npm run typecheck` passed. `npm run lint` failed on 10 `console` errors in `output/*.mjs` and emitted 2 warnings; none are in changed production files. `npm run test` had 227 test files pass and 4 fail (1,447 passed / 4 failed of 1,451): `market-valuation-query.test.ts`, `transaction-pagination-query-shape.test.ts`, `app-shell-foundation.test.tsx`, and `phase-15-auth-onboarding.test.tsx`. These are unrelated existing failures and were not changed. The report was subsequently checked with `npm run format:check`.

## 3. Final Route Matrix

P95 is the nearest-rank p95 of first useful content. Fetch and wave counts are stable per measured sample. Waves include the auth/session gate.

| Route               | TTFB median | First useful median |            P95 | Fetches | Domain calls | Waves | Classification                           |
| ------------------- | ----------: | ------------------: | -------------: | ------: | -----------: | ----: | ---------------------------------------- |
| Home                |      403 ms |            1,251 ms |       1,303 ms |      12 |            9 |     2 | PASS — SHARED HOSTED FLOOR               |
| Money               |      333 ms |              753 ms |       2,016 ms |      10 |            7 |     2 | PASS WITH VARIANCE — SHARED HOSTED FLOOR |
| Plan                |      333 ms |        680 ms pulse | 1,327 ms pulse |      19 |           16 |     4 | PASS WITH VARIANCE — MIXED               |
| Savings             |      460 ms |            1,367 ms |       2,899 ms |       5 |            2 |     3 | PASS WITH VARIANCE — MIXED               |
| Investments         |      499 ms |            1,328 ms |       1,590 ms |       4 |            1 |     2 | PASS — SHARED HOSTED FLOOR               |
| Loans (empty state) |      578 ms |              991 ms |       1,536 ms |       4 |            1 |     2 | PASS — SHARED HOSTED FLOOR               |
| Inbox               |      335 ms |            1,684 ms |       1,909 ms |       7 |            4 |     4 | INVESTIGATE — MIXED                      |
| Together            |      349 ms |              790 ms |       2,342 ms |       6 |            3 |     2 | PASS WITH VARIANCE — SHARED HOSTED FLOOR |

Plan's matrix KPI is the pulse marker; its full-content median is 1,693 ms and is detailed below. Loans had no rows in this authenticated fixture, so its result validates the empty state; the populated row prefetch contract is supported by source inspection and the earlier accepted populated benchmark.

## 4. Request Inventory

Counts are per load, except Transactions, which is per each of its 3 measured loads. “Domain” includes route reads and extra owner-membership validation; it excludes exactly one shared `/auth/v1/user`, one active-membership gate GET `/rest/v1/household_members`, and one shared unread-badge `HEAD /rest/v1/inbox_items` when present. Static assets are excluded. Post-hydration RSC requests are listed separately and are not included in Supabase/Auth fetch counts.

| Route                          | Total Auth/Supabase fetches | Domain-specific fetches | Post-hydration RSC requests |
| ------------------------------ | --------------------------: | ----------------------: | --------------------------: |
| Home                           |                          12 |                       9 |                           1 |
| Money                          |                          10 |                       7 |                           0 |
| Plan                           |                          19 |                      16 |                           0 |
| Savings                        |                           5 |                       2 |                           4 |
| Investments                    |                           4 |                       1 |                           2 |
| Loans                          |                           4 |                       1 |                           0 |
| Inbox                          |                           7 |                       4 |                           1 |
| Together                       |                           6 |                       3 |                           6 |
| Money Transactions (secondary) |                           5 |                       2 |                           0 |

Representative route request families, stable across samples:

- **Home:** Auth user; active membership gate; households; Home savings, investment, and account-ledger RPC/read paths; loans; liabilities; jars; Inbox GET and unread HEAD; transactions.
- **Money:** shared Auth/membership/unread; households, loans, liabilities; `get_home_savings_summary`, `get_home_investment_raw_inputs`, `get_home_account_ledger_raw_inputs`, and `get_money_credit_card_raw_inputs`.
- **Plan:** shared gate plus owner `household_members` validation; 3 distinct `households` reads; `goal_funding_links`, `goals`, Inbox, jars, liabilities, loan schedule entries, loans, recurring rules, savings, transactions; one plan jar-budget RPC and credit-card raw-input RPC.
- **Savings:** Auth, `household_members` twice (gate and owner validation), unread HEAD, one `/savings` GET with cycles embedded. No `/saving_cycles` N+1.
- **Investments:** Auth, membership gate, unread HEAD, one `get_investments_list_raw_inputs` RPC.
- **Loans:** Auth, membership gate, unread HEAD, one empty `/loans` GET; no row aggregates are applicable.
- **Inbox:** Auth, `household_members` twice (gate and owner validation), unread HEAD, queue GET, transactions GET, savings GET.
- **Together:** Auth, `household_members` twice (gate and active-member list), households, invitations, unread HEAD.
- **Money Transactions:** Auth, membership gate, unread HEAD, transactions, transaction tags.

## 5. Dependency Waves

Wave counts include shared auth/session and active-membership work. The unread badge HEAD runs alongside route reads after the gate, not as an added sequential stage.

| Route        | Observed dependency graph                                                                                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home         | W0 Auth + active membership; W1 parallel Home/product reads. 2 total stages.                                                                                                                 |
| Money        | W0 Auth + active membership; W1 parallel hub reads, including the credit-card raw-input RPC. 2 stages.                                                                                       |
| Plan         | W0 gate; W1 initial Plan reads; W2 transactions and savings Inbox-enrichment sources in parallel; W3 owner-membership validation. 4 stages. Jar-budget reads remain consolidated to one RPC. |
| Savings      | W0 gate; W1 savings GET plus badge; W2 owner-membership validation. 3 stages. Cycles are embedded in the single savings response.                                                            |
| Investments  | W0 gate; W1 one list raw-input RPC plus badge. 2 stages.                                                                                                                                     |
| Loans        | W0 gate; W1 empty loans GET plus badge. 2 stages.                                                                                                                                            |
| Inbox        | W0 gate; W1 queue GET plus badge; W2 transactions and savings enrichment in parallel; W3 owner-membership validation. 4 stages. No source-read serialization regression.                     |
| Together     | W0 gate; W1 household, active members, invitations, and badge. 2 stages.                                                                                                                     |
| Transactions | W0 gate; W1 transactions and tags plus badge. 2 stages.                                                                                                                                      |

There is no newly serialized request versus the accepted contracts. Plan's 3 household reads are distinct source reads, and its extra membership read is owner validation. Inbox's two source enrichment reads remain parallel; its total route still pays for the later validation/enrichment dependency graph, which contributes to the measured target miss.

## 6. First Useful Content

Targets: excellent `<800 ms`; good `800–1,200 ms`; acceptable `1,200–1,600 ms`; needs investigation `>1,600 ms median`. Plan is intentionally streamed, so pulse and full content have separate markers. Timing tuple format is min / median / p75 / p95 / max, in milliseconds.

| Route / marker                             | Timing tuple                          | Assessment                                              |
| ------------------------------------------ | ------------------------------------- | ------------------------------------------------------- |
| Home financial summary + product summaries | 1,183 / 1,251 / 1,258 / 1,303 / 1,303 | Acceptable                                              |
| Money hub / position summary               | 661 / 753 / 1,239 / 2,016 / 2,016     | Excellent median; one hosted/Auth outlier               |
| Plan pulse                                 | 667 / 680 / 1,189 / 1,327 / 1,327     | Excellent median; streaming retained                    |
| Savings summary                            | 1,281 / 1,367 / 1,814 / 2,899 / 2,899 | Acceptable median; one hosted/Auth outlier              |
| Investments portfolio summary              | 849 / 1,328 / 1,387 / 1,590 / 1,590   | Acceptable                                              |
| Loans empty-state route marker             | 801 / 991 / 1,455 / 1,536 / 1,536     | Good; empty fixture only                                |
| Inbox queue list                           | 1,674 / 1,684 / 1,740 / 1,909 / 1,909 | **Needs investigation: all 10 samples exceed 1,600 ms** |
| Together member preview                    | 683 / 790 / 1,214 / 2,342 / 2,342     | Excellent median; one hosted Auth/membership outlier    |
| Transactions list (secondary)              | 1,183 / 1,190 / 1,309 / 1,309 / 1,309 | Acceptable                                              |

## 7. Full Load Timings

Full content means the latest meaningful route marker: Home product summaries; Money hub; Plan pulse, jars, decisions/exceptions, upcoming items, and goals; Savings list content; Investments summary/holdings; Loans route/empty state; Inbox queue; Together preview/count/overview. It is not the browser `load` event. `load` remains useful for comparison but can precede streamed content.

| Route              | Full content min / median / p75 / p95 / max (ms) | Browser `load` min / median / p75 / p95 / max (ms) |
| ------------------ | ------------------------------------------------ | -------------------------------------------------- |
| Home               | 1,183 / 1,251 / 1,258 / 1,303 / 1,303            | 770 / 927 / 935 / 974 / 974                        |
| Money              | 661 / 753 / 1,239 / 2,017 / 2,017                | 759 / 846 / 947 / 1,805 / 1,805                    |
| Plan               | 1,650 / 1,693 / 1,707 / 1,829 / 1,829            | 1,140 / 1,203 / 1,304 / 1,320 / 1,320              |
| Savings            | 1,281 / 1,367 / 1,814 / 2,899 / 2,899            | 1,007 / 1,149 / 1,381 / 2,603 / 2,603              |
| Investments        | 849 / 1,328 / 1,387 / 1,591 / 1,591              | 801 / 828 / 843 / 1,043 / 1,043                    |
| Loans              | 801 / 992 / 1,455 / 1,537 / 1,537                | 758 / 873 / 959 / 1,135 / 1,135                    |
| Inbox              | 1,675 / 1,684 / 1,740 / 1,909 / 1,909            | 1,325 / 1,410 / 1,520 / 1,620 / 1,620              |
| Together           | 683 / 790 / 1,215 / 2,342 / 2,342                | 783 / 883 / 909 / 1,695 / 1,695                    |
| Transactions (n=3) | 1,183 / 1,190 / 1,309 / 1,309 / 1,309            | 832 / 918 / 965 / 965 / 965                        |

## 8. Prefetch Regression Check

- **Money transactions/detail links:** 25 visible transaction detail links plus one tag link on the secondary route produced 0 RSC requests. The accepted shared product-link prefetch opt-out remains effective.
- **Loans rows:** the current fixture had 0 rows, so this run cannot exercise a row link. `LoanProductRow` still uses the accepted `PRODUCT_LINK_PREFETCH` setting; the earlier populated benchmark recorded the accepted detail-prefetch reduction from 4 to 0. No new prefetch regression is indicated.
- **Inbox queue items:** 6 visible queue items produced 0 detail RSC requests. The explicit archived-tab prefetch remains at 1 RSC request per Inbox load.
- **Product navigation:** Home observed 13 product-navigation links and 1 `/vi/home` RSC prefetch request per load; the observed current Inbox row change is retained.
- **Together management:** 6 RSC attempts per load: 2 each for `/vi/together/members`, `/vi/together/invitations`, and `/vi/together/policies`, covering 4 management links. No Supabase/Auth fetch spans were attributed to those RSC requests in the trace. This is measured browser/server-component traffic, not proven data-loader amplification; Together prefetch was not globally disabled.
- Savings generated 4 RSC requests per load (two provider links and two detail links); Investments generated 2 conversion-route requests. No Supabase/Auth spans were attributed to these requests either. They are recorded as passive traffic, not as regressions.

**Result: no accepted prefetch regression.** RSC counts above are separate from the route's Auth/Supabase request totals.

## 9. Accepted Optimization Verification

| Contract                                                                   | Current evidence                                                                                                                                  | Result                |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Home consolidated account-ledger, investment, household, and savings paths | Stable 12 total / 9 domain reads and 2 waves; accepted read-model paths are present; no duplicate Home waves observed.                            | PASS                  |
| Money credit-card one-wave path                                            | `get_money_credit_card_raw_inputs` remains in the route's 7 domain calls; 2 total stages.                                                         | PASS                  |
| Money Transactions prefetch disabled                                       | 0 RSC requests across 25 detail links and 1 tag link.                                                                                             | PASS                  |
| Plan jar-budget raw-input RPC                                              | Exactly one budget RPC; 19 total / 16 domain calls, matching the accepted warm request shape.                                                     | PASS                  |
| Plan streaming and Inbox-source parallelism                                | Pulse median 680 ms; full marker median 1,693 ms; transactions and savings enrichment overlap in W2.                                              | PASS                  |
| Savings embedded cycle read                                                | One savings GET; no cycle N+1.                                                                                                                    | PASS                  |
| Investments list raw-input RPC                                             | Exactly one domain RPC; 4 total / 1 domain call, not the old 9-call route graph.                                                                  | PASS                  |
| Loan row prefetch disabled                                                 | Source still uses `PRODUCT_LINK_PREFETCH`; populated accepted benchmark remains supporting evidence. Current empty fixture cannot exercise a row. | PASS, fixture-limited |
| Inbox detail row prefetch disabled                                         | 0 detail RSC requests for 6 visible queue items; explicit archived-tab request remains 1.                                                         | PASS                  |
| Together member loading without profile/member N+1                         | 6 Auth/Supabase calls over 2 stages, including one members-list request; no per-member request growth.                                            | PASS                  |

No P0 contract regression was found. The Inbox latency miss is a remaining performance target, not a broken accepted optimization.

## 10. Hosted Variance Analysis

Several isolated tails are explained by hosted Auth/membership variance rather than a newly slow domain query:

- **Money:** sample 2 reached 1,158 ms TTFB and 2,016 ms useful content. `/auth/v1/user` took about 1,116 ms; subsequent domain reads were about 300–632 ms. Median is 753 ms.
- **Savings:** sample 3 reached 1,537 ms TTFB and 2,899 ms useful content. Auth took about 1,501 ms and membership about 819 ms; the later Savings read was about 680 ms. Median is 1,367 ms.
- **Together:** sample 4 reached 992 ms TTFB and 2,342 ms useful content. Auth was about 961 ms and the membership gate about 955 ms; later household/invitation calls were about 677–680 ms. Median is 790 ms.
- **Investments and Loans:** their largest TTFB samples align with the membership/Auth gate (about 691 ms for Investments membership; about 655 ms Auth / 648 ms membership for Loans), while medians remain 499 / 578 ms.
- **Plan:** pulse has a 680 ms median. Its later full marker is consistently about 1,650–1,829 ms because full Plan content waits for the accepted multi-stage data graph; this is expected streaming architecture, with no newly serialized dependency.
- **Inbox:** its TTFB median is only 335 ms, while useful content is 1,684 ms in every sample. No single request accounts for that stable gap. The gate, queue read, parallel enrichment sources, and later owner validation each add hosted request latency across four stages. The shared hosted floor is material, but the repeated multi-stage app dependency makes the route classification MIXED and crosses the explicit median target.

The trace does not support a browser rendering bottleneck or isolated slow PostgreSQL query as the explanation. The local `next start` result is not a measurement of the deployed Vercel runtime or a region-to-region production path.

## 11. PostgreSQL Verdict

**POSTGRESQL FAST / NOT DOMINANT.** Current route spans are dominated by Auth and remote Supabase HTTP round trips in the hundreds of milliseconds, with occasional Auth/membership outliers near one second. Historical read-only controls show SQL work far below that floor: the Supabase request-path audit measured a SQL `SELECT 1` control around 0.061 ms against a remote request median around 275 ms; the accepted Investments RPC plan completed its representative 20-row execution around 25.3 ms, and the Plan budget RPC was about 16.7 ms. No current trace identifies a slow SQL span that explains the Inbox route miss. Per the closeout instructions, broad EXPLAIN/plan reruns were not justified.

## 12. Secondary Route Debt

These are known secondary-route concerns, not measured primary-route regressions. All remain **ACCEPTED DEBT**; none is a release blocker based on current fixture volume and evidence.

| Secondary item                                    | Classification | Evidence and revisit condition                                                                                                                                                            |
| ------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Savings detail loader overlap                     | ACCEPTED DEBT  | Existing detail loaders overlap read work. Revisit if active/history grows beyond 100 rows or comparable detail first-useful median exceeds 1,600 ms for 3 runs.                          |
| Investment detail breadth                         | ACCEPTED DEBT  | Detail projection is broader than the list path; current list is 16 holdings and its one-RPC contract passes. Revisit above 100 holdings or if detail median exceeds 1,600 ms for 3 runs. |
| Loan detail duplicate payment/schedule reads      | ACCEPTED DEBT  | A known detail-route concern; current primary fixture has 0 loans and cannot measure it. Revisit above 20 loans or if populated detail median exceeds 1,600 ms for 3 runs.                |
| Together Members five ownership-impact reads      | ACCEPTED DEBT  | Known Members secondary path; primary Together hub shows no per-member N+1. Revisit above 10 members or if Members median exceeds 1,600 ms for 3 runs.                                    |
| Inbox archive fixed page limit / conditional jars | ACCEPTED DEBT  | Archive read is capped at 100 without cursor pagination; current open queue has 6 rows. Revisit above 100 archived rows or when payload/page evidence shows the cap affects users.        |

## 13. Performance Debt Register

Six evidence-backed items remain. The Inbox entry has already crossed its trigger and is the only current closeout blocker; the five secondary-route items remain accepted, with scale-based revisit triggers.

| Module             | Issue                                                                                          | Impact / evidence                                                                                                                                      | Trigger                                                                                                                                                                                         | Priority |
| ------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Inbox open queue   | First useful content waits through four dependency stages.                                     | 1,684 ms median and all 10 samples >1,600 ms, despite 335 ms TTFB; enrichment reads are parallel, no single slow endpoint explains the repeated delay. | Trigger met now. Run a focused read-only graph/ownership-validation investigation; only propose a change if it preserves authorization and read equivalence and improves repeated measurements. | P1       |
| Savings detail     | Overlapping detail loader reads.                                                               | Historical accepted audit identifies avoidable overlap; primary list path remains one embedded read.                                                   | >100 active/history rows or detail median >1,600 ms for 3 comparable runs.                                                                                                                      | P2       |
| Investments detail | Broader detail projection.                                                                     | Current list path is one RPC and 16 rows; debt applies to detail, not current list.                                                                    | >100 holdings or detail median >1,600 ms for 3 runs.                                                                                                                                            | P2       |
| Loans detail       | Duplicate payment/schedule work.                                                               | Existing secondary-route concern; primary fixture is empty, so no current populated impact measurement.                                                | >20 loans or populated detail median >1,600 ms for 3 runs.                                                                                                                                      | P2       |
| Together Members   | Five ownership-impact reads.                                                                   | Secondary route debt; primary hub remains two stages with no member N+1.                                                                               | >10 members or Members median >1,600 ms for 3 runs.                                                                                                                                             | P2       |
| Inbox archive      | Fixed 100-row cap without cursor pagination; conditional jars are loaded by shared enrichment. | Current open queue has 6 rows; archived growth risk is documented, but no current payload/latency blocker.                                             | >100 archived rows or measured user impact from payload/page evidence.                                                                                                                          | P3       |

## 14. Final Classification

| Route       | Route result       | Bottleneck class    | Reason                                                                                            |
| ----------- | ------------------ | ------------------- | ------------------------------------------------------------------------------------------------- |
| Home        | PASS               | SHARED HOSTED FLOOR | 1,251 ms useful median; accepted consolidated reads and 2 stages remain.                          |
| Money       | PASS WITH VARIANCE | SHARED HOSTED FLOOR | 753 ms median; isolated Auth outlier explains high p95.                                           |
| Plan        | PASS WITH VARIANCE | MIXED               | Pulse 680 ms; full content 1,693 ms through accepted streaming/data stages.                       |
| Savings     | PASS WITH VARIANCE | MIXED               | 1,367 ms median; one Auth/membership outlier drives tail.                                         |
| Investments | PASS               | SHARED HOSTED FLOOR | 1,328 ms median and single list RPC; membership variance explains TTFB tail.                      |
| Loans       | PASS               | SHARED HOSTED FLOOR | 991 ms empty-state median; populated rows not in current fixture.                                 |
| Inbox       | INVESTIGATE        | MIXED               | 1,684 ms median, all 10 samples >1,600 ms; stable multi-stage app graph compounds hosted latency. |
| Together    | PASS WITH VARIANCE | SHARED HOSTED FLOOR | 790 ms median; high p95 aligns with Auth/membership, no member N+1.                               |

**Closeout decision: NOT READY TO CLOSE.** No accepted optimization failed and application regressions are zero. The primary Inbox route repeatedly misses the target through its multi-stage route graph, meeting the brief's NOT READY condition for a major route with an app-architecture contribution. First action is a narrow, read-only Inbox dependency investigation; no broad optimization is justified by this audit alone.

## 15. Recommended Future Triggers

- **Now — Inbox:** investigate queue first-useful dependency stages and owner validation. Use the same authenticated session, production build, route marker, and 10-sample method. Close the blocker only when repeated comparable runs put the median at or below 1,600 ms, or evidence isolates a purely hosted cause without an app dependency miss.
- **Savings:** revisit detail overlap only above 100 active/history rows or when detail first-useful median is over 1,600 ms for 3 consecutive comparable runs.
- **Investments:** revisit detail breadth above 100 holdings or with detail median over 1,600 ms for 3 runs.
- **Loans:** revisit detail duplicate reads above 20 loans or with populated detail median over 1,600 ms for 3 runs.
- **Together Members:** revisit the five ownership-impact reads above 10 members or with route median over 1,600 ms for 3 runs.
- **Inbox archive:** introduce pagination investigation when archive volume exceeds the fixed 100-row cap or user-visible payload/page evidence demonstrates impact.
- Treat isolated high p95 values as hosted variance unless three comparable runs show a repeatable domain/query or application-span regression. Revisit PostgreSQL only if a route and its direct endpoint both become materially slow.

## 16. Raw Evidence

Each primary array is the 10 measured samples in run order, after one discarded warmup. Units are milliseconds. For each route the columns are TTFB, first useful, full content, and browser `load`. First-useful and full-content arrays are identical except Plan, where full content waits for later streamed sections. Percentiles are nearest rank as stated in Environment.

| Route       | TTFB samples                                 | First useful samples                                  | Full content samples                                  | `load` samples                                        |
| ----------- | -------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| Home        | `[386,403,339,403,452,390,403,411,333,450]`  | `[1242,1254,1190,1251,1303,1246,1255,1258,1183,1299]` | `[1242,1254,1190,1251,1303,1246,1255,1258,1183,1299]` | `[911,930,943,817,935,770,927,929,823,974]`           |
| Money       | `[308,1158,328,388,386,496,328,380,319,333]` | `[661,2016,1184,747,753,1354,1190,1239,669,683]`      | `[661,2017,1184,747,753,1355,1191,1239,669,683]`      | `[789,1805,781,884,909,947,985,827,846,759]`          |
| Plan        | `[328,338,471,321,307,335,388,342,330,333]`  | `[674,1189,1327,667,1146,680,1242,692,677,677]`       | `[1695,1695,1829,1674,1650,1693,1744,1707,1686,1684]` | `[1190,1218,1320,1163,1140,1182,1317,1203,1232,1304]` |
| Savings     | `[458,447,1537,628,460,448,538,423,509,511]` | `[1308,1299,2899,1473,1814,1306,1388,1281,1867,1367]` | `[1308,1299,2899,1473,1814,1306,1388,1281,1867,1367]` | `[1078,1039,2603,1359,1473,1082,1149,1007,1381,1170]` |
| Investments | `[530,499,736,495,459,484,581,511,531,464]`  | `[880,853,1590,849,1328,1332,1446,1363,1387,1318]`    | `[880,853,1591,849,1328,1332,1447,1363,1387,1318]`    | `[843,815,1043,801,834,834,884,819,819,828]`          |
| Loans       | `[507,650,530,690,441,612,607,578,684,461]`  | `[1357,991,867,1536,1295,1455,951,921,1532,801]`      | `[1357,992,868,1537,1295,1455,951,921,1532,801]`      | `[791,959,857,1135,807,904,905,873,1101,758]`         |
| Inbox       | `[313,353,314,471,304,335,378,337,549,320]`  | `[1674,1724,1681,1833,1677,1684,1740,1693,1909,1680]` | `[1675,1724,1681,1833,1677,1684,1740,1694,1909,1681]` | `[1410,1365,1393,1460,1325,1524,1520,1439,1620,1369]` |
| Together    | `[446,356,345,992,347,392,346,349,331,420]`  | `[790,701,687,2342,1200,1237,1196,1214,683,766]`      | `[790,701,687,2342,1200,1237,1197,1215,683,766]`      | `[889,903,867,1695,883,993,783,826,857,909]`          |

Secondary Money Transactions (3 measured samples): TTFB `[333,448,327]`; first useful/full `[1190,1309,1183]`; `load` `[965,918,832]`. All 3 returned HTTP 200 with no browser errors or overflow.

Per measured sample the primary route request counts, domain counts, dependency stages, and RSC counts were stable at the values in sections 3–4. All 80 primary and 3 secondary document responses were HTTP 200; console/page errors 0; horizontal overflow 0; all reached `networkidle`. Final background worker suppression: 22 Inbox RPC calls blocked before Supabase network egress, across 11 navigations. The preliminary unfiltered preflight caveat is documented in Environment.
