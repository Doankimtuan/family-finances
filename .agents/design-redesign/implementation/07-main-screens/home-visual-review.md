# HOME — STITCH VISUAL PARITY REVIEW

## Status

PASS — Home follows the canonical Stitch hierarchy and visual language. The cash-flow plot uses actual period values with event dots, per the user's explicit request; this chart semantic differs from Stitch's cumulative curve.

## Stitch

- Project: `16826760243481546078`
- Light ID: `c48a58d9f013494eb4bd4b2bc41d31d9`
- Dark ID: `d4a4d84e44c94a05ae3bfeefc6df9e6f`
- Route: `/vi/home` and `/en/home`
- Both canonical screens were fetched from Stitch MCP and compared with the running application.

## Differences Found

The implementation differences below were corrected; remaining data and responsive differences are classified at the end of this review.

| Area                 | STITCH                                                                             | CURRENT BEFORE                                                                   | CURRENT AFTER                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Header and hierarchy | Household identity, shared-wallet context, compact actions                         | Legacy Home header and section hierarchy                                         | Household context and actions lead into the same section order as the canonical Home composition                 |
| Hero                 | Current asset position is the dominant elevated surface with a muted teal gradient | Legacy position presentation and supporting hierarchy                            | Real current assets, privacy control, source and stale-valuation notes, statement link, and subtle teal gradient |
| Attention            | Warning-tinted attention card with count, detail, and action                       | Plain inbox prompt                                                               | Warning gradient card with a shield, live count, accurate review detail, and `Take action` / `Xử lý ngay`        |
| Home sections        | Cash flow, spending, financial structure, recent activity                          | Home Plan pulse displaced canonical Home content; recent activity was absent     | Plan pulse removed; recent activity and canonical sections are present in order                                  |
| Cash flow            | Period control, net/income/expense summary, chart                                  | Legacy summary and chart hierarchy                                               | Period story, three-column summary, responsive chart, and accessible data table                                  |
| Cash-flow details    | Period control beside title; cumulative chart; legend below                        | Control wrapped below title; extra information row and Trend label; daily spikes | Period control beside title; actual period values with event dots; legend has balanced spacing                   |
| Financial structure  | Header, action, and four inset tiles inside one rounded section surface            | Heading sat above a separate divider-list card; rows had chevrons                | Header/action sit inside one section surface; spaced tiles use 40px icons, no chevrons, and muted empty rows     |
| Recent activity      | Header, supporting line, action, and transaction rows share one rounded surface    | Header sat above a separate list card; date shared the left subtitle             | One section surface contains its header/action and divided rows; time sits below each amount                     |
| Spending details     | Compact category, share, and amount rows                                           | Two-line category values and an Inbox link                                       | One-line category rows; category-level Inbox link removed                                                        |
| Inbox action label   | Compact action                                                                     | `Review in Inbox` repeated the category-level wording                            | Category link removed; attention action is labeled `Take action` / `Xử lý ngay`                                  |
| Add Transaction      | Prominent action with clear bottom-navigation relationship                         | Floating action could cover content at short viewports                           | Action sits after the Home content with 20px clearance above bottom navigation                                   |
| Loading              | Loading composition follows the Home hierarchy                                     | Separate legacy skeleton composition                                             | Loading route reuses the Home streaming fallback                                                                 |
| Locale and theme     | Canonical light and dark references                                                | Incomplete copy and surface parity                                               | Home copy is translated; semantic tokens preserve light and dark contrast                                        |

## Differences Fixed

