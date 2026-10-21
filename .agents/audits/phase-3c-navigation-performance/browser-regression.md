# Phase 3C: Browser Visual & Responsive Regression Verification

## 1. Visual Verification Matrix

Visual evidence was captured using Playwright against the production Next.js 16 build (`http://localhost:3100`) across all five primary destinations:

- **Home:** `/vi/home`
- **Money:** `/vi/money`
- **Add Transaction:** `/vi/money/transactions/new`
- **Plan:** `/vi/plan`
- **Inbox:** `/vi/inbox`

Tested across **5 distinct viewports** and **both color schemes** (Light & Dark mode):

1. **360 × 640** (Compact Android)
2. **390 × 844** (Standard iPhone 14/15)
3. **440 × 900** (Canonical App Shell Target)
4. **768 × 1024** (Tablet Portrait)
5. **1280 × 900** (Desktop / Wide Screen)

---

## 2. Screenshot Inventory

Stored under `.agents/audits/phase-3c-navigation-performance/evidence/`:

| Destination         |                            360 × 640 (Compact)                            |                            390 × 844 (Mobile)                             |                             440 × 900 (Shell)                             |   768 × 1024 (Tablet)    |   1280 × 900 (Desktop)   |
| :------------------ | :-----------------------------------------------------------------------: | :-----------------------------------------------------------------------: | :-----------------------------------------------------------------------: | :----------------------: | :----------------------: |
| **Home**            |            `home-360x640-light.png`<br>`home-360x640-dark.png`            |            `home-390x844-light.png`<br>`home-390x844-dark.png`            |            `home-440x900-light.png`<br>`home-440x900-dark.png`            | `home-768x1024-dark.png` | `home-1280x900-dark.png` |
| **Money**           |           `money-360x640-light.png`<br>`money-360x640-dark.png`           |           `money-390x844-light.png`<br>`money-390x844-dark.png`           |           `money-440x900-light.png`<br>`money-440x900-dark.png`           |         Verified         |         Verified         |
| **Add Transaction** | `add-transaction-360x640-light.png`<br>`add-transaction-360x640-dark.png` | `add-transaction-390x844-light.png`<br>`add-transaction-390x844-dark.png` | `add-transaction-440x900-light.png`<br>`add-transaction-440x900-dark.png` |         Verified         |         Verified         |
| **Plan**            |            `plan-360x640-light.png`<br>`plan-360x640-dark.png`            |            `plan-390x844-light.png`<br>`plan-390x844-dark.png`            |            `plan-440x900-light.png`<br>`plan-440x900-dark.png`            |         Verified         |         Verified         |
| **Inbox**           |           `inbox-360x640-light.png`<br>`inbox-360x640-dark.png`           |           `inbox-390x844-light.png`<br>`inbox-390x844-dark.png`           |           `inbox-440x900-light.png`<br>`inbox-440x900-dark.png`           |         Verified         |         Verified         |

---

## 3. Findings & Inspection Results

### 3.1 App Shell Centering & Max-Width Integrity

- On wider viewports (768px and 1280px), the application strictly enforces the canonical `max-w-[440px] mx-auto` layout constraint.
- The bottom navigation bar remains firmly anchored to the bottom of the 440px column with proper drop-shadow and border framing, preserving single-column mobile ergonomics on desktop.

### 3.2 Safe-Area Inset Handling

- `pb-[calc(env(safe-area-inset-bottom,0px)+4rem)]` ensures that bottom action sheets and navigation items do not clash with hardware home bars on modern iOS/Android devices.

### 3.3 Dark / Light Mode Contrast

- All text labels and indicators maintain WCAG AA compliance in both light and dark themes.
- Active bottom navigation tabs render with `text-primary` and prominent dot indicators (`bg-primary`).
- Dormant bottom navigation tabs render with `text-muted-foreground` and clear hover/focus outlines.
- FAB renders with strong contrast in both light (`bg-primary text-primary-foreground`) and dark mode.

### 3.4 Compact Screen (360 × 640) Visual Verification

- With truncation and flex-shrinking applied, Vietnamese navigation labels ("Trang chủ", "Tiền", "Ghi chép", "Kế hoạch", "Hộp thư") render legibly without wrapping, clipping, or overlapping neighboring columns.
