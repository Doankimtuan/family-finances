# Accounts Phase 9.2 — Runtime Verification of Embedded Ownership Evidence

Collected 2026-10-05. **Result: VERIFIED BENEFICIAL.** All reported times are milliseconds. The 10 warm-sample p50/p75 values use linearly interpolated type-7 percentiles and are rounded to the nearest millisecond.

The report and companion JSON contain timings, counts, booleans, and sanitized structural markers only. They contain no account or membership IDs, names, balances, limits, financial values, credentials, cookies, raw responses, or request IDs.

## Benchmark harness

- Recovered the benchmark with disposable source copies under `/tmp`: a frozen Phase 8 owner-follow-up control and a Phase 9 embedded-owner candidate. Both retained the same account context, balance overlap, card-summary scheduling, session path, and deferred work. The selected-account owner lookup/projection was the sole intended source difference. Temporary timing instrumentation was identical.
- Ran both copies in Next.js 16.3.1 dev mode with Turbopack on loopback ports 3121 and 3122. The copies used byte-identical `.env.local` contents and the same Supabase project. Port 3000 was not used or changed.
- Opened a fresh Brave tab with the user's existing authenticated profile. Normal cookie-backed authentication worked on both origins; Accounts and the selected detail opened without Login or Onboard redirects. Preflight and sampled requests exercised `auth.getUser`, membership resolution, and RLS. No session, JWT, user ID, membership, or financial row was manufactured. The only synthetic cookie was an instrumentation sample label.
- The server client is the app's `createSupabaseServerClient()`: it reads the browser session through Next cookies and uses the publishable/anon key. No service-role client is used by the selected-account query.
- Used the same existing personal credit card in both arms. It is personal, actively owned by the other household member, and read-only for the signed-in user. No financial records were created or changed.
- Collected one cold-ish browser detail navigation and 10 interleaved warm samples per arm. The cold-ish visit followed authenticated preflight, so it is a fresh detail click but not a cold Next.js compile. Warm samples were captured in a balanced control/candidate order. Browser timing used CDP RSC request/response events and the first visible, non-empty hero text. Settled visual fingerprints were captured after the full RSC response plus 400 ms.
- Stopped both benchmark servers, confirmed ports 3121/3122 were no longer listening, and removed the disposable copies.

## Authenticated embed proof

The candidate account query returned HTTP 200 through the normal cookie-backed server client. On the selected personal card, all 10 warm visits returned an embedded owner membership object and passed every structural check:

| Proof                                               | Result |
| --------------------------------------------------- | -----: |
| Relation returned as an object                      |  10/10 |
| Embedded owner matches account owner                |  10/10 |
| Embedded household matches authorized household     |  10/10 |
| `is_active === true`                                |  10/10 |
| Candidate owner evidence from the embedded relation |  10/10 |

Authenticated user and active-membership reads also succeeded in preflight. The candidate did not use a fallback owner query. The evidence came from the authenticated PostgREST request under RLS, not from catalog metadata or a service-role request.

## Request topology

Per personal-card detail visit:

| Critical request                        | Phase 8 control | Phase 9 candidate |
| --------------------------------------- | --------------: | ----------------: |
| Authenticated user                      |               1 |                 1 |
| Active session membership               |               1 |                 1 |
| Selected account and household currency |               2 |                 2 |
| Selected balance RPC                    |               1 |                 1 |
| Selected owner-membership follow-up     |               1 |                 0 |
| Card settings and billing months        |               2 |                 2 |
| **Critical request total**              |           **8** |             **7** |

Control observed the owner follow-up query and active evidence on all 10 warm visits. Candidate observed zero selected-detail owner follow-ups on all 10. The existing payment-account loader can still issue its own membership read in deferred scope; it was tagged separately in both arms and excluded from hero-critical counts.

## Capability equivalence

The sanitized server capability fingerprint matched on every warm pair: `credit_card / personal / active / isOwnedByMe=false / canMutate=false / archived=false / available=true / VND`. In one matched browser spot-check, Pay, Charge, and Installment were present and disabled in both arms on the same card route. This agrees with the `canMutate=false` capability recorded for all 10 warm pairs.

