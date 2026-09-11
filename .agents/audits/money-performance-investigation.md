# MONEY Performance Investigation

Date: 2026-09-11
Scope: authenticated MONEY hub and the primary Transactions list path
Mode: diagnostic only; no production code, schema, configuration, or financial data changed
Status: **PARTIAL** — application/request-path evidence is complete; fresh live `EXPLAIN (ANALYZE, BUFFERS)` for every current query was not rerun because this workstation has no `psql`/local Postgres and hosted PostgREST plan media is disabled. Existing same-migration SQL plans are included and clearly marked as prior evidence.

## 1. Executive summary

The current MONEY hub is a server-rendered Next.js route backed by a shared authenticated product layout. On a production build served locally against the hosted Supabase project, the authenticated `/en/money` document had:

| Measure                                                            |                                Result |
| ------------------------------------------------------------------ | ------------------------------------: |
| Browser document response-start median, 10 loads                   |                                249 ms |
| Browser document response-start median, warm loads excluding first |                                241 ms |
| MONEY content-complete median, 10 loads                            |                                880 ms |
| MONEY content-complete median, warm loads excluding first          |                                867 ms |
| MONEY content-complete p95, 10 loads                               |                              2,764 ms |
| Server-side Supabase/Auth HTTP fetches, warm page                  |                                    13 |
| Cold first-run extra                                               | one JWKS fetch, when not already warm |

The main confirmed bottleneck is the request graph: an authentication/membership gate precedes a broad MONEY page wave, and credit-card settings/billing data form a dependent second wave. In the clean server trace, the auth/membership gate took 683 ms and the page data critical path completed 725 ms after the page wave started. These are remote request spans and should not be added as if every request were sequential; they identify the two critical phases.

The strongest current application findings are:

1. MONEY is a page-wide server render. The route loading shell appears before content, but the position, account scan, and full hub markers appear together. No independent MONEY section streams today.
2. `listCreditCards()` duplicates a household projection already fetched by `getHomeHouseholdContext()` and adds a dependent settings/months wave.
3. `listInvestmentHomeSummary()` has the largest measured Supabase payload: 28,002 bytes for 20 active holdings. The current implementation intentionally returns raw valuation inputs and resolves financial semantics in TypeScript; this is a payload/transport candidate, not proof that SQL is slow.
4. Transactions is a separate route with a wide 50-row lookahead query. Its current direct Supabase response is 20,291 bytes. Visible transaction detail links do not opt out of Next prefetch, and browser evidence shows post-hydration RSC requests accumulating to 15 requests on repeated loads.
5. Existing SQL evidence for the current account and investment read-model functions is single-digit to low-double-digit milliseconds. The available evidence does not justify indexes or a broad SQL rewrite as the first action.

The first optimization to consider after this diagnostic is one narrow, reversible MONEY hub change: remove the duplicate household read from the credit-card loader by passing the already-loaded household context or currency through an existing request-local application boundary, then remeasure the same route. Do not implement that change from this report alone; the present task was explicitly diagnostic-only.

## 2. Scope and non-goals

Included:

- `/[locale]/money`, rendered as `/en/money` in the browser run.
- Shared authenticated product layout and navigation badge work inherited by MONEY.
- MONEY application reads: position, credit cards, savings, debts, loans, investments, and unread inbox badge.
- `/[locale]/money/transactions` as the primary list path and its visible-link prefetch behavior.
- Hosted Supabase request timings, response bytes, current representative-household cardinality, existing migration/index evidence, and browser navigation timing.

Not included:

- Financial mutation flows, forms, Server Actions, or data correction.
- Detail-page optimization for every account/card/debt/loan/investment/transaction route.
- Region migration, Vercel deployment changes, Supabase schema changes, index creation, cache policy changes, or client data-layer redesign.
- A claim that current small-table PostgreSQL timings predict behavior at large household cardinality.

## 3. Safety and method

Read-only controls used:

- `npm run build` completed successfully with Next 16.3.1 and TypeScript checks.
- `npm run start -- -p 3101` served the production build with `VINHA_PERF_TRACE=1`.
- Existing E2E credentials from `.env.local` were used only to obtain an authenticated read session.
- Browser navigation used Playwright Chromium at 440×900.
- Direct Supabase benchmarks used authenticated bearer requests and only `GET`, `HEAD`, and RPC reads.
- No fixture setup was run because the repository fixture setup can create financial data.
- No INSERT, UPDATE, DELETE, migration, Auth configuration, RLS policy, or schema operation was performed.

