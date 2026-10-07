# Accounts Phase 10 — Performance Closeout & Final Baseline

**Date:** 2026-10-05  
**Scope:** Read-only closeout of Accounts Phases 1–9. No performance code was changed.

## Executive summary

The Accounts flow is ready to close. In the final authenticated browser pass, the five-sample warm p50 was 903 ms to Accounts, 467 ms to the Create Account form, 554 ms to the initial Create Card form, 865 ms to the liquid-account hero, and 1,168 ms to the credit-card hero. App Back restored the prior Accounts page in a median of 68–79 ms, with zero browser-visible RSC requests across the four tested return routes.

Compared with the original historical baseline, these p50s are directionally lower by about 55–68% on initial screens and 58–65% on detail heroes. Back is about 94–96% faster. This is not a paired benchmark: the original report used a different run and navigation instrumentation. The complete final route set showed no functional, locale, or horizontal-overflow regression.

## Final performance baseline

Measured in the authenticated local development app at the Vietnamese locale. One fresh-page pass was followed by five warm complete flows. A flow visited Accounts, both create routes, a liquid-account detail, and a credit-card detail, using the visible controls and app Back. Timings run from the native accessibility click to the first useful screen marker. p75 uses the standard Type 7 percentile for five samples. “Cold-ish” means a fresh page after reload with an already authenticated browser and warm server; it is not a cold process or sign-in measurement.

| Screen or action                 | Original historical p50 | Final warm p50 | Final warm p75 | Directional p50 change |
| -------------------------------- | ----------------------: | -------------: | -------------: | ---------------------: |
| Accounts directory               |                2,021 ms |         903 ms |         911 ms |                   −55% |
| Create Account, initial controls |                1,478 ms |         467 ms |         470 ms |                   −68% |
| Create Card, initial controls    |                1,699 ms |         554 ms |         964 ms |                   −67% |
| Liquid-account detail hero       |                2,441 ms |         865 ms |       1,184 ms |                   −65% |
| Credit-card detail hero          |                2,787 ms |       1,168 ms |       1,193 ms |                   −58% |
| Back from Create Account         |                1,779 ms |          79 ms |          86 ms |                   −96% |
| Back from Create Card            |                1,274 ms |          77 ms |          79 ms |                   −94% |
| Back from liquid detail          |                1,329 ms |          68 ms |          73 ms |                   −95% |
| Back from card detail            |                1,204 ms |          77 ms |          79 ms |                   −94% |

Historical values are from `accounts-navigation-performance.md`; final values are this closeout’s five warm samples. The original and final figures are directional comparisons, not same-run controls. Browser timings were collected with direct native accessibility clicks; server development, browser, and route-restore behavior are part of the observed experience.

The one fresh-page pass reached the Accounts directory in 947 ms, Create Account in 495 ms, Create Card initial controls in 540 ms, the liquid hero in 867 ms, and the card hero in 1,096 ms. It is reported separately and excluded from warm percentiles.

### Deferred readiness

| Secondary content                   | Final warm p50 | Final warm p75 | Median delay after its route’s initial marker |
| ----------------------------------- | -------------: | -------------: | --------------------------------------------: |
| Create Card linked-account selector |       1,525 ms |       1,552 ms |                     588 ms after initial form |
| Liquid-account recent activity      |       1,289 ms |       1,515 ms |                             331 ms after hero |
| Credit-card ancillary content ready |       1,967 ms |       2,049 ms |                             772 ms after hero |

The credit-card ancillary marker required payment accounts, installment action, and activity to be present. Payment-account and installment markers were absent at the hero marker in all six final flows and appeared later. Activity was already present at the hero marker in these flows, so these stopwatch samples alone do not establish its completion order. The route composition and existing tests establish that card activity is not awaited by the hero path.

The card hero stayed connected to the DOM at the same bounds while deferred sections appeared in the browser probe. No layout shift was observed in that probe.

## Phase 1–9 composition verified

