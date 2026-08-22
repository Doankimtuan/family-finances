# Market Data — MARKET 05: Final Backend/Security/Performance Gate

## Verdict

**MARKET DATA BACKEND READY**

The completed Market Data backend passes the MARKET 05 local, schema, security,
valuation, performance, and disposable remote checks. MARKET 03 scheduled
activation remains a deployment prerequisite, but its absence does not block
backend readiness because no public current app URL is configured.

## Inputs reviewed

- `.agents/reports/market-instruments-foundation-market01.md`
- `.agents/reports/market-catalog-sync-market02.md`
- `.agents/reports/market-price-sync-market03.md`
- `.agents/reports/market-valuation-integration-market04.md`

## Local verification

| Area                                      | Result | Evidence                                                                                                         |
| ----------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| Market catalog, price sync, FX, valuation | PASS   | 39 focused tests passed across 11 files                                                                          |
| Investment integrity and ownership        | PASS   | 197 focused tests passed across 13 files                                                                         |
| Home, Transactions, privacy, semantics    | PASS   | 65 focused tests passed across 12 files                                                                          |
| Full tests                                | PASS   | 149 files / 1,055 tests                                                                                          |
| Lint                                      | PASS   | `npm run lint`                                                                                                   |
| Typecheck                                 | PASS   | `npm run typecheck`                                                                                              |
| Production build                          | PASS   | `npm run build`; both admin routes compiled                                                                      |
| Browser secret scan                       | PASS   | No service-role, provider, or sync-secret symbols in `.next/static`; no `NEXT_PUBLIC_*` secret environment usage |

Existing non-failing UI test warnings were emitted by HeroUI `PressResponder`
fixtures and did not affect the gate.

## Catalog

Remote Supabase verification after fixture cleanup:

- 3,668 instruments and 3,668 sources.
- Zero duplicate `(provider, provider_instrument_id)` mappings.
- Zero orphan instruments.
- Authenticated search returned records for Crypto/BTC, VN stocks/FPT,
  Fund/CCQ, and Bonds.
- `market_instruments` and `market_instrument_sources` have authenticated
  `SELECT` only; service role has write privileges.
- Valid same-ticker collisions between distinct provider IDs are retained as
  separate provider-backed instruments; provider identity remains unique.

## Price sync

- The active-target RPC uses active holdings, non-null linked instruments,
  active instruments, enabled sources, and `auto_price_supported = true`.
- Disposable remote verification used seven holdings but four unique active
  price targets. Two holdings sharing BTC produced one BTC target.
- Unsupported Bond was excluded; an active supported instrument with no current
  price remained a target, preserving retryability.
- Remote lock verification passed: first acquisition succeeded and a
  concurrent equivalent acquisition was rejected.
- Focused tests cover provider batching, one current row per instrument,
  unsupported instruments, missing provider results, and partial failures.
- MARKET 03 remote verification recorded successful CoinGecko, VNSTOCK, and
  FMARKET price persistence with no historical table.

## FX and valuation

- `market_currency_rates` is current-only with one primary-key row for
  USD→VND; no FX history relation exists.
- FX and native market-price writes are service-role-only.
- Focused tests cover current-rate normalization and failure preservation.
- Valuation tests cover quantity × unit price, NAV × fund quantity,
  `TOTAL_VALUE`, manual fallback, stale-but-usable fallback, FX fallback,
  realized P&L preservation, and no accounting mutation.
- MARKET 04 remote values remained correct for BTC, FPT, Fund/CCQ, and manual
  holdings: 750,000,000 VND, 1,250,000 VND, 1,500,000 VND, and 900,000 VND.
- Remote disposable verification confirmed stale fund data, missing FX, and
  missing-price cases without creating income, expense, or transaction rows.

## Security and ownership

- Authenticated remote fixture attempted writes to instruments, sources,
  prices, and FX; all four were denied.
- Remote function privileges expose active-target and lock RPCs to
  `service_role` only.
- Admin route tests reject missing/wrong bearer secrets and accept the
  server-only secret contract without exposing it to clients.
- Production bundle scan found no service-role/provider/sync secrets in the
  browser bundle.
- Existing investment ownership, integrity, Home, Transactions, and privacy
  tests remained green.

Supabase advisors still report unrelated project-wide findings, including
legacy security-definer and unindexed-foreign-key notices. MARKET-specific
advisor notices are limited to the intentional service-only operational tables
without public policies and an unused search index; no MARKET security defect
was identified.

## Performance and storage shape

- Active price-target runtime is based on distinct unique active instruments,
  not users or holdings.
- Provider adapters batch requests and persistence uses chunked upserts with a
  per-row fallback only after a bulk persistence error.
- Valuation reads bulk-load instruments, current prices, and FX once each into
  maps. The query-shape regression test asserts one query per market-data table,
  independent of holding count.
- Current prices use one primary-key row per instrument.
- No `market_instrument_price_history`, price snapshot, or FX history relation
  exists remotely or in the MARKET migrations.

## Cron deployment prerequisite

Remote state is intentionally not scheduled yet:

- `cron` schema available: yes.
- MARKET 03 jobs present: zero.
- Required Vault secrets present: zero.

Activation steps for deployment:

1. Deploy the current Next app at a public HTTPS URL that exposes
   `/api/admin/market-price-sync`.
2. Set the deployment's `MARKET_PRICE_SYNC_SECRET`.
3. Add Supabase Vault secrets `market_price_sync_app_url` with the public app
   base URL and `market_price_sync_secret` with the same backend secret.
4. Apply the MARKET 03 schedule block after those secrets exist.
5. Verify these jobs in `cron.job`:
   - `market_price_sync_crypto` — `0 4 * * *` UTC / 11:00 Asia/Ho_Chi_Minh.
   - `market_price_sync_vnstock` — `30 8 * * 1-5` UTC / 15:30 Asia/Ho_Chi_Minh.
   - `market_price_sync_fmarket` — `0 11 * * 1-5` UTC / 18:00 Asia/Ho_Chi_Minh.
6. Send one controlled request to the deployed route and confirm a successful
   `market_sync_runs` price record.

## Remote fixture cleanup

The disposable MARKET 05 household, user, holdings, valuations, prices, FX
state, and lock were cleaned up and prior shared price/FX rows restored. Three
stale orphan MARKET 04 fixture instruments and their three price rows were also
removed after verifying they had no holdings or provider sources.

## Verification boundary

No production app, migration, provider adapter, ownership rule, accounting
record, or transaction behavior was changed by MARKET 05. The final gate stops
here as requested.
