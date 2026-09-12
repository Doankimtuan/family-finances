# Bottom Navigation Transition UX

## 1. Executive Summary

The bottom bar previously treated the committed localized pathname as the only active state. A delayed authenticated RSC navigation therefore delayed the visual acknowledgment. The bar now selects a tapped destination immediately, exposes a pending line, and lets the existing localized Next `<Link>` finish the server navigation. The 50-tap mobile run measured a 2 ms overall median to optimistic active state and 2 ms to pending feedback. The five routes remain server-rendered; `PRODUCT_LINK_PREFETCH` remains `false`.

## 2. Root Cause

`BottomNavigation` originally derived its active tab only from `usePathname()`. In the injected-delay run the active tab changed with the pathname commit, 333–827 ms after the tap. That traces the pause to the authenticated RSC route flight and its server work, rather than a delayed click or a slow local render. The route `loading.tsx` boundaries could not cover the gap before the flight made them visible.

Product-link prefetch is intentionally disabled because each visible authenticated RSC tree can perform Auth, membership, and domain reads. The implementation preserves that policy.

## 3. Previous Interaction Timeline

A production build ran locally with `VINHA_PERF_TRACE=1 npm run start`; Playwright used an authenticated E2E account at 390×844 and 440×900. The ordinary local baseline did not reproduce the full production pause: active-state medians were 24.5–27.5 ms across the five route pairs, with RSC requests starting 1–2 ms after click. An injected RSC delay reproduced the underlying failure:

| Injected route delay | Tap → active | Tap → pathname | Tap → loading UI | Tap → useful content |
| -------------------: | -----------: | -------------: | ---------------: | -------------------: |
|               300 ms |       349 ms |         333 ms |           349 ms |             1,296 ms |
|               500 ms |       539 ms |         530 ms |           539 ms |             1,296 ms |
|               800 ms |       835 ms |         827 ms |           390 ms |             2,812 ms |

Pointerdown-to-click was 1–3 ms, and the RSC request began 1–2 ms after click. The active state waited for the committed route even though the request had already started.

## 4. Optimistic Navigation Design

The nav now tracks a typed pending destination alongside the committed pathname. A normal unmodified primary click updates the pending destination synchronously; modified clicks and links with download or non-self targets retain browser behavior. The existing `<Link>` starts navigation once—there is no `router.push` call. A newer tap replaces the pending destination, the pathname takes over after commit, and `useLinkStatus` settling without a route change clears a failed or cancelled intent. Tapping the committed tab is a no-op.

`aria-current="page"` continues to describe only the committed route. The active surface follows the optimistic destination visually until commit.

## 5. Animation Design

The active surface uses one shared Motion layout id and the existing `springs.snappy` preset. A browser frame sampler saw 40 distinct horizontal positions as the active indicator moved from x=8 px to x=93.6 px. The destination icon scales with the shared `motionTokens.scale.pop` token; label opacity and weight transition without changing layout. The active surface, icon, and focus treatment use existing semantic design tokens. Reduced-motion and low-end-device policy render static active state instead of the indicator and icon transforms.

## 6. Loading / Content Transition

Each link contains a fixed-height, aria-hidden pending line driven by Next’s `useLinkStatus`, so visual feedback appears independently of the route response. Existing route-specific loading UIs remain in place. The product layout wraps content in a small transition component for the five primary routes; on commit it enters from opacity 0 and a 4 px vertical offset. A browser frame sampler observed the entry at opacity 0 / translateY(4px), followed by changing transforms; the sample reached 155 frames.

The loading skeleton still follows route/server timing. In the delayed run it appeared at 357, 558, and 859 ms for 300, 500, and 800 ms injected delays, while the pending line appeared at 1 ms in each case.

## 7. Prefetch Experiment

The temporary pointerdown candidate called `router.prefetch` for the tapped primary destination, with a 300 ms RSC delay. It produced three destination RSC requests for one tap: a prefetch 1 ms before click, a normal navigation request 6 ms after click, and another prefetch 311 ms after click. Useful content appeared at 2,322 ms in that single trial, versus 1,302 ms for the no-prefetch 300 ms run; backend timing varied, so that one comparison is not causal, but it shows no measured win. The performance trace also showed repeated Auth/membership and Supabase route work. Pointerdown led click by only 2 ms.

Pointerenter/focus prefetch was not trialed: pointerdown already showed near-zero lead and duplicate route work, while hover/focus can start speculative work much earlier. No intent prefetch was retained. Existing `prefetch={false}` remains unchanged.

## 8. Final Navigation Architecture

The bottom bar remains five localized semantic links. The click handler only records visual intent and prevents navigation for the already-current or already-pending destination. Next App Router retains responsibility for the route transition, RSC response, browser history, and locale. `ProductRouteTransition` is scoped to the five primary routes. Money transaction/detail, loan-row, and Inbox-detail Link prefetch contracts were not changed.

## 9. Interaction Timing Before vs After

Before values use two baseline observations per route pair (one at each mobile viewport); after values use ten observations per pair (five at each viewport). Useful-content selectors were the existing route test ids. Values are medians in milliseconds.

