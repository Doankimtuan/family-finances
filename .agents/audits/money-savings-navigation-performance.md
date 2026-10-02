# Money → Savings navigation performance investigation

Measured 2026-10-02 23:23:11–23:27:23 (Asia/Ho_Chi_Minh). Investigation only; no optimization or financial mutation implemented.

## 1. Result and exact flow

The tested flow is **Money → Savings → Create Saving → app Back to Savings → existing Saving Detail**. One cold-ish destination pass and three complete warm repetitions reproduced the delay. Warm median loaded-screen visibility is **1,904 / 1,357 / 1,382 / 2,435 ms**, respectively.

The time is principally spent waiting for the server's streamed RSC response to finish its authenticated remote data dependencies. Response headers arrive in roughly 13–16 ms; that early response is loading UI, not the completed destination. Current-user and membership reads execute sequentially on these client navigations. The Create page then waits for a full account read model, and Detail waits for additional account/action/activity data before releasing the page.

The app Back control is a Link to Savings. A separate browser-history Back control restored Savings in **50 ms with no RSC request**. This distinction explains why returning through the app feels slow even after visiting the page.

No duplicate remote `getUser()` call was observed within any measured navigation. The shared providers survive. GraphQL, a whole-flow CSR migration, and a provider rewrite do not address the primary measured cause.

## 2. Reproduction environment

- Repository: `/Users/doantuan/Desktop/Plan/family-finances`; HEAD `2076f19da77f2942dddc1cd04d93847d08b52cf5`, **with the existing uncommitted working-tree changes**. Timings describe that working tree, not clean HEAD or a verified deployed revision.
- Actual installed versions: Next.js 16.3.1, React 19.2.3, next-intl 4.14.7, supabase-js 2.109.0, Supabase SSR 0.8.0, Playwright 1.63.0.
- Headed Chromium, 440 × 900 CSS pixels, no network or CPU throttling, normal motion. Existing E2E authenticated storage state was loaded without printing credentials. Existing household data had 34 active Savings entries; no fixtures were created.
- Existing Detail: `/en/money/savings/eb685a0d-f23c-4df2-82e8-bd9eec83d67b`, selected through the first actual Savings row. It has one cycle, allows the action-data branch, and has no linked activity transaction IDs in the observed path.
- Production-mode app at `http://localhost:3102`, built from an isolated copy of the current source with the installed dependencies. The existing development server on port 3000 was left running.
- Supabase: project `family-finances-2` (`bbzffxvgocjwsdbujvgn`), region `ap-southeast-2`. The Next server runs locally on this Mac; this is **production-mode local-server → hosted-Supabase performance**, not a deployment-region benchmark.
- Turbopack needed a common filesystem root because the disposable copy shares the installed dependencies through a symlink. A webpack attempt failed on the existing HeroUI/server import boundary. Turbopack compiled successfully but the existing Home translator type errors blocked type checking; `typescript.ignoreBuildErrors` was enabled **only in the disposable copy** to complete the profiling build. No production config was changed.
- Each transition was preceded by a 1.2-second idle period. Between repetitions, actual Back links returned from Detail → Savings → Money. The same document and router session were retained. Run 0 is cold-ish for destination code and data; it is not a cold login, empty browser cache, or fresh database experiment.

## 3. Timing methodology and limits

A browser capture-phase listener records the actual click with `performance.now()`. A MutationObserver records when the loaded destination marker enters the DOM; two requestAnimationFrame callbacks record its next paint opportunity. Markers are `[data-testid="money-savings"]`, `[data-testid="savings-create-wizard"]`, and `[data-testid="savings-detail"]`, excluding the corresponding loading and missing-data markers.

“Click → Visible” means **loaded destination DOM plus the next paint opportunity**. It measures useful screen arrival, not the completion of every MotionReveal animation, all offscreen sections, or exact compositor presentation. The loaded header and form step indicator are included. A follow-up Detail visibility check observed the identity section visible while its reveal was still running. A Chromium timeline trace corroborates rendering/paint activity for warm repetition 3. The report does not claim a compositor-exact or hydration-only measurement.

Resource Timing provides request start, response start, response end, compressed bytes, and duration on the **same browser clock as the click**. CDP captures request types, prefetch headers, response MIME/status, chunks, stream data, and client CPU counters. CDP wall-time differed from the browser clock by up to approximately 3 ms; browser Resource Timing is used for click-to-request and final client-tail numbers.

Existing `VINHA_PERF_TRACE=1` traces capture Supabase fetch-to-headers, `getUser`, `getClaims`, and membership durations. In the isolated copy, narrowly scoped try/finally spans surround the involved loaders, pages, product layout, and server-client factory. A Node HTTP observer measures request arrival to response finish. No request headers containing credentials, response bodies, row data, or financial amounts are recorded.

