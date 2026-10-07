# Accounts Navigation & Rendering Performance Investigation

Measured 2026-10-04 (Asia/Ho_Chi_Minh). Investigation only: no production code or financial data was changed, and no account/card form was submitted.

## Executive summary

The first useful screen and the full destination data became available together in every measured transition. Warm click-to-useful medians range from **1.2 s for app Back to Accounts** to **2.8 s for Credit Card Detail**. The most important shared wait is the page gate: Accounts routes `await getSessionUser()` and then `await resolveActiveMembership(user.id)`, serializing two remote checks on every RSC navigation. The existing verified `getSessionMembership()` helper overlaps user verification and membership resolution but is reached only later by data loaders, after the page gate has finished.

The destination load then holds the page behind its full loader set. Create Account waits for the generic liquid-account read model even though name/type/scope/opening-balance controls are independently usable. Account Detail waits for activity and a second generic account read model; Credit Card Detail additionally waits for billing items, installments, and purchase eligibility. Several of those reads are for lower-page actions, and Credit Card Detail also fetches recent transactions that its card branch does not render.

App Back is a Link to the Accounts route and triggers a fresh authenticated RSC/data load: warm median **1.3–1.8 s** depending on the return path. Browser-history Back restored the same Accounts page in **156 ms** with no destination RSC request.

The measurements support a narrowly scoped **Accounts Phase 1: use the existing verified parallel session resolver at the route gate**, retaining user verification and active-membership checks. They do not support a GraphQL migration, whole-flow CSR, financial formula changes, or a new read model as the first step. SQL execution time was not available from the Supabase logs; no SQL bottleneck is inferred from HTTP durations.

## Environment

- Repository HEAD: `fca2c70f`; the working tree already had unrelated design-redesign and transaction-audit edits. This investigation added only the two requested audit files.
- A disposable source copy ran Next.js **16.3.1** and React **19.2.3** on `http://localhost:3102`; the existing app on port 3000 was left alone. Narrow trace wrappers were added only to that copy. The measured app was in Next development mode, not production mode.
- Existing authenticated Brave session, Chromium engine, **2560 × 1303 CSS px**, DPR 1; the product shell remained centered at its normal 440 px maximum. No CPU or network throttling was applied.
- The local Next server connected to the hosted development Supabase project in **`ap-southeast-2`**. This is local-server-to-hosted-Supabase latency, not a deployment-region benchmark.
- The same existing household was used throughout; its Accounts screen showed 7 liquid accounts and 3 cards. No fixtures were created. No names, IDs, balances, tokens, cookies, or response bodies were retained in the audit evidence.
- A temporary, asynchronous row-count-only trace recorded 7 rows from the home account raw-input RPC and 6 rows from the credit-card raw-input RPC, which the application maps into the 3 displayed card summaries. This supplementary trace is separate from timing samples. Raw row counts for other endpoints and the balance RPC were not captured.

## Timing method and limits

The exact intent was followed: Money → Accounts → Create Account → app Back → Create Credit Card → app Back → first existing Account Detail → app Back → first existing Credit Card Detail. One initial/control sample and three warm samples were captured for every edge, using the same authenticated browser and server. A separate complete control lap was also captured after route compilation; the table uses the first observed sample as Control and the subsequent complete-flow samples as Warm 1–3.

Milestones were checked in the actual UI:

- Accounts List: `[data-testid="money-accounts-directory"]` after the real account/card directory response.
- Create Account and Create Credit Card: enabled `#account-name` as the first independent field.
- Account Detail useful: `[data-testid="account-detail-hero"]`; full: `section[aria-labelledby="account-recent-activity"]`.
- Credit Card Detail useful: `[data-testid="credit-card-hero"]`; full: `[data-testid="credit-card-actions"]`.

Click-to-useful is measured from the UI action through the destination marker and two animation frames. “Full data” requires the second marker where applicable. The two timestamps were equal on all 36 samples: these pages return only after their awaited data is present. That does not mean every offscreen animation completed.

Browser Resource Timing captured request start, TTFB, response end, client tail, and bytes for 30 of 36 samples. Its entries were unavailable for the last six warm samples; click-to-useful remained available. One RSC request per app-Link navigation was corroborated by the `_rsc` entries when present and the local Next route traces. Resource timing for six samples should be treated as missing, not as zero. Dev HMR/assets are included in the helper’s browser-request-start counter and are not Supabase request counts. No separate destination prefetch was seen in this dev run; production prefetch behavior is not established.

