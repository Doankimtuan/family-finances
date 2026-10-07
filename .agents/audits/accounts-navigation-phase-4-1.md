# Accounts Phase 4.1 — Liquid Detail Critical Path Investigation

Investigation only. Measured 2026-10-05 against the current Phase 4 source. No production code, database objects, or financial data were changed.

## Executive finding

The current warm sample did not reproduce a 1.7 s median: ten navigations had a 1,198.5 ms median and 1,759 ms p75 from click to readable hero. The p75 is consistent with the earlier approximately 1.7 s observation, but the runs used different dev-server states and measurement methods, so this is attribution rather than a before/after performance claim.

The delay is on the server data path. After the session gate, the selected account and household currency are fetched in two concurrent requests (295 ms median for the pair). The authoritative balance RPC then runs as another remote wave (295 ms median). The paired session-gate plus getAccount critical segment was 955.5 ms median. Individual Supabase HTTP operations share a roughly 270–325 ms median-to-headers floor. No single balance call explains the whole delay.

Browser rendering is not the target: the hero was readable on its first DOM observation in all ten samples, and it sometimes appeared before the streamed RSC response fully ended. The response can remain open for deferred activity after the hero is visible.

## Critical path

Warm measurements below are from ten client-side navigations to the same household-owned liquid account. Percentiles use nearest-rank p75. Do not add medians from concurrent work.

| Stage                                                 |     Median |      p75 |      Max |
| ----------------------------------------------------- | ---------: | -------: | -------: |
| Session gate, page request                            |     353 ms |   551 ms | 1,193 ms |
| Selected account and household context, parallel pair |     295 ms |   345 ms |   735 ms |
| Owner validation, shared account sample               |       1 ms |     1 ms |     1 ms |
| Balance RPC, HTTP plus JSON handling                  |     295 ms |   317 ms |   711 ms |
| getAccount() total                                    |     588 ms |   882 ms | 1,063 ms |
| getAccount() end → RSC response end                   |    50.5 ms |   420 ms |   725 ms |
| RSC response end → hero readable                      |   +43.5 ms |   +99 ms |  +126 ms |
| Click → hero readable                                 | 1,198.5 ms | 1,759 ms | 2,398 ms |

Three of ten heroes were readable before the full RSC response ended; the earliest was 655 ms before response end. Positive response-end deltas mean the hero followed response completion. In all samples, hero DOM and readable times matched, and the parent opacity was already 1 at first observation.

The measured request sequence is:

1. Click → RSC request start: 43.5 ms median (55 ms p75). Proxy claim verification runs before the page gate; warm claim checks took 2–6 ms and fetched no JWKS document.
2. Page session gate: 353 ms median. getUser and active membership resolve concurrently after claims.
3. Account context: account-row and household-currency GETs start together; the pair takes 295 ms median.
4. Once that context resolves, getAccount waits for the owner check and authoritative balance. The balance RPC follows the context read; for this household-owned sample, owner validation resolves locally in 0–1 ms and runs alongside the balance RPC.
5. The hero arrives in the RSC stream. The full response often has a deferred activity tail.

`getAccount()` waits on the request-cached household/account context, then validates the selected owner and reads the authoritative balance. `getAccountType()` shares the same context cache, so it does not issue a second account or household read. Recent activity is started on the liquid route but is behind a local Suspense boundary and is not required by the hero.

The browser recorded one RSC request per click. Median request-start-to-response-headers was 45 ms; this is the start of the stream, not the time at which hero data was ready. The median header-to-response-finish tail was 1,433 ms. Encoded RSC response size was 19,603 bytes median (19,628 bytes p75). Request-start-to-response-finish was 1,478.5 ms median (1,683 ms p75).

## Session

The measured page session gate contributes 353 ms median and 551 ms p75. Across paired samples, it was about 35% of the session-gate-plus-getAccount server segment (about 38% at p75). Relative to the 1,198.5 ms click-to-hero median, the session-gate median is about 29%; these ratios use different measured boundaries and are attribution aids, not an additive timing model.

The page session performs one remote getUser call (291 ms median to response headers; 496 ms p75) and one active-membership lookup (323.5 ms median; 523 ms p75). They overlap after claim verification. There are two getClaims invocations per RSC route, one in the proxy and one in the page session path. Warm claims used the local key cache. In the separate cold-ish direct navigation, the proxy and page each fetched JWKS (1,174 ms and 280 ms respectively); getUser took 745 ms and membership took 1,005 ms, overlapping after claims. The total page session gate there was 1,792 ms.

## Selected account context

The request uses two separate PostgREST GETs in parallel: one selected account row and one household currency row. The selected row contains the account fields needed to validate and describe the account, but household currency is not in that row. The request-scoped React cache shares both reads between getAccount() and getAccountType().

For the warm household sample, the account GET took 282.5 ms median to headers (339 ms p75; 727 ms max), and the household GET took 280.5 ms median (292 ms p75; 335 ms max). The combined context stage measured 295 ms median. In the cold-ish sample the selected row decoded to 208 JSON bytes and the household row to 23 bytes; the account response had no Content-Length header. These are decoded row sizes, not compressed wire sizes.

## Owner validation

Owner validation is conditional and remains required for personal accounts. The selected row provides the owner membership identifier. For a household-owned account, the helper returns an empty owner state locally; no owner-membership HTTP request was sent in this sample. For a personal account, source inspection shows one active-membership REST lookup after the account row is known. It runs in parallel with the selected balance RPC, but getAccount() waits for both before returning. No live personal-account fixture was used, so personal-account latency is source-derived, not measured. Ownership checks must remain in place.

