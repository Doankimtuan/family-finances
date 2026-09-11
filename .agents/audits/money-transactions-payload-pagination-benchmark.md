# Money Transactions Payload & Pagination Benchmark

Date: 2026-09-11  
Scope: authenticated `/en/money/transactions`, production build, hosted Supabase, representative E2E household  
Mode: diagnostic only; no financial data, schema, RLS, Auth, or production behavior changed  
Status: **PARTIAL** — the current household and synthetic grouping cases were measured; the household has only 30 raw transaction rows, so this is not a production-scale proof.

## 1. Executive Summary

The 50-row read is not materially over-fetching on the current household because only 30 raw transaction rows exist. A 30-row request returned the same 30 rows and the same 20,291-byte response. Interleaved direct samples were effectively equal: 50 rows had a 209.5 ms median and 231.4 ms p95; 30 rows had a 210.3 ms median and 258.8 ms p95.

25 rows fails immediately: it produces only 24 activities and hides the next page. 26 rows produces the same visible 25 activities on current data, but incorrectly reports `hasMore = false`; it also fails the grouped-boundary case. 30 rows passes the current household and a one-group boundary case, but fails a synthetic pair-heavy case with 26 two-row transfer groups. It is therefore not a generally safe replacement.

Field narrowing removed jar display data, correction linkage, and tag payload from the initial list probe, reducing the same 50-row response from 20,291 to 16,715 bytes (17.6%). The interleaved direct median was slightly lower, but p95 was slightly worse and no content-complete improvement was established. The route document remained about 400 KB, so this is not a material page-completion win on the measured route.

Decision: keep 50 rows and the current field set. Do not implement a row-limit or field-shape change from this benchmark.

## 2. Why 50 Rows Exist

`listTransactionEvents()` receives a visible page size of 25 and computes:

```text
rawLimit = max(25 × 2, 25 + 2) = 50
```

The multiplier exists because `createTransactionActivities()` projects raw ledger rows into user activities:

- owned-account transfers use two rows (`transfer_out` + `transfer_in`) and become one activity;
- loan payments can use principal and interest rows and become one activity;
- `transaction_date`, `created_at`, and `id` remain the stable ordering keys;
- a grouped activity uses the latest row as its pagination anchor.

The extra rows are used for:

- grouping continuity when a group crosses the raw-row edge;
- producing enough activities to fill the visible page;
- `hasMore` detection after grouping.

They are not used by date headings themselves. `groupActivities()` only groups the already-projected activities by `effectiveDate`. They are not used for deduplication, and cursor correctness is supplied by the existing three-part keyset predicate plus the grouped activity anchor.

The code does not prove that 50 is mathematically sufficient for every possible distribution: if the first 50 raw rows are exactly 25 two-row groups and more groups follow, the existing `activities.length > page.length` check can still report `hasMore = false`. That is an existing lookahead ceiling, not a reason to reduce the limit in this phase.

## 3. Field Consumption Map

### Scalar transaction fields

| Field                     | Initial-list use                                                                                | Classification         |
| ------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------- |
| `id`                      | Activity identity, row key, detail href, related IDs                                            | REQUIRED               |
| `account_id`              | Source/destination account identity                                                             | REQUIRED               |
| `type`                    | Financial semantics, grouping, coarse SQL filters                                               | REQUIRED               |
| `amount`                  | Activity amount and displayed amount                                                            | REQUIRED               |
| `currency`                | Amount formatting and accessibility text                                                        | REQUIRED               |
| `transaction_date`        | Ordering, effective date, day grouping                                                          | REQUIRED               |
| `note`                    | Activity title/subtitle                                                                         | REQUIRED               |
| `category_id`             | Preserved in the activity read model; current page does not render the ID                       | CONDITIONALLY REQUIRED |
| `jar_id`                  | Preserved by the shared transaction mapper; current activity/list presentation does not read it | CONDITIONALLY REQUIRED |
| `status`                  | Status meta and refund relationship display                                                     | REQUIRED               |
| `transfer_group_id`       | Transfer grouping and pagination anchor selection                                               | REQUIRED               |
| `loan_payment_id`         | Loan principal/interest grouping                                                                | REQUIRED               |
| `savings_event_kind`      | Savings semantics and savings filter                                                            | REQUIRED               |
| `reverses_transaction_id` | Refund/reversal semantics                                                                       | REQUIRED               |
| `corrects_transaction_id` | Not read by the list activity projection; used by detail/action flows                           | UNUSED ON INITIAL LIST |
| `is_reversal`             | Refund/reversal semantics                                                                       | REQUIRED               |
| `created_at`              | Stable ordering, representative timestamp, cursor                                               | REQUIRED               |

