# Inbox Performance Phase 0 — Architecture & Navigation Investigation

**Audit date:** 2026-10-11  
**Scope:** Source investigation only. No production code, Inbox mutation, hosted request, fixture setup, or browser session was run for this phase.

## Executive summary

- The open queue's first useful Inbox content waits for the full page read, source enrichment, and any required owner-membership validation. Source reads are batched in parallel; owner validation is a dependent second wave.
- The shared product layout reads an exact unread count for the bottom-nav badge in its own Suspense branch. That read overlaps the queue request, is not request-deduplicated with the page query, and does not gate the Inbox list.
- The earlier Inbox row-detail prefetch issue is already fixed: the shared `InboxRow` applies `PRODUCT_LINK_PREFETCH`, currently `false`. The explicit prefetch of the alternate queue tab remains.
- Inbox detail uses a fixed `/inbox` app-back link. Search and kind filters live only in client state. Source does not establish whether Next serves the previous RSC payload or issues a new request on this navigation; runtime proof is unavailable.
- The source-only candidate with the greatest first-content potential is the enrichment/owner-validation dependency. It also carries the highest privacy and capability risk. Existing owner-validation closeout did not accept its embedded-owner alternative.

**Phase 1:** defer implementation until a security-cleared, read-only current-path benchmark can isolate an avoidable dependency and verify access behavior. The credential-rotation gate is still unconfirmed, and an open Inbox render schedules two post-response maintenance RPCs.

## 1. Route and component map

| Surface          | Route and source                                                                                    | Server/client structure                                                                                                                                                        | First useful Inbox content                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Product shell    | `app/[locale]/(product)/layout.tsx`                                                                 | Server layout gates with `requireProductSession`, then renders `ChromeShell`, `ProductRouteTransition`, and bottom navigation. Badge content is in a footer Suspense boundary. | Product chrome may render while the badge fallback is shown.                                                                            |
| Inbox queue      | `/{locale}/inbox` — `app/[locale]/(product)/inbox/page.tsx`                                         | Async Server Component. Reads `tab` and `receipt`; renders `InboxQueueTransition`, summary, tabs, and `InboxQueueList`.                                                        | Summary plus first queue rows (or empty/unavailable state), after the selected page and enrichment complete.                            |
| Inbox detail     | `/{locale}/inbox/{id}` — `app/[locale]/(product)/inbox/[id]/page.tsx`                               | Async Server Component. Reads one item and capture jars; client leaves handle decision actions and read state. There is no inline expanded-row detail state.                   | Detail context/source and actions, after both the item path and jars promise resolve. Missing-item output also waits for both promises. |
| Queue components | `inbox-queue-list.tsx`, `inbox-queue-row.tsx`, `inbox-queue-tabs.tsx`, `inbox-queue-transition.tsx` | Client components. Search and kind filtering are local state; Load More calls a Server Action.                                                                                 | Rows are already in the RSC payload; filtering does not issue a read.                                                                   |
| Detail actions   | `inbox-decision-panel.tsx`, `inbox-read-state-control.tsx`, `actions.ts`                            | Client controls call server actions, which call application commands and revalidate Inbox views.                                                                               | Mutations are user-triggered; no action was issued in this audit.                                                                       |
| Source link      | `inbox-source-link.tsx`                                                                             | Server component mapping canonical Inbox kind/source data to a domain route.                                                                                                   | Source navigation is shown only when a valid supported target resolves.                                                                 |

`inbox/layout.tsx` adds the Inbox translation provider. `inbox/loading.tsx` and `inbox/[id]/loading.tsx` provide skeletons; those are not useful content. There is no Inbox-specific `error.tsx`; the product error boundary handles thrown errors, while query failures are generally mapped to Inbox unavailable UI. Locale-level error and not-found boundaries are also present.

## 2. Critical path

```text
Bottom navigation Inbox Link (prefetch disabled)
  → Product layout: verified session + active membership
  → Inbox page: request-cached user/membership helpers
  → listOpenInboxPage()
      → inbox_items page read (25 rows + one lookahead)
      → applicable source reads in parallel
      → owner active-membership validation, if source owner IDs exist
      → map rows and source capabilities
  → page returns summary, tabs, and useful queue content
  → browser reveals the Inbox rows

Product footer Suspense branch (parallel to the page content)
  → countUnreadOpenInboxItems()
  → exact unread HEAD count for the badge

After an open-queue response:
  → existing staleness-worker and loan/debt-attention RPC callbacks
```

