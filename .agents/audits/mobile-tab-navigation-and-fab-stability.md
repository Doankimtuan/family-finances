# Mobile Tab Navigation and FAB Stability

## 1. Executive Summary

The Add Transaction pill jumped because the shared primary-route transition applied a vertical transform to a wrapper around route content. That transformed wrapper became the containing block for the fixed FAB; its loading and final content heights differed, moving the FAB by 72 px. The route transition now fades from the shared 0.96 opacity token without a transform. The fixed FAB remains anchored to the existing bottom-navigation, safe-area, and gap tokens.

The current checkout already contained the earlier optimistic tab-selection fix. I preserved it and removed a pathname key that remounted the navigation after route commit, which had been dropping keyboard focus. In the final ten-transition browser run, tap-to-active and tap-to-pending medians were 2.45 ms; the FAB moved 0 px and appeared at most once.

## 2. Video/Reproduction Findings

The supplied 720×1552, 3.8-second screen recording shows the five-tab mobile shell and the Home-to-Money interaction described in the brief: Home remains visually unchanged after the tap, the Money loading surface appears later, and the Add Transaction pill sits higher in loading than after Money content resolves. The recording agrees with the observed 390×844 browser reproduction.

Before the route-transition fix, the 390×844 FAB top edge measured 708 px on Home, 636 px in Money loading, and 708 px after Money content. The 72 px change reproduced the visible jump. The current code’s tab feedback was already optimistic at task start; a separate historical pathname-driven baseline and the current baseline are distinguished in section 11.

## 3. Navigation Delay Root Cause

The original delay occurred because visual selection followed only the committed `usePathname()` value. With a delayed authenticated RSC response, that pathname could not change until the destination response committed, leaving the tapped tab visually inactive. The pathname-only behavior had already been replaced in commit `b4b1fbfe` by a local optimistic destination and `useLinkStatus` feedback; this task did not add a second navigation path or change server data loading.

The final build records the optimistic active state and pending line within 2.45 ms median, while `aria-current="page"` remains bound to the committed route. A normal navigation still makes one RSC request.

## 4. FAB Jump Root Cause

`ProductRouteTransition` wrapped each primary-tab page and animated both `opacity` and `y`. A non-`none` transform creates a containing block for fixed descendants. Because Home, Money loading, and Money content have different wrapper geometry, the route-specific `FloatingAction` was positioned against changing content bounds instead of only the stable app viewport.

The shared `FloatingAction` already uses `position: fixed` and the common bottom geometry. The defect was the nearer transformed ancestor, not separate offsets or safe-area calculations in Home and Money.

## 5. Previous Timeline

The supplied recording showed approximately 400–500 ms before visible destination feedback. The prior pathname-driven instrumented baseline reproduced that pause under injected RSC delays:

| Injected RSC delay | Tap → active tab | Tap → pathname commit |
| -----------------: | ---------------: | --------------------: |
|             300 ms |           349 ms |                333 ms |
|             500 ms |           539 ms |                530 ms |
|             800 ms |           835 ms |                827 ms |

The older baseline’s active state followed the server route commit. By contrast, immediately before this task’s FAB fix, the already-optimistic checkout measured pointerdown 0 ms, click +1.4 ms, active +2.9 ms, RSC start +7.6 ms, pathname commit +28.5 ms, loading +46.1 ms, and useful content at about 1.24 s. Its FAB still moved 72 px.

## 6. Optimistic Navigation Architecture

The five localized tabs remain semantic localized `<Link>` elements. An ordinary unmodified primary click records the intended tab locally; modified clicks, downloads, and non-self targets retain browser link behavior. No `router.push` is paired with Link navigation. New taps replace the prior intent, `useLinkStatus` clears a settled matching intent, and `popstate` clears intent during history navigation.

The nav no longer keys its content subtree by pathname. That keeps the focused anchor mounted across client route commits. `aria-current` still follows only the committed path; the optimistic destination receives visual styling without being announced as the current page.

## 7. Bottom Tab Animation

