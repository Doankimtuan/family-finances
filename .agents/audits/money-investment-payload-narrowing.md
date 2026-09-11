# Money Investment Payload Narrowing

Date: 2026-09-11  
Status: **BENCHMARK_REJECTED**  
Scope: authenticated MONEY Investment summary and its shared Home adapter.  
Mode: read-only audit and reversible local prototype; no production source,
schema, RLS policy, financial data, or infrastructure was changed.

## 1. Executive Summary

`get_home_investment_raw_inputs()` returns 43 flat fields per active holding.
MONEY and Home both call the same cached `listInvestmentHomeSummary()` loader,
so there is no current Money-only or Home-only raw-input consumer.

The resolver-safe projection can remove display metadata and unused valuation
audit fields. A production-shaped projection retained the fields required by
the existing mappers and reduced the representative response from 28,002 to
22,658 bytes (-19.1%). A resolver-minimal projection reached 16,722 bytes
(-40.3%) but would require a narrower mapper.

Both projections passed 20/20 raw and valuation equivalence comparisons. The
production-shaped projection failed the performance gate: in 20 alternating
authenticated direct samples, the median RPC duration increased from 206.0 ms
to 227.6 ms and p95 changed from 314.2 ms to 308.0 ms. The p95 difference is
not material evidence of a win.

Decision: **Option E — do nothing**. Keep the existing shared RPC and stop this
MONEY optimization phase. Payload bytes alone do not justify another field-list
contract or a Money-specific RPC.

## 2. Existing RPC Contract

Source: `supabase/migrations/20260911022939_home_investment_raw_inputs.sql:3-153`.

- Function: `public.get_home_investment_raw_inputs()`.
- Arguments: none; household scope comes from `investment_active_household()`.
- Result: one flat row per active, non-exited holding with positive quantity.
- Sources: `investment_holdings`, `market_instruments`,
  `market_instrument_prices`, `market_currency_rates`, latest
  `investment_valuations`, and aggregated `investment_operations`.
- Security: `SECURITY INVOKER`, fixed `public` search path, public execution
  revoked, `authenticated` execution granted.
- SQL does not calculate final market value, unrealized P/L, stale quality, or
  valuation source. `resolveInvestmentValuation()` remains authoritative.

The MONEY route starts `listInvestmentHomeSummary()` in its page-wide
`Promise.all` at `app/[locale]/(product)/money/page.tsx:81-100`. Home reaches the
same loader through `modules/home/application/home-product-summary-adapters.ts:76-95`.
The loader maps each flat row and calls the unchanged resolver at
`modules/investments/application/queries/investment-queries.ts:792-822`.

## 3. Field Consumption Map

The resolver reads only the properties used in
`modules/investments/application/market-valuation.ts:183-235`. “Mapper-only”
means the current flat-row mapper copies or validates the field to build a
full shared type, but the MONEY/Home summary does not use its value.

