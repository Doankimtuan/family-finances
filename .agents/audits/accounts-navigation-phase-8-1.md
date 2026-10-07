# Accounts Phase 8.1 — Runtime Verification of Credit Card Summary Overlap

Collected 2026-10-05. Runtime result: **VERIFIED BENEFICIAL**.

## Environment

- Two disposable copies of the same working tree ran Next.js 16.3.1 in dev mode on separate loopback ports. The shared dev server on port 3000 was left untouched.
- Both arms used the same authenticated development browser profile, active card, Vietnamese locale, and 1391×1359 viewport in a dedicated Brave tab. Each measurement began with an actual click from Accounts to the card.
- Arms were interleaved: one cold-ish card visit, then 10 warm visits per arm. No samples were mixed across environments.
- Temporary server markers recorded session, card context, balance RPC, owner validation, account completion, summary-ready, and route completion. Existing `VINHA_PERF_TRACE=1` instrumentation supplied database request start/end spans. Browser Resource Timing and a DOM observer recorded RSC start/end and hero insertion/readability.
- The fetch trace rounds network timestamps and durations to the nearest millisecond. Overlap values therefore have approximately 1 ms resolution. No IDs, credentials, raw values, or payloads were retained.
- The app ran in dev mode for both arms. The known repository typecheck baseline prevents treating this as a production-build benchmark.

## Control vs candidate

The candidate is the current Phase 8 route. It starts `getCreditCardDetail()` after the authorized account context identifies an active credit card, passing the already-running `getAccount()` promise.

The control uses the same current query, account context, UI, and deferred loaders, but starts `getCreditCardDetail()` only after the complete `getAccount()` result resolves. This freezes the pre-Phase-8 scheduling boundary while keeping the measured query path identical.

Only disposable copies and timing instrumentation were used. No production source or database changes were made in Phase 8.1.

## Runtime overlap

Overlap is the time from the settings/months request start until the earlier of its end or `getAccount()` completion.

| Phase 8 sample | Settings overlap (ms) | Billing months overlap (ms) |
| -------------- | --------------------: | --------------------------: |
| Cold-ish       |                   289 |                         289 |
| Warm 1         |                   279 |                         279 |
| Warm 2         |                   275 |                         275 |
| Warm 3         |                   302 |                         301 |
| Warm 4         |                   278 |                         609 |
| Warm 5         |                   308 |                         316 |
| Warm 6         |                   273 |                         272 |
| Warm 7         |                   272 |                         271 |
| Warm 8         |                   264 |                         264 |
| Warm 9         |                   298 |                         304 |
| Warm 10        |                   276 |                         270 |

Across the 10 warm Phase 8 samples, settings overlap was 10/10 (min 264, p50 277, p75 298, max 308 ms). Billing-month overlap was 10/10 (min 264, p50 277.4, p75 304.3, max 609 ms). Including the cold-ish visit, both overlapped in 11/11 Phase 8 samples.

The serial control had 0 ms overlap for both reads in all 11 visits. Its settings and billing-month requests began after `getAccount()` finished. Per-sample server spans and request counts are in [the sanitized evidence file](./accounts-navigation-phase-8-1-evidence.json).

## Critical timeline

Warm samples only (n=10); values are milliseconds, shown as p50 / nearest-rank p75. Stages overlap, so these medians should not be summed.

| Metric                                     |  Serial control |         Phase 8 | p50 change |
| ------------------------------------------ | --------------: | --------------: | ---------: |
| Session                                    |   308.4 / 386.5 |   325.5 / 353.6 |      +17.1 |
| Authorized card context                    |   301.0 / 326.8 |   360.0 / 405.3 |      +59.0 |
| Selected balance RPC                       |   297.7 / 315.1 |   289.0 / 388.9 |       −8.7 |
| Owner validation                           |   271.1 / 282.7 |   283.7 / 311.3 |      +12.6 |
| `getAccount()`                             |   592.5 / 632.6 |   670.9 / 853.3 |      +78.4 |
| Card settings                              |   512.5 / 604.0 |   299.5 / 309.0 |     −213.0 |
| Billing months                             |   495.0 / 582.0 |   490.5 / 609.0 |       −4.5 |
| Summary ready from session start           | 1542.8 / 1961.4 | 1271.2 / 1372.4 |     −271.6 |
| Server route completion from session start | 1543.7 / 1961.6 | 1271.8 / 1373.0 |     −271.9 |

The account result itself did not get faster. Phase 8 moved the settings/month wave earlier: summary readiness improved by 272 ms at p50 while settings/month query durations stayed in the same range. The selected balance RPC completed before owner validation began in 9/10 warm Phase 8 visits and before `getAccount()` completed in 10/10. Owner validation is the consistent final account-capability gate.

## Browser milestones

Warm samples (n=10); browser timings are measured from the actual Accounts link click. RSC response end includes the streamed deferred sections.

