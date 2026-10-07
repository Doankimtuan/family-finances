# Transactions Phase 5 — Avoid Redundant Transfer Group Completion

Date: 2026-10-06

## Transfer completeness rule

Transactions with a `transfer_group_id` must use a transfer type; the table check constraint permits only `transfer_out` and `transfer_in` and requires their category and jar IDs to be null. Current transfer and savings write paths create a source and destination row together, with distinct accounts, equal amount/currency/date, `posted` status, and matching savings-event kind. Transfer correction and refund commands do not accept transfer rows. The transactions table has no archived/deleted field.

The database check does not enforce one row of each type per group. The application classifier therefore uses a conservative local shape check: exactly two rows, one of each transfer type, distinct row and account IDs, both `posted`, matching amount/currency/date, and matching savings-event kind. Any partial, malformed, non-posted, or otherwise ambiguous group remains in the existing batched completion query. The normal application writers produce a pair atomically; a malformed shape visible in the scan cannot be treated as complete.

Classification runs on raw scan rows, before activity projection and type filtering. A transfer-type scan includes both transfer leg types. An account or note filter that leaves one leg triggers completion. A raw page boundary that splits a pair also triggers completion. Category/jar-filtered scans cannot return valid transfer legs because those columns are constrained to null. Completion rows and scan rows continue through the same `createTransactionActivities` projection.

## Previous topology

Phase 4.1 measured the unfiltered first page as one scan of 52 rows followed by one transfer batch for three group IDs. The batch returned six rows already present in the scan, so it added zero unique rows. The transfer-filter sample had the same shape: 12 scan rows and 12 completion rows with zero unique additions. Loan IDs were zero in both samples.

## New topology

Complete transfer groups reuse their scan rows. Only incomplete or malformed group IDs go into the existing batch query. The batch remains singular; there is no per-group request and no empty `.in(...)` call. Loan completion collection, fetch, error handling, and merge behavior remain unchanged.

| Scan result                           | Phase 4.1 control           | Phase 5 behavior                   |
| ------------------------------------- | --------------------------- | ---------------------------------- |
| Complete transfer groups              | One batch for all found IDs | No transfer batch                  |
| Mix of complete and incomplete groups | One batch for all found IDs | One batch with incomplete IDs only |
| Partial or malformed groups           | One batch                   | Existing batch fallback            |
| No transfer groups                    | No transfer batch           | No transfer batch                  |

The focused tests prove the complete-pair path makes one Supabase query (the scan), the mixed path sends only incomplete IDs in one batch, and partial/malformed paths retain completion. The loan-only test still exercises the original loan completion query.

## Correctness

- A complete transfer-filter scan returns the same grouped activity fields: group key, transfer kind, related legs, and source/destination account labels. `hasMore` and cursor presence remain correct.
- An account/note-filtered scan with one visible leg fetches the missing pair and produces the grouped activity.
- A malformed three-row group falls back to completion.
- A transfer split across the raw-page boundary is completed on page one. Its remaining leg is encountered by the cursor continuation, completed through the fallback, then excluded by the existing cursor check; the activity is not emitted twice.
- The existing filtered loan-payment test remains unchanged and passes.

No transaction activity projection, scan bound, ordering, lookahead, page size, cursor predicate, stop condition, query select, filter parser, or write path changed.

## Request reduction

The Phase 4.1 unfiltered control made one transfer-completion batch per first-page request, despite adding no rows. For any page whose transfer groups satisfy the completeness rule, Phase 5 changes that count from one to zero. Incomplete IDs still share one batch. The same structural reduction is covered for the transfer-filter route. Runtime request counts for the current authenticated data were not instrumented in this run.

## Performance

The Phase 4.1 numbers below are the frozen control from the previous benchmark, not a same-run Phase 5 comparison. No Phase 5 p50/p75 timings are claimed.

| Metric                          | Phase 4.1 control p50 / p75 |          Phase 5 p50 / p75 |        Delta |
| ------------------------------- | --------------------------: | -------------------------: | -----------: |
| Event scan SDK query            |                288 / 295 ms |               Not measured | Not measured |
| Transfer completion, unfiltered |                257 / 260 ms | Absent for complete groups | Not measured |
| Event loader total              |       548 / not reported ms |               Not measured | Not measured |
| Route total                     |            1,073 / 1,171 ms |               Not measured | Not measured |
| RSC response                    |            1,112 / 1,211 ms |               Not measured | Not measured |
| Click to first rows             |            1,195 / 1,291 ms |               Not measured | Not measured |

The authenticated transfer-filter route was opened in the existing local browser and rendered two grouped activities. The route was restored to its original unfiltered state afterward. This is a functional spot-check, not a timing sample. The configured Playwright browser reported that its profile was already in use; the authenticated browser was the user's shared Brave profile with unrelated tabs open, so those tabs were left alone. The active development server also had no event-loader spans enabled. Thus the requested cold-ish/10-warm same-run table and runtime completion span are unavailable. The structural query elimination is verified by the query-level tests.

## Filter regression

The event scan query and all filters are unchanged. The new account/note test covers the case where the row filter returns only one transfer leg; the existing transfer-filter test covers the case where both legs are present. The database constraint makes category/jar transfer matches impossible for valid rows. Phase 4's filter-reference split was not modified.

## Pagination regression

The raw-page-boundary and continuation test verifies the page limit, completion fallback, cursor query, no duplicate transfer activity, and continued ordinary activity output. The production pagination loop and constants are unchanged.

## Phase regressions

- Phase 1 Detail → Back source is untouched; Phase 4.1 recorded zero List RSC requests on Back.
- Phase 2 Add source is untouched; Phase 4 previously verified the Add entry route and capture form.
- Phase 4 filter-reference promises remain outside the row critical path; no List route or filter-loader source changed.
- Transaction Detail transfer pairing and transfer writes are untouched.

## Validation

- `tests/unit/transaction-events.test.ts`: 7 passed.
- `npm run lint`: passed.
- `npm run typecheck`: blocked by existing `home-streaming-sections.tsx` translator type errors at lines 99 and 340.
- `npm run test`: 1,763 passed, 5 failed in the same unrelated existing areas recorded in Phase 4.1: English/Vietnamese message parity, long card-name wrapping, and three account presentation renders without `NextIntlClientProvider`.
- Build was not run because the authenticated development server is active on port 3000 and uses the shared `.next` output.

## Remaining bottleneck

The Phase 4.1 control still places about 510 ms p50 in sequential `getUser` and membership checks and about 288 ms p50 at the scan SDK query boundary. Neither was changed or remeasured here.

**TRANSACTIONS PHASE 5 SUCCESS — PROCEED TO TRANSACTIONS PHASE 6**
