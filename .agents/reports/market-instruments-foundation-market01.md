# MARKET 01 — Instrument Catalog Foundation

## Scope

Implemented the minimum global market catalog foundation. Provider API calls, scheduling, UI selection, price history, valuation snapshots, automatic valuation mutation, and accounting changes remain out of scope.

## Implementation evidence

- Migration: `supabase/migrations/20260821163005_market_instruments_foundation_market01.sql`.
- Added `market_instruments`, `market_instrument_sources`, and `market_instrument_prices`.
- `market_instrument_prices.instrument_id` is the primary key and foreign key, enforcing one current price row per instrument.
- Added composite source identity `(instrument_id, provider)` and unique provider mapping `(provider, provider_instrument_id)`.
- Added nullable `investment_holdings.instrument_id`, conditional legacy-link clearing, and a foreign key to `market_instruments(id)` with `ON DELETE RESTRICT`.
- Existing holding `name` and accounting fields remain unchanged; multiple holdings can reference one instrument.
- Added shared typed constants for asset classes, pricing modes, providers, and price types, plus catalog/source/current-price types.
- Added only the requested lookup indexes.
- Enabled RLS on all market tables. Authenticated users have `SELECT` only; market writes are granted to `service_role` only. Holding ownership policies were not changed.

## Linked development verification

Applied to Supabase project `bbzffxvgocjwsdbujvgn`; the remote migration was recorded as `20260821163217_market_instruments_foundation_market01`.

SQL verification confirmed:

- all three tables, columns, constraints, primary keys, unique rules, and the holding foreign key;
- RLS enabled on every market table;
- authenticated `SELECT` policies only;
- authenticated write privileges absent and service-role catalog/source/price write privileges present;
- 43 existing holdings remain present, with `instrument_id` nullable and currently null;
- no `market_instrument_price_history` or `market_instrument_price_snapshots` table exists.

Supabase advisors returned existing project-wide security/performance findings and expected unused-index notices for the newly created empty lookup indexes; no MARKET 01 blocking finding was identified.

## Verification commands

- Migration contract tests: passed, 5 tests.
- Focused investment regression tests: passed, 9 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: passed, 139 files / 1,021 tests.
- `npm run build`: passed.
- Targeted Prettier check for changed TypeScript/test files: passed.
- `npm run test:e2e`: completed with 77 passed, 28 unrelated baseline failures, 2 skipped, and 11 not run. Failures were existing UI fixture, timeout, locator, and ownership-harness issues; none identified a MARKET 01 schema or holding-contract regression.
- Repository-wide `npm run format:check`: reports existing unrelated formatting warnings outside the MARKET 01 changed files.

## Verdict

MARKET 01 READY
