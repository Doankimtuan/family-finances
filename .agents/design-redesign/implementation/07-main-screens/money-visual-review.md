# MONEY OVERVIEW — STITCH VISUAL PARITY REVIEW

## Status

PASS — the live Money Overview follows the canonical dark Stitch composition, with the ledger entry omitted per the explicit follow-up request because the summary already links to transactions.

## Stitch

- Project: `16826760243481546078`
- Dark ID: `b7af0cf462204bed9beedf116503c5d0`
- Light ID: Not provided
- Route: `/vi/money` and `/en/money`
- Stitch was opened directly and its HTML and screenshot are saved under `evidence/money-overview/`.

## Differences Found

The initial review recorded 22 meaningful differences: 18 implementation defects, 1 real-data gap, and 3 Stitch-only mock/logic gaps. A follow-up review of the savings, investment, loan, and personal-debt rows found three more implementation defects, now fixed below.

| Area                               | STITCH                                                                                              | CURRENT BEFORE                                                                                              | CURRENT AFTER                                                                                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Summary hierarchy                  | One gradient asset summary with allocation and liabilities disclosed separately                     | Legacy Money summary and allocation hierarchy                                                               | One elevated gradient summary using the existing asset overview and privacy control                                                                   |
| Financial meaning                  | Prototype headline says net assets after liabilities                                                | Summary mixed accessible cash and financial domains                                                         | Tracked assets are labeled accurately; credit debt remains separately disclosed                                                                       |
| Account presentation               | Accounts sit in one section with compact inset account rows and a separate credit row               | Account presentation used the old expandable layout                                                         | The hub keeps a compact scan and links to a dedicated full account directory; credit liabilities are a separate section there                         |
| Account total alignment and action | The total aligns with the complete section heading and opens the account inventory                  | The total sat high and its route redirected back to a collapsed Money screen                                | The amount is vertically centered and opens `/money/accounts`; the hub footer still expands or collapses its local scan                               |
| Credit-card attention              | Card type and attention badge remain readable beside the card identity                              | Long Visa attention text was clipped by the compact row subtitle                                            | The credit-card subtitle wraps and the badge can wrap inside its row                                                                                  |
| Savings and investments            | Two divided rows share one grouped surface                                                          | Domains used the old standalone presentation                                                                | Canonical grouped rows show real balances, count/attention context, and investment valuation coverage                                                 |
| Loans and personal debt            | Two divided rows share one grouped surface                                                          | Domains used the old standalone presentation                                                                | Canonical grouped rows keep loans, borrowed amounts, and lent amounts semantically separate                                                           |
| Ledger entry                       | One compact transaction-ledger entry follows the domain groups                                      | A duplicate ledger card sat below the existing summary transaction link                                     | Removed the duplicate card per request; the summary's transaction action still links to the real ledger                                               |
| Icons and rows                     | Stitch domain artwork and exact Home, wallet, calendar, bell, and Together navigation icons         | Navigation used coin, target, and tray artwork; row treatment was inconsistent                              | AppIcon and shared row patterns use the canonical Stitch artwork and measured geometry                                                                |
| Dividers and hover                 | One group divider between rows; calm interaction feedback                                           | Each row drew a second inset divider and the full-strength hover created a nested-card effect               | Money rows use one full-width divider; hover uses a restrained token layer while keyboard focus stays visible                                         |
| Surfaces and type                  | Dark layered surfaces, subtle borders, compact uppercase group labels, teal/green/purple allocation | Legacy spacing, grouping, and surfaces                                                                      | Token-based dark/light surfaces, typography, spacing, and matching allocation colors                                                                  |
| Actions and loading                | Transaction action uses one horizontal icon-and-label row above navigation                          | Add action could cover Money rows; icon and label could wrap vertically; activity link had a smaller target | Action stays after content and clear of bottom navigation with the icon and label on one row; activity link retains text styling with a 44px hit area |

## Differences Fixed