The server trace logs pathnames, status, start offsets, and durations only. It does not log tokens, request bodies, or row data. The report intentionally omits household IDs and financial values.

## 4. Route surface and route map

The MONEY surface is a Next.js App Router tree under `app/[locale]/(product)/money`.

| Surface      | Route shape                                                                                                                   | Primary responsibility                       |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| MONEY hub    | `/[locale]/money`                                                                                                             | Position, account scan, and module summaries |
| Accounts     | `/[locale]/money/accounts`, `/accounts/[id]`                                                                                  | Account list/detail and credit-card detail   |
| Cards        | `/[locale]/money/cards`, `/cards/[id]`                                                                                        | Card-facing list/detail surfaces             |
| Savings      | `/[locale]/money/savings`, `/savings/[id]`, `/savings/new`, `/savings/providers`, `/savings/[id]/early-withdraw`              | Savings reads and guided actions             |
| Investments  | `/[locale]/money/investments`, `/investments/[id]`, `/investments/new`, `/investments/convert`, operation/valuation subroutes | Portfolio and investment operations          |
| Loans        | `/[locale]/money/loans`, `/loans/[id]`, `/loans/[id]/schedule`                                                                | Loan summary/detail/schedule                 |
| Debts        | `/[locale]/money/debts`, `/debts/[id]`                                                                                        | Liability list/detail/payment history        |
| Transactions | `/[locale]/money/transactions`, `/transactions/[id]`, `/transactions/tags`, create/edit/correct/refund subroutes              | Transaction event list and detail flows      |

The build generated all of these route families successfully. The requested performance target is the hub at a centered 440 px shell; the browser run used that target width.

## 5. Module boundaries

The hub page is intentionally an application composition point, not a financial rules engine:

- `modules/ledger/application/queries/get-real-position.ts` loads the account/ledger raw-input RPC and maps balances with existing application logic.
- `modules/ledger/application/queries/list-credit-cards.ts` loads card accounts, settings, and open billing months.
- `modules/savings/application` supplies the one-row savings summary RPC.
- `modules/ledger/application/queries/debt-queries.ts` supplies liabilities.
- `modules/ledger/application/queries/list-money-products.ts` supplies loan summaries.
- `modules/investments/application/queries/investment-queries.ts` loads raw investment inputs and resolves valuation semantics in the existing TypeScript resolver.
- `modules/inbox/application/queries/review-items.ts` supplies the shared unread-open badge count.

The route composes these read models in `Promise.all` and renders a server component. There are no client-side Supabase reads for this path and no React Query `useQuery` call site involved in the hub.

## 6. Current request graph

The shared product layout runs `requireProductSession()` before rendering children. The page itself repeats user/membership guards, but React request-local `cache()` prevents duplicate remote reads in the same render.

```text
browser document navigation
  ├─ middleware/proxy: auth.getClaims()
  │    └─ JWKS fetch only on a cold auth-key path; warm calls are local verification
  └─ product layout: requireProductSession()
       ├─ auth.getUser() -> GET /auth/v1/user
       ├─ auth.getClaims() -> logical span; normally no extra HTTP after JWKS warm-up
       └─ resolveActiveMembership() -> GET /rest/v1/household_members
            └─ MONEY hub Promise.all
                 ├─ account ledger raw-input RPC
                 ├─ household context GET
                 ├─ credit-card household GET + card-account GET
                 ├─ savings summary RPC
                 ├─ liabilities GET
                 ├─ loans GET
                 ├─ investment raw-input RPC
                 └─ Suspense footer: unread inbox HEAD
                      └─ after credit-card account IDs: settings GET + billing-months GET
```

The route is authenticated RSC/HTML, not a public API route. The browser sees the document/RSC navigation; Supabase calls execute on the server.

## 7. Clean server trace

Trace source: one authenticated `/en/money` request after restarting the production server, with the first auth/network path not fully warmed.

