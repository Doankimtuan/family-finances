# Savings Performance Investigation

Status: **PARTIAL** — the primary route, live request trace, production-like browser baseline, direct endpoint benchmarks, and read-only PostgreSQL plans are complete. Exact generated SQL for the nested PostgREST projection and a second-household/anonymous runtime RLS matrix were not available without expanding the test fixture or changing the safety boundary.

Captured: 2026-09-11, Asia/Ho_Chi_Minh  
Application: Next.js 16.3.1 / React 19 / Supabase  
Revision: `e63ec554`  
Scope: authenticated read paths only; no production code or financial data changed.

## 1. Executive Summary

The primary Savings surface is `/{locale}/money/savings`.

The current warm authenticated shape is:

- 5 application-level Supabase/Auth HTTP requests: Auth user, current membership, inbox badge `HEAD`, one embedded Savings read, and one owner-membership validation read.
- 3 dependency waves: session/tenancy, Savings plus navigation badge, then ownership validation.
- No separate `saving_cycles` request on the primary list. Cycles are embedded in the Savings projection.
- No primary-list transaction read and no provider fan-out. Provider metadata is embedded in the Savings projection.
- One confirmed server-side overlap exists on the detail route: `getSaving()` and `listSavingCycles()` both read overlapping Savings/cycle data in parallel.

Fresh browser measurements for 10 direct authenticated loads at 440px show:

| Metric                          |    Min | Median |    P75 |      P95 |      Max |
| ------------------------------- | -----: | -----: | -----: | -------: | -------: |
| Savings list content visible    | 836 ms | 871 ms | 971 ms | 1,557 ms | 1,557 ms |
| Initial document response start | 294 ms | 318 ms | 358 ms |   415 ms |   415 ms |

Direct hosted request medians were approximately 201 ms for Auth user, 220 ms for the current membership query, and 282 ms for the Savings list. Read-only PostgreSQL plans were sub-millisecond to about 2.2 ms at the current fixture size. The material latency is therefore the hosted/Auth request floor and variance combined with page-wide server rendering, not PostgreSQL execution or a cycle N+1.

Ponytail decision: no implementation is justified from this evidence. Preserve the current embedded list read and stop. The only plausible future investigation is a controlled re-measurement of the owner-membership validation path at higher ownership cardinality; removing it now would risk former-owner behavior.

## 2. Route Architecture

Route graph:

```text
Product layout
  ├─ requireProductSession()
  ├─ ChromeShell
  └─ Suspense(ProductNavigation → unread inbox HEAD count)
       │
       ├─ /[locale]/money/savings
       │    └─ listSavings() → embedded accounts, provider, saving_cycles
       │
       ├─ /[locale]/money/savings/[id]
       │    ├─ getSaving(id)
       │    ├─ listSavingCycles(id)
       │    ├─ listSavingsFinancialActivities(id, cycles)
       │    ├─ conditional listProviderPackages(providerId)
       │    └─ conditional listSavingsEligibleAccounts()
       │
       ├─ /[locale]/money/savings/new
       │    ├─ listSavingsEligibleAccounts()
       │    └─ listProviderCatalog()
       │
       ├─ /[locale]/money/savings/providers
       │    └─ listProviderCatalog()
       │
       └─ /[locale]/money/savings/[id]/early-withdraw
            └─ getSaving(id)
```

There are no separate Savings edit, maturity, or rollover pages in the route tree. Policy updates, settlement, renewal, early withdrawal, lifecycle detection, and inbox workflows are server actions or detail-page action surfaces in `savings-actions.ts`; they are not invoked by the initial GET list render.

The Savings layout is a read-only pass-through. The parent product layout is the shared auth/chrome boundary in `app/[locale]/(product)/layout.tsx:18-32`.

Relevant loading files exist for the list, detail, new, providers, and early-withdraw routes. They provide pending UI but do not add data-fetching boundaries.

## 3. Primary Savings Target

PRIMARY TARGET: `/{locale}/money/savings`

This is the list/hub route used to see total principal, interest summary, bank/platform groups, maturity state, provider, rate, and ownership badges. Its data source is `listSavings()` at `app/[locale]/(product)/money/savings/page.tsx:71-87`.

SECONDARY TARGETS:

1. `/{locale}/money/savings/[id]` — detail and action surface; contains the confirmed overlapping loader shape.
2. `/{locale}/money/savings/new` — creation form reference data and eligible accounts.
3. `/{locale}/money/savings/providers` — provider/package catalog.
4. `/{locale}/money/savings/[id]/early-withdraw` — detail-derived early-withdraw action route.

