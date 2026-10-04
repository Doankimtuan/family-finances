# Transaction UI implementation and verification

Date: 2026-10-03

Authority: `.agents/design-redesign/transaction-experience-canonical.md`, canonical ViNha IA/UX/design-system artifacts, and the 16 light/dark screens retrieved using Stitch MCP from project `16826760243481546078`. Ponytail applied: existing HeroUI controls, shared form primitives, financial formatting, icons, routes, and application actions reused; no dependencies added.

## Implemented

- Primary capture destination retains bottom navigation and has no back button. Expense, income, and transfer modes keep their existing input schemas, preview, confirmation, receipt, and server action contracts.
- Hero monetary entry has semantic expense/income/transfer colors and the existing Vietnamese currency-words helper. Positive amount and required accounts gate submission. Account selects show real balances with financial privacy protection. Category selection uses a searchable four-column bottom sheet with real category artwork and linked jar context; closing clears the search.
- Shared HeroUI date picker has Today/Yesterday shortcuts. Transfer source/destination selectors exclude the source from destination options; transfer has no category. Shell owns form scrolling; actions stay above the navigation.
- History uses flat chronological groups, compact 40px icon containers, semantic category/finance artwork, All/Expense/Income/Transfer chip order, and explicit transfer signs/colors. Existing search, category/jar/tag filters, pagination, snapshot restoration, privacy, offline and error behavior remain.
- Ordinary detail uses a soft hero and facts cards with posted status, immutable ledger ID, and the existing correction/refund actions. Transfer detail displays the source decrease, destination increase, both ledger IDs, balanced status, and neutrality notice.
- Fixed duplicate currency/sign rendering in shared FinancialAmount when given an already formatted label. Moved its presentation constants to a server-safe module so server-rendered transfer detail receives actual tone/size values. Regression coverage preserves numeric signs and formatted-label behavior.

## Deliberate remaining canonical gaps

- Month selector, monthly cash-flow totals, and daily net subtotals are not implemented. The transaction activity query/filter contract is paginated and does not expose month/date bounds or complete aggregate totals. Computing sums from a partial page would misstate financial results; Home's separate monthly metrics do not provide a coherent history filter contract. Add a date-bounded activity query plus canonical complete-period aggregate API before presenting these metrics.
- Void/reversal buttons and paired transfer reversal remain pending, as identified by the canonical specification's mock/pending section. Existing correctTransaction/refundTransaction flows are preserved. No atomic reversal API for both transfer legs is exposed; a one-leg reversal would violate ledger balance. No delete/reversal action or fake success state was added.
- Canonical screen aliases `/transactions` are mapped to the existing `/money/transactions` product routes; route architecture is unchanged. Existing product-owned transaction details retain their ownership-specific action restrictions.

## Browser evidence

Running local app at `http://localhost:3000`, signed-in Brave/Chromium session. Read-only UI verification; zero financial mutations.

152 responsive observations: three capture modes, history, expense/income/transfer details, correction/refund compatibility, and category overlay. Capture/history/details/correction/refund were checked in English and Vietnamese, light and dark, at 390px, 440px, 768px, and 1280px. Category overlay received the same viewport/theme checks in English and an additional Vietnamese mobile check. All observations had no horizontal document overflow; main shell stayed at or below 440px. Existing action forms keep standalone navigation semantics.

Also verified keyboard focus in the category dialog; empty search and close/reopen reset; category selection and jar context in the expense confirmation; date shortcut/calendar; transfer same-account exclusion; transfer review and balanced detail. Reduced-motion preference was enabled during responsive checks. Temporary media, viewport, and theme overrides were restored. No submit-confirm action was executed against live household data.

- Machine-readable checks: `transactions-canonical-ui-evidence.json` beside this file.
- Screenshots and full evidence: `output/playwright/transactions-redesign/` (local, ignored output).
- Representative screenshots: `vi-income-light.png`, `en-expense-light.png`, `en-category-sheet-light.png`, `vi-transfer-detail-dark.png`, `vi-expense-confirmation-dark.png`, `en-transfer-review-dark.png`.

## Validation and review

- Refactor-review applied to this task's changed files: no new domain magic values, raw colors, icon libraries, unsafe casts, any, silent catches, or new financial calculations. Removed obsolete tile branches and nested scrolling. New amount/date wrappers are shared by capture and transfer; category sheet owns only ephemeral presentation state.
- `npm run lint`: pass.
- Prettier check on the transaction change set: pass. `git diff --check`: pass.
- Focused transaction/shared UI tests: 62/62 pass across five files, including category close/reopen reset, existing action payload and duplicate-submit protection, transfer exclusion, bottom navigation, and financial formatting.
- Full `npm run test`: 1677 passed, 5 failed, 1682 total; 247/250 files passed. Failures outside this flow: missing Vietnamese `savingsPage.summaryCaption` key; account hero `break-words` expectation; three account liability tests render InlineAlert without a next-intl provider. No unrelated savings/account fixes were made.
- `npm run typecheck`: blocked by two Home translator `rich` compatibility errors at `home-streaming-sections.tsx:99` and `:340` caused by divergent use-intl type resolutions. No transaction typing errors were reported.
- Full repository formatting check has 199 existing off-scope warnings; only this task's files were formatted.