The first route visits include development compilation and occasional JWKS cold-fetch effects. They are retained as Control observations, not treated as production expectations. Warm medians use only Warm 1–3. The run is not a cold login, empty browser cache, or fresh database experiment.

## Flow map

| Surface            | Route                           | Current behavior                                          |
| ------------------ | ------------------------------- | --------------------------------------------------------- |
| Money entry        | `/vi/money`                     | Origin only; the Money dashboard itself is out of scope.  |
| Accounts List      | `/vi/money/accounts`            | Liquid account directory plus separate card summaries.    |
| Create Account     | `/vi/money/accounts/new`        | Shared `AccountCreatePage`, with account type selection.  |
| Create Credit Card | `/vi/money/accounts/new-credit` | Same page component with fixed credit-card type.          |
| Account Detail     | `/vi/money/accounts/:id`        | Shared detail route; branch chosen from the account type. |
| Credit Card Detail | `/vi/money/accounts/:id`        | Same detail route and card-specific data branch.          |

There is no separate Accounts card-detail route in this flow. Accounts List uses `router.push` for Create Account, a Link for Create Credit Card, and the detail row Links. The TopAppBar Back target is `APP_PATH.MONEY_ACCOUNTS`, which the browser confirmed as a fresh route request. Relevant source: `app/[locale]/(product)/money/accounts/page.tsx`, `account-create-page.tsx`, `[id]/page.tsx`, `money-accounts-directory.tsx`, and `shared/patterns/top-app-bar.tsx`.

## Benchmark

Click-to-useful-screen milliseconds; **warm median** is the median of Warm 1–3.

| Transition                               | Control / first observation | Warm 1 | Warm 2 | Warm 3 | Warm median |
| ---------------------------------------- | --------------------------: | -----: | -----: | -----: | ----------: |
| Money → Accounts List                    |                       2,296 |  2,009 |  2,021 |  2,647 |   **2,021** |
| Accounts → Create Account                |                       5,940 |  2,090 |  1,478 |  1,343 |   **1,478** |
| Create Account → Accounts (app Back)     |                       3,445 |  1,514 |  1,897 |  1,779 |   **1,779** |
| Accounts → Create Credit Card            |                       4,711 |  2,404 |  1,691 |  1,699 |   **1,699** |
| Create Credit Card → Accounts (app Back) |                       1,460 |  1,414 |  1,274 |  1,155 |   **1,274** |
| Accounts → first Account Detail          |                       4,036 |  3,041 |  2,441 |  2,304 |   **2,441** |
| Account Detail → Accounts (app Back)     |                       1,309 |  1,329 |  1,502 |  1,218 |   **1,329** |
| Accounts → first Credit Card Detail      |                       3,726 |  3,332 |  2,716 |  2,787 |   **2,787** |
| Credit Card Detail → Accounts (app Back) |                       1,280 |  1,160 |  1,393 |  1,204 |   **1,204** |

The initial Create Account observation was 5.94 s; its trace included Next development compilation and a 1.42 s account loader. The initial Create Card observation was 4.71 s with a 2.34 s RSC TTFB during first route compilation. Warm results remove most of that compile penalty but remain above one second because each navigation re-runs auth, membership, and route data.

### Browser-history Back control

| Action                                   | Click → Accounts useful UI |           RSC |      Supabase reads |
| ---------------------------------------- | -------------------------: | ------------: | ------------------: |
| Create Account app Back Link             |       Warm median 1,779 ms | 1 new request | Accounts list reads |
| Create Credit Card app Back Link         |       Warm median 1,274 ms | 1 new request | Accounts list reads |
| Account Detail app Back Link             |       Warm median 1,329 ms | 1 new request | Accounts list reads |
| Credit Card Detail app Back Link         |       Warm median 1,204 ms | 1 new request | Accounts list reads |
| Browser history Back from Create Account |                 **156 ms** |             0 |                   0 |

## Server timelines

The spans below come from application-side fetch/auth/loader instrumentation in the isolated copy. They are representative single traces, not medians. Fetch durations end at response headers; loader spans include parsing and mapping. Parallel requests overlap and must not be summed as critical-path time.

### Accounts List