The existing shared Motion layout ID animates the active surface from the user’s optimistic selection, and the icon uses the shared `scale.pop` token (1.02) with `springs.snappy`. The visual selection starts within 2.45 ms median. Labels retain their existing color and weight transitions; no tab geometry changes were introduced. Reduced-motion policy still suppresses transforms and transitions.

## 8. FAB Positioning Architecture

Home and Money use the shared `FloatingAction` fixed container. Its bottom edge remains `--bottom-navigation-height + --safe-area-bottom + --floating-action-gap`; the existing app gutter and 440 px app shell determine horizontal placement. Home, Money loading, and Money content each render one shared action for the active route state. Browser sampling observed a maximum of one FAB control through the ten measured transitions.

The fixed-action zone remains pointer-transparent around its interactive child and uses the existing floating-action z token; bottom navigation keeps its higher navigation z token. No page-height offsets or new viewport-specific geometry were added.

## 9. Loading / Content Transition

The primary-route transition now enters at `motionTokens.opacity.transitionStart` (0.96) and animates to 1, using the existing motion policy and spring. It has no vertical translation, so its computed transform is `none` and it cannot establish a route-specific containing block for the FAB. Existing route `loading.tsx` surfaces and server-rendered data remain unchanged.

On the final production build, the Money loading marker appeared 28.8 ms median after a normal tap. The tab’s pending line appears independently; delayed RSC requests produced loading feedback at approximately the injected delay plus 29–43 ms.

## 10. Prefetch Decision

**Optimistic only.** `PRODUCT_LINK_PREFETCH` remains `false`. Every tested Money tap made exactly one Money RSC request. Prior pointerdown-prefetch evidence in [the bottom-navigation transition audit](bottom-navigation-transition-ux.md) showed extra RSC work without a measured content-time benefit. No global or intent prefetch was added.

## 11. Before vs After Interaction Timing

The “historical” column refers to the earlier pathname-driven navigation implementation. The task-start checkout already had optimistic tabs, so its immediate baseline is also shown to avoid attributing an earlier navigation fix to this task’s FAB change.

| Measurement                | Historical pathname-driven baseline | Task-start checkout |          Final build |
| -------------------------- | ----------------------------------: | ------------------: | -------------------: |
| Tap → active tab           |     539 ms at 500 ms injected delay |              2.9 ms |   **2.45 ms median** |
| Tap → pending line         |          No optimistic pending line |  Already optimistic |   **2.45 ms median** |
| Tap → loading marker       |     539 ms at 500 ms injected delay |             46.1 ms |   **28.8 ms median** |
| Tap → pathname commit      |     530 ms at 500 ms injected delay |             28.5 ms |  **18.75 ms median** |
| Tap → useful Money content |    1,296 ms in the prior 500 ms run |      About 1,239 ms | **987.65 ms median** |

Final-build medians use ten Home-to-Money taps: five at 390×844 and five at 440×900. Server content time varies between local production runs and was not changed by this UI fix.

## 12. FAB Layout Shift Measurement

The actual labeled FAB control’s bounding box was sampled on pointerdown, throughout the route transition, and after Money content became useful. Each measured box was 155.34×48 px.

| Viewport | Before fix: Home → loading → content Y | After fix: Home → loading → content Y | Maximum shift |
| -------- | -------------------------------------: | ------------------------------------: | ------------: |
| 390×844  |                     708 → 636 → 708 px |                **708 → 708 → 708 px** |      **0 px** |
| 440×900  | Not part of the recorded jump baseline |                **764 → 764 → 764 px** |      **0 px** |

The ten final Home-to-Money runs observed the same box at pointerdown, loading/route replacement, and final content. `maxFabCount` was 1.

## 13. Slow-Network Simulation

The browser delayed the first Money RSC request by 300, 500, or 800 ms before continuing it. Each delay produced one Money RSC request and stable FAB Y=764 px at 440×900.