Fetch spans end at response headers; loader spans include subsequent JSON decoding and mapping. Server page spans end when JSX is returned, not when the entire RSC serialization finishes. Exclusive Server Component render CPU, exclusive React reconciliation, and wire-only download time are **not isolated**. Stream response time includes server pauses between chunks; it must not be called pure network download time. The temporary proxy wrapper's synchronous span excludes its returned async promise; middleware auth cost is therefore taken from the actual `getClaims` span rather than misreported as the wrapper duration.

The evidence JSON records all 16 navigations, server spans, network timing, provider retention, browser Back control, and SQL spot checks. Values below are measured, not estimated optimization gains.

## 4. Per-transition timeline

Warm medians, three samples per transition; all times in ms:

| Transition       | Click → Request | Server/RSC stream | Supabase domain envelope | Client tail | Click → Visible |
| ---------------- | --------------: | ----------------: | -----------------------: | ----------: | --------------: |
| Money → Savings  |             0.8 |              1874 |                     1094 |        28.9 |            1904 |
| Savings → Create |             1.3 |              1318 |                      758 |        37.5 |            1357 |
| Create → Savings |             1.2 |              1358 |                      770 |        22.4 |            1382 |
| Savings → Detail |             1.1 |              2413 |                     1821 |        18.0 |            2435 |

**Column definitions:** Server/RSC stream is browser request-start → response-end. Supabase domain envelope is first domain fetch start → last domain fetch headers, excluding the current-user membership gate. It includes overlap between parallel requests and is **inside** the Server/RSC column. Client tail is response-end → loaded-screen paint opportunity; it includes final parsing/reconciliation/layout/scheduling and is not pure JS CPU. Column medians are independent and need not add exactly; individual samples satisfy Click → Request + RSC stream + Client tail = Click → Visible.

All individual samples:

| Sample   | Transition       | Click → Request | TTFB | RSC stream | Click → DOM commit | Client tail | Click → Visible |
| -------- | ---------------- | --------------: | ---: | ---------: | -----------------: | ----------: | --------------: |
| Cold-ish | Money → Savings  |             1.4 | 24.6 |       2948 |               2970 |        26.6 |            2976 |
| Cold-ish | Savings → Create |             1.8 | 14.5 |       1326 |               1404 |        80.0 |            1408 |
| Cold-ish | Create → Savings |             1.7 | 16.9 |       1335 |               1360 |        29.3 |            1366 |
| Cold-ish | Savings → Detail |             1.1 | 13.6 |       2088 |               2109 |        27.0 |            2116 |
| Warm 1   | Money → Savings  |             0.7 | 15.0 |       2210 |               2229 |        27.8 |            2238 |
| Warm 1   | Savings → Create |             1.3 | 15.7 |       1252 |               1288 |        37.5 |            1290 |
| Warm 1   | Create → Savings |             1.2 | 15.7 |       1470 |               1488 |        22.4 |            1493 |
| Warm 1   | Savings → Detail |             1.1 | 20.3 |       2413 |               2426 |        21.4 |            2435 |
| Warm 2   | Money → Savings  |             0.8 | 16.4 |       1874 |               1896 |        28.9 |            1904 |
| Warm 2   | Savings → Create |             1.4 | 16.1 |       2023 |               2050 |        28.6 |            2053 |
| Warm 2   | Create → Savings |             0.9 | 13.3 |       1358 |               1375 |        23.6 |            1382 |
| Warm 2   | Savings → Detail |             1.1 | 14.8 |       2630 |               2644 |        18.0 |            2649 |
| Warm 3   | Money → Savings  |             0.9 | 14.0 |       1526 |               1548 |        32.2 |            1559 |
| Warm 3   | Savings → Create |             1.0 | 13.6 |       1318 |               1354 |        37.5 |            1357 |
| Warm 3   | Create → Savings |             1.6 | 14.6 |       1338 |               1356 |        21.1 |            1361 |
| Warm 3   | Savings → Detail |             1.0 | 15.3 |       1992 |               2004 |        16.8 |            2010 |

Representative **single warm repetition 3** server spans, with starts relative to the click, rounded to ms. Server/browser clock alignment limits precision to a few ms:

| Transition       | Server operation               | Start after click | Duration |
| ---------------- | ------------------------------ | ----------------: | -------: |
| Money → Savings  | auth.getUser                   |                10 |      436 |
| Money → Savings  | membership.resolve             |               445 |      267 |
| Money → Savings  | loadSavings                    |               713 |      787 |
| Savings → Create | auth.getUser                   |                12 |      278 |
| Savings → Create | membership.resolve             |               291 |      268 |
| Savings → Create | listProviderCatalog            |               558 |      290 |
| Savings → Create | loadAccounts                   |               558 |      760 |
| Create → Savings | auth.getUser                   |                13 |      265 |
| Create → Savings | membership.resolve             |               278 |      270 |
| Create → Savings | loadSavings                    |               548 |      771 |
| Savings → Detail | auth.getUser                   |                12 |      273 |
| Savings → Detail | membership.resolve             |               285 |      266 |
| Savings → Detail | loadSavingDetail               |               551 |      630 |
| Savings → Detail | loadProviderPackages           |              1183 |      287 |
| Savings → Detail | listSavingsFinancialActivities |              1182 |      523 |
| Savings → Detail | loadAccounts                   |              1183 |      805 |

For example, Create takes about 12 ms to begin its page auth, 278 ms for user verification, 268 ms for membership, and 760 ms for its account loader. Its provider catalog starts in parallel with that account loader and takes 290 ms. The browser consumes the RSC stream in 1,318 ms and paints loaded content at 1,357 ms. Detail starts its second loader wave at about 1,182 ms; account data completes about 805 ms later, immediately before the page can return.

## 5. Browser network and RSC findings

- All four actual transitions use **GET Fetch requests returning `text/x-component`**, not document reloads. Each warm transition has one demand RSC request. No separate browser API request or browser Supabase REST/Auth request is needed for initial screen data.
- RSC request starts are 0.6–2.3 ms after the click in the measured samples. The browser is not spending a second deciding to navigate.
- Warm response headers arrive in 13–21 ms. Stream completion takes 1.25–2.63 seconds. The long interval between headers and response-end is consistent with server loader spans; the completed UI is waiting on RSC data, despite prompt skeleton/header responses.
- Warm compressed RSC bodies are approximately 39.4 KB Money → Savings, 38.5 KB app Back → Savings, 3.1 KB Create, and 9.6 KB Detail. Warm uncompressed CDP stream data are 131,217 / 128,000 / 12,409 / 33,563 bytes, respectively. A tiny Create response is still slow, so transfer size alone does not explain it.
- Destination code loads only on the first production destination pass: two Savings chunks (12,677 transferred bytes including response overhead), then seven additional Create-related chunks (73,273 bytes). Individual chunk requests complete in approximately 4–7 ms. They are not a multi-second chunk-download bottleneck. Later repetitions need no additional route JS chunks.
- Some successfully consumed RSC streams end with CDP `net::ERR_ABORTED`. Their HTTP responses are 200, the server reaches response finish, Resource Timing contains the consumed response duration, and the destination renders. This is stream cancellation after consumption/segment handling, not evidence of a failed navigation.
- The first Savings render triggers several small default Link prefetch requests. These are separated from the demand request and described below. They did not produce a second full domain-loader execution in the server log.

## 6. Actual server execution chain and significant awaits

Initial document entry differs from subsequent route navigation:

```text
proxy: locale routing → updateSession → getClaims
root/locale layout: params → messages → client provider composition
ProductLayout: params → requireProductSession
  → getSessionMembership (cached per render)
      starts getUser
      → verified claims subject
      → membership from that subject while getUser remains in flight
ProductNavigation Suspense branch → unread inbox HEAD count
Money page → its own cached user/membership gate → Money loaders
```

Money's entry surface is used to start the flow, not audited as a separate performance target. In all 16 measured client transitions, **ProductLayout and ProductNavigation did not rerun**; their instrumentation produces no spans for those requests. Thus their parallelized initial-document session gate does not rescue the child pages' manual sequential gate.

The actual shared path for each child navigation is:

```text
RSC request
  → proxy locale routing → await getClaims (normally local verification)
  → destination page awaits params / sets locale
  → await getSessionUser()          GET /auth/v1/user
  → await resolveActiveMembership(user.id)
                                      GET /rest/v1/household_members [current user]
  → translations + route loaders in Promise.all
      → assertMoneyActionAllowed() [cached]
          → getSessionMembership() [cached logical context]
              → verified claims + already-resolved user/membership
```

Savings list, including app Back to Savings:

```text
listSavings [request cache]
  → allowance gate → cached server client
  → await savings GET
      embeds funding/settlement account names, provider, full saving_cycles
  → await owner-membership validation [IDs learned from rows]
  → map rows/cycles; compute accrued interest
  → Promise.all maturity-action enrichment
      conditional provider packages for matured renewal items
  → build overview → return page JSX → RSC serialization → client commit
```