The investigation prioritizes the list route. Secondary routes were inspected enough to identify shared-loader overlap and conditional dependencies, not treated as equal optimization targets.

## 4. Server Component / Streaming Structure

The primary route is page-wide blocking for Savings content:

1. The parent product layout authenticates before rendering children.
2. The page resolves the cached current user and active membership.
3. Translations and `listSavings()` start in one `Promise.all` at `page.tsx:80-85`.
4. The page waits for the full list, builds the overview model, and then renders the summary and rows.

The route has no meaningful Suspense boundary around the Savings data. The only visible parent boundary is the footer navigation badge in `ProductNavigation`; it does not stream the Savings summary or rows. `loading.tsx` supplies the route transition skeleton but does not split the data dependency graph.

Consequences:

- Initial response start is materially earlier than Savings content visibility.
- The summary and all list sections are released together.
- There is no client fetch after hydration for the primary Savings data.

The current shape is intentionally simple and has not yet demonstrated that streaming would improve the measured critical path; streaming is a perceived-latency candidate, not a proven backend fix.

## 5. Remote Request Inventory

Representative warm authenticated primary-list load. Counts below are actual HTTP requests observed in the trace, not every logical function call. Request-local React cache collapses repeated logical calls.

|   # | Class     | Method / endpoint                | Source                                                      | Projection / filter                                                                                                     | Observed                                                                                                              |
| --: | --------- | -------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
|   1 | AUTH      | `GET /auth/v1/user`              | `getSessionUser()`; `getSessionMembership()` also starts it | Auth user                                                                                                               | One warm request; cached for the render. 20-sample direct median 201 ms, p95 504 ms.                                  |
|   2 | TENANCY   | `GET /rest/v1/household_members` | `resolveActiveMembership()`                                 | `id, household_id, role, user_id`; `user_id = current subject`, `is_active = true`                                      | One request; logical callers in the product gate and page reuse the cached result.                                    |
|   3 | OTHER     | `HEAD /rest/v1/inbox_items`      | `countUnreadOpenInboxItems()` from `ProductNavigation`      | Exact count; household, pending, unread, queue, assignee filters                                                        | One request in the footer Suspense branch; not Savings domain data.                                                   |
|   4 | SAVINGS   | `GET /rest/v1/savings`           | `listSavings()`; `list-savings.ts:67-148`                   | Household/order projection with account names, provider metadata, and `saving_cycles!saving_cycles_saving_id_fkey(...)` | One request; 30 savings rows and 31 embedded cycles in the representative fixture; body 99,244 bytes in direct fetch. |
|   5 | OWNERSHIP | `GET /rest/v1/household_members` | `listActiveMembershipIds()`; `list-savings.ts:87-93`        | `id`; household, `is_active = true`, `id IN (owner_membership_id values)`                                               | One request after Savings rows return; validates owner activity for ownership/capability presentation.                |

Auth claims are a logical verification span, not a separate warm remote request after the JWT is locally verifiable. The cold trace included two `GET /auth/v1/.well-known/jwks.json` requests; these are recorded separately in the cold/warm distinction below.

Primary-list request-local caching:

- `getSessionUser`, `getSessionMembership`, `resolveActiveMembership`, `createSupabaseServerClient`, `listSavings`, and the inbox count are React-request cached where applicable.
- The owner-membership query is not the same query as the current-user membership gate and is intentionally performed with an explicit Supabase client after Savings rows reveal owner IDs.

## 6. Dependency Graph

```text
request
  │
  ├─ proxy/session verification
  │    ├─ getClaims() ── cold: JWKS lookup; warm: local verification path
  │    └─ getUser() ── GET /auth/v1/user
  │
  └─ ProductLayout: requireProductSession()
       └─ resolveActiveMembership(user/subject)
            └─ GET /rest/v1/household_members [current user]
                 │
                 ├─ ProductNavigation (parallel)
                 │    └─ HEAD /rest/v1/inbox_items [badge only]
                 │
                 └─ SavingsPage (parallel with navigation badge)
                      └─ listSavings()
                           └─ GET /rest/v1/savings
                                ├─ accounts:name embed
                                ├─ provider metadata embed
                                └─ saving_cycles embed
                                     └─ local current-cycle selection
                                          └─ local accrued-interest calculation
                                               └─ local presentation model
                                                    │
                                                    └─ listActiveMembershipIds()
                                                         └─ GET /rest/v1/household_members [owner IDs]
```

There is no primary-list shape of `savings → saving IDs → saving_cycles`. The cycle data is nested in the same PostgREST request.

