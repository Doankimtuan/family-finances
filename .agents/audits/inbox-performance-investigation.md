# Inbox Performance Investigation

**Status:** PARTIAL — application/request-path and browser evidence are complete; live PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)` could not be run in this environment.

**Audit date:** 2026-09-11

**Runtime:** Next.js 16.3.1, React 19.2.3, Supabase JS 2.109.0, built app served with `next start` on port 3100, `VINHA_PERF_TRACE=1`.

**Scope:** Authenticated open Inbox queue, archived queue, one detail route, existing background maintenance work, and browser post-hydration traffic. No production code, schema, financial data, or Inbox decision mutation was issued by this audit; the page's existing after-response maintenance RPCs ran normally.

## 1. Executive Summary

The primary route is already structurally sound in its server data path:

- Auth and membership are request-memoized through `getSessionMembership()`.
- Transaction, savings, loan, and liability source reads are created together and awaited with `Promise.all()`.
- Owner-membership validation is intentionally a second wave because it depends on source ownership IDs.
- The main queue is bounded to 25 items with one lookahead row.
- The navigation unread count is a separate exact `HEAD` query and is streamed behind a Suspense boundary, so it does not block the main queue content.

The main measured costs are hosted request latency and avoidable browser prefetch amplification, not an obvious database scan:

- Warm authenticated queue response-start median: **366.8 ms**.
- Queue content was visible immediately after the DOMContentLoaded checkpoint; that conservative measure had a median of **1,587.9 ms** across 10 warm browser loads.
- Current fixture: 6 open items, 4 transaction sources, 2 savings sources, 0 loan sources, 0 liability sources, and 2 owner memberships to validate.
- Main open-queue server path: **7 Supabase/Auth HTTP requests**, normally in **4 dependency waves**; the existing after-response maintenance adds **2 RPC requests**.
- Unread `HEAD` median: **524.4 ms**, compared with base queue **291.5 ms** median.
- Direct source reads are parallel; the transaction/savings source wave is followed by a serial owner-membership validation wave.
- Open queue row links omit `prefetch={false}`. The browser therefore prefetches detail RSC routes for visible items; the Inbox tab component also prefetches the archived tab. This is the clearest low-risk optimization target.

The first recommended implementation is **not** a read-model or RPC. It is disabling detail-route prefetch in `app/[locale]/(product)/inbox/inbox-queue-row.tsx`. That changes no Inbox semantics and removes unnecessary server work after the queue is usable.

## 2. Route Architecture

### Route graph

```text
/[locale]
└── (product)/layout.tsx
    ├── requireProductSession()
    ├── ChromeShell
    │   ├── children
    │   │   └── (product)/inbox/page.tsx
    │   │       ├── open queue: listOpenInboxPage()
    │   │       ├── archived tab: listArchivedInboxItems()
    │   │       └── after(): staleness + loan/debt Inbox maintenance RPCs
    │   └── Suspense(ProductNavigation)
    │       └── countUnreadOpenInboxItems()
    └── bottom navigation

/(product)/inbox/[id]/page.tsx
├── getInboxItem(id)
├── listCaptureJars()
└── server actions from inbox/actions.ts
    ├── resolve / dismiss / acknowledge
    ├── mark read / unread
    └── load more open queue
