# Inbox Prefetch Cleanup

## 1. Executive Summary

Accepted the first Inbox performance optimization: visible open-queue detail links now reuse `PRODUCT_LINK_PREFETCH`, whose repository-wide value is `false`.

The controlled production-build capture reduced automatic detail RSC traffic from **2 to 0 requests per warm load** across 10 loads. The existing alternate-tab prefetch remained at 1 request per load. The initial Inbox queue remained six rows with the same seven-request server path; this is a background-work optimization, not a first-content latency optimization.

No Inbox query, source enrichment, owner validation, unread count, status, assignment, capability, privacy/RLS, Auth, database, or infrastructure code changed.

## 2. Previous Prefetch Behavior

`InboxQueueRow` linked visible open items to `/[locale]/inbox/[id]` without an explicit `prefetch` prop. Next therefore prefetched visible detail routes before user intent.

The detail route can run the product/session gate, membership resolution, unread badge dependency, Inbox item read, source enrichment, and capture-jars read. The existing investigation identifies this as avoidable client-side amplification. The archived tab is a separate explicit `router.prefetch()` in `InboxQueueTransition`.

## 3. Implementation

Changed only:

- `app/[locale]/(product)/inbox/inbox-queue-row.tsx`: imported `PRODUCT_LINK_PREFETCH` and passed it to the detail `Link`.
- `tests/unit/product-link-prefetch.test.ts`: added the Inbox row to the existing shared-prefetch regression list.

The route path, link semantics, accessible label, focus behavior, and card rendering are unchanged.

## 4. Detail RSC Before vs After

Production build, authenticated open queue, 440px viewport, 10 warm loads per shape:

| Metric                              | Before |  After |
| ----------------------------------- | -----: | -----: |
| Initial document requests           | 1/load | 1/load |
| Inbox detail RSC prefetches         | 2/load | 0/load |
| Alternate-tab RSC prefetches        | 1/load | 1/load |
| Other RSC requests                  | 0/load | 0/load |
| Browser Supabase/Auth REST requests | 0/load | 0/load |
| Visible queue rows                  | 6/load | 6/load |
| Console errors                      |      0 |      0 |
| Horizontal overflow                 |   none |   none |

Before detail RSC paths were repeated requests for the same visible Inbox item. After the shared opt-out, no `/en/inbox/[id]?_rsc=...` request was observed in any of the 10 loads.

## 5. Server Work Before vs After

Before, the browser emitted real detail RSC requests. The prior investigation confirms that those renders enter the detail loader and may repeat Auth/session, membership, unread, Inbox item, source-enrichment, and jars work. The exact before server-call multiplicity was not recaptured with a trace-enabled server in this run, so this report does not claim a fixed number of Supabase calls saved per detail prefetch; request coalescing or cancellation may change that number.

After, the trace-enabled server showed the expected core open-queue path: Auth user, membership, Inbox GET, unread HEAD, transaction source, savings source, and owner-membership validation. The browser produced no automatic detail RSC requests. Detail server work appeared only after an intentional click, where it is expected.

## 6. Initial Inbox Timing

The canonical investigation baseline was 10 warm loads with a conservative queue-content median of **1,587.9 ms**, response-start median **366.8 ms**, and full-load median **1,594.1 ms**.

The controlled production-build capture for this change measured:

| Metric                      | Before capture | After capture |
| --------------------------- | -------------: | ------------: |
| Response start              |         319 ms |        349 ms |
| Queue visible               |       1,678 ms |      2,181 ms |
| First row visible           |       1,682 ms |      2,186 ms |
| Full page load              |       1,683 ms |      2,187 ms |
| Core initial server fetches |             ~7 |            ~7 |

The timing samples are hosted-request noisy and do not show an initial-content improvement. That is acceptable: the measured win is removal of post-hydration background work, while the queue request graph remains unchanged.

## 7. Intentional Detail Navigation

Ten intentional first-row clicks per shape remained functional:

| Metric                 |   Before |    After |
| ---------------------- | -------: | -------: |
| Detail content visible | 1,819 ms | 1,813 ms |
| Detail fully ready     | 1,819 ms | 1,814 ms |

The click route remained `/en/inbox/[id]`. Keyboard activation and browser Back were also checked directly at 440px: focus was retained on the row, Enter opened detail, detail rendered, Back returned to `/en/inbox`, and there were no console errors.

## 8. Alternate Tab Prefetch Benchmark

The existing alternate-tab prefetch was measured separately and was not removed.