There is no primary-list shape of `savings → provider IDs → providers/rates`. Provider metadata is also nested in the same request. Package reads are conditional on detail/catalog behavior.

## 7. Dependency Waves

Trace-relative shape from one clean server trace; timings are illustrative for the trace, not the 10-load browser percentile table.

| Wave | Approx. trace interval | Requests                                                           | Blocker / consumer                                                 |
| ---: | ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
|    0 | 0–543 ms               | Auth user plus verified claims; current-user membership resolution | Required before the product page can authorize the Savings render. |
|    1 | 543–819 ms             | Savings embedded GET and inbox badge HEAD in parallel              | Savings raw data and footer badge.                                 |
|    2 | 819–1,053 ms           | Owner-membership validation GET                                    | Ownership/capability fields and final Savings model.               |

The exact clean trace recorded:

- `GET /auth/v1/user`: 417 ms span.
- Current membership resolution: 543 ms span.
- `GET /rest/v1/savings`: 276 ms.
- Inbox `HEAD`: 268 ms.
- Owner-membership validation: 234 ms.

The important critical-path fact is that the owner-membership query begins after Savings rows return. It is not a cycle or provider second wave; it is an ownership validation second wave.

## 8. Production-Like Baseline

Preparation:

- `npm run build` passed with Next.js 16.3.1 and all Savings routes present in the build output.
- Started `VINHA_PERF_TRACE=1 npm run start -- -p 3102`.
- Used a fresh authenticated browser session created through the existing login flow. No fixture setup or financial writes were run.
- Ran 10 direct navigations to `/en/money/savings` at a 440×900 viewport. Each run waited for `[data-testid="savings-list-content"]`; content timing is browser-visible HTML completion, not only server time.

Warm authenticated browser distribution:

| Metric                               |    Min | Median |    P75 |      P95 |      Max |
| ------------------------------------ | -----: | -----: | -----: | -------: | -------: |
| Document response start / TTFB proxy | 294 ms | 318 ms | 358 ms |   415 ms |   415 ms |
| Savings list content visible         | 836 ms | 871 ms | 971 ms | 1,557 ms | 1,557 ms |

The primary summary is part of the page-wide Savings content marker, so there is no separately streamed summary timing. The first useful Savings content is therefore represented by the list-content timing above.

Cold distinction:

- One clean post-restart load took 2,740 ms to list content because Auth verification included two JWKS fetches and the server was cold-ish.
- The same trace showed Auth/user and membership work before the Savings-plus-badge wave. JWKS was not present in the warm 5-request application-level count.

Slowest request in the clean trace was the initial current-membership resolution at 543 ms; in direct hosted samples, the Savings list had the widest tail (p95 669 ms, max 817 ms).

## 9. Auth / Membership

The product layout calls `requireProductSession()` before the child page. `getSessionMembership()` starts `getSessionUser()` and verified auth subject work, then resolves the active membership with the verified subject (`get-session-membership.ts:24-49`). Both the current user and active membership helpers are request-cached.

The list page repeats logical `getSessionUser()` and `resolveActiveMembership()` calls at `page.tsx:75-78`, but the trace showed one current-user membership HTTP request because the React cache is shared within the render.

Direct authenticated samples, 20 each:

| Endpoint                           | Median |    P75 |    P95 |    Max | Median bytes | Errors |
| ---------------------------------- | -----: | -----: | -----: | -----: | -----------: | -----: |
| `GET /auth/v1/user`                | 201 ms | 228 ms | 504 ms | 512 ms |        2,171 |      0 |
| Current-user active membership GET | 220 ms | 235 ms | 307 ms | 639 ms |          167 |      0 |

Verdict: Auth/tenancy is a material hosted-latency contributor, but the current request-local reuse is already correct. Do not optimize Auth architecture from this sample.

## 10. Savings Financial Contract

The list contract is read from the `savings` row, its product snapshot, its embedded cycle rows, joined account names, joined provider metadata, and owner membership state.

