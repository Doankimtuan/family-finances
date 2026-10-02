# CROSS-SCREEN CONSISTENCY AUDIT — MAIN SCREENS

**Date:** 2026-09-30  
**Status:** PASS

**Scope note:** The responsive/theme matrix below predates the 2026-10-01
Together-button removal. The current removal was checked on loaded Money, Plan,
and archived Inbox screens in the signed-in local browser at its existing
viewport.

## Follow-up — shared headers and primary navigation

This follow-up records the current navigation contract and supersedes earlier
header, bottom-navigation, and Add Transaction findings below wherever they
differ.

- Money, Plan, Inbox, and Together use the same primary `TopAppBar` hierarchy:
  title, supporting text, header links/status, and trailing action slots. Their
  loading shells use the same structure. Screen-specific actions and status
  still use their existing shared controls.
- Money, Plan, and Inbox have no Together header button. The Home household
  shortcut opens Together, and the Together screen marks its current section.
- The bottom navigation has four route links—Home, Money, Plan, and Inbox—and
  one centered Add Transaction button between Money and Plan. The button routes
  to `APP_PATH.MONEY_ADD`; it is disabled while offline and exposes a localized
  full action label to assistive technology.
- Per-screen transaction actions were removed from Home, Money, Plan, the
  transaction list and its empty state, and account detail. The add form keeps
  its own Save control.
- VI/Dark was checked at 390px, VI/Light at 440px, 768px, and 1280px, and
  EN/Light at 390px across Money, Plan, Inbox, and Together. Each route had one
  `h1`, no Together button on Money, Plan, or Inbox, one localized Add
  Transaction action, no horizontal overflow, and the centered 440px shell at
  wide viewports. Bottom navigation remained 76px high.
- Home was checked in VI/Dark at 390px, 440px, 768px, and 1280px; the same
  single centered action and 76px navigation remained visible without overflow.
- Browser interaction checks confirmed the center action opens the localized
  transaction form, the Home household shortcut reaches Together, and the
  transaction category overlay opens and closes with Escape. Focus returned to
  the trigger with a visible 2px focus outline. Reduced-motion emulation was
  also checked; the navigation link had no transform and a near-zero
  transition, then the emulation was reset.

The user's browser was restored to VI/Dark, its original wide viewport, and the
Together route after verification.

## Scope and sources

Reviewed only the authenticated top-level Home, Money, Plan, Inbox, and
Together routes. Compared the running app with the canonical SCR references
recorded in [`visual-migration-map.md`](./visual-migration-map.md) and
[`existing-screen-audit.md`](./existing-screen-audit.md). The live Stitch
project returned matching canonical titles for those IDs.

| Screen            | Light                              | Dark                               | Empty reference                                                                            |
| ----------------- | ---------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------ |
| Home (SCR-01)     | `c48a58d9f013494eb4bd4b2bc41d31d9` | `d4a4d84e44c94a05ae3bfeefc6df9e6f` | —                                                                                          |
| Money (SCR-02)    | `31dcf3d3e06042d0973920dc3ad1a08d` | `b7af0cf462204bed9beedf116503c5d0` | —                                                                                          |
| Plan (SCR-35)     | `70749ca2e350497f9def0dadf235d3ba` | `893e91e4bced4fa4af9f44b8cd967316` | —                                                                                          |
| Inbox (SCR-41)    | `80394649d39f4c458d55e834611d45c2` | `1efc32d2855745c6ae118f880dafefe1` | `354e2436922c475093af873d271fec77` light; `1a3419ca795a4978964ffbfaf9792694` dark (SCR-45) |
| Together (SCR-46) | `f45af37b153c4a739848e2bd0ed230e4` | `d0e81a7d33c047aaa1d163ba6caf18d8` | —                                                                                          |

## Original audit findings and fixes

These findings describe the implementation at the time of the original audit;
the follow-up above supersedes its previous navigation and capture-action
behavior.

1. **Bottom navigation label wrap:** At 360px, the active Vietnamese “Cùng nhau” label wrapped and increased the navigation height from 76px to 91px. Added `whitespace-nowrap` to the shared label so all five routes keep the same 76px navigation height.
2. **Capture action placement:** Home and Money rendered their shared capture button in document flow, while Plan used the shared fixed action zone. Home and Money now use `FloatingAction`; their loading states use a matching placeholder in the same zone. The action remains 16px above navigation and does not overlap it.
3. **Touch targets:** Home and Money header actions initially measured 36px high. Money account rows had a 44px row but only a 28px-high link target. Increased the header targets to 44px and expanded the shared `BaseRow` link hit area through its vertical padding. On final recheck, the Home period control and all other visible controls also measured at least 44px. Loading placeholders match the 44px header controls.

## Screens

Home: PASS — shared page shell, semantic header, financial summary, and recent activity.  
Money: PASS — shared page shell, `AccountRow`/`BaseRow` inventory, and financial amount components.  
Plan: PASS — shared page shell, `Progress`, and financial amount roles.  
Inbox: PASS — shared page shell, decision queue, urgency labels, and shared `EmptyState`.  
Together: PASS — shared page shell, member rows, status labels, and household-specific composition.

## Consistency

