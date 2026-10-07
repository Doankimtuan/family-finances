# Accounts Phase 8 — Credit Card Summary Wave Overlap

Measured/validated 2026-10-05. This report omits account, household, and membership identifiers; financial values; transaction payloads; credentials; cookies; and request IDs.

## Previous architecture

Phase 6 awaited the complete `getAccount()` result before entering the credit-card branch. `getAccount()` includes the selected balance RPC and conditional owner-membership capability lookup. Only after it resolved did the route call `getCreditCardDetail()`, which started card settings and billing-month reads together:

```text
authorized account context
↓
selected balance + owner capability
↓
full getAccount()
↓
card settings + billing months
↓
summary and hero
```

The Phase 7 Phase 6-source control (`n=10`, warm) recorded `getAccount()` at 605 / 672.5 / 871 / 1,631 ms and RSC route at 1,316 / 1,625 / 1,772 / 3,130 ms (min / median / p75 / max). Click-to-readable-hero was 1,426 / 1,726 / 1,917 / 3,307 ms. These are the prior audit's measurements, not a same-run Phase 8 comparison.

## Authorization boundary

After `requireProductSession()`, the route starts `getAccountType(id)` and `getAccount(id)`. `getAccountType()` uses the request-cached `loadAccountDetailContext()` from `list-accounts.ts`. That context requires `assertMoneyActionAllowed()`, filters the account by the active household and selected ID, loads household currency, and rejects missing or archived rows. Only an exact `AccountType.CREDIT_CARD` result starts the summary query. The account context is reused by `getAccount()` through React request-scoped caching; the selected account and household context are not reread.

The summary query retains its own cached money-action gate and explicit household/account filters. It does not use owner capability to authorize the early reads. The authorized active-card context is the boundary; the mapped account result remains the rendering boundary.

## Implementation

The route now creates `cardDetailPromise` from `accountTypePromise`. It calls `getCreditCardDetail(id, resultPromise)` only for an active credit-card type. The query starts settings and billing-month requests together while the already-running `getAccount()` promise continues. The summary builder receives the resolved account name and constructs the same detail model after both the summary inputs and full mapped account result are available.

The hero still waits for the complete account model and card summary. Financial scope, owner status, and `canMutate` still come from `getAccount()`. Action controls remain gated by `canMutate`. The selected-card balance RPC remains in place.

No query fields, filters, household constraints, account-ID filters, ordering, limits, mapping, or billing formulas changed. `buildCreditCardSummary`, `computeOutstanding`, `computeAvailableCredit`, utilization, next-due selection, and remaining-amount semantics are unchanged.

## Overlap proof

The route regression test holds the full account promise pending, resolves the authorized type as credit card, and verifies that the detail query starts with that same pending account promise. This proves the scheduling boundary at the route level. In the query implementation, settings and months are constructed and passed to `Promise.all` alongside the already-started account promise; neither query awaits owner capability or the balance RPC.

Runtime instrumentation for settings/month request start and `getAccount()` end was not collected for Phase 8. The authenticated app tab crashed during recovery, and browser control switched away before the 10-sample run. Therefore actual overlap milliseconds and a 10/10 runtime overlap rate are unverified for this candidate. Phase 7 Prototype B's observed 10/10 overlap and median 308 ms lead are prototype results, not Phase 8 candidate evidence.

## Performance

The requested same-run benchmark (frozen Phase 7/6 source versus final Phase 8 source, same environment, 10 warm samples per arm) could not be completed. No Phase 8 RSC or click-to-readable samples are claimed.

| Metric                                              |            Control: Phase 6 source, Phase 7 audit |                                               Phase 8 candidate |         Delta |
| --------------------------------------------------- | ------------------------------------------------: | --------------------------------------------------------------: | ------------: |
| `getAccount()` total (min / median / p75 / max, ms) |                         605 / 672.5 / 871 / 1,631 |                                                    Not measured | Not available |
| Settings start relative to authorized context       | After full `getAccount()`; exact lag not captured | Starts after account-type proof; runtime timestamp not captured | Not available |
| Billing-month start relative to authorized context  | After full `getAccount()`; exact lag not captured | Starts after account-type proof; runtime timestamp not captured | Not available |
| Settings ↔ `getAccount()` overlap                   |                    0 ms by serialized route order |                                         Not measured in runtime | Not available |
| Months ↔ `getAccount()` overlap                     |                    0 ms by serialized route order |                                         Not measured in runtime | Not available |
| Summary ready (min / median / p75 / max, ms)        |                         No direct stage timestamp |                                                    Not measured | Not available |
| Hero readable (min / median / p75 / max, ms)        |                     1,426 / 1,726 / 1,917 / 3,307 |                                                    Not measured | Not available |
| RSC route (min / median / p75 / max, ms)            |                     1,316 / 1,625 / 1,772 / 3,130 |                                                    Not measured | Not available |