```text
RSC → proxy claims check
  → getSessionUser / Auth GET
  → resolveActiveMembership / household_members GET   [serial page gate]
  → Promise.all(getRealPosition, listCreditCards, translations)
      getRealPosition: home account raw-input RPC || shared household/currency GET
      listCreditCards: card raw-input RPC || same request-cached household context
  → map ownership, balances, card summary → return page → RSC/client paint
```

Representative measured spans: Auth user GET **971 ms**, membership **257 ms**; after the gate, home-account RPC **275 ms**, card RPC **730 ms**, household GET **509 ms**. The two RPCs and shared household query run concurrently. Their loader spans were 528 ms and 851 ms; page/server application duration was about 2.2 s and click-to-useful was 2.30 s. The list uses one home-account raw-input RPC that already carries the liquid-account balance and active-owner state, plus one separate card-summary RPC. There is no per-account balance RPC/N+1 on this route.

### Create Account and Create Credit Card

```text
RSC → getSessionUser → resolveActiveMembership              [serial]
  → Promise.all(translations, listAccounts)
      listAccounts gate / request-cached Supabase client
      → Promise.all(household currency GET, liquid accounts GET)
      → wait for rows to learn owner IDs
      → Promise.all(owner-membership GET, get_account_ledger_balances RPC)
      → map account model
  → build the entire form page → RSC/client paint
```

A warm Create Account trace measured Auth user **590 ms**, membership **278 ms**. Its household and account reads ran in parallel at **290 / 524 ms**; after rows, owner membership and balance RPC ran in parallel at **270 / 294 ms**. `listAccounts` took **849 ms** in that sample. A first route trace had getUser **1,292 ms** followed by membership **717 ms**; its list loader then took **1,422 ms**. The 5.94 s first-use screen includes dev compile cost.

Both create routes wait for the same generic account model. Create Account does not need liquid-account IDs, owners, or balances to let the user choose type, enter name, choose icon/scope, or enter the opening balance. Create Credit Card needs account names/IDs only for the optional linked payment-account picker (step 4); the limit, billing days, name, and scope controls are independently usable. The form receives currency for receipt/display handling after submit. No provider/bank catalog request exists on these forms; icon and billing-day choices are local constants.

### Account Detail

```text
RSC → getSessionUser → resolveActiveMembership              [serial]
  → Promise.all(translations, getAccount, recent(5), listAccounts)
      getAccount: household GET || account row GET
        → owner-membership GET || one-account balance RPC
      listAccounts: household GET || all-liquid-accounts GET
        → owner-membership GET || batch balance RPC
      recent: recent account transactions GET
  → render hero, quick actions, activity, management → RSC/client paint
```

A representative trace measured user **728 ms**, membership **257 ms**, `getAccount` **879 ms**, recent activity **904 ms**, and `listAccounts` **1,012 ms**. The account route also ran duplicate household/account reads and two `get_account_ledger_balances` RPCs: one for the selected account, one for the liquid-account list. The loader branches start in parallel, but the page returns only after all complete. The first compiled dynamic detail route took 4.04 s click-to-useful; the route trace included about 1.68 s of dev compilation.

### Credit Card Detail

```text
RSC → getSessionUser → resolveActiveMembership              [serial]
  → Promise.all(translations, getAccount, recent(5), listAccounts)
  → if card, Promise.all(
      getCreditCardDetail: currency/account/settings/months(≤12)/items(≤40),
      listCreditCardInstallments,
      listEligibleCreditCardPurchases: transactions(≤40) || plans
        → related transaction lookup if candidate IDs exist
    )
  → render hero, billing/payment actions, installments and activity → paint
```

In a representative card trace, the account/card detail branch took **638 ms**, installments **561 ms**, and eligible-purchase preparation **1,240 ms** after the first parallel wave. The page waits for all three. `listRecentTransactions(5, id)` is also called in the first wave but is not used in the card-render branch; card activity comes from billing items. The full card branch returns only after the complete action data is available.

## Request counts

Counts are per representative authenticated RSC request. Auth is the `/auth/v1/user` call; membership is included in REST. “Remote total” is Auth + REST + RPC, excluding the local Next RSC request and any cold JWKS fetch. Proxy and route also perform logical claims checks; a cold verified-claims call can add 0–2 JWKS HTTP requests. Card Detail REST count reflects the observed candidate path with a related-transaction lookup; it is one lower when that lookup is skipped.