```

### Primary and secondary targets

**PRIMARY TARGET:** `/[locale]/inbox` — open queue, default `tab` state.

**SECONDARY TARGETS:**

- `/[locale]/inbox?tab=archived` — same page, archived data loader.
- `/[locale]/inbox/[id]` — review detail and decision surface.
- Source links from detail to Money transaction/savings/loan/debt or Plan jar routes.
- `app/[locale]/(product)/layout.tsx` — shared unread badge dependency.
- `app/[locale]/(product)/inbox/actions.ts` — action and pagination adapters.

There is no separate filesystem archived route and no separate review/action route. Archived is a query-state branch of the queue page; decisions are performed by server actions from the detail surface.

## 3. Primary Target

The open queue is the highest-value target because it is the default Inbox screen, owns the first useful content, and is shared indirectly by the product shell badge.

Current authenticated fixture:

| Property               |                Value |
| ---------------------- | -------------------: |
| Open items             |                    6 |
| Archived items         |                    7 |
| Open page size         |                   25 |
| Base queue response    | 6 rows / 6,121 bytes |
| Transaction source IDs |                    4 |
| Savings source IDs     |                    2 |
| Loan source IDs        |                    0 |
| Liability source IDs   |                    0 |
| Owner membership IDs   |                    2 |

## 4. Server Component / Streaming Structure

### Auth and membership

`ProductLayout` calls `requireProductSession()`, which uses the request-local `getSessionMembership()` cache. The Inbox page then calls `getSessionUser()` and `resolveActiveMembership()` directly, but both functions are themselves React-cached, so the page does not add duplicate remote auth or membership requests in the same server render.

`assertMoneyActionAllowed()` is also request-cached and is reused by the Inbox query functions.

### Queue loading

The open page awaits `listOpenInboxPage()` before rendering the queue. There is no nested Suspense boundary around the summary or list. `loading.tsx` provides a route-segment fallback, but the actual page content is page-wide blocked on the queue and enrichment work.

The product footer has an independent Suspense boundary for `ProductNavigation`. The unread badge can stream separately, but the Inbox summary/list are not meaningfully streamed in sections.

### Client follow-up work

- `InboxQueueTransition` calls `router.prefetch()` for the alternate archived/open tab after hydration.
- `InboxQueueRow` links do not set `prefetch={false}`, so Next prefetches detail RSC routes for visible open items.
- `loadMoreInboxAction()` is a server action and appends another enriched page in client state.
- Read/unread success calls `router.refresh()`.
- Decision success uses `router.replace()` back to the queue with a receipt query.
- No Inbox client component performs a direct REST fetch.

## 5. Remote Request Inventory

The following is the representative warm open-queue path. Auth claims are verified locally after the JWKS is warm; a cold process may additionally fetch the Supabase JWKS document once.

| Sequence | Method / path                                      | Source function                  | Selected data                                                                      | Rows / bytes                     | Dependency                       | UI consumer                                |
| -------: | -------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------- | -------------------------------- | ------------------------------------------ |
|        1 | `GET /auth/v1/user`                                | `getSessionUser()`               | Current Auth user                                                                  | 1 / 2,171 bytes direct benchmark | Parallel with claims             | Product gate and Inbox gate                |
|        2 | Claims verification                                | `getVerifiedAuthSubject()`       | Verified JWT subject                                                               | No warm HTTP request             | Starts before membership         | Product gate                               |
|        3 | `GET /rest/v1/household_members`                   | `resolveActiveMembership()`      | `id, household_id, role, user_id`; active user membership                          | 1 / 167 bytes direct benchmark   | Waits for verified subject       | Household gate                             |
|        4 | `GET /rest/v1/inbox_items`                         | `listOpenInboxPage()`            | `INBOX_SELECT`; pending, canonical kinds, assignment, ordered, limit 26            | 6 / 6,121 bytes                  | After gate                       | Queue and summary                          |
|        5 | `HEAD /rest/v1/inbox_items`                        | `countUnreadOpenInboxItems()`    | Exact count; `read_at IS NULL`; same household/kind/assignment visibility          | Count 6 / no body                | Parallel with base queue         | Bottom navigation badge                    |
|        6 | `GET /rest/v1/transactions`                        | `enrichWithTransactionDetails()` | `id, note, categories(name), accounts(name, financial_scope, owner_membership_id)` | 4 / 834 bytes                    | Parallel source wave after queue | Queue/detail source context and capability |
|        7 | `GET /rest/v1/savings`                             | `enrichWithTransactionDetails()` | `id, financial_scope, owner_membership_id`                                         | 2 / 243 bytes                    | Parallel source wave after queue | Savings capability                         |
|        8 | `GET /rest/v1/loans`                               | `enrichWithTransactionDetails()` | `id, financial_scope, owner_membership_id`                                         | 0 in current fixture             | Conditional on loan kinds        | Loan capability                            |
|        9 | `GET /rest/v1/liabilities`                         | `enrichWithTransactionDetails()` | `id, financial_scope, owner_membership_id`                                         | 0 in current fixture             | Conditional on debt kinds        | Liability capability                       |
|       10 | `GET /rest/v1/household_members`                   | `listActiveMembershipIds()`      | `id`; household active membership IDs in source owner set                          | 2 / 96 bytes                     | After source reads               | Former/non-owner privacy capability        |
|       11 | `POST /rest/v1/rpc/run_inbox_staleness_worker`     | `after()` callback               | Existing Inbox maintenance RPC                                                     | Not applicable                   | After response                   | Existing maintenance                       |
|       12 | `POST /rest/v1/rpc/sync_loan_debt_attention_inbox` | `after()` callback               | Existing Inbox maintenance RPC                                                     | Not applicable                   | Parallel with worker             | Existing maintenance                       |

### Request count

For the current fixture and a warm open queue:

- **7 initial Supabase/Auth HTTP requests**: user, membership, queue, unread HEAD, transaction source, savings source, owner validation.
- **9 including the two existing after-response maintenance RPCs.**
- Cold auth can add one JWKS fetch; an expired browser session can add a token refresh, but neither is normal warm Inbox content work.
- Loan and liability reads are conditional and were not sent for this fixture.

## 6. Dependency Graph

```text
getSessionUser() ───────────────┐
                               ├── authenticated user + membership gate