| Contract value                | Raw source                                                              | Mapper / formula                            | Initial UI consumer                                    |
| ----------------------------- | ----------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------ |
| Principal                     | Current cycle `principal`                                               | `mapSavingCycleRow`; selected current cycle | Overview total, row amount, detail amount.             |
| Currency                      | Cycle/product snapshot currency                                         | Snapshot fallback to `DEFAULT_CURRENCY`     | Currency formatter for amounts.                        |
| Deposit/start date            | Current cycle `start_date`                                              | Cycle mapper                                | Detail facts and progress.                             |
| Term/duration                 | Product or cycle snapshot term fields                                   | Snapshot mapping                            | Detail facts and package display.                      |
| Maturity date                 | Current cycle `end_date`                                                | `selectCurrentSavingCycle`, date formatter  | List maturity meta and detail progress.                |
| Annual interest rate          | Current cycle `locked_rate`                                             | Current-cycle selection                     | List rate label and detail facts.                      |
| Compounding/payment frequency | Package/product snapshot calculation fields                             | `computeAccruedInterest` method selection   | Derived interest only; not recomputed in the database. |
| Provider                      | Joined `saving_providers` metadata                                      | `mapSavingRow`                              | List/detail provider label and family.                 |
| Current cycle                 | Embedded cycle rows                                                     | `selectCurrentSavingCycle()`                | Primary list and detail current state.                 |
| Completed cycles              | Embedded cycle rows                                                     | Cycle mapper/history model                  | Detail cycle history. Not needed by the primary row.   |
| Accrued interest              | Principal, rate, dates, method                                          | `computeAccruedInterest()` for active cycle | Overview/detail interest output.                       |
| Maturity amount               | Principal, accrued interest, tax/fee inputs                             | `calculateSettlementBreakdown()`            | Overview/detail settlement values.                     |
| Early withdrawal inputs       | Product snapshot early-settlement rule and cycle fields                 | Detail model/action guards                  | Early-withdraw action UI.                              |
| Ownership                     | `financial_scope`, `owner_membership_id`, current/active membership IDs | `mapSavingRow` ownership mapping            | Ownership badge and mutation capability.               |
| Status                        | `savings.status`, cycle status, dates                                   | `deriveMaturityPresentationState()`         | List maturity state and detail action gates.           |
| Rollover/renewal              | Renewal policy/config and maturity instruction                          | `mapSavingRow`, detail action model         | Detail renewal controls and maturity-action state.     |

Raw inputs remain distinct from derived outputs. Active accrued interest is recomputed in TypeScript from the persisted contract; maturity presentation is derived from dates and cycle status without performing a lifecycle write (`savings-presentation.ts:80-113`). No optimization recommendation changes these formulas or semantics.

## 11. Savings List

Source: `modules/savings/application/queries/list-savings.ts:24-148`.

Current projection includes:

- Savings identity, household, status, account IDs, provider ID, product name/snapshot, renewal fields, maturity instruction, creation time, financial scope, and owner membership ID.
- Funding and settlement account names.
- Provider display name, provider key, and saving type.
- The full selected `saving_cycles` projection, including lifecycle lineage, transaction IDs, settlement result, renewal decision, and timestamps.

Filters/order:

- `household_id = gate.householdId`.
- `created_at DESC`.
- No explicit status filter; the application model separates active/history/settled presentation after the read.
- RLS remains active on the underlying tables.

Representative direct endpoint result:

- 30 Savings rows.
- 31 embedded cycles.
- 99,244 response body bytes as read by Node fetch.
- 20 samples: min 236 ms, median 282 ms, p75 307 ms, p95 669 ms, max 817 ms, zero errors.

The primary UI consumes the current cycle, provider/product label, rate, principal, maturity state/date, status, and ownership. It does not consume transaction activity or full cycle history. Current cycle selection and interest calculation happen locally after the response (`list-savings.ts:102-136` and `savings.selectors.ts:4-19`).

Verdict: functionally correct and already collapsed to one Savings domain request; moderate overall payload with high nested-cycle overfetch.

## 12. Saving Cycles

Primary list:

- Cycles are not fetched per saving.
- Cycles are not fetched in an ID-dependent second wave.
- The PostgREST projection embeds all selected cycles through `saving_cycles!saving_cycles_saving_id_fkey(...)`.
- The representative household had 31 cycles for 30 savings: 30 active and 1 rolled historical cycle; each saving had 1–2 cycles.
- The application sorts/selects the current active cycle, then matured, then newest fallback.

The current list only needs the current cycle for its first render. The current projection also carries historical and lifecycle fields needed by detail/history behavior. This is the main overfetch candidate, but the measured hosted list tail and financial-contract risk do not justify changing it as the first target.

Detail route:

- `getSaving(id)` loads the saving and then a separate all-cycles query (`list-savings.ts:150-218`).
- `listSavingCycles(id)` independently verifies the saving and loads the same cycle set (`list-savings.ts:232-300`).
- The detail page starts both functions in parallel at `app/[locale]/(product)/money/savings/[id]/page.tsx:128-133`.

This is a confirmed detail-route overlap, not a primary-list cycle N+1.

Representative direct cycle endpoint, 20 samples for one saving:

- 1 row, 1,023 median bytes.
- Min 202 ms, median 224 ms, p75 308 ms, p95 367 ms, max 409 ms, zero errors.