Pre-existing staged savings changes, the canonical transaction spec, and the Stitch screen-map edits were preserved.

## Follow-up: reuse savings currency input

At the user's request, all three capture modes now reuse the same `CurrencyInput` as savings creation, with its standard input chrome, currency symbol, and `text-xl font-semibold` sizing. The redundant amount hero styling and duplicate Vietnamese word-formatting logic were removed. Numeric RHF value contracts and semantic mode colors remain.

Verification: 21 capture/transfer tests passed; lint passed; typecheck still reports only the two existing Home translator errors above. Browser: 48 fresh checks covering three modes, English/Vietnamese, light/dark, 390/440/768/1280px, with no horizontal overflow. Evidence: `output/playwright/transactions-redesign/currency-input-evidence.json`; screenshots named `{locale}-{mode}-currency-{theme}.png`. No live transaction was submitted.

## Follow-up: single-line account name and balance

Account options and the selected account now use one flex row: name on the left with `min-w-0 flex-1 truncate`; privacy-aware balance on the right with `shrink-0 whitespace-nowrap` and tabular numerals. The balance label remains accessible without taking horizontal space. No account selection, balance calculation, or financial privacy behavior changed.

Verification: 18 capture tests passed, changed-file ESLint and diff checks passed. 32 browser observations cover expense/income selects in both languages/themes at 390/440/768/1280px. All balances remain within their option bounds, share the name's vertical center, and do not overlap the name; no horizontal document overflow after reopening each dropdown at the new viewport. Evidence: `output/playwright/transactions-redesign/account-row-evidence.json`, with `{locale}-{mode}-account-row-{theme}.png` screenshots.

## Follow-up: date shortcut design

Today/Yesterday now form a compact tonal group below the date picker. The selected day uses the shared tonal Button and Stitch check icon; the inactive day uses a ghost Button. Both preserve 44px touch targets, focus styling, aria-pressed semantics, reduced-motion behavior, disabled/date-boundary rules, and unchanged numeric/date form contracts. No extra local state or animation was added.

Verification: 21 capture/transfer tests passed; changed-file ESLint and diff checks passed. 48 browser checks cover all three modes, both languages/themes, and all four required widths with no document overflow and all shortcut buttons at least 44px tall. Clicking Yesterday updates both pressed states. Evidence: `output/playwright/transactions-redesign/date-shortcuts-evidence.json` and `vi-date-shortcuts-dark.png` / `vi-date-shortcuts-light.png`.

## Fix: capture form scrolling

Removed shrinking `min-h-0` / forced `h-full` constraints from the capture entry, animated mode container, forms, and field stacks. The capture Page cannot shrink below its natural content. The existing app shell remains the single scroll owner. Previously, fields overflowed a compressed flex stack and the sticky submit bar appeared in the middle of the form; it now remains below the fields at the bottom scroll position.

Browser verification: real wheel input at 700px viewport height, covering all three modes, English/Vietnamese, light/dark, and 390/440/768/1280px (48 observations). Scroll reaches the end; no horizontal document overflow or bottom-field/action overlap. The expanded jar/tag section was also scrolled fully into view. Evidence: `output/playwright/transactions-redesign/transaction-scroll-evidence.json` and `transaction-scroll-expanded-dark.png`.

Focused capture/transfer/presentation tests passed; lint passed. Typecheck still reports the two pre-existing Home translator incompatibilities noted above. No financial mutation occurred.

## Follow-up: match amount-input reference

All transaction capture modes use a leading ₫ adornment, a localized empty placeholder, and one input border without the redundant amount surface wrapper. The numeric value retains its larger typography; placeholder uses smaller normal-weight text. Shared CurrencyInput accepts an explicit currency position while retaining its existing locale-dependent default for other callers, including savings.

Verification: 21 capture/transfer tests plus 30 shared core-component tests passed; lint passed; typecheck still reports only the pre-existing Home translator errors. Browser: 48 responsive language/theme/mode observations confirm the symbol stays within the leading padding before the text, localized placeholders match, and no horizontal overflow occurs. Numeric formatting remains `145,000` in English. Evidence: `output/playwright/transactions-redesign/money-prefix-evidence.json` and `{locale}-{mode}-money-prefix-{theme}.png` screenshots.

## Follow-up: linked transfer account card