| Start offset relative to trace process | Operation             | Method | Path                                              | Status | Duration |
| -------------------------------------: | --------------------- | ------ | ------------------------------------------------- | -----: | -------: |
|                                198,653 | auth claims           | —      | —                                                 |      — |     3 ms |
|                                198,663 | auth claims           | —      | —                                                 |      — |    13 ms |
|                                198,663 | Auth user             | GET    | `/auth/v1/user`                                   |    200 |   613 ms |
|                                198,676 | Membership            | GET    | `/rest/v1/household_members`                      |    200 |   682 ms |
|                                199,364 | Account position      | POST   | `/rest/v1/rpc/get_home_account_ledger_raw_inputs` |    200 |   395 ms |
|                                199,364 | Household context     | GET    | `/rest/v1/households`                             |    200 |   282 ms |
|                                199,365 | Card account list     | GET    | `/rest/v1/accounts`                               |    200 |   507 ms |
|                                199,366 | Savings summary       | POST   | `/rest/v1/rpc/get_home_savings_summary`           |    200 |   558 ms |
|                                199,369 | Debt list             | GET    | `/rest/v1/liabilities`                            |    200 |   506 ms |
|                                199,370 | Loan summaries        | GET    | `/rest/v1/loans`                                  |    200 |   433 ms |
|                                199,371 | Investment raw inputs | POST   | `/rest/v1/rpc/get_home_investment_raw_inputs`     |    200 |   459 ms |
|                                199,373 | Card currency         | GET    | `/rest/v1/households`                             |    200 |   452 ms |
|                                199,375 | Unread badge          | HEAD   | `/rest/v1/inbox_items`                            |    200 |   675 ms |
|                                199,874 | Card settings         | GET    | `/rest/v1/credit_card_settings`                   |    200 |   215 ms |
|                                199,874 | Billing months        | GET    | `/rest/v1/card_billing_months`                    |    200 |   214 ms |

Interpretation:

- The first page wave starts roughly 5 ms after the membership gate completes in this trace.
- The card settings/months wave begins after the card-account request returns, adding a dependent phase.
- The page-side critical fetch path from the first page wave start to the final card response is about 725 ms in this trace.
- Warm traces measured during the 10-load browser batch were generally lower, but still showed the same dependency shape.
- A warm page contains 13 Supabase/Auth HTTP fetches: user, membership, nine page/inbox reads, and two card follow-up reads. The two `auth.getClaims` entries are logical spans, not two additional warm HTTP fetches.

## 8. Authentication and session cost

Authentication is separated from domain reads in both code and trace:

- `app/[locale]/(product)/layout.tsx:18-20` awaits `requireProductSession()` before the child page.
- `getSessionMembership()` starts `getSessionUser()` and verified claims work together, then resolves active membership after the verified subject is available.
- The clean trace measured `GET /auth/v1/user` at 613 ms and the membership lookup at 682 ms in the cold-ish run.
- The direct 20-sample benchmark measured `GET /auth/v1/user` at a 203.0 ms median, 240.7 ms p95, 2,169 bytes, HTTP 200.
- The direct 20-sample membership lookup measured a 203.5 ms median, 234.3 ms p95, 167 bytes, HTTP 200.
- The proxy uses `getClaims()`; after the JWKS is available, the logical claims span is local and does not appear as a repeated Auth API request.

Conclusion: Auth/session is a confirmed critical phase and must be included in any before/after benchmark, but the evidence does not justify changing Auth semantics or removing the membership gate. The first safe target remains request-shape reduction after the gate.

## 9. MONEY hub server composition

`app/[locale]/(product)/money/page.tsx:81-100` starts translations plus six domain read-models in one `Promise.all` after the manual guard:

```text
getTranslations(money)
getTranslations(catalog)
getRealPosition()
listCreditCards()
getSavingsHomeSummary()
listDebts()
listLoanSummaries()
listInvestmentHomeSummary()
```

Within that composition:

- Account position is already one RPC wave for ledger raw inputs, with household context in parallel.
- Savings is already one summary RPC.
- Investment is already one raw-input RPC, but returns a wide flat payload.
- Credit cards are two waves: card account IDs first, then settings and billing months.
- Debts and loans are one table read each at current cardinality.
- The unread inbox count is under the footer Suspense boundary and is independently started after the layout session gate.

The route is not executing the old unbounded account transaction scan on this path; the current account ledger RPC is active.

## 10. Browser baseline: MONEY hub

Protocol: production build, local Next server on port 3101, hosted Supabase, existing authenticated read session, Chromium, 440×900, 10 consecutive navigations to `/en/money`.