| Transition / destination           | Auth | REST | RPC | RSC | Remote total |
| ---------------------------------- | ---: | ---: | --: | --: | -----------: |
| Money → Accounts List              |    1 |    2 |   2 |   1 |            5 |
| Accounts → Create Account          |    1 |    4 |   1 |   1 |            6 |
| Create Account → Accounts List     |    1 |    2 |   2 |   1 |            5 |
| Accounts → Create Credit Card      |    1 |    4 |   1 |   1 |            6 |
| Create Credit Card → Accounts List |    1 |    2 |   2 |   1 |            5 |
| Accounts → Account Detail          |    1 |    8 |   2 |   1 |           11 |
| Account Detail → Accounts List     |    1 |    2 |   2 |   1 |            5 |
| Accounts → Credit Card Detail      |    1 |  17* |   2 |   1 |           20 |
| Credit Card Detail → Accounts List |    1 |    2 |   2 |   1 |            5 |

`*` Includes the independent active-membership read, two owner-membership validations, three household/account row pairs across generic and card-specific loaders, recent activity, card settings/months/items, installment and eligibility reads, plus the related transaction query on the observed data. This is an operation count, not a claim that every request blocks the hero equally.

- Accounts List: 1 home account raw-input RPC; 1 card raw-input RPC; **0** `get_account_ledger_balances` calls. The raw input row-count trace saw 7 home-account rows and 6 card input rows; the latter map to 3 displayed card summaries.
- Create routes: **1** batch balance RPC each, despite balances not being required by the first controls.
- Account and Card Detail: **2** batch balance RPCs each. These are bounded batch calls, not one call per account. On Card Detail the selected-card generic balance is not displayed; the all-liquid-account model feeds lower-level payment choices.
- App Back returns to Accounts and repeats the list’s 1 auth + 2 REST + 2 RPC pattern. Browser-history Back issued none.

## Accounts List

`getRealPosition()` calls `get_home_account_ledger_raw_inputs`; the RPC supplies account identity, opening/archived state, scope, owner membership state, and calculated ledger balance in one account-oriented result. The app filters to liquid types and derives the total. It does not read each account balance separately.

`listCreditCards()` calls `get_money_credit_card_raw_inputs` separately and shares the request-cached household context for currency. The mapper groups raw billing-month rows by card and builds card summaries. Owner status is mapped from the raw active-owner flag. Credit-card summary work is separate from generic `listAccounts()`.

Thus the two list data loaders already run concurrently and household context is reused inside the RSC request. No sequential `accounts → balance → owners` wave exists for the list RPC. Any follow-up should preserve the server-calculated ledger and card values.

## Create Account

| Data            | Initial controls                           | Later controls                | Submit                                                                |
| --------------- | ------------------------------------------ | ----------------------------- | --------------------------------------------------------------------- |
| Translations    | Required to label the page and fields      | All form copy                 | No additional lookup                                                  |
| Account type    | Local options; user can choose immediately | Determines conditional fields | Validated by schema/action                                            |
| Name / icon     | Local controls                             | Receipt display               | Persisted by server action                                            |
| Financial scope | Local default/field                        | Ownership explanation         | Server derives and validates ownership/capability                     |
| Opening balance | Local `CurrencyInput`; usable immediately  | Receipt                       | Server action validates and writes ledger opening state               |
| Currency        | Not needed to start typing                 | Display/receipt formatting    | Used in display/result handling                                       |
| Ownership       | No reference list needed to start          | Owner indicators after save   | Active household membership and owner rules stay server-authoritative |
| Provider / bank | No field or remote provider catalog        | None                          | None                                                                  |

The initial form is held behind `listAccounts()`, which loads account names plus owner and balance data for the optional card-payment picker and currency prop. That whole dependency is deferable for a regular new-account form’s first useful screen. Keep the create action’s fresh authorization and ledger write semantics unchanged in any future phase.

## Create Credit Card

