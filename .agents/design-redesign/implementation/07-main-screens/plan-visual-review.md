# PLAN OVERVIEW — STITCH VISUAL PARITY REVIEW

## Status

PASS — the Plan Overview follows the supplied Stitch composition, including the compact Jar list, separate upcoming payment cards, and two ending shortcut tiles. Sixteen of nineteen recorded differences are fixed; period selection and per-Jar category artwork remain `MOCK / LOGIC PENDING`, and the shared fixed transaction action is a documented responsive adaptation. Jar sorting toggles between the supplied order and localized name order.

## Stitch and Route

- Project: `16826760243481546078`
- Dark screen: `893e91e4bced4fa4af9f44b8cd967316`
- Light screen: N/A — no light Stitch screen was supplied.
- Route: `/vi/plan`; English route: `/en/plan`.
- The attached comparison image is 486 × 585 px. The canonical downloaded Stitch screen in the evidence folder is 389 × 512 px.

## Visual Evidence

### Stitch — canonical dark

![Stitch Plan Overview, dark](plan-visual-review-assets/stitch-plan-overview-dark.png)

### Current before — prior Plan UI, 390 × 844 px, dark

![Plan Overview before](plan-visual-review-assets/current-before-390-dark-vi.png)

### Current after — 440 × 956 px, dark, Vietnamese

This width matches the intentional 440 px application shell and keeps the header subtitle on one line.

![Plan Overview after](plan-visual-review-assets/final-dark-440-vi.png)

### Jar list — Stitch and current

![Stitch Jar list section](plan-visual-review-assets/stitch-plan-jars-section.png)
![Plan Jar list before](plan-visual-review-assets/current-plan-jars-section-before.png)
![Plan Jar list after, 440 px](plan-visual-review-assets/final-list-dark-440-vi.png)

### Upcoming payments and shortcut tiles — final

The current household has two card payments due on October 5. The shortcut uses the live September period, so the label is “Nhìn lại tháng 9”; the October sample labels and amounts were not copied.

- 390 × 844, dark: ![390 px upcoming and shortcuts](plan-visual-review-assets/final-upcoming-shortcuts-390-dark-vi.png)
- 440 × 956, dark: ![440 px upcoming and shortcuts](plan-visual-review-assets/final-upcoming-shortcuts-440-dark-vi.png)
- 768 × 1024, dark: ![768 px upcoming and shortcuts](plan-visual-review-assets/final-upcoming-shortcuts-768-dark-vi.png)
- 1280 × 900, dark: ![1280 px upcoming and shortcuts](plan-visual-review-assets/final-upcoming-shortcuts-1280-dark-vi.png)
- 390 × 844, light: ![390 px upcoming and shortcuts, light](plan-visual-review-assets/final-upcoming-shortcuts-390-light-vi.png)
- 390 × 844, keyboard focus: ![Keyboard focus on monthly review shortcut](plan-visual-review-assets/final-upcoming-shortcuts-390-dark-vi-focus.png)

### Responsive and localization evidence

- 360 × 800: ![360 px, Vietnamese, dark](plan-visual-review-assets/final-dark-360-vi.png)
- 390 × 844: ![390 px, Vietnamese, dark](plan-visual-review-assets/final-dark-390-vi.png)
- Jar list, 390 × 844: ![390 px Jar list, Vietnamese, dark](plan-visual-review-assets/final-list-dark-390-vi.png)
- Jar list, 440 × 956: ![440 px Jar list, Vietnamese, dark](plan-visual-review-assets/final-list-dark-440-vi.png)
- 430 × 932: ![430 px, Vietnamese, dark](plan-visual-review-assets/final-dark-430-vi.png)
- 440 × 956: ![440 px, Vietnamese, dark](plan-visual-review-assets/final-dark-440-vi.png)
- 768 × 1024: ![768 px, Vietnamese, dark](plan-visual-review-assets/final-dark-768-vi.png)
- 1280 × 900: ![1280 px, Vietnamese, dark](plan-visual-review-assets/final-dark-1280-vi.png)
- English, dark: ![English, dark](plan-visual-review-assets/final-dark-390-en.png)
- Vietnamese, light: ![Vietnamese, light](plan-visual-review-assets/final-light-390-vi.png)
- English, light: ![English, light](plan-visual-review-assets/final-light-390-en.png)
- Keyboard focus: ![Visible period-control focus](plan-visual-review-assets/final-dark-390-vi-focus.png)

## Differences Found and Disposition

Nineteen meaningful differences were recorded. Sixteen are fixed; period selection and category-specific Jar artwork remain pending, and one app-shell overlay is classified as a responsive adaptation.

