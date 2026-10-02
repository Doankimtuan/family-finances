# Investments overview verification

Implemented a separate `/money/investments/overview` route. The existing
investments and savings/providers pages remain available.

Stitch MCP sources: project `16826760243481546078`, light screen
`48f9de1f42e84169ab9b0642e62e97bf`, dark screen
`7936e0227fae4afdab77b28f3c759e94`. Both hosted HTML files and screenshots
were retrieved with `curl -L` into `/tmp/vinha-investments-{light,dark}.{html,png}`.

The UI uses the existing authorized portfolio query, financial formatters,
privacy provider, valuation metadata, ownership indicators, HeroUI shared
components, semantic tokens, and Stitch artwork. No data or financial
calculations changed. The summary combines market estimate, not-cash warning,
cost/PnL metrics, coverage warnings, and allocation. Holdings support filters,
search, and the settled view. Nonzero received income remains visible.

No transaction button or floating action is rendered on the new route.
The single header action opens the existing holding-creation form. Detail
rows and household-policy navigation were verified in the running browser.
The policy card explains existing rules without inventing agreements,
household member names, or a three-month spending reserve.

## Evidence

Actual authenticated browser, real portfolio, 390/440/768/1280px, light and
dark themes: [screenshots](./evidence/). All eight combinations have no page
horizontal overflow; desktop retains the 440px shell. Reduced motion was
emulated. English was additionally checked at 390px. Keyboard focus,
filtering (20 to 9 holdings), search (one VESAF result), privacy masking,
settled empty state, creation navigation, detail navigation, and policies
navigation were exercised. Theme, viewport, and media overrides were restored.

## Checks

- Scoped component/navigation tests: 8 passed.
- Read-only route authentication E2E checks: 2 passed (English/Vietnamese).
  Run with the read-only config in `output/investments-overview/playwright.config.ts`
  to avoid the default global auth-fixture setup.
- ESLint: passed. Changed-file formatting and `git diff --check`: passed.
- Full unit suite: 1,590 passed, 5 failed in existing savings translation
  parity and credit-card presentation/privacy checks. The translation failure
  is the missing Vietnamese `savingsPage.summaryCaption` key, outside this flow.
- Typecheck: existing `HomeTranslator` incompatibility at
  `home-streaming-sections.tsx:99` and `:340`; no errors in this change.
- Repository-wide formatting: 222 existing files need formatting; no broad
  formatting changes were made.

Final refactor review: route/status/currency/locale values use canonical
constants; no competing UI/icon library, arbitrary colors, domain calculation,
new backend access, duplicated server state, effects, or unsafe casts were added.
The product error boundary is inherited; the new route has its own loading UI.