| Run | Response start | Loading marker | Full hub marker |
| --: | -------------: | -------------: | --------------: |
|   1 |       1,818 ms |       1,845 ms |        2,764 ms |
|   2 |         581 ms |         629 ms |        1,157 ms |
|   3 |         235 ms |         270 ms |          821 ms |
|   4 |         235 ms |         303 ms |          800 ms |
|   5 |         235 ms |         271 ms |          892 ms |
|   6 |         620 ms |         650 ms |        1,185 ms |
|   7 |         229 ms |         264 ms |          789 ms |
|   8 |         257 ms |         300 ms |          867 ms |
|   9 |         331 ms |         367 ms |          904 ms |
|  10 |         241 ms |         269 ms |          819 ms |

Summary:

- All 10 navigations rendered the hub markers successfully.
- Response-start median: 249 ms; warm-only median excluding run 1: 241 ms.
- Full hub median: 880 ms; warm-only median excluding run 1: 867 ms.
- Full hub p75: 1,157 ms; p95: 2,764 ms.
- The response-start value is a browser document timing proxy, not an isolated server-only TTFB.
- The first run includes server/auth warm-up and is retained rather than hidden.

## 11. Loading, streaming, and lazy-rendering behavior

Observed behavior at 440×900:

- `money/loading.tsx` renders an initial page-wide loading shell.
- The loading marker appears shortly after navigation commit.
- `money-real-position-summary`, `money-accounts-scan`, and `money-hub` all appeared at the same polling timestamp on every measured load.
- There is no route-local Suspense boundary around position, accounts, savings, investments, loans, debts, or cards.
- The product layout has a Suspense boundary only around the footer navigation/inbox badge.

Therefore MONEY has an initial shell, but not useful independent section streaming. The page's content completion is governed by the slowest required page read, not by a progressively streamed set of independent MONEY sections.

This is a confirmed rendering-shape finding, not a recommendation to stream every card. Any future boundary would need to preserve financial meaning, loading/error semantics, and mobile layout stability.

## 12. MONEY query inventory and waves

| Family                 | Current operation                    | HTTP calls | Wave                | Measured bytes / result                                   |
| ---------------------- | ------------------------------------ | ---------: | ------------------- | --------------------------------------------------------- |
| Auth                   | user + membership                    |          2 | pre-page gate       | 2,169 user bytes; 167 membership bytes                    |
| Position               | `get_home_account_ledger_raw_inputs` |          1 | page wave           | 1,934 bytes; median 206.9 ms in prior 20-sample run       |
| Household context      | `households` projection              |          1 | page wave           | 25 bytes for currency-only probe; hub projection is wider |
| Credit-card discovery  | `households` + `accounts`            |          2 | page wave           | 25/283 bytes in direct probes                             |
| Credit-card completion | settings + open billing months       |          2 | dependent card wave | 528/651 bytes; current code starts both in parallel       |
| Savings                | `get_home_savings_summary`           |          1 | page wave           | 135 bytes; median 210.4 ms in prior 20-sample run         |
| Debts                  | `liabilities` projection             |          1 | page wave           | 2 bytes for the current empty result                      |
| Loans                  | `loans` projection                   |          1 | page wave           | 2 bytes for the current empty result                      |
| Investments            | `get_home_investment_raw_inputs`     |          1 | page wave           | 28,002 bytes; median 345.7 ms, p95 1,145.8 ms             |
| Footer badge           | `inbox_items` count HEAD             |          1 | layout Suspense     | 0 body bytes; median 306.8 ms, p95 452.3 ms               |

The clean trace contains 13 warm HTTP fetches including auth and the footer. The logical page-data set is 11 reads because the card family has four HTTP reads and the two household projections are distinct requests.

## 13. Duplicate and overlapping fetches

| Finding                                     | Evidence                                                                                                                      | Classification                                                          |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Two `households` reads in one MONEY request | Clean trace shows two GETs with the same route; `getHomeHouseholdContext()` and `listCreditCards()` have separate projections | **Confirmed duplicate/overlap**                                         |
| Manual page auth guards after layout gate   | Page calls `getSessionUser()` and `resolveActiveMembership()` again, but React `cache()` makes these request-local hits       | **Confirmed no extra remote request**                                   |
| Two card follow-up reads                    | `listCreditCards()` starts settings and months with `Promise.all` after account IDs are known                                 | **Confirmed dependency; not duplicate**                                 |
| Footer inbox badge                          | Layout owns a shared count used by navigation                                                                                 | **Confirmed cross-product shared read; not MONEY-specific duplication** |
| Investment raw-input width                  | One RPC returns all resolver inputs per active holding                                                                        | **Confirmed payload tradeoff; not duplicate**                           |