No conditional maturity package request occurred in this tested list. There is no list cycle N+1: cycles are embedded. The owner-membership second wave is real, but depends on the rows and protects ownership behavior; it cannot simply be removed or blindly parallelized.

Create:

```text
Promise.all(translations, listSavingsEligibleAccounts, listProviderCatalog)
  account branch:
    listAccounts [request cache] → allowance → cached client
    → Promise.all(households.base_currency GET, liquid accounts GET)
    → Promise.all(owner-membership GET, get_account_ledger_balances RPC)
    → ownership mapping + apply balances
    → eligible type and canMutate filtering
  catalog branch:
    one providers GET with active packages embedded
→ map full form props → return CreateSavingWizard
```

The catalog and accounts already run concurrently. Accounts/currency → ownership/balances is a second dependency wave. The initial form shows a type/mode choice and progress; the route nevertheless waits for the full account balance model and catalog. The no-eligible-accounts decision and all later financial validations must remain correct in any follow-up optimization.

Detail:

```text
Promise.all(translations, getSavingDetail(id))
  → allowance → savings detail GET [with embedded account names/provider]
  → Promise.all(owner-membership validation if owner exists,
                saving_cycles GET)
  → current cycle selection, accrued interest, ownership mapping
  → conditional maturity package validation
→ build detail model / canAct
→ Promise.all(
    listSavingsFinancialActivities(id, cycles),
    canAct ? provider packages : null,
    canAct ? full eligible accounts read model : null)
  activities:
    → allowance → savings GET selecting only id [recheck]
    → collect transaction IDs from cycles
    → if IDs: seed transactions GET → transfer-group transactions GET
    → deduplicate and format activity model
→ return entire page JSX
```

For the selected item, no owner ID causes a saving-owner validation query, and no transaction IDs cause transaction requests. The activity loader still spends a hosted round trip re-reading the Savings ID before returning an empty list. The account-owner membership query still occurs in the eligible-account branch.

Relevant files: `proxy.ts`; `modules/platform/supabase/{update-session,server}.ts`; `modules/tenancy/application/{get-session-user,get-session-membership,get-verified-auth-subject,resolve-active-membership,assert-money-action-allowed,require-product-session,list-active-membership-ids}.ts`; `modules/savings/application/queries/{list-savings,list-savings-accounts}.ts`; `modules/savings/application/savings-provider-registry.ts`; `modules/ledger/application/queries/{list-accounts,load-account-ledger-balances}.ts`; and the four page/layout paths above.

## 7. Supabase timing: HTTP round trips versus SQL

Warm repetition 3, **real application HTTP fetch-to-headers durations**:

| Read                         | Money → Savings | Savings → Create | App Back → Savings | Savings → Detail |
| ---------------------------- | --------------: | ---------------: | -----------------: | ---------------: |
| Auth user                    |             432 |              276 |                263 |              271 |
| Current membership           |             266 |              267 |                269 |              265 |
| Savings primary              |             469 |                — |                500 |              293 |
| Saving cycles                |        embedded |                — |           embedded |              334 |
| Owner membership             |             305 |              267 |                264 |   373 (accounts) |
| Providers + packages catalog |               — |              288 |                  — |                — |
| Provider packages            |               — |                — |                  — |              284 |
| Household currency           |               — |              472 |                  — |              425 |
| Accounts                     |               — |              482 |                  — |              427 |
| Account balances RPC         |               — |              274 |                  — |              363 |
| Savings ID activity recheck  |               — |                — |                  — |              521 |

Do not sum parallel rows as critical-path time. Actual per-request total Auth/REST HTTP counts are **4 / 7 / 4 / 10**, invariant across all four repetitions. Client creation is normally under 1 ms and is not a remote call.

Read-only Supabase MCP EXPLAIN spot checks on this exact saving ID measured **0.109 ms execution for the base Savings row and 0.059 ms for its cycle lookup** (planning 0.595 / 0.394 ms). Both use indexed scans. These are privileged representative base-table checks, **not** the exact PostgREST embed SQL, authenticated RLS plan, or a measurement of every query in this flow. They confirm the sampled lookups are fast without pretending to explain all REST time.

Project edge-log aggregates for 2026-10-02 16:21–16:26 UTC corroborate a large non-SQL/service gap. Median `response.origin_time` / `x_envoy_upstream_service_time` values are: Auth 200/4 ms, membership 199/4 ms, accounts 202/4.5 ms, households 199.5/3 ms, cycles 192.5/7 ms, packages 191.5/8.5 ms, balances RPC 200/10 ms. Savings reads have 391.5/35 ms. The origin and upstream fields are service-log timing boundaries, not pure SQL timers. The fixed project-wide window also includes entry/control traffic and potentially other clients; these aggregates are corroboration, not an isolated per-click attribution.

