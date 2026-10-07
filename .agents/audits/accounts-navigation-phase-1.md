# Accounts Phase 1 — Parallel Session Gate Optimization

Measured 2026-10-04. Scope was limited to the Accounts route session gate. No domain loader, Back behavior, rendering boundary, account/card calculation, or mutation code changed.

## Implementation

The shared page modules now call the existing `requireProductSession()` gate before starting page loaders:

- `app/[locale]/(product)/money/accounts/page.tsx` — Accounts List.
- `app/[locale]/(product)/money/accounts/account-create-page.tsx` — Create Account and Create Credit Card.
- `app/[locale]/(product)/money/accounts/[id]/page.tsx` — Account Detail and Credit Card Detail.

Before, each page normalized the locale, awaited `getSessionUser()`, then awaited `resolveActiveMembership(user.id)`, and only then started its loaders. Now the page calls `requireProductSession()`, which normalizes/sets the locale, calls the existing request-cached `getSessionMembership()`, and preserves the localized Login and Onboard redirects.

The loader `Promise.all` blocks and all account/card data APIs remain unchanged. The only new test file, `tests/unit/accounts-route-session-gate.test.ts`, verifies the Accounts List, both create variants, and shared detail route redirect before financial loaders execute.

## Security correctness

`getSessionMembership()` remains the sole session resolver. It starts remote `getSessionUser()` verification, gets the verified claims subject, resolves membership for that verified subject in parallel, and returns a context only when the user ID and membership user ID agree. Missing claims, missing user, mismatches, or absent membership fail closed. `requireProductSession()` sends unauthenticated users to the localized Login route and authenticated users without an active membership to Onboard.

Both `getSessionMembership()` and the downstream `assertMoneyActionAllowed()` path retain React request-local caching. No cross-request cache, claims-only identity, service-role read, client-provided ID, RLS change, ownership change, `canMutate` change, or action authorization change was introduced. The loader-level session calls continue to share the canonical context for that render.

Existing tests cover valid session context, claims/user and membership/user mismatches, per-request cache isolation, downstream helper deduplication, and Login/Onboard redirects. The added route test verifies rejection stops all account/card loaders.

## Same-run benchmark methodology

- Control was a frozen copy made before the route edit. After used the Phase 1 source. Both ran in the same local environment with Next.js 16.3.1, React 19.2.3, Next development mode/Turbopack, the same authenticated Brave profile, Vietnamese `/vi` routes, backend, environment, and `VINHA_PERF_TRACE=1` instrumentation. The profiling servers used separate ports and the same server settings.
- Each arm used one cold-ish first pass and three warm repetitions through Money → Accounts, Create Account → Accounts via app Back, Create Credit Card → Accounts via app Back, Account Detail → Accounts via app Back, and Credit Card Detail. An extra app Back from Credit Card Detail was also observed. No financial form was submitted.
- Browser elapsed time was recorded from click to each page’s useful marker (`money-accounts-directory`, `account-create-page`, `account-detail-hero`, or `credit-card-hero`). Server traces recorded session and outbound request spans for all nine deliberate page navigations in a full lap (five destinations plus four app Back navigations).
- Production mode was attempted on both pre-change and after source. Both optimized builds compiled, then type-checking stopped on the same unrelated `Translator<AppMessages, "home">` / `HomeTranslator` incompatibilities in `app/[locale]/(product)/home/home-streaming-sections.tsx` at lines 99 and 340. So the primary before/after comparison uses the same development mode on both arms. Dev timings include normal dev-server and hosted-service variance; first-pass values are cold-ish, not a claim of a fully cold process.
- Browser automation did not expose Resource Timing entries in this run. Click-to-useful timings come from the browser navigation loop; remote counts and session spans come from server-side traces. The report contains no cookies, tokens, emails, user/household/account/card IDs, or financial payloads.

### Cold-ish first pass

| Transition                    |  Control |    After |
| ----------------------------- | -------: | -------: |
| Money → Accounts List         | 3,076 ms | 2,709 ms |
| Accounts → Create Account     | 3,243 ms | 1,930 ms |
| Accounts → Create Credit Card | 2,757 ms | 1,833 ms |
| Accounts → Account Detail     | 2,879 ms | 2,561 ms |
| Accounts → Credit Card Detail | 2,856 ms | 2,316 ms |

### Warm click-to-useful performance

The values below are medians of the three warm repetitions in each arm.

| Transition                    | Phase 1 control |    After |  Saved | Improvement |
| ----------------------------- | --------------: | -------: | -----: | ----------: |
| Money → Accounts List         |        2,070 ms | 1,436 ms | 634 ms |       30.6% |
| Accounts → Create Account     |        1,370 ms | 1,467 ms | -97 ms |       -7.1% |
| Accounts → Create Credit Card |        1,762 ms | 1,061 ms | 701 ms |       39.8% |
| Accounts → Account Detail     |        1,901 ms | 1,241 ms | 660 ms |       34.7% |
| Accounts → Credit Card Detail |        2,480 ms | 1,980 ms | 500 ms |       20.2% |

Create Account was 97 ms slower at the warm median in the after arm. The overall navigation measurements are noisier than the direct gate spans below; this unfavorable result is retained in the table.

## Session performance

Gate latency is measured from the first `auth.getUser` span start until both the user and active-membership work are ready. Warm values are medians across three repetitions. The overlap column is the measured intersection of the `getUser` and membership-resolution spans. “First non-membership REST/RPC” is the first traced REST/RPC fetch after context readiness, excluding `household_members` paths. The trace hook has no explicit loader-start event.