## 13. Providers / Reference Data

Primary list provider metadata is embedded in the Savings GET, so provider IDs do not trigger a provider fan-out for list rows.

Separate reference reads:

- `listProviderCatalog()` loads providers with embedded active packages for the provider-management route.
- `listProviders()` is a small provider-reference read used by the Savings application layer.
- `listProviderPackages(providerId)` is conditional for maturity-action checks and detail actions.

20-sample direct reference benchmarks:

| Read                               | Rows | Median bytes | Median |    P75 |    P95 |    Max | Errors |
| ---------------------------------- | ---: | -----------: | -----: | -----: | -----: | -----: | -----: |
| Active provider reference          |    2 |          578 | 211 ms | 215 ms | 221 ms | 227 ms |      0 |
| Provider packages for one provider |    7 |        4,479 | 213 ms | 236 ms | 279 ms | 303 ms |      0 |

Verdict: no confirmed duplicate provider read on the primary route. Do not add long-lived caching. The current conditional package read is a secondary-route concern.

## 14. Transaction Dependencies

The primary list does not read transactions, balances, or transaction summaries. Principal, accrued interest, tax, fee, and maturity presentation are derived from Savings and cycle data in TypeScript.

The detail route reads transaction activity only after it has a verified saving and cycle transaction IDs (`list-savings.ts:302-390`). It uses:

1. A Savings ownership check.
2. A seed transaction read by known transaction IDs.
3. A conditional transfer-group read to include the complete linked movement.

This exists to render funding, interest, tax, fee, settlement, and linked account activity in the detail UI. It is conditional and not part of the primary list critical path.

The representative transaction EXPLAIN used a read-only linked-ID shape. At the current tiny fixture it completed in 2.244 ms, touched 13 shared blocks, and returned no matching funding row. That plan is a representative control rather than a production detail trace; it does not indicate a primary-list bottleneck.

Verdict: no primary Savings transaction scan; no reason to build a transaction aggregate read model for the list.

## 15. Ownership / Capability

Ownership uses:

- `financial_scope` and `owner_membership_id` from the Savings row.
- Current active membership from `resolveActiveMembership()`.
- Active owner membership IDs from `listActiveMembershipIds()`.

`listActiveMembershipIds()` deliberately queries active memberships by the owner IDs discovered in the Savings rows (`list-active-membership-ids.ts:5-18`). This distinguishes the current user’s active household access from a Savings item owned by a former or inactive household member. The result feeds `mapSavingRow()` and therefore ownership badges and mutation capability.

The owner-membership read is a confirmed second wave on the primary route. It is not redundant with the current-user gate:

- The gate answers “is this session an active household member?”
- The second read answers “are the owner IDs attached to these Savings rows still active?”

The RLS source remains fail-closed: `savings_select_member` and `saving_cycles_select_member` require an active household membership predicate. No RLS policy or ownership rule was changed. A full second-household/anonymous runtime matrix was not run in this investigation.

20-sample direct owner-membership query:

- Median 201 ms, p75 203 ms, p95 237 ms, max 261 ms, 47 median bytes, zero errors.

## 16. Duplicate / Overlapping Reads

| Observation                                                          | Classification                 | Evidence                                                                                                                                                                   |
| -------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product gate and page both logically request current user/membership | NOT A DUPLICATE HTTP request   | React request cache; one Auth user and one current membership request observed.                                                                                            |
| Savings plus cycles on primary list                                  | NOT A DUPLICATE                | Cycles are embedded in the one Savings GET.                                                                                                                                |
| Savings plus provider metadata on primary list                       | NOT A DUPLICATE                | Provider metadata is embedded in the same projection.                                                                                                                      |
| Owner-membership validation after list                               | NECESSARY                      | Explicit owner-ID activity check; not the current-user membership query.                                                                                                   |
| Footer unread badge HEAD                                             | NECESSARY / CONDITIONAL        | Separate navigation consumer; Suspense branch and exact count.                                                                                                             |
| Detail `getSaving()` plus `listSavingCycles()`                       | CONFIRMED DUPLICATE / OVERLAP  | Both are started in parallel by the detail page and load overlapping saving/cycle state.                                                                                   |
| Detail financial-activity Savings check                              | CONDITIONAL                    | Ownership boundary before transactions; not on list route.                                                                                                                 |
| Browser RSC prefetches                                               | CONFIRMED CLIENT AMPLIFICATION | Four extra RSC request frames were observed after the list render: provider/detail prefetches. Server-domain Supabase amplification was not correlated in the clean trace. |
| Summary RPC plus Savings list                                        | NOT A DUPLICATE ON THIS ROUTE  | No Savings summary RPC is called by the primary page; an existing Home summary RPC was benchmarked only as a control.                                                      |

