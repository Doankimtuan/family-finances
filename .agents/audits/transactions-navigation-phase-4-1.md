# Transactions Phase 4.1 — List Critical-Path Attribution

Date: 2026-10-06  
Scope: authenticated Money → Transactions List → first useful rows. Investigation only; no production source, query shape, pagination, RLS, index, or database changes.

## Executive finding

On 10 warm Vietnamese Money → List clicks, the server route took **1,073 ms p50 / 1,171 ms p75**. The browser showed one List RSC request and 25 first-page rows at **1,195 ms p50 / 1,291 ms p75**. The RSC response itself was **1,112 ms p50 / 1,211 ms p75**; rows painted **79 ms p50 / 86 ms p75** after it. That matches Phase 4’s small browser tail.

The warm critical path splits about evenly between:

- **User and active-membership checks:** 510 ms p50 combined, sequential.
- **Event loading:** 548 ms p50. One scan request took 288 ms p50 at the SDK query boundary, then a transfer completion batch took 257 ms p50.

The completion batch is a distinct second HTTP wave. In every unfiltered warm sample it returned six transfer rows already present in the 52-row scan; merging left the row count at 52. Projection, dedupe, mapping, sorting, and cursor work measured at 0–1 ms per span. No warm unfiltered request needed a second scan page.

**Finding:** mixed remote latency across session, event scan, and group completion. The most concrete avoidable data wave is transfer completion; its measured batch is about 257 ms and adds no rows for the observed first page. SQL execution time remains unknown.

## Environment

The benchmark used a disposable source copy, its own Next dev server on loopback port 3101, the same Supabase backend, the existing authenticated browser session and household, Vietnamese locale, and a 440 × 900 viewport. The main server and checkout remained available. One first-request cold-ish sample followed by ten warm Money → List clicks was captured. The cold-ish sample includes dev-start and auth-key-cache effects; it is not presented as a production cold-start measurement.

The instrumentation wrote only event names, request classes, timings, statuses, and counts. It did not retain IDs, amounts, notes, cookies, or response bodies. The full sanitized per-sample record is in [transactions-navigation-phase-4-1-evidence.json](transactions-navigation-phase-4-1-evidence.json).

## Session contribution

| Span                            | Warm p50 | Warm p75 | Path context                                                                                       |
| ------------------------------- | -------: | -------: | -------------------------------------------------------------------------------------------------- |
| `getUser` in List route         |   265 ms |   314 ms | After the click                                                                                    |
| Active membership in List route |   250 ms |   266 ms | Sequential after `getUser`                                                                         |
| Both List checks                |   510 ms |   564 ms | About half of the 1,073 ms route p50                                                               |
| `requireProductSession`         |   299 ms |   321 ms | Full Money hub load, before the click; its product layout is retained during the in-app transition |
| Proxy `getClaims`               |     2 ms |     3 ms | Warm List requests; no JWKS fetch in the 10 warm samples                                           |

The first cold-ish request included a 590 ms proxy `getClaims` span with a JWKS fetch. This did not recur in the warm unfiltered set. `getClaims` invocation alone does not imply a remote call.

## Event scan topology

The unfiltered loader used **one scan page per sample**:

```text
getUser → active membership
                ↓
event scan page 1: 52 raw rows
                ↓
transfer completion: 3 group IDs, 6 rows returned
                ↓
49 projected activities → 25 returned + lookahead
                ↓
route return
```

The scan’s raw limit is 52 for a 25-activity page under the current lookahead constants. In the unfiltered sample, paired transfer legs collapsed 52 raw rows to 49 candidate activities. The 49 candidates exceeded the 25-row page size, so the scanner stopped with `lookahead_reached`; it did not request page 2.

The source continues scanning only when a full raw page has not yet produced enough activities after group projection, filter matching, cursor checks, and deduplication. It stops on an empty page, a short raw page, a missing last row, or once activities exceed the page size. If it continues, it advances the raw-row cursor from the last scanned row. The scan remains bounded by `TRANSACTION_EVENT_MAX_SCAN_PAGES`.

| Route             | Raw rows |     Activities after grouping/filter | Scan pages | Stop reason        |
| ----------------- | -------: | -----------------------------------: | ---------: | ------------------ |
| Unfiltered        |       52 |                                   49 |          1 | Lookahead reached  |
| `type=transfer`   |       12 | 2 returned from 6 grouped candidates |          1 | Raw page exhausted |
| `type=expense`    |       52 |                                   52 |          1 | Lookahead reached  |
| Account statement |        5 |                                    5 |          1 | Raw page exhausted |

Transfer grouping collapses raw legs into one activity. Type matching can discard projected activities. These effects can require another page only when a full raw page still has at most 25 eligible, non-duplicate activities; that did not happen in these samples.

## Group completion

The unfiltered page found **3 transfer IDs and 0 loan-payment IDs**. The transfer batch returned six rows, while the source scan already contained all six: 52 source rows plus six completion rows still merged to 52 unique rows. The batch added **0 new rows** and took **257 ms p50 / 260 ms p75**. It followed the scan query, so it formed a serial remote wave.