| Destination        | Before gate | After gate |  Saved | Reduction | After overlap | First non-membership REST/RPC after ready |
| ------------------ | ----------: | ---------: | -----: | --------: | ------------: | ----------------------------------------: |
| Accounts List      |    1,087 ms |     670 ms | 417 ms |     38.4% |        452 ms |                                      6 ms |
| Create Account     |      556 ms |     291 ms | 265 ms |     47.7% |        280 ms |                                      8 ms |
| Create Credit Card |      917 ms |     280 ms | 637 ms |     69.5% |        274 ms |                                      6 ms |
| Account Detail     |      552 ms |     290 ms | 262 ms |     47.5% |        268 ms |                                      8 ms |
| Credit Card Detail |      571 ms |     275 ms | 296 ms |     51.8% |        268 ms |                                      8 ms |

Before, measured overlap was 0 ms in all 15 warm route samples: `getUser` completed before membership resolution began. After, every warm route had direct overlap (the table reports its median). The one cold-ish session-gate sample also showed the same pattern:

| Destination        | Control gate | After gate | Control overlap | After overlap |
| ------------------ | -----------: | ---------: | --------------: | ------------: |
| Accounts List      |       711 ms |     546 ms |            0 ms |        539 ms |
| Create Account     |     1,257 ms |     296 ms |            0 ms |        280 ms |
| Create Credit Card |       550 ms |     293 ms |            0 ms |        289 ms |
| Account Detail     |       548 ms |     295 ms |            0 ms |        290 ms |
| Credit Card Detail |       522 ms |     289 ms |            0 ms |        276 ms |

The trace therefore confirms the intended sequence: the control awaited user verification and then membership; after, membership resolution overlapped remote user verification and the context was released when both were valid. Excluding `household_members` reads, the first REST/RPC fetch followed context readiness within 10–21 ms in control and 5–16 ms after, in the warm samples.

## Request counts

Each destination had exactly one remote `getUser`, one `membership.resolve`, zero token-refresh requests, and zero JWKS HTTP requests in the cold-ish and warm traces. The verified claims subject remained required. Control and after had identical outbound request-category counts for every destination.

| Destination        | Total remote fetches | `getUser` | Active membership resolutions | `household_members` HTTP paths | Other REST | RPC | Refresh | JWKS |
| ------------------ | -------------------: | --------: | ----------------------------: | -----------------------------: | ---------: | --: | ------: | ---: |
| Accounts List      |                    5 |         1 |                             1 |                              1 |          1 |   2 |       0 |    0 |
| Create Account     |                    6 |         1 |                             1 |                              2 |          2 |   1 |       0 |    0 |
| Create Credit Card |                    6 |         1 |                             1 |                              2 |          2 |   1 |       0 |    0 |
| Account Detail     |                   10 |         1 |                             1 |                              2 |          5 |   2 |       0 |    0 |
| Credit Card Detail |                   19 |         1 |                             1 |                              2 |         14 |   2 |       0 |    0 |

The second `household_members` path on create/detail is an unchanged domain owner-membership read, not a second active-session resolution. The paired trace counts match exactly before and after. Detail totals in this selected-record run are one lower than the earlier representative audit counts (11/20); optional domain branches can change those totals, and no domain code or request shape changed here.

## Browser verification

Using the authenticated Brave browser, the route flow rendered Accounts List, Create Account, Create Credit Card, Account Detail, and Credit Card Detail in Vietnamese. The existing app Back link returned to Accounts after each detour, the `/vi` locale remained in URLs, and no Login/Onboard redirect or unauthorized screen appeared. The expected page markers appeared, and the server trace contained only the nine deliberate route loads in a full lap, with one session pair per load.

Account and card rows/details rendered from the same backend in both arms. No financial form was submitted. The browser verification was a navigation/render smoke check; no account/card payload or financial value was copied into the report. No financial formula, ownership, visibility, `canMutate`, eligibility, billing, activity, or action code changed.

## Validation

- Focused session tests: **20 passed** across route-gate, `session-membership`, and `require-product-session` tests.
- Focused session/account/card/ownership suite: **89 passed** across 12 files, including account balances/eligibility, card billing/installments, ledger accounts, ownership RPC/RLS, forms, and detail presentation.
- Full unit suite: **1,685 passed, 5 failed** across 253 files. All five failures reproduced when the same three test files were run against the frozen pre-change source copy, confirming they predate Phase 1:
  - `tests/unit/i18n-messages.test.ts`: English/Vietnamese `money` key parity differs by one key (2,325 vs. 2,326).
  - `tests/unit/money-ia-privacy.test.tsx`: one presentation test lacks a `NextIntlClientProvider` context.
  - `tests/unit/phase-6-accounts-presentation.test.tsx`: three presentation tests lack a `NextIntlClientProvider` context.
- `npm run lint`: passed after removing the now-unused page imports/local.
- `npm run typecheck`: blocked by the pre-existing translator type incompatibilities in `home-streaming-sections.tsx` (lines 99 and 340), outside this change.
- `npm run build`: optimized compilation passed in both arms; both builds stopped at that same pre-existing type-check error.
- `npm run format:check`: repository-wide check reports existing formatting differences across unrelated files. Prettier checks passed for all three changed page files and the new route test; the report is also checked after writing.
- `git diff --check`: passed.

## Remaining bottleneck

The next measured Accounts bottleneck is `listAccounts()` delaying the first Create Account and Create Credit Card controls while it loads account, owner, and balance data used by later/optional form fields. That read and both forms remain unchanged in Phase 1.

**ACCOUNTS PHASE 1 SUCCESS — PROCEED TO ACCOUNTS PHASE 2**