1. Replaced the legacy Money composition with the Stitch order: asset summary, accounts, savings/investments, obligations/personal debt, and ledger entry.
2. Consolidated the summary and asset allocation into one gradient surface, with investment estimates and incomplete valuation coverage labeled.
3. Kept credit outstanding outside asset totals and separate from account balances.
4. Rebuilt Accounts as a grouped surface with compact account rows and a distinct credit-liability row.
5. Changed the Accounts header amount/chevron and manage-list action to navigate to the Accounts route.
6. Grouped Savings with Investments and Loans with Personal Lending/Borrowing, using shared divided rows.
7. Matched the canonical Lock, investment trend, bank, and lending artwork; account icons are 28px/14px and grouped-domain icons are 40px/20px.
8. Matched the summary gradient, row/card geometry, dividers, section labels, allocation colors, and translated labels using semantic tokens.
9. Kept Add Transaction at the end of Money content so it does not cover financial rows at narrow viewports; its label stays on one line at 360px.
10. Raised the summary's View transactions target to 44px while preserving its compact text-link appearance.
11. Preserved loading, unavailable, empty, offline, and financial privacy behavior with the new composition.
12. Removed the extra ledger card because the summary's “View transactions” action already opens the ledger.
13. Replaced all five Bottom Navigation icons with the canonical Stitch artwork for this screen.
14. Set the transaction button to a non-wrapping row and verified its icon and label remain horizontally aligned.
15. Removed the duplicate inset divider from Money rows, leaving the group's single full-width separator.
16. Softened only Money row hover feedback through `BaseRow`'s optional interactive class while preserving its default style elsewhere.
17. Vertically centered the account total action and linked it to `/money/accounts`.
18. Kept the Money overview scan's accessible expand/collapse control for its local account preview.
19. Let long credit-card status labels wrap within the account identity column so the balance no longer covers the Visa tag.
20. Added translated full-list and collapse labels for Vietnamese and English.
21. Kept the savings action badge and its count/maturity context visible together.
22. Added investment valuation freshness from the existing read model while retaining its estimate label and coverage count.
23. Added loan repayment count and separate borrowed/lent record counts; payment-state copy stays quiet when no attention is needed.

## Source Files

- `app/[locale]/(product)/money/page.tsx`
- `app/[locale]/(product)/money/accounts/page.tsx`
- `app/[locale]/(product)/money/accounts/loading.tsx`
- `app/[locale]/(product)/money/money-accounts-directory.tsx`
- `app/[locale]/(product)/money/loading.tsx`
- `app/[locale]/(product)/money/money-position-hero.tsx`
- `app/[locale]/(product)/money/money-accounts-scan.tsx`
- `app/[locale]/(product)/money/money-hub-accounts.tsx`
- `app/[locale]/(product)/money/money-module-section.tsx`
- `app/[locale]/(product)/money/money-capture-action.tsx`
- `modules/ledger/application/debt-domain.ts`
- `messages/en/money.json`, `messages/vi/money.json`
- `modules/ledger/application/account-constants.ts`, `modules/ledger/application/client.ts`, `modules/ledger/application/index.ts`
- `shared/patterns/bottom-navigation-tabs.ts`
- `shared/patterns/account-row.tsx`, `shared/patterns/base-row.tsx`, `shared/patterns/balance.tsx`
- `shared/ui/financial-amount.tsx`, `shared/ui/icon-container.tsx`, `shared/ui/icon-registry.ts`, `shared/ui/progress.tsx`
- `tests/e2e/money-product-summary.smoke.spec.ts`, `tests/e2e/money-hub.smoke.spec.ts`, `tests/e2e/account-detail-redesign.smoke.spec.ts`, `tests/e2e/credit-card-installments.smoke.spec.ts`
- `tests/unit/debt-domain.test.ts`, `tests/unit/hero-pill-link.test.tsx`, `tests/unit/ledger-scan-card-surface.test.tsx`, `tests/unit/money-ia-privacy.test.tsx`, `tests/unit/money-reality-hub.test.tsx`