## Balance RPC

getAccount() calls the existing get_account_ledger_balances RPC for the selected account. Its account ID comes from the route, and the function accepts a batch of account IDs. It is the authoritative balance source used by the hero; no list state or client-side transaction aggregation is involved.

For the warm sample, the RPC fetch-to-headers time was 284 ms median (310 ms p75; 704 ms max). The enclosing application span, including response handling, was 295 ms median (317 ms p75; 711 ms max); parsing and post-header handling added about 7.5 ms median and at most 15 ms. The cold-ish request body was 58 bytes, and the one returned row decoded to 74 JSON bytes. The response did not provide Content-Length. These are application-observed HTTP timings, not SQL execution timings.

The inspected migration defines the RPC as STABLE and SECURITY INVOKER, filters by the active household and selected account IDs, and computes balances using the existing opening-balance plus signed transaction-change semantics. Its current supporting transaction index is on account ID and descending creation time. Supabase logs for the sampled window exposed auth, edge, and PostgREST sources but no postgres log source. I did not run EXPLAIN ANALYZE: the available SQL connection did not carry the route's authenticated RLS context, so its plan would not represent this request. SQL execution time is therefore unknown; no claim is made that the RPC's database work itself takes hundreds of milliseconds.

## Browser tail

In all ten warm runs, hero DOM availability and readable time were the same observation; there was no extra opacity/reveal wait. MotionReveal's parent opacity was already 1. The full RSC response exceeded hero readiness in three runs because the deferred transaction read could keep the stream open. This places the measurable opportunity in remote waves, not reveal or post-data rendering.

One cold-ish direct document navigation after restarting the temporary Next development process took 5,625 ms from navigation start to hero DOM/readable. This is not comparable to the warm client-side RSC clicks. On that request, the page session gate was 1,792 ms, account context 679 ms, balance RPC 763 ms, and getAccount() 1,456 ms; there were also two cold JWKS fetches. The remaining document/browser time is not assigned to a specific stage because this single direct-navigation sample has a different boundary and no production-like server trace.

## Critical request count

Counts below describe one representative warm liquid detail request. The route also starts one deferred recent-transactions GET, excluded from the critical summary count.

| Remote operation               |                                                       Count | Critical to summary?       | Timing / qualification                                               |
| ------------------------------ | ----------------------------------------------------------: | -------------------------- | -------------------------------------------------------------------- |
| getUser                        |                                                           1 | Yes                        | 291 ms median to headers; overlaps membership                        |
| Active session membership      |                                                           1 | Yes                        | 323.5 ms median to headers; overlaps getUser                         |
| Selected account and household |                                                      2 GETs | Yes                        | Concurrent; 295 ms median for context stage                          |
| Selected owner membership      | 0 for sampled household account; 1 conditional for personal | Yes for personal ownership | Household sample was local 0–1 ms; personal not live-measured        |
| Selected balance RPC           |                                                           1 | Yes                        | 284 ms median to headers; 295 ms enclosing application span          |
| Recent transactions            |                                                       1 GET | No                         | Deferred; can extend RSC response after hero                         |
| getClaims                      |                                               2 invocations | Yes, local verification    | One proxy plus one page check; warm calls 2–6 ms, no warm JWKS fetch |

## Candidate optimizations

1. **Start the selected balance RPC after the session gate, alongside account context.** The route already knows the UUID and the RPC accepts selected IDs. Current balance work waits for the context wave; that wave costs 295 ms median. A parallel start could remove roughly one context-wave duration from the critical path. Keep the active-household RLS behavior, current owner validation, and fail-closed account/context checks; never return the early RPC result unless the selected account is authorized and the owner state is valid.
2. **Build a narrow authenticated account-hero read model.** The current critical path makes two context GETs and then a balance RPC. A single selected-account read model could remove another remote boundary, but it must preserve the existing canonical ledger calculation and household, archive, and owner authorization. The broad Home account RPC is unsuitable because it returns a wider all-account read model. This is a larger change and has no prototype timing yet.

## Recommended Phase 5

Choose **Option A: Liquid Account Detail remote-wave optimization**. First evaluate overlapping the selected balance RPC with the account/household context read while preserving the current authorization gates. The measured context wave and balance wave each cost about 295 ms at the median. The session remains a material fixed floor, but the measured work after session is also serialized. Rendering optimization has no observed hero delay to recover.

## Regression smoke

Used the Money page, then followed the Accounts link; opened Create Account and returned; opened Create Credit Card and returned; opened the selected liquid detail and returned; then opened Credit Card Detail. Each destination rendered its expected form fields or detail hero. Neither create form was submitted. Profiled requests contained no business mutation calls; only read GET/HEAD requests and read-only get_* RPCs were observed. No financial mutation was performed.

## Method and limits

The ten warm samples used the same current Phase 4 source, same selected account, local Next.js 16.3.1 development server in a disposable copy, Brave at 390 × 844 CSS pixels, and no network throttling. Temporary server spans recorded operation durations; browser CDP recorded RSC and hero milestones. The copy used the same hosted Supabase environment as the active app. A separate first direct document navigation after the temporary server restart is labeled cold-ish above, not pooled with the warm clicks. No credential, cookie, user, household, account, request, or financial-value identifiers are included in this report or its evidence file.

**ACCOUNTS PHASE 4.1 COMPLETE — OPTIMIZE LIQUID DETAIL REMOTE WAVES**
