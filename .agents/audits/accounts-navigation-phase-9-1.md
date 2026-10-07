# Accounts Phase 9.1 — Runtime Verification of Embedded Ownership Evidence

Collected 2026-10-05. Result: **INCONCLUSIVE**. No Phase 10 implementation is recommended until authenticated runtime evidence is available.

No account, household, or membership IDs; financial values; credentials; cookies; raw responses; or request IDs are included in this report.

## Environment

The required same-run benchmark could not be established. The existing Brave profile had a Family Finance card-detail tab on a second loopback port, but the tab was marked crashed. Attaching to it failed with a timeout at CDP command `Emulation.setFocusEmulationEnabled`. Local listener inspection showed only the shared app server on port 3000; no control/candidate pair or second benchmark server was running.

The shared server and its open Accounts tab do not provide a frozen Phase 8 control. No disposable source copies, matched control/candidate sessions, authenticated card visits, interleaved samples, or temporary timing instrumentation were created. I did not substitute Phase 8 historical figures or unauthenticated requests for the required same-run evidence.

The Phase 8.1 same-run figures in [the prior audit](./accounts-navigation-phase-8-1.md) are historical context only and are not used as a Phase 9 comparison. Both arms would need to run under identical dev-mode conditions if the known typecheck baseline continues to prevent a production build.

## Authenticated embed proof

**Not collected.** No authenticated PostgREST response was observed, so the actual embedded relation shape (`null` or one membership object), owner-ID match, household match, and active-state value remain unverified at runtime. No live RLS behavior is claimed.

The deployed composite FK and RLS catalog findings are recorded in [the Phase 9 audit](./accounts-navigation-phase-9.md). Catalog metadata is not authenticated runtime proof.

## Capability equivalence

**Not collected at runtime.** No same-account Phase 8/Phase 9 model comparison or sanitized capability fingerprint was produced. Equality for account type, scope, owner status, `isOwnedByMe`, `canMutate`, archived state, currency, availability, ownership badge, and action state remains unverified in the running app.

Source and unit coverage remain supportive evidence only. The Phase 9 query checks that the embedded membership exists, matches the account owner ID and authorized household, and has `is_active === true` before granting active-owner evidence. The existing mapper remains the capability authority. The focused regression run below passed the ownership, relation failure, session, card failure, selected-balance, and navigation suites.

Credit-card financial equivalence (limit, outstanding, available credit, utilization, statement/due context, and currency) was not measured or fingerprinted in a browser.

## Request counts

No runtime requests were counted. The Phase 9 source removes the separate selected-detail owner lookup and selects owner evidence in the account query, but source inspection is not request-count proof.

| Critical request           | Frozen Phase 8 |       Phase 9 | Runtime delta |
| -------------------------- | -------------: | ------------: | ------------: |
| User/session membership    |  Not collected | Not collected | Not available |
| Selected account/context   |  Not collected | Not collected | Not available |
| Selected balance RPC       |  Not collected | Not collected | Not available |
| Owner-membership follow-up |  Not collected | Not collected | Not available |
| Card settings/months       |  Not collected | Not collected | Not available |

## Context cost

No response headers, bodies, decoded payload sizes, or mapper timings were captured.

| Metric                 |       Phase 8 |       Phase 9 |         Delta |
| ---------------------- | ------------: | ------------: | ------------: |
| Account query headers  | Not collected | Not collected | Not available |
| Account query complete | Not collected | Not collected | Not available |
| Decoded payload bytes  | Not collected | Not collected | Not available |
| Mapping time           | Not collected | Not collected | Not available |

## Owner-wave removal

No server spans were captured. The required control sequence (`account context → owner follow-up`) and candidate sequence (`account context → capability`) were not observed. Owner-wave duration and Phase 9 zero-duration claim are therefore **not measured**.

## Performance

There are no valid Phase 9 warm samples, so min, p50, p75, and max cannot be reported for either arm. Session, account context, owner follow-up, selected balance RPC, `getAccount()`, summary readiness, and route completion are all **not collected**. Historical Phase 8.1 measurements are not a comparator.

No actual Accounts click was instrumented in the browser. Click-to-RSC start, hero insertion/readability, full RSC completion, and their p50/p75 values are **not collected**.

## Phase 5/8 regression

The focused selected-balance overlap and account-detail scheduling suites passed (see Validation). This supports the existing source/test contract, not live timing. No runtime balance-start-before-context-end span was observed, and no runtime evidence verifies that settings/months start before `getAccount()` ends.

## Liquid Detail side effect

No authenticated Liquid Detail visit was measured. The shared context path and existing unit coverage are documented in [the Phase 9 audit](./accounts-navigation-phase-9.md); live owner request count, displayed balance, ownership badge, mutation state, and deferred activity behavior remain unverified in this run.

## Household regression

No household card/account runtime sample was collected. The previous source and unit evidence says household capability does not require owner evidence; runtime request count, context cost, and capability equivalence remain unverified.

## Query failure and evidence validation

The 105 focused regression tests passed across the 12 named account, ownership, session, card-failure, balance, and navigation files. In particular, the relation-query failure remains distinguishable from successful null/malformed evidence in the tested safe-error path. These tests do not establish authenticated RLS behavior.

Source inspection confirms strict checks for embedded membership presence, owner ID equality, authorized-household equality, and boolean `is_active === true`. There is no fallback owner query. These are source findings, not proof of the returned authenticated relation shape.

## Validation

- Focused regression: **105 passed across 12 files**.
- Full tests: **1,742 passed, 5 failed across 3 files**. The failures match those already recorded in Phase 9: English/Vietnamese `money` key parity, three missing `NextIntlClientProvider` cases, and the long-card-name `truncate` assertion.
- `npm run lint`: passed.
- `npm run typecheck`: blocked by the two previously recorded `HomeTranslator` / `Translator` errors in `home-streaming-sections.tsx` (lines 99 and 340).
- No build or E2E run: production-build/typecheck baseline is still blocked, and the authenticated browser benchmark could not be established.
- No source, schema, or database changes were made for Phase 9.1.

## Conclusion

**INCONCLUSIVE.** Phase 9's embedded ownership optimization has not been verified in an authenticated PostgREST runtime, under RLS, against a frozen same-run Phase 8 control, or through real request/span/browser measurements. Passing unit suites and catalog/source inspection do not satisfy those authorization-adjacent runtime requirements.

## Recommended Phase 10

No Phase 10 direction is supported by the available evidence. Do not start Phase 10. Re-run this verification when a healthy authenticated browser tab and isolated control/candidate servers are available; then choose among A–D from measured results.

**ACCOUNTS PHASE 9.1 INCONCLUSIVE — DO NOT START PHASE 10**