| #   | Difference                                                                            | Disposition                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The header used a generic Plan label and household actions.                           | Fixed — localized title, subtitle, and allocation action.                                                                                                 |
| 2   | The current period and assistance state were buried in the old summary.               | Fixed visually — a month row and semantic assistance badge precede the summary. Period selection itself remains pending.                                  |
| 3   | The green hero surface did not match Stitch’s neutral summary card.                   | Fixed — reused the shared default Card surface.                                                                                                           |
| 4   | The date progress and today marker were absent.                                       | Fixed — household-local calendar day, month length, elapsed-day percentage, and “Today” marker. This is calendar progress, not a financial pace estimate. |
| 5   | Spending progress was not shown in the summary.                                       | Fixed — live aggregate usage with a capped fill and a distinct segment for live spend in overspent Jars.                                                  |
| 6   | Planned, spent, and remaining amounts lacked the target hierarchy.                    | Fixed — three aligned live summary metrics with semantic intention values.                                                                                |
| 7   | Overspending used generic copy without Jar-level values.                              | Fixed — semantic danger alert names a live Jar and shows its actual spend, plan, and overage.                                                             |
| 8   | The active Jar preview did not follow the attention area.                             | Fixed — active Jars follow the summary and overspending alert.                                                                                            |
| 9   | Jar rows were tall and placed the kind, active state, and amount on separate lines.   | Fixed — shared `JarCard` has an overview variant with name/kind, remaining amount, spend/plan, status, and progress in a compact card.                    |
| 10  | Over-budget status relied too much on color.                                          | Fixed — overage uses an explicit plus amount and “Over budget” label; only progress fill is capped.                                                       |
| 11  | Filters used detached count bubbles and the section had excess supporting copy.       | Fixed — counts sit inline in each chip and the section uses Stitch’s count heading.                                                                       |
| 12  | Upcoming commitments and secondary destinations were out of the new hierarchy.        | Fixed — existing upcoming events and Plan routes follow the Jar section.                                                                                  |
| 13  | Loading states did not follow the revised section order.                              | Fixed — Plan skeletons mirror the summary, attention, Jar, and upcoming sections.                                                                         |
| 14  | The transaction action and fixed navigation relationship needed verification.         | Fixed — the existing capture action remains above navigation; on a short section crop it may overlap the last card until the full page is scrolled.       |
| 15  | Stitch shows a Jar sort control.                                                      | Fixed — the button toggles between the supplied order and alphabetical order using localized Jar names.                                                   |
| 16  | Stitch uses a category icon and allocation tag for each Jar.                          | `MOCK / LOGIC PENDING` — current Plan data contains kind, not category/icon metadata; existing localized kind remains visible.                            |
| 17  | The supplied Jar crop omits the app-wide fixed transaction action.                    | `RESPONSIVE ADAPTATION` — at 390 × 844 the fixed action can overlap the last card’s lower-right corner in a section crop; scrolling the page clears it.   |
| 18  | Upcoming payments were grouped by date and the Calendar route was only a header link. | Fixed — each live outflow now has its own card with a semantic source icon, title, due date, amount, and countdown; Calendar is an ending tile.           |
| 19  | Calendar and monthly review appeared as stacked destination lists after the tools.    | Fixed — they now share a two-column ending tile row; Goals and Recurring remain available in the planning tools group above upcoming payments.            |

## Changes Made

- Rebuilt the overview hierarchy around the period row, neutral summary card, overspending alert, active Jar list, upcoming events, and secondary Plan destinations.
- Added a compact household-local calendar progress label and today marker; no spending forecast or new financial rule was added.
- Kept all displayed financial values sourced from current Plan/Jar reads and retained the existing Plan routes and calculations.
- Added a Plan application summary from existing Jar budget metrics and a small filter leaf over already-loaded Jar rows.
- Rebuilt the Jar preview as compact shared cards, moved filter counts inline, and added a toggle between the loaded Jar order and localized name sorting.
- Rebuilt upcoming outflows as separate live event cards and added the Calendar and current-month review ending tiles; Goals and Recurring remain linked from the planning tools group above.
- Kept per-Jar artwork on the canonical Jar icon and showed the existing localized Jar kind; no unsupported category labels or icon identities were guessed.
- Fixed the shared status badge’s server/client boundary so warning and positive tones render when passed from the Plan Server Component.
- Updated English and Vietnamese labels for the revised Plan presentation.

## Source Files

- `app/[locale]/(product)/plan/page.tsx`
- `app/[locale]/(product)/plan/plan-destination-row.tsx`
- `app/[locale]/(product)/plan/plan-hub-hero.tsx`
- `app/[locale]/(product)/plan/plan-jar-filter-list.tsx`
- `modules/plan/application/plan-constants.ts` and `modules/plan/application/index.ts`
- `app/[locale]/(product)/plan/plan-hub-presentations.ts`
- `app/[locale]/(product)/plan/loading.tsx`
- `modules/plan/application/jar-budget.ts`
- `modules/plan/application/plan-constants.ts`
- `modules/plan/application/index.ts`
- `messages/en/plan.json` and `messages/vi/plan.json`
- `shared/patterns/jar-card.tsx`
- `shared/ui/icon-registry.ts`
- `shared/ui/inline-alert.tsx` and `shared/ui/inline-alert-constants.ts`
- `shared/ui/progress.tsx` and `shared/ui/status-badge.tsx`
- Related Plan unit tests, Plan smoke coverage, and `tests/unit/phase-11-recurring-calendar-ritual.test.tsx` for the renamed Plan shortcut selectors.