The queue page awaits `listOpenInboxPage()` before constructing its content. That helper itself awaits enrichment and owner validation, so source metadata and capability resolution hold back every queue row, not just the fields that use the metadata. The detail page has no inner Suspense boundary either: it awaits the item and `listCaptureJars()` together before returning detail UI. The route loading files are segment fallbacks only.

Session helpers (`getSessionUser`, `resolveActiveMembership`, `getSessionMembership`, `assertMoneyActionAllowed`, and `createSupabaseServerClient`) use React `cache()`. The product gate, Inbox page gate, and read helpers converge on those cached functions during one server render. This is request-local reuse, not cross-request or cross-household caching.

## 3. Read/request topology

| Read                               | Current implementation                                                | Request behavior and purpose                                                                                                                                                                                                             |
| ---------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session identity                   | `getSessionMembership()` → verified auth subject and `auth.getUser()` | Auth helper calls; membership begins from the verified subject and overlaps user lookup. React cache shares the result in one render.                                                                                                    |
| Active household                   | `resolveActiveMembership()`                                           | One membership table read by user and active status, request-cached.                                                                                                                                                                     |
| Open Inbox page                    | `listOpenInboxPage()`                                                 | One PostgREST `inbox_items` read. Filters household, pending status, canonical kinds, and unassigned/current-user assignment; orders by `created_at DESC, id DESC`; asks for 26, returns 25 and a cursor.                                |
| Attention slice                    | `getOpenInboxAttention()`                                             | Separate `inbox_items` projection, also limited to 25. It computes a page-local open count and uncategorized presence; it does not enrich sources or return an exact total. Used by Home surfaces.                                       |
| Source transactions                | `enrichWithTransactionDetails()`                                      | Conditional `transactions` read for source IDs, embedding category and account names plus financial scope and owner membership. No explicit household filter is added here; authenticated source-table RLS remains part of the contract. |
| Source savings, loans, liabilities | `enrichWithTransactionDetails()`                                      | Up to three conditional reads, each filtered by authorized household and deduplicated source IDs. They fetch ownership/capability fields, not item-by-item details.                                                                      |
| Owner validation                   | `listActiveMembershipIds()`                                           | One `household_members` read for the distinct owner IDs found in source rows, scoped to household and active status. It runs after the source wave; with no owner IDs it returns without a remote request.                               |
| Unread badge                       | `countUnreadOpenInboxItems()`                                         | Separate exact-count `HEAD` on `inbox_items`, with pending/canonical-kind/assignment filters plus `auto_resolved = false` and `read_at IS NULL`.                                                                                         |
| Archived queue                     | `listArchivedInboxItems()`                                            | One `inbox_items` read for archived statuses, ordered newest first, limit 100; then the same conditional enrichment and owner-validation flow.                                                                                           |
| Detail item and action references  | `getInboxItem(id)` plus `listCaptureJars()`                           | One household/assignment-scoped item read with the same conditional enrichment; one jars read filtered to the active household and usable jars. They start in parallel, but the page awaits both.                                        |
| Load More                          | `loadMoreInboxAction(cursor)`                                         | Server Action invokes `listOpenInboxPage(cursor)`; this is server-side Supabase work, not a browser REST query.                                                                                                                          |

The query helpers are not themselves HTTP requests. Each awaited Supabase query builder issues a PostgREST request; embedded category/account relations are part of the transactions request, not separate per-row requests. The applicable source reads are created before `Promise.all()`, so there is no source-type N+1 and no serial waterfall among transaction/savings/loan/liability reads. Owner membership is serial because its IDs are learned from those results.

`listOpenInboxItems()` is a separate bounded helper (25 rows, timestamp ordering) used by other screens such as Plan. The Inbox queue route uses the cursor-based `listOpenInboxPage()` helper. The badge and the Inbox page do not retrieve the same count twice: the page summary uses the current page length, while the badge is an exact unread count. The attention helper is another projection with different semantics.

## 4. Enrichment, filtering, and pagination

- The open queue is deterministically ordered by timestamp and ID and fetches one lookahead row for cursor pagination. Load More appends another enriched page in client state.
- Search and kind filters run in the browser over rows already loaded. Search checks display title, stored title, note, category, and account names. These filters are not encoded in the URL and only cover loaded pages.
- The queue renders a single pending/history section; it does not group rows by date or another key.
- The archived tab is read-only, has no row-to-detail link, and currently loads up to 100 rows in one request with no cursor. Its archive-size distribution was not measured in this phase.
- `INBOX_SELECT` includes the `context_json` envelope and detail/action fields. That supports typed detail/action behavior but can carry more data than the visible queue needs. No current payload measurement was made.
- The detail route fetches capture jars even for a missing or non-pending item, although only a pending decision panel consumes them. For a pending item, the jars are a required action reference and currently run in parallel with the item read.

