# Phase 3C: Baseline Performance Assessment

## 1. Overview & Setup

- **App:** ViNha (Family Finance)
- **Environment:** Next.js 16 production build (`next build` + `next start` on port 3100), optimized client bundle, connected to verified test database environment.
- **Audit Account:** Authenticated household member session (`e2e-auth-fixture.mjs`).
- **Target Viewports:**
  - 390 × 844 (Standard Mobile iPhone 14/15)
  - 440 × 900 (ViNha Canonical Desktop/Mobile App-Shell Target)
  - 360 × 640 (Compact Android / Small Screen Minimum)
- **Methodology:** Automated Playwright execution capturing high-precision `performance.now()` timestamps for:
  - Active-state visual response latency
  - First visual change (DOM attribute/style update)
  - Destination shell visible (route container / header render)
  - Primary content visible (data loaded or primary actionable surface interactive)
  - Layout shift / FAB Y-axis displacement (bounding box measurement)
  - Network RSC request counts and duplicate triggers

---

## 2. Baseline Measurements

### 2.1 Viewport 390 × 844

| Navigation Route        | Samples | Active State Latency (med / p95) | Shell Visible (med / p95) | Primary Content Visible (med / p95) | FAB Delta Y | Avg Requests |
| :---------------------- | :-----: | :------------------------------: | :-----------------------: | :---------------------------------: | :---------: | :----------: |
| Home → Money            |    3    |         54.8ms / 57.0ms          |        64ms / 65ms        |          1,381ms / 1,382ms          |     0px     |     6.0      |
| Money → Add Transaction |    3    |          5.2ms / 14.5ms          |        64ms / 66ms        |            880ms / 886ms            |     0px     |     4.0      |
| Add Transaction → Plan  |    3    |         10.4ms / 18.2ms          |        63ms / 63ms        |          2,032ms / 2,564ms          |     0px     |     6.0      |
| Plan → Inbox            |    3    |          3.4ms / 11.2ms          |        63ms / 65ms        |          1,389ms / 1,389ms          |     0px     |     6.0      |
| Inbox → Home            |    3    |          4.9ms / 7.5ms           |        63ms / 64ms        |          1,251ms / 1,504ms          |     0px     |     6.0      |
| Home → Plan             |    3    |          3.9ms / 5.5ms           |        64ms / 67ms        |          1,576ms / 1,853ms          |     0px     |     6.0      |
| Plan → Money            |    3    |          2.9ms / 3.1ms           |        63ms / 63ms        |          1,384ms / 2,367ms          |     0px     |     6.0      |
| Money → Inbox           |    3    |         12.0ms / 14.4ms          |        63ms / 65ms        |          1,393ms / 1,864ms          |     0px     |     6.0      |
| Inbox → Plan (Return)   |    3    |          4.6ms / 5.0ms           |        63ms / 67ms        |          1,546ms / 1,774ms          |     0px     |     6.0      |

### 2.2 Viewport 440 × 900

| Navigation Route        | Samples | Active State Latency (med / p95) | Shell Visible (med / p95) | Primary Content Visible (med / p95) | FAB Delta Y | Avg Requests |
| :---------------------- | :-----: | :------------------------------: | :-----------------------: | :---------------------------------: | :---------: | :----------: |
| Home → Money            |    3    |         58.0ms / 62.1ms          |        64ms / 65ms        |          1,376ms / 3,383ms          |     0px     |     6.0      |
| Money → Add Transaction |    3    |          5.4ms / 51.9ms          |        64ms / 64ms        |            881ms / 884ms            |     0px     |     4.0      |
| Add Transaction → Plan  |    3    |         12.1ms / 15.4ms          |        63ms / 68ms        |          1,633ms / 1,663ms          |     0px     |     6.0      |
| Plan → Inbox            |    3    |          2.3ms / 9.1ms           |        66ms / 68ms        |          1,386ms / 1,387ms          |     0px     |     6.0      |
| Inbox → Home            |    3    |          5.1ms / 5.7ms           |        65ms / 65ms        |          1,257ms / 1,575ms          |     0px     |     6.0      |
| Home → Plan             |    3    |          5.8ms / 7.0ms           |        64ms / 68ms        |          1,524ms / 1,529ms          |     0px     |     6.0      |
| Plan → Money            |    3    |          3.2ms / 4.5ms           |        65ms / 66ms        |          1,389ms / 1,393ms          |     0px     |     6.0      |
| Money → Inbox           |    3    |          2.5ms / 14.2ms          |        63ms / 65ms        |          1,405ms / 2,905ms          |     0px     |     6.0      |
| Inbox → Plan (Return)   |    3    |          4.1ms / 5.2ms           |        63ms / 64ms        |          1,479ms / 1,859ms          |     0px     |     6.0      |