There is one confirmed server-side overlap worth future cleanup: the detail loader pair. It is not the first target because the requested primary surface is already using the one-wave embedded Savings read.

## 17. PostgreSQL Plans

Plans were run through the linked Supabase project using `EXPLAIN (ANALYZE, BUFFERS)` only. The exact SQL generated internally by the nested PostgREST projection was not exposed by the available read-only SQL interface, so the following are representative base-table/function plans, not a claim about an exact generated nested plan.

| Query                                         | Key plan                                                              | Planning | Execution | Buffers / result                                         |
| --------------------------------------------- | --------------------------------------------------------------------- | -------: | --------: | -------------------------------------------------------- |
| Representative Savings household query        | Bitmap heap scan using `idx_savings_household_status`, in-memory sort | 0.659 ms |  0.935 ms | 30 rows; 9 heap blocks; 18 shared hits in top plan.      |
| One saving’s cycles                           | Index scan using `idx_saving_cycles_saving`                           | 0.793 ms |  0.192 ms | 1 row; 31 shared hits.                                   |
| Active provider reference                     | Sequential scan of 2 active provider rows plus in-memory sort         | 0.394 ms |  0.157 ms | 4 shared hits.                                           |
| Existing `get_home_savings_summary()` control | Function scan                                                         | 0.020 ms |  2.226 ms | 1 row; 365 shared hits. Not called by Savings list.      |
| Representative transaction linked-ID shape    | Small semi hash join; tiny-table sequential scans                     | 4.492 ms |  2.244 ms | 13 shared hits; no matching funding row in this fixture. |

Relevant indexes include `idx_savings_household_status`, `idx_saving_cycles_saving`, partial maturity indexes, and transaction household/transfer-group indexes. At the current cardinality, PostgreSQL is not materially slow. Hosted request wall time is roughly two orders of magnitude larger than database execution time in the representative plans.

## 18. Direct Endpoint Benchmarks

Authenticated, sequential, 20 samples per endpoint. Percentiles use nearest-rank selection. IDs and personal values are intentionally omitted.

| Endpoint/read                            | Rows | Median bytes |    Min | Median |    P75 |    P95 |    Max | Errors |
| ---------------------------------------- | ---: | -----------: | -----: | -----: | -----: | -----: | -----: | -----: |
| Savings list GET                         |   30 |       99,244 | 236 ms | 282 ms | 307 ms | 669 ms | 817 ms |      0 |
| Saving cycles GET, representative saving |    1 |        1,023 | 202 ms | 224 ms | 308 ms | 367 ms | 409 ms |      0 |
| Active provider reference GET            |    2 |          578 | 199 ms | 211 ms | 215 ms | 221 ms | 227 ms |      0 |
| Provider packages GET                    |    7 |        4,479 | 201 ms | 213 ms | 236 ms | 279 ms | 303 ms |      0 |
| Owner-membership GET                     |    1 |           47 | 195 ms | 201 ms | 203 ms | 237 ms | 261 ms |      0 |
| Existing summary RPC control             |    1 |          135 | 201 ms | 211 ms | 225 ms | 271 ms | 365 ms |      0 |

The summary RPC is not part of the primary Savings route. The list endpoint is the widest-tail Savings-specific read, but its current one-request shape is already preferable to the historical separate parent/cycle waterfall.

## 19. Payload / Overfetch

| Read                |                          Rows |                      Payload | Initial UI use                                                                        | Classification                                        |
| ------------------- | ----------------------------: | ---------------------------: | ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Primary Savings GET | 30 parent rows plus 31 cycles |                 99,244 bytes | Provider/product, current principal/rate/dates, status, ownership, summary derivation | MODERATE overall; high relative to the simple row UI. |
| Nested cycle fields |                       31 rows | Included in the 99,244 bytes | Current cycle fields for list; full lifecycle/history fields mainly for detail        | HIGH nested overfetch candidate.                      |
| Provider reference  |                             2 |                    578 bytes | Catalog/reference route                                                               | LOW.                                                  |
| Provider packages   |                             7 |                  4,479 bytes | Conditional detail/catalog action data                                                | MODERATE for a conditional read; not on primary list. |
| Owner membership    |                             1 |                     47 bytes | Ownership/capability                                                                  | LOW.                                                  |

The list projection includes detail/lifecycle fields such as transaction IDs, settlement result, renewal decision, lineage IDs, and timestamps. They are not removed in this diagnostic pass because the same application query also owns maturity-action enrichment and because a narrower projection would need raw/final equivalence tests for every list state.