### Embedded relations

| Relation                                                        | Initial-list use                                                                    | Classification         |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------- |
| `accounts(name)`                                                | Account label in transfer and ordinary activity subtitles                           | REQUIRED               |
| `accounts(type)`                                                | Financial semantics distinguishes credit-card rows                                  | CONDITIONALLY REQUIRED |
| `categories(name)`                                              | Activity title/subtitle                                                             | REQUIRED               |
| `jars(name)`                                                    | Not read by the current list page or activity projection                            | UNUSED ON INITIAL LIST |
| `transaction_tag_assignments.tag_id`                            | Needed only to apply a tag filter                                                   | CONDITIONALLY REQUIRED |
| Nested tag `id`, `name`, `icon_key`, `color_key`, `archived_at` | Not rendered by the list; filter options come from separate `listTransactionTags()` | UNUSED ON INITIAL LIST |

The conservative diagnostic minimal shape retained `jar_id` and `category_id` to avoid changing the shared mapper/read-model contract. It removed `corrects_transaction_id`, `jars(name)`, and the tag object payload. Tagged requests retained an inner `tag_id` relation for filtering.

## 4. Baseline

Protocol:

- `npm run build` — PASS.
- `VINHA_PERF_TRACE=1 npm run start -- -p 3101`.
- Authenticated Chromium, 440×900, 10 navigations to `/en/money/transactions`.
- The initial response body was measured through Playwright; it contains HTML and Flight/RSC material, not an isolated RSC stream.
- Post-hydration observation window: 1.5 seconds.

| Measure                               |         All 10 | Warm runs 2–10 |
| ------------------------------------- | -------------: | -------------: |
| Response-start median                 |       290.4 ms |       290.4 ms |
| Response-start p95                    |     1,693.2 ms |       715.5 ms |
| Content-complete median               |       679.3 ms |       679.3 ms |
| Content-complete p95                  |     2,255.7 ms |     1,718.8 ms |
| Initial document bytes                | 400,149 median | 400,149 median |
| Post-hydration automatic RSC requests |    0 every run |    0 every run |

The current direct 50-row query returned 30 raw rows and 20,291 bytes. The server trace showed one transaction Supabase GET per page load; the trace does not emit an isolated server-render duration.

## 5. Row-Limit Benchmarks

Exact current fields, same authenticated household, same `ALL` / no-tag / no-cursor filters and ordering. Each shape used 20 sequential samples after one warmup; all samples returned HTTP 200.

| Row limit |   Median |      P95 | Response bytes | Returned rows | Behavior result                                                   |
| --------: | -------: | -------: | -------------: | ------------: | ----------------------------------------------------------------- |
|        25 | 206.3 ms | 227.3 ms |         17,194 |            25 | FAIL — 24 activities, no next-page signal; visible page differs   |
|        26 | 207.2 ms | 216.5 ms |         17,789 |            26 | FAIL — visible page matches current data, but `hasMore` is false  |
|        30 | 208.3 ms | 232.7 ms |         20,291 |            30 | PASS for current data; not general-safe under pair-heavy grouping |
|        50 | 232.0 ms | 530.5 ms |         20,291 |            30 | PASS control for current data                                     |

The 50-vs-30 sequential difference is not a payload win: both return the same 30 rows and 20,291 bytes. An interleaved 20-pair check measured 50 rows at 209.5 ms median / 231.4 ms p95 and 30 rows at 210.3 ms median / 258.8 ms p95. The p95 variation is hosted-request variance, not a stable row-count effect.

## 6. Field-Narrowing Benchmark

The field comparison kept 50 rows and the same ordering. The production-safe minimal probe was:

```text
id, account_id, type, amount, currency, transaction_date, note,
category_id, jar_id, status, transfer_group_id, loan_payment_id,
savings_event_kind, reverses_transaction_id, is_reversal, created_at,
accounts(name, type), categories(name)
```

The tagged variant retained `transaction_tag_assignments!inner(tag_id)` and no nested tag object.