The transfer-filter sample found six transfer IDs and returned 12 rows from the batch for 12 source rows; again, no unique rows were added. Its single transfer batch took 374 ms. The Expense and account samples had zero transfer IDs and zero loan-payment IDs; traces show no completion request. The source starts transfer and loan batches together with `Promise.all` if both sets are non-empty. No measured page contained both kinds, so simultaneous runtime timing was unavailable.

## HTTP attribution

Warm unfiltered event scan request spans, milliseconds:

| Stage                      | p50 | p75 | Meaning                                                     |
| -------------------------- | --: | --: | ----------------------------------------------------------- |
| PostgREST response headers | 272 | 282 | Fetch start to headers; HTTP/service duration, not SQL time |
| Body tail after headers    | 6.5 |   9 | Difference between fetch body completion and headers        |
| SDK query await complete   | 288 | 295 | Supabase query promise through body consumption/decoding    |
| Transfer completion batch  | 257 | 260 | Separate request after the scan                             |

The main scan returned 52 rows and a 36,766-byte decoded HTTP payload in every warm unfiltered sample. The select embeds account name/type/scope, category name/icon, jar name, and transaction-tag assignment/display fields. The separate transfer batch returned six rows in 4,093 bytes. These payloads were not large enough to explain the roughly 1.1 s route response; the observed time is in remote request waits, not local projection or a material body tail.

Filter option reads ran alongside event loading and were not awaited by the row route: category/jar options took 277 ms p50 / 286 ms p75; tags took 267 ms p50 / 287 ms p75. They completed before the route returned in the warm samples. This confirms the Phase 4 split at runtime.

### Filter impact

- **Transfer:** one page, 12 raw rows, six group IDs, one transfer batch, two returned activities. It reduces raw rows, but the pair-completion request remains a second wave.
- **Expense:** one page of 52 rows, no groups, and no completion requests. Its one sample’s event request took 1,212 ms to headers with a 39,393-byte body. That single high sample is service/HTTP variability, not evidence of recurring scan amplification.
- **Account statement:** one page of five rows and no completion requests. The account constraint reduced this sample’s scan work substantially.

No row-level account/category/jar/tag request was observed. These values came from embedded relationships. Group completion used one batch per non-empty group type, not an N+1 lookup.

## SQL evidence

**SQL attribution unavailable.** The benchmark used the authenticated application session for PostgREST reads, but no realistic authenticated/RLS PostgreSQL session was available for `EXPLAIN (ANALYZE, BUFFERS)`. No service-role or superuser query was used as a substitute. The HTTP spans include Supabase/PostgREST and network/service latency; they do not establish PostgreSQL execution time, planning time, buffer use, or index usage. No index recommendation follows from these timings.

## Server CPU

Row mapping measured 0 ms at millisecond resolution in the warm set. Activity projection/deduplication measured 0–1 ms; group merge, sorting, and cursor encoding measured 0 ms at that resolution. The cold-ish sample’s projection reached 9 ms. This is far below the hundreds of milliseconds spent waiting on remote requests; there is no measured CPU case for optimizing the mapper.

## Browser tail

The 10 warm clicks had one RSC request each, starting 3–6 ms after the actual click event. RSC TTFB was 40 ms p50 / 44 ms p75; the response transferred about 14.3 KB. The first 25 rows appeared 79 ms p50 / 86 ms p75 after response completion. The cold-ish click took 3,189 ms to rows and its RSC took 3,059 ms; cold compilation and initial auth/JWKS work are excluded from warm statistics.

## Correctness and regression checks

The instrumented copy was compared with the main checkout for unfiltered, transfer, Expense, and account-filtered routes. Row counts, ordered activity keys, visible row types/content, date grouping/summaries, and the has-more/all-loaded markers matched on all four routes. The profiler also recorded `hasMore` and cursor presence without recording cursor contents.

List → Detail → Back returned to the 25-row List with **0 List RSC requests on return**. The Add route still rendered its capture entry and initial fields; no submit occurred. No Add, Detail, filter, pagination, or transaction-write source was modified.

## Candidate ranking

1. **Optimize group completion.** First measure a correctness-preserving way to skip or narrow a completion batch when all required transfer legs are already in the scan. Evidence: every unfiltered warm page fetched six rows already in the 52-row scan, paying 257 ms p50; the transfer-filter sample showed the same duplication. Preserve completion for incomplete groups.
2. **Reduce repeated route session work.** The List page’s sequential `getUser` and membership checks consume 510 ms p50. Any future change must preserve the authenticated membership gate; this phase did not change it.
3. **Investigate event-query service latency.** Warm unfiltered header latency was 272 ms p50, while one Expense sample reached 1,212 ms. Repeated evidence or authenticated SQL attribution is needed before considering query/index changes.

## Recommended Transactions Phase 5

**One direction: optimize group completion.** It is the clearest measured, avoidable second wave and directly explains roughly 257 ms of the warm List wait. Do not add an RPC or recommend GraphQL from this evidence; first validate whether already-complete pairs can reuse the scan rows while incomplete groups still receive batch completion. No Phase 5 implementation was started.

**TRANSACTIONS PHASE 4.1 COMPLETE — OPTIMIZE GROUP COMPLETION**
