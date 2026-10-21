# Phase 3D — before and after benchmark

## Method

The browser used a Next.js production build, Chromium at 440 × 900, a normal authenticated app session, and the verified test project. Each transition had five fresh-context (cold) and ten reused-page (warm) samples. Final timing started before Playwright's visible-link click. Content markers were data-bearing: Home financial pulse, Money hub, capture form, Plan jar card, and Inbox summary. Final p95 uses nearest-rank (maximum for n=5; second-largest for n=10).

The pre-change production run had the same project, viewport, route set, and 5/10 sample counts. Its raw browser runner was not retained. Comparisons below are directional because cache/network variability and timing instrumentation may differ. No overall speedup is claimed.

## Data-bearing content time (milliseconds)

| Transition              | Before cold n=5 med / p95 | Final cold n=5 med / p95 | Before warm n=10 med / p95 | Final warm n=10 med / p95 | Warm median change |
| ----------------------- | ------------------------: | -----------------------: | -------------------------: | ------------------------: | -----------------: |
| Home → Money            |             1,357 / 1,860 |            1,058 / 1,624 |              1,331 / 1,365 |               962 / 1,059 |               −369 |
| Money → Add Transaction |               847 / 1,370 |              704 / 1,064 |                841 / 1,352 |                 649 / 703 |               −192 |
| Add Transaction → Plan  |             1,032 / 2,158 |            1,202 / 1,279 |              1,612 / 1,643 |             1,207 / 1,359 |               −405 |
| Plan → Inbox            |             1,354 / 1,364 |              992 / 1,153 |              1,332 / 1,341 |               945 / 1,045 |               −387 |
| Inbox → Home            |             1,357 / 1,404 |            1,041 / 1,092 |              1,343 / 1,843 |               963 / 1,337 |               −380 |
| Home → Plan             |             1,632 / 1,655 |            1,039 / 1,884 |              1,609 / 2,120 |             1,225 / 1,327 |               −384 |
| Money → Inbox           |             1,346 / 1,360 |                942 / 981 |              1,337 / 1,821 |               924 / 1,293 |               −413 |

The cold Home → Plan p95 regressed by 229 ms while its median improved; that spread is consistent with network noise. The measured Plan warm medians improved, but the cross-run change is not solely attributed to the code edit. The direct evidence for the code change is that Plan no longer made a separate `GET /rest/v1/jars` on its successful budget path.

## Loading-marker time

Times below start before the link click and end when the route loading marker first appeared. Some transitions completed from prefetched data without the marker being observed; `observed` reports how often a marker appeared.

| Transition              | Cold observed; med / p95 | Warm observed; med / p95 |
| ----------------------- | -----------------------: | -----------------------: |
| Home → Money            |          5/5; 68 / 80 ms |        10/10; 57 / 83 ms |
| Money → Add Transaction |        5/5; 103 / 395 ms |       10/10; 58 / 360 ms |
| Add Transaction → Plan  |         5/5; 85 / 687 ms |        10/10; 55 / 86 ms |
| Plan → Inbox            |                   0/5; — |         9/10; 53 / 61 ms |
| Inbox → Home            |                   0/5; — |         2/10; 45 / 55 ms |
| Home → Plan             |        5/5; 102 / 713 ms |       10/10; 50 / 141 ms |
| Money → Inbox           |        1/5; 107 / 107 ms |         9/10; 57 / 64 ms |

These are route-segment loading markers, not total shell visibility. The app shell remains present during client navigation. The 3C report's fixed ~63–68 ms shell metric used a different retained-data contract, so it is not combined with this marker timing.

## Flight and Supabase request timing

For RSC, the table reports the largest `_rsc` resource duration in each sample; p50/p95 are across samples where one was observed. API columns report median request count and the median/p95 of the longest Supabase HTTP request in each transition sample. API totals are not summed into wall time because requests overlap.

| Transition              | RSC cold n; med / p95 |   RSC warm n; med / p95 | Supabase calls cold / warm (med) | Longest API call cold / warm (med / p95) |
| ----------------------- | --------------------: | ----------------------: | -------------------------------: | ---------------------------------------: |
| Home → Money            |   5/5; 983 / 1,570 ms |   10/10; 921 / 1,030 ms |                            8 / 8 |                  329 / 838; 319 / 451 ms |
| Money → Add Transaction |     5/5; 866 / 963 ms |     10/10; 842 / 957 ms |                            8 / 8 |                  340 / 670; 306 / 365 ms |
| Add Transaction → Plan  | 5/5; 1,326 / 1,492 ms |  8/10; 1,254 / 1,675 ms |                          11 / 11 |                  478 / 590; 350 / 760 ms |
| Plan → Inbox            |   5/5; 923 / 1,107 ms |   10/10; 909 / 1,008 ms |                            4 / 4 |                  334 / 461; 326 / 361 ms |
| Inbox → Home            | 5/5; 1,010 / 1,278 ms |   10/10; 953 / 1,064 ms |                          13 / 11 |                  511 / 747; 349 / 672 ms |
| Home → Plan             | 5/5; 1,215 / 1,321 ms | 10/10; 1,230 / 1,633 ms |                          11 / 11 |                  349 / 613; 357 / 647 ms |
| Money → Inbox           |     5/5; 901 / 916 ms |   10/10; 884 / 1,262 ms |                            4 / 4 |                  282 / 361; 341 / 598 ms |

RSC duration can exceed first content because streamed content may appear before the full Flight resource completes. Supabase request duration includes HTTP/API and network time; it is not SQL execution time. The Plan RPC's PostgreSQL execution measurement was 25.008 ms; the Inbox index scan was 0.159 ms on an empty fixture queue. See [query analysis](supabase-query-analysis.md).

Browser Resource Timing counted requests after click began, including Flight prefetches where present:

| Transition              | Cold RSC requests med / p95; all browser resources med / p95 | Warm RSC requests med / p95; all browser resources med / p95 |
| ----------------------- | -----------------------------------------------------------: | -----------------------------------------------------------: |
| Home → Money            |                                                 1 / 1; 6 / 6 |                                                 1 / 1; 1 / 6 |
| Money → Add Transaction |                                                 4 / 4; 7 / 7 |                                                 1 / 4; 1 / 7 |
| Add Transaction → Plan  |                                                 3 / 3; 5 / 6 |                                                 1 / 5; 1 / 8 |
| Plan → Inbox            |                                                 3 / 3; 5 / 5 |                                                 1 / 3; 1 / 5 |
| Inbox → Home            |                                               4 / 4; 16 / 16 |                                                1 / 4; 1 / 16 |
| Home → Plan             |                                                 3 / 3; 6 / 6 |                                                 1 / 3; 1 / 6 |
| Money → Inbox           |                                                 3 / 3; 4 / 4 |                                                 1 / 3; 1 / 4 |

## Phase 3C active-state timing

Phase 3C reports active-state medians around 2–12 ms before its change and around 45–60 ms after it, from only three warm samples. Its raw runner was not retained. This benchmark measured shell, content, Flight, and server requests; it did not separately timestamp the `data-active` mutation from the pointer event. The two active-state figures therefore cannot be compared reliably. No further client navigation change is justified without an event-based browser measurement.