getVerifiedAuthSubject() ──┐    │
                           └── resolveActiveMembership()

authenticated gate
├── listOpenInboxPage()
│   └── inbox_items base rows
│       ├── transactions source lookup ──┐
│       ├── savings source lookup ───────┼── source wave
│       ├── loans source lookup (if IDs) ┤
│       └── liabilities lookup (if IDs) ─┘
│           └── listActiveMembershipIds() ── owner/privacy wave
└── countUnreadOpenInboxItems()
    └── inbox_items exact unread HEAD

after response:
├── runInboxStalenessWorker()
└── syncLoanDebtAttentionInboxItems()
```

## 7. Dependency Waves

| Wave | Calls                                    | Shape                                                               | Blocks first queue item?                         |
| ---: | ---------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------ |
|   0A | `getUser`, `getClaims`                   | Parallel logical auth checks                                        | Yes                                              |
|   0B | Active membership lookup                 | Follows verified subject; overlaps the already-started user request | Yes                                              |
|    1 | Open base queue + unread HEAD            | Parallel                                                            | Queue base yes; badge no because footer Suspense |
|    2 | Transaction/savings/loan/liability reads | Parallel, conditional by IDs/kinds                                  | Yes                                              |
|    3 | Active owner-membership validation       | Serial after source rows reveal owner IDs                           | Yes when owner IDs exist                         |
|    4 | Two maintenance RPCs                     | Parallel after response                                             | No                                               |

The Plan inbox enrichment optimization is preserved: all applicable source reads are created before `Promise.all()`. The remaining intentional serial dependency is owner validation, which cannot be formed until source rows expose ownership IDs.

## 8. Production-Like Baseline

### Browser baseline

Ten warm authenticated loads of `http://localhost:3100/en/inbox` were run against the built app after sign-in. The browser session was authenticated; no Inbox actions were performed.

| Metric                                           |        Min |         Median |        P75 |        P95 |        Max |
| ------------------------------------------------ | ---------: | -------------: | ---------: | ---------: | ---------: |
| Response start / TTFB                            |   322.1 ms |   **366.8 ms** |   391.6 ms |   956.8 ms |   956.8 ms |
| DOMContentLoaded / content available upper bound | 1,335.7 ms | **1,587.9 ms** | 1,821.5 ms | 1,961.4 ms | 1,961.4 ms |
| Full page load                                   | 1,341.7 ms | **1,594.1 ms** | 1,803.0 ms | 1,967.0 ms | 1,967.0 ms |

The queue list was visible immediately after the DOMContentLoaded checkpoint in all runs. The median is therefore a conservative content-available measure, not a claim that the first row painted exactly at DOMContentLoaded.

The 956.8 ms TTFB outlier is consistent with hosted Auth/HTTP variance; the remaining warm TTFB samples were 322.1–471.7 ms.

### Server trace observations

Representative warm trace groups repeatedly showed:

```text
auth.getUser              ~0.29–1.18 s
membership.resolve        ~0.27–0.90 s
inbox_items queue         ~0.28–0.76 s
inbox_items unread HEAD   ~0.29–0.71 s
transaction source        ~0.27–0.33 s
savings source            ~0.42–0.53 s
owner membership          ~0.27–0.35 s
```

