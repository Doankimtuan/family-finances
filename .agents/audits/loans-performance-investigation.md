# Loans Performance Investigation

Date: 2026-09-11  
Status: **PARTIAL** — the linked Supabase project contains zero rows in the loan tables, so authenticated non-empty list/detail/schedule/payment timings and large-cardinality plans could not be measured. The empty authenticated list path, source-level dependency graph, direct empty reads, and empty-dataset SQL controls were measured read-only. No data, schema, RLS, or auth changes were made.

Evidence basis:

- `npm run build` passed with Next.js 16.3.1/Turbopack and all Loans routes present.
- Production server: `VINHA_PERF_TRACE=1 npm run start -- -p 3101`.
- Chromium via Playwright at `440x900`; 11 navigations were run and the first was discarded, leaving 10 warm authenticated samples.
- The authenticated E2E identity was used. Fixture setup was intentionally skipped because this investigation forbade financial mutations. No service-role browser/runtime reads were used.
- Read-only database counts: `loans=0`, `schedule_entries=0`, `loan_payments=0`, `rate_periods=0`, `active_memberships=5`.

## 1. Executive Summary

The primary target is `/{locale}/money/loans`, implemented by `app/[locale]/(product)/money/loans/page.tsx`.

The measured empty authenticated list baseline was:

- response start / TTFB: **618.4 ms median**, **1,045.2 ms p95**;
- DOM/content-complete proxy: **956.7 ms median**, **1,371.3 ms p95**;
- full load: **957.4 ms median**, **1,374.1 ms p95**.

The warm empty path made four remote HTTP requests: Auth user, active household membership, the empty Loans query, and the product-layout inbox badge `HEAD`. Two `auth.getClaims` spans were visible in server tracing, but warm claims were local and did not add an HTTP request.

The non-empty source shape is two Loans-domain data waves after the auth/membership gate: one Loans query, followed by parallel payment and upcoming-schedule aggregates plus an optional owner-membership validation query. The list query is batched; it is not an N+1 loop.

The largest source-level risk is that `LoanProductRow` does not pass the existing global `PRODUCT_LINK_PREFETCH=false` constant to its detail `Link`. Once rows exist, default link prefetch can request the heavy detail RSC route before navigation. The runtime impact is unmeasured because there are no loan rows.

At current cardinality, PostgreSQL execution is fast: the read-only empty controls executed in approximately 0.064–0.137 ms. Direct hosted HTTP calls were approximately 283–310 ms median for Auth, membership, and Loans, so current wall time is dominated by network/service latency and variance rather than SQL execution.

## 2. Route Architecture

```text
/{locale}/money
  └─ listLoanSummaries()                         secondary Money hub read

/{locale}/money/loans                            primary target
  ├─ inline CreateLoanForm                        no /new route
  └─ LoanProductRow -> /{locale}/money/loans/[id]
       ├─ inline payment/edit/interest/close actions
       └─ /schedule                               full schedule route
```

Relevant files:

- List: `app/[locale]/(product)/money/loans/page.tsx`
- List loading state: `app/[locale]/(product)/money/loans/loading.tsx`
- Detail: `app/[locale]/(product)/money/loans/[id]/page.tsx`
- Full schedule: `app/[locale]/(product)/money/loans/[id]/schedule/page.tsx`
- Server action wrappers: `app/[locale]/(product)/money/money-products-actions.ts`
- Query/data contract: `modules/ledger/application/queries/list-money-products.ts` and `modules/ledger/application/money-product-types.ts`

There is no separate repayment route and no edit route. Payment, edit, interest-rate, and close operations are action sheets on the detail surface. There is no Loans-local `error.tsx`; the route inherits `app/[locale]/(product)/error.tsx`.

## 3. Primary Target

The primary target is the authenticated Loans list route:

```text
/{locale}/money/loans
```