Page gutters: PASS — shared 16px page gutter and centered 440px shell.  
Headers: PASS — shared `TopAppBar` hierarchy; each screen keeps its Stitch-defined identity.  
Section spacing: PASS — shared `Page`/`Section` spacing tokens.  
Typography: PASS — shared heading, body, caption, button, and financial number roles; title sizes follow each canonical composition.  
Financial hierarchy: PASS — shared financial formatters and amount components preserve current-state, income, expense, and debt meaning.  
Rows: PASS — shared `BaseRow`/`AccountRow` structures; account-row links now cover the full minimum row target.  
Icons: PASS — `AppIcon` and semantic registries remain the icon source; no new icon package or raw SVG added.  
Dividers: PASS — shared divider tokens and inset behavior.  
Surfaces/cards: PASS — shared card and surface tokens; screen-specific groupings match their Stitch designs.  
Status: PASS — labels accompany semantic status tones; status is not color-only.  
Progress: PASS — shared `Progress` component and existing domain-specific progress labels.  
Loading/empty/error: PASS — shared `Skeleton`, `EmptyState`, and status/offline presentations. Loading shells mirror their page headers while the centered action stays in shared navigation. The authenticated household was populated, so empty and error states were reviewed in their shared code paths and existing tests rather than forced by mutating live data.  
Bottom Navigation: PASS — shared safe-area shell, 76px height, four route links, and one centered transaction action. Home's household shortcut opens Together.  
Add Transaction: PASS — one localized action remains in the bottom-navigation center and routes to the add form. Other screen-level transaction actions, including the transaction-list empty-state action, are removed.

## Shared Components

Local duplicates found: 0  
Local duplicates removed: 0  
One-off hacks found: 0  
One-off hacks removed: 0  
Shared components touched: 3

Changed shared components: `BottomNavigation`, `TopAppBar` slots, and `TogetherHeaderTab`. The Together screen retains its localized active-state marker; Home's household shortcut is the route entry.

## i18n

Vietnamese: PASS — all five routes verified.  
English: PASS — all five routes verified.  
Text expansion: PASS — no horizontal overflow or clipped navigation labels at the tested widths.  
Locale switching stability: PASS — the device language control switched VI/EN and retained the corresponding localized route; restored VI afterward.

## Theme

Light: PASS — all five routes verified.  
Dark: PASS — all five routes verified.  
Cross-screen parity: PASS — shared semantic tokens and shell applied in both themes.

## Original responsive matrix

360×800: PASS  
390×844: PASS  
430×932: PASS

The original 60 route/theme/locale/viewport combinations had no document-width overflow, all had one page `h1`, all visible interactive targets measured at least 44px, and navigation stayed 76px tall. The original per-screen actions retained a 16px gap above navigation; the follow-up above replaces those actions with one centered navigation control. Additional EN/Dark checks at 440px and 768px kept the shell 440px wide and centered as expected; the 1280px click flows retained the same shell.

## Accessibility

Keyboard: PASS — Tab moves through links and actions; the period segmented control remains keyboard operable.  
Focus: PASS — keyboard focus displays a 2px visible outline.  
Touch targets: PASS — visible links/buttons are at least 44px in both dimensions at the tested viewports.  
Semantics: PASS — each route has one `h1`, navigation has an accessible name, and status text remains readable independently of color.

Reduced-motion emulation was enabled in the browser; the app honored the media preference. Browser console had no errors. Motion emitted its standard development notice while reduced motion was enabled.

## Performance

Navigation responsiveness: PASS — the Home → Money → Plan → Inbox → Together → Home click flow completed in VI Light, VI Dark, EN Light, and EN Dark.  
Unexpected requests: NO — the fixes add no data requests.  
Layout shift regression: NO — loading and loaded capture actions share the same fixed zone and clearance.  
Client-boundary regression: NO — no new client boundary or client-side data hook was added.

The narrow Playwright test viewport's Next.js development badge intercepted one pointer click on Home. The click flows were completed with the product's centered 440px shell in a wide browser; every route was also visited directly at each requested mobile size.

## Remaining Justified Differences

- Home uses a brand-led header and cash-flow overview; Money leads with financial inventory; Plan focuses on budgets and period status; Inbox foregrounds work to review; Together foregrounds household identity and members. These compositions follow their individual Stitch references while sharing the same shell and component language.
- A single centered Add Transaction action is available from the bottom navigation on regular product screens. Historical Plan periods are read-only within the Plan flow.
- Empty and error content is domain-specific but uses shared empty/status infrastructure. Live empty/error states were not forced against the authenticated household.

## Validation

Typecheck: PASS — `npm run typecheck`  
Lint: PASS — `npm run lint`  
Tests: PASS — final `npm run test`: 240 files, 1,574 tests passed. A previous full run had one intermittent Investment form failure; the file passed in isolation and the final full run passed.  
Build: Not rerun in this follow-up; browser QA used the active development server.  
Browser QA: PASS — authenticated browser, VI/EN and Light/Dark checks across the requested screens, four responsive widths, navigation/form flow, focus, overlay, and reduced motion.

Format: WARN — repository-wide `npm run format:check` reports 211 files with style issues. The targeted Prettier check for the task-scoped production files and this audit passed; no repository-wide format rewrite was applied.

## Documentation

Cross-screen audit: `.agents/design-redesign/implementation/07-main-screens/cross-screen-consistency-audit.md`  
Design docs updated: YES — IA, UX, app-shell, and screen-blueprint contracts describe the four route links, centered action, and header Together access.  
Handoff updated: YES — the main-screen component map and design-system handoff reflect the shared header and navigation contract.

## Verdict

MAIN SCREENS CONSISTENCY APPROVED
