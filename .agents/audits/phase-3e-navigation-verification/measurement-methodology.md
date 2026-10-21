# Phase 3E: Navigation Measurement Methodology & Event Instrumentation

## 1. Executive Summary & Purpose

Phase 3C reported an apparent active-state latency regression from 2–12 ms to 45–60 ms after its navigation modifications. However, Phase 3C did not retain its raw runner or event timestamps, and Phase 3D did not measure handler-level active-state latency.

Phase 3E was chartered to build a reproducible, high-precision, event-based benchmarking framework to:

1. Directly measure user-visible perceived responsiveness across the five primary navigation destinations (`Home`, `Money`, `Add Transaction`, `Plan`, `Inbox`).
2. Separate Playwright-induced locator/pointer overhead from browser-internal event processing.
3. Distinguish synchronous DOM attribute mutation from actual painted frames rendered to screen pixels.
4. Independently evaluate the real touch impact and network overhead of `onPointerDown={() => router.prefetch(href)}` against a matched control.
5. Provide definitive before/after verification for any frontend remediation.

---

## 2. Test Environment & Runtime Isolation

- **Application Build:** Next.js 16.3.1 Production Build (`next build` with Turbopack).
- **Server:** Next.js production server running on `http://localhost:3100`.
- **Database:** Supabase project `family-finances-2` (`bbzffxvgocjwsdbujvgn`), verified dev/test target on PostgreSQL 17.6.1.
- **Session & Fixture:** Run-scoped disposable authenticated identity and household created via `scripts/e2e-auth-fixture.mjs setup`, verified with standard auth token cookies via `@supabase/ssr`.
- **Browser Automation:** Playwright Chromium with real viewport bounds and headless execution.

---

## 3. Dissecting the Measurement Contamination Problem

### 3.1 The Flaw in Node-Level Click Timing

In Phase 3C, measurements recorded ~45–60 ms active-state latency. Our investigation demonstrated that recording time from Node.js before `await locator.click()` measures Playwright's automation pipeline rather than browser responsiveness:

1. **Locator Resolution:** Locating `[data-slot="bottom-navigation"] a[href="..."]` in the DOM tree.
2. **Actionability & Stability Checks:** Verifying the element is attached, visible, not obscured, and not animating.
3. **Cursor Traversal:** Moving virtual mouse from coordinates `(x0, y0)` to element center `(x1, y1)`.
4. **Input Emulation Pipeline:** Sending Chrome DevTools Protocol (CDP) `Input.dispatchMouseEvent` for `mousePressed`, waiting a tick, and sending `mouseReleased`.
5. **IPC Latency:** Node.js WebSocket communication to Chromium.

Across our baseline probes, Playwright's `locator.click()` consumed **37 to 55 ms** purely in Node-to-browser overhead before the browser's own `pointerdown` event even fired on the DOM element!

### 3.2 Monotonic In-Browser Event Instrumentation

To eliminate this contamination, Phase 3E executes all timing **inside the browser page context** using `performance.now()` from the monotonic browser clock:

```
[User Action]
      │
      ▼
┌──────────────┐   (Dwell ~80ms)   ┌────────────┐   ┌─────────┐
│ pointerdown  │ ─────────────────►│ pointerup  │──►│  click  │
└──────────────┘                   └────────────┘   └─────────┘
      │                                                   │
      ▼                                                   ├──────────────────────────────┐
[onPointerDown]                                           ▼                              ▼
router.prefetch()                                [onClick handler]              [React 19 Schedule]
                                            setAttribute('data-active')        setPendingDestination()
                                                          │                              │
                                                          ▼ (0.8ms)                      ▼ (2.6ms)
                                                  [DOM attr changed]             [Class text-primary]
                                                 (0 CSS visual effect!)          [Active dot mounted]
                                                                                 [Icon scale animation]
                                                                                         │
                                                                                         ▼ (16ms / frame)
                                                                                  [First Painted Frame]
```

### 3.3 The 9 Measured Navigation Milestones

For every navigation transition, the benchmark records 9 distinct events on the exact same monotonic timeline:

1. `t_pointerdown`: Browser `pointerdown` event captured in capturing phase on `window`.
2. `t_pointerup`: Browser `pointerup` event captured on touch release.
3. `t_click`: Browser `click` event dispatched to the navigation trigger.
4. `t_data_active_attr`: Timestamp when MutationObserver detects `data-active="true"` on the DOM element.
5. `t_class_active`: Timestamp when MutationObserver detects active CSS classes (`text-primary`, `ring-primary`, active dot `<span data-slot="nav-tab-active-dot">`).
6. `t_first_paint`: First rendered frame timestamp captured via double `requestAnimationFrame` post-mutation, confirming pixels painted to the display buffer.
7. `t_router_transition`: Monkey-patched `history.pushState` indicating Next.js App Router transition initiation.
8. `t_loading_indicator`: Visible state of the top pending progress bar (`NavigationPendingFeedback`) or route skeleton.
9. `t_primary_content`: Primary data-bearing content element mounted and visible:
   - **Home:** `[data-testid="home-financial-pulse"]`
   - **Money:** `[data-testid="money-hub"]`
   - **Add Transaction:** `[data-testid="money-transaction-add"]`
   - **Plan:** `[data-testid="plan-hub"]`
   - **Inbox:** `[data-testid="inbox-queue"]`

---

## 4. Matched Control Methodology for Pointerdown Prefetch

To rigorously evaluate whether `onPointerDown={() => router.prefetch(href)}` provides measurable performance acceleration or causes harmful request contention:

- **Treatment Condition (With Prefetch):** Unmodified Phase 3C navigation behavior executing `router.prefetch(href)` on `pointerdown`.
- **Matched Control Condition (Without Prefetch):** `window.next.router.prefetch` is transparently neutralized via an injected page script (`window.next.router.prefetch = () => {}`).
  - Does NOT alter application bundle code.
  - Does NOT suppress `pointerdown` events (which would break React Aria's `usePress` on the Floating Action Button).
  - Preserves standard `<Link>` and button click navigation while isolating the effect of mechanical touch prefetch.

---

## 5. Viewports and Stress Matrix

### 5.1 Viewports

1. **440 × 900 (Canonical ViNha Shell):** 20 warm samples per transition route (360 total warm transitions measured).
2. **390 × 844 (Standard iPhone):** 5 warm samples per transition route.
3. **360 × 640 (Compact Android):** 5 warm samples per transition route.

### 5.2 Network & System Scenarios

1. **Normal Broadband:** Baseline network with direct local production server connection.
2. **Simulated Slow 4G:** CDP network emulation (1.6 Mbps download, 750 kbps upload, 150 ms RTT).
3. **Rapid Alternating Taps:** Home → Money → Plan within <150 ms to test queue resolution and single-active tab integrity.
4. **Repeated Taps on Active Tab:** 5 rapid clicks on currently active tab to verify zero duplicate RSC requests and navigation suppression.
5. **Aborted Navigation:** Touch down on tab, hold 80 ms, drag away 120 px, and release without clicking.
6. **Browser Back & Forward:** Verifying correct tab highlight restoration after popstate transitions.
7. **Floating Action Button Stability:** Measuring Y-axis coordinate before click, during active visual state, and after route content renders.
