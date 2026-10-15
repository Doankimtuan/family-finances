# Investments Navigation — Phase 1

Date: 2026-10-10

## Status

**INVESTMENTS PHASE 1 PARTIAL — INVESTIGATE BEFORE PHASE 2**

The Buy, Sell, and Update Price operation routes now avoid the full activity-bearing portfolio read. Source and focused tests establish a smaller read shape with no new query wave. The candidate did not receive an authenticated browser run, so its actual HTTP request counts, RSC timing, and browser tail could not be compared with the Phase 0 control.

No financial writes, account changes, ownership changes, or schema changes were made.

## Previous architecture

`InvestmentOperationPage` started the full portfolio, account list, and selected holding in one `Promise.all`. For a linked holding, the full portfolio read included all holdings, valuations, lots, ownership membership state, market instrument/price/FX context, and all operations plus valuation activity. The selected holding then loaded its own holding, valuation, lots, ownership, and market context.

The shared form consumes portfolio holdings only for conversion selectors and the “other investment” fee selector. Buy, Sell, and Update Price use the separate selected holding. The activity-derived portfolio totals and full activity history are not rendered or used by these modes.

## Consumer dependency proof

| Data                                 | Buy                                                                                 | Sell                                                                          | Update Price                                                                                                           | Income                                                         | Convert                                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Selected holding                     | Identity, instrument, current value, quantity, pricing mode, and ownership          | Same; quantity, cost basis, accounting method, and lots also feed the preview | Identity, instrument, current value, quantity, pricing mode, and ownership feed the manual/automatic state and preview | Identity, current valuation, quantity context, and asset class | The form’s selected holding context and current valuation                                                     |
| Peer holdings                        | `id`, `name`, and `symbol` for the other-investment fee selector                    | Same                                                                          | None                                                                                                                   | None                                                           | Writable holdings for source/destination selectors and crypto-leg classification; existing full model remains |
| Eligible accounts                    | Account selector and balance preview                                                | Account selector                                                              | None                                                                                                                   | Account selector                                               | None; the current page still loads accounts for compatibility                                                 |
| Quantity                             | User-entered quantity; existing quantity and basis feed a cash-fee purchase preview | Available quantity, MAX/25%/50%/100%, proceeds preview                        | Existing quantity feeds unit-price/total-value preview                                                                 | Display context only                                           | Source and destination quantities are entered                                                                 |
| Cost basis / lots                    | Remaining basis for purchase preview when applicable; no lots                       | Remaining basis and FIFO lots for the preview                                 | Remaining basis for the P/L preview; no lots consumed                                                                  | None                                                           | None                                                                                                          |
| Current unit price / pricing mode    | Price-per-unit inputs and valuation context                                         | Price-per-unit inputs and proceeds preview                                    | Determines automatic-pricing state and unit-price versus total-value entry                                             | Displayed valuation context                                    | Current selected holding display context                                                                      |
| FX                                   | Existing valuation context; crypto input-rate action is later and unchanged         | Same                                                                          | Existing valuation context                                                                                             | Existing valuation context                                     | Input-rate action is later when a crypto leg is chosen                                                        |
| Operation history / portfolio totals | None                                                                                | None                                                                          | None                                                                                                                   | None                                                           | None                                                                                                          |
| Ownership / capability               | Selected holding capability controls writable/read-only state                       | Same                                                                          | Same                                                                                                                   | Same                                                           | Selected and peer `canMutate` filtering remains in the existing portfolio path                                |

Buy/Sell fee options previously included all holdings in `created_at` ascending order, including the selected holding. The new option query preserves that scope and order and returns only the three fields rendered by the fee selector. Conversion continues to use the full portfolio model and its existing writable-holding filter.

## Implementation

- Added `listInvestmentHoldingOptions()` in `investment-queries.ts`. It uses the existing authenticated server client, `assertMoneyActionAllowed()`, household predicate, RLS, and the same `created_at` ordering as the previous portfolio loader. It returns only `id`, `name`, and `symbol`.
- `InvestmentOperationPage` now loads:
  - Buy/Sell: authoritative selected holding, fee holding options, and accounts in parallel.
  - Update Price: authoritative selected holding only.
  - Income/Convert: the previous portfolio and accounts path.
- `InvestmentOperationForm` now receives fee selector options separately from conversion holdings. The financial preview and mutation payload logic did not change.
- If an explicit Buy/Sell/Update Price holding id is missing or unavailable, the route now shows its existing unavailable state instead of falling back to a different portfolio holding.
- No migration, RPC, cache, mutation, List, Detail, or Create changes were made.

## Request reduction

The Phase 0 control trace reported the following investment-table requests for one linked Buy route. The candidate column is derived from the current query shape for one linked selected holding; it is not a captured HTTP trace.

| Remote operation                   |                  Control: Phase 0 observed |            Phase 1: source-derived |
| ---------------------------------- | -----------------------------------------: | ---------------------------------: |
| Selected holding row               |                                          1 |                                  1 |
| Broad portfolio holding rowset     |                                          1 |                                  0 |
| Peer holding options               | 0 separate reads; included in broad rowset |                      1 narrow read |
| Lots                               |                                          2 |                                  1 |
| Instrument                         |                                          2 |                                  1 |
| Market price                       |                                          2 |                                  1 |
| FX                                 |                                          2 |                                  1 |
| Valuations                         |                                          3 |                                  1 |
| Full operation history             |                                          1 |                                  0 |
| Accounts helper                    |                                          1 | 1 for Buy/Sell; 0 for Update Price |
| Investment-table reads shown above |                                         14 |                                  7 |