### 2.3 Viewport 360 × 640

| Navigation Route        | Samples | Active State Latency (med / p95) | Shell Visible (med / p95) | Primary Content Visible (med / p95) | FAB Delta Y | Avg Requests |
| :---------------------- | :-----: | :------------------------------: | :-----------------------: | :---------------------------------: | :---------: | :----------: |
| Home → Money            |    3    |         53.4ms / 59.0ms          |       62ms / 113ms        |          1,385ms / 1,460ms          |     0px     |     6.0      |
| Money → Add Transaction |    3    |          5.0ms / 7.0ms           |        62ms / 65ms        |            885ms / 903ms            |     0px     |     4.0      |
| Add Transaction → Plan  |    3    |         11.5ms / 11.7ms          |        63ms / 67ms        |          1,725ms / 1,848ms          |     0px     |     6.0      |
| Plan → Inbox            |    3    |          5.5ms / 11.4ms          |        62ms / 63ms        |          1,392ms / 1,506ms          |     0px     |     6.0      |
| Inbox → Home            |    3    |          4.8ms / 15.9ms          |        64ms / 67ms        |          1,189ms / 1,286ms          |     0px     |     6.0      |
| Home → Plan             |    3    |          5.7ms / 8.5ms           |        63ms / 66ms        |          1,671ms / 1,912ms          |     0px     |     6.0      |
| Plan → Money            |    3    |          3.5ms / 4.3ms           |        62ms / 66ms        |          1,379ms / 1,859ms          |     0px     |     6.0      |
| Money → Inbox           |    3    |          5.6ms / 26.1ms          |        62ms / 64ms        |          1,368ms / 1,377ms          |     0px     |     6.0      |
| Inbox → Plan (Return)   |    3    |          4.1ms / 4.2ms           |        63ms / 66ms        |          1,524ms / 1,606ms          |     0px     |     6.0      |

---

## 3. Cold Navigation & Stress Scenarios

### 3.1 Cold Navigation Baseline

- **Cold Home → Money:** Shell visible: 84ms, Content visible: 1,077ms
- **Cold Money → Add Transaction:** Shell visible: 101ms, Content visible: 720ms
- **Cold Add Transaction → Plan:** Shell visible: 101ms, Content visible: 1,588ms

### 3.2 Rapid Switching & Repeated Tapping

- **Rapid switching (Home → Money → Plan within 120ms):**
  - Final destination: `/vi/plan`
  - Active tab count: 1 (Clean single active tab)
  - Navigation queue cleanly resolved without intermediate tab hangs.
- **Repeated tapping (3 rapid clicks on already active tab):**
  - Suppressed duplicate navigation: Yes
  - Duplicate RSC requests triggered: 0

### 3.3 Visual Overflow Baseline (360 × 640)

- **Navigation item text overflow:**
  - `Trang chủ`: clientWidth 69px vs scrollWidth 83px (`overflows: true`)
  - `Kế hoạch`: clientWidth 69px vs scrollWidth 70px (`overflows: true`)
  - **Verdict:** Navigation items on narrow viewports suffered from horizontal overflow due to rigid dot placement and non-truncating label wrappers.