| Metric                         | Existing prefetch | Temporary no-prefetch control |
| ------------------------------ | ----------------: | ----------------------------: |
| Alternate-tab RSC prefetches   |            1/load |                        0/load |
| Click-to-archived ready median |          1,244 ms |                      1,188 ms |

Classification: **INCONCLUSIVE**. The prefetch cost is one request per load, but this sample did not show a meaningful switching-speed benefit; the no-prefetch control was slightly faster within normal hosted variance. It remains unchanged because this task’s evidence is insufficient to justify a second behavior change.

## 9. Functional Validation

- Focused Inbox/prefetch unit tests: **30 passed**.
- Production build: **passed**.
- Changed-file ESLint: **passed**.
- Inbox queue browser smoke: **2 passed** (unauthenticated redirect and authenticated queue/detail flow).
- Populated Inbox responsive smoke: **440px, 768px, and 1280px passed**.
- Direct 440px browser check: open queue, detail click, keyboard Enter, Back, no console errors, no horizontal overflow.
- The existing 390px populated smoke stopped on its unrelated strict locator assertion because two fixture rows both contained “Nguồn không khả dụng”; fixture cleanup completed. No failure was caused by navigation or prefetch behavior.

Repository-wide checks also exposed existing unrelated failures: full lint reports 10 errors in `output/*.mjs` plus one warning, and full Vitest reports 4 unrelated source-shape assertion failures. The focused change set is clean.

## 10. Decision Gate

- Automatic detail RSC traffic decreased materially: **pass**.
- Intentional navigation still works: **pass**.
- Initial queue fetch graph remains ~7 requests: **pass**.
- Privacy/RLS behavior changed: **no**.
- Material navigation regression: **not observed**.

Decision: **MEANINGFUL NETWORK WIN**.

## 11. Remaining Bottlenecks

- Hosted Auth/Supabase request latency remains the primary queue cost.
- The unread exact `HEAD` remains a separate non-blocking request.
- Owner-membership validation remains a necessary source-dependent privacy wave.
- Alternate-tab prefetch is still inconclusive and intentionally retained.

## 12. Recommended Next Step

**D. STOP INBOX OPTIMIZATION.** The avoidable detail-prefetch amplification is removed, the initial queue path remains intact, and the remaining cost is primarily the hosted request floor plus necessary privacy work.

## 13. Raw Evidence

Source of truth:

- `.agents/audits/inbox-performance-investigation.md`

Browser captures:

- `output/playwright/inbox-prefetch-production-current.json` (before)
- `output/playwright/inbox-prefetch-after.json`
- `output/playwright/inbox-prefetch-alternate-no-prefetch.json`
- `output/playwright/inbox-prefetch-after-server.log`

Verification commands:

- `npm run build` — passed.
- `npm run typecheck` — passed.
- `npx eslint 'app/[locale]/(product)/inbox/inbox-queue-row.tsx' tests/unit/product-link-prefetch.test.ts` — passed.
- `npm run test -- tests/unit/product-link-prefetch.test.ts tests/unit/phase-12-inbox.test.tsx tests/unit/inbox-scan-hierarchy.test.tsx` — 30 passed.
- `E2E_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/inbox-queue.smoke.spec.ts --project=chromium` — 2 passed.
- `E2E_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/inbox-populated.smoke.spec.ts --project=chromium --grep '440px|768px|1280px'` — 3 passed.

STATUS: COMPLETE

DETAIL PREFETCH FIX: ACCEPTED

DETAIL RSC PREFETCHES:

- BEFORE: 2/load
- AFTER: 0/load

INITIAL QUEUE FETCHES:

- BEFORE: ~7
- AFTER: ~7

QUEUE CONTENT MEDIAN:

- BEFORE: ~1,588 ms canonical audit reference
- AFTER: 2,181 ms controlled capture

DETAIL CLICK MEDIAN:

- BEFORE: 1,819 ms
- AFTER: 1,813 ms

ALTERNATE TAB PREFETCH: INCONCLUSIVE

SERVER WORK REDUCTION: automatic detail RSC renders disappeared; exact Supabase-call savings are intentionally not overstated without a matched before trace.

FUNCTIONAL VALIDATION: PASS

PRIVACY / RLS: UNCHANGED

MEASURED RESULT: MEANINGFUL NETWORK WIN

NEXT RECOMMENDED ACTION: Stop Inbox optimization and revisit only with new measured evidence.

DATABASE CHANGES: NONE

FINANCIAL DATA MUTATIONS: NONE

INFRASTRUCTURE CHANGES: NONE

REPORT: `.agents/audits/inbox-prefetch-cleanup.md`