Its server component obtains the session user and active membership, then starts translations, `listLoans`, and messages in parallel. The list consumes the complete `listLoans` result to render active and historical rows, summaries, ownership capabilities, due state, and next-payment information.

The list is also a shared application read. `listLoans` is reused by other consumers such as calendar and goal-funding flows, so changing its query contract globally would be a larger and riskier operation than changing only the Loans list page.

## 4. Server Component / Streaming Structure

The parent product layout first blocks on `requireProductSession`. It also renders the product navigation and has a separate Suspense boundary for the unread inbox badge.

The Loans page itself has no nested Suspense boundaries. Its page-level work is:

```text
product layout session gate
  -> Loans page session gate, request-local cache deduped
  -> Promise.all(translations, listLoans, messages)
  -> listLoans: Loans query
  -> listLoans: payment + schedule + optional ownership reads
  -> render page
```

`loading.tsx` provides a page-wide skeleton fallback; it does not stream individual loan sections. There is no initial client-side SWR, React Query, or `useEffect` fetch. Action components call `router.refresh()` only after mutations.

The inbox `HEAD` runs in the layout’s separate Suspense path and is not Loans-domain work. It can overlap with the list page, but its completion is part of the overall browser load observed here.

## 5. Remote Request Inventory

### Measured on the empty authenticated list path

| Request                          | Source                      | Purpose                     |                Result |
| -------------------------------- | --------------------------- | --------------------------- | --------------------: |
| `GET /auth/v1/user`              | `getSessionUser`            | Authenticated user identity |    1 row, 2,171 bytes |
| `GET /rest/v1/household_members` | `resolveActiveMembership`   | Active tenancy membership   |      1 row, 167 bytes |
| `GET /rest/v1/loans`             | `loadLoans`                 | Household-scoped loan list  |       0 rows, 2 bytes |
| `HEAD /rest/v1/inbox_items`      | `countUnreadOpenInboxItems` | Product-layout unread badge | 0-byte count response |

Server tracing also showed two logical `auth.getClaims` spans. In the warm run they resolved locally and did not create a remote request. A cold or stale session can add JWKS/session-refresh work; that was excluded from this warm baseline.

### Source-predicted on a non-empty list

After the Loans query returns IDs, `loadLoanAggregatesByIds` starts these reads in parallel:

1. `loan_payments`: `loan_id, principal_paid, interest_paid`, household-scoped and filtered by all loan IDs.
2. `loan_schedule_entries`: `loan_id, total_due, sequence`, household-scoped, filtered by all loan IDs, `status=upcoming`, ordered by sequence.
3. `household_members`: only when returned loans have personal `owner_membership_id` values that require active-membership validation.

The source therefore predicts three Loans-domain reads for a non-empty household-only list and four when the optional owner-membership query is needed. These non-empty requests were not live-observed because the linked project has no loan IDs.

## 6. Dependency Graph

```text
proxy auth.getClaims (warm: local)
  -> product layout requireProductSession
       ├─ getSessionUser -> auth user GET
       ├─ getVerifiedAuthSubject -> claims
       └─ resolveActiveMembership -> household_members GET
       └─ inbox footer -> inbox_items HEAD

Loans page gate
  -> request-local cached user/membership reads
  -> listLoans
       -> loans GET                                   W1
            ├─ loan_payments aggregate GET            W2
            ├─ upcoming loan_schedule_entries GET     W2
            └─ optional active owner memberships GET  W2
```

The list’s W2 reads are batched by all loan IDs; there is no per-loan request loop in the current implementation.

The detail route is heavier:

```text
detail gate
  ├─ getLoanReadResult
  │    ├─ loans row
  │    ├─ optional owner-membership validation
  │    └─ payment aggregate + schedule count + next schedule
  ├─ full payment history
  ├─ full schedule history
  ├─ full interest-rate-period history
  └─ listAccounts
       ├─ accounts + household base currency
       └─ owner membership + account ledger balances
```