The Phase 7 Prototype B result remains directional only: RSC p50/p75 was 1,420 / 1,645 ms, with both reads starting before `getAccount()` completed in 10/10 prototype visits. It does not establish Phase 8 performance success.

## Request counts

Source comparison confirms unchanged request topology. Counts below are per sampled household/personal-card path where owner lookup applies; conditional owner lookup remains absent for household-owned cards. Counts are source-level, not Phase 8 runtime telemetry.

| Operation                           |        Before |       Phase 8 | Critical path after     |
| ----------------------------------- | ------------: | ------------: | ----------------------- |
| `getUser`                           |             1 |             1 | Session gate            |
| Active membership                   |             1 |             1 | Session gate            |
| Selected account row                |             1 |             1 | Shared account context  |
| Household currency context          |             1 |             1 | Shared account context  |
| Selected-card balance RPC           |             1 |             1 | `getAccount()`          |
| Owner-membership validation         | 1 conditional | 1 conditional | `getAccount()`          |
| Card settings                       |             1 |             1 | Overlapped summary wave |
| Billing months                      |             1 |             1 | Overlapped summary wave |
| Recent transactions for credit card |             0 |             0 | None                    |
| Billing items                       |             1 |             1 | Deferred                |
| Installments                        |             1 |             1 | Deferred                |
| Eligible-purchase path              |        1 path |        1 path | Deferred                |
| Payment accounts (`listAccounts`)   |      1 loader |      1 loader | Deferred                |

## Financial equivalence

No financial calculation or presentation source changed. The same account model supplies ID, name, type, currency, financial scope, owner state, and mutation capability. The same settings and billing-month rows feed the existing summary builder. Existing account-capability, card-summary, billing-month, and ownership tests passed; browser-side before/after value equivalence was not independently captured.

## Error and security cases

- Missing or rejected account context resolves to no active type and starts no card summary query.
- Liquid account types do not start card summary queries.
- Archived rows are rejected by the shared account context before the type promise can start card reads.
- Settings and month queries retain the cached money-action gate and household/account filters; query errors retain the existing logged unavailable-card result.
- The full account result is still required and is checked for matching ID, credit-card type, and non-archived state before summary construction.
- Balance or owner-capability failure still makes `getAccount()` unavailable; the route does not render a hero or actions from an early summary alone.
- Household, viewer, partner, and former-owner capability behavior is unchanged in the account mapper and UI. No authorization, RLS, or database object changed.

## Deferred-section regression

Billing items, installments, eligible purchases, and payment-account loading remain in their existing deferred boundaries and are not awaited by the hero. `getCreditCardDetail()` still makes no billing-items or recent-transactions read. `hero wait ≠ full card detail wait` remains true by route composition and the progressive-rendering tests. Runtime DOM-persistence timing was not remeasured in Phase 8.

## Other phase regressions

- Phase 1 session architecture was not changed; session-membership tests passed.
- Phase 2 Back navigation was not changed; 24 return-navigation tests passed. Browser request counters were not collected.
- Phase 3 create flows were not changed.
- Phase 4/5 liquid detail and selected-balance overlap were not changed; the balance-overlap suite passed. The route does not start card summary queries for liquid account types.
- Phase 6 progressive card rendering and failure handling remain intact; the focused route and failure-isolation tests passed.

## Validation

- Focused card, summary/billing, ownership, balance-overlap, session, and Back suites: 81 passed across 8 files.
- `npm run lint`: passed.
- Full `npm run test`: 1,736 passed, 5 failed. The failures match the Phase 6 baseline: English/Vietnamese key parity (`savingsPage.summaryCaption`), the existing long-card-name `truncate` assertion, and three presentation tests missing `NextIntlClientProvider`.
- `npm run typecheck`: blocked by existing `HomeTranslator` / `Translator` errors in `home-streaming-sections.tsx` at lines 99 and 340; unchanged from the earlier phase audit.
- `npm run format:check`: fails on 195 repository files outside this Phase 8 touch set. The Phase 8 source, test, and report files pass a focused Prettier check.
- Build was not run: the existing typecheck baseline fails, and a local Next dev server is using the shared `.next` output.
- `git diff --check`: passed for the Phase 8 source, test, and report files.
- Authenticated browser verification and the same-run benchmark: incomplete because the app tab crashed and control changed to another browser tab.

## Remaining bottleneck

Session authorization, shared account context, selected balance, and owner capability still gate the mapped account result. The settings/month wave is now scheduled to overlap with that work, but no runtime samples establish the amount of overlap or whether hero latency decreased. No further optimization was started.

**ACCOUNTS PHASE 8 PARTIAL — INVESTIGATE BEFORE PHASE 9**