| Shape                       |   Median |      P95 | Response bytes | Result                                              |
| --------------------------- | -------: | -------: | -------------: | --------------------------------------------------- |
| Current fields              | 222.9 ms | 304.9 ms |         20,291 | Control                                             |
| Minimal initial-list fields | 218.7 ms | 342.0 ms |         16,715 | 3,576 bytes / 17.6% smaller; latency win not stable |

An interleaved check was consistent with “no material latency change”: current fields were 209.5 ms median / 296.2 ms p95, while the narrower probe was 203.6 ms median / 233.9 ms p95 in that run. The result is useful for transport cost, but it does not establish a route content-complete improvement. No production field narrowing was accepted.

## 7. Pagination Equivalence

The existing cursor predicate was preserved in every direct probe:

```text
transaction_date < effectiveDate
OR same transaction_date and created_at < representativeCreatedAt
OR same transaction_date and created_at and id < paginationAnchorId
```

Current household result:

- 30 raw rows became 29 activities, including one two-row transfer group and no loan-payment group.
- 50 rows: first 25 activities, `hasMore = true`; second page matched the control with no duplicates or missing related transaction IDs.
- 30 rows: same first page and second page as the 50-row control; no duplicates or missing related transaction IDs.
- 26 rows: first 25 activities matched, but `hasMore = false`, so the route would hide the load-more link.
- 25 rows: only 24 activities and no load-more signal.

Live filter checks for `income`, `expense`, `transfer`, `investment`, `savings`, `debt`, and one populated tag filter produced the same first-page activity signature for all limits where the filtered result fit within the limit. This does not override the `ALL` pagination failures above.

Equal-`transaction_date` ordering remained stable because the query retains `created_at DESC` and `id DESC`; no ordering or cursor changes were made.

## 8. Grouping Equivalence

The activity projection uses `createTransactionActivities()` before page truncation. The date grouping layer then uses `groupActivities()` over those activities.

Synthetic grouped-boundary case: 24 single rows, one two-row transfer group at the edge, then two tail rows.

| Limit | First 25 activity signature         | `hasMore`                    |
| ----: | ----------------------------------- | ---------------------------- |
|    25 | FAIL — transfer group is incomplete | false                        |
|    26 | PASS for visible activity content   | false, while control is true |
|    30 | PASS                                | true                         |
|    50 | PASS                                | true                         |

Synthetic pair-heavy case: 26 two-row transfer groups, ordered with equal transaction dates and unique creation timestamps.

| Limit | Activities materialized | First-page result                 | `hasMore`                          |
| ----: | ----------------------: | --------------------------------- | ---------------------------------- |
|    25 |                      13 | FAIL                              | false                              |
|    26 |                      13 | FAIL                              | false                              |
|    30 |                      15 | FAIL                              | false                              |
|    50 |                      25 | PASS for visible activity content | false — existing lookahead ceiling |

This proves that 30 cannot be certified as a general replacement when grouped activities dominate the raw page. It also records the existing 50-row ceiling for exact pairs: the current implementation needs a future, separately designed lookahead/has-more fix if that scenario must be supported.

## 9. UI Equivalence

No production candidate was rendered through the route because no candidate was accepted. The existing list/grouping/presentation functions were run against the live current and candidate datasets.

| Candidate | Count                     | Date headings/groups      | Labels and amounts                            | Account/category/status  | Pagination control              |
| --------: | ------------------------- | ------------------------- | --------------------------------------------- | ------------------------ | ------------------------------- |
|        25 | FAIL                      | FAIL at the activity edge | FAIL because the visible activity set differs | Incomplete edge activity | FAIL                            |
|        26 | PASS for visible rows     | PASS                      | PASS                                          | PASS                     | FAIL: missing load-more control |
|        30 | PASS on current household | PASS                      | PASS                                          | PASS                     | PASS on current household       |
|        50 | PASS control              | PASS                      | PASS                                          | PASS                     | PASS control                    |

The minimal field signature matched the current field signature for the default list and the populated tag-filter list, including activity count, date-group counts, titles/subtitles, amounts, account/category labels, statuses, and relationship metadata used by the row.

## 10. SQL / Index Evidence

Fresh read-only `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)` was available through the Supabase SQL tool. The statement used the current household filter, ordering, limit, account/category/jar joins, and a lateral tag aggregation equivalent to the current embedded relation.

