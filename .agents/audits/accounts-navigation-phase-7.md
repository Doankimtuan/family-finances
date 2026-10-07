# Accounts Phase 7 — Credit Card Critical Account Path Investigation

Investigation only. No production behavior, database object, or policy was changed. Prototypes ran in a disposable copy of the workspace; that copy and its dev server were removed afterward. This report omits account, household, and membership identifiers, financial values, credentials, cookies, raw payloads, and request IDs.

## Executive finding

The card hero still waits for two serial waves after session authorization: the selected account model, then card settings and billing months. The current Phase 6 route measured a server RSC p50 of 1,625 ms and an actual click-to-readable-hero p50 of 1,726 ms. Once the card summary was ready, the browser needed a median 90.5 ms to make it readable; rendering is not the main delay.

The selected account's generic ledger balance is not a card-summary input and is not consumed anywhere in the Credit Card Detail branch. It is still an indirect availability gate: `getAccount()` returns `null` when the selected balance read fails, and the route then renders the unavailable-account state before entering the card branch.

Prototype A omitted that selected-card balance read while keeping the shared account mapping and owner-capability work. Its n=8 RSC median was 1,634.5 ms, so removing that read alone did not improve hero latency in this sample. Prototype B started settings and months once the authorized, active card context was known. In 10 same-account route reloads, those reads began before `getAccount()` completed in 10/10; RSC p50 was 1,420 ms. The measured opportunity is the settings/months wave overlapping the remaining ownership work.

## Actual hero dependencies

The shared route starts `getAccount()` and `getAccountType()` after `requireProductSession()`. It awaits the account type, then the full account result; only then does the card branch start settings, billing months, and deferred loaders. It awaits the card summary before returning the hero. See `app/[locale]/(product)/money/accounts/[id]/page.tsx:79-162`.

| `getAccount()` value                       | Used by card hero/summary?                                                         | Used by actions only?                                                   | Removable from card critical path?                                                                                    |
| ------------------------------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `id`                                       | Not displayed; keys account, card, and month reads                                 | Yes; action and management targets                                      | No; reads and actions need the selected account identity                                                              |
| `name`                                     | Yes; hero title and `buildCreditCardSummary` input                                 | Also passed to management/payment UI                                    | No                                                                                                                    |
| `type`                                     | Yes; selects the card branch and type label                                        | Also used by management                                                 | No                                                                                                                    |
| `currency` (returned beside `account`)     | Yes; formats outstanding, limit, available credit, statement, paid, and due labels | Also used by payment/installment UI                                     | No                                                                                                                    |
| `financialScope`                           | Yes; ownership badge in the hero                                                   | Also passed to management                                               | No                                                                                                                    |
| Owner state (`isOwnedByMe`, `ownerStatus`) | Yes; ownership badge in the hero                                                   | Also passed to management                                               | No; correct ownership remains a hero dependency                                                                       |
| `canMutate`                                | No; it is not a hero prop                                                          | Yes; controls settings/refund, charge, payment, and installment actions | It is action-critical. The current route waits for it before returning the card page; Prototype B preserves this gate |
| Archived state                             | Not displayed                                                                      | Not an action value                                                     | No; the account must be shown active before card-specific reads start                                                 |
| Generic `balance`                          | No                                                                                 | No in the card branch                                                   | Yes, for card data; it currently gates route availability through `getAccount()`                                      |
| Health state                               | No; health is derived only after the liquid-account branch                         | No                                                                      | Yes; no card consumer exists                                                                                          |

`financialScope`, `isOwnedByMe`, and `ownerStatus` are passed to `FinancialOwnershipBadge` inside `CreditCardHero`. `canMutate` is passed to action and management components. The route does not reveal mutation controls before the mapped capability is ready. Generic `account.balance` and `accountHealthFromBalance(account.balance)` occur after the card branch returns, in the liquid-account path (`page.tsx:407-412`).

## Generic balance usage

**No card-branch consumer uses `account.balance`.** The card hero, due lead, payment actions, installment actions, billing activity, and management settings use account identity/currency/ownership plus the card detail model. The only `account.balance` reads in this route are for the later liquid-account hero and health signal.