1. Replaced the old Home header hierarchy with the household and shared-wallet header.
2. Reworked the hero around current assets and privacy, adding a subtle teal gradient, a statement link, and only available source and valuation-freshness details.
3. Changed the plain inbox prompt into a warning-gradient attention card with its live count, review detail, shield icon, and action.
4. Removed the Plan pulse from Home.
5. Reordered Home sections to match the Stitch composition.
6. Added the period-aware cash-flow story and controls.
7. Added the Net, Income, and Expense summary strip.
8. Matched the cash-flow chart presentation and retained its accessible data table.
9. Reworked category spending composition.
10. Reworked financial structure summaries with shared row patterns.
11. Integrated the financial-structure heading, supporting copy, and Money action into its section surface; removed row chevrons and list dividers, spaced the tiles, and muted empty product rows.
12. Added recent real ledger activity using the existing activity semantics and row presentation.
13. Integrated recent-activity heading, supporting copy, and View all into its section surface; removed the nested list card and placed the event time under each amount.
14. Moved Add Transaction into the content flow to prevent overlap at small heights.
15. Aligned the loading state, English and Vietnamese copy, and light/dark surfaces with the updated composition.
16. Removed the category-level `Review in Inbox` link so spending composition contains only category information.
17. Placed Month/Quarter beside the cash-flow title and removed the extra divider and “What’s included” disclosure.
18. Removed the standalone Trend heading and moved the legend below the chart.
19. Restored actual income and spending for each day or week, with straight line segments and markers only where that series has activity.
20. Updated the chart legend, accessible descriptions, and data table to describe period values rather than cumulative totals.
21. Matched the spending rows to Stitch's compact category, percentage, and amount composition.
22. Removed the cash-flow summary strip border to match the softer Stitch surface.
23. Reworded the separate attention-card action to `Take action` / `Xử lý ngay` while retaining its Inbox destination.
24. Removed the attention link's overriding accessible label so assistive technology announces its count, detail, and action.
25. Added the semantic `shield` alias to the shared icon registry for the attention card.
26. Assigned distinct semantic-token colors to spending categories and matched each bar segment to its legend marker.
27. Aligned Home activity icons and text with Financial structure rows, formatted activity amounts with the shared localized currency formatter, and kept the fixed capture action on one row.
28. Moved the transaction amount width cap to its outer row slot so timestamps remain readable at narrow widths.
29. Added top spacing above the spending label and an explicit `Other categories` legend entry for spending outside the four leading categories.

## Source Files

- `app/[locale]/(product)/home/home-streaming-sections.tsx`
- `app/[locale]/(product)/home/home-financial-pulse.tsx`
- `app/[locale]/(product)/home/home-inbox-cta.tsx`
- `app/[locale]/(product)/home/home-period-story.tsx`
- `app/[locale]/(product)/home/home-period-control.tsx`
- `app/[locale]/(product)/home/home-cash-flow-section.tsx`
- `app/[locale]/(product)/home/home-cash-flow-chart.tsx`
- `app/[locale]/(product)/home/home-spending-section.tsx`
- `app/[locale]/(product)/home/home-product-summaries.tsx`
- `app/[locale]/(product)/home/home-recent-activity.tsx` (new)
- `app/[locale]/(product)/home/loading.tsx`
- `app/[locale]/(product)/home/page.tsx`
- `app/[locale]/(product)/home/home-dashboard-skeleton.tsx` (removed)
- `app/[locale]/(product)/home/home-plan-pulse.tsx` (removed)
- `modules/home/application/home-constants.ts`
- `messages/en/home.json`
- `messages/vi/home.json`
- `shared/ui/icon-registry.ts` (semantic shield icon alias)
- `styles/globals.css` (shared bottom-navigation height token)

Home-specific assertions were updated in `tests/unit/home-command-center.test.tsx`, `tests/unit/home-ia-ux.test.tsx`, `tests/unit/home-screen-v2-polish.test.tsx`, `tests/e2e/home-dashboard.smoke.spec.ts`, and `tests/e2e/home-product-summary.smoke.spec.ts`.

## Shared Components Changed

1. `TransactionRow` now applies its 50% trailing-column limit at the outer BaseRow slot. This avoids a nested width cap that ellipsized the final Home activity timestamp at 390px; other transaction rows retain the same maximum column width.
2. Updated the shared `--bottom-navigation-height` token in `styles/globals.css` from 56px to the measured 76px navigation height so the in-flow action keeps the intended 20px gap.