After the page settled, the in-memory financial hero fingerprint matched on **10/10** paired captures across the card hero, due context, account settings, and ownership badge; button counts and disabled states inside those regions also matched. It compared rendered text in memory, including the card identity and financial summary, and saved only the boolean result.

An earlier immediate whole-view fingerprint matched 6/10 pairs. A follow-up region-level probe isolated the transient mismatch to due-context text. Repeating the comparison after the full RSC response and 400 ms produced 10/10 exact region and action-state matches. No transient text or financial value was saved.

## Context cost

The account query header time is the instrumented fetch duration to response headers. Completion is measured through response decoding; payload is decoded JSON byte length. Mapping is the selected-account mapping span.

| Account context metric  | Control min / p50 / p75 / max | Candidate min / p50 / p75 / max | p50 delta |
| ----------------------- | ----------------------------: | ------------------------------: | --------: |
| Account-query headers   |         253 / 279 / 569 / 718 |           260 / 288 / 331 / 428 |        +9 |
| Query complete, decoded |         257 / 284 / 576 / 723 |           266 / 294 / 336 / 434 |       +10 |
| Decoded JSON bytes      |         231 / 231 / 231 / 231 |           367 / 367 / 367 / 367 |      +136 |
| Mapping duration        |               0 / 0 / 0 / 0.2 |                 0 / 0 / 0 / 0.1 |         0 |

The embed adds 136 decoded bytes and about 10 ms at p50 to the account query. That is much smaller than the removed owner request's 291 ms p50 duration.

## Phase 5 overlap

The selected balance RPC began before account context completed in **10/10** samples in each arm. Actual interval overlap:

| Balance/context overlap | Control min / p50 / p75 / max | Candidate min / p50 / p75 / max |
| ----------------------- | ----------------------------: | ------------------------------: |
| Overlap duration        |         261 / 287 / 289 / 357 |           273 / 292 / 295 / 359 |

Phase 9 preserved the Phase 5 balance overlap. Balance RPC p50 was 295 ms in control and 298 ms in candidate (+3 ms).

## Phase 8 overlap

Settings and billing-month requests started before `getAccount()` completed in **10/10** control samples. In the candidate this happened in **4/10** samples for each request. Using the actual fetch start and span end:

| Overlap with `getAccount()` | Control: before end; p50 / p75 | Candidate: before end; p50 / p75 |
| --------------------------- | -----------------------------: | -------------------------------: |
| Card settings               |            10/10; 283 / 288 ms |                  4/10; 0 / 13 ms |
| Billing months              |            10/10; 284 / 288 ms |                  4/10; 0 / 13 ms |

The source still starts card settings/months alongside the account promise, but the faster candidate account path often finishes before those requests actually begin. This scheduling overlap is therefore not fully preserved at runtime. Despite that, summary-ready p50 improved by 42 ms and readable-hero p50 improved by 228 ms; no end-to-end critical-path regression was measured. This runtime overlap loss is the main caveat for closeout.

## Same-run performance

Warm samples, in milliseconds; each cell is min / p50 / p75 / max:

| Metric                          |           Phase 8 control |         Phase 9 candidate | p50 delta |
| ------------------------------- | ------------------------: | ------------------------: | --------: |
| Account context                 |     286 / 302 / 581 / 728 |     289 / 302 / 340 / 654 |         0 |
| Owner follow-up                 |     267 / 291 / 295 / 334 |             0 / 0 / 0 / 0 |      −291 |
| Selected balance RPC            |     261 / 295 / 311 / 357 |     273 / 298 / 349 / 653 |        +3 |
| `getAccount()` capability ready |    557 / 595 / 905 / 1017 |     293 / 329 / 422 / 657 |      −266 |
| Card summary ready              |     305 / 397 / 525 / 859 |     297 / 355 / 420 / 559 |       −42 |
| Route completion                |  894 / 1249 / 1424 / 1713 |  900 / 1078 / 1132 / 1293 |      −171 |
| Click → readable hero           | 1204 / 1556 / 1657 / 1928 | 1084 / 1328 / 1399 / 1822 |      −228 |

