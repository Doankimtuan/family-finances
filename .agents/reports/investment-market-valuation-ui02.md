# Investment Market Valuation UI 02

## Scope

Implemented only the investment overview/list and holding detail valuation surfaces. Accounting, provider fetching, cron, Buy/Sell, price history, charts, and read-time valuation mutation were not changed.

## Delivered

- Holding rows keep the user-defined holding name primary and show linked instrument context.
- Overview and detail use `FinancialValue` for market value, basis, P&L, income, and activity amounts.
- Estimated market value, remaining cost basis, estimated unrealized P&L plus percentage, realized P&L, and received income are separate.
- VND is used for totals; source quote currency is shown only beside the unit price/NAV metadata.
- MARKET 04 states are presented as automatic current, automatic stale, manual, and unknown.
- Stale values remain visible with restrained last-updated messaging; unknown values show `Chưa có giá` / `No price yet` and do not produce misleading P&L.
- Closed holdings remain accessible with realized results and history; current value and unrealized P&L are not implied when quantity is zero.
- Detail has a loading skeleton, retryable read error, activity partial-error state, and offline read-only banner.
- VI/EN terminology and financial privacy masking cover valuation surfaces while instrument identity and freshness dates remain visible.
- Added typed holding read results distinguishing ready, not-found, and recoverable read error.

## Browser evidence

Authenticated `.env.local` Playwright smoke coverage passed:

| Viewport | Locale | Theme | Result |
| -------- | ------ | ----- | ------ |
| 390px    | VI     | light | passed |
| 440px    | EN     | dark  | passed |
| 768px    | VI     | light | passed |
| 1280px   | EN     | dark  | passed |

The same run checked list/detail navigation, valuation metadata, activity history, no horizontal overflow, reduced motion, privacy masking, and offline read-only presentation. Result: 5 passed.

## Validation

- Focused UI02, MARKET 04 valuation, portfolio, and privacy tests: 5 files, 19 tests passed.
- Full unit suite: 152 files, 1,067 tests passed.
- Changed-file ESLint: passed.
- Typecheck: passed.
- Production build: passed.
- `git diff --check`: passed.
- Repository-wide ESLint: passed with no errors.

## Verdict

INVESTMENT MARKET VALUATION UI READY

The UI02 implementation, focused checks, and repository-wide lint gate are green.