| Route pair       | Before tap → active | After tap → active | After tap → pending feedback | Useful content before → after |
| ---------------- | ------------------: | -----------------: | ---------------------------: | ----------------------------: |
| Home → Money     |                  26 |                  1 |                            1 |                 1,551 → 1,299 |
| Money → Plan     |                24.5 |                  2 |                            2 |                     795 → 800 |
| Plan → Inbox     |                  26 |                  1 |                            1 |             2,054.5 → 1,800.5 |
| Inbox → Together |                27.5 |                  2 |                            2 |                 792.5 → 803.5 |
| Together → Home  |                  25 |                  6 |                            6 |                       30 → 41 |

Across all 50 taps, active-state and pending-feedback medians were both 2 ms. After-run pathname commit medians were 18–25 ms. Useful-content time remains route-dependent and server-bound; the change acknowledges the tap immediately without claiming to accelerate server data.

## 10. Vercel-Latency Simulation

The final build was tested with 300, 500, and 800 ms injected delays on RSC requests. Values below are click-relative milliseconds.

| Injected delay | Tap → optimistic active | Tap → pending line | Tap → loading UI | Tap → pathname | Tap → useful content |
| -------------: | ----------------------: | -----------------: | ---------------: | -------------: | -------------------: |
|         300 ms |                       1 |                  1 |              357 |            346 |                1,302 |
|         500 ms |                       1 |                  1 |              558 |            548 |                1,307 |
|         800 ms |                       1 |                  1 |              859 |            849 |                2,817 |

For accessibility, `aria-current` remained on the committed source tab before route commit, then moved to the destination. Each delayed tap made one normal destination navigation RSC request.

## 11. Accessibility

The five anchors keep translated visible labels and committed-route `aria-current`. Browser keyboard focus matched `:focus-visible` with a solid outline; Enter navigated to Money and reconciled its active state. Unit coverage verifies modified-link behavior, current-tab no-op, optimistic-versus-committed semantics, cancellation, Back/Forward clearing, and newest-tap-wins.

With `prefers-reduced-motion: reduce`, the active link transition duration computed to `1e-05s`, content transform was `none`, and the active state still updated. Dark theme remained applied while navigating. No browser console or page errors occurred.

## 12. Responsive / Functional Validation

All five route pairs were tapped ten times each across 390×844 and 440×900 (50 mobile navigations total). One cycle through all five routes ran at 768×1024 and 1280×900. Every destination kept the `/vi` locale, exactly one bottom link had `aria-current`, and the nav had no horizontal overflow. The 440 px app shell stayed 440 px wide and centered at tablet and desktop sizes. Back returned to `/vi/home` with Home current; Forward returned to `/vi/money` with Money current. Dark mode, reduced motion, and keyboard activation were also checked.

Touch taps had a 1–3 ms pointerdown-to-click interval; each normal tap produced one destination navigation request. No custom pointerdown, pointer-capture, or touch-scroll handling was introduced; navigation still activates through link click semantics.

## 13. Performance Regression Check

The standard 50-tap run recorded one non-prefetch destination RSC request per tap (maximum one for every route pair). Tapping the already-current tab produced zero navigation RSC requests. Four ambient primary-route prefetch requests appeared across the browser session; they were not emitted by a new bottom-nav prefetch handler, and the existing `PRODUCT_LINK_PREFETCH=false` setting is untouched. The isolated pointerdown experiment produced two additional destination prefetch requests for one tap.

The Inbox route naturally ran its existing `sync_loan_debt_attention_inbox` and `run_inbox_staleness_worker` RPCs during route rendering. No form or financial mutation action was used. No application, financial, RLS, or database schema code changed.

Validation: `npm run build` passed; changed-file ESLint and `git diff --check` passed; the three focused test files passed (21 tests). The full Vitest run still has three unrelated stale-contract failures: market valuation expects a removed duplicate instrument query; the welcome illustration test rejects its existing decorative `PREVIEW_BALANCE` constant; and a loan-detail test expects a removed `loan-payment-breakdown` test id. Full `npm run lint` still reports errors in pre-existing ignored scratch scripts under `output/`; lint on the changed files passes.

## 14. Final Decision

**OPTIMISTIC ONLY.** The active and pending UI meet the <50 ms / <100 ms targets with measured 2 ms medians. Pointerdown prefetch saved no demonstrated content time, started only 2 ms before click, and multiplied destination RSC requests. Keep server-rendered route data and the existing prefetch protections.

## 15. Raw Evidence

Measurements came from the local production build started with `VINHA_PERF_TRACE=1 npm run start -- -p 3132 -H 127.0.0.1`, authenticated Playwright Chromium, and request interception that delayed `_rsc` responses by 300/500/800 ms. Useful content was measured when the destination’s existing test-id element became visible: Home `home-dashboard`, Money `money-hub`, Plan `plan-hub`, Inbox `inbox-queue`, Together `together-overview-page`.

Baseline and 50-navigation after-run JSON were generated under the ignored `output/playwright/` directory during measurement and removed after their values were transcribed here. The isolated pointerdown candidate was temporary and removed; the final production build was rebuilt and browser-checked after reverting it. Artificial latency is a client-side delay, not a Vercel deployment; results identify the interaction shape and do not predict production content duration.
