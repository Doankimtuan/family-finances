# Historical Plan and month switching — Stitch rebuild

Verified 2026-10-04. Scope: `/plan` historical view and shared month navigation.

Retrieved screen `7101eef820d146599d09686fa420cf5a` from Stitch project `16826760243481546078` through Stitch MCP and downloaded its HTML and screenshot with `curl -L`.

The implementation now uses segmented month navigation, a compact history heading, read-only context within the summary, three compact financial columns, a usage bar below the metrics, one divided historical jar surface, and month-specific review/current-month links. Current-month business actions remain available. Historical allocation stays disabled. Shared currency formatting, HeroUI Select/Button, Stitch artwork, and semantic tokens are reused.

Reference content is sample data. Actual saved history is retained, including the missing-snapshot warning. The history API does not expose historical jar kinds, review completion, or confirmed outgoing rollover; the screen therefore uses canonical generic jar artwork and does not invent those claims. The existing privacy utility is provided in the header; reference search/overflow controls with no existing contract were not added as inert buttons.

## Browser evidence

Authenticated Brave, English and Vietnamese, light/dark, widths 390/440/768/1280, reduced motion. Screenshots live in `output/playwright/plan-history-rebuild/`. No horizontal page overflow was observed; desktop retains the centered 440px shell. Theme classes and media emulation were temporary and restored after testing.

Verified October → September, month picker options and Escape dismissal, visible keyboard focus on next month, month-specific September review destination, browser back, and return to current month. No financial data mutations were submitted.

## Checks

- Full ESLint passed; final changed TypeScript files also checked.
- Full Vitest: 1682 passed, 5 failed. Failures match the existing audit: Money message parity, Money account name wrapping, and three credit-card tests without an intl provider. Plan tests passed.
- Typecheck: two previously documented HomeTranslator incompatibilities in Home; no Plan diagnostics.
- Scoped Prettier and diff whitespace passed. Full format check reports 195 pre-existing files.
- Plan hub Playwright invocation could not start: its port-3100 dev server conflicts with the existing Next dev process on port 3000. Authenticated real-browser checks above were completed without invoking the fixture mutation lifecycle.

## Final review

Applied code-quality, typescript-quality, react-quality, nextjs-architecture, ui-ux-pro-max, testing-quality, and refactor-review. Reviewed only this task's additions on top of the existing uncommitted work: page composition, month selector, historical summary, and English/Vietnamese messages. No new dependency, backend change, financial calculation, persisted display string, arbitrary color, competing icon system, or business constant. Added the selected deep-linked month to selector options so unavailable-history routes remain correctly labeled. Removed repeated compact currency formatting. Pending navigation uses a single transition; no duplicated state or effects.