The 14-to-7 comparison sums the Phase 0 table counts plus its full operations read. It excludes auth/session and active-membership requests, which were not separately itemized in that trace, and excludes the ledger helper’s underlying reads. Buy/Sell keeps `listAccounts()` unchanged. Update Price drops that helper; its account, household-currency, optional owner-membership, and balance reads are no longer started.

This is a structural comparison only. The peer projection still includes the selected holding’s identity fields to preserve its existing fee-selector options, so the selected row appears in both that projection and the authoritative holding query. Valuations, lots, and market context are no longer duplicated by the full portfolio path.

### Sequential waves

- **Control:** portfolio, accounts, and selected holding started in parallel. The portfolio and selected-holding branches each had dependent related-read work after their holding rows were known.
- **Phase 1 Buy/Sell:** selected holding, peer options, and accounts start in the same top-level `Promise.all`; only the selected-holding and unchanged account dependencies have follow-up work.
- **Phase 1 Update Price:** selected holding and translations only; no portfolio, peer, or account work.

The peer query adds one parallel request and no waterfall. Full operation history and the portfolio’s duplicated related reads disappear from the three scoped routes.

## Performance

Phase 0 recorded one direct read-only Buy route marker at approximately 1,263 ms. The overlapping server spans were 1,194 ms for the full portfolio, 1,334 ms for the selected holding, and 935 ms for accounts. This was one sample, not a statistically meaningful baseline.

| Metric                        | Control p50/p75                               | Phase 1 p50/p75 | Delta |
| ----------------------------- | --------------------------------------------- | --------------- | ----- |
| Selected holding ready        | Not collected                                 | Not collected   | —     |
| Peer holdings ready           | Not collected                                 | Not collected   | —     |
| Accounts ready                | Not collected                                 | Not collected   | —     |
| Required operation data ready | Not collected                                 | Not collected   | —     |
| Route return                  | Not collected                                 | Not collected   | —     |
| Click → first useful UI       | Not collected                                 | Not collected   | —     |
| Click → full form ready       | Not testable in the read-only Phase 0 fixture | Not collected   | —     |
| RSC response / browser tail   | Not available for this operation comparison   | Not collected   | —     |

No candidate authenticated HTTP trace or 10-navigation warm sample was available. Phase 0 removed its temporary authenticated browser state. The available browser inventory exposed a personal Brave profile with unrelated tabs; I did not use it. No credentials or fixture writes were introduced to create another session. The current report therefore does not claim measured latency improvement or browser-proven no-regression.

## Correctness

- Buy/Sell/Update Price still use `getInvestmentHolding(holdingId)` for the selected holding, preserving its household scope, ownership/capability mapping, valuation fallback, instrument, price, FX, quantity, cost basis, accounting method, and lots.
- Sell quantity shortcuts and MAX remain presentation-only. The Sell action and RPC were not changed; the server still re-reads and authorizes the holding and available quantity before the atomic disposal.
- Price-per-unit, total-value, manual valuation, and automatic-pricing logic were not changed. Existing focused coverage includes Sell previews, manual valuation previews, FIFO and weighted-average accounting, and `UNIT_PRICE` / `TOTAL_VALUE` pricing contracts.
- The peer option query preserves the old row order and household filter and omits financial values. Conversion continues to use the existing portfolio model.

## Security

The new peer query is behind `assertMoneyActionAllowed()`, adds the server-derived `household_id` predicate, and uses the authenticated Supabase client. The existing `investment_holdings` SELECT policy also requires active household membership. No service-role access, client-side fetch, new RPC, or mutation path was added. The query exposes only selector identity fields already available to the previous operation form. [Supabase RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Regression checks

- Focused Buy/Sell/Update Price operation-page, selector, form, and view-model tests passed.
- Income and Convert still call the previous portfolio path in the new route orchestration test.
- List, Detail, Create, activity history, account loader, market valuation rules, and operation RPCs were not changed.
- No authenticated browser run was available for List → Detail, read-only/writable route states, or post-change selector inspection. These remain unverified in a real browser for Phase 1.

## Validation

- Focused investment tests: **36 passed** across operation-page, form, portfolio orchestration, and operation view-model suites.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed on Next.js 16.3.1; all routes generated.
- Changed-file Prettier check: passed. `npm run format:check` still fails on 192 repository files outside this change set; they were not reformatted as part of Phase 1.
- `npm run test`: **1,799 passed, 5 failed** across 262 files. The failures were in untouched tests: English/Vietnamese savings-message key parity, long account-card wrapping, and three account-presentation tests missing `NextIntlClientProvider` context. A clean pre-change full-suite run was not captured, so these are classified as unrelated failures, not proven baseline failures.
- Live Supabase query, authenticated request attribution, and browser checks were not run; the new query was verified with a focused mocked Supabase contract test and the existing RLS policy was inspected in the baseline migration.

## Remaining bottleneck

The selected-holding loader remains a dependent path that reads its row before loading valuation, lots, ownership, and linked market context. It also reads lots for Update Price, where the current form does not use them. Buy/Sell still waits for the existing account list and balance data. These were left unchanged to reuse the authoritative query and avoid adding a second selected-holding calculation.

## Final decision

**INVESTMENTS PHASE 1 PARTIAL — INVESTIGATE BEFORE PHASE 2**
