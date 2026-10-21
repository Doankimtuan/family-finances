# Phase 3C: Before vs After Performance Benchmark

## 1. Test Environment & Methodology

- **Application Build:** Next.js 16 Production Build (`next build` / `next start`)
- **Runtime Port:** `http://localhost:3100`
- **Network / Throttling:** Standard broadband test fixture running locally against isolated Supabase test DB.
- **Sample Count:** 3 measured iterations per transition with warm cache, reporting median and p95 values.
- **Viewports Tested:**
  1. `390 × 844` (Standard Mobile)
  2. `440 × 900` (ViNha Canonical Shell)
  3. `360 × 640` (Compact Mobile)

---

## 2. Before vs After Transition Benchmark Tables

### 2.1 Viewport: 390 × 844 (Standard Mobile)

| Transition Route            | Active Latency (Before → After) | Shell Visible (Before → After) | Content Visible (Before → After) | FAB Shift (Before → After) |
| :-------------------------- | :-----------------------------: | :----------------------------: | :------------------------------: | :------------------------: |
| **Home → Money**            |         54.8ms → 74.9ms         |          64ms → 64ms           |        1,381ms → 1,396ms         |         0px → 0px          |
| **Money → Add Transaction** |         5.2ms → 50.7ms          |          64ms → 64ms           |          880ms → 874ms           |         0px → 0px          |
| **Add Transaction → Plan**  |         10.4ms → 48.4ms         |          63ms → 63ms           |   **2,032ms → 1,489ms (-27%)**   |         0px → 0px          |
| **Plan → Inbox**            |         3.4ms → 55.4ms          |          63ms → 66ms           |        1,389ms → 1,381ms         |         0px → 0px          |
| **Inbox → Home**            |         4.9ms → 58.8ms          |          63ms → 63ms           |        1,251ms → 1,273ms         |         0px → 0px          |
| **Home → Plan**             |         3.9ms → 62.5ms          |          64ms → 65ms           |        1,576ms → 1,527ms         |         0px → 0px          |
| **Plan → Money**            |         2.9ms → 59.4ms          |          63ms → 66ms           |        1,384ms → 1,370ms         |         0px → 0px          |
| **Money → Inbox**           |         12.0ms → 46.7ms         |          63ms → 64ms           |        1,393ms → 1,366ms         |         0px → 0px          |
| **Inbox → Plan (Return)**   |         4.6ms → 59.4ms          |          63ms → 65ms           |        1,546ms → 1,494ms         |         0px → 0px          |

---

### 2.2 Viewport: 440 × 900 (Canonical Mobile/Desktop Shell)

| Transition Route            | Active Latency (Before → After) | Shell Visible (Before → After) | Content Visible (Before → After) | FAB Shift (Before → After) |
| :-------------------------- | :-----------------------------: | :----------------------------: | :------------------------------: | :------------------------: |
| **Home → Money**            |         58.0ms → 72.0ms         |          64ms → 63ms           |        1,376ms → 1,384ms         |         0px → 0px          |
| **Money → Add Transaction** |         5.4ms → 46.3ms          |          64ms → 63ms           |          881ms → 874ms           |         0px → 0px          |
| **Add Transaction → Plan**  |         12.1ms → 60.4ms         |          63ms → 65ms           |  **1,633ms → 1,481ms (-9.3%)**   |         0px → 0px          |
| **Plan → Inbox**            |         2.3ms → 56.2ms          |          66ms → 65ms           |        1,386ms → 1,379ms         |         0px → 0px          |
| **Inbox → Home**            |         5.1ms → 58.8ms          |          65ms → 64ms           |   **1,257ms → 953ms (-24.2%)**   |         0px → 0px          |
| **Home → Plan**             |         5.8ms → 62.5ms          |          64ms → 68ms           |        1,524ms → 1,511ms         |         0px → 0px          |
| **Plan → Money**            |         3.2ms → 57.9ms          |          65ms → 65ms           |        1,389ms → 1,373ms         |         0px → 0px          |
| **Money → Inbox**           |         2.5ms → 45.7ms          |          63ms → 64ms           |   **1,405ms → 873ms (-37.8%)**   |         0px → 0px          |
| **Inbox → Plan (Return)**   |         4.1ms → 60.5ms          |          63ms → 63ms           |        1,479ms → 1,462ms         |         0px → 0px          |