The queue request and unread HEAD started together. Source reads started together after the queue response. Owner validation started after the source wave.

## 9. Auth / Membership

The route uses two security-relevant Auth operations:

1. `getUser()` retrieves the current user from Supabase Auth.
2. `getClaims()` verifies the JWT subject before membership resolution.

These are not a confirmed duplicate: the code intentionally validates current user identity against the verified subject. Request-local React caching prevents the layout, page, badge, and Inbox query functions from repeating these calls within one server render.

Direct 20-sample control results from the repository benchmark:

| Probe                                |   Median |      P75 |      P95 |      Max |
| ------------------------------------ | -------: | -------: | -------: | -------: |
| Auth `getUser`                       | 275.9 ms | 308.8 ms | 409.3 ms | 648.7 ms |
| Membership lookup                    | 273.6 ms | 296.2 ms | 442.2 ms | 618.3 ms |
| Minimal authenticated PostgREST read | 285.1 ms | 359.6 ms | 641.5 ms | 659.1 ms |

The product layout and Inbox page each appear to call the gate in source code, but the runtime path uses cached promises; the trace showed one current-user request and one initial active-membership request for the page load, not a layout/page duplicate.

## 10. Open Queue Contract

`listOpenInboxPage()` applies:

- `household_id = current household`.
- `status = pending`.
- Canonical Inbox kinds only.
- `assigned_to_user_id IS NULL OR assigned_to_user_id = current user`.
- Ordering: `created_at DESC, id DESC`.
- Page size: 25 items, fetched as 26 to determine `nextCursor`.
- Cursor: older `created_at`, then older `id` for equal timestamps.
- `read_at` is returned for row unread cues but is not an open-queue filter.
- `source_type` and `source_id` are returned for source links and enrichment selection.
- `context_json` is returned for typed payload construction, lifecycle dates, source IDs, and action contracts.

### Field-to-consumer map

| Base field                                  | Consumers                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `id`                                        | Row/detail identity, links, actions, cursor tie-breaker                                     |
| `kind`, `status`                            | Grouping, labels, lifecycle, decision panel, archived status                                |
| `title`, `amount`, `currency`               | Display title and financial context                                                         |
| `source_id`, `source_type`                  | Source enrichment and source link resolution                                                |
| `created_at`, `expires_at`                  | Lifecycle fallback and item chronology                                                      |
| `auto_resolved`                             | Canonical mapped item state                                                                 |
| `confidence_score`                          | Suggested-action display in decision panel                                                  |
| `suggested_jar_id`, `suggested_category_id` | Typed payload and suggested action selection                                                |
| `context_json`                              | Typed payload, lifecycle, note/category/account fallback, ownership IDs, emergency metadata |
| `assigned_to_user_id`                       | Assignment semantics and typed display state                                                |
| `read_at`                                   | Queue unread cue and detail read-state control                                              |

## 11. Unread Badge / Count

`countUnreadOpenInboxItems()` and `listOpenInboxPage()` overlap on household, pending status, canonical kinds, and assignment visibility, but they are not semantically interchangeable:

- Queue data is a bounded page of all open rows.
- Badge data is an exact count of unread open rows across the whole queue.
- The queue page can have more than 25 rows and can contain read rows.
- The product layout needs a badge even on non-Inbox product routes.

**Classification:** `CONFIRMED OVERLAPPING READ`, not a safe duplicate to remove by inspection.

The badge request is streamed in the product footer and did not block the main queue in the observed route. It is still expensive: the direct exact `HEAD` benchmark was:

| Probe               |       Median |      P75 |      P95 |      Max |
| ------------------- | -----------: | -------: | -------: | -------: |
| Unread exact `HEAD` | **524.4 ms** | 572.1 ms | 695.7 ms | 864.2 ms |

A future shared read model could return an exact unread count alongside the first queue page, but it must preserve the product-shell badge on other routes, pagination correctness, RLS, and read-state semantics. This is not the first low-risk change.

## 12. Source Enrichment

### Current behavior

`enrichWithTransactionDetails()` computes source IDs from the base rows, then starts all applicable source reads before awaiting them:

- Transactions: one batched query with nested account and category names plus ownership columns.
- Savings: one batched household-scoped query.
- Loans: one batched household-scoped query when loan IDs are present.
- Liabilities: one batched household-scoped query when debt IDs are present.
- Owner validation: one batched active-membership query after source rows are known.

### Direct 20-sample source benchmarks

| Probe                       | Fixture rows | Bytes |   Median |      P75 |      P95 |      Max | Errors |
| --------------------------- | -----------: | ----: | -------: | -------: | -------: | -------: | -----: |
| Base queue                  |            6 | 6,121 | 291.5 ms | 399.8 ms | 494.7 ms | 675.5 ms |      0 |
| Transaction enrichment      |            4 |   834 | 271.9 ms | 280.5 ms | 424.6 ms | 611.0 ms |      0 |
| Savings enrichment          |            2 |   243 | 268.5 ms | 272.9 ms | 335.2 ms | 347.7 ms |      0 |
| Loan enrichment             |            0 |     2 | 277.7 ms | 315.0 ms | 752.7 ms | 834.9 ms |      0 |
| Liability enrichment        |            0 |     2 | 276.2 ms | 281.8 ms | 384.6 ms | 425.4 ms |      0 |
| Owner membership validation |            2 |    96 | 267.2 ms | 282.0 ms | 296.1 ms | 417.6 ms |      0 |

Loan and liability values are empty-set probes because the current authenticated fixture has no such open Inbox items. They do not establish populated source-enrichment cost.

### Cost conclusion

Source enrichment is meaningful but already parallelized. With transaction and savings sources present, the source wave is dominated by the slower source response; owner validation then adds a second hosted request floor. The current shape is approximately:

```text
base queue
  → max(transaction, savings, loan?, liability?)
  → owner membership validation
```

This is a shared Inbox opportunity, but a source read model would have more privacy/RLS and maintenance risk than the prefetch fix.

## 13. Ownership / Privacy

The read path preserves ownership validation rather than trusting Inbox metadata alone.

| Source / state                                 | Current behavior                                                                             |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Household-scoped source                        | Capability remains actionable for household ownership.                                       |
| Personal source owned by current member        | Actionable when owner membership is active.                                                  |
| Personal source owned by another active member | Read-only non-owner capability.                                                              |
| Personal source with inactive/former owner     | Read-only former-owner capability.                                                           |
| Missing or failed source                       | Source-unavailable capability for source-backed kinds.                                       |
| Foreign household source                       | Household-scoped source query and RLS prevent it from being treated as a valid local source. |

Transactions are queried by Inbox source IDs without an explicit household filter; the authenticated Supabase/RLS path and nested account ownership data remain part of the privacy contract. Savings, loans, and liabilities add explicit household filters. Owner validation checks only the source owner IDs found in the source read and requires active membership in the current household.

**Conclusion:** owner validation is not a confirmed redundant read. Do not remove it merely to collapse a wave.

## 14. Archive / Detail Observations

### Archived queue

- Uses the same `INBOX_SELECT` projection and the same enrichment helper.
- Filters to all archived statuses in `INBOX_ARCHIVED_STATUS_VALUES`.
- Fetches up to 100 rows in one request; no cursor or lookahead.
- Uses the product-shell unread HEAD because the badge remains open-unread, not archived count.
- Archived rows render as read-only cards and do not emit detail links, so their list does not create the same detail prefetch fan-out.

This loader is intentionally shared at the enrichment level, but it also performs capability work that the archived read-only card does not render. That is a possible P2 optimization only after confirming archived privacy/display requirements.

### Detail route

`/[locale]/inbox/[id]` runs `getInboxItem(id)` and `listCaptureJars()` in parallel after the auth/membership gate.

- `getInboxItem()` performs one base Inbox row lookup and the same conditional source enrichment helper.
- `listCaptureJars()` is needed for pending decision panels.
- The jars query is currently unconditional, so a missing or non-pending detail still starts a jars read even though the decision panel is not rendered.
- The detail route also inherits the product-layout unread HEAD.
- The observed transaction detail loaded one Inbox base read, one jars read, one transaction enrichment read, and the product-shell unread HEAD, in addition to Auth/membership.

The route does not reuse a queue row already available in the browser; direct navigation and RSC prefetch each execute the detail loader independently.