| Injected delay | Tap → active | Tap → pending line | Tap → loading marker | Tap → pathname | Tap → useful content |
| -------------: | -----------: | -----------------: | -------------------: | -------------: | -------------------: |
|         300 ms |       3.0 ms |             3.0 ms |             343.4 ms |       329.3 ms |           1,226.5 ms |
|         500 ms |       4.4 ms |             4.4 ms |             547.4 ms |       531.0 ms |           1,453.4 ms |
|         800 ms |       2.5 ms |             2.5 ms |             845.8 ms |       828.3 ms |           1,767.8 ms |

The content time includes variable local server data work; it is not presented as a production latency guarantee. The active tab and pending line remain immediate while that work continues.

## 14. Rapid Navigation / History

Under a 500 ms injected delay, rapid Home → Money → Plan ended at `/en/plan`; Plan was the sole active/current tab and no pending indicator remained. Browser Back, Back, Forward from Home → Money → Plan reconciled to Money, Home, then Money. No duplicate FAB appeared on Plan, where the route has no FAB.

## 15. Accessibility / Reduced Motion

`aria-current="page"` tracked only the committed route. Keyboard focus was visible on Money before Enter and remained on the Money anchor after route commit; Enter navigated successfully. Vietnamese `/vi/money` kept its locale and active tab. Dark mode remained applied across navigation.

With `prefers-reduced-motion: reduce`, the active state still updated, the Money link remained `aria-current`, and the product transition computed to `transform: none`. The safe-area variable remains part of both the shared nav and FAB geometry; Chromium’s emulated inset resolved to 0 px during this run.

## 16. Responsive Validation

The final production build was checked at 390×844, 440×900, 768×1024, and 1280×900. At tablet and desktop widths the canonical app shell and nav remained 440 px wide with no nav overflow. FAB Y was stable across each Home-to-Money transition; the 768×1024 and 1280×900 Money route samples measured Y=872 px and Y=748 px respectively.

## 17. Regression Check

- Five primary tabs each reached the matching route with exactly one active link and one committed `aria-current` link.
- Ten normal Home → Money taps made one destination RSC request each; delayed runs also made one Money request each.
- The FAB remained one visible control during measured Home-to-Money transitions; console errors and page errors were both 0.
- Build, typecheck, focused lint, focused tests, and changed-file formatting passed. The focused suite passed 22 tests.
- Full `npm run test` ran 231 files: 1,455 tests passed and 3 pre-existing stale-contract tests failed. They expect a duplicate `market_instruments` query, a removed `loan-payment-breakdown` test id, and no `PREVIEW_BALANCE` identifier in the decorative onboarding illustration.
- Full `npm run lint` still fails on 14 `no-console` errors and 5 warnings in ignored scratch scripts under `output/`; changed-file ESLint passed. Full `npm run format:check` reports 196 existing files outside this change set; Prettier passes on the changed source/test files and this report.

No financial logic, data fetching ownership, Supabase, Auth, RLS, schema, or database code changed.

## 18. Final Decision

**COMPLETE.** The route wrapper no longer creates a variable fixed-position containing block, the FAB’s maximum observed vertical shift is 0 px, and tab feedback stays below the 50/100 ms acceptance limits. Navigation preserves Link semantics, committed `aria-current`, keyboard focus, browser history, reduced motion, and the existing no-prefetch policy.

## 19. Raw Evidence

The supplied recording was inspected before code changes. Baseline and final runs used a Next.js production build (`VINHA_PERF_TRACE=1 npm run start`) and authenticated Playwright Chromium with mobile touch emulation. The final ephemeral measurement script was `/tmp/mobile-tab-stability-verification.mjs`; its detailed per-transition trace, delay trials, route cycle, focus, history, and responsive geometry are in [verification.json](../../output/playwright/mobile-tab-stability/verification.json).

Useful-content timing used the existing Money page test id. Browser requests were intercepted only to inject the specified 300/500/800 ms wait before one RSC request; no application timeout, fake animation delay, or user-data mutation was added. The observed metrics describe this local production run, not a Vercel deployment.
