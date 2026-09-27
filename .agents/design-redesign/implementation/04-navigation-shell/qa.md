# Implementation 04 — Browser QA Evidence

**Date**: 2026-09-27  
**Browser**: Chromium (localhost:3000)  
**Result**: ✅ ALL PASS — Zero visual anomalies

---

## Viewport Matrix

| Viewport | Route  | TopAppBar     | BottomNav | FAB        | Active Tab      | Layout            |
| -------- | ------ | ------------- | --------- | ---------- | --------------- | ----------------- |
| 390×844  | /home  | ✅ contextual | ✅ 5 tabs | ✅ visible | ✅ Home tinted  | ✅ full-width     |
| 440×956  | /home  | ✅ contextual | ✅ 5 tabs | ✅ visible | ✅ Home tinted  | ✅ full-width     |
| 768×1024 | /home  | ✅ contextual | ✅ 5 tabs | ✅ visible | ✅ Home tinted  | ✅ 440px centered |
| 1280×800 | /home  | ✅ contextual | ✅ 5 tabs | ✅ visible | ✅ Home tinted  | ✅ 440px centered |
| 390×844  | /money | ✅ primary    | ✅ 5 tabs | —          | ✅ Money tinted | ✅ full-width     |
| 390×844  | /plan  | ✅ primary    | ✅ 5 tabs | —          | ✅ Plan tinted  | ✅ full-width     |

---

## Element Verification

### BottomNavigation

- 5 tabs rendered: Home, Money, Plan, Inbox, Together
- Active tab: `bg-primary-soft` background fill, primary text color, icon at emphasized stroke
- Inbox badge: counter displayed (17) with `ring-2 ring-canvas` for separation
- Optimistic state: tab highlights immediately on click before route settles
- `aria-current="page"` on the committed active tab only
- `min-h-14` on all touch targets (≥ 44px)

### TopAppBar (Contextual — Home)

- BrandMark + workspace name in eyebrow
- Large contextual title (`text-3xl leading-tight`)
- Account summary meta text
- Trailing slot (privacy toggle)

### FloatingActionButton (Home)

- Pill shape (`rounded-full`)
- Fixed position above bottom nav
- `min-h-(--floating-action-size)` = 3rem
- `pointer-events-none` on wrapper, `pointer-events-auto` on button
- Clearance zone reserves in-flow space so content scrolls clear

### AppViewport (Desktop — 1280px)

- 440px column centered
- Decorative ambient background gradient visible behind the frame
- `min-[481px]:rounded-[var(--radius-overlay)]` corner rounding on the frame
- `min-[481px]:shadow-[var(--elevation-2)]` depth shadow

---

## Screenshots Evidence

Screenshots are saved in the artifacts directory:

- `shell_390x844_home_*.png`
- `shell_440x956_home_*.png`
- `shell_768x1024_home_*.png`
- `shell_1280x800_home_*.png`
- `shell_390x844_money_*.png`
- `shell_390x844_plan_*.png`
- `shell_qa_verification_*.webp` (browser recording)

---

## Dark Mode

Dark mode is automatically applied when the system OS is in dark mode.
Shell uses `class-based dark theme` (`.dark` or `[data-theme="dark"]` on `<html>`).
Canvas: `#141416`, Surface: `#1C1C1F`, correct per Warm Precision tokens.

---

## Verdict

**Implementation 04 — Navigation & Shared App Shell: COMPLETE ✅**

The shell fully matches the Stage 5 specification from `implementation-order.md`.  
Zero structural changes were needed to the existing codebase.  
All 15 unit tests pass. All viewport checks pass. Ready for Stage 6 (Auth screens).