| Data                               | Initial card controls                                                                                    | Later / optional controls                              | Submit                                           |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| Translations and fixed type        | Required; type is set by route                                                                           | All labels                                             | Schema/action enforces card type                 |
| Name / icon / financial scope      | Local controls; independently usable                                                                     | Receipt / settings                                     | Server action validates scope and ownership      |
| Credit limit                       | Local `CurrencyInput`                                                                                    | Summary after creation                                 | Server validates limit and creates card settings |
| Statement and due days             | Local option constants                                                                                   | Billing detail                                         | Server validates the values                      |
| Linked payment account             | Not required for first card fields                                                                       | Optional step 4 picker; needs liquid account IDs/names | Eligibility is validated server-side             |
| Currency                           | Not required to start                                                                                    | Receipt/display                                        | Display/result handling                          |
| Opening balance / provider catalog | No card opening-balance field or provider lookup in this page; card creation passes zero opening balance | None                                                   | Server owns initial ledger/card state            |

The same `listAccounts()` model blocks the entire card form for an optional step-4 selector. It includes balances and owner checks the selector does not display. A future change should make the earliest card controls available first while deferring the optional linked-account choices; do not move eligibility or card-limit authority to the client.

## Account Detail

### Critical summary

- Account identity/name and type.
- Current balance from batch ledger balance RPC; household currency.
- Financial scope, owner state, and server-derived `canMutate`.
- Archived/household eligibility checks.

### Deferable or repeated work

- Five recent transactions and activity presentation.
- The second generic `listAccounts()` model for transfer/payment choices; for liquid detail its `liquidAccounts` value is constructed but not used in the rendered branch.
- The second household/account/owner/balance read wave from that list model.
- Lower-page management/action data if opened later.

`AccountDetailPage` awaits `getAccount`, `listRecentTransactions`, and `listAccounts` in one `Promise.all` before it builds the hero JSX. The hero is therefore held behind activity and the unused liquid-account mapping. `getAccount` and `listAccounts` independently fetch household and account rows, then make their own owner and batch-balance calls. This is repeated work within one RSC request, not a duplicate `getUser()` or a reason to remove authorization checks.

## Credit Card Detail

### Critical summary

- Account identity/type and ownership/capability from `getAccount`.
- Household currency, credit limit, statement/due days, billing months, outstanding and available credit.
- The next open due context derived from billing months.

### Deferable action/activity data

- Billing items (bounded at 40) used by card activity/actions.
- Installments and eligible-purchase candidates/related transaction checks.
- Liquid payment-account list used by payment actions.
- First-wave `listRecentTransactions(5, id)`, which is not rendered by the card branch.
- Generic account balance calls: one for the card row and one for the liquid list; card summary uses billing-ledger values, not `account.balance`.

The existing formulas remain server-side: monthly remaining is `max(0, statementAmount - paidAmount)`; outstanding sums open/non-settled remaining amounts; available credit is `max(0, creditLimit - max(0, outstanding))`; next due is the earliest open month with a positive remaining amount. No formula or persisted financial value was changed.

`getCreditCardDetail()` currently reads currency, account row, settings, up to 12 billing months, and up to 40 billing items concurrently. The page then waits for separate installments and eligibility queries. The critical hero needs identity/owner, currency, settings, and billing-month summary. Actions and lower activity can be progressively streamed after that summary without weakening server eligibility checks.

## Session/auth and request reuse

The three page gates (list, create, detail) directly use sequential `getSessionUser()` then `resolveActiveMembership(user.id)`. `getSessionMembership()` is already present and verifies the claims subject against `getUser()` while overlapping user and membership work; `assertMoneyActionAllowed()` uses it inside loaders, but by then the page gate has already completed.

Observed per route: one Auth `getUser` request and one active-membership REST request; the page gate and loader do **not** produce duplicate user or active-membership HTTP reads within the same render. The direct resolver and verified-subject resolver reuse React request cache when they use the same user ID. The logical claims check runs in proxy and again in the loader path. A few traces included cold `/auth/v1/.well-known/jwks.json` fetches (roughly 0.2–1.3 s); warm traces generally did not. No refresh-token request was observed.

`createSupabaseServerClient()` is React-cached per server render. No repeated client construction was observed or indicated by the loader traces. The RSC response stays within the existing app shell; no full document reload occurred on app Link transitions. Provider instance counters were not installed, so this investigation does not attribute any time to provider remounts.

## Supabase HTTP versus SQL

The server trace measures Auth/REST/RPC fetch-to-headers and loader spans. These HTTP durations include PostgREST/Auth service, database work, and network/pooling; they are not SQL execution time. The unified Supabase log window (2026-10-04 08:20–09:10 UTC) contained edge, auth, and PostgREST sources but no `postgres_logs`. PostgREST records exposed host/identifier metadata, not per-query duration or SQL text. No `EXPLAIN (ANALYZE, BUFFERS)` was run because there was no authenticated query context or query log to tie a SQL plan to the observed user-scoped request. Therefore this report does **not** claim that Postgres execution is fast or slow.

