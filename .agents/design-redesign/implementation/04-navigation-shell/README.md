# Implementation 04 — Navigation & Shared App Shell

**Status**: ✅ COMPLETE  
**Depends on**: Implementation 01 (Foundations), 02 (Core Components), 03 (Overlays/Forms)  
**Next**: Implementation 05 — Auth & Onboarding Screens

---

## Objective

Establish a stable shared application shell so every authenticated product screen
only provides content — never navigation, safe-area insets, viewport width, page
headers, or scroll ownership.

---

## Shell Architecture

```
AppViewport (440px max-width, centered, PortalProvider)
└── SafeArea [top]
    └── ChromeShell (product chrome)
        ├── ProductRouteTransition (motion/react fade)
        │   └── [Route Page Content]
        │       ├── TopAppBar (variant: primary | contextual | detail | form)
        │       ├── [Screen content via <Page> pattern]
        │       └── FloatingAction (where applicable)
        └── ProductNavigationShell
            └── BottomNavigation (5 tabs + optimistic state)
```

## Canonical Layer Responsibilities

| Layer                    | Owns                                                          |
| ------------------------ | ------------------------------------------------------------- |
| `AppViewport`            | 440px max-width frame, PortalProvider, Toast host, Modal host |
| `SafeArea`               | `env(safe-area-inset-top/bottom)` padding                     |
| `ChromeShell`            | Flex column, `overflow-hidden`, footer slot                   |
| `ProductRouteTransition` | opacity fade on primary-tab route changes                     |
| `Page`                   | Per-screen header slot + content gutter                       |
| `TopAppBar`              | 56px bar, 4 variants, back/trailing/title                     |
| `BottomNavigation`       | 5-tab sticky chrome, optimistic state, pending indicators     |
| `FloatingAction`         | Fixed 48px pill above BottomNavigation, clearance zone        |
| `SectionHeader`          | Section titles with trailing action slots                     |
| `LocaleSwitcher`         | VI / EN language toggle                                       |

## Key CSS Tokens

| Token                         | Value                      | Purpose                   |
| ----------------------------- | -------------------------- | ------------------------- |
| `--app-viewport-max`          | `440px`                    | Max content width         |
| `--bottom-navigation-height`  | `56px`                     | Nav bar height            |
| `--floating-action-size`      | `3rem`                     | FAB pill height           |
| `--floating-action-gap`       | `16px`                     | Gap above bottom nav      |
| `--floating-action-clearance` | `calc(3rem + 16px + 48px)` | Scroll clearance          |
| `--top-bar-height`            | `56px`                     | Top bar height            |
| `--page-gutter`               | `16px`                     | Horizontal content gutter |
| `--z-nav`                     | `20`                       | BottomNavigation z-index  |
| `--z-floating-action`         | `25`                       | FAB z-index               |

## Standalone Flow Suppression

`isStandaloneFlowPath()` hides BottomNavigation on:

- `/money/transactions/new`
- `/plan/ritual`
- `/money/savings/new`
- `/money/investments/new`
- `/together/invitations/new`
- Any transaction edit/correct/refund detail routes

## TopAppBar Variants

| Variant      | Usage                                                 |
| ------------ | ----------------------------------------------------- |
| `primary`    | Root hub screens (Home, Money, Plan, Inbox, Together) |
| `contextual` | Expressive hero headers with large title              |
| `detail`     | Back navigation + entity identity                     |
| `form`       | Create/edit form pages                                |

## Tests

- `tests/unit/app-shell-foundation.test.tsx`: 15 cases
- `tests/unit/bottom-navigation.test.ts`: additional nav coverage

All shell tests pass.