## 15. Pagination / Overfetch

### Open queue

- Correct bounded page: 25 visible rows plus one lookahead row.
- No exact open count query is used by the page itself.
- The badge exact count is separate and counts unread, not total open.
- Client-side filtering and search operate on the loaded page only; load more adds another enriched page.

### Archived queue

- Fixed limit 100 with no cursor and no exact count.
- This is the clearest pagination risk at larger archive sizes.

### Projection

The base projection includes the complete `context_json` envelope and fields used mainly by detail/action contracts, including maturity recommendation payloads, confidence, suggested IDs, and assignment metadata. This is functionally safe and the current 6-row payload is only 6.1 KB, but it is moderate potential overfetch for 25-row pages with large savings contexts.

The source projection is narrow for source ownership, but transaction enrichment includes both display relations and ownership columns in one query. Those fields are currently justified by queue display and capability resolution.

**Classification:** open queue overfetch **MODERATE**, archived queue scaling **MODERATE**, current byte volume **LOW**.

## 16. PostgreSQL Plans

The requested live `EXPLAIN (ANALYZE, BUFFERS)` plans were not available:

- `psql` is not installed in the environment.
- Supabase CLI is 2.20.5 and does not provide `supabase db query`.
- Hosted PostgREST returned 406 for the plan media type, indicating plan output is disabled.

No speculative index was added and no SQL was executed through a privileged path.

### Static schema evidence

The migration baseline contains relevant indexes:

- `idx_inbox_items_household_status`
- `inbox_items_open_read_cursor_idx`
- `inbox_items_open_unread_idx`
- `idx_household_members_household_active`
- `household_members_one_active_per_user`
- source ownership indexes for savings, loans, and liabilities
- household/created-time indexes for transactions and source tables

### Classification

**PostgreSQL:** `INCONCLUSIVE` as an execution-plan verdict; observed API behavior is **transport-dominated**. The minimal authenticated PostgREST control had a 285.1 ms median, close to the 267–292 ms medians of the Inbox base/source reads. This strongly suggests a hosted request floor, but it cannot prove planner/executor time without live plans.

## 17. Direct Benchmarks

All direct probes used the authenticated publishable-key session, read-only GET/HEAD requests, and 20 samples after one warmup. The harness did not print tokens or raw response rows.

| Endpoint shape                              |   Median |      P75 |      P95 |      Max | Response rows | Response bytes | Errors |
| ------------------------------------------- | -------: | -------: | -------: | -------: | ------------: | -------------: | -----: |
| Inbox base open page                        | 291.5 ms | 399.8 ms | 494.7 ms | 675.5 ms |             6 |          6,121 |      0 |
| Transaction enrichment                      | 271.9 ms | 280.5 ms | 424.6 ms | 611.0 ms |             4 |            834 |      0 |
| Savings enrichment                          | 268.5 ms | 272.9 ms | 335.2 ms | 347.7 ms |             2 |            243 |      0 |
| Loan enrichment, empty current fixture      | 277.7 ms | 315.0 ms | 752.7 ms | 834.9 ms |             0 |              2 |      0 |
| Liability enrichment, empty current fixture | 276.2 ms | 281.8 ms | 384.6 ms | 425.4 ms |             0 |              2 |      0 |
| Owner membership validation                 | 267.2 ms | 282.0 ms | 296.1 ms | 417.6 ms |             2 |             96 |      0 |
| Unread exact HEAD                           | 524.4 ms | 572.1 ms | 695.7 ms | 864.2 ms |       count 6 |        no body |      0 |

The repository control benchmark also measured hosted Auth `getUser` at 275.9 ms median and membership at 273.6 ms median. Parallelism is valuable: five parallel minimal reads had 556.9 ms total wall time versus 2,314.6 ms for five sequential reads in the same harness.

## 18. Duplicate / Overlapping Reads

