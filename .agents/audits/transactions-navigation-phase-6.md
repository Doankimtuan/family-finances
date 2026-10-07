# Transactions Phase 6 — Parallel Transactions Session Gate

Date: 2026-10-06

## Previous session topology

The product layout already calls `requireProductSession()`, but Next preserves an active layout during client navigation. A Money → Transactions List client transition therefore does not rerun the layout gate. The List page itself still awaited `getSessionUser()` and then `resolveActiveMembership(user.id)`, so its route critical path remained serial. Phase 4.1 measured about 510 ms p50 for those sequential checks.

The List event loader also calls `assertMoneyActionAllowed()`, which reads the canonical session. That did not create another membership HTTP read: `getSessionUser()` and `resolveActiveMembership()` are React-cached for the server render, and the verified subject matches the user ID. The loader's request-cached authority read reused those values. The defect was the page's serial gate before starting the loader, not an extra loader query.

## Canonical session contract

`requireProductSession()` uses the existing `getSessionMembership()` contract. It starts `getSessionUser()`, obtains the verified Supabase claims subject, then resolves membership from that subject while the user lookup is still pending. It returns only when the verified subject matches the authenticated user and the membership belongs to that user. Membership lookup still filters `is_active = true`; missing or mismatched session parts fail closed. `getUser()` remains required and claims do not replace user verification.

The trusted result contains the user, active membership ID, household ID, user ID, and role. The locale is normalized by the same route helper. React `cache()` scopes reuse to one server render; there is no module-global session cache. Money queries still use the authenticated Supabase server client and their existing household predicates/RLS.

## Implementation

- `app/[locale]/(product)/money/transactions/page.tsx` replaces the manual sequential gate with `requireProductSession()` and traces the session gate and event-loader spans.
- `app/[locale]/(product)/money/transactions/new/page.tsx` and `app/[locale]/(product)/money/transactions/[id]/page.tsx` reuse the same canonical gate because they had the same sequential route pattern.
- `modules/platform/application/perf-trace.ts` adds semantic operation constants for those two spans.
- `tests/unit/transactions-list-progressive-boundary.test.tsx` verifies the shared gate is used before List loaders and that unauthenticated List/Add/Detail routes redirect before data loading.

No Phase 6 change was made to the event scan, completion predicate, filters, cursor, pagination, transaction reads, Detail audit/tag/transfer pairing, or Add form/loading behavior.

## Runtime overlap

Measurements used a frozen Phase 5 control and the Phase 6 candidate in isolated local dev-server copies, with the same authenticated browser session, backend, locale, and 440 × 900 viewport. Each measured click started from a full Money-page load to reset Next's client route cache, then used the actual client-side Money → Transactions List link. Ten warm samples per arm are used below. A single post-restart candidate sample reached first rows in 842 ms; it has no paired cold control and is excluded from the comparison.

The control timestamps show `getUser` ending before membership starts (about 0–1 ms between spans). In Phase 6, membership started before `getUser` ended in all ten warm samples. The measured overlap was 263–363 ms, with 280.5 ms p50 / 346 ms p75. This is the intended parallel topology: the membership query starts from the verified subject and the gate still waits for both authoritative results.

## Request counts

Warm Money → List counts per RSC request. Helper invocations and underlying requests are distinguished:

| Operation                                                      | Phase 5 control | Phase 6 | Evidence                                                                       |
| -------------------------------------------------------------- | --------------: | ------: | ------------------------------------------------------------------------------ |
| Proxy `getClaims` invocation                                   |               1 |       1 | One invocation per request; no warm JWKS fetch                                 |
| Route verified-subject `getClaims` invocation                  |               1 |       1 | In the control this is reached by the loader gate; in Phase 6 by the page gate |
| `getUser` / Auth request                                       |               1 |       1 | One span and one Auth request                                                  |
| Active membership lookup / PostgREST request                   |               1 |       1 | One resolver span and one request                                              |
| Additional membership HTTP read from layout/page/loader        |               0 |       0 | Request-scoped cache reuse                                                     |
| Transaction event scan                                         |               1 |       1 | One scan request per measured first page                                       |
| Transfer completion for the representative complete first page |               0 |       0 | Phase 5 completeness predicate succeeds                                        |