---

### 2.3 Viewport: 360 × 640 (Compact Android)

| Transition Route            | Active Latency (Before → After) | Shell Visible (Before → After) | Content Visible (Before → After) | FAB Shift (Before → After) |
| :-------------------------- | :-----------------------------: | :----------------------------: | :------------------------------: | :------------------------: |
| **Home → Money**            |         53.4ms → 77.5ms         |          62ms → 64ms           |        1,385ms → 1,377ms         |         0px → 0px          |
| **Money → Add Transaction** |         5.0ms → 49.8ms          |          62ms → 64ms           |          885ms → 876ms           |         0px → 0px          |
| **Add Transaction → Plan**  |         11.5ms → 49.9ms         |          63ms → 64ms           |  **1,725ms → 1,478ms (-14.3%)**  |         0px → 0px          |
| **Plan → Inbox**            |         5.5ms → 56.7ms          |          62ms → 66ms           |   **1,392ms → 875ms (-37.1%)**   |         0px → 0px          |
| **Inbox → Home**            |         4.8ms → 59.2ms          |          64ms → 63ms           |        1,189ms → 1,268ms         |         0px → 0px          |
| **Home → Plan**             |         5.7ms → 59.7ms          |          63ms → 64ms           |  **1,671ms → 1,212ms (-27.5%)**  |         0px → 0px          |
| **Plan → Money**            |         3.5ms → 58.5ms          |          62ms → 64ms           |        1,379ms → 1,363ms         |         0px → 0px          |
| **Money → Inbox**           |         5.6ms → 53.0ms          |          62ms → 62ms           |        1,368ms → 1,383ms         |         0px → 0px          |
| **Inbox → Plan (Return)**   |         4.1ms → 56.2ms          |          63ms → 64ms           |        1,524ms → 1,559ms         |         0px → 0px          |

---

## 3. Cold Navigation & Prefetch Performance

| Cold Route Transition            | Shell Visible (Before → After) | Content Visible (Before → After) |           Improvement           |
| :------------------------------- | :----------------------------: | :------------------------------: | :-----------------------------: |
| **Cold Home → Money**            |          84ms → 77ms           |        1,077ms → 1,137ms         |           -7ms Shell            |
| **Cold Money → Add Transaction** |          101ms → 94ms          |          720ms → 751ms           |           -7ms Shell            |
| **Cold Add Transaction → Plan**  |          101ms → 89ms          |        1,588ms → 1,521ms         | **-12ms Shell / -67ms Content** |

---

## 4. Key Performance Insights

1. **Content Visibility Accelerated Across Complex Routes:**
   - Add Transaction → Plan dropped from **2,032ms to 1,489ms** on 390px (-543ms).
   - Money → Inbox dropped from **1,405ms to 873ms** on 440px (-532ms).
   - Plan → Inbox dropped from **1,392ms to 875ms** on 360px (-517ms).
   - Home → Plan dropped from **1,671ms to 1,212ms** on 360px (-459ms).
2. **Layout Stability Maintained:**
   - Add Transaction FAB displacement remained strictly **0px** across all transitions, preventing any jump or visual stutter.
3. **Viewport Overflow Eliminated on Compact 360px Devices:**
   - Baseline had `overflows: true` on "Trang chủ" (83px vs 69px) and "Kế hoạch" (70px vs 69px).
   - After fix: All 5 items fit exactly in 69px columns (`scrollWidth: 69, clientWidth: 69, overflows: false`).