No `Server-Timing` header was returned by the sampled Supabase responses. The evidence supports **hosted HTTP round-trip/service-path latency plus dependency waves**, not a slow database root cause. A deployed Next server in another region could have materially different round-trip costs; that remains unmeasured here.

## 8. Auth/session timing and deduplication

Warm medians, ms:

| Transition       | getUser span | Membership span | Remote user calls | Current-membership calls |
| ---------------- | -----------: | --------------: | ----------------: | -----------------------: |
| Money → Savings  |          436 |             267 |                 1 |                        1 |
| Savings → Create |          278 |             269 |                 1 |                        1 |
| Create → Savings |          271 |             270 |                 1 |                        1 |
| Savings → Detail |          273 |             266 |                 1 |                        1 |

Each warm navigation executes two logical claims checks: proxy verification and the loader's session context. Their measured spans are typically 1–3 ms; one Detail proxy sample is 9 ms. No JWKS HTTP request or refresh-token request occurs in the measured four destination passes. Initial document warm-up is excluded from that statement.

The page does `await getSessionUser()` before `await resolveActiveMembership(user.id)`. Concrete example, warm repetition 3 Detail: user span begins at approximately click +12 ms and lasts 273 ms; membership begins at +285 ms and lasts 266 ms. Domain loading begins at +551 ms. This is a **serial gate**, not three duplicate 270-ms auth calls.

`getSessionUser`, verified subject, active membership, allowance, and the Supabase server factory use React request-local cache. Verification comes from the log: one server-client creation, one user GET, one current-membership GET per navigation despite page/loader logical calls. No cache is claimed across different navigations. The known parallel session resolver is present in the code but invoked only after these pages have already completed their sequential gate on this RSC path.

## 9. Other repeated work

- **Confirmed same-object reread on Detail:** the primary detail loader reads Savings, then `listSavingsFinancialActivities` reads that same Saving again selecting only `id`. The latter costs **436–523 ms warm** (median 465 ms; round-trip duration), even for empty activity. Its eligibility/authorization purpose must be preserved if sharing an already-authorized context. It overlaps the account branch, so removing it alone would not improve first paint in these samples.
- Owner-membership and current-membership GETs are **different predicates/projections**, not duplicate auth lookups. List owner validation costs 264–305 ms in repetition 3; its row-ID dependency is real.
- Full account/currency/owner/balance work repeats on separate visits to Create and Detail. That is cross-navigation work, not duplicate account reads within one request. Request cache does not persist it across pages.
- The current Detail page uses `getSavingDetail` once and consumes its cycles. It does **not** concurrently call the old `getSaving` and `listSavingCycles` combination. Earlier audits of that pattern do not describe this working tree.
- No inbox badge query is repeated during the four client transitions because its shared layout branch is retained.

## 10. Link implementation and actual prefetch

| Link/control               | Source                                                            | Prefetch behavior observed                                                                                                                                       |
| -------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Money → Savings module row | `money/money-module-section.tsx` → `shared/patterns/base-row.tsx` | Link explicitly uses `PRODUCT_LINK_PREFETCH = false`; no destination prefetch before click.                                                                      |
| Savings header Open        | `money/savings/page.tsx:263`                                      | next-intl Link has no explicit prefetch override. Default segment/loading-shell prefetch occurs before the first Create click.                                   |
| Create header Back         | `shared/patterns/top-app-bar.tsx:208`                             | Link with explicit prefetch false; fresh demand RSC request on click.                                                                                            |
| Savings row → Detail       | `money/savings/savings-product-row.tsx:89`                        | Link with explicit prefetch false. The separate highlighted maturity card uses a default Link and prefetched the same selected Detail URL during the first pass. |
| Bottom navigation tabs     | `shared/patterns/bottom-navigation.tsx:213`                       | next-intl Link + pending click feedback, prefetch false. Center capture uses router.push; it is outside this flow.                                               |
| Wizard exit handler        | `new/create-saving-wizard.tsx:529`                                | router.push to Savings; not the tested header Back and not browser history Back.                                                                                 |

The first Savings page generated two segment-prefetch stages each for New, Providers, and the highlighted Detail URL. Server HTTP logs explicitly identify `next-router-prefetch: 1`; those six small requests finished in **20–26 ms**. They invoked proxy claims but no page/user/membership/domain loader spans. New still needed a full demand RSC request when clicked. **Prefetch works for the shell/segments; the authenticated destination data is not ready in advance.**