Transfer source/destination selectors now share a single compact card, with semantic account artwork, a small context label above the account name, and a non-shrinking balance on the right. A down-arrow marker links the two rows at the inset divider. Both controls reuse SelectField and its label/error/required relationships; a trigger-class override allows the card row presentation. The local TransferAccountField shares the two identical account presentations without owning form state. Existing account exclusion, source-change destination adjustment, mutation payloads, privacy, and confirmation remain unchanged.

Verification: 33 transfer/shared core tests passed; lint passed; typecheck reports only the two existing Home translator errors. 16 browser observations cover both languages/themes and four widths, with no horizontal overflow or clipped/overlapping balances. Open destination dropdown confirms source exclusion. Evidence: `output/playwright/transactions-redesign/linked-transfer-accounts-evidence.json`, `vi-linked-transfer-accounts-light.png`, and `vi-linked-transfer-accounts-dark.png`.

## Follow-up: common account style across capture modes

Renamed the local reusable account field to TransactionAccountField and reused it for Expense and Income. Both now show the same account icon, small context label, bold truncated name, and protected right-aligned balance in the trigger and dropdown. Standard account type suffixes were removed to match Transfer; credit-card identity remains explicit. Existing account hints, form accessibility, account-change behavior, privacy, and numeric balance formatting remain.

Verification: 21 capture/transfer tests passed; lint and changed-file formatting/diff checks passed. Typecheck still reports only the existing Home translator errors. 32 browser observations cover Expense/Income in both languages/themes at all required widths, including open dropdowns; icons are present and balances are not clipped or overlapping names. Evidence: `output/playwright/transactions-redesign/all-account-style-evidence.json`, `vi-expense-account-style-dark.png`, and `vi-income-account-style-dark.png`.

## Fix: account dropdown animation jitter

Removed the unconditional zoom/fade animation from shared Select.Popover. HeroUI already owns entering/exiting animations; the extra wrapper animation restarted independently of that lifecycle. Reduced-motion overrides disable the wrapper animation and transition. No selection, positioning, form, or financial logic changed.

Verification: ESLint, changed-file Prettier, diff checks, and 51 focused capture/transfer/shared tests passed. Browser checks cover 390/440/768/1280px, light/dark, Expense/Income/Transfer, and reduced motion. Repeated opens at settled viewport preserve trigger coordinates and main scroll position. Initial opens immediately after resizing may focus-scroll by 14px at desktop widths; this is recorded separately from repeated opening behavior. No unconditional animation class remains; reduced motion computes animation none. Evidence: `output/playwright/transactions-redesign/select-dropdown-motion-evidence.json` and `select-dropdown-stable-dark.png`. Final review: one shared styling change, no new state, types, domain literals, or abstractions.

## Follow-up: independent quick-date chips

Removed the gray group surface and padding. Today/Yesterday use separate shared Buttons: selected tonal mint/check, inactive transparent outlined. Shared spacing token gives 8px gap and default Button height gives 44px touch targets. Existing date-derived pressed state clears both when choosing another calendar date; disabled/boundary rules and translations remain unchanged.

Browser: light/dark at 390/440/768/1280px confirms transparent group, 8px gap, 44px height and 1px inactive border. Yesterday selects correctly; selecting October 1 through the calendar clears both. Evidence: `output/playwright/transactions-redesign/date-chips-evidence.json`, `date-chips-light.png`, `date-chips-dark.png`. Lint, changed-file formatting and diff checks passed. Full suite remains 1677 passed / 5 existing failures, typecheck retains the two existing Home translator errors. Final refactor review: presentation-only change, shared tokens/variants, no new types, literals, state, abstraction or business behavior.

## Follow-up: implement the retrieved SCR-TRN-01-DARK list

Retrieved `projects/16826760243481546078/screens/becbc702ff2b44939ad7474f74426847` using Stitch MCP get_screen and downloaded its hosted HTML using curl -L. Source retained at `output/playwright/transactions-redesign/stitch-trn01-dark-source.html`. This follow-up supersedes the earlier flat-row presentation and the earlier daily-subtotal gap.

Implemented centered compact title/subtitle and plain privacy icon; one full-width search input with search/clear artwork and Enter submission; horizontally scrollable type filters with anchored outlined filter action; removable active category/jar/tag filters; one shared bordered surface per date with row dividers; date/count/subtotal headings; category accent and actual creation time in row metadata; green refund amounts; a floating Add Transaction route link; and an honest loaded-count footer. Mobile shell, real data, privacy, filter URLs, details routing and pagination remain intact. No simulated system status bar, fabricated jar allocation, recurring-income badges or account-card network metadata were added.