## 7. Dependency Waves

| Path                            | Critical-path stages | Details                                                                                                                                           |
| ------------------------------- | -------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Measured empty list             |                    2 | Session/membership gate, then the empty Loans read; inbox badge is a parallel layout path.                                                        |
| Source-predicted non-empty list |                    3 | Gate, Loans W1, then parallel aggregate/ownership W2.                                                                                             |
| Detail                          |     Source-dependent | Parent reads start in parallel, but `getLoanReadResult` and `listAccounts` contain nested waves; full-history reads overlap with aggregate reads. |
| Full schedule                   |     Source-dependent | `getLoanReadResult` and full schedule history start together, with overlap inside the former.                                                     |

For the requested final field, this is **2 measured critical-path waves** on the empty path and **3 source-predicted stages** for a non-empty list.

## 8. Production-Like Baseline

The baseline used the production build and production server, an authenticated browser session, and a `440x900` viewport. Ten warm navigations were retained after discarding the first navigation. Percentiles use the audit’s `ceil(p*n)-1` convention.

| Metric                     |      Min |   Median |        P75 |        P95 |        Max |
| -------------------------- | -------: | -------: | ---------: | ---------: | ---------: |
| Response start / TTFB      | 499.0 ms | 618.4 ms |   626.3 ms | 1,045.2 ms | 1,045.2 ms |
| DOM/content-complete proxy | 839.3 ms | 956.7 ms | 1,210.5 ms | 1,371.3 ms | 1,371.3 ms |
| Full load                  | 842.1 ms | 957.4 ms | 1,212.9 ms | 1,374.1 ms | 1,374.1 ms |

These are **empty-list** measurements. They are not a non-empty Loans-content benchmark, not a detail benchmark, and not evidence that a populated schedule or payment history is fast.

## 9. Auth / Membership

The product layout and Loans page both request session context, but React `cache()` deduplication kept the warm navigation to one Auth user GET and one active-membership GET. The server trace confirmed one `/auth/v1/user` request and one `/rest/v1/household_members` request per warm navigation.

`getVerifiedAuthSubject` uses `auth.getClaims()`. In the warm run this was local. Cold or stale authentication may perform JWKS/session work, but that is a separate control condition and was not mixed into the list baseline.

`listActiveMembershipIds` performs no request for an empty owner-ID set. For personal loans it validates the relevant owner memberships, preserving the ownership/capability contract. No auth or tenancy optimization is justified from the current data.

## 10. Loan Financial Contract

The `Loan` application contract contains:

- identity, name, lender, and loan type;
- principal and remaining principal;
- annual, promotional, and floating-rate fields;
- start, end, first-payment, frequency, and repayment-method fields;
- term, monthly payment, total interest, and total repayment;
- next payment date and derived next payment amount;
- currency, status, note, and due day;
- progress, remaining payments, principal paid, and interest paid;
- financial scope, owner membership, and mutation capabilities.

`mapLoanRow` normalizes numeric values and derives progress, remaining-payment fallback, principal-paid fallback, next-payment amount, and ownership capabilities. Financial formulas and ownership semantics are application-level behavior and must not be changed as part of a performance-only read optimization.

The list’s stored `LOAN_SELECT` includes all fields needed by the shared `Loan` contract, including detail-oriented rate, term, repayment, note, ownership, and status fields. The list UI consumes a smaller subset, but the shared query has other callers.

## 11. Loans List

`loadLoans` performs:

1. `assertMoneyActionAllowed` for the household gate.
2. A household-scoped `loans` query ordered by `created_at DESC` using `LOAN_SELECT`.
3. A batched aggregate wave for returned IDs.
4. TypeScript folding/mapping through `mapLoanRow`.

The list does not filter by status in SQL. Active and historical rows are separated for display in application code. It uses `nextPaymentAmount` from the upcoming schedule aggregate and falls back to the stored monthly payment.

