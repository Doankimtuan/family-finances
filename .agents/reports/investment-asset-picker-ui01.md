# Investment Asset Picker UI 01

## Scope

Implemented only the investment create/opening flow changes for an independent holding name and optional local `market_instrument` link.

- Added nullable `instrumentId` to opening and initial-purchase command inputs.
- Added server-side catalog action using active-only, asset-class-filtered, bounded local catalog search.
- Added shared Sheet + ActionSheetLayout picker with search, focus, keyboard-focusable rows, loading, empty state, exchange context, and manual fallback.
- Preserved custom holding name independently from the linked symbol/name.
- Added creation RPC migration with active instrument existence and asset-class validation, ownership/idempotency preservation, and nullable persistence.
- Centralized selected-instrument pricing contract resolution for unit price, NAV per unit, total value, manual, and unlinked fallback.
- Added localized VI/EN labels and FinancialValue-wrapped monetary previews.

## Browser evidence

Authenticated `.env.local` Playwright run:

`npx playwright test tests/e2e/investments-asset-picker-ui01.smoke.spec.ts --project=chromium --workers=1`

- 4 passed.
- 390px VI/light: FPT search/selection, custom holding name, pricing status, review, and manual fallback.
- 440px EN/dark: BTC dynamic price label, fund unit/NAV labels, bond total-value exception and live source account.
- 768px and 1280px: centered mobile shell and no horizontal overflow.

## Remote alignment and verification

- Repaired only seven remote-only migration ledger entries as `reverted`: `20260821140913`, `20260821141444`, `20260821142256`, `20260821163217`, `20260821165648`, `20260821232529`, and `20260822000826`.
- Confirmed the existing remote Market 01–04 schema before aligning the corresponding local migration versions as applied; no tables or data were reset or dropped.
- Applied `20260822010000_investment_asset_picker_ui01.sql` to the linked development project.
- Remote `investment_holdings.instrument_id` is queryable and nullable.
- Remote catalog contains active instruments including PVBF; remote market source, price, sync, and currency-rate tables are present.
- Authenticated RPC probe with a mismatched active Fund instrument for a Stock holding returned `Invalid market instrument`.
- Authenticated RPC probe with explicit `p_instrument_id: null` reached normal opening validation (`Invalid opening position` for zero quantity), confirming the nullable manual path.
- RPC migration preserves authenticated grants, ownership resolution, idempotency lookup, account assertion, and instrument active/class validation.

## Final verification

- Authenticated browser smoke: 4 passed at 390, 440, 768, and 1280px; FPT, BTC, Fund/CCQ, Bond total value, manual fallback, and independent holding name covered.
- Focused Investment/Market/privacy/i18n/ownership tests: 101 passed across 9 files.
- Full unit suite: 150 files and 1059 tests passed.
- `npm run typecheck` — passed.
- `npm run build` — passed.
- Changed UI 01 files — ESLint passed.
- Full-repo `npm run lint -- --quiet` still reports three unrelated `no-console` errors in `scripts/home-browser-evidence.mjs`; that file was not modified.

INVESTMENT ASSET PICKER READY
