# MARKET 03 — Active Instrument Price Sync + Scheduled Refresh

## Verdict

**MARKET 03 NOT READY**

The implementation and manual price-sync path are complete and remote-verified. Scheduled jobs were intentionally not created because the linked Supabase project has no deployed current Next app URL and the required Vault secrets are not configured. The migration fails closed until those deployment secrets exist.

## Delivered

- Extended the MARKET 02 provider adapter boundary with batched price fetching for CoinGecko, VNSTOCK, and FMARKET.
- Added canonical current-price results with `LAST` and `NAV` semantics.
- Added a service-role-only distinct active-target RPC:
  - active holdings only;
  - non-null linked instruments;
  - active instruments;
  - `auto_price_supported = true`;
  - enabled source with lowest numeric priority.
- Added one reusable `syncMarketPrices` command with optional asset-class/provider filters.
- Added current-row upserts into `market_instrument_prices`; no price-history table or valuation mutation was added.
- Added per-provider operational runs with requested/success/failed counts, status, timestamps, and error summaries.
- Added a service-role lease to serialize equivalent sync runs.
- Added protected `POST /api/admin/market-price-sync` with a dedicated server-only secret.
- Added UTC cron definitions for the requested `Asia/Ho_Chi_Minh` times through `pg_cron` + `pg_net` + Vault, guarded by a fail-closed secret check.
- Reasserted authenticated read-only and service-role-only price permissions.

## Verification

Local checks passed:

- `npm run lint`
- `npm run typecheck`
- `npm run test` — 146 files / 1,043 tests
- `npm run build`
- MARKET 03 focused tests — 13 tests passed

Remote development verification passed against the linked Supabase project:

- Controlled holdings: BTC, ETH, SOL, FPT, VIC, PVBF, and unsupported bond.
- First and second all-provider runs both requested 6 unique instruments and persisted 6 successful current rows.
- Providers: CoinGecko 3/3, VNSTOCK 2/2, FMARKET 1/1.
- Price types: crypto/stocks `LAST`; PVBF `NAV`.
- PVBF preserved provider NAV date `2026-08-19`, distinct from fetched date.
- Unsupported bond produced 0 price rows.
- Orphan price rows: 0.
- Controlled holdings and their test price rows were removed after verification.
- Remote schema now contains the MARKET 03 tables/functions and price RLS.

## Remaining blocker

Configure these Supabase Vault secrets with the deployed current Next application URL and the same backend secret used by `MARKET_PRICE_SYNC_SECRET`:

- `market_price_sync_app_url`
- `market_price_sync_secret`

Then rerun the MARKET 03 migration or schedule definitions and verify the three cron jobs exist. The current deployment candidate at `family-finances-iota.vercel.app` does not expose `/api/admin/market-price-sync` yet, so creating live cron jobs would produce a broken schedule.