| Returned field                    | Source / meaning                                           | Current MONEY/Home consumer           | Resolver / final-summary use                                 | Classification               |
| --------------------------------- | ---------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------ | ---------------------------- |
| `holding_id`                      | `investment_holdings.id`; holding identity                 | Row mapping and ordering              | Identifies each resolution                                   | REQUIRED                     |
| `asset_class`                     | `investment_holdings.asset_class`; pricing/staleness class | Resolver input                        | Chooses crypto/gold/stock/fund freshness behavior            | REQUIRED                     |
| `instrument_id`                   | `investment_holdings.instrument_id`; nullable market link  | Instrument/price lookup in row mapper | Instrument and price identity; null triggers fallback        | CONDITIONALLY REQUIRED       |
| `quantity`                        | `investment_holdings.quantity`                             | Resolver input and P/L row alignment  | Multiplies unit prices; not used for `TOTAL_VALUE`           | CONDITIONALLY REQUIRED       |
| `remaining_total_cost_basis`      | `investment_holdings.remaining_total_cost_basis`           | Summary P/L aggregation               | P/L calculation; null produces incomplete P/L                | CONDITIONALLY REQUIRED       |
| `instrument_asset_class`          | `market_instruments.asset_class`                           | `mapHomeInstrument()` validation/copy | Not read by resolver                                         | MAPPER-ONLY                  |
| `instrument_symbol`               | `market_instruments.symbol`                                | `mapHomeInstrument()` copy            | Not read by resolver                                         | MAPPER-ONLY                  |
| `instrument_name`                 | `market_instruments.name`                                  | `mapHomeInstrument()` copy            | Not read by resolver                                         | MAPPER-ONLY                  |
| `instrument_exchange`             | `market_instruments.exchange`                              | `mapHomeInstrument()` copy            | Not read by resolver                                         | MAPPER-ONLY                  |
| `instrument_currency`             | `market_instruments.currency`                              | `mapHomeInstrument()` copy            | Price currency, not instrument currency, drives FX           | MAPPER-ONLY                  |
| `instrument_pricing_mode`         | `market_instruments.pricing_mode`                          | `mapHomeInstrument()`                 | Manual vs automatic and `TOTAL_VALUE` branch                 | REQUIRED                     |
| `instrument_auto_price_supported` | `market_instruments.auto_price_supported`                  | `mapHomeInstrument()`                 | Automatic-price eligibility                                  | REQUIRED                     |
| `instrument_is_active`            | `market_instruments.is_active`                             | `mapHomeInstrument()`                 | Automatic-price eligibility                                  | REQUIRED                     |
| `instrument_metadata`             | `market_instruments.metadata` JSON                         | Mapper defaults it to `{}`            | Not read by resolver or summary                              | UNUSED FOR BOTH              |
| `price`                           | `market_instrument_prices.price`                           | `mapHomePrice()`                      | Automatic current value                                      | CONDITIONALLY REQUIRED       |
| `price_currency`                  | `market_instrument_prices.currency`                        | `mapHomePrice()`                      | Reporting-currency/FX branch and output                      | CONDITIONALLY REQUIRED       |
| `price_type`                      | `market_instrument_prices.price_type`                      | `mapHomePrice()`                      | Resolver output `priceType`                                  | REQUIRED FOR RESOLVER OUTPUT |
| `price_date`                      | `market_instrument_prices.price_date`                      | `mapHomePrice()`                      | Stock/fund publication-age staleness and output              | CONDITIONALLY REQUIRED       |
| `price_fetched_at`                | `market_instrument_prices.fetched_at`                      | `mapHomePrice()`                      | Crypto/gold freshness and output                             | CONDITIONALLY REQUIRED       |
| `price_provider`                  | `market_instrument_prices.provider`                        | `mapHomePrice()`                      | Resolver output provider                                     | REQUIRED FOR RESOLVER OUTPUT |
| `price_metadata`                  | `market_instrument_prices.metadata` JSON                   | Mapper defaults it to `{}`            | Not read by resolver or summary                              | UNUSED FOR BOTH              |
| `price_updated_at`                | `market_instrument_prices.updated_at`                      | `mapHomePrice()` copies it            | Not read by resolver or summary                              | MAPPER-ONLY                  |
| `fx_base_currency`                | `market_currency_rates.base_currency`                      | `mapHomeRate()`                       | Validates the price/rate currency pair                       | CONDITIONALLY REQUIRED       |
| `fx_quote_currency`               | `market_currency_rates.quote_currency`                     | `mapHomeRate()`                       | Validates the reporting-currency pair                        | CONDITIONALLY REQUIRED       |
| `fx_rate`                         | `market_currency_rates.rate`                               | `mapHomeRate()`                       | Converts non-VND automatic prices                            | CONDITIONALLY REQUIRED       |
| `fx_rate_date`                    | `market_currency_rates.rate_date`                          | `mapHomeRate()` validation/copy       | Not read by resolver                                         | MAPPER-ONLY                  |
| `fx_fetched_at`                   | `market_currency_rates.fetched_at`                         | `mapHomeRate()`                       | FX stale classification                                      | CONDITIONALLY REQUIRED       |
| `fx_provider`                     | `market_currency_rates.provider`                           | `mapHomeRate()` copy                  | Resolver uses market-price provider instead                  | MAPPER-ONLY                  |
| `fx_updated_at`                   | `market_currency_rates.updated_at`                         | `mapHomeRate()` validation/copy       | Not read by resolver                                         | MAPPER-ONLY                  |
| `manual_value_vnd`                | Latest `investment_valuations.value_vnd`                   | Manual fallback presence/value        | Manual current value and fallback selection                  | CONDITIONALLY REQUIRED       |
| `manual_valuation_date`           | Latest valuation date                                      | Manual mapper                         | Manual resolver output date                                  | CONDITIONALLY REQUIRED       |
| `manual_created_at`               | Latest valuation creation timestamp                        | Current mapper copies it              | Not read by resolver or summary                              | UNUSED FOR BOTH              |
| `manual_quantity`                 | Latest valuation quantity                                  | Current mapper copies it              | Not read by resolver or summary                              | UNUSED FOR BOTH              |
| `manual_unit_price_vnd`           | Latest valuation VND unit price                            | Manual mapper                         | Manual resolver output price fallback                        | CONDITIONALLY REQUIRED       |
| `manual_source`                   | Latest valuation source label                              | Current mapper copies it              | Resolver hardcodes manual source; summary does not use label | UNUSED FOR MONEY             |
| `manual_input_currency`           | Manual input currency                                      | Manual mapper                         | Manual resolver output price currency                        | CONDITIONALLY REQUIRED       |
| `manual_input_unit_price`         | Manual input unit price                                    | Manual mapper                         | Manual resolver output price                                 | CONDITIONALLY REQUIRED       |
| `manual_input_total_value`        | Manual input total value                                   | Current mapper copies it              | Not read by resolver or summary                              | UNUSED FOR BOTH              |
| `manual_input_rate_to_vnd`        | Manual input FX rate                                       | Manual mapper                         | Manual resolver output FX rate                               | CONDITIONALLY REQUIRED       |
| `manual_input_rate_date`          | Manual input FX date                                       | Current mapper copies it              | Not read by resolver or summary                              | UNUSED FOR BOTH              |
| `manual_input_rate_source`        | Manual input FX source                                     | Current mapper copies it              | Not read by resolver or summary                              | UNUSED FOR BOTH              |
| `realized_pnl`                    | Aggregated `investment_operations.realized_result_vnd`     | `rows[0]` summary aggregation         | Not read by resolver                                         | REQUIRED FOR SUMMARY         |
| `investment_income`               | Aggregated income-operation total                          | `rows[0]` summary aggregation         | Not read by resolver                                         | REQUIRED FOR SUMMARY         |