| Read pair                                       | Classification                                     | Finding                                                                                                                 |
| ----------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Unread HEAD + open queue GET                    | Confirmed overlapping read, not semantic duplicate | Same table/visibility, different exact-unread vs paged-open contract. Keep until a shared exact-count design is proven. |
| Layout gate + page gate                         | Not a remote duplicate                             | React request caching reuses `getSessionUser()` and membership promises.                                                |
| Transaction/savings/loan/liability source reads | Necessary conditional fan-out                      | One batched read per source type; parallelized.                                                                         |
| Source reads + owner membership validation      | Necessary dependency                               | Owner IDs are not known until source rows return.                                                                       |
| Open queue + archived queue                     | Necessary                                          | Different status sets; alternate-tab prefetch is optional traffic, not duplicate data needed for the current view.      |
| Queue row + detail route                        | Confirmed prefetch amplification                   | Detail links trigger server loaders before user intent; each loader repeats auth/layout badge/source work.              |
| Detail item + jars                              | Conditional over-fetch                             | Jars are needed for pending actions, but currently fetched for missing/non-pending detail too.                          |
| Server render + browser REST                    | Not present                                        | No direct client REST fetch exists in Inbox.                                                                            |
| Read/unread action + refresh                    | Necessary follow-up after mutation                 | `router.refresh()` refreshes server truth after a successful action.                                                    |

## 19. Client / Post-Hydration Requests

### Confirmed client behavior

- Product bottom-navigation links use `PRODUCT_LINK_PREFETCH = false`.
- Top-app-bar back links also use the shared prefetch-off constant.
- Inbox tab switching explicitly prefetches the alternate tab.
- Inbox queue detail links omit the prefetch prop and therefore use Next's default link prefetch behavior.
- The current open fixture had 6 visible detail links. Browser request capture showed the archived-tab RSC prefetch plus detail RSC prefetch traffic; cumulative capture included repeated detail RSC entries from route discovery/prefetch overlap.

### Initial route versus follow-up

The main page's Supabase requests are server-side. Browser post-hydration RSC prefetches cause more server renders, and those server renders in turn repeat Auth/membership/badge/source reads. They are not browser REST calls, but they are real Supabase workload.

Observed post-hydration shape:

```text
open queue hydrated
├── 1 alternate-tab RSC prefetch
└── up to N visible open-item detail RSC prefetches
    └── each detail may run Auth/membership + unread badge + item/source + jars
```

**Post-hydration request finding:** the queue detail-link prefetch is avoidable and is the largest confirmed client-side amplification. Exact per-load detail counts are marked approximate because the CLI request list is cumulative across the browser session and Next can coalesce or repeat RSC prefetches.

## 20. Root-Cause Classification

| Rank          | Cause                               | Classification                           | Evidence                                                                                 |
| ------------- | ----------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| P1            | Hosted Supabase/Auth request floor  | Confirmed                                | Auth, membership, base, source, and even minimal reads cluster around 267–292 ms median. |
| P1            | Detail-link prefetch amplification  | Confirmed                                | Open rows omit prefetch opt-out; browser captured alternate-tab and detail RSC requests. |
| P1            | Unread HEAD                         | Confirmed cost, not necessarily a defect | 524.4 ms median; streamed and semantically distinct from paged queue.                    |
| P2            | Owner validation wave               | Necessary cost                           | Required for active/former/non-owner privacy; one serial source-dependent request.       |
| P2            | Full `context_json` list projection | Moderate potential overfetch             | Detail/action payload fields are carried in list rows; current bytes remain small.       |
| P2            | Archived fixed limit 100            | Scaling risk                             | No cursor or pagination. Current 7-row archive is not large enough to show impact.       |
| P2            | Unconditional detail jars read      | Confirmed conditional over-fetch         | Jars are fetched even when detail is missing or non-pending.                             |
| NOT A PROBLEM | Source-read serial waterfall        | Not present                              | Four source types are parallelized.                                                      |
| NOT A PROBLEM | Layout/page auth duplication        | Not present at runtime                   | React caches collapse the shared request-local calls.                                    |
| INCONCLUSIVE  | PostgreSQL executor/planner         | No live plan access                      | Relevant indexes exist, but `EXPLAIN` was unavailable.                                   |

## 21. Ranked Optimization Candidates

