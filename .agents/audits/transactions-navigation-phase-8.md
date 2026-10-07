# Transactions Navigation Phase 8 — Transfer Detail Pair-Wave Investigation

**Scope:** Investigation of transfer detail reads only. No application source, schema, migration, RPC, index, RLS policy, or application data was changed. No Phase 9 work was started.

## Current Transfer dependency

The live Phase 7 route is `app/[locale]/(product)/money/transactions/[id]/page.tsx`; its read APIs are in `modules/ledger/application/queries/get-transaction.ts`.

The request path is:

```text
product layout session gate
↓
page session gate
↓
authorized selected transaction read (cached per request)
↓
inspect transfer_group_id and transaction type
↓
paired transfer-group read
↓
isCompleteTransferGroup()
↓
createTransactionActivities()
↓
complete Transfer hero
```

The layout and page both call `requireProductSession()`. After the page gate, the base read and activity read are started together, but the activity path awaits the request-cached base transaction before it can issue the pair query. That dependency keeps the second read serial.

The selected-row query is:

```ts
.from("transactions")
.select(TX_SELECT)
.eq("household_id", gate.householdId)
.eq("id", transactionId)
.maybeSingle()
```

The transfer-pair query is issued only after the selected row is authorized and provides a transfer group:

```ts
.from("transactions")
.select(TX_SELECT)
.eq("household_id", gate.householdId)
.eq("transfer_group_id", row.transferGroupId)
.in("type", [TRANSFER_OUT, TRANSFER_IN])
```

`TX_SELECT` requests these fields and embeds:

```text
id, account_id, type, amount, currency, transaction_date, note,
category_id, jar_id, status, transfer_group_id, loan_payment_id,
savings_event_kind, reverses_transaction_id, corrects_transaction_id,
is_reversal, created_at,
accounts(name, type, financial_scope), categories(name, icon_key),
jars(name), transaction_tag_assignments(tag_id,
  transaction_tags(id, name, icon_key, color_key, archived_at))
```

Transfer activity skips audit-chain and tag-inventory reads. The transfer detail hero is the completion milestone; there are no secondary sections on this route that account for a meaningful portion of its tail.

## Why the pair read exists

The selected row has only its own account and transfer leg. The second row supplies the other side and lets the app validate that the transfer is complete and consistent. `createTransactionActivities()` uses the source leg's note first, falling back to the destination leg's note; if the selected row is the destination leg, the canonical source note is only available after the pair read. There is no note-equality check.

| Needed Transfer hero field | Base row has it?                             | Pair row required?                                                |
| -------------------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| Amount                     | Yes, for the selected leg                    | Yes, to verify the other leg matches                              |
| Currency                   | Yes, for the selected leg                    | Yes, to verify the other leg matches                              |
| Date                       | Yes, for the selected leg                    | Yes, to verify the other leg matches                              |
| Source account             | Only when the selected leg is `transfer_out` | Yes, if selected leg is `transfer_in`                             |
| Destination account        | Only when the selected leg is `transfer_in`  | Yes, if selected leg is `transfer_out`                            |
| Note                       | Selected leg's note                          | Yes when source-note-first projection needs the other row         |
| Status                     | Selected leg's status                        | Yes, to validate both legs are posted                             |
| Transfer direction         | Selected leg's type                          | Yes, to identify the opposite leg and validate global orientation |

## Security model

- The server session gate checks product access and obtains the active household context. The query then requires both that household and the exact selected transaction ID.
- `transactions_select_member` permits reads only when `active_membership_id(household_id)` is non-null. The membership helper checks the authenticated user and active membership state.
- `accounts_select_member` applies the same active-household membership check to embedded accounts. Consequently, personal account rows are readable by active household members under the current SELECT policy. `can_mutate_financial_resource` ownership checks govern writes, not this SELECT path.
- The pair query repeats the household filter and derives its group from the authorized selected row. The caller does not choose a group ID.
- The live schema has an `account_id → accounts.id` foreign key and household foreign key, but no composite constraint that proves the account and transaction belong to the same household. It has no FK or uniqueness constraint for `transfer_group_id`. Embedded accounts remain subject to account RLS.
- Existing write-side RPCs do not supply a read model for this path. No RLS or ownership behavior was changed.