## Accounts Directory Follow-up

`/money/accounts` now renders the full active account inventory instead of redirecting to Money. Its Add account action opens the existing creation sheet. Credit cards appear under a separate liability heading with explanatory copy; asset balances and card debt continue using the existing view model and formatting.

The directory was captured in four responsive/theme scenarios: 390px Light, 440px Dark, 768px Light, and 1280px Dark. Its Add account sheet and Vietnamese labels were verified in the authenticated browser. The Money Overview still keeps its own compact, expandable account scan.

## Module Row Visual Follow-up

The supplied Stitch references show a factual status and a short explanatory line in the same row. Savings now shows active and maturing counts alongside the existing action badge; investments show the read model's valuation freshness alongside the holding or coverage count. The obligations group uses concise row titles, shows active loan count and separate borrowed/lent record counts, and displays a quiet payment status only when no attention state is active.

All new counts and valuation labels come from existing read models. Borrowed and lent records are counted separately in `buildDebtSummary`; balances remain separate. Stitch's example yield, monthly return, and YTD return remain omitted because the Money summary does not expose those verified values.

## Shared Components Changed

1. `AccountRow` accepts compact overview subtitles and minimum height while retaining the shared financial amount treatment.
2. `BaseRow` supports the canonical 44px compact row size and optional per-screen interactive styling.
3. `AccountRow` forwards a subtitle class override for long credit-card attention badges.
4. `Balance` and `FinancialAmount` expose the existing financial-number kind for estimates versus current values.
5. `IconContainer` adds a compact 28px `xs` size and semantic warning tone for Money's account and debt rows.
6. The shared icon registry exposes the Money lock, ledger, profile, and expand artwork; the progress tone map includes the warning state used by Money credit status.
7. The shared Money capture action keeps its localized label on one line.
8. Bottom Navigation uses this screen's five exact Stitch icons through `AppIcon`; other uses of the shared navigation-role icons stay unchanged.
9. `MoneyModuleRow` keeps status and context visible together and supports a compact right-aligned obligation status.

## Domain Presentation

- Accounts: PASS — current asset accounts and credit cards remain distinct; links use locale-independent `APP_PATH` values.
- Savings: PASS — existing principal, active count, and action-required count only.
- Investments: PASS — market value is marked as an estimate; count and valuation coverage remain visible.
- Loans: PASS — outstanding and payment attention come from the Loans read model.
- Personal Lending / Borrowing: PASS — borrowed and lent amounts stay separately labeled and are not added to account cash.

## Data Mapping

| Visible data                                                   | Classification                      | Source / treatment                                                        |
| -------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| Account names, balances, active account total                  | DIRECT DATA                         | Existing Money position read model                                        |
| Credit limit, utilization, and outstanding                     | DIRECT DATA                         | Existing credit-card read model; outstanding is never counted as an asset |
| Savings principal, active count, and attention count           | DIRECT DATA                         | `getSavingsHomeSummary`                                                   |
| Investment holding count, market value, and valuation coverage | DIRECT DATA                         | `listInvestmentHomeSummary`; market value is labeled `ESTIMATE`           |
| Loan totals and due/overdue state                              | DIRECT DATA                         | Existing Loans summary read model                                         |
| Borrowed/lent personal debt and attention                      | DIRECT DATA                         | Existing debt summary read model                                          |
| Asset total, allocation amounts, and percentages               | DERIVED FROM VERIFIED EXISTING DATA | Existing `calculateMoneyAssetOverview`; no new formula was added          |
| Labels, navigation, and section copy                           | NOT APPLICABLE                      | Translated product copy, not financial values                             |

No application mock values were added. The net-assets headline is classified separately as a **REAL DATA DIFFERENCE** below. Three Stitch-only sample groups are excluded and remain **MOCK / LOGIC PENDING**:

1. Savings average rate and monthly earnings: `SavingsHomeSummary` exposes principal, counts, and attention only. A verified savings performance summary is required before displaying these values.
2. Investment YTD return: the Money overview read model does not expose a verified YTD metric. Add a date-aware performance read model before showing it.
3. Stitch's sample transaction count and demo provider/account details: the count is not part of the Money overview read model. Use actual account/provider labels and add a verified ledger-count summary only if the product needs that value.

## Mock / Logic Pending

3 Stitch sample-data groups are not copied into the application: savings performance, investment YTD return, and a total ledger count with demo provider/account values. The future source and replacement path for each are documented in the Data Mapping section above. The application uses no mock values.

## Visual Parity

- Hierarchy: PASS
- Section order: PASS
- Spacing: PASS
- Typography: PASS
- Financial hierarchy: PASS
- Rows/cards: PASS
- Row dividers: PASS — one separator per grouped row boundary
- Hover: PASS — restrained in Dark and focus styling retained
- Account total alignment: PASS — centered with the section heading
- Account list action: PASS — total opens the dedicated full directory; the Money overview footer still expands/collapses its preview
- Credit-card attention: PASS — long Visa tags wrap without colliding with the balance
- Icons: PASS
- Dividers/surfaces: PASS
- Bottom Navigation relationship: PASS
- Add Transaction relationship: PASS; the localized label remains one line and the action stays above Bottom Navigation

## i18n

- Vietnamese: PASS
- English: PASS

Both locales were opened in the browser. Long account/domain labels and expanded supporting copy were exercised at 360px; labels truncate within their rows and copy wraps without horizontal overflow.

## Theme

- Light: PASS — rendered and checked at 390px, 440px, and 768px; no Light Stitch ID was supplied for exact comparison.
- Dark: PASS — compared with the canonical Dark Stitch screen and checked at 360px, 430px, and 1280px.

## Responsive

- 360 × 800: PASS
- 390 × 844: PASS
- 430 × 932: PASS
- 440 × 956: PASS
- 768 × 1024: PASS
- 1280 × 720: PASS
- Large financial values: PASS — a 12-digit balance remains inside its row at 360px.
- Long content: PASS — account/domain labels truncate, supporting copy wraps, and no horizontal page overflow occurs.

At all six viewports, Playwright confirmed no horizontal overflow, real domain links, a maximum of five preview account/credit rows, and no capture-action overlap with Money rows. At the content end, Add Transaction is visible above the bottom navigation. Reduced-motion preference was enabled. Keyboard Tab moved from the summary action to the Accounts route link and exposed `:focus-visible` styling.

## Browser QA

The canonical Stitch screen and the authenticated `/vi/money` route were opened directly. A live before-change comparison was captured through CUA before implementation; that connector returned it inline and did not provide a local export path. After-change screenshots and the content stress capture are saved in `evidence/money-overview/`:

- `stitch-dark.html`, `stitch-dark.png`
- `current-after-360x800-vi-dark.png`, `current-after-bottom-360x800-vi-dark.png`
- `current-after-390x844-vi-light.png`, `current-after-bottom-390x844-vi-light.png`
- `current-after-430x932-en-dark.png`, `current-after-bottom-430x932-en-dark.png`
- `current-after-440x956-en-light.png`, `current-after-bottom-440x956-en-light.png`
- `current-after-768x1024-en-light.png`, `current-after-bottom-768x1024-en-light.png`
- `current-after-1280x720-en-dark.png`, `current-after-bottom-1280x720-en-dark.png`
- `current-after-content-stress-360x800-en-dark.png` (synthetic DOM-only layout stress; no financial data was saved)
- `current-hover-430x932-en-dark.png`, `current-hover-430x932-en-light.png`
- `current-accounts-expanded-430x932-en-dark.png`, `current-accounts-expanded-bottom-430x932-en-dark.png`
- `current-modules-390x844-vi-light.png`, `current-modules-440x956-en-light.png`, `current-modules-768x1024-en-light.png`, `current-modules-1280x720-en-dark.png`
- `current-growing-390x844-vi-light.png`, `current-growing-1280x720-en-dark.png`
- `current-obligations-390x844-vi-light.png`, `current-obligations-1280x720-en-dark.png`