## Mock / Logic Pending

0 mocked sections. No mock financial values or backend logic were added.

## Visual Parity

- Hierarchy: PASS
- Spacing: PASS
- Typography: PASS
- Hero: PASS
- Cash-flow chart: PASS
- Section composition: PASS
- Rows/cards: PASS
- Icons: PASS
- Add Transaction: PASS
- Bottom navigation relationship: PASS

## i18n

- Vietnamese: PASS
- English: PASS

Translated interface copy was checked in both locales. User-entered and seeded category or transaction names remain in their stored language.

## Theme

- Light: PASS
- Dark: PASS

Both supplied Stitch references were checked directly. The application was checked in light and dark themes.

## Responsive

- 360 × 800: PASS
- 390 × 844: PASS
- 430 × 932: PASS
- Additional repository-required sizes: 440 × 900, 768 × 900, 1280 × 900 — PASS

At each size, the document width matched the viewport, no Home element extended horizontally beyond it, and the chart's scroll width matched its visible width. At 360px, financial amounts fit their summary columns. At the bottom of Home, Add Transaction remained 20px above the bottom navigation without covering content.

## Browser QA

The real `/vi/home` and `/en/home` routes were opened in a browser. Dark mode was checked at 390, 440, 768, and 1280px; light mode was checked at 390 and 1280px. At each tested width, the Home shell remains centered and the sections fit without horizontal overflow. Financial-structure and activity icons and text share the same x positions, the capture action stays 48px high on one line, and all activity times remain visible at 390px. The category bar and legend use matching distinct colors in both themes. The full attention link remains keyboard accessible; the capture action's visible focus ring was checked. Reduced-motion preference was enabled and checked. The final browser state is Vietnamese Home in dark theme with the default viewport restored.

## Remaining Differences

1. **REAL DATA DIFFERENCE** — Current balances, household labels, category names, and activity differ from Stitch's static sample data because the screen displays the signed-in household's real data.
2. **MOCK / LOGIC PENDING** — Stitch shows a month-over-month asset delta and last-updated time, but Home has no historical asset snapshot or accurate asset refresh timestamp source. Neither value is shown or fabricated; adding them requires those data sources. No section is mocked.
3. **ACTIVITY COUNT** — Stitch shows a total transaction count beside View all. The existing recent-activity query exposes only `hasMore` and a cursor, not a total; the count is omitted rather than guessed.
4. **USER-REQUESTED CHART SEMANTICS** — The supplied Stitch screen uses cumulative cash flow. Home now plots each period's actual income and spending with markers only at periods with activity, as explicitly requested.
5. **RESPONSIVE ADAPTATION** — At 360px the household header actions can wrap, and Add Transaction stays in normal content flow so it cannot obscure the summary or navigation. Both remain usable and within the viewport.
6. **BROWSER RENDERING DIFFERENCE** — The Next.js development badge can overlay the first navigation icon in a narrow development screenshot. It is browser tooling, not Home UI.

No remaining `IMPLEMENTATION DEFECT` was found. The remaining differences above do not prevent a designer from recognizing the Home screen as the same canonical design.

## Validation

- Typecheck: PASS (`npm run typecheck`)
- Lint: PASS (`npm run lint`)
- Tests: 34 focused Home unit tests passed. The previous full repository run had 1,563 passes and 4 unrelated failures outside this Home change.
- Build: PASS (`npm run build`, default Next.js 16.3.1 Turbopack build in an isolated checkout; 103 static pages generated)
- Browser QA: PASS
- Formatting: targeted report check PASS; repository-wide `npm run format:check` FAILS with 207 files flagged. `git diff --check`: PASS.

The four full-suite failures were outside Home: Money header, investment-operation form timeout, Together hero tone, and Money link prefetch. No out-of-scope product screen was changed for this task.

## Verdict

HOME VISUAL PARITY APPROVED WITH USER-REQUESTED CHART SEMANTICS