| Metric                        | Serial control p50 / p75 | Phase 8 p50 / p75 | p50 change |
| ----------------------------- | -----------------------: | ----------------: | ---------: |
| Click → RSC request start     |                2.4 / 2.7 |         2.6 / 3.3 |       +0.2 |
| Click → hero DOM inserted     |          1674.6 / 2061.5 |   1385.7 / 1483.5 |     −288.9 |
| Click → hero readable         |          1683.9 / 2070.7 |   1393.9 / 1491.2 |     −290.0 |
| Click → full RSC response end |          2114.1 / 2176.5 |   2122.2 / 2289.8 |       +8.1 |
| Summary ready → hero readable |              93.2 / 96.5 |       80.0 / 91.0 |      −13.2 |

Phase 8 made the visible hero 290 ms faster at p50 (17.2%) and 580 ms faster at p75 (28.0%). Full RSC response completion did not improve: its p50 was effectively flat, and its p75 was 113 ms slower. The browser therefore confirms a hero win while also showing that later streamed work dominates the full-response tail.

The single cold-ish observation was 6236 ms click-to-hero and 7302 ms to RSC response end for Phase 8; the control was 4978 ms and 5545 ms. These first-route values include dev startup/compile variance and are retained separately, not used for the warm conclusion.

Phase 7 recorded historical p50 values of 1625 ms for its RSC route and 1726 ms click-to-hero; Prototype B recorded 1420 ms RSC p50. Those are context only. This same-run control is the comparison used here, and current browser response-end timing includes the later deferred stream.

## Request counts

Each of the 11 visits in both arms made one of each critical request:

| Operation                                  | Serial control | Phase 8 |
| ------------------------------------------ | -------------: | ------: |
| `getUser`                                  |              1 |       1 |
| Active membership lookup                   |              1 |       1 |
| Selected account row                       |              1 |       1 |
| Household currency context                 |              1 |       1 |
| Selected-card balance RPC                  |              1 |       1 |
| Conditional owner validation for this card |              1 |       1 |
| Card settings                              |              1 |       1 |
| Billing months                             |              1 |       1 |

No duplicate selected account, settings, billing-month, or selected-card balance request appeared. The separate payment-account loader still performs its existing deferred account/balance batch. Billing items, installments/eligible purchases, and payment-account choices remained deferred in both arms.

## Financial equivalence

A temporary SHA-256 fingerprint compared the rendered hero, due summary, card settings summary, utilization/availability state, and action enabled/disabled state. The comparison matched across arms in 11/11 paired visits. This covers the displayed name, currency, ownership badge, limit, outstanding, available credit, utilization, statement/due context, mutation capability, and availability state. Raw values and hashes were not saved.

## Deferred and ownership regression

- In all 11 visits per arm, the payment-account, installment-action, and billing-activity readiness markers eventually appeared.
- The detail root, card hero, and due-summary nodes retained the same DOM identity from hero insertion through deferred resolution in 11/11 visits per arm.
- The live card caused one conditional owner-validation request per visit. The full mapped account result still gated the hero and all mutation controls.
- Eight focused suites passed: 82 tests covering Phase 8 scheduling, active-card gating, unavailable account/balance behavior, archived/invalid account boundaries, session gates, ownership UI (including partner/former-owner read-only behavior), progressive card failures, selected-balance overlap, and Back navigation.
- Source inspection confirms settings or month query errors still return an unavailable summary; no fabricated credit amount is built. No live fault injection was performed for settings/month failures or for invalid, liquid, archived, and former-owner fixtures.

Phase regressions checked lightly: Phase 1 session membership and Phase 2 Back tests passed; Phase 4/5 balance-overlap tests passed; Phase 6 deferred card sections and failure tests passed. Create flows were unchanged. Back request counts and other account types were not benchmarked in this run.

## Validation

- Focused regression suites: 82 passed across 8 files.
- `npm run lint`: passed.
- `npm run typecheck`: still fails on the existing `HomeTranslator` / `Translator` mismatch in `home-streaming-sections.tsx` at lines 99 and 340.
- `npm run test`: 1736 passed and 5 failed across 3 files; failures match the previously recorded baseline (message-key parity, long card name, and missing `NextIntlClientProvider`).
- `npm run format:check`: reports 195 pre-existing unformatted repository files. Both Phase 8.1 audit files pass targeted Prettier.

## Conclusion

**VERIFIED BENEFICIAL.** Runtime settings/month overlap is present in every Phase 8 sample. Same-run warm measurements show a repeatable improvement in server summary/route readiness and browser hero readability. Full RSC response completion remains limited by the deferred stream.

## Recommended Phase 9

Choose **B — optimize the ownership/capability wave**. In the measured candidate, owner validation is the final serial capability gate; the selected-card balance RPC had already completed before owner validation began in 9/10 warm visits. Removing the balance RPC alone is unlikely to improve the median hero time. No Phase 9 implementation was started.

**ACCOUNTS PHASE 8.1 COMPLETE — PHASE 8 VERIFIED, PROCEED TO PHASE 9**
