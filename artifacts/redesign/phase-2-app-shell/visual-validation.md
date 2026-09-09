# Phase 2 — Visual validation

Live checks ran against `http://localhost:3000` on 9 Sep 2026. Authenticated product chrome (five tabs, FAB, Home/Money TopAppBar) could not be opened: `/en/home` redirected to login and no session was available in this environment. Those surfaces are covered by focused unit tests (`tests/unit/app-shell-foundation.test.tsx`, `tests/unit/bottom-navigation.test.ts`).

## Viewport measurements (Welcome / Login shell)

| Viewport | Shell width | Centered | Horizontal overflow | Notes |
| --- | --- | --- | --- | --- |
| 390 × 844 | 390px (`max-width: 440px`) | Full-bleed in a 390 canvas | None | Compact mobile |
| 440 × 844 | 440px | Full-bleed canonical column | None | Canonical ViNha shell |
| 768 × 1024 | 440px | Yes (`left ≈ 164`) | None | Still a mobile product, centered |
| 1280 × 900 | 440px | Yes (`left = 420`) | None | No desktop sidebar / dashboard |

`#app-viewport-root` stayed `max-width: 440px` at every width. No second shell.

## Theme

| Theme | Canvas | Text | Result |
| --- | --- | --- | --- |
| Dark (system) | `rgb(20, 20, 22)` | light primary | Coherent dark surfaces, teal CTA |
| Light (class removed) | `rgb(250, 250, 249)` | `rgb(24, 24, 27)` | Warm-stone canvas, teal primary, visible input borders |

Welcome and Login were checked in both themes. Primary CTA remains the single dominant action (Create account / Log in). Secondary actions stay visually subordinate.

## Auth / form foundation (Login, 440 light)

| Control | Measured height | Notes |
| --- | --- | --- |
| Back to welcome | 44px | Shared header back target |
| Email field | 56px | Auth field (`min-h-14`) |
| Log in | 56px | One primary |
| Remember me label | 44px | Checkbox glyph is 20px; label is the hit target |

Labels sit above inputs. Password reveal control is 44px. Forgot-password is a teal text link, not a second primary.

## Accessibility spot-check

- Focus rings are implemented on `Button`, `IconButton`, `Input`, nav tabs, and back links (`outline-focus-ring`).
- Automated Tab in the embedded browser did not move document focus off `body` (webview limitation). CSS `focus-visible` remains the contract.
- Decorative icons on empty/error plates are `aria-hidden`.
- Bottom nav uses visible labels + `aria-current`, not color alone.

## Product screens (code + tests, not live session)

Inspected implementations, not redesigned:

- Home / Money — `FloatingAction` + `FloatingActionButton` Add Transaction
- Transactions — same Money capture pill
- Plan / Inbox / Together — still five-tab `BottomNavigation` via product layout
- Detail — `TopAppBar variant="detail"` with back
- Form — `BottomActionBar` / `SheetActionFooter`
- Sheet — shared `ActionSheetLayout` physics unchanged

Unit tests assert: five tabs, attached nav (no floating 481px container), 56px tab targets, Home `aria-current`, FAB pointer-transparent zone + pill control, BottomActionBar page gutter, sheet 90dvh / overlay radius, financial kind attributes.

## Issues found

None that required a foundation rollback. Authenticated five-tab + FAB live pass should be done at the start of Phase 3 (or with E2E credentials).
