# Transactions Phase 4 — Progressive List Filter References

Date: 2026-10-06

## Dependency proof

The route still requires the authenticated user and active household membership before reading or showing transaction data. `listTransactionEvents` returns the first page, including the account/category/jar/tag metadata embedded on each event row and any transfer/loan group completion needed to form a correct activity. Those row fields are separate from the category and jar option lists used by the filter picker.

Category and jar filter choices come from `listTransactionFilterOptions`; transaction-tag picker choices come from `listTransactionTags`. The List can render an activity page or its correctly filtered empty state without either option result. URL filters are parsed before the reads and passed to `listTransactionEvents` directly.

## Previous architecture

After the existing session gate and URL parsing, one `Promise.all` awaited translations, `listTransactionEvents`, category/jar options, and tag options. A slow reference read therefore held back the whole page response even though the event query could independently produce the first useful activities.

## New architecture

The route now starts the category/jar and tag promises together, then awaits only translations and the event result. It passes those server-started promises to the filter bar. A local Suspense boundary contains only the reference-dependent advanced filter controls; the activity list and empty/error states are siblings outside that boundary.

The type chips and search remain available immediately. While references are pending, the advanced-filter button is disabled and retains the count of selected category, jar, and tag filters. Its option picker does not present a false empty set or an “all” label for a selected filter. When the promises resolve, the existing picker consumes their results. A `null` loader result still normalizes to empty option arrays, matching the previous behavior.

No client fetch, endpoint, write, event-query shape, continuation API, or list key changed. The existing `key={currentHref}` still scopes the activity list to the URL-authoritative filter state.

## Active-filter handling

The route regression test holds both reference promises pending while supplying account, type, search, category, jar, and tag filters. It verifies those values are passed to the row query and filter bar before either reference resolves. It also verifies that the filtered empty state can be returned immediately.

The filter bar test verifies the advanced button is disabled while dynamic options are pending, still indicates a selected dynamic filter, and does not show a false “no categories” state. Existing UI tests continue to cover type changes and combined category/jar selection. The authenticated browser opened the Vietnamese transfer-filter sheet after references were ready and retained the `type=transfer` query.

## Request topology

| Read                             |                    Invocation per List route | Blocking for rows |
| -------------------------------- | -------------------------------------------: | ----------------- |
| Transaction event activity query | 1 top-level call; it may scan multiple pages | Yes               |
| Category options                 |            1 query inside the options loader | No                |
| Jar options                      |            1 query inside the options loader | No                |
| Transaction-tag options          |                                      1 query | No                |

The route starts each loader once. The category and jar queries still run together inside their existing loader. Filter-reference resolution adds no client request and does not repeat the event query. Browser Resource Timing showed one List RSC navigation per Money → List sample.

Actual server-side event scan-page and transfer/loan group-batch counts were not observable in this run. Supabase requests run on the server; the development server has `VINHA_PERF_TRACE` disabled and no app terminal is attached to this task. Source inspection confirms the existing scan loop is unchanged (bounded by `TRANSACTION_EVENT_MAX_SCAN_PAGES`) and `completeMatchedGroups` remains unchanged, including its empty-ID short-circuit and per-page transfer/loan batches. I do not claim runtime counts for those internal queries.

## Performance

The frozen control and final source were measured in the same authenticated local development environment, Vietnamese locale, using the same Money → Transactions click path. The final warm sample is the five-sample run after the local server/session had settled. Times are elapsed from the pre-click mark. The filter-ready marker is the first enabled advanced-filter button; that button requires both option promises, so it is a combined readiness marker, not separate category/jar and tag loader timing.

| Metric                              | Control p50 / p75 | Phase 4 p50 / p75 | Delta p50 / p75 |
| ----------------------------------- | ----------------: | ----------------: | --------------: |
| A — First useful rows               |  1,816 / 1,880 ms |  1,788 / 1,807 ms |    −28 / −73 ms |
| B — Filter bar structurally visible |  1,816 / 1,880 ms |  1,788 / 1,807 ms |    −28 / −73 ms |
| C — Category/jar picker usable*     |  1,816 / 1,880 ms |  1,788 / 1,807 ms |    −28 / −73 ms |
| D — Tag picker usable*              |  1,816 / 1,880 ms |  1,788 / 1,807 ms |    −28 / −73 ms |
| E — Full List and filter UI ready   |  1,816 / 1,880 ms |  1,788 / 1,807 ms |    −28 / −73 ms |