Representative remote HTTP durations show material time outside any SQL attribution: e.g. Auth user reads of about 0.24–1.29 s, membership reads about 0.24–0.79 s, and REST/RPC reads about 0.25–1.45 s in captured traces. These ranges are application-observed service round trips, not per-query SQL timings.

## Client rendering and loading boundaries

The measured post-RSC response-to-useful paint tail was **72–173 ms** in samples with Resource Timing, while the browser script-duration delta was generally about **50–130 ms**. This is smaller than the 1.2–2.8 s warm navigation time. There is no evidence to blame React hydration or client JavaScript as the main bottleneck.

Accounts and Account Detail have route loading boundaries, but those show pending UI rather than the first useful account/form/card controls. The server page still waits for its full `Promise.all` and any subsequent card `Promise.all` before returning the loaded page. Useful and full-data markers arriving together confirm that current loading UI is not progressive data rendering. A focused Suspense/progressive-RSC split is the appropriate rendering direction; a whole-flow CSR conversion is not.

## Ranked bottlenecks

### P1 — Sequential authenticated page gate

Every Accounts RSC route serializes `getUser` and active membership. In representative traces the pair took about **0.85–2.0 s** before domain loaders could complete, and cold JWKS validation added occasional larger spikes. The existing verified resolver is the smallest measured next phase; preserve both checks and fail-closed behavior.

### P1 — Create pages wait for a broad account read model before the first field

Warm Create Account/Card medians are **1.48 / 1.70 s**; the form waits for households, liquid accounts, owner membership, and balance RPC. The first account fields do not consume those results. Defer the account model, particularly the optional card-payment choices and balances, behind the initial form controls.

### P2 — App Back re-fetches the full Accounts list

App Back is a Link, not history restoration. The warm median is **1.2–1.8 s** and repeats auth, membership, and both list RPCs. Browser history returned in **156 ms**. Decide later whether restoring the prior list state is a product/navigation requirement; the current difference is measured.

### P2 — Account Detail holds its hero behind redundant list and activity reads

Warm median is **2.44 s**. The page starts the hero loader, five-row activity query, and generic liquid-account model together, then awaits all. `getAccount` plus `listAccounts` each read account/currency/owner/balance information; the generic list is unused on the liquid branch.

### P2 — Credit Card Detail holds its hero behind action data

Warm median is **2.79 s**. After the base detail wave, the page waits for detail items, installments, and eligible-purchase validation. Its recent-transaction query is unused in the card branch. Keep the card billing math and eligibility on the server; stream lower-level action data separately.

## Architecture recommendation and smallest next phase

- **Accounts List:** keep RSC/server read models. Its two domain reads already run concurrently, and the existing account/card RPCs return values required to show real balances, ownership, and billing summaries.
- **Create forms:** progressive RSC. Render the independent form controls without waiting for `listAccounts`; stream/defer optional linked-payment-account options and receipt currency if needed.
- **Account Detail:** progressive RSC. Render the server-authoritative summary first; stream activity and lower action/reference data after it.
- **Credit Card Detail:** progressive RSC. Keep account ownership and billing summary authoritative on the server; defer items, installment/eligible-purchase actions, and payment-account choices.
- **CSR:** no mostly-CSR surface is supported by these measurements.
- **Purpose-built read model/RPC:** the list already uses two purpose-built RPCs. No new one is justified until SQL timing or a demonstrated transport/data-shape bottleneck exists.
- **GraphQL:** GraphQL is not justified by the current Accounts measurements. The measured serial cost is auth/membership; the independent reads can remain parallel, and deferred sections can use existing RSC boundaries or a narrow RPC if later measurements require it.

The smallest next implementation phase is only the measured session gate: switch the route-level gate to the existing verified parallel resolver and retain authenticated user verification, active household membership, RLS, `canMutate`, owner validation, and mutation-time checks. Re-measure before choosing another dependency to change. No implementation was made in this investigation.

## Decision

**ACCOUNTS INVESTIGATION COMPLETE — PROCEED TO ACCOUNTS PHASE 1**
