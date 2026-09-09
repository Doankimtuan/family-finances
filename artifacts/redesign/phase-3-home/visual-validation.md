# Phase 3 — Visual validation

Live checks ran against `http://localhost:3000` on 9 Sep 2026.

Authenticated Home (`/en/home`) redirected to `/en/login`. Live signed-in Home was not opened in this pass (credentials were not loaded into the verification shell). Home composition, total-assets hero, on-hero transactions pill, Inbox preview, and capture FAB are covered by focused unit tests (`tests/unit/home-command-center.test.tsx`, `tests/unit/home-ia-ux.test.tsx`, `tests/unit/home-cash-flow-semantics.test.tsx`). No authentication bypass and no seeded financial data.

## Viewport measurements (shared `AppViewport` shell, Login)

| Viewport | Shell width | Centered | Horizontal overflow | Notes |
| --- | --- | --- | --- | --- |
| 390 × 844 | 390px | Full-bleed in a 390 canvas | None | Compact mobile |
| 440 × 844 | 440px | Full-bleed canonical column | None | Canonical ViNha shell |
| 768 × 1024 | 440px | Yes (`left = 164`) | None | Still a mobile product, centered |
| 1280 × 900 | 440px | Yes (`left = 420`) | None | No desktop Home layout |

`#app-viewport-root` stayed `max-width: 440px` at every width.

## Authenticated Home (code + tests)

Inspected implementations; not opened with real household data:

- Hero is one `Card tone="hero"` with `Balance` (`data-financial-kind="current-state"`) labeled Total assets, plus an on-hero `HeroPillLink` to transactions
- Inbox pending surface is a single link to `/inbox` (no nested primary button)
- Period control is 44px (`min-h-11`) on the period story, not on the hero
- FAB remains `FloatingAction` / `FloatingActionButton`
- Loading skeleton mirrors hero → Inbox → Plan → period → Money products
- Day-zero empty state still offers Add account / Plan / Invite without fake numbers

## Accessibility spot-check (implementation)

- Hero group `aria-label` = total assets across accounts, savings, and investments
- Movement group `aria-label` = net cash flow for the selected period
- Inbox pending link `aria-label` = Review in Inbox
- Period control `role="group"` + `aria-pressed` on segments
- Color is never the only cue: net uses icon + signed amount + status label
- Period targets are 44px; Inbox pending row is `min-h-11`
- `MotionReveal` remains a single hero-group reveal; period switch uses opacity only

## Issues found

Authenticated Home live pass is blocked without a session. Shell geometry matches Phase 2. Re-run Home in a signed-in browser before release: 390 / 440 / 768 / 1280, light + dark, reduced motion, Inbox pending vs clear, day-zero, and Add transaction → capture → back to Home.