There is one indirect chain today:

```text
get_account_ledger_balances returns no usable result
  → getAccount() returns null
  → account detail route renders unavailableAccount()
  → card settings/months and Credit Card Detail are never reached
```

That is a loader dependency, not a financial-summary dependency. Prototype A confirmed that a card page can render without the selected-card balance read when it reuses the authorized account context, currency, row mapper, and ownership-capability calculation. The separate deferred `listAccounts()` payment-account loader still needs its own batch balance read; Prototype A does not remove that deferred request.

## Card summary source and formulas

`getCreditCardDetail()` reads `credit_card_settings` and `card_billing_months` concurrently, filtered by the authorized household and selected card (`modules/ledger/application/queries/list-credit-cards.ts:157-215`). It calls `buildCreditCardSummary()` with only `accountId`, `name`, settings, and mapped months (`modules/ledger/application/credit-card-types.ts:173-202`). Generic account balance is not among these inputs.

- Credit limit, statement day, due day, and linked payment-account ID come from card settings.
- Each billing month supplies statement amount, paid amount, remaining amount, status, billing-month key, and due date.
- `computeOutstanding()` sums positive statement-minus-paid amounts for non-settled months.
- `computeAvailableCredit()` clamps limit minus nonnegative outstanding at zero.
- Utilization is derived from limit and outstanding; a nonpositive limit yields zero.
- The page's due lead selects the earliest non-settled billing month and uses that month's remaining amount, or outstanding when no lead month exists. Currency only formats these values for display.

The same inputs and functions remain in both disposable prototypes. A and B produced the same visible hero text signature in the browser. The non-balance account values are built by the same row mapper and capability resolver in the prototype; no alternate ownership or card-formula implementation was introduced.

## Current timing topology

Current Phase 6 source, same authenticated local environment and profiled card. Values below are `min / median / p75 / max` in milliseconds. Even-sample medians use the midpoint; p75 uses nearest rank. Concurrent medians are shown as measurements, not added together.

| Stage                                               |        Phase 6 baseline, n=10 |
| --------------------------------------------------- | ----------------------------: |
| Click → route trace/session start                   |           18 / 20.5 / 22 / 85 |
| Session                                             |     314 / 338.5 / 387 / 1,010 |
| Account and household context                       |       311 / 381.5 / 561 / 971 |
| Selected-card balance loader/RPC span               |       296 / 335.5 / 392 / 403 |
| Owner/capability validation                         |         286 / 294 / 310 / 658 |
| Full `getAccount()`                                 |     605 / 672.5 / 871 / 1,631 |
| Card settings                                       |         299 / 328 / 475 / 740 |
| Billing months                                      |         287 / 333 / 364 / 473 |
| Card summary calculation (millisecond-rounded span) |                 0 / 0 / 0 / 0 |
| Summary ready → hero readable                       |         78 / 90.5 / 101 / 128 |
| Actual click → hero readable                        | 1,426 / 1,726 / 1,917 / 3,307 |
| Hero DOM insertion → readable frame                 |           14 / 16.5 / 18 / 20 |
| RSC route span                                      | 1,316 / 1,625 / 1,772 / 3,130 |

One click-to-readable sample was a 3,307 ms high outlier; the median and p75 remain close to the Phase 6 audit's reported p50/p75 of 1,634/1,914 ms. The new click capture starts from the in-page click event and marks the hero after DOM insertion plus two animation frames with nonempty visible text.

```text
After session:
  account context ───────────┐
  selected-card balance ─────┼─ parallel starts
       owner validation ─────┘  (starts after account context)
                              ↓
                       getAccount resolves
                              ↓
              card settings ──────┐
              billing months ─────┴─ parallel, but serialized after getAccount
                              ↓
                       summary (sub-ms)
                              ↓
                   hero readable (~90.5 ms median)
```