There are no raw fields consumed exclusively by Money or exclusively by Home:
both surfaces use the same summary query. The final summary needs 5 holding
fields, 3 instrument pricing flags, 7 price/FX financial-freshness fields, 7
manual valuation fields, and 2 operation totals. The existing mapper retains
some additional structural fields because it constructs the full shared market
types.

## 4. Payload Composition

Representative authenticated response: 20 rows, 28,002 bytes. The following
is an approximate category contribution made by JSON-encoding each category's
values from that response; category totals omit some shared row/object framing,
so they sum to 27,376 rather than exactly 28,002 bytes.

| Category                       | Approx. bytes | Share of response |
| ------------------------------ | ------------: | ----------------: |
| Holding fields                 |         3,703 |             13.2% |
| Instrument fields and metadata |         6,829 |             24.4% |
| Market-price fields            |         4,753 |             17.0% |
| FX fields                      |         3,733 |             13.3% |
| Manual valuation fields        |         7,537 |             26.9% |
| Operation totals               |           821 |              2.9% |

Observed duplication:

- 15 distinct instrument IDs across 20 rows; 5 rows are duplicate occurrences,
  and the instrument metadata has the same 15-value cardinality.
- `instrument_metadata` is non-empty on all 20 rows. `price_metadata` is an
  empty JSON object on all 20 rows; there is no separate provider-metadata JSON
  field in this RPC.
- FX rows resolve to two base-currency values across the flat result, so FX
  attributes repeat per holding rather than being normalized.
- The operation-total pair has one distinct value repeated on all 20 rows,
  creating 19 duplicate occurrences. It is only 821 approximate bytes, so
  normalizing it would add shape complexity without a convincing win.

## 5. Baseline

Fresh local production build, hosted Supabase, authenticated Chromium, 440×900.
The measured navigation proxy is the time for `page.goto()` to
`domcontentloaded`; content-complete is the `money-hub` marker. Ten measured
loads followed one warm-up navigation.

| Metric                               |      Result |
| ------------------------------------ | ----------: |
| MONEY document-navigation median     |    564.1 ms |
| MONEY document-navigation p75        |    905.7 ms |
| MONEY document-navigation p95 / max  |  1,086.1 ms |
| MONEY content-complete median        |    582.9 ms |
| MONEY content-complete p75           |    917.2 ms |
| MONEY content-complete p95 / max     |  1,124.7 ms |
| Warm MONEY Supabase/Auth fetches     | 10 per load |
| Investment RPC server span median    |      220 ms |
| Investment RPC server span p95 / max |      519 ms |