A future one-read function can preserve this boundary if it is `SECURITY INVOKER`, takes the exact selected transaction ID and the household ID from the server-side session gate (not an arbitrary group ID), first selects that row under transaction RLS and the same household filter, derives the group from that row, and reads pair rows under the same authenticated RLS context. The existing application validator and selected-row-in-pair check should remain in place. No new `SECURITY DEFINER` function or policy change is needed for this design.

## Existing relation/RPC options

Catalog inspection found:

- No transaction self-FK or other FK relation for transfer peers. Shared `transfer_group_id` alone does not create a PostgREST relationship.
- No transfer-group constraint that makes a peer relationship available.
- No existing view or read-only RPC/function that returns a transaction pair, transfer activity, transaction group, or ledger event for this detail path.
- Existing account/category/jar/tag embeds are FK-backed and can remain available if a table-valued function returns transaction rows.

PostgREST embeds use declared or computed relationships; a shared group value is not sufficient. A table-valued RPC can return transaction rows and retain their FK embeds, so a fake FK is unnecessary. Sources: [PostgREST Resource Embedding](https://docs.postgrest.org/en/v13/references/api/resource_embedding.html), [Supabase Joins and Nested tables](https://supabase.com/docs/guides/database/joins-and-nesting), [Supabase RPC](https://supabase.com/docs/reference/javascript/rpc).

## Prototype candidates

**Existing PostgREST embed:** Not feasible with the current schema. There is no peer FK/computed relationship to embed. No production schema was altered to add one.

**Existing read RPC/view:** None was found that can safely replace these reads.

**New read model feasibility:** A narrow SQL table-valued function is technically feasible: accept the selected transaction ID and the household ID supplied by the server-side session gate; select that exact row first under `SECURITY INVOKER`, RLS, and the same household filter; derive the transfer group from the selected row; return it and visible transfer legs from that same household/group. For non-transfer rows it can return only the selected row. Keep the current `isCompleteTransferGroup()` and selected-in-pair validation over the returned rows. With a `SETOF public.transactions` result, existing FK embeds can be selected through PostgREST. Do not accept `transfer_group_id` from the caller.

This is a design feasibility assessment, not a deployed or authenticated candidate prototype. The available SQL catalog tool had no representative authenticated application session, and no isolated authenticated database was available for a candidate call, RLS exercise, or `EXPLAIN (ANALYZE, BUFFERS)`. Thus candidate behavior and timing have not been demonstrated end to end.

## Current baseline

Ten warm browser navigations were measured against the current Phase 7 source in an isolated disposable source copy. Instrumentation recorded click time, fetch headers/body completion, server spans, and visible completion of the two-sided Transfer hero. The app used read-only requests; no app data was changed. Percentiles use the midpoint average for p50 and nearest-rank p75 (8th sorted sample). Millisecond server spans are rounded; reported `0 ms` mapping/projection spans were each below 1 ms at this precision.

| Current measure                               |                p50 |                p75 |
| --------------------------------------------- | -----------------: | -----------------: |
| Browser click → complete hero readable        |           1,024 ms |           1,604 ms |
| Detail RSC response complete                  |           1,008 ms |           1,588 ms |
| Detail RSC response headers                   |              33 ms |              34 ms |
| Detail RSC body tail after headers            |             974 ms |           1,555 ms |
| Transfer bytes / decoded RSC body             | 7,635 B / 24,002 B | 7,636 B / 24,010 B |
| Session gate                                  |             326 ms |             634 ms |
| Base request start → headers                  |             291 ms |             321 ms |
| Base body completion                          |               2 ms |               3 ms |
| Base SDK decode / full read                   |    294 ms / 299 ms |    326 ms / 332 ms |
| Pair request start → headers                  |             326 ms |             634 ms |
| Pair body completion                          |               2 ms |               3 ms |
| Pair full read (response read and SDK decode) |             330 ms |             638 ms |
| Activity + hero ready server span             |             626 ms |           1,000 ms |
| Route return server span                      |             983 ms |           1,564 ms |

The pair response was two rows and 1,317 decoded JSON bytes; the base response was one row and 651 decoded JSON bytes. The current responses therefore contain three row appearances and 1,968 decoded JSON bytes combined; the selected row appears in both responses. Body completion and mapping are small. The elapsed read time is overwhelmingly before headers, so the pair remains a meaningful remote wait. Removing it is the measured upper-bound opportunity; an actual one-wave gain is not measured.

Each detail navigation made exactly two `/rest/v1/transactions` requests. The current pair read's full duration was 330 ms p50 and 638 ms p75. The baseline does not isolate database execution from hosted service latency; no SQL plan or buffer evidence is available.

## Candidate benchmark

No authenticated one-wave candidate was available to benchmark safely. No candidate request count, latency, payload, mapping, activity-ready time, or hero-ready time is reported as measured.

| Metric                            |                Current p50 / p75 | Candidate p50 / p75 |
| --------------------------------- | -------------------------------: | ------------------: |
| Remote transaction requests       |                            2 / 2 |        Not measured |
| Headers latency                   | Base 291/321 ms; pair 326/634 ms |        Not measured |
| Full read latency                 | Base 299/332 ms; pair 330/638 ms |        Not measured |
| Decoded JSON bytes                | 1,968 B across 3 row appearances |        Not measured |
| Mapping / validation / projection |                       <1 ms each |        Not measured |
| Activity + hero ready             |                   626 / 1,000 ms |        Not measured |
| Browser hero readable             |                 1,024 / 1,604 ms |        Not measured |

A single response could return the pair in two rows rather than the current three row appearances, but its actual PostgREST representation and byte count were not tested. Do not treat the 330/638 ms pair read as a promised end-to-end saving: the session gate, response tail, and function/query execution would remain.

## Correctness

Existing production validation remains `isCompleteTransferGroup()` plus the selected-transaction-in-pair check. The current group read filters to the selected row's household, group, and the two transfer types. The validator enforces exactly one outgoing and one incoming leg, posted status, matching amount/currency/date/savings-event kind, distinct transaction rows, and distinct accounts.

A temporary synthetic test in the disposable copy exercised 11 malformed cases: missing leg, three rows, duplicate type, amount mismatch, currency mismatch, date mismatch, savings-kind mismatch, non-posted leg, same account, same row, and selected row absent. All 11 were rejected. No malformed live rows were created. This checks the existing validator contract; it does not prove an unauthenticated candidate RPC preserves it.

Focused repository validation passed: 8 test files and 56 tests, including transfer detail pair, transaction activity/events, ownership/RLS, policy contracts, session membership/gates, and Phase 1 return navigation. The temporary malformed-pair check also passed all 11 cases. `npm run lint` passed. `npm run typecheck` remains blocked by two translator type errors in untouched `app/[locale]/(product)/home/home-streaming-sections.tsx` (lines 99 and 340), matching the existing baseline. Build was not run because the baseline typecheck fails and the main app's `.next` is in use by its dev server.

The real-browser Back check returned from Transfer Detail to the transfer-filtered List with zero new List RSC requests. Transfer still skipped audit/tag dependencies. The browser used an isolated Playwright session, not the user's browser profile.

## Cost/benefit

The current pair wave remains material: 330 ms p50 / 638 ms p75, with tiny response-body and projection costs. The potential benefit is large enough to investigate further. A narrowly scoped invoker function appears technically simpler and safer than inventing a relationship or changing RLS, but it adds database API surface and needs authenticated RLS/correctness verification. The candidate's actual latency gain has not been measured, so Phase 8's requirement for evidence of a clearly justified new read model is not met.

## Recommendation

Do not change ordinary Expense/Income Detail, the session gate, transfer writes, RLS, or schema relationships based on this investigation. A future candidate should remain selected-ID-anchored, derive the group inside the database, run as `SECURITY INVOKER`, and preserve the existing complete-pair validation. First obtain an isolated authenticated database context and benchmark that exact candidate against the current path; without it, neither the safe runtime contract nor the realized gain is proven.

**TRANSACTIONS PHASE 8 INCONCLUSIVE — DO NOT START PHASE 9**