The list query has moderate field overfetch relative to the visible row, but the more important scale risk is operational: payment rows are selected for every returned loan and upcoming schedule rows are selected for every returned loan. Both are folded in TypeScript, not aggregated by PostgreSQL.

This is currently a source-level scale observation. The linked project has no rows, so populated payload sizes and list wall time are unavailable.

## 12. Schedule

On the list path, schedule data is not the full history. The aggregate query reads all `upcoming` schedule rows for all returned loan IDs, selecting `loan_id`, `total_due`, and `sequence`, then folds remaining-payment count and the smallest-sequence next amount in TypeScript.

On the detail and full-schedule routes, `listLoanScheduleReadResult` reads the full schedule history with dates, principal, interest, totals, remaining balance, status, and payment date. The full schedule route also invokes `getLoanReadResult`, which separately reads a schedule count and next schedule row.

No schedule rows or loan IDs existed for a meaningful direct benchmark or populated `EXPLAIN`. The empty controls are documented in Section 17.

## 13. Payments

On the list path, the payment aggregate query selects every payment row’s `loan_id`, `principal_paid`, and `interest_paid` for all returned loan IDs, then folds total principal and interest paid in TypeScript.

On the detail path, `listLoanPaymentsReadResult` selects full payment history: IDs, loan/account/transaction references, amount, principal paid, interest paid, and paid-at timestamp, ordered newest first.

The detail route also invokes `getLoanReadResult`, whose aggregate path reads payment principal/interest again. This is confirmed source-level overlap, not a live populated-route measurement.

No payment rows or loan IDs existed for a meaningful direct benchmark.

## 14. Accounts / Ownership

The primary list route does not read accounts. It may read active owner memberships when a returned loan has a personal owner membership ID.

The detail route calls `listAccounts`, which reads accounts and household base currency in parallel, then reads active owner memberships and account ledger balances in parallel. This is needed by the detail/payment UI, but it is unrelated to the empty list route’s current critical path.

RLS remains household/member scoped. The investigation did not weaken policies, bypass tenancy, or use service-role data in the browser/runtime.

## 15. Current vs Historical Data

The list mixes a current loan row with:

- all payment history rows needed to fold principal and interest totals;
- all upcoming schedule rows for returned loans;
- stored current loan fields.

It does not load full historical schedule entries.

The detail route loads the full payment history, full schedule history, full interest-rate-period history, current loan data, and account data on the initial server render—even though some UI panels are secondary to the overview.

This history/current mix creates the main payload and duplicate-read risks. It is not currently visible in browser timings because the project is empty.

## 16. Duplicate / Overlapping Reads

| Surface             | Overlap                                                                                                                                                            | Confidence                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| Loans list          | Loans row read followed by payment and schedule aggregate reads is the intended current-list dependency, not a duplicate.                                          | Confirmed source                             |
| Detail overview     | `getLoanReadResult` folds payment principal/interest while `listLoanPaymentsReadResult` reads full payments in the same parent `Promise.all`.                      | Confirmed source                             |
| Detail overview     | `getLoanReadResult` reads an upcoming schedule count and next row while `listLoanScheduleReadResult` reads full schedule history in the same parent `Promise.all`. | Confirmed source                             |
| Full schedule route | `getLoanReadResult` schedule/payment aggregates overlap with the full schedule history read.                                                                       | Confirmed source                             |
| Auth/membership     | Layout/page session calls are deduped by request-local `cache()` in the warm trace.                                                                                | Confirmed measured                           |
| Detail prefetch     | A row can default-prefetch the detail RSC route because it omits the existing product prefetch constant.                                                           | Confirmed source; runtime impact unavailable |

## 17. PostgreSQL Plans

The linked project is empty for all Loans tables. The following read-only `EXPLAIN (ANALYZE, BUFFERS)` controls therefore establish current empty-cardinality behavior only.