The list does not overfetch transactions or a separate summary RPC.

## 20. Client / Post-Hydration Requests

The primary Savings list is server-rendered. No `useEffect`, React Query, SWR, client REST fetch, or `router.refresh()` is used for the initial list data.

Browser observation after the initial page render:

- 4 additional RSC request frames were observed.
- They represented provider/detail link prefetch activity, including repeated provider/detail frames in the browser request log.
- No corresponding extra Savings-domain Supabase request was visible in the clean server trace, so the server-side amplification from those frames is inconclusive.

The behavior is therefore classified as client-side prefetch amplification with unknown server-domain cost. It is not a reason to disable prefetch globally without a route-level measurement showing user-visible harm.

## 21. Root-Cause Classification

| Priority | Cause                                    | Classification                                      | Evidence                                                                                            |
| -------- | ---------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| —        | PostgreSQL execution                     | NOT A PROBLEM                                       | Base plans 0.157–2.244 ms at current cardinality; hosted reads are about 200–300 ms median.         |
| —        | Cycle N+1 / ID-dependent cycle wave      | NOT A PROBLEM on primary list                       | Cycles are embedded; 31 cycles came back with 30 Savings rows in one GET.                           |
| —        | Provider fan-out on primary list         | NOT A PROBLEM                                       | Provider metadata is embedded; separate package reads are conditional.                              |
| —        | Primary-list transaction scan            | NOT A PROBLEM                                       | No transactions are read by the list.                                                               |
| P1       | Auth and current membership hosted floor | CONFIRMED CONTRIBUTOR                               | Direct medians 201/220 ms; clean trace gate about 543 ms; cold JWKS adds two requests.              |
| P1       | Page-wide blocking after response start  | CONFIRMED PERCEIVED-LATENCY CONTRIBUTOR             | TTFB median 318 ms vs list-content median 871 ms; no body Suspense boundary.                        |
| P2       | Owner-membership second wave             | CONFIRMED, PROBABLY NECESSARY                       | Starts after list response; direct median 201 ms; changing it risks owner/former-owner semantics.   |
| P2       | List nested cycle overfetch              | CONFIRMED                                           | 31 cycles and full lifecycle fields for a row UI; gain from narrowing is not yet measured.          |
| P2       | Detail loader overlap                    | CONFIRMED                                           | `getSaving()` and `listSavingCycles()` overlap on the detail route.                                 |
| P2       | RSC Link prefetch amplification          | CONFIRMED client behavior, server cost INCONCLUSIVE | Four extra RSC frames; no correlated extra Supabase trace in the clean sample.                      |
| P2       | Network variance / hosted tail           | CONFIRMED                                           | Savings direct p95 669 ms/max 817 ms; browser content p95 1,557 ms.                                 |
| P0       | Data loss, security, or RLS defect       | NOT OBSERVED                                        | No writes or policy changes; authenticated reads remained scoped; full multi-tenant matrix not run. |

Primary root cause: the route spends its budget on Auth/tenancy and hosted Supabase round trips, then releases a page-wide Server Component result; it is not spending the budget on PostgreSQL or a cycle fan-out.

## 22. Ranked Optimization Candidates

No candidate is implemented.

| Rank | Candidate                                                                  | Expected critical-path gain                               | Confidence            | Financial risk | RLS/privacy risk | Complexity | Decision                                                                                 |
| ---: | -------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------- | -------------- | ---------------- | ---------- | ---------------------------------------------------------------------------------------- |
|    1 | Stop; preserve the current list read                                       | Avoids speculative regression                             | High                  | None           | None             | None       | Recommended now. The current shape already removed the historical cycle waterfall.       |
|    2 | Re-measure and, only with a proof, reshape owner-membership validation     | Potentially one hosted request or less critical-path wait | Low/medium            | Medium         | Medium/high      | Medium     | Future investigation only; cannot safely remove the check from current evidence.         |
|    3 | Share one detail read model between `getSaving()` and `listSavingCycles()` | Removes overlapping detail reads                          | High for detail route | Low/medium     | Medium           | Low/medium | Good follow-up, but not the primary list target requested here.                          |
|    4 | Narrow or defer historical cycle fields on the list projection             | Reduces the 99 KB list payload                            | Medium                | Medium         | Medium           | Medium     | Requires raw/final equivalence and detail regression tests; no measured latency win yet. |
|    5 | Add body-level Suspense/streaming boundaries                               | Could improve perceived first content                     | Medium                | Low            | Low              | Medium     | Does not remove the Auth/hosted floor; benchmark user-visible benefit first.             |
|    6 | Disable or narrow Savings link prefetch                                    | Could reduce RSC request amplification                    | Low/inconclusive      | Low            | Low              | Low        | Only after correlating prefetch to server cost and navigation benefit.                   |