The plain constant comment describing past full-tree prefetch contention is not proof of current behavior; current runtime traces show these small segment requests. There is no evidence here for disabling more links or enabling unrestricted full-data prefetch across every Savings row. Stable locale-aware hrefs are used; dynamic IDs are not the demonstrated cause.

## 11. Layout/provider remount behavior

For all 16 navigations, the exact DOM objects for `#app-viewport-root` and the shared scroll-region `<main>` are retained. Comparing their React ancestor fibers with their alternates shows the same function/context-provider instances survive each transition, including root-layout boundary, locale, AppProvider composition, financial privacy, and viewport ancestors. Production names are minified in the raw evidence; source composition provides their semantic names.

There is no Supabase React provider in this flow; a request-scoped server client is initialized once on each RSC request. ProductLayout/ProductNavigation server spans occur on document entry, not on these child navigations. Server-layout rerender and client-provider remount are distinct; neither is observed as the cause here.

BottomNavigation **intentionally returns null on standalone Create routes** via `isStandaloneFlowPath` (`bottom-navigation.tsx:162`). Its inner navigation DOM disappears on Create and is recreated on return. The outer provider/shell instances persist. This local nav remount is observed, not mislabeled as persistent navigation DOM, and it does not cause an auth/badge refetch or a multi-second startup.

`ProductRouteTransition` keys its animated subtree for primary tabs only. Money → Savings changes that primary key to the secondary-route subtree; the Savings/Create/Detail secondary routes use the stable undefined key. Page/wizard content is replaced normally. There is no evidence that moving providers or rebuilding the shell would improve this latency.

## 12. Server/Client Component boundaries and browser work

| Boundary      | Components in this flow                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server        | Root/locale/product/Savings layouts; Money, Savings, New, Detail pages; Page/ChromeShell composition; domain loaders and auth helpers.                                                                        |
| Client shell  | Locale/App/Theme/Modal/StatusAlert/FinancialPrivacy providers, AppViewport, BottomNavigation, ProductRouteTransition, TopAppBar. Server children are passed through these boundaries.                         |
| Client leaves | CreateSavingWizard, SavingsPrivacyToggle, ownership/financial presentation controls, MotionReveal/MotionStep, SavingsCycleHistory, Detail action/editor/settlement surfaces, offline banner, HeroUI controls. |

These pages are not marked `use client`; the client shell does not convert the passed Server Component children into client data loaders. There is no initial React Query/SWR fetch in these Savings pages, and no route refresh is triggered by merely opening the form or using header Back. Mutating server actions are not invoked in this test.

Warm CDP CPU-counter medians during the bracketed navigation interval, ms:

| Transition       | JS execution | Style recalculation | Layout |
| ---------------- | -----------: | ------------------: | -----: |
| Money → Savings  |         28.1 |               241.2 |    5.2 |
| Savings → Create |         32.6 |               142.5 |    4.7 |
| Create → Savings |         24.9 |               158.7 |    4.1 |
| Savings → Detail |         20.0 |               469.2 |    4.1 |

Those counters include pending/loading work and small automation setup/actionability intervals, not just final hydration. The warm repetition-3 trace separately records UpdateLayoutTree time of **174 / 142 / 158 / 352 ms**, Paint of **4.7 / 3.0 / 4.7 / 2.5 ms**, and no individual >50-ms complete trace event in the measured windows. Style work occurs repeatedly while loading/animation frames run. Its accumulated CPU is real, but it overlaps server waiting and must not be added to RSC elapsed time. No per-component style culprit or hydration-only CPU cost is established. Final response-end → paint opportunity is only approximately **18–38 ms median**, so current evidence does not support blaming final JS hydration for seconds of delay.

## 13. Back navigation

The measured app Back is an anchor to `/en/money/savings`, not `router.back()` or browser history. Every repetition makes a new demand RSC request, repeats user verification and membership resolution, and repeats Savings plus owner validation. Warm app Back costs **1,361 / 1,382 / 1,493 ms**. No mutation, revalidatePath, explicit refresh, or cache invalidation was executed. The new page request is the forward-Link navigation behavior, not evidence that a mutation invalidated the page.

A control from loaded Savings → Create → **browser history Back** restored the previous Savings screen in **50 ms**, with only favicon traffic and no route RSC request. Thus this router session can restore that history entry without rerunning auth or Savings data. This is one control sample, not a three-sample benchmark or a guarantee for every entry, cache lifetime, or browser.

An optimization could use history restoration when a known in-app Savings entry exists, with a safe href fallback for directly opened forms. Merely swapping every Back link blindly would risk wrong destinations; no change is implemented.

## 14. Detail: critical versus deferrable data