The ten-load server trace contained one investment RPC, one wave, and ten
total MONEY HTTP fetches per measured load. The current investment response was
28,002 bytes.

Existing same-function SQL evidence from the prior Home Investment audit is
the applicable database reference: 0.011 ms planning, 12.798 ms execution,
and 1,913 shared-buffer hits. Fresh local `psql`/Postgres was unavailable, and
the candidate is a PostgREST response projection over the same SQL function, so
it does not change database execution.

## 6. Candidate Options

| Option | Shape                                                | Calls / waves                         | Benefit                                                                  | Cost / decision                                                                                      |
| ------ | ---------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| A      | Keep current shared raw RPC                          | 1 / 1                                 | No maintenance or contract change                                        | Current baseline; retained                                                                           |
| B      | Add a `select` projection to the existing shared RPC | 1 / 1                                 | 19.1% smaller with existing mapper; 40.3% smaller with a narrower mapper | Direct median regressed; rejected                                                                    |
| C      | New Money-specific raw-input RPC                     | 1 / 1                                 | Could expose only resolver fields                                        | Duplicates RPC/RLS/migration contract while Home and Money currently share the loader; not justified |
| D      | Normalize operation totals or FX/instrument values   | 1 / 1 only with a new nested contract | Removes repeated values                                                  | More shape/application complexity; repeated totals are small; rejected                               |
| E      | Do nothing                                           | 1 / 1                                 | Avoids unsupported optimization                                          | **Selected**                                                                                         |

## 7. Prototype

The read-only prototype called the existing RPC with a PostgREST `select`
projection. It did not alter the SQL function, move formulas into SQL, add a
second RPC, or change the application resolver.

Two projection sizes were measured:

1. **Production-shaped, 36 fields:** kept fields required by the current
   `mapHomeInstrument`, `mapHomePrice`, and `mapHomeRate` structural checks;
   removed `instrument_metadata`, `price_metadata`, `manual_created_at`,
   `manual_quantity`, `manual_input_total_value`, `manual_input_rate_date`,
   and `manual_input_rate_source`. This is the candidate used for the browser
   prototype.
2. **Resolver-minimal, 27 fields:** kept only holding inputs, instrument
   pricing flags, automatic price/freshness inputs, manual resolver inputs, and
   operation totals. It requires an explicit narrower mapper because the shared
   `MarketInstrument` type currently includes display fields.

The production-shaped candidate is the decision candidate because it is the
smallest projection that can be tested through the existing application mapper
without manufacturing unused display values. Both projections still provide
every financial input read by the same `resolveInvestmentValuation()` function.

## 8. Raw Equivalence

**PASS.** Twenty paired authenticated samples compared every financially
meaningful field: holding identity, asset class, instrument ID and pricing
flags, price value/currency/type/date/freshness/provider, FX pair/rate/freshness,
manual value/date/price/input currency/input price/input rate, and operation
totals.

- Production-shaped projection: 20/20 matches, zero mismatches.
- Resolver-minimal projection: 20/20 matches, zero mismatches.

The comparison canonicalized numeric values because PostgREST returns numeric
columns as JSON numbers with database precision formatting.

## 9. Valuation Equivalence

**PASS.** Twenty paired samples fed current and resolver-minimal inputs through
the exact same unchanged `resolveInvestmentValuation()` implementation with a
fixed `now` value. The comparison covered:

- current value and remaining cost basis;
- unrealized P/L and P/L percentage;
- automatic/manual source, freshness, and quality;
- manual fallback and missing-price behavior;
- FX conversion and FX-incomplete behavior;
- `TOTAL_VALUE` versus unit-price behavior;
- portfolio market/P&L totals, realized P/L, and investment income.

Result: 20/20 complete summary matches, zero mismatches. No SQL valuation
formula was introduced.

## 10. RLS / Tenancy

The function remains the existing `SECURITY INVOKER` function with no caller-
supplied household ID. The projection does not change the security boundary.

| Probe                                              | Result                                                                                    |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Authenticated active household with investments    | 20 visible holdings and 20 RPC rows; HTTP 200                                             |
| Authenticated active household without investments | 1 active membership, 0 holdings, 0 RPC rows; HTTP 200                                     |
| Authenticated non-member                           | 0 active memberships, 0 holdings, 0 RPC rows; HTTP 200                                    |
| Cross-household attempt                            | No target-household argument exists; identity-scoped reads returned no shared target rows |
| Anonymous                                          | Denied; HTTP 401, Postgres `42501`                                                        |