\*The current picker exposes category, jar, and tag choices together after both promises resolve. The browser cannot distinguish when each server loader finished; the table records the shared UI-ready upper bound for each.

Control samples for useful rows/filter readiness were 1,880; 1,816; 1,803; 2,026; and 1,731 ms. Phase 4 samples were 1,788; 1,713; 1,807; 1,898; and 1,728 ms. The 28 ms p50 and 73 ms p75 differences are within this dev-browser measurement's run-to-run variation and do not establish a user-visible speedup. In the five final samples, rows, the filter bar, and the enabled filter button appeared in the same observer commit. The pending-promise route test proves the server route itself no longer awaits those references, but this run did not show a visible streaming gap because references were already ready by the first observed page commit.

The final RSC response duration was 1,170 ms p50 / 1,186 ms p75, with 58 / 74 ms TTFB. First rows appeared 75–96 ms after RSC response end (80 ms p50 / p75), so the post-response client tail remains small. A preliminary 2,666 ms row sample was taken after the server/session were already active; it is not a true cold-start measurement and is excluded from the warm summary.

No server span separated event reads, group completion, and filter reads, so these measurements cannot establish which database read set the server response time. In this run the reference split was structurally effective but not performance-relevant: the warm filter-ready marker did not lag the first rows.

## DOM and history stability

The activity list is rendered outside the new boundary and keeps its existing URL-derived key, so resolving reference promises cannot replace it with a loading shell. In this browser run, references completed before the first observed list commit, so there was no delayed-reference interval in which to measure live DOM identity or scroll movement.

For the Phase 1 regression, the authenticated browser opened an expense-filtered List, set the shell scroll position to 200 px, opened the first Detail, and used the app Back control. The restored List retained the expense query, 25 first-page rows, and the 200 px scroll position; Resource Timing recorded zero new List RSC requests. The browser-side root element object was not identical across the cross-route restore, so I do not claim DOM object identity for that navigation. The route and list data were restored without a List fetch.

## Filter regression

- A direct Vietnamese `type=transfer` List retained the query and rendered two matching activities.
- Pending-reference route coverage passes account, type, search, category, jar, and tag selections directly into `listTransactionEvents`; filters do not depend on picker labels.
- Existing UI coverage passes type filtering, selected-filter indication, and combined category/jar application.
- The row-query `null` error branch still renders the existing error state. Category/jar and tag loader `null` results still become empty picker choices without suppressing rows.
- The cursor redirect and list continuation route were not changed. Group completion and row pagination code were not changed.

## Phase 2 and Phase 3 regression

From the authenticated List, the Add link still reached the Vietnamese Add route and rendered its `money-capture` root. The Add route, capture form, and Transfer form were not modified; no transaction was submitted. This was a route/form-root spot-check, not a new Add readiness benchmark. No Transfer-specific reference change was introduced.

## Locale and responsive checks

Authenticated browser checks covered English unfiltered and Vietnamese transfer-filtered routes. The Vietnamese filter controls were localized; the advanced-filter button became enabled and the filter sheet opened after reference readiness. At 390, 440, 768, and 1280 px in both light and dark schemes, the filter and 25-row List remained present and `document.documentElement.scrollWidth` did not exceed the viewport.

## Validation

- Focused transaction UI, filter-boundary, query/schema, pagination, activity, tag, and return-navigation tests pass after the Phase 4 change.
- Full `npm run test`: 1,759 passed, 5 failed across 3 unrelated existing files: locale key parity, account identity wrapping, and three account-presentation renders missing `NextIntlClientProvider` context. No Transactions Phase 4 test failed.
- `npm run lint`: passed.
- `npm run typecheck`: still fails only at the existing `home-streaming-sections.tsx` translator type mismatches on lines 99 and 340.
- `npm run format:check`: failed repository-wide on 196 files; the targeted Prettier check for the Phase 4 source, tests, and audit artifacts passed.
- Build not run: the authenticated development server is active on port 3000 and uses the shared `.next` output.

## Remaining bottleneck

The remaining measured wait is the List RSC/server response at roughly 1.1–1.2 seconds warm, while the post-response rows paint in about 80 ms. Transaction event scanning and any required group completion remain on the route's critical path by source structure, but this run did not attribute server time to those operations. Measure that path before proposing another optimization.

**TRANSACTIONS PHASE 4 COMPLETE — FILTER SPLIT NOT PERFORMANCE-RELEVANT**