**Critical for the initial identity/financial summary:** authorized household/session, the Saving's state/snapshot and embedded provider/account names, ownership capabilities, and current-cycle principal/rate/dates/interest/maturity values. Applicable safety warnings need any required renewal-target validity check. This financial/auth correctness cannot be removed for speed.

**Not inherently required for that initial summary:** the full historical cycle list, financial activity, eligible-account balances for settlement/edit actions, and the full active provider-package menu. These serve lower-page sections, dialogs, or action choices. An appropriate minimal current package label may still be needed for the maturity-instruction section; package validation for a matured invalid target may be critical to its warning. Do not discard those semantics indiscriminately.

Today all of those sections share one page-wide await boundary. The measured post-detail-loader wave costs **805–1,263 ms warm for accounts**, **265–287 ms for packages**, and **436–523 ms for empty activity**. Accounts determines that wave's completion in all three warm samples. The single detail/cycle read itself takes **560–1,015 ms** after the session gate. Sharing its current cycle avoids a redundant cycle query, but fetching history in the same query still puts it before the page return.

These measurements identify a real opportunity to release the authorized summary before non-critical action/activity data. They are a dependency diagnosis, **not a measured streaming or CSR speedup**. No streaming or client fetching was implemented.

## 15. Bottlenecks ranked by evidence

### P1 — Sequential current-user → membership gate on every destination

**Cost:** warm per-navigation user spans 252–468 ms; membership 257–626 ms. The median serial gate is approximately **732 / 546 / 535 / 539 ms** for Money → Savings / Create / app Back / Detail (medians of the actual sum, not the sum of independent medians).

**Files:** Savings `page.tsx:85–87`, New `page.tsx:26–28`, Detail `page.tsx:101–103`; tenancy session helpers.

**Why:** the shared ProductLayout is retained, while the child page explicitly awaits user before starting membership. The existing claims-subject session helper can overlap them, but is reached too late through the loader gate. This affects all four transitions. Direction: reuse the existing secure parallel session resolution at the destination's initial gate; preserve current-user identity matching and membership authorization. The removable overlap is bounded by the shorter operation; **no optimization gain was benchmarked**.

### P1 — Page-wide waits for full account/action data

**Cost:** Create account-loader spans **695 / 1,438 / 760 ms**; Detail account-loader spans **1,263 / 1,087 / 805 ms** after Saving detail. Catalog/packages run concurrently and finish sooner.

**Files:** New page `:32`; Detail page `:141`; `list-savings-accounts.ts:5`; ledger `list-accounts.ts:18–83` and balance loader.

**Why:** a simple wizard startup and an initial detail summary wait for a full account ownership/currency/balance model. Detail adds this wave only after loading the Saving/cycles. Direction: first determine the smallest correct account props each initial surface needs, then consider a Server Component boundary for non-critical action/activity data. Applies to Create and Detail; keeping RSC is compatible with that direction.

### P2 — Repeated full data navigation on the app Back link

**Cost:** warm Link Back **1,361–1,493 ms**, versus **50 ms** in the history-restoration control. This difference is an observed navigation-behavior contrast, not an implemented improvement.

**Files:** New `TopAppBar` backHref and `shared/patterns/top-app-bar.tsx:208`; wizard exit handler uses push similarly but was not timed.

**Why:** a fresh forward route request repeats the gate and list loading. Direction: history-aware return with an explicit known-route fallback; preserve direct-entry behavior. Applies to Create → Savings only.

### P2 — Hosted data waves remain on the critical path

**Cost:** Savings domain envelope **783–1,103 ms** entering the list and **768–794 ms** on return; Detail data envelope **1,434–2,100 ms** after the gate. Repetition-3 owner validation alone is 305 ms (entry) / 264 ms (return). Database spot checks are <1 ms while relevant HTTP reads are hundreds of ms.

**Files:** `list-savings.ts`, `list-active-membership-ids.ts`, full account loader; deployment/database topology is outside this scoped code audit.

**Why:** necessary row-derived ownership checks and multi-wave reference loaders pay hosted round trips; response bodies cannot finish before them. Direction: preserve authorization while sharing already-authorized context/read models and reducing proven unnecessary waves. Re-measure from the actual deployed server region before promising gains from topology changes. The redundant activity Saving recheck is confirmed, but removing it alone does not shorten these sampled Detail critical paths because accounts is slower.

### Secondary observations, not independently ranked root causes

Default links prefetch loading segments but not authenticated destination data. Narrow useful prefetch/streaming experiments may improve perceived arrival; no uncontrolled full-prefetch recommendation is supported. Style recalculation consumes hundreds of ms across the wait, but its exclusive latency contribution and exact component culprit are unproven. Small route chunks, provider remounting, repeated remote getUser calls within one request, and slow sampled SQL are not demonstrated bottlenecks.