- **Phase 1 — session gate:** Primary routes use a request-cached verified session resolver. Historical server traces showed one user verification and one active-membership lookup per route, with no repeated gate reads. Warm gate p50s were 670 ms for Accounts, 291 ms for Create Account, 280 ms for Create Card, 290 ms for liquid detail, and 275 ms for card detail.
- **Phase 2 — return navigation:** App Back restores the same-document history entry, query, and scroll position. The final browser pass restored the Accounts route with no RSC request; a scroll probe restored the exact previous scroll offset. Direct-entry fallbacks for all four route variants replaced in place to localized Accounts, and browser Forward returned to the detail route.
- **Phase 3 — create routes:** Create Account does not fetch the account directory; household currency is requested asynchronously for the receipt path. Create Card defers account-choice loading until its optional linked-account selector needs it. Initial controls remained usable while secondary choices loaded.
- **Phases 4–5 — liquid detail:** Generic account-directory loading was removed from the hero path. The selected balance read overlaps account context, and recent activity loads separately. Historical Phase 5 tracing confirmed selected-balance/context overlap in 10/10 samples.
- **Phases 6–8.1 — card detail:** The hero waits for selected-account identity/currency/ownership, balance, card settings, and month summary. Billing items, installments, eligibility, and linked-payment-account choices remain outside the hero wait. The card route does not request recent transactions. Phase 8.1 paired warm samples measured hero p50/p75 of 1,394/1,491 ms with overlap versus 1,684/2,071 ms in its serial control. The final browser pass confirmed deferred readiness and hero stability.
- **Phases 9–9.2 — ownership relation:** Card owner data is embedded in the selected account read, removing a follow-up owner query. The authenticated PostgREST/RLS comparison retained ownership capability and fingerprints. For the personal partner-owned card, the traced critical path fell from eight operations to seven; the embedded relation added 136 bytes and about 10 ms to account-query p50. Card settings/month reads overlapped the account read in 4/10 Phase 9.2 samples, down from 10/10 in Phase 8.1 after account loading became faster; same-run summary p50 improved 42 ms and hero p50 improved 228 ms. This scheduling variance is recorded as a caveat, not hidden.

Full phase evidence and implementation detail remain in the linked historical reports under `.agents/audits/accounts-navigation-phase-*.md` and `.agents/audits/accounts-navigation-phase-9-2.md`.

### Session baseline

The route/session-gate tests and Phase 1 authenticated traces confirm one `getUser` and one active-membership read per primary forward route, started in parallel and deduplicated within the request. Phase 8.1's representative authenticated gate timing was p50 326 ms / p75 354 ms. The final browser pass did not add server-side Supabase instrumentation, so those are historical gate timings, not a new Phase 10 measurement. Successful same-document Back restores do not re-enter the route gate; the final browser trace observed zero RSC requests for each restore.

## Request topology

These server-side operation counts come from the historical authenticated server/PostgREST traces and current route composition. The final browser run measured Next.js RSC requests only; it did not re-instrument each server-to-Supabase operation.

| Destination                                     | Critical remote count | Deferred remote count | Main waves                                                                                                                                                                                         |
| ----------------------------------------------- | --------------------: | --------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accounts directory                              |                     5 |                     0 | Verified session gate; household and two purpose-built list/balance RPC reads.                                                                                                                     |
| Create Account                                  |                     2 |                     1 | Verified session gate; household currency is requested asynchronously for the receipt path.                                                                                                        |
| Create Card                                     |                     2 |                  3–4* | Verified session gate; optional `listAccounts` picker fan-out (household, liquid accounts, conditional owner IDs, balances).                                                                       |
| Liquid-account detail, personal scope           |                     5 |                     1 | Verified session gate; selected account/currency context and selected balance; then streamed recent activity. Embedded owner data removes a follow-up read.                                        |
| Credit-card detail, personal partner-owned card |                     7 |                  8–9* | Verified session gate; account/currency and balance; settings/month summary after active-card context. Billing, installments, eligibility, and payment-account choices stay outside the hero wait. |

Counts for conditional owner and related-transaction reads depend on household data. These are remote application operations, not the browser’s RSC request count. In each of the five final warm laps, each forward route transition emitted one browser-visible RSC request and each app Back emitted zero.

\* Picker/deferred counts are source-derived and data-dependent. The payment picker is typically four reads when owner resolution is needed; eligibility is two parallel reads plus an optional related-transaction read. The browser closeout did not capture a fresh server-side trace for those reads.

## Correctness and browser checks

