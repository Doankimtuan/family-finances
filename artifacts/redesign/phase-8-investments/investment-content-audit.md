# Phase 8 — Investment content audit

Presentation-only. Domain, APIs, and valuation math were inspected and left unchanged.

## Canonical routes (from `APP_PATH` / path builders)

| Route | Builder | Role |
| --- | --- | --- |
| `/money/investments` | `APP_PATH.MONEY_INVESTMENTS` | Portfolio hub |
| `/money/investments/new` | `APP_PATH.MONEY_INVESTMENTS_NEW` | Create / import opening |
| `/money/investments/convert` | `APP_PATH.MONEY_INVESTMENTS_CONVERT` | Convert (existing mutation) |
| `/money/investments/[id]` | `moneyInvestmentPath(id)` | Position detail |
| `/money/investments/[id]/buy` | `moneyInvestmentBuyPath(id)` | Buy / invest more |
| `/money/investments/[id]/sell` | `moneyInvestmentSellPath(id)` | Sell / redeem |
| `/money/investments/[id]/income` | `moneyInvestmentIncomePath(id)` | Income / distribution |
| `/money/investments/[id]/valuation` | `moneyInvestmentValuationPath(id)` | Manual valuation |

There is already one Investments hub. No second dashboard was added. Money remains the financial-reality parent (`APP_PATH.MONEY`).

## Domain semantics (existing)

Investments are **estimated holdings**, not cash, not account balance, not household net worth.

Read model: `listInvestmentPortfolio()` → `InvestmentPortfolio`.

Primary aggregate: `totalCurrentValue` (`number | null`). Null means no usable valuation coverage — **not** zero.

Per holding:

- `currentValue` — estimated market value (`number | null`)
- `remainingTotalCostBasis` — remaining cost basis (`number | null`)
- `unrealizedResult` / `estimatedUnrealizedPnlPercent` — estimated PnL when both value and basis exist
- `quantity` — units held
- `valuation.price` / `priceCurrency` / `quality` — unit/reference price and coverage quality
- `allocationByAssetClass` — valued holdings only (`allocateBasisPoints` over holdings with `currentValue != null`)

Reporting currency: `INVESTMENT_REPORTING_CURRENCY`.

Money hub already shows a holdings count or estimated value with `FinancialNumberKind.ESTIMATE`. Home already stamps investments as estimate. Those contracts were preserved; this phase did not turn Money or Home into a second portfolio.

## Asset taxonomy (unchanged)

`InvestmentAssetClass`: `crypto` · `stock` · `fund` · `gold` · `bond`.

Pricing modes already in the model: `UNIT_PRICE`, `NAV_PER_UNIT`, `BUYBACK_PRICE`, `TOTAL_VALUE`, `MANUAL`. Gold uses buy-back / liquidation copy on detail. Bonds / `TOTAL_VALUE` instruments keep existing total-value exceptions in operation forms.

## Lifecycle (existing, not invented)

Persisted: `InvestmentLifecycleStatus` = `active` | `exited` | `under_review`.

Portfolio split is the existing view-model rule:

- **Active** = not exited **and** quantity > 0
- **Closed** = everything else (exited or zero quantity)

UI tabs map to `activeHoldings` / `closedHoldings`, not a new lifecycle.

## Valuation / incomplete data (existing)

`MarketValuationQuality`: `AUTO_CURRENT` · `AUTO_STALE` · `MANUAL` · `UNKNOWN`.

Coverage: `valuationCoverage.included / total`. Missing valuations are **excluded, not zero**. Copy already existed: “Value includes {included} of {total} holdings. Missing valuations are excluded, not zero.”

Position with no price: `unknownValue` / `noCurrentValue` = “No price yet” / “Chưa có giá”.

Incomplete basis: warning alert + `missingBasisTag`. PnL is omitted rather than shown as ₫0.

## Actions (existing)

- Create / import: opening wizard (`OpeningPositionForm`) — field set and payload unchanged
- Convert: `InvestmentFormMode.CONVERSION` — real mutation; not invented
- Detail: Buy (always when mutable), Sell when open, overflow income + manual valuation when not auto-priced
- Buy/Sell/Income are **record operations**, not advice

## Current UX problems (before this phase)

1. Hero used `Amount` without `FinancialNumberKind.ESTIMATE` (defaulted to intention).
2. Missing portfolio/position value could be passed through `Amount` / `FinancialValue`, so privacy masking could make “No price yet” look like a hidden number.
3. Convert sat on the hero as `HeroPillLink`, competing with the estimate story. S5 places Convert on the holdings header as a section pill.
4. Holdings were grouped list rows, not scan-first `Card tone="interactive"` cards with a divided footer.
5. Metric strip was a stacked list, not the compact 2×2 grid.
6. Allocation legend was a single column; incomplete coverage was only on the hero.
7. Active/Closed used `aria-pressed` on `min-h-9` buttons; Closed was hidden when empty.
8. Detail hero still showed PnL. S5 keeps the hero calm; performance stays in facts.
9. `estimatedUnrealizedPnlPercent ?? 0` could render a fabricated 0%.
10. Inline freshness was wrapped in `FinancialValue`, so privacy could mask “Automatic · today”.

## Proposed hierarchy (implemented)

### Portfolio

1. `TopAppBar` (back to Money)
2. Hero: **Estimated market value** (`Amount` + `FinancialNumberKind.ESTIMATE`) or unmasked “No price yet”
3. Quiet coverage / “not cash” note
4. Elevated 2×2 metric strip: remaining basis, estimated PnL, realized, income
5. Allocation strip + two-column legend when `allocationByAssetClass` has rows; coverage repeated when incomplete
6. Holdings header + Convert pill
7. Active / Closed tabs (always, default Active when any active holdings exist)
8. Search + asset-class chips on Active
9. Position cards (interactive) / closed cards (soft)
10. FAB: Add investment

### Position detail

1. `TopAppBar` identity
2. Hero: estimated current value (gold keeps existing liquidation caption)
3. Ownership + inline freshness
4. Existing Buy / Sell / overflow actions
5. Facts: quantity, unit/reference price, remaining basis, estimated PnL, realized, income
6. Instrument metadata
7. Activity list

### Forbidden concepts (not introduced)

Net Worth · Total Money · Free to Spend · Ready to Assign · Reports · portfolio advice (Buy/Hold/Sell as recommendation, rebalance, target price, predicted return).
