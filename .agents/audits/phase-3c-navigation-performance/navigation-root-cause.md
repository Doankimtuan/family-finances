# Phase 3C: Navigation Root Cause Analysis

## 1. Executive Summary

During the comprehensive baseline audit of ViNha's 5 primary destinations (`Home`, `Money`, `Add Transaction`, `Plan`, `Inbox`), three distinct architectural and visual issues were identified:

1. **Floating Action Button (Add Transaction) was treated as an unlinked second-class control rather than a full destination**: The button had no `aria-current="page"` contract when on `/vi/money/transactions/new`, no persistent active indicator styling, and did not suppress redundant navigation if tapped while already on the entry form.
2. **Delayed Route Segment Fetching Under React 19 Client Transitions**: Next.js App Router relies on `router.push()` with RSC transitions. Standard link prefetching occurs only on viewport hover or idle, leaving touch interactions on mobile devices subject to a 60–120ms mechanical touch delay before route flight payloads are requested.
3. **Viewport Text Overflow on Compact Screens (360 × 640)**: In Vietnamese localization, tab labels such as "Trang chủ" and "Kế hoạch" exceeded the 69px column width allotted by `grid-cols-5`, resulting in horizontal clipping and visual overflow due to an inflexible inline layout between the label text and active dot indicator.

---

## 2. Root Cause Breakdown

### Issue A: Add Transaction ("Ghi chép") Navigation Identity

- **File:** `shared/patterns/bottom-navigation.tsx`
- **Symptom:** When navigating to `/vi/money/transactions/new` (Add Transaction), the center button (`FloatingActionButton`) retained a static dormant appearance (`ring-primary-soft`, `bg-primary text-primary-foreground`) without indicating that the user was currently on the Add Transaction destination. In addition, subsequent clicks on the button would issue redundant `router.push(APP_PATH.MONEY_ADD)` calls.
- **Root Cause:**
  - The bottom navigation component determined active tab state solely by checking `pathname === item.href` on the 4 standard tabs (`home`, `money`, `plan`, `inbox`).
  - The center FAB was treated as an action trigger rather than a route destination matching `APP_PATH.MONEY_ADD`.
- **Impact:** Inconsistent UX state where the user is on the screen, but the bottom navigation shows no active destination.

### Issue B: Touch Latency & Flight Payload Fetch Initiation

- **Symptom:** Transitions to complex server-component routes (such as `/vi/plan` and `/vi/inbox`) exhibited a 1.2s – 2.0s delay before primary content rendered, during which the user perceived a brief stall after tapping.
- **Root Cause:**
  - Touch taps on mobile browsers emit `pointerdown` ~60–100ms before the `click` event fires.
  - Relying exclusively on standard `Link` navigation or awaiting `click` to trigger `startTransition` wastes this crucial human mechanical delay.
  - By initiating Next.js `router.prefetch(href)` on `onPointerDown`, the RSC flight payload is fetched in parallel with the touch release, allowing the server stream to arrive tens of milliseconds earlier.
- **Impact:** Perceived lag during page navigation.

### Issue C: Compact Viewport Overflow (360px)

- **Symptom:** On 360 × 640 screens, the 5-item grid allocates 360px / 5 = 72px (minus padding = 69px usable). "Trang chủ" rendered at 83px width and "Kế hoạch" at 70px width, causing text clipping and overflow (`overflows: true`).
- **Root Cause:**
  - The label and active dot indicator were arranged inline without truncation constraints:
    ```tsx
    <span className="flex items-center gap-1">
      {label}
      {isActive ? <span className="h-1 w-1 rounded-full bg-primary" /> : null}
    </span>
    ```
  - Without `truncate` and `shrink-0` on the dot, wide localized words overflow the column boundaries.
- **Impact:** Broken visual appearance on compact Android devices.

### Issue D: Floating Action Button Stability (FAB)

- **Investigation:** ViNha historically suffered from vertical displacement ("FAB jump") during tab switches.
- **Audit Findings:** In the current architecture, the FAB is absolutely positioned relative to the centered, fixed 440px bottom navigation shell:
  - `bottom-2.5 inset-x-0` with `pointer-events-none` container and `pointer-events-auto` on the circular button.
  - Bounding box measurement across all 9 transitions and all 3 viewports demonstrated exactly **0px vertical shift** (`fabShift: 0px`).
  - The resting geometry is mathematically stable and does not participate in flex/grid reflows.