## 16. Architecture decision

| Option                                  | Evidence-based decision                                                                                                                                                                                                                                                                                                                |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Keep RSC and optimize this flow**  | **Recommended.** The existing parallel session helper, correct Back semantics, and narrower/deferred non-critical account/action boundaries directly target the measured waits without replacing the architecture.                                                                                                                     |
| **B. Selected client-fetched sections** | A possible later experiment for below-summary activity and action reference data. It may move the measured second Detail wave after first content, but server streaming can do the same while retaining RSC. No measurement proves client fetching is superior.                                                                        |
| **C. Most of the flow to CSR**          | Not supported. Final client tail is tens of ms, providers persist, and the dominant costs are auth/data round trips and when the page waits for them. CSR would still need correct session/membership/ownership checks and data fetches.                                                                                               |
| **D. GraphQL**                          | Not justified. No measured GraphQL-specific deficiency is identified. The list already embeds cycles/accounts/provider; the catalog embeds packages; balances already use an RPC. GraphQL would not eliminate Auth network verification, the serial page gate, forward-Link Back behavior, or the decision to await non-critical data. |

A specifically designed batched GraphQL resolver could theoretically collapse some hosted data dependencies. That would be a new server read model whose benefit depends on measured batching, not GraphQL itself; an existing PostgREST embed or narrowly scoped RPC could achieve the same effect. No such comparison was run. **GraphQL solves no measured bottleneck by merely replacing the current API transport.**

## 17. Proposed optimization order — no implementation

1. Change only these destinations' initial gate to use the existing parallel session resolver; retain identity, active membership, and permission checks. Re-run this exact four-transition measurement before any further work.
2. Address the app's return semantics with a verified history/fallback behavior; compare direct-entry and prior-Savings cases.
3. For Create and Detail, narrow initial account requirements. Benchmark an authorized summary/form-shell boundary with non-critical action/activity references released later. Preserve no-eligible-account behavior and financial validation.
4. Reuse the already-authorized Detail context for activity only if the permission contract stays equivalent; then measure whether it matters after the account bottleneck is reduced.
5. Only then examine scoped full-data prefetch, list projection/ownership batching, or loading-style CPU. Measure from the real deployed Next region before altering infrastructure. No whole-app audit, GraphQL migration, or CSR conversion is proposed as the first step.

## 18. Evidence, verification, and final state

Machine-readable evidence: [money-savings-navigation-performance-evidence.json](money-savings-navigation-performance-evidence.json). It contains measured clocks/spans/network fields; no cookies, credentials, token bodies, or financial records.

Reproduction commands used in the profiling copy:

```sh
npm run build
VINHA_PERF_TRACE=1 NODE_OPTIONS=--require=/absolute/path/to/http-audit.cjs npm run start -- -p 3102
# Headed Playwright session: load existing authenticated state, viewport 440×900.
# Run exact Link flow once, then three more times without reloading the document.
# Capture browser Resource Timing/CDP, request-local traces, and loader/page spans.
```

The disposable build config and HTTP/loader wrappers are profiling setup, not checked-in application fixes. Existing data was used; neither the financial fixture harness nor mutating E2E suites were run. Database operations were read-only logs and SELECT EXPLAINs; the balances RPC is the existing read-only application loader.

Repository validation on the unchanged production source:

- `npm run lint`: passed.
- `npm run typecheck`: failed at existing Home translator types (`home-streaming-sections.tsx:99,340`), matching the initial profiling build failure.
- `npm run test`: 242 files passed / 3 failed; 1,599 tests passed / 5 failed. Failures: i18n key parity, Money account text-wrapping assertion, and three account presentation tests missing NextIntl provider context. No application fix was introduced to address them in this investigation.
- Evidence self-check: all 16 samples present in exact order; browser clock decomposition reconciles; every sampled provider ancestry is retained; actual HTTP counts are 4/7/4/10; browser Back generates no route request. Passed.
- Report and evidence formatting: passed targeted Prettier check. Repository-wide `npm run format:check` reports pre-existing formatting issues in 222 files; no unrelated files were reformatted.

Limitations: one account and one existing Detail fixture, three warm samples per transition, local server against a hosted database, normal motion, no deployment-region measurement, no full authenticated SQL/RLS execution plan, and no exclusive React/server-render CPU attribution. Do not derive population p95s, production SLAs, or exact optimization speedups from this sample.

**Application code/config changes in the repository: none. Financial data changes: none. Architecture changes: none.** Only this report and its timing evidence are added; existing user changes are preserved.
