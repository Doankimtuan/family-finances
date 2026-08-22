# Market Data — MARKET 04: Valuation Integration

## Scope

Implemented read-time investment valuation resolution. Automatic market prices
are preferred for supported linked instruments; manual valuation remains the
fallback for missing prices, missing FX, unsupported instruments, and
unlinked holdings. No holdings, accounting records, transactions, cost basis,
realized P&L, or persisted daily valuations are mutated by portfolio reads.

## Implementation evidence

- Added typed valuation quality, source, and freshness constants:
  `AUTO_CURRENT`, `AUTO_STALE`, `MANUAL`, and `UNKNOWN`.
- Added a pure resolver covering unit prices, fund/CCQ NAV, direct
  `TOTAL_VALUE`, VND rounding, USD→VND conversion, stale-but-usable prices,
  and estimated unrealized P&L.
- Added a current-only `market_currency_rates` table with authenticated reads,
  service-role writes, and RLS. USD→VND sync uses one Frankfurter adapter;
  failed fetches preserve the last valid row.
- Portfolio and holding reads bulk-load instruments, prices, and FX rates into
  maps. The query-shape regression test asserts one query per market-data
  table, independent of holding count.
- Existing manual valuation rows remain read-only fallback data. Automatic
  market movement is not represented as income or expense.

## Tests

Focused coverage includes BTC, stock, fund NAV, shared instrument prices,
`TOTAL_VALUE`, stale crypto, weekend stock freshness, stale NAV, missing-price
manual fallback, manual/unlinked holdings, unknown valuation, zero/unknown
basis, FX normalization, sync failure behavior, and bulk query shape.

Existing investment accounting, Home/Expense semantics, privacy, transaction,
and no-write regressions remain green.

Results:

- `npm run lint` — passed
- `npm run typecheck` — passed
- `npm run test` — passed, 149 files / 1,055 tests
- `npm run build` — passed
- targeted Prettier check — passed
- `git diff --check` — passed

## Controlled remote verification

Using disposable authenticated Supabase fixtures, one Crypto, one Stock, one
Fund/CCQ, and one manual/unlinked holding were created. Native prices were
inserted into `market_instrument_prices`; a current USD/VND rate was inserted
into `market_currency_rates`. The joined read data confirmed:

- Crypto: USD unit price × USD/VND rate × quantity → 750,000,000 VND.
- Stock: VND unit price × quantity → 1,250,000 VND.
- Fund: NAV per CCQ × quantity → 1,500,000 VND.
- Manual/unlinked holding: existing manual value → 900,000 VND.

The fixture household, holdings, instruments, prices, valuation, membership,
and user were deleted after verification. No cron activation was used.

Supabase security/performance advisors were also checked. Reported findings
are pre-existing project-wide lints; the new FX table has authenticated read
policy and service-role write grants.

## Verdict

MARKET 04 READY