| Query shape                                                   | Planning | Execution | Buffer/index observation                        |
| ------------------------------------------------------------- | -------: | --------: | ----------------------------------------------- |
| Household loan list with an empty UUID control                | 0.582 ms |  0.137 ms | 4 shared hits; empty-table sequential scan/sort |
| Payment aggregate shape with an empty loan-ID array           | 0.684 ms |  0.064 ms | Uses `idx_loan_payments_loan`; 0 rows           |
| Upcoming schedule aggregate shape with an empty loan-ID array | 0.599 ms |  0.098 ms | 4 shared hits; empty-table scan/sort            |
| Owner-membership validation with an empty ID array            | 0.691 ms |  0.077 ms | 5 membership rows examined; 0 result rows       |

Relevant existing indexes include household/status/created ordering on loans, loan/paid ordering on payments, and loan/sequence ordering on schedule entries. The plans do not justify new indexes: no populated cardinality or selective predicate was available. A populated staging dataset is required before making scale claims.

## 18. Direct Benchmarks

Twenty sequential authenticated direct requests were run per endpoint using the public application identity. All returned HTTP 200.

| Endpoint/read                  |      Min |   Median |      P75 |        P95 |        Max | Payload/result        |
| ------------------------------ | -------: | -------: | -------: | ---------: | ---------: | --------------------- |
| Auth user                      | 262.1 ms | 282.7 ms | 301.4 ms |   628.3 ms |   660.9 ms | 2,171 bytes, 1 row    |
| Active membership              | 274.6 ms | 298.4 ms | 334.1 ms |   670.9 ms |   676.5 ms | 167 bytes, 1 row      |
| Exact Loans list shape         | 282.8 ms | 310.0 ms | 370.1 ms |   524.9 ms |   688.1 ms | 2 bytes, 0 rows       |
| Exact inbox `HEAD` badge shape | 344.8 ms | 555.9 ms | 603.3 ms | 1,051.3 ms | 1,084.4 ms | 0-byte count response |

The measurements show hosted HTTP latency and variance dwarfing empty SQL execution. They do not show populated list, schedule, payment, account, or detail performance.

## 19. Payload / Overfetch

No non-empty payload sizes were available. Source-level findings are:

- **List loan row:** moderate field overfetch because the shared `LOAN_SELECT` includes fields not visibly needed by every list row.
- **List payments:** potentially high operational overfetch because all payment principal/interest rows are returned and folded in TypeScript.
- **List schedules:** potentially high operational overfetch when a household has many upcoming entries because all upcoming rows for all returned IDs are returned.
- **Detail initial render:** high history/account overfetch for an overview because full payments, schedules, rate periods, and account balances are started together.

No fields were removed. A list-specific read model would be safer than narrowing the shared `listLoans` contract, but that is not justified by a populated benchmark yet.

## 20. Client / Post-Hydration Requests

Source inspection found no initial client-side data fetch in the Loans list, detail, or schedule flow. There is no SWR/React Query/useEffect refresh loop. Mutation action components refresh the route after a successful write.

Browser inspection of the empty list found no post-hydration Supabase data request. There were no loan row links, so detail-link prefetch could not be tested.

The global navigation constant is `PRODUCT_LINK_PREFETCH=false`, but `LoanProductRow` does not pass it to its detail `Link`. Other product links do. This is a source-confirmed prefetch gap whose populated runtime amplification is currently inconclusive.

## 21. Detail Route Observations

The detail page is page-wide blocking and starts these reads in one parent `Promise.all`:

- translations;
- `getLoanReadResult`;
- full payment history;
- full schedule history;
- full interest-rate-period history;
- all liquid accounts.

The parallel start reduces serialized wall time, but it does not remove duplicated bytes or database work. The detail route also loads data for history/action panels on the initial render rather than making those sections separately demand-driven.