| Rank | Candidate                                                        | Wall-time gain                                                           | Confidence            | Privacy/RLS risk | Complexity  | Recommendation                                                              |
| ---: | ---------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------- | ---------------- | ----------- | --------------------------------------------------------------------------- |
|    1 | Disable detail prefetch on Inbox queue rows                      | High for avoidable post-hydration work; little direct first-content gain | High                  | Low              | Low         | First target                                                                |
|    2 | Measure a shared exact-count/read-model option for queue + badge | Potentially removes one 524 ms request and one overlapping read          | Medium                | Medium/high      | Medium/high | Investigate after prefetch cleanup; do not infer from current 6-row fixture |
|    3 | Only load capture jars for pending detail items                  | Removes one detail request for archived/missing/non-pending cases        | High for those routes | Low              | Low         | Safe follow-up characterization                                             |
|    4 | Narrow or split list/detail context payloads                     | Reduces bytes and parsing for large maturity contexts                    | Medium                | Medium           | Medium      | Add only with populated 25-row benchmark                                    |
|    5 | Give archived queue its own bounded/paginated projection         | Prevents 100-row archive growth                                          | Medium at scale       | Medium           | Medium      | Add when archive size or payload proves it matters                          |
|    6 | Consolidate source ownership reads into a narrow read model      | Could remove source/owner wave                                           | Medium                | High             | High        | Do not add without RLS/privacy proof and live plans                         |

Skipped for now: mega Inbox RPC, speculative indexes, service-role reads, client-side initial loading, Auth changes, region changes, financial-data changes, status/assignment changes, and broad refactoring.

## 22. Recommended First Implementation

**FIRST TARGET:** `app/[locale]/(product)/inbox/inbox-queue-row.tsx`

**CURRENT SHAPE:**

- Main queue: 7 warm Supabase/Auth requests, 4 dependency waves.
- Post-hydration: alternate-tab prefetch plus up to 6 visible detail-link prefetches.
- Each detail prefetch can execute the product gate, unread badge, detail item/source reads, and jars read before user intent.

**TARGET SHAPE:**

- Main queue unchanged: 7 requests, 4 waves.
- Post-hydration: retain only explicitly required alternate-tab prefetch; no automatic detail-route prefetch from queue rows.
- User click performs one intentional detail navigation.

**WHY:**

This is the highest-confidence low-risk reduction in confirmed work. It preserves Inbox status, assignment, ownership, capability, privacy, and source contracts. It also removes server-side work that is not needed to show the first useful Inbox content.

**EXPECTED RISK:** LOW

No implementation was made in this investigation.

## 23. Raw Evidence

### Commands and artifacts

- `npm run build` — passed on Next.js 16.3.1.
- `PORT=3100 VINHA_PERF_TRACE=1 npm run start` — production server started successfully.
- `VINHA_SUPABASE_BENCH=1 VINHA_SUPABASE_BENCH_REPEATS=20 node scripts/supabase-request-path-benchmark.mjs` — passed; Auth/membership/control evidence captured.
- Browser: Playwright CLI authenticated against `/en/inbox`; ten warm loads; archived and detail routes visited; browser RSC requests inspected.
- Server trace: `[vinha.perf]` output captured from the built server; no tokens, bodies, or row data are logged by the trace utility.

### Relevant source files inspected

- `app/[locale]/(product)/layout.tsx`
- `app/[locale]/(product)/inbox/page.tsx`
- `app/[locale]/(product)/inbox/[id]/page.tsx`
- `app/[locale]/(product)/inbox/loading.tsx`
- `app/[locale]/(product)/inbox/[id]/loading.tsx`
- `app/[locale]/(product)/inbox/inbox-queue-row.tsx`
- `app/[locale]/(product)/inbox/inbox-queue-transition.tsx`
- `app/[locale]/(product)/inbox/actions.ts`
- `modules/inbox/application/queries/review-items.ts`
- `modules/inbox/application/mappers/inbox-item.mapper.ts`
- `modules/tenancy/application/get-session-membership.ts`
- `modules/tenancy/application/assert-money-action-allowed.ts`
- `modules/tenancy/application/resolve-active-membership.ts`
- `modules/tenancy/application/list-active-membership-ids.ts`
- `modules/ledger/application/queries/list-transactions.ts`
- `modules/platform/application/perf-trace.ts`

### PostgreSQL limitation

Live plans remain the only material evidence gap. Re-run the four requested `EXPLAIN (ANALYZE, BUFFERS)` statements from an environment with authenticated SQL access before choosing indexes or a read model.