The candidate's zero owner-follow-up values mean the span and request are absent, not that a zero-duration lookup ran.

Secondary browser milestones:

| Milestone                 | Control min / p50 / p75 / max | Candidate min / p50 / p75 / max |
| ------------------------- | ----------------------------: | ------------------------------: |
| Click → RSC request       |           42 / 76 / 141 / 362 |            41 / 120 / 261 / 483 |
| RSC duration              |     1673 / 2169 / 2437 / 2735 |       1401 / 1546 / 1722 / 2204 |
| Click → full RSC response |     1719 / 2308 / 2568 / 2815 |       1452 / 1759 / 1995 / 2271 |

All 20 warm navigations used the same personal-card route, produced readable hero text, and returned one detail RSC response with status 200. The single cold-ish hero-visibility measurements were 1841 ms control and 1660 ms candidate; their click-to-full-RSC times were 2861 ms and 2336 ms. Dev-mode request and browser timings are noisy, so the p50/p75 paired warm results carry more weight.

## Household regression

Two matched pairs used an existing household credit card. Both arms returned the same capability (`credit_card / household / active / isOwnedByMe=false / canMutate=true / archived=false / available=true / VND`). Control already made no owner follow-up, and candidate added none; its embedded owner relation was absent, as expected for this household card.

| Household sample metric (n=2 per arm) | Control p50 | Candidate p50 |   Delta |
| ------------------------------------- | ----------: | ------------: | ------: |
| Account context                       |      300 ms |        339 ms |  +39 ms |
| Click → readable hero                 |     1138 ms |       1313 ms | +175 ms |

The account-query payload increased by 24 bytes on this household row. The browser delta is based on only two pairs in dev mode; it is a small-sample signal, not a stable penalty estimate.

## Personal Liquid Detail regression

The matched control/candidate visit used an existing personal checking account owned by the other household member. Both showed the same in-memory hero/balance fingerprint. The candidate embedded relation passed all owner/household/active checks; its capability remained active ownership, `isOwnedByMe=false`, and `canMutate=false`. Its selected balance RPC succeeded (HTTP 200), and the selected-detail owner follow-up was absent.

At readable hero time, recent activity was not ready in either arm; it appeared after the deferred wait. Browser Back returned to the Accounts list in both arms. This confirms the shared helper retained the liquid balance, ownership, mutation, activity, and history behavior.

## Validation

- Focused ownership, relation-failure, account-detail, card-detail, balance-overlap, session, and Back suites: **114 passed across 12 files**.
- `npm run lint`: passed.
- `npm run typecheck`: still fails on the two pre-existing `HomeTranslator` / `Translator` type mismatches in `home-streaming-sections.tsx` at lines 99 and 340. No Phase 9.2 production code was changed.
- `npm run format:check`: reports formatting issues in 195 repository files, including existing skills and unrelated worktree artifacts. The new Phase 9.2 report and JSON were checked separately.
- Build was not run because the known repository typecheck baseline is failing. No database, schema, source, or UI changes were made for this verification.

## Conclusion

The embedded owner relation was visible under the real authenticated RLS session; the selected-detail follow-up disappeared; capability, card actions, financial hero, balance, and Liquid Detail behavior matched; and the warm p50 for `getAccount()`, summary readiness, and readable hero all improved. The query adds only 136 decoded bytes and about 10 ms at p50. Candidate settings/months overlap is less consistent, but measured summary and hero latency still improved.

## Recommended next step

Keep Phase 9 and close out the Accounts optimization. Record the Phase 8 overlap timing caveat in that closeout; do not start another optimization automatically.

**ACCOUNTS PHASE 9.2 COMPLETE — PHASE 9 VERIFIED BENEFICIAL**