The schedule route repeats the overlap by loading `getLoanReadResult` plus full schedule history. These are clear secondary targets after a populated detail benchmark exists.

## 22. Root-Cause Classification

| Classification        | Finding                                                                                                    | Evidence                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| P1 source risk        | Loans rows omit the explicit false prefetch setting, so visible rows can prefetch a heavy detail route.    | `LoanProductRow` source plus global `PRODUCT_LINK_PREFETCH`; no rows to measure |
| P1 source behavior    | Non-empty list has a gate, Loans W1, then a dependent aggregate W2; page render waits for both.            | `list-money-products.ts` source graph                                           |
| P2 source risk        | Detail reads payment and schedule aggregates as well as full histories.                                    | Confirmed duplicate source reads                                                |
| P2 source risk        | List aggregates full payment history and all upcoming schedule rows rather than DB-side current summaries. | Query shapes and TypeScript folding                                             |
| Not a current problem | Empty-cardinality PostgreSQL execution.                                                                    | 0.064–0.137 ms read-only controls                                               |
| Not a current problem | Auth/membership duplicate HTTP reads in the warm render.                                                   | One Auth and one membership GET per trace                                       |
| Not a current problem | Client polling or hydration fetch loop.                                                                    | Source and browser inspection                                                   |
| Inconclusive          | Populated list/detail wall time, prefetch amplification, large-household SQL plans, and payload sizes.     | No loan IDs/rows exist                                                          |

## 23. Ranked Optimization Candidates

1. **Pass the existing `PRODUCT_LINK_PREFETCH` constant to `LoanProductRow`.** Minimal source change, low financial/RLS risk, high confidence as a prefetch-control fix. Runtime savings are unmeasured until rows exist.
2. **Create a list-specific Loans read model.** Keep the shared `listLoans` contract unchanged; select only list fields and current next-payment data, while preserving TypeScript financial and ownership semantics. Potentially removes a hosted RTT on a non-empty path, but requires populated baseline, contract review, and RLS verification.
3. **Deduplicate or defer detail history reads.** Avoid payment/schedule aggregate overlap for the overview or defer history panels. Source benefit is clear; UI loading and financial-display contracts need verification.
4. **Reduce list aggregate payloads.** Replace full payment/schedule row transfer with a safe current-summary shape only after proving the required derived fields and ownership semantics.
5. **Add section streaming or demand-driven detail panels.** Potential UX benefit, but there is no measured populated detail trace yet.
6. **Add indexes.** Do not do this now; current tables are empty and existing relevant indexes are present.
7. **Change auth, tenancy, or regional behavior.** Not indicated by this investigation and carries unnecessary security/consistency risk.

## 24. Recommended First Implementation

**First target:** `app/[locale]/(product)/money/loans/loan-product-row.tsx` — pass the existing `PRODUCT_LINK_PREFETCH` constant to the row detail `Link`.

Current source shape:

```text
loan row -> default Link prefetch behavior
         -> possible detail RSC prefetch
         -> detail getLoan + aggregates + full histories + rates + accounts
```

Target source shape:

```text
loan row -> Link prefetch={PRODUCT_LINK_PREFETCH} // false
         -> no unrequested detail prefetch
         -> explicit navigation retains current behavior and contracts
```

Why this is first: the constant already exists, the omission is isolated, the change is effectively one prop plus its existing import, and it avoids speculative query redesign. It does not change the list’s data contract, financial calculations, RLS, or mutation behavior.

Expected risk: **LOW**. The browser impact must be re-measured with a disposable/staging dataset containing at least one loan before claiming an end-to-end improvement. The one-wave list read model is the first domain-read candidate only after that baseline exists.

No implementation was made in this diagnostic task.

## 25. Raw Evidence

### Source evidence