At the median, the balance span is shorter than the context-plus-owner path and usually completes while context/capability work is in progress. Its removal alone therefore has little measured effect on the median. The card settings/months wave is a separate serial wave after `getAccount()`.

## Prototype A — omit selected-card balance

**Security-valid; read-only; n=8 route reloads.** The temporary card branch used the shared active-account context and account-row/capability mapper, returned the same card-required account fields and currency without `balance`, and did not call the selected-card balance loader. The hero rendered and its visible-text signature matched Prototype B. The account context still rejected missing, archived, or out-of-household rows; ownership calculation remained in the path.

| Stage                                            | Prototype A, n=8 (`min / median / p75 / max`, ms) |
| ------------------------------------------------ | ------------------------------------------------: |
| Session                                          |                           369 / 465 / 543 / 1,060 |
| Account and household context                    |                             296 / 334 / 352 / 397 |
| Selected-card balance span                       |                                 Not invoked (0/8) |
| Owner/capability validation                      |                           263 / 291.5 / 304 / 369 |
| Card account context ready, including capability |                           563 / 633.5 / 674 / 730 |
| Card settings                                    |                             318 / 517 / 652 / 728 |
| Billing months                                   |                           386 / 492.5 / 525 / 978 |
| Card summary calculation                         |                                     0 / 0 / 0 / 2 |
| RSC route span                                   |                   1,375 / 1,634.5 / 1,948 / 2,585 |

The prototype avoided one critical selected-card balance RPC per visit. It still made one balance RPC for the deferred payment-account list. The measured RSC p50 was effectively unchanged from the current path; the p75 was noisier and worse in this small sample. Removing balance is a valid request/failure-coupling reduction, but it was not the demonstrated latency win. Eight complete A server route spans were captured; a subsequent browser-control timeout prevented further candidate checks, so A's sample is n=8.

## Prototype B — overlap settings/months with account capability work

**Security-valid; read-only; n=10 same-card route reloads.** The summary reads started only after the shared request-cached context had proved the account existed, belonged to the active household, was non-archived, and had credit-card type. `getCreditCardDetail()` retained its own money-action gate and household-filtered settings/month queries. The route still waited for the complete account model and `canMutate` before returning the hero/actions.

| Stage                                 | Prototype B, n=10 (`min / median / p75 / max`, ms) |
| ------------------------------------- | -------------------------------------------------: |
| Session                               |                              345 / 567 / 723 / 803 |
| Account and household context         |                              271 / 380 / 404 / 787 |
| Selected-card balance loader/RPC span |                              284 / 390 / 589 / 690 |
| Owner/capability validation           |                              278 / 313 / 361 / 655 |
| Full `getAccount()`                   |                        549 / 675.5 / 1,044 / 1,148 |
| Card settings                         |                              289 / 341 / 389 / 765 |
| Billing months                        |                              301 / 389 / 476 / 551 |
| Card summary calculation              |                                      0 / 0 / 1 / 3 |
| RSC route span                        |                        987 / 1,420 / 1,645 / 2,160 |

Observed overlap:

- Settings/months began after authorized context and before full `getAccount()` completed in 10/10 visits.
- Their start preceded owner/capability completion in 10/10 visits.
- Their start preceded selected balance completion in 3/10 visits; in the other 7/10, the balance had already completed. This profile's largest overlap is with owner/capability work, not usually the balance RPC.
- The median start was 308 ms before `getAccount()` completed. The summary was ready a median 65.5 ms after `getAccount()` completion; do not subtract these independent medians to predict a user-visible result.
- RSC p50/p75 were 1,420/1,645 ms versus the Phase 6 measured 1,625/1,772 ms. This is a directional ~205 ms p50 improvement; candidate click-to-readable was not independently measured.

## Request counts and deferred boundary

For the profiled partner-owned personal card, the current critical path has eight remote reads by loader: `getUser` (1); session active-membership resolution (1); selected account row (1); household currency (1); owner-membership validation (1); selected-card balance RPC (1); card settings (1); billing months (1). `getSessionMembership()` is request-cached between the route and money gate. A household-owned row does not need the separate owner-membership lookup.