- Used the existing authenticated browser session and a representative personal partner-owned liquid account and credit card. No forms were submitted and no financial data was changed.
- Confirmed the correct partner-ownership presentation: personal-scope controls remained disabled; household-scope controls remained available. The browser check recorded booleans only; account/card names, balances, identifiers, and response bodies are intentionally excluded.
- Confirmed Vietnamese locale preservation, return-query preservation, exact scroll restoration, localized direct-entry fallback, and coherent browser Forward navigation.
- At 390, 440, 768, and 1,280 px, checked Accounts, both create routes, liquid detail, card detail, and resolved card content. All checked screens had no horizontal overflow.
- In the six final card samples, the hero marker appeared before payment-account and installment readiness. Deferred completion did not replace or move the hero in the DOM/bounds probe.
- The focused passing suite covers authoritative balance behavior (including archived-account and balance/owner failures), embedded ownership semantics, billing calculations, due-date behavior, installment calculations, isolated activity/billing errors, fail-closed installment/eligibility states, and disabled payment when account choices fail. It also covers household-mutable, partner-personal read-only, and former-owner read-only states.
- `credit-card-billing` verifies settled-item exclusion, available-credit/utilization boundaries, and statement/due-date rules; `credit-card-installments` verifies installment calculations. Balance overlap tests confirm one selected balance read and that RPC failure is not converted to zero. The read-only browser smoke verified the representative hero and ownership action states without recording financial values.
- The full run’s three Phase 6 presentation failures stopped at missing `NextIntlClientProvider` context, so those component assertions did not complete. Long card identity wrapping also has a separate failing presentation assertion. These existing failures remain visible in the validation result below.
- Dedicated focused assertions for card-settings failure, billing-month failure, and cross-household detail denial were not present in the selected suite, so those exact negative cases were not separately re-proved in this closeout. The representative flow showed no capability or rendering regression.

This is a performance and composition closeout, not a separate re-audit of every prior theme and accessibility check; Phase 2 contains the earlier light/dark, reduced-motion, keyboard, and focus evidence.

## Remaining latency and attribution limits

### Application-created critical waterfalls

No remaining unnecessary sequential remote dependency was identified in the verified hero paths. The earlier session serialization, Back route reloads, Create Account inventory wait, liquid balance serialization, card full-page wait, card summary serialization, and owner follow-up were removed in Phases 1–9. Card settings/month overlap is less frequent after faster account loading (4/10 in Phase 9.2 versus 10/10 in Phase 8.1); the Phase 9.2 same-run summary and hero medians improved, so the overlap frequency is not a current critical regression.

### Required application work and service floor

Accounts still needs the full authenticated directory data. Detail heroes still require verified session/membership, selected-account ownership and currency, authoritative balance, and card billing summary where applicable. These are required reads. The measured timings include the Next development server and browser; remote `getUser`, membership, Supabase/PostgREST RTT, and database service time were not independently timed, so their share of the remaining critical-path latency cannot be quantified here.

### Deferred work

- The Create Card selector appears a median 588 ms after the form controls.
- Liquid recent activity appears a median 331 ms after its hero.
- Credit-card ancillary content completes a median 772 ms after its hero.

These are secondary readiness measurements, not hero bottlenecks. The final stopwatch did not split ancillary work by request source. The warm sample is small (n=5), and the fresh-page pass retained an authenticated session.

## Validation

- Focused Accounts validation: **19 files passed, 163 tests passed**. This includes routes/session, forms, balances/overlap, ownership, billing, installments, eligibility, progressive rendering/failures, card scheduling, and Back navigation.
- `npm run lint`: **passed**.
- `npm run typecheck`: **failed** at two existing `HomeTranslator` type mismatches in `home-streaming-sections.tsx` (lines 99 and 340); no Accounts file is implicated.
- `npm run test`: **254 files passed, 1,742 tests passed; 3 files / 5 tests failed**. Existing failures: EN/VI `money` message-key parity; three Phase 6 presentation tests without `NextIntlClientProvider`; and the long card identity wrapping assertion in `money-ia-privacy.test.tsx`.
- `npm run format:check`: **failed** on 195 repository files with formatting drift; the closeout file itself passes targeted Prettier validation. The report was not used to reformat unrelated files.
- Production build: **skipped** because typecheck fails on the unrelated Home translator errors.
- `git diff --check` for the closeout report: **passed**.

## Recommendation

No Phase 11 optimization is justified by the evidence collected. Preserve the current phase composition, route boundaries, and ownership behavior; close the Accounts performance workstream.

**ACCOUNTS PERFORMANCE WORKSTREAM COMPLETE — READY TO CLOSE**