## 5. Badge and navigation behavior

### Badge

The product layout renders the unread count inside a Suspense boundary whose fallback is the bottom navigation without a count. The count can add backend/transport work while the queue is loading, but it does not block the queue branch. `countUnreadOpenInboxItems()` and `listOpenInboxPage()` are distinct cached functions and distinct SQL/PostgREST operations; React cache does not merge them. The badge remains required on other product routes, and its exact unread semantics are not interchangeable with the first 25 open rows.

`getOpenInboxAttention()` is a third helper. It reads at most 25 open rows and derives its summary locally without source enrichment. It is not the navigation badge count and should not be represented as an exact household-wide total.

### Prefetch and return navigation

- Bottom-navigation links and Inbox row links use `PRODUCT_LINK_PREFETCH`, currently `false`. Inbox row links get this through the shared `InboxRow` in `shared/patterns/inbox-row.tsx`; the earlier detail-prefetch amplification was already removed.
- Inbox tab switching explicitly calls `router.prefetch()` for the alternate open/archive tab after hydration. That is still authenticated RSC work.
- The Inbox detail top bar uses a fixed `backHref={APP_PATH.INBOX}`. It is a Link navigation, not `router.back()`, and the URL does not carry kind/search filter state. Archived rows are read-only and do not link to detail.
- The source link can navigate to Money Transactions, Savings, Loans, Debts, or Plan Jars/Plan, depending on canonical item kind and source data. It has no Together target. Source detail pages generally use their owning Money/Plan list as their own app-back destination; they do not receive an Inbox return parameter. Separate explicit Inbox entry links exist in some source flows, such as a completed Loan and Savings early-withdrawal receipt.
- Source code establishes that filter state is local and the detail app-back target is `/inbox`. It does not establish whether Next reuses the prior Inbox RSC payload or issues a fresh RSC request, nor whether scroll/local filter state survives. The Transactions investigation measured a similar fixed app-back Link as a new list RSC request, but that sibling-route result is not Inbox runtime proof.

## 6. Authorization and correctness contracts

- Product routes require a current user and active household membership. Inbox reads additionally pass through `assertMoneyActionAllowed()`.
- Open, archived, and detail Inbox item reads apply the authorized household and unassigned/current-user assignment filters in application code. The local baseline migration also defines Inbox item RLS for household members; live RLS behavior was not probed.
- Source IDs from item/context data select candidate source rows; they do not establish authorization. Source rows supply `financial_scope` and `owner_membership_id`; active owner memberships are checked and existing financial capability resolvers produce the item's action capability.
- Savings, loans, and liability enrichment include explicit household filters. Transaction enrichment relies on authenticated RLS for source visibility and reads nested account ownership fields. Existing source-table policies and capability rules must remain intact in any read-model change.
- Read/unread actions validate UUID input, re-check the server-side product gate, constrain updates by household and item ID, revalidate Inbox views, and refresh server truth in the client. Dismiss/acknowledge/resolve continue through existing application commands/RPCs. No mutation command was changed or invoked.
- Queue ordering, assignment visibility, attention priority, read state, source-specific link choice, unavailable-source handling, and archive/read-only behavior are existing contracts. No source visibility, status, or cache policy was changed.
- The open queue page schedules `runInboxStalenessWorker` and `syncLoanDebtAttentionInboxItems` in `after()`. Those callbacks can update Inbox records, so authenticated page navigation is not automatically a read-only runtime probe unless the callbacks are safely intercepted.
- `next.config.ts` still sets `logging.serverFunctions: false`. No service-role client or cross-user cache was added or used.

## 7. Runtime evidence and limitations

No authenticated browser, Brave profile, hosted Supabase read, RSC trace, HTTP timing, database plan, or five-sample warm benchmark was run for this Phase 0. The previously exposed E2E credential is still not confirmed rotated in the 2026-10-11 Plan closeout. No credential was reused, no unrelated personal browser session was used, and the fixture-writing Playwright setup was not run against shared Supabase. The automatic `after()` callbacks are an additional reason a normal Inbox navigation is not a strictly read-only probe.

Historical records are retained as context, not reported as current Phase 0 measurements:

- `.agents/audits/inbox-performance-investigation.md` records a 2026-09-11, ten-sample warm authenticated queue run: response-start median 366.8 ms, conservative queue-content median 1,587.9 ms, and full-load median 1,594.1 ms. The report attributes the path to hosted Auth/PostgREST waits and shows parallel source reads followed by owner validation. It predates the detail-prefetch cleanup.
- `.agents/audits/inbox-prefetch-cleanup.md` records a controlled ten-load before/after capture (the report has no audit date): detail RSC prefetches fell from 2 to 0 per load, while alternate-tab prefetch remained at 1 per load. Its initial-content samples were noisy and did not show a gain; alternate-tab click comparison was inconclusive. Current source confirms the row prefetch opt-out remains in the shared `InboxRow`.
- `.agents/audits/inbox-owner-validation-closeout.md` records that the embedded-owner alternative was not accepted because required RLS/privacy cases were still missing. This is a security gate, not evidence that the current owner-validation request is avoidable.

No p50/p75 is claimed for this audit. No SQL execution time is available; historical hosted HTTP durations cannot be separated into transport, PostgREST, and SQL execution time. The Plan closeout's credential gate and the Transactions navigation results were read for context only; their measurements do not establish current Inbox timing or behavior.

## 8. Ranked bottleneck candidates

Source-only findings are structural candidates, not measured current latency bottlenecks.

| Rank | Candidate and route                                                                      | Evidence and dependency                                                                                                                                                                                                 | Possible Phase 1 direction                                                                                                        | Risk and verification needed                                                                                                                                                                                                                                                        |
| ---: | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|    1 | **Source/owner dependency holds first Inbox rows** — `/inbox`                            | Page awaits the first 25 items, all applicable source reads, then owner validation before producing list content. The old warm trace measured source/owner HTTP work, but it is not a current post-cleanup profile.     | First benchmark the source and owner waves; only then evaluate a narrow owner projection or independently streamed content.       | Highest privacy/capability risk: active, former, and non-owner memberships; source-not-found/error; account scope; action eligibility; household/assignment filters; ordering. Preserve the existing source resolver. Reprove RLS and capability equivalence before implementation. |
|    2 | **Detail app Back may re-request Inbox and lose local filters** — `/inbox/[id] → /inbox` | Fixed Link target omits the local kind/search state. A fresh RSC request and state restoration are runtime questions; the Transactions route's measured result is not transferable proof.                               | Capture app-back and browser-history paths with the same Inbox state and record RSC count, scroll, and filter restoration.        | Do not change history behavior without preserving deep-link fallback, locale, return target, and accessible navigation.                                                                                                                                                             |
|    3 | **Exact unread badge read overlaps the Inbox page** — product shell                      | Separate exact `HEAD` query in a deferred footer branch; historical Inbox trace recorded a 524.4 ms median for this read. It is not a page-content dependency and is semantically distinct from the page of open items. | Keep as a contention candidate only if fresh traces show it degrades queue readiness; compare on Inbox and another product route. | Combining counts risks unread/read/auto-resolved semantics, pagination, and badge correctness on every product route. Do not globally remove or cross-request-cache it.                                                                                                             |
|    4 | **Alternate-tab prefetch performs work without proven click benefit** — `/inbox`         | Source has explicit `router.prefetch()` after hydration. The stored capture saw one alternate-tab RSC request per load; a small click comparison was inconclusive.                                                      | Re-measure the request and archived-tab click together before considering removal.                                                | Removing it may slow tab changes; previous timing evidence did not prove a win.                                                                                                                                                                                                     |
|    5 | **Detail page waits on jars even when actions cannot use them** — `/inbox/[id]`          | `getInboxItem(id)` and `listCaptureJars()` are awaited together; jars are not consumed for missing/non-pending items, but are required for pending decision actions.                                                    | Measure item versus jars readiness on a real pending detail before separating action references from core detail content.         | A serial conditional read can slow pending detail. Keep action availability, source authorization, and unavailable behavior equivalent.                                                                                                                                             |

Archive growth (100 enriched rows with no cursor) and list `context_json` payload size are additional source-level scaling/serialization observations, but no current archive-size or payload evidence supports ranking them above these candidates.

## 9. Phase 1 selection

**Defer Phase 1 implementation.** The single next step is a security-cleared, read-only current-path benchmark of Bottom Navigation → Inbox → open item → app Back, with at least five warm samples and the maintenance callbacks intercepted. Record the base Inbox read, each applicable source read, owner validation, unread badge, detail jars read, RSC request count, first useful item, and return-state behavior. Proceed to a code change only if those current traces isolate an avoidable application dependency and access/capability equivalence can be verified without creating fixtures.

**INBOX INVESTIGATION COMPLETE — STRUCTURAL CANDIDATE, RUNTIME BLOCKED**