Daily summaries live in the ledger application layer, separate currencies, respect existing income/expense contribution flags, exclude internal transfers, and count only the loan interest expense contribution. They describe the currently filtered feed. The last date group stays without count/subtotal while pagination can still add rows to that date, preventing a partial sum from appearing complete. Tests cover mixed currencies, transfer exclusion and combined loan payments.

Browser evidence: `output/playwright/transactions-redesign/stitch-list-responsive-evidence.json` includes 16 observations across Vietnamese/English, light/dark and 390/440/768/1280px. No horizontal document overflow; group surfaces and 44px floating action confirmed. Enter search and clear search, category apply/remove, masked row accessible names and masked daily amounts, keyboard focus and reduced motion verified. Native wheel scrolling loaded 25 additional rows (25 to 50). Screenshots: `stitch-list-{locale}-{theme}.png`, `stitch-list-active-filter.png`. No financial mutation occurred.

Validation: full lint passed, changed-file Prettier and diff checks passed; 26 relevant presentation/activity/filter/privacy tests passed. Typecheck reports only the two existing Home translator incompatibilities. Final refactor review: shared primitives/artwork/tokens retained; close artwork added once to the semantic action registry; no new dependency, domain literals, unsafe casts, financial calculations in React, or duplicate form state.

Final full-suite rerun: 1679 passed / 5 pre-existing failures across i18n parity, account hero wrapping, and account InlineAlert provider coverage; no new failures remain.

## Fix: remove remaining Select open/close motion

The earlier fix removed a duplicate wrapper animation but retained HeroUI's native zoom/slide entering/exiting motion. The user reported continued jitter. Shared Select.Popover now explicitly disables animation and transition with Tailwind important utilities, including native entering/exiting states. This is an immediate open/close interaction; no new animation layer, timing configuration, dependency or state was added. Every caller uses the same wrapper.

Browser: 24 observations across expense/income/transfer, light/dark, 390/440/768/1280px. Popovers compute animation none, transform none and transition 0s; Escape removes each popover immediately. Screenshot `output/playwright/transactions-redesign/account-dropdown-no-motion-dark.png`; evidence `account-dropdown-no-motion-evidence.json`. 51 focused capture/transfer/shared tests passed; changed-file ESLint, Prettier and diff checks passed. Final review: one shared style-line change; financial selection/value contracts retained.

## Fix: filter Sheet alignment and wrapped selection rows

Moved the 440px viewport limit from HeroUI Drawer.Content (fixed inset positioning wrapper) to Drawer.Dialog, and centered the content wrapper. This fixes left-anchored sheets at desktop widths through the shared BottomSheet. FilterChip now gives its child wrapper flex layout and available width, allowing category/jar labels and trailing selection indicators to stay on one row. No filter state or financial behavior changed.

Browser: light/dark at 390/440/768/1280px, all sheets centered within the canonical canvas and all category/jar indicators aligned without overlapping names. Selection pressed state updates; real wheel scroll reaches the end of the Sheet body while the footer remains available. Evidence: `output/playwright/transactions-redesign/filter-sheet-fix-evidence.json`, `filter-sheet-fix-dark.png`. 35 shared-component/privacy tests passed; changed-file lint, formatting and diff checks passed. Final review: two shared styling changes, no new dependencies, types or state.

## Redesign: consistent category, jar and tag filter choices

Replaced category/jar FilterChip rows and the separate tag row markup with one local TransactionFilterOption using the shared HeroUI Button, AppIcon and semantic tokens. Every option now has a 32px icon, a readable label, optional archived/paused/inactive status on its own line, a non-shrinking trailing square check, and the same mint selected surface. Category artwork comes from the category registry; jars use PLAN_ICONS.jar; tags retain their persisted artwork and color. All three searches use the shared leading search icon and identical field chrome. Sections use 24px rhythm. Removed duplicated Drawer padding locally so sheet content uses canonical 16px gutters.

UI UX Pro Max touch-spacing search confirmed 8px separation; ViNha canonical tokens and shared controls remain authoritative. No filter payload, disabled/archive rule, tag limit, selection state ownership or apply/cancel behavior changed.

Browser: 16 responsive observations cover Vietnamese/English, light/dark at 390/440/768/1280px. All three groups have aligned icon/label/check columns, at least 44px targets, centered sheets and no document overflow. Applying a category, jar and tag together updates all three URL filters; clearing removes them. Space toggles selection with visible focus; searching no match renders zero choices; closing without applying discards the draft; reduced motion checked. Evidence: `output/playwright/transactions-redesign/filter-unified-evidence.json`, `filter-unified-category-dark.png`, `filter-unified-jar-dark.png`, `filter-unified-tag-dark.png`.

Validation: full lint passed, 38 focused shared/filter/privacy tests passed; typecheck retains only the two existing Home translator errors. Final review: one reused local presentation component removes duplicated option markup; no new dependency, financial logic, state, unsafe casts or persisted display values.