The first actionable duplication is the household projection. It is small in bytes but costs another hosted Supabase boundary and is on the MONEY page critical path.

## 14. Current representative-household cardinality

Read-only `Prefer: count=exact` probes for the authenticated household returned:

| Table                   | Rows |
| ----------------------- | ---: |
| `accounts`              |   11 |
| `transactions`          |   30 |
| `investment_holdings`   |   20 |
| `investment_valuations` |   14 |
| `savings`               |   30 |
| `liabilities`           |    0 |
| `loans`                 |    0 |
| `card_billing_months`   |    3 |
| `transaction_tags`      |    4 |
| `inbox_items`           |   13 |

These are current fixture cardinalities, not a scale model. They explain why existing SQL plans are fast and why transport boundaries dominate this run.

## 15. Direct response-size and endpoint benchmark

Corrected read-only direct benchmark: 10 sequential samples per endpoint against the same authenticated representative household. The earlier 20-sample run covered the principal RPC/auth probes; the corrected 10-sample run covers exact current query shapes for the previously malformed probes.

| Endpoint family                | Samples |   Median |      P75 |        P95 |  Bytes | Status |
| ------------------------------ | ------: | -------: | -------: | ---------: | -----: | -----: |
| Auth user                      |      20 | 203.0 ms | 205.1 ms |   240.7 ms |  2,169 |    200 |
| Membership                     |      20 | 203.5 ms | 209.5 ms |   234.3 ms |    167 |    200 |
| Account ledger RPC             |      20 | 206.9 ms | 210.1 ms |   276.2 ms |  1,934 |    200 |
| Investment raw-input RPC       |      20 | 345.7 ms | 506.2 ms | 1,145.8 ms | 28,002 |    200 |
| Savings summary RPC            |      20 | 210.4 ms | 214.5 ms |   294.5 ms |    135 |    200 |
| Household currency             |      10 | 211.1 ms | 223.2 ms |   496.8 ms |     25 |    200 |
| Card accounts                  |      10 | 195.8 ms | 197.9 ms |   271.7 ms |    283 |    200 |
| Card settings                  |      10 | 195.9 ms | 200.1 ms |   267.8 ms |    528 |    200 |
| Open card billing months       |      10 | 195.1 ms | 195.5 ms |   275.4 ms |    651 |    200 |
| Debts                          |      10 | 199.4 ms | 204.5 ms |   267.3 ms |      2 |    200 |
| Loans                          |      20 | 198.4 ms | 206.7 ms |   268.8 ms |      2 |    200 |
| Inbox count HEAD               |      20 | 306.8 ms | 355.4 ms |   452.3 ms |      0 |    200 |
| Transactions, 50-row lookahead |      10 | 211.3 ms | 271.8 ms |   500.0 ms | 20,291 |    200 |
| Transaction tags               |      10 | 194.0 ms | 197.5 ms |   272.6 ms |    505 |    200 |

The investment result is the largest MONEY response and has the highest direct p95 in this run. That is a strong follow-up candidate only after confirming whether the client actually needs all fields and whether the current raw-input contract can be narrowed safely.

## 16. Transactions path

`app/[locale]/(product)/money/transactions/page.tsx:96-107` starts translations, `listTransactionEvents()`, and `listTransactionTags()` in parallel after the auth guard.

The transaction event query:

- selects 20 scalar transaction fields;
- embeds account, category, jar, and transaction-tag relations;
- orders by `transaction_date`, `created_at`, and `id` descending;
- requests the page size of 25 but intentionally fetches a 50-row lookahead for activity grouping;
- supports type filters, tag filters, and a three-part cursor predicate;
- performs no count query.

The direct current query response is 20,291 bytes at the 50-row limit. The route's browser full-content marker median across 10 runs was approximately 493 ms. That route is not the MONEY hub baseline, but it is the main list path for later detail and prefetch work.

## 17. Client hydration and prefetch evidence

The MONEY hub links already use `PRODUCT_LINK_PREFETCH = false` for the main module/navigation links. No post-hydration direct Supabase read was observed for the hub; its reads are server-side.

Transactions differs:

- `transaction-list-item.tsx:39-56` renders `Link` without `prefetch={PRODUCT_LINK_PREFETCH}`.
- The filter bar's tag-management link also uses the default link behavior.
- During 10 authenticated `/en/money/transactions` navigations, the document request itself remained one request, but post-hydration RSC requests accumulated to 15 on steady-state runs. The observed extra paths included the tag-management route and visible transaction detail routes.

This is confirmed client-side request amplification after hydration, not evidence that the initial Transactions server query is making 15 Supabase calls. It should be measured separately from the initial document load and fixed, if desired, by reusing the existing shared prefetch constant at the link boundary.

## 18. SQL plans and database evidence

### Fresh capture attempted in this pass

- `psql` is not installed.
- No local Supabase/Postgres stack is running.
- Hosted PostgREST plan negotiation with `Accept: application/vnd.pgrst.plan` returned `PGRST107` because the hosted endpoint does not expose that media type in this project.
- No helper function, migration, or schema object was created to work around this limitation.

### Existing same-migration plan evidence

The repository contains prior read-only plan captures for the current RPC migrations:

| Query                                      | Planning | Execution | Shared-hit evidence | Source                                                      |
| ------------------------------------------ | -------: | --------: | ------------------: | ----------------------------------------------------------- |
| `get_home_account_ledger_raw_inputs()`     | 0.034 ms |  7.425 ms |        1,362 blocks | `.agents/audits/home-account-ledger-one-wave-read-model.md` |
| `get_home_investment_raw_inputs()` wrapper | 0.011 ms | 12.798 ms |        1,913 blocks | `.agents/audits/home-investment-one-wave-read-model.md`     |
| Representative accounts projection         | 1.355 ms |  0.803 ms |               1 hit | `.agents/audits/supabase-request-path-benchmark.md`         |
| Active membership `LIMIT 1`                | 4.267 ms |  0.895 ms |               1 hit | `.agents/audits/supabase-request-path-benchmark.md`         |
| `SELECT 1`                                 | 0.044 ms |  0.061 ms |              3 hits | `.agents/audits/supabase-request-path-benchmark.md`         |

The prior account/investment plans exercise the same migration functions that returned HTTP 200 in this pass. They are valid supporting evidence, but they are not claimed as fresh per-query plans from this run. Fresh plans for the current card, debt, loan, transaction, tags, inbox, and savings shapes remain open.

The existing evidence consistently shows database execution in milliseconds while direct authenticated endpoint calls are around 195–500 ms median/p95. That gap is why the first recommendation is request-boundary reduction rather than an index migration.

## 19. Index and schema review

Relevant existing indexes found in the migrations and prior audit:

- `idx_transactions_household_date_created (household_id, transaction_date, created_at)` from `20260905070501_query_performance_hotpaths.sql`.
- `idx_transactions_account_created (account_id, created_at DESC)`.
- `idx_transactions_household_created (household_id, created_at DESC)`.
- Partial `idx_transactions_savings_event_kind` and `idx_transactions_transfer_group`.
- `inbox_items_open_unread_idx (household_id, status)` filtered to pending unread items.
- `idx_investment_valuations_latest (household_id, holding_id, valuation_date DESC, created_at DESC)`.
- Primary/unique constraints supply indexes for several card, membership, and household keys.

The account/card list filters by `household_id`, archived state, and type, but current cardinality is 11 accounts and existing same-shape plan evidence is sub-millisecond inside PostgreSQL. Adding `(household_id, is_archived, type)` without a current scale plan would be speculative. No index recommendation passes the evidence threshold in this diagnostic.

The Transactions query has an existing household/date/created ordering index, but its current response cost is dominated by the hosted request boundary and embedded payload at 30 rows. Revisit only after a larger-household plan or a real slow-query sample demonstrates an execution problem.

## 20. Root-cause ranking and candidate improvements