## Shared Components Changed

1. `shared/patterns/jar-card.tsx` — keeps the existing Jar route presentation and adds a compact overview presentation with a full-name link title.
2. `shared/ui/inline-alert.tsx` and `shared/ui/inline-alert-constants.ts` — retain existing alert behavior while making the variant safe to import from a Server Component.
3. `shared/ui/progress.tsx` — accepts an optional semantic indicator style while preserving Progress clamping and accessibility behavior.
4. `shared/ui/status-badge.tsx` — removes an unnecessary client boundary from a presentational component so its tone values remain defined in server-rendered usage.

## Data Mapping and Classification

| Visible value or state                                            | Source / derivation                                                                                                                                  | Classification                                    |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Title, subtitle, metric labels, actions                           | English and Vietnamese Plan messages.                                                                                                                | NOT APPLICABLE — localized UI copy.               |
| Current month                                                     | `getCurrentJarBudgets().periodMonth`, with the existing current-period fallback; displayed through the shared date formatter.                        | DIRECT DATA                                       |
| Assistance state                                                  | Existing `getPlanPulse().monthCloseMode` mapped to the existing `PlanAssistMode`.                                                                    | DERIVED FROM VERIFIED EXISTING DATA               |
| Month day, month length, elapsed-day percentage, and today marker | Current date formatted in `HOUSEHOLD_TIMEZONE.VIETNAM`; percentage is calendar day ÷ days in current month. It is not a spending or budget forecast. | DERIVED FROM VERIFIED EXISTING DATA               |
| Active Jar count and names                                        | Active non-income Jars from `getPlanPulse()`.                                                                                                        | DIRECT DATA                                       |
| Income base                                                       | `getCurrentJarBudgets().periodIncome`; an unset value uses the existing localized empty label.                                                       | DIRECT DATA                                       |
| Planned, spent, and remaining totals                              | Existing current-period `JarBudgetMetrics` summarized by `summarizeJarBudgets`; missing active Jar budget data keeps the summary unavailable.        | DERIVED FROM VERIFIED EXISTING DATA               |
| Aggregate spend percentage                                        | Total live spend ÷ total live plan, formatted for display.                                                                                           | DERIVED FROM VERIFIED EXISTING DATA               |
| Overspent Jar count, name, plan, spend, and overage               | Existing `JarBudgetState.OVERSPENT` and current Jar metrics.                                                                                         | DIRECT DATA                                       |
| Upcoming events                                                   | Existing `listPlanHubUpcomingEvents()` data and current preview constants.                                                                           | DIRECT DATA                                       |
| Jar filter counts and results                                     | Existing budget state and positive live remaining amounts.                                                                                           | DERIVED FROM VERIFIED EXISTING DATA               |
| Jar spend/plan, remaining value, and progress                     | Current Jar metrics; a negative remaining amount is displayed as its positive overage with an explicit over-budget label.                            | DIRECT DATA / DERIVED FROM VERIFIED EXISTING DATA |
| Remaining percentage status                                       | Existing `usagePercent` on the Plan percent scale; shown only for non-overspent budgets.                                                             | DERIVED FROM VERIFIED EXISTING DATA               |
| Jar kind badge                                                    | Existing Jar kind translated through the Plan messages.                                                                                              | DIRECT DATA                                       |
| Alphabetical sorting                                              | Existing localized Jar names sorted in the browser; toggling off restores the loaded `sort_order` sequence.                                          | DERIVED FROM VERIFIED EXISTING DATA               |

The current household data differs from the Stitch example: September 2026 instead of October, seven active Jars instead of six, ₫41,000,000 planned / ₫15,520,418 spent / ₫25,479,582 remaining, and two overspent Jars. Those differences are `REAL DATA DIFFERENCE`; no screenshot values were copied into the product.

## MOCK / LOGIC PENDING

No mock financial values are rendered. Period selection and per-Jar category artwork/tag metadata remain pending:

| Feature                             | Reason                                                                                                     | Future data / logic                                       | Replacement path                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Period selection                    | The overview only receives the current period; the visible month control opens the existing Plan Calendar. | Period selection state and period-specific budget reads.  | Connect the month control to the shared period selection contract when available. |
| Category artwork and allocation tag | Current `PlanJar` data exposes kind, but not category artwork or a user-facing allocation tag.             | A persisted category/icon key or approved stable mapping. | Render through the existing semantic category icon registry when available.       |