| Critical request                                       | Phase 6 | A no balance | B overlap |
| ------------------------------------------------------ | ------: | -----------: | --------: |
| User + session membership                              |       2 |            2 |         2 |
| Selected account + household currency                  |       2 |            2 |         2 |
| Owner-membership validation for profiled personal card |       1 |            1 |         1 |
| Selected-card balance RPC                              |       1 |            0 |         1 |
| Card settings + billing months                         |       2 |            2 |         2 |
| **Critical total**                                     |   **8** |        **7** |     **8** |

The count is the critical card-loader path, not every request that can finish during the render. `listAccounts()` retains a separate deferred batch balance RPC for payment choices. Billing items, installments, eligible purchases, and payment accounts still start after the active card account is known and are not awaited before the hero. Card recent transactions remain at zero. Prototype request telemetry confirmed one settings read and one months read per visit; A omitted the selected-card balance span while retaining the deferred payment-account balance read. No deferred loader entered either prototype's awaited summary boundary.

## Security and ownership

`requireProductSession()` resolves authenticated user and active membership. `loadAccountDetailContext()` reuses the request-cached money gate, filters the account row by the authorized household and ID, reads household currency, and rejects missing or archived rows (`modules/ledger/application/queries/list-accounts.ts:110-155`). The early B boundary is that context plus an exact credit-card type check. Card-specific settings/month reads start only after that boundary; the existing generic balance RPC still starts in parallel under the money gate. Card settings/months keep both the money gate and explicit household/account filters. No database or RLS policy changed.

Ownership remains separate from the early card-read proof. The full account model still maps `financialScope`, `isOwnedByMe`, `ownerStatus`, and `canMutate`; the hero needs the first three, and all mutation/action controls receive `canMutate` before rendering. Do not remove owner validation merely because the balance-free/early-read prototype can begin its read sooner.

Existing coverage/source checked (tests were not run for this investigation):

- `tests/unit/session-membership.test.ts`: unauthenticated and no-active-membership gates.
- `tests/unit/account-detail-balance-overlap.test.ts`: malformed ID, missing/out-of-context row, archived row, balance RPC failure, and viewer-owned/partner-owned/former-owner capability mapping.
- `tests/unit/ownership-ui.test.ts`: household mutability, partner personal read-only state, and former-owner state.
- `tests/unit/account-ledger-balance-rpc.test.ts`: balance RPC authorization is based on the active household, not a caller-supplied household ID.
- Source: `getCreditCardDetail()` rejects non-card/archived input and filters settings/months by the gated household and account ID. The disposable early-read helper was not added to production and has no new standalone test.

## Browser tail

Current Phase 6 summary-ready → readable hero was 78 / 90.5 / 101 / 128 ms (`min / median / p75 / max`, n=10); DOM insertion → readable frame was 14 / 16.5 / 18 / 20 ms. This confirms the browser tail is small relative to the server path. The prototypes confirmed the hero rendered, but candidate click-to-readable distributions were not captured after browser control stopped dispatching reliably. No React-render optimization is supported by these measurements.

## Candidate ranking

1. **B — overlap card summary waves.** Security-valid boundary; n=10 prototype; observed overlap with owner/capability in every visit and RSC p50 1,420 ms. Critical request count unchanged.
2. **A — remove selected-card balance from the card path.** Security-valid and removes one critical RPC (8→7 critical reads); n=8 showed no p50 latency improvement. Keep the shared balance-requiring `getAccount()` behavior for liquid detail; a future card-specific path should reuse the cached context and ownership mapper rather than duplicating them.

No new card RPC/read model is justified: settings and months already provide the summary once their existing calls are scheduled earlier.

## Recommended Phase 8

Implement the narrow B scheduling change: start card settings and months after the existing authorized, active credit-card context resolves; keep the full mapped account/capability result as the gate for rendering hero ownership and all action controls. Do not change the shared liquid-account `getAccount()` contract in this step.

**ACCOUNTS PHASE 7 COMPLETE — OVERLAP CARD SUMMARY WAVES**