| Shape                        | Actual rows | Planning | Execution | Plan notes                                                                                |
| ---------------------------- | ----------: | -------: | --------: | ----------------------------------------------------------------------------------------- |
| Current projection, limit 50 |          30 | 5.468 ms |  0.600 ms | Sequential transaction scan, PK relation lookups/memoization, sort; 88 shared buffers hit |
| Narrow projection, limit 50  |          30 | 8.808 ms |  0.405 ms | Sequential transaction scan, account/category joins, sort; 21 shared buffers hit          |

The plan is a privileged SQL equivalent, not a captured PostgREST-generated plan, so it is order-of-magnitude evidence rather than an RLS-inclusive request trace. PostgreSQL execution is sub-millisecond at this cardinality; the observed 200–300 ms direct request time is the hosted request boundary and transport path.

Live transaction indexes include:

- `(household_id, transaction_date, created_at)`;
- `(household_id, created_at DESC)`;
- `(account_id, created_at DESC)`;
- partial `(household_id, savings_event_kind)`;
- partial `(household_id, transfer_group_id)`;
- reversal/correction and primary-key indexes.

The current query’s household/date/created ordering is covered in prefix form; `id` is the final tie-breaker but is not in the composite index. The current plan does not justify an index change, and no index or schema change was made.

## 11. Decision Gate

| Candidate     | Pagination                                          | Grouping                   | UI                       | Performance evidence                         | Decision                      |
| ------------- | --------------------------------------------------- | -------------------------- | ------------------------ | -------------------------------------------- | ----------------------------- |
| 25 rows       | FAIL                                                | FAIL                       | FAIL                     | Smaller body, same hosted class              | Reject                        |
| 26 rows       | FAIL (`hasMore`)                                    | Boundary fails `hasMore`   | Pagination control fails | Smaller body, no stable win                  | Reject                        |
| 30 rows       | PASS only for current/small boundary data           | Fails pair-heavy case      | Passes current data      | Same bytes as 50 currently                   | Reject as general replacement |
| 50 rows       | Current control; known exact-pair `hasMore` ceiling | Current control            | Current control          | No proven over-fetch cost at 30 current rows | Keep                          |
| Narrow fields | Live UI/group signature pass                        | No grouping fields removed | Live signature pass      | 17.6% smaller; no stable content/latency win | Do not implement yet          |

The smallest generally defensible shape from this evidence is not proven. Keep the current 50-row query until a production-scale fixture or real household shows that a different lookahead algorithm preserves grouped pagination.

## 12. Implementation

**None.** No production code, query constants, cursor logic, routes, detail loaders, mutations, schema, RLS, Auth, or financial data changed.

The temporary read-only equivalence probe was removed after the run. The only new artifact is this report.

## 13. Performance Before vs After

There is no accepted implementation, so an after profile is not applicable.

| Measure                                              |         Before | After |
| ---------------------------------------------------- | -------------: | ----: |
| Transactions content-complete median, all 10         |       679.3 ms |   N/A |
| Transactions content-complete median, warm runs 2–10 |       679.3 ms |   N/A |
| Initial document bytes                               | 400,149 median |   N/A |
| Post-hydration automatic RSC requests                |              0 |   N/A |
| Database changes                                     |           None |  None |
| Financial data mutations                             |           None |  None |

## 14. Remaining Transactions Bottlenecks

- The initial route has one authenticated server-rendered Supabase transaction read plus the separate transaction-tags read and shared layout/auth work.
- Hosted request latency, not PostgreSQL execution, dominates the direct query samples.
- The document includes roughly 400 KB of HTML/Flight/static route material; the 3.6 KB safe field reduction is a small fraction of the completed document.
- The current activity-based `hasMore` test has a known ceiling when 50 raw rows form exactly 25 grouped activities.
- The current household has only 30 raw rows, so row-limit conclusions do not represent larger households.
- Post-hydration automatic RSC prefetch is already 0 after the preceding link-policy change.

## 15. Recommended Next Step

Keep the current 50-row field shape. If this route needs further work, create a dedicated larger read-only benchmark household or staging fixture with dense transfer and loan groups, then design an activity-aware lookahead/has-more algorithm before changing the production query.

## Reproduction

```text
npm run build
VINHA_PERF_TRACE=1 npm run start -- -p 3101
```

Measurements used the existing authenticated Playwright state at `output/playwright/.auth/user.json`, direct authenticated `GET` reads only, and read-only Supabase `EXPLAIN`/catalog queries. No access tokens, credentials, household identifiers, row values, or financial amounts are included in this report.