- `app/[locale]/(product)/money/loans/page.tsx`: session gate, parallel translations/list/messages, list rendering.
- `app/[locale]/(product)/money/loans/loading.tsx`: page-level skeleton only.
- `modules/ledger/application/queries/list-money-products.ts`: `LOAN_SELECT`, `loadLoans`, `loadLoanAggregatesByIds`, `getLoanReadResult`, full payment/schedule/rate reads, and TypeScript folding.
- `modules/tenancy/application/get-session-membership.ts`: user/subject/membership resolution and request-local reuse.
- `modules/tenancy/application/resolve-active-membership.ts`: active membership read.
- `modules/tenancy/application/list-active-membership-ids.ts`: conditional owner-membership validation.
- `modules/platform/supabase/server.ts`: React-cached server client and performance-traced fetch wrapper.
- `app/[locale]/(product)/layout.tsx`: product session gate and inbox badge Suspense path.
- `app/[locale]/(product)/money/loans/[id]/page.tsx`: parallel detail reads and account dependency.
- `app/[locale]/(product)/money/loans/[id]/schedule/page.tsx`: full schedule route overlap.
- `app/[locale]/(product)/money/loans/loan-product-row.tsx`: detail `Link` without explicit `PRODUCT_LINK_PREFETCH`.
- `shared/constants/navigation.ts`: `PRODUCT_LINK_PREFETCH=false`.
- `supabase/migrations/20260825125516_v1_baseline.sql`: Loans tables, indexes, and RLS policies.

### Server trace evidence

Warm navigations consistently showed:

```text
auth.getUser             -> GET /auth/v1/user
resolveActiveMembership -> GET /rest/v1/household_members
loadLoans               -> GET /rest/v1/loans
product inbox badge     -> HEAD /rest/v1/inbox_items
auth.getClaims          -> logical warm-local spans, no HTTP
```

The Loans request completed after the session gate and before the empty page completed. Non-empty aggregate requests did not occur because the query returned zero rows.

### Read-only database evidence

Project-wide counts:

```text
loans              0
schedule_entries   0
loan_payments      0
rate_periods       0
active_memberships 5
```

Empty-dataset `EXPLAIN (ANALYZE, BUFFERS)` controls:

```text
loans list:      Planning 0.582 ms, Execution 0.137 ms
payments shape:  Planning 0.684 ms, Execution 0.064 ms
schedule shape:  Planning 0.599 ms, Execution 0.098 ms
owner members:   Planning 0.691 ms, Execution 0.077 ms
```

These are controls, not populated scale evidence.

### Benchmark limitations

- The current linked project has no authenticated loan ID, so detail, schedule-history, payment-history, account, and ownership measurements could not be collected honestly.
- Fixture setup was not run because it would mutate financial data and the investigation was diagnostic-only.
- No service-role data was exposed to the browser/runtime.
- No optimization, refactor, migration, RLS change, auth change, or production-code edit was made.
- The working tree contained unrelated pre-existing changes; this audit added only this report.

Final status fields:

```text
STATUS: PARTIAL
PRIMARY LOANS ROUTE: /{locale}/money/loans
LOANS CONTENT MEDIAN: 957.4 ms (empty authenticated list, 440x900, 10 warm samples)
RESPONSE START / TTFB: 618.4 ms median
TOTAL REMOTE FETCHES: 4 per warm empty load
DEPENDENCY WAVES: 2 measured critical-path waves; 3 source-predicted non-empty stages
AUTH/MEMBERSHIP: 1 Auth user GET + 1 active membership GET; request-local deduped
LOANS LIST: 1 empty live GET; non-empty source shape is 1 Loans read + 2 batched aggregate reads, plus optional owner membership
SCHEDULE: no live loan IDs; list uses upcoming aggregate rows, detail uses full history
PAYMENTS: no live loan IDs; list folds payment rows, detail reads full history and overlaps the aggregate
OWNERSHIP: optional active-owner membership validation; RLS/tenancy preserved
POSTGRESQL: fast at current empty cardinality; populated-scale behavior inconclusive
```