The page's direct `resolveActiveMembership()` call is replaced by `requireProductSession()`; it does not create a second membership request. The loader retains its internal authorization gate and shares the server-render session. `auth.getClaims()` invocation count alone is not treated as a remote fetch; warm traces recorded no JWKS HTTP fetch.

## Performance

Times are milliseconds. Parentheses show p75; delta is Phase 6 minus control p50. Route total is the Next dev-server request span. Browser rows means the first 25 transaction rows became visible. No medians of overlapping spans are added together.

| Metric             | Phase 5 control p50 (p75) | Phase 6 p50 (p75) |  Δ p50 |
| ------------------ | ------------------------: | ----------------: | -----: |
| `getUser`          |               269.5 (276) |       290.5 (353) |    +21 |
| Active membership  |               278.5 (284) |         302 (314) |  +23.5 |
| Session gate total |                 576 (586) |       334.5 (373) | −241.5 |
| Event loader       |                 319 (340) |       319.5 (387) |   +0.5 |
| Route total        |                 931 (977) |       707.5 (780) | −223.5 |
| Click → first rows |           1,087.5 (1,135) |         864 (925) | −223.5 |

The primary browser p50 improved by about 20.6%. The event-loader span stayed effectively unchanged at p50; its p75 varied with backend latency. The matched run's RSC duration was 933.5 / 979 ms p50/p75 in control and 709.5 / 785 ms in Phase 6. Response-end → first-row tail stayed small: 131 / 137 ms in control and 141 / 156 ms in Phase 6.

## Add/Detail side effects

One browser sample per route confirmed the shared gate works outside List. List → Add showed the initial amount, account, and date fields in 1,402 ms. List → an ordinary transaction Detail showed its hero in 4,608 ms. These are directional end-to-end samples with no paired control and include the routes' other work; they are not attributed to the session gate. No form fields, reference loading, transaction reads, or Back implementation were changed by Phase 6.

## Phase regressions

- **Phase 1:** In the browser, List → ordinary Detail → app Back restored all 25 rows. Server List request count was unchanged across the app-Back action: 14 before, 14 after (zero List RSC on return).
- **Phase 2:** Add's amount/account/date fields were visible on first usable render. The existing progressive-field tests passed.
- **Phase 4:** Filter-option and tag-reference promises remain outside the List row critical path. The progressive-boundary test passed with those references pending.
- **Phase 5:** The representative complete first page made zero transfer-completion requests. Event tests still cover the incomplete-group completion fallback; all seven event tests passed.

## Security

Unauthenticated routes redirect before their data loaders; users without active membership go to onboarding; subject/user and membership/user mismatches fail closed. The session tests cover missing verified subject, failed `getUser`, absent membership, mismatched membership, and overlap. The ownership/RLS contract tests passed. Membership and household authority remain server-derived, current per request, and protected by the normal authenticated client/RLS path. No household switch was performed in the browser; no identity or membership data is cached across requests.

No database object, migration, RLS policy, RPC, or service-role path changed.

## Validation

- Focused session, List, event, navigation, ownership/RLS, Phase 5 UI, and Add-form checks: **69 passed** across 8 files.
- `npm run lint`: **passed**.
- `npm run typecheck`: blocked by two existing translator type errors in untouched `app/[locale]/(product)/home/home-streaming-sections.tsx` at lines 99 and 340.
- `npm run test`: **1,764 passed, 5 failed** across 259 files. The failures are the same unrelated areas already recorded in Phase 5: English/Vietnamese message-key parity, long account-name wrapping, and three account-presentation tests missing `NextIntlClientProvider`.
- Build was not run: typecheck already fails in an untouched Home component, and the main authenticated dev server uses the shared root `.next` output.

## Remaining bottleneck

The unchanged event loader is now a comparable discrete span at about 320 ms p50 / 387 ms p75. Phase 6 did not optimize it. The small post-response browser tail does not justify a React-rendering change.

**TRANSACTIONS PHASE 6 SUCCESS — PROCEED TO TRANSACTIONS PHASE 7**
