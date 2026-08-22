# MARKET 02 — Provider Adapters + Instrument Catalog Sync

## Verdict

**MARKET 02 READY**

## Delivered

- Shared server-only catalog adapter contract for search, listing, and canonical normalization.
- Direct HTTP adapters for `COINGECKO`, `VNSTOCK`, and `FMARKET`; `MANUAL` remains domain-only.
- CoinGecko bounded to the top 500 market-ranked assets. Provider IDs use canonical CoinGecko IDs.
- Vnstock/KBS maps stocks, supported ETFs/funds, and reliable bonds. Bond rows use `TOTAL_VALUE` with automatic pricing disabled.
- FMarket maps funds/CCQ to `NAV_PER_UNIT`.
- Idempotent sync service with independent provider execution, chunked writes, source mapping reuse, omission retention, and failure preservation.
- Local bounded instrument search query with asset-class filtering, active-only default, stable ordering, and no provider calls.
- Secret-protected `POST /api/admin/market-catalog-sync` backend entry point.
- Service-role-only `market_sync_runs` operational table with RLS and grants.
- No price sync, cron, UI, valuation, accounting, or holding-semantics changes.

## Linked development verification

Migration `20260821164931_market_catalog_sync_market02.sql` was applied to project `bbzffxvgocjwsdbujvgn`.

Two manual syncs completed successfully:

| Provider  | Fetched | First sync | Second sync |
| --------- | ------: | ---------: | ----------: |
| COINGECKO |     500 |    500 / 0 |     0 / 500 |
| VNSTOCK   |   3,100 |  3,100 / 0 |   0 / 3,100 |
| FMARKET   |      68 |     68 / 0 |      0 / 68 |

Final catalog state:

- `market_instruments`: 3,668
- `market_instrument_sources`: 3,668
- orphan instruments: 0
- duplicate provider/source mappings: 0

Verified mappings and search records:

- BTC → CoinGecko `bitcoin`, ETH → `ethereum`, SOL → `solana`
- FPT and VIC → Vnstock stock mappings
- Representative FMarket fund/CCQ → provider numeric ID, `NAV_PER_UNIT`
- Representative Vnstock bond → `TOTAL_VALUE`, `auto_price_supported = false`

## Checks

- Focused catalog tests: passed, 9 tests.
- Full tests: passed, 142 files / 1,030 tests.
- Lint: passed.
- Typecheck: passed.
- Production build: passed.
- Remote RLS/grants verification: passed; catalog reads are authenticated read-only and sync-run access is service-role-only.

No additional search index was added; existing MARKET 01 indexes remain in use.