## 23. Recommended First Implementation

FIRST TARGET: **No implementation. Stop at the current measured Savings list shape.**

CURRENT SHAPE:

- Warm primary load: 5 application-level Auth/Supabase requests.
- 3 dependency waves: session/tenancy → Savings plus inbox badge → owner validation.
- Savings domain: one embedded GET, 30 rows/31 cycles, direct median 282 ms.
- Browser: content median 871 ms, p95 1,557 ms.

TARGET SHAPE:

- Preserve the same 5-request, 3-wave shape.
- Do not remove the owner-membership validation without a fixture that proves former-owner semantics remain unchanged.
- Do not replace the current list read with a broad RPC, client REST loading, long-lived cache, or speculative index.

WHY:

The largest measurable costs are hosted/Auth latency and variance. PostgreSQL is fast, the old parent→cycle waterfall is already gone, provider data is not fanning out, and transactions are absent from the list. Reducing bytes or one conditional read without proving a critical-path improvement would be speculative and could change financial ownership behavior.

EXPECTED RISK: LOW — because no implementation is made.

If a future implementation is required, the first re-entry point should be a narrowly scoped detail-loader deduplication or a measured owner-membership experiment, selected only after raw/final equivalence and RLS/ownership tests are available.

## 24. Raw Evidence

### Commands and environment

- `npm run build` — passed; Savings list, detail, new, providers, and early-withdraw routes compiled.
- `VINHA_PERF_TRACE=1 npm run start -- -p 3102` — used for one clean request trace.
- Browser baseline — 10 authenticated direct navigations at 440×900 with a fresh session; no financial fixture writes.
- Direct endpoint benchmark — 20 authenticated sequential samples per read; zero errors for all reported endpoints.
- Supabase SQL — read-only `EXPLAIN (ANALYZE, BUFFERS)` through project `family-finances-2`; no DDL, DML, migration, RPC mutation, or policy change.

### Clean trace request shape

```text
AUTH GET /auth/v1/user                         417 ms span
TENANCY GET /rest/v1/household_members        543 ms span
PARALLEL HEAD /rest/v1/inbox_items             268 ms
PARALLEL GET /rest/v1/savings                   276 ms
SERIAL OWNER GET /rest/v1/household_members    234 ms
```

The trace also showed two cold JWKS fetches during Auth verification. Warm application-level count excludes those cold verification fetches.

### Direct benchmark summary

```text
Savings list:       min 236 / median 282 / p75 307 / p95 669 / max 817 ms; 99,244 bytes; 30 rows
Saving cycles:      min 202 / median 224 / p75 308 / p95 367 / max 409 ms; 1,023 bytes; 1 row
Provider reference: min 199 / median 211 / p75 215 / p95 221 / max 227 ms; 578 bytes; 2 rows
Provider packages:  min 201 / median 213 / p75 236 / p95 279 / max 303 ms; 4,479 bytes; 7 rows
Owner membership:   min 195 / median 201 / p75 203 / p95 237 / max 261 ms; 47 bytes; 1 row
Summary RPC control: min 201 / median 211 / p75 225 / p95 271 / max 365 ms; 135 bytes; 1 row
```

### Browser baseline summary

```text
Response start:     min 294 / median 318 / p75 358 / p95 415 / max 415 ms
Savings content:    min 836 / median 871 / p75 971 / p95 1,557 / max 1,557 ms
```

### Schema and safety observations

- `savings` and `saving_cycles` RLS remain enabled.
- Active-member policies were inspected for both tables.
- Existing indexes cover household Savings ordering, saving-cycle lookup, maturity lookup, and transaction household/transfer-group access.
- No service-role browser/runtime read was used.
- No principal, interest, maturity, compounding, rollover, provider, ownership, or RLS behavior was changed.

### Limitations

- The exact SQL plan produced inside PostgREST for the nested Savings projection was not exposed by the available read-only SQL path; representative base-table plans were captured instead.
- The authenticated sample used one existing household fixture with 30 Savings rows. A second-household/anonymous runtime RLS matrix was not run because no disposable cross-tenant fixture was created.
- Browser timing measures content visibility in a real browser and includes server/network/browser scheduling; direct endpoint timing isolates hosted endpoint wall time more closely.

### Final state

Production changes: NONE  
Financial data mutations: NONE  
Optimization implementation: NONE
