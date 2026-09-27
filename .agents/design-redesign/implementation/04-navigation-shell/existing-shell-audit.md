# Existing Shell Audit — Pre-Implementation 04

**Date**: 2026-09-27  
**Auditor**: Implementation Agent  
**Conclusion**: Shell layer is MATURE. No rearchitecting needed.

---

## 1. Components Audited

### `shared/patterns/app-viewport.tsx`

- **Status**: ✅ REUSE as-is
- **Responsibilities**: 440px max-width, centered, PortalProvider, StatusAlertHost, ToastProvider, Modal host overlay
- **Notes**: `isolate [transform:translateZ(0)]` creates a stacking context — RAC/HeroUI overlays stay inside the canvas frame

### `shared/patterns/chrome-shell.tsx`

- **Status**: ✅ REUSE as-is
- **Responsibilities**: Wraps AppViewport, provides chrome type (auth/system/product), footer slot, main scroll region
- **Notes**: Uses `SHELL_SCROLL_REGION_SLOT` for the `<main>` element data-slot

### `shared/patterns/top-app-bar.tsx`

- **Status**: ✅ REUSE as-is
- **Variants**: primary, contextual, detail, form
- **Back navigation**: supports both `onBack` callback and `backHref` link (44×44px targets)
- **Slots**: eyebrow, title (string renders as `<h1>`), subtitle, meta, status, insight, trailing, icon

### `shared/patterns/bottom-navigation.tsx`

- **Status**: ✅ REUSE as-is
- **Tabs**: 5 (Home, Money, Plan, Inbox, Together)
- **Active state**: `aria-current="page"` + `data-active` + `bg-primary-soft` container
- **Optimistic navigation**: immediate visual feedback before route settles
- **Pending indicators**: hairline bar at tab top during page load
- **Suppression**: `isStandaloneFlowPath()` hides nav on action-sheet flows

### `shared/patterns/floating-action.tsx`

- **Status**: ✅ REUSE as-is
- **Layout**: `position: fixed`, pointer-transparent wrapper, pointer-events on button only
- **Clearance**: `data-slot="floating-action-clearance"` div reserves in-flow space

### `shared/patterns/page.tsx`

- **Status**: ✅ REUSE as-is
- **Slots**: `topBar` (header), `children` (content with standard gutters)

### `shared/patterns/section-header.tsx`

- **Status**: ✅ REUSE as-is
- **Usage**: Section titles with h2 heading semantics + optional action

### `shared/patterns/product-route-transition.tsx`

- **Status**: ✅ REUSE as-is
- **Behavior**: Opacity fade only on primary tab routes; no translate to avoid layout shift

### `shared/patterns/locale-switcher.tsx`

- **Status**: ✅ REUSE as-is
- **Tones**: DEFAULT (accent background on active) | QUIET (text-only)

### `providers/safe-area.tsx`

- **Status**: ✅ REUSE as-is
- **Implementation**: CSS `env(safe-area-inset-*)` padding for notched devices

---

## 2. CSS Layout Tokens (all present in `styles/globals.css`)

| Token                               | Value          |
| ----------------------------------- | -------------- |
| `--app-viewport-max`                | `440px`        |
| `--bottom-navigation-height`        | `56px`         |
| `--bottom-nav-height`               | `56px` (alias) |
| `--top-bar-height`                  | `56px`         |
| `--floating-action-size`            | `3rem`         |
| `--floating-action-gap`             | `16px`         |
| `--floating-action-clearance`       | calc           |
| `--page-gutter`                     | `16px`         |
| `--z-nav`                           | `20`           |
| `--z-floating-action`               | `25`           |
| `--safe-area-top/right/bottom/left` | `env(...)`     |

---

## 3. Z-Index Layering (confirmed correct)

```
--z-base: 0          (canvas layer)
--z-surface: 1       (card surfaces)
--z-sticky: 10       (BottomActionBar, StickyFormAction)
--z-nav: 20          (BottomNavigation)
--z-floating-action: 25 (FAB)
--z-dropdown: 30     (Select popovers)
--z-overlay: 40      (HeroUI overlays)
--z-scrim: 50        (backdrop scrims)
--z-modal: 60        (Dialog, BottomSheet)
--z-modal-sheet: 60  (ActionSheet)
--z-toast: 70        (Toast notifications)
```

---

## 4. Product Layout Integration (`app/[locale]/(product)/layout.tsx`)

```
ProductLayout
├── FinancialPrivacyProvider
└── ChromeShell (chrome="product")
    ├── ProductRouteTransition
    │   └── {children}  ← each route's page.tsx
    └── ProductNavigationShell (Suspense)
        └── BottomNavigation (inboxCount)
```

Each route page.tsx uses `<Page topBar={<TopAppBar>}>` pattern consistently.

---

## 5. Gaps Identified & Resolved

| Gap                                            | Resolution                                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| No impl docs for Stage 05 shell                | Created this docs directory                                                       |
| No canonical `FloatingAddCTA` export           | `HomeCaptureAction` correctly composes `FloatingActionButton`                     |
| No dedicated shell navigation integration test | Existing 15 tests in `app-shell-foundation.test.tsx` cover all critical behaviors |

---

## 6. Verdict

**ZERO structural changes needed to existing shell.**  
The shell already fully implements the Stage 5 specification from `implementation-order.md`.  
All 15 unit tests pass. The product layout is correct.