No service-role client, write, policy change, or household argument was used.

## 11. Direct Benchmark

Twenty alternating authenticated samples were run against the same linked
Supabase project. The primary comparison is the production-shaped projection.
All 40 requests succeeded; errors: 0.

| Metric         | Current full RPC | Candidate projection |     Delta |
| -------------- | ---------------: | -------------------: | --------: |
| Response bytes |           28,002 |               22,658 |    -19.1% |
| Median         |         206.0 ms |             227.6 ms |  +21.6 ms |
| P75            |         251.8 ms |             264.4 ms |  +12.6 ms |
| P95            |         314.2 ms |             308.0 ms |   -6.2 ms |
| Maximum        |         853.6 ms |             552.8 ms | -300.8 ms |

The resolver-minimal probe reduced bytes to 16,722 (-40.3%) but also regressed
the direct median: 211.6 ms current versus 220.6 ms candidate; p95 was 301.9
ms versus 529.0 ms. This reinforces that the wire-size reduction is not a
latency win on this hosted request path.

## 12. Decision Gate

| Gate                               | Result                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| Raw equivalence                    | PASS, 20/20                                                                           |
| Valuation equivalence              | PASS, 20/20                                                                           |
| RLS unchanged / passed             | PASS                                                                                  |
| Meaningful payload reduction       | PASS, 19.1% production-shaped; 40.3% minimal                                          |
| Material median or p95 improvement | **FAIL**; median regressed, p95 change was negligible                                 |
| Home behavior unchanged            | PASS; no production change made                                                       |
| No extra call or wave              | PASS; 1 call / 1 wave                                                                 |
| Maintenance cost acceptable        | FAIL for the observed gain; adds a projection contract with no measured speed benefit |

Candidate decision: **REJECTED**.

## 13. Implementation

Not applicable. The projection was temporary local benchmark code and was
removed after measurement. No migration, RPC definition, resolver, mapper,
route, RLS policy, or financial data was changed.

## 14. MONEY Before vs After

This is exploratory browser evidence only: the candidate build was run in a
separate local production-server batch and was not an accepted production
treatment. The direct alternating benchmark above is the decision evidence.

| Metric                        | Current control | Candidate-shaped build | Interpretation                       |
| ----------------------------- | --------------: | ---------------------: | ------------------------------------ |
| Document-navigation median    |        564.1 ms |               558.9 ms | No attributable win                  |
| Document-navigation p95       |      1,086.1 ms |               927.8 ms | Network variance                     |
| MONEY content-complete median |        582.9 ms |               570.2 ms | No attributable win                  |
| MONEY content-complete p95    |      1,124.7 ms |               986.4 ms | Network variance                     |
| Investment server-span median |          220 ms |                 233 ms | Candidate slower                     |
| Investment server-span p95    |          519 ms |                 276 ms | Tail improved in this small run only |
| Total MONEY fetches           |              10 |                     10 | Unchanged                            |
| Investment calls / waves      |           1 / 1 |                  1 / 1 | Unchanged                            |

## 15. Home Regression Check

**NOT APPLICABLE.** The shared RPC and production application code were not
changed. Home continues to call the existing `listInvestmentHomeSummary()`
contract, so there is no post-implementation Home regression surface to test.

## 16. Remaining Bottlenecks

- MONEY already has one Investment call in one wave; narrowing does not remove
  a dependency boundary.
- Hosted Supabase request latency and tail variance dominate the small current
  household. The direct RPC median is roughly 206 ms before projection, while
  prior SQL execution is roughly 13 ms.
- The MONEY page still has ten authenticated remote fetches on the warm path,
  with auth/membership and other parallel reads contributing to completion.
- The current warm content-complete result is in the measured ~500–600 ms band;
  a payload-only change with no direct latency win is not worth a new contract.

## 17. Recommended Next Step

Choose **C. STOP MONEY OPTIMIZATION** for this phase. Do not add a Money-specific
Investment RPC or field projection at the current household cardinality.

Revisit only if a larger representative holding set or repeated hosted traces
show a stable direct median/p95 win from projection. Otherwise, a future phase
should be a separately scoped page-streaming investigation, not more Investment
payload trimming.