The dedicated Accounts directory was also captured in four responsive/theme scenarios:

- `screenshots/money-accounts-directory-390-light.png`
- `screenshots/money-accounts-directory-440-dark.png`
- `screenshots/money-accounts-directory-768-light.png`
- `screenshots/money-accounts-directory-1280-dark.png`

The persisted browser captures are post-change and include the removed ledger card, corrected horizontal action, all five corrected navigation icons, the softened row hover in both themes, and the full account list reached from the total amount. Playwright verified the current authenticated route at six viewport sizes, confirmed the duplicate ledger entry and per-row inset dividers are absent, and exercised hover in Dark and Light plus the account open/collapse flow.

## Remaining Differences

1. **REAL DATA DIFFERENCE** — Stitch's headline is net assets after liabilities. Money uses the existing verified tracked-asset aggregate and keeps liabilities separate because the current read models do not provide a verified household total-liabilities value.
2. **MOCK / LOGIC PENDING** — Stitch sample savings yield and monthly earnings are absent because the Savings overview read model has no performance fields.
3. **MOCK / LOGIC PENDING** — Stitch sample investment YTD return is absent because the Money overview read model has no verified date-aware YTD metric.
4. **MOCK / LOGIC PENDING** — Stitch's sample ledger count and demo account/provider values are not copied into the real household UI; the Money overview has no ledger-count field.
5. **RESPONSIVE ADAPTATION** — Add Transaction follows the content and appears above Bottom Navigation at the page end. A fixed action covered financial rows at narrow viewports during scrolling; the content-end placement stays collision-free.
6. **BROWSER RENDERING DIFFERENCE** — The Next development badge and temporary compile indicator can appear over the lower-left edge of development screenshots. They are not part of the Money UI.

There are no remaining **IMPLEMENTATION DEFECT** items. The Stitch ledger row is intentionally omitted per the follow-up request because the summary already links to the same route. A designer can recognize the real Money Overview as the canonical Stitch composition; sample financial figures are excluded rather than fabricated.

## Validation

- Typecheck: PASS (`npm run typecheck`)
- Lint: PASS (`npm run lint`)
- Money browser checks: PASS — 21 passed, 1 skipped across the Money hub, account directory/detail, credit-card, and Money summary Playwright specs. The account directory was captured at 390px Light, 440px Dark, 768px Light, and 1280px Dark; its create sheet and Vietnamese labels were verified.
- Accounts directory flow rerun: PASS — 3/3 Money hub cases, including the create sheet entry from `/money/accounts` and Vietnamese title/action labels.
- Module-row browser QA: PASS — 10/10 Money summary cases across responsive/theme scenarios; savings and investment status/context, obligation counts, navigation, and row geometry verified.
- Focused unit tests: PASS — 13/13 across `debt-domain.test.ts` and `money-reality-hub.test.tsx`.
- Full tests: FAIL — 1,567 passed, 1 failed. `tests/unit/motion-reveal-usage.test.ts` expects a Together hero tone; it is outside this Money Overview change.
- Build: NOT RUN — the existing development server is using `.next`; it stayed running for the authenticated browser QA.
- Format: Scoped Prettier check passes for the changed Money files. Repository-wide `npm run format:check` reports 206 files with formatting issues outside this scoped change.
- Typecheck, lint, scoped Prettier, and `git diff --check`: PASS after the module-row follow-up.
- Browser QA: PASS — authenticated Money at all six viewports, with locale/theme coverage, privacy, keyboard focus, long-content stress, and visual confirmation of all five Stitch navigation icons and both module groups.
- `git diff --check`: PASS

## Verdict

MONEY VISUAL PARITY APPROVED