| Rank | Candidate                                                             | Evidence                                                                          | Risk / status                                                                                         |
| ---: | --------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
|    1 | Remove the duplicate `households` projection from `listCreditCards()` | Two same-table reads in one clean trace; another hosted boundary                  | Lowest-risk candidate; not implemented                                                                |
|    2 | Revisit the credit-card dependency shape                              | Accounts must return IDs before settings/months can start                         | Could require a read-model/API change; not automatically better than the current parallel second wave |
|    3 | Narrow investment raw-input payload                                   | 28,002 bytes and p95 1,145.8 ms; current RPC deliberately returns resolver inputs | Financial-equivalence risk; requires contract/benchmark proof                                         |
|    4 | Add independent MONEY Suspense boundaries                             | All content markers appear together behind one page render                        | UX and error-state risk; must preserve financial semantics and layout stability                       |
|    5 | Disable Transactions detail prefetch through the shared constant      | 15 post-hydration RSC requests observed; link omits existing shared constant      | Narrow, confirmed client request amplification; separate from hub initial load                        |
|    6 | Add database indexes                                                  | Existing plans are fast; current tables are small                                 | Not justified; explicitly deferred                                                                    |
|    7 | Move region or alter Auth semantics                                   | No equivalent cross-region direct probe in this pass                              | Not decision-ready and out of scope                                                                   |

The ranking is based on critical-path boundary count, repeatability, and safety—not on the slowest individual response in isolation.

## 21. First optimization proposal and stop criteria

### First target

Investigate one narrow request-shape change: reuse the already-resolved home household context/currency for the credit-card summary rather than issuing a second `households` projection.

Before changing code, verify every caller of `listCreditCards()` and keep the existing application mapping and financial contract. The change should remove exactly one read from the MONEY hub path, preserve request-local tenancy, and not introduce a cross-request cache.

### Required before/after evidence

- Same production build/start command and same authenticated household.
- Ten browser loads at 440×900, retaining the first warm-up result and reporting warm-only percentiles separately.
- Server trace showing whether `GET /rest/v1/households` falls from two to one.
- Direct read-model equivalence for cards/currency.
- No financial data mutations and no schema changes.
- Recheck loading/content markers so the first render does not regress.

### Stop criteria

Stop after the one-target change if:

- it removes one boundary but does not improve page completion by more than normal hosted variance;
- it complicates tenancy or financial ownership semantics;
- it requires a broad read-model redesign;
- it creates a new failure mode or changes card summary output.

Do not bundle investment payload narrowing, section streaming, index work, region work, or transaction-link prefetch changes into that first comparison. Each is a separate experiment.

## Appendix A. Source references

- Hub composition: `app/[locale]/(product)/money/page.tsx:64-100`.
- Product auth/footer boundary: `app/[locale]/(product)/layout.tsx:8-33`.
- Session overlap and membership resolution: `modules/tenancy/application/get-session-membership.ts:19-49`.
- Account raw-input path: `modules/ledger/application/queries/get-real-position.ts:23-103` and `modules/ledger/application/queries/load-account-ledger-balances.ts:61-80`.
- Credit-card dependency waves: `modules/ledger/application/queries/list-credit-cards.ts:16-128`.
- Investment raw-input RPC: `modules/investments/application/queries/investment-queries.ts:753-866`.
- Transactions query shape: `modules/ledger/application/queries/get-transaction.ts:314-390`.
- Transactions page parallel reads: `app/[locale]/(product)/money/transactions/page.tsx:76-107`.
- Transaction link prefetch gap: `app/[locale]/(product)/money/transactions/transaction-list-item.tsx:37-56`.
- Shared prefetch policy: `shared/constants/navigation.ts:1-6`.
- Perf trace implementation: `modules/platform/application/perf-trace.ts:47-95`.
- Account RPC migration: `supabase/migrations/20260911035150_home_account_ledger_raw_inputs.sql`.
- Investment RPC migration: `supabase/migrations/20260911022939_home_investment_raw_inputs.sql`.
- Savings RPC migration: `supabase/migrations/20260910210229_home_savings_summary.sql`.

## Appendix B. Reproduction commands

```sh
npm run build
VINHA_PERF_TRACE=1 npm run start -- -p 3101
```

The direct endpoint harnesses used read-only authenticated `fetch` requests with the existing E2E credentials. No benchmark script was added by this diagnostic pass.

## Final status

**MONEY PERFORMANCE INVESTIGATION: PARTIAL**

- Fresh production-like browser baseline: **complete**.
- Server request graph and wave trace: **complete**.
- Auth/session separation: **complete**.
- Direct endpoint timings and response sizes: **complete**.
- Transactions initial-load and post-hydration evidence: **complete**.
- Current index/source review: **complete**.
- Fresh live SQL plans for every current query: **missing**; existing same-migration plans are documented above.
- Production code or financial data changes: **none**.
