# Phase 3E: Evaluation of Pointerdown Prefetch

## 1. Executive Summary

Phase 3C introduced mechanical touch prefetching across all bottom navigation destinations:

```tsx
<Link
  href={href}
  prefetch={PRODUCT_LINK_PREFETCH}
  onPointerDown={() => {
    router.prefetch(href);
  }}
...
```

The underlying theory was that mobile touch interactions exhibit an ~80 ms physical dwell time between finger contact (`pointerdown`) and finger release (`pointerup`/`click`). Initiating Next.js `router.prefetch(href)` on `pointerdown` was intended to request the RSC Flight payload early, reducing user-perceived content latency.

However, ViNha's shared architecture in `shared/constants/navigation.ts` intentionally sets:

```typescript
/**
 * Viewport-visible authenticated Links render full RSC trees (auth + membership
 * + domain queries). Prefetching them in parallel contends for Supabase RTTs
 * and is the dominant cause of 1–8s "duplicate" Network-tab rows.
 */
export const PRODUCT_LINK_PREFETCH = false;
```

Phase 3E performed an independent empirical evaluation comparing the current implementation (`WITH onPointerDown prefetch`) against a matched control (`CONTROL without prefetch`) across all primary destinations, viewports, and network conditions.

---

## 2. Empirical Findings & Detailed Measurements

### 2.1 Prefetch Requests and Flight Duplication per Interaction

- **With `onPointerDown` Prefetch:**
  - Upon `pointerdown`: Next.js immediately dispatches **2 prefetch RSC requests** (`GET /route?_rsc=...` with `Next-Router-Prefetch: 1`) to fetch the layout segment and page segment.
  - ~80 ms later on `click`: Next.js dispatches the navigation Flight request (`GET /route?_rsc=...` with `Next-Router-Prefetch: false`).
  - Because remote Supabase REST/RPC queries take ~250–400 ms to execute, the prefetch requests are still in-flight when the navigation request arrives at the server.
  - **Result:** Next.js server-side renders the destination route **twice in parallel**, issuing duplicate database queries to Supabase. Every touch interaction generates **3 to 4 total RSC requests** instead of 1.
- **Control (Without `onPointerDown` Prefetch):**
  - Upon `click`: Next.js dispatches exactly **1 full RSC navigation request** (`GET /route?_rsc=...`).
  - Total RSC requests: **1**.
  - Duplicate Flight requests: **0**.

### 2.2 Content Rendering Latency Comparison (Warm Routes, 440 × 900)

Direct side-by-side transition measurements demonstrated that duplicate Flight requests create server-side query contention and connection exhaustion:

| Transition Route            | With Pointerdown Prefetch (Content Visible) | Control Without Prefetch (Content Visible) |         Impact of Prefetch         | Total RSC Requests (Prefetch vs Control) |
| :-------------------------- | :-----------------------------------------: | :----------------------------------------: | :--------------------------------: | :--------------------------------------: |
| **Plan → Money**            |                 1,913.6 ms                  |               **1,407.8 ms**               | **+505.8 ms SLOWER with prefetch** |                  3 vs 1                  |
| **Money → Add Transaction** |                 1,405.7 ms                  |                **908.0 ms**                | **+497.7 ms SLOWER with prefetch** |                  4 vs 1                  |
| **Home → Plan**             |                  898.9 ms                   |                **892.1 ms**                |          ~Equal (+6.8 ms)          |                  3 vs 1                  |
| **Add Transaction → Plan**  |                 1,440.0 ms                  |               **1,385.0 ms**               |         ~Equal (+55.0 ms)          |                  4 vs 1                  |

**Why did prefetch cause a 500 ms penalty?**
When 2 prefetch requests and 1 navigation request arrive within 80 ms of each other, the Next.js Node process and Supabase PostgREST connection pool are swamped with identical concurrent reads (`get_money_credit_card_raw_inputs`, `household_members`, `transactions`, `accounts`). The database queries contend for connections, delaying the final streaming response.

### 2.3 Aborted Navigation & Touch-Drag Overhead

- When a user touches a tab and drags away or cancels the tap (e.g. scrolling or sliding off the navigation bar):
  - In `WITH prefetch`: **2 full RSC prefetch requests** are dispatched and executed on the server, even though the user never navigates to the destination.
  - In `CONTROL`: **0 requests** are sent. No wasted data, no wasted CPU, no battery drain.

### 2.4 Rapid-Switch Behavior (Home → Money → Plan in <150 ms)

- Under rapid switching:
  - `WITH prefetch`: Dispatches **6 to 8 parallel RSC requests** in a 150 ms burst, queuing multiple Supabase RPC executions simultaneously.
  - `CONTROL`: Only the committed destinations trigger navigation, keeping the network queue clean.

### 2.5 Slow-Network & High-Latency Contention (Simulated Slow 4G)

- Under 150 ms RTT and 1.6 Mbps bandwidth:
  - Firing multiple Flight payloads simultaneously saturates the browser's HTTP/2 multiplexed stream window.
  - The actual data required to render the destination screen is delayed behind the redundant prefetch bytes.

### 2.6 User-Perceived Active State Feedback

- User perception of navigation responsiveness is governed by the **instant active feedback** (tab color change, active dot, FAB ring, pending line indicator).
- As proven in `active-state-correctness.md`, this visual feedback is triggered synchronously via React's `setPendingDestination` on click (**1.8–2.6 ms**).
- `router.prefetch` on `pointerdown` contributes **0 ms** to active feedback.

---

## 3. Conclusion & Recommendation

1. **Conclusion:**
   `onPointerDown={() => router.prefetch(href)}` does NOT accelerate content delivery for authenticated Supabase routes in ViNha. Instead, it fires duplicate Flight requests, causes network and database contention, slows down route completion by up to ~500 ms on complex pages, and wastes bandwidth on cancelled touches.
2. **Actionable Recommendation:**
   Remove `onPointerDown={() => router.prefetch(href)}` from:
   - The 4 standard tab triggers in `BottomNavigationContent`
   - The center `FloatingActionButton` targeting `APP_PATH.MONEY_ADD`
     Revert to Next.js's standard navigation triggering upon click. This aligns with `PRODUCT_LINK_PREFETCH = false` in `shared/constants/navigation.ts`, reduces server RSC load by 66–75%, and eliminates duplicate queries.