## Remaining Differences and Classification

- Period selection behavior: `MOCK / LOGIC PENDING` — visual control is present and links to Plan Calendar, but the overview has no period-specific reads.
- Saved Jar sort preference: `NOT IMPLEMENTED` — the control sorts the loaded preview and restores its supplied order; it does not persist a preference.
- Category-specific Jar artwork/tag: `MOCK / LOGIC PENDING` — no such metadata is available, so current localized kind labels and canonical Jar artwork remain.
- Fixed transaction action overlaps the lower-right card in a short section crop: `RESPONSIVE ADAPTATION` — it is shared app chrome; scrolling the Plan page clears the amount.
- Example month, totals, Jar count, and overspending details differ from the screenshot: `REAL DATA DIFFERENCE` — the screen keeps the authenticated household’s current data.
- The Stitch image includes a mobile status bar that is not part of the web route: `BROWSER RENDERING DIFFERENCE`.
- Long English Jar usage lines wrap inside the card at narrow widths; no horizontal overflow or clipped financial values. The fixed 440 px centered shell remains at tablet and desktop widths.
- At short viewport heights below the required 800 px minimum, fixed navigation/action layers enter the crop; the page remains scrollable. Required responsive heights were verified separately.

## Browser QA

- Authenticated routes: `/vi/plan` and `/en/plan`.
- Viewports: 360 × 800, 390 × 844, 430 × 932, 440 × 956, 768 × 1024, and 1280 × 900.
- No horizontal overflow. The 768 px and 1280 px views preserve the 440 px centered shell.
- The updated lower region was checked at 390 × 844, 440 × 956, 768 × 1024, and 1280 × 900. The document has no horizontal overflow; at 768 px and 1280 px, the content remains in the centered 440 px shell.
- At the end of the 390 px and 440 px main scroll regions, the shortcut tiles finish above the shared transaction action and bottom navigation. The monthly review tile has a visible keyboard focus ring.
- The new tiles and payment cards were visually checked with both light and dark semantic theme tokens. Light mode was simulated by removing the persisted `dark` class for a browser-only visual pass; no user preference was saved. `prefers-reduced-motion: reduce` was enabled during the responsive pass.
- Light and dark themes were captured for English and Vietnamese; long English labels wrap without colliding with financial values.
- Warning and positive badges render their semantic warning/primary tones. Overspending retains its icon, label, and actual amount details.
- Progress boundary cases 0%, 25%, 50%, 100%, and 140% were checked; visual fill caps at 100% while accessible meaning retains actual values.
- The “Remaining” filter was clicked after its row scrolled clear of the floating action; selection and filtered rows updated.
- Keyboard focus is visible on the period control. Reduced-motion preference was checked during the responsive pass.
- Allocation links to `/vi/plan/jars`; the month control links to `/vi/plan/calendar`.
- Fresh browser console check: zero errors. The Next.js dev-tools portal was hidden only in screenshot captures.
- Jar list checks at 390 × 844, 440 × 956, 768 × 1024, and 1280 × 900 found no horizontal overflow; the 768 px and 1280 px views retain the centered 440 px shell. Vietnamese light and English dark Jar list captures are included.
- In-browser sorting changed the live preview to locale-aware name order and restored the supplied order. The over-budget filter selected two of six live preview rows. Reduced motion was enabled and confirmed.
- The screen-wide fixed transaction action remains above bottom navigation. On the 390 × 844 Jar-section crop it can cover the final card’s lower-right corner; the page scrolls the content clear. The provided comparison image is a section crop without this app-shell action.

## Validation

- Typecheck: PASS (`npm run typecheck`)
- Lint: PASS (`npm run lint`)
- Tests: The existing Plan unit suites and smoke E2E passed before this final visual follow-up; they were not rerun for this follow-up. The earlier repo-wide run passed 238 files / 1,571 tests and had two failures outside this screen: the Together `tone="hero"` source assertion and an Investment Operation form label lookup (`opening.quantityLabel`).
- Formatting: targeted Plan Prettier check passes. Repo-wide `npm run format:check` reports 207 files across the workspace, including pre-existing out-of-scope files.
- Build: N/A — the shared Next.js dev server is active on the workspace `.next` directory; production build was not run alongside it.
- Browser QA: PASS.

## Acceptance

Yes. Beside the supplied Stitch screen, the real Plan Overview has the same recognizable hierarchy; the lower section now uses separate live payment cards and two ending shortcut tiles. Remaining differences are period selection, per-Jar category artwork/tag metadata, and the example events and values. Household amounts and period remain live, and the shared transaction action remains part of the app shell.

## Verdict

PLAN VISUAL PARITY APPROVED
