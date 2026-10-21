# Phase 3E: Data Loading UX & Perceived Latency Review

## 1. Executive Summary

In Next.js App Router applications with Server Components (RSC), complex domain pages that read authenticated household state from a remote database (Supabase) are fundamentally network- and query-bound. As established in Phase 3D:

- **Add Transaction:** ~650–700 ms warm content time.
- **Inbox:** ~900–950 ms warm content time.
- **Home & Money:** ~950–1,100 ms warm content time.
- **Plan Hub:** ~1,200–1,350 ms warm content time.

Per the ViNha UI Constitution and financial integrity laws, **we must never fake completed financial balances or display speculative numbers**. Instead, the user interface must ensure perceived responsiveness, visual stability, and complete clarity of intent while server streaming is pending.

---

## 2. Evaluation of the Seven UX Loading Requirements

### 2.1 Destination Identity Becomes Apparent Quickly (<100 ms)

- **Requirement:** When the user taps a tab, they must immediately know that their touch was registered and which destination is loading.
- **Evaluation:** **PASS.**
  - Within **1.8–2.6 ms** of tap release (`click`), the target tab receives `font-semibold text-primary`, mounts the active dot `<span data-slot="nav-tab-active-dot">`, and triggers the spring scale pop animation on `<TabIcon>`.
  - Concurrently, the previous tab dims to `text-text-secondary`, instantly communicating that navigation has switched.
  - The top edge of the navigation bar mounts `<NavigationPendingFeedback requested={true} />`, rendering a vibrant primary loading indicator line.
  - On the Floating Action Button (`Add Transaction`), the ring switches from `ring-primary-soft` to `ring-primary` and the label bolds immediately.

### 2.2 Skeletons Have Meaningful Structure

- **Requirement:** Route-level skeletons must reflect the layout of incoming content rather than generic full-screen spinners.
- **Evaluation:** **PASS.**
  - **Home (`app/[locale]/(product)/home/loading.tsx`):** Renders structured skeleton cards matching `FinancialPulseSkeleton` and `SpendingOverviewSkeleton`.
  - **Money (`app/[locale]/(product)/money/loading.tsx`):** Renders the categorized accounts header skeleton and list item placeholders (`money-hub-loading`).
  - **Add Transaction (`app/[locale]/(product)/money/transactions/new/loading.tsx`):** Renders the 3-column Mode toggle skeleton (`ModeSkeleton`), amount card skeleton with large numeral placeholder, and 3 field card skeletons (`FieldSkeleton`).
  - **Plan Hub (`app/[locale]/(product)/plan/loading.tsx`):** Renders the 3 jar budget cards (`plan-home-jars`) matching the 50/30/20 layout.
  - **Inbox (`app/[locale]/(product)/inbox/loading.tsx`):** Renders tab control skeleton and item rows (`inbox-loading`).
  - **Zero blank flashes:** Skeletons maintain the exact padding, margins, and card geometry of final content, eliminating visual jump.

### 2.3 The App Shell Remains Stable (0px FAB Jump)

- **Requirement:** The bottom navigation shell and floating action button must not move, jump, or reflow during route loading.
- **Evaluation:** **PASS.**
  - The bottom navigation container is fixed to the bottom within the 440px centered app shell.
  - Bounding box measurements across all transitions confirmed **exactly 0.00 px vertical displacement (`fabShift: 0.00px`)**.
  - No layout shift (CLS = 0) occurs within the bottom navigation or viewport shell during route segment swaps.

### 2.4 No Stale Balance Presented as Current

- **Requirement:** Previous route balances or outdated financial figures must never linger on screen with a misleading appearance of currency.
- **Evaluation:** **PASS.**
  - Next.js RSC replaces the page container atomically when the streamed Flight payload renders.
  - While data is in flight, the route displays the clean skeleton rather than showing the previous screen's numbers.
  - Financial privacy toggles are respected consistently across all routes.

### 2.5 Zero Blank Flashes

- **Requirement:** Transitions must not flash pure white or empty canvas between screens.
- **Evaluation:** **PASS.**
  - The shared layout (`app/[locale]/(product)/layout.tsx`) remains permanently mounted.
  - The background token `bg-surface-elevated` and `bg-background` are preserved continuously throughout transitions in both light and dark themes.

### 2.6 Errors Are Recoverable

- **Requirement:** If network or server fails mid-navigation, the user must not be trapped in a broken state.
- **Evaluation:** **PASS.**
  - Each product route includes an `error.tsx` boundary with localized error copy and explicit retry buttons (`system-error-retry` / `system-offline-retry`).
  - If a transition fails or times out, the bottom navigation remains 100% interactive, allowing the user to tap another tab or retry.

### 2.7 Navigation Remains Responsive While Data Is Pending

- **Requirement:** If destination A is taking 1,200 ms to load and the user changes their mind and taps destination B, the UI must immediately honor destination B.
- **Evaluation:** **PASS.**
  - Interrupted navigation stress tests demonstrated that tapping tab B cancels tab A's pending state, updates the active highlight to tab B in <2 ms, and seamlessly commits tab B without leaving dangling active indicators or corrupting the router state.

---

## 3. Conclusion

The perceived responsiveness of ViNha's navigation is excellent:

- **Instant feedback:** 2 ms to DOM visual update; 16 ms (1 frame) to painted pixels.
- **Stable shell:** Zero FAB movement, zero blank flashes, zero stale financial values.
- **Meaningful skeletons:** Immediate structural clarity while Supabase data resolves over the wire.
