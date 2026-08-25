# Investments Implementation Clarification

## Authority and scope

This is the implementation-safe Phase F6.1 contract for portfolio/holdings, opening positions, buy, sell, asset conversion, explicit fees, optional slippage, manual valuation, household-level performance, and cash investment income. It narrows the existing Investments implementation contract; it preserves all approved state, permission, no-advice, no-automation, BR-01, BR-24, correction, audit, and historical-preservation rules.

The product name is **Investments** in English and **Đầu tư** in Vietnamese. The canonical route family is `/money/investments`, defined through `modules/tenancy/application/app-path.ts`; route strings must not be repeated in UI code.

V1 is manual-first. VND is the reporting currency and all cost basis, valuation, realized result, income, fee value, and portfolio totals are represented in integer VND minor units. Provider/custodian context is supported, but provider integration, automatic price refresh, statement import, tax accounting, tax-lot reporting, corporate actions, recommendations, and automation remain out of scope.

## V1 asset coverage

Quantity-based tracking must work for:

- Crypto.
- Stocks.
- Fund certificates and funds.
- Gold.
- Bonds.

Each holding supports optional provider/custodian context. These asset classes share the same accounting rules; V1 introduces no asset-class-specific trading behavior.

Real estate and private ownership must not be forced into quantity-based accounting. A future ownership/value-based model may support them. Insurance-linked products and other non-quantity ownership models also remain outside the V1 quantity engine unless they can be represented truthfully under this contract.

## Canonical holding model

### Identity

- `holding_id` is the immutable, system-generated identity, unique within its household.
- Asset name and symbol are descriptive and are not unique keys. Two holdings may share a name or symbol because provider, custody, or ownership context may differ.
- Required holding data is asset name, supported asset class, and ownership/visibility context supplied by Together or explicitly unclear.
- Symbol, provider/custodian, and purpose note are optional context.
- Together continues to own household membership, visibility, and mutation policy. Investments stores and enforces the resulting holding visibility context without redefining that policy.

### Authoritative quantity and cost state

- `quantity` is an exact non-negative decimal, never floating-point storage. The implementation must select and consistently enforce a documented fixed precision that supports all V1 asset classes.
- `remaining_total_cost_basis` is the authoritative remaining acquisition cost in integer VND minor units.
- `average_cost` is derived only as `remaining_total_cost_basis / quantity` when quantity is positive and basis is known. It is never independently stored or edited.
- Unit prices may be displayed as derived context but must never be averaged directly.
- Basis state is either known or unknown. Unknown basis must never be treated as zero.
- Buy, sell, conversion, and fee quantities are exact. An operation is rejected if its quantity precision cannot be represented without silent rounding.

### Weighted-average cost basis

`WEIGHTED_AVERAGE` is the sole V1 cost-basis method.

Buy:

```text
new_quantity = old_quantity + bought_quantity
new_basis = old_basis + total_acquisition_cost
```

Partial sell or other partial source-asset consumption:

```text
consumed_basis = round(old_basis × consumed_quantity / old_quantity)
remaining_basis = old_basis - consumed_basis
```

- `round` means nearest integer VND minor unit, with an exact half rounded up. It is applied once to `consumed_basis`.
- A full sell or full source-asset consumption consumes all remaining basis; it never derives the final basis through proportional rounding.
- The calculation always uses the authoritative pre-operation quantity and remaining total basis.
- Average unit cost is derived after the operation. Unit prices are never averaged directly.
- If basis is unknown, any realized or unrealized result that requires basis remains unavailable. Quantity movement and auditable cash movement may still be recorded, but the operation must preserve `COST_BASIS_UNKNOWN`.

### Valuation and performance

- A valuation observation contains immutable valuation ID, holding ID, total estimated current value in VND, effective timestamp, source, manual/uncertain marker, creator, and recorded timestamp.
- Supported source vocabulary is provider, statement, receipt, market quote, manual, family update, or unknown. V1 records these manual declarations and does not retrieve them automatically.
- Current valuation is the latest non-superseded observation by effective timestamp, then recorded timestamp.
- Current market value is estimated, dated, and non-cash. It is never Account balance, spendable money, Goal progress, Jar capacity, or Planning capacity.
- Unrealized result is derived as current market value minus remaining total cost basis. It is available only when current valuation and remaining basis are both known.
- Realized sale result is owned by Investments as an exit calculation and historical fact. Cash proceeds remain owned by Transactions.
- Cash investment income is separate from realized sale gain/loss and does not change quantity or cost basis.

### History status

Every holding exposes one history status:

- `FULL`: ViNha has the complete cost-bearing activity needed for performance from the tracked beginning.
- `OPENING_POSITION`: the holding existed before ViNha tracking began and has a declared opening quantity and known remaining total cost basis.
- `COST_BASIS_UNKNOWN`: the holding existed before tracking or otherwise lacks reliable remaining basis; basis-dependent realized and unrealized performance is unavailable.

Detailed historical backfill is not required for V1. History status is preserved in receipts, activity, portfolio completeness indicators, and exports.

### State, archive, and correction

- Create Holding produces `Recognized` with zero quantity and zero basis; the first successful buy produces `Active` and `FULL` history.
- `OPENING_POSITION` creates `Active` when exact positive quantity is supplied, with the applicable opening history status.
- A positive remaining quantity after a sell produces `Partially Exited`; zero quantity produces `Exited`.
- A holding with positive quantity cannot be archived.
- Archive is allowed only from an existing terminal non-active state. It moves no cash, changes no quantity or performance fact, and deletes nothing.
- Hard delete is unsupported. Corrections append linked correction/reversal activity. Valuation corrections append a superseding observation. Completed operations remain auditable.

## Cross-cutting operation rules

All mutating actions require household authorization, an idempotency key, one business correlation ID, and an atomic commit across every affected holding activity and Transactions-owned cash record. Retry returns the original result and creates no duplicate cash, fee, quantity, basis, valuation, income, or history mutation.

Actual executed amounts are authoritative. Quotes and previews are never posting inputs after execution facts are known.

## Canonical action contracts

### Create holding

Input:

- Asset name.
- Supported asset class.
- Ownership/visibility context or explicit unclear.
- Optional symbol, provider/custodian, and purpose note.

Result:

- Create one `Recognized` holding with quantity `0`, remaining total cost basis `0`, `FULL` history status, and no current valuation.
- Append one creation activity.
- Create no Account movement or Ledger Transaction.
- Receipt states that the holding was created and real money was unchanged.

### Opening position (`OPENING_POSITION`)

Purpose: record an asset owned before ViNha tracking began without fabricating historical cash activity.

Required input:

- Asset name.
- Supported asset class.
- Exact positive quantity for the V1 quantity-based model.
- As-of date.
- Ownership/visibility context or explicit unclear.

Optional input:

- Symbol.
- Provider/custodian.
- Remaining total cost basis.
- Current valuation with effective date, source, and uncertainty marker.
- Notes.

Commit:

- Create one `Active` holding with the supplied exact quantity.
- If basis is supplied, set it as remaining total cost basis and set history status `OPENING_POSITION`.
- If basis is absent, preserve basis as unknown and set history status `COST_BASIS_UNKNOWN`.
- If current valuation is supplied, append one opening valuation observation. It remains estimated and non-cash.
- Append one opening-position activity with the as-of date.
- Create no Account movement and no Ledger Transaction.
- Never invent historical buys, sells, fees, income, or prices.

Receipt identifies the opening quantity, basis status, valuation status, as-of date, history status, and explicitly unchanged cash and Ledger transaction count.

### Buy (`BUY`)

Preconditions and input:

- Holding is `Recognized`, `Active`, or `Partially Exited` and has exact quantity state.
- Source is an eligible VND cash Account controlled by the actor.
- Exact positive bought quantity, exact executed purchase value excluding separately declared fees, and effective date are required.
- Optional quoted price/value and optional explicit fee are permitted.
- The source has sufficient available cash under existing Accounts rules.

Commit:

- Transactions records the actual cash debit exactly once under semantic classification `INVESTMENT_BUY`.
- Base acquisition cash plus any cash-paid acquisition fee equals the total source Account debit. A cash fee must not create a duplicate debit.
- Net destination quantity is the executed bought quantity minus any destination-asset fee quantity.
- `new_quantity = old_quantity + net_destination_quantity`.
- `total_acquisition_cost` is the executed purchase value plus cash-paid acquisition fees plus the explicit VND basis/value of directly attributable fees paid from another tracked investment asset. A destination-asset fee does not add a second cost; its economic effect is already captured by receiving fewer units for the acquisition cost.
- `new_basis = old_basis + total_acquisition_cost` when old basis is known. Unknown old basis remains unknown.
- A fee paid from another tracked investment asset reduces that fee holding and consumes its weighted-average basis atomically.
- Holding becomes or remains `Active`.
- Append one buy activity plus any fee activity, all linked by the same correlation ID and linked to the cash Transaction where cash moved.
- Derived slippage may update from quote versus execution; it has no independent financial posting.

Receipt shows actual cash delta, gross and net quantity, executed acquisition value, each explicit fee and payment source, acquisition basis added, quantity/basis before and after, derived average cost, optional slippage, links, and correlation ID.

Failure is atomic across cash, purchased holding, fee holding, and activity.

### Sell (`SELL`)

Preconditions and input:

- Holding is `Active`, `Under Review`, `Impaired`, or `Partially Exited` and the facts support sale.
- Destination is an eligible VND cash Account controlled by the actor.
- Exact positive sold quantity not exceeding current quantity, exact executed proceeds, and effective date are required.
- Optional quoted price/value and optional explicit fee are permitted.

Commit:

- Transactions records actual cash movement exactly once under semantic classification `INVESTMENT_SELL_PROCEEDS`; a separately cash-paid fee may share the operation correlation but must not duplicate the net Account effect.
- Actual destination cash increase equals the amount truly credited after cash-paid or cash-withheld fees.
- Source quantity consumed equals sold quantity plus any source-asset fee quantity.
- Consume source basis using weighted average. A full source consumption consumes all remaining basis.
- A destination-asset fee reduces destination quantity if sale proceeds are delivered as a tracked asset. A fee paid from another tracked investment asset reduces that fee holding and consumes its weighted-average basis atomically.
- Realized sale result equals actual net proceeds minus basis consumed for the sold/source-fee quantity minus explicit fee basis/value paid from another tracked investment asset. A separately reported cash fee must not be subtracted twice when net proceeds already include it.
- Remaining total basis equals prior basis minus source basis consumed.
- Positive remaining source quantity yields `Partially Exited`; zero yields `Exited` and known remaining basis must be zero.
- Append one sell activity plus any fee activity, preserving all prior trades and valuations under one correlation ID.
- Derived slippage may update from quote versus execution and posts nothing independently.

Receipt shows actual cash credit, sold and fee quantities, total source quantity consumed, consumed/remaining basis, explicit fees, realized sale result distinct from proceeds, remaining state, optional slippage, links, and correlation ID.

Failure is atomic. Transfer-out and write-off remain separate canonical actions and must not be represented as fake zero-proceeds sells.

### Asset conversion (`ASSET_CONVERSION`)

Examples include USDT to BTC, BTC to ETH, and Fund A to Fund B.

Required input:

- Distinct source and destination holdings.
- Exact positive source quantity.
- Exact positive destination quantity actually received before any destination-asset fee.
- Effective date.
- Actual execution information sufficient to identify both legs.
- One correlation ID and idempotency key.

Optional input:

- Quoted price/value.
- Executed VND reference value.
- Explicit fee paid through cash, source asset, destination asset, or another tracked investment asset.

Commit:

- No Account cash moves and no Ledger Transaction is created unless the operation includes an explicit real cash leg or cash-paid fee.
- Never fabricate intermediary VND cash transactions.
- Total source quantity consumed equals conversion source quantity plus any source-asset fee quantity.
- Consume source basis using weighted average. Full source consumption consumes all remaining source basis.
- Net destination quantity equals executed destination quantity minus any destination-asset fee quantity.
- Destination basis addition equals consumed source basis, plus a cash-paid directly attributable fee, plus the consumed VND basis/value of a directly attributable fee paid from another tracked investment asset. A destination-asset fee adds no duplicate basis; it reduces net received quantity. A source-asset fee is already included in consumed source basis.
- Increase destination quantity by net destination quantity and destination remaining total basis by the destination basis addition. Unknown source basis makes the destination basis unknown.
- A fee paid from another tracked investment asset reduces that holding and consumes weighted-average basis atomically.
- Conversion creates no ordinary income or expense and no realized sale gain/loss in V1.
- Preserve source leg, destination leg, fees, optional quote/execution facts, and links as one auditable operation under one correlation ID.
- Recompute derived unrealized results for affected holdings only from their valuation and resulting basis state.

Receipt shows both holding legs, gross/net quantities, basis rolled out and in, every fee and payment source, any real cash leg exactly once, optional slippage, resulting states, links, and correlation ID.

Failure is atomic across all affected holdings, cash legs, and activities.

### Explicit fee (`FEE`)

Every `BUY`, `SELL`, or `ASSET_CONVERSION` may contain one or more explicit fee components. Each component records:

- Exact fee amount or quantity.
- Fee asset/source: cash, operation source asset, operation destination asset, or another tracked investment asset.
- VND fee basis/value required for deterministic accounting when the fee is not cash.
- Linked operation type, operation ID, correlation ID, effective date, and affected holding IDs.

Rules:

- A fee is investment context, not slippage, salary, or ordinary household expense.
- A cash acquisition fee is included in acquisition cost basis.
- A destination-asset fee reduces net quantity received.
- A source-asset fee increases total source quantity consumed.
- A fee paid from another tracked investment asset reduces that holding and consumes basis using weighted average.
- A directly attributable conversion fee adds fee basis to the destination basis where the conversion contract specifies it.
- Cash movement is recorded only when cash actually moves, exactly once under semantic classification `INVESTMENT_FEE` or as an explicitly itemized component of the operation's single net cash movement. The same fee must never be represented both ways.
- Fee history is immutable and retained for portfolio fee reporting.
- Fee correction uses linked reversal/correction activity; it never silently edits the completed operation.
- No tax behavior may be inferred from fee records.

### Optional slippage

An executed `BUY`, `SELL`, or `ASSET_CONVERSION` may record:

- Quoted price or quoted total VND value.
- Executed price or executed total VND value.
- Quote timestamp when known.

Actual executed quantities and amounts are authoritative. Slippage is derived display only from the recorded quote and execution values. It:

- Creates no Account or Ledger movement.
- Creates no fee or ordinary expense.
- Does not independently alter quantity or cost basis.
- Does not alter realized result beyond the economic effect already contained in the actual executed amounts.
- Remains linked to the operation for audit and explanation.

### Investment income (`INVESTMENT_INCOME`)

This action supports cash dividends, coupons, and distributions.

Required input is identifiable holding, eligible destination VND cash Account, positive exact amount, effective date, and income kind.

Commit:

- Transactions records exactly one `INVESTMENT_INCOME` cash receipt.
- Destination cash increases exactly once.
- Append one linked income activity.
- Classification remains investment income and never defaults to salary.
- Holding quantities, cost bases, valuations, and realized sale results remain unchanged.
- Non-cash distributions are not silently treated as income or quantity; they require a supported conversion/corporate-action contract, which V1 does not invent.

Receipt identifies holding, income kind, destination delta, links, and correlation ID.

### Valuation (`VALUATION`)

Required input is eligible holding, non-negative total estimated current VND value, effective timestamp, source, and manual/uncertain marker.

Commit:

- Append one immutable valuation observation.
- Quantity, basis, state, Account balances, and Ledger transaction count remain unchanged.
- Create no Ledger Transaction.
- Recompute derived unrealized result only when valuation and basis are known.
- Correction appends a superseding observation and never rewrites a trade, conversion, income, or fee.

Receipt shows old/new estimated value, effective timestamp, source, uncertainty, derived unrealized result when available, and explicitly unchanged cash and Ledger count.

### Correction, refund, and audit

- Completed opening positions, buys, sells, conversions, fees, income, and valuations are immutable historical facts.
- Financial correction/refund uses the existing Transactions correction/reversal mechanism where cash moved and appends compensating holding activity where quantity or basis changes.
- All legs retain the original and correction correlation links.
- Silent edit, overwrite, deletion, duplicate movement, and valuation-based rewriting of trade history are forbidden.

## Transaction and activity classifications

| Classification | Owner | Meaning |
|---|---|---|
| `OPENING_POSITION` | Investments activity | Pre-existing position; no cash or Ledger transaction |
| `INVESTMENT_BUY` | Transactions plus linked Investments activity | Cash acquisition; not ordinary expense |
| `INVESTMENT_SELL_PROCEEDS` | Transactions plus linked Investments activity | Sale proceeds; not salary or ordinary income |
| `ASSET_CONVERSION` | Investments activity | Two holding legs; no fabricated cash and no V1 realized sale result |
| `INVESTMENT_INCOME` | Transactions plus linked Investments activity | Dividend, coupon, or distribution income distinct from salary |
| `INVESTMENT_FEE` | Transactions when cash moves plus linked Investments activity | Explicit investment fee; not ordinary household expense |
| `VALUATION` | Investments activity | Estimated non-cash value observation |
| Existing linked correction/reversal | Owning domain | Preserves original semantic meaning and audit chain |

These values must be defined at their documented domain constants homes before use. Investments uses existing public Accounts/Transactions application APIs and never posts Account balances independently.

## Deterministic financial effect matrix

| Action | Cash | Source Quantity | Destination Quantity | Cost Basis | Ledger Transaction | Realized Result | Unrealized Result |
|---|---|---|---|---|---|---|---|
| `OPENING_POSITION` | Unchanged | N/A | Created at declared exact quantity | Set to declared remaining basis or unknown | None | Unavailable unless later sale has known basis | Derived only when basis and valuation are known |
| `BUY` | Source Account decreases once by actual cash acquisition leg and any non-duplicated cash fee | Fee holding decreases only when fee uses a tracked investment asset | Purchased holding increases by executed quantity less destination-asset fee | Purchased basis adds total acquisition cost; fee holding consumes weighted-average basis | One logical `INVESTMENT_BUY` cash movement, with cash fee itemized or included once | Unchanged | Re-derived from latest valuation and new basis |
| `SELL` | Destination Account increases once by actual net cash proceeds; separate cash fee affects cash once only | Sold holding decreases by sold quantity plus source-asset fee; other fee holding may decrease | Increases only if proceeds/fee use a tracked destination asset | Sold/fee holdings consume weighted-average basis | One logical `INVESTMENT_SELL_PROCEEDS` movement plus non-duplicated cash-fee representation when applicable | Net proceeds less consumed source basis and other attributable fee basis | Re-derived for remaining holdings |
| `ASSET_CONVERSION` | Unchanged unless an explicit real cash leg or cash fee exists | Source decreases by conversion quantity plus source-asset fee; other fee holding may decrease | Destination increases by executed quantity less destination-asset fee | Source/fee basis consumed by weighted average and rolled into destination with directly attributable fee basis | None unless real cash moves; never an intermediary VND transaction | No conversion realized sale P/L in V1 | Re-derived for affected holdings |
| `INVESTMENT_INCOME` | Destination Account increases exactly once | Unchanged | Unchanged | Unchanged | One `INVESTMENT_INCOME` receipt | Sale result unchanged; income reported separately | Unchanged |
| `FEE` | Decreases once only when paid in cash | Source or other fee holding decreases when used | Destination net receipt decreases when fee is destination asset | Cash acquisition fee adds acquisition basis; investment-asset fee consumes weighted-average basis; conversion fee rolls into destination where specified | One `INVESTMENT_FEE` cash movement or one itemized operation component, never both | Changes sell result only under the sell formula; otherwise reported separately | Re-derived only because quantity/basis changed in the linked operation |
| `VALUATION` | Unchanged | Unchanged | Unchanged | Unchanged | None | Unchanged | Re-derived from new valuation only |

## Portfolio overview contract

Portfolio overview is derived display only and creates no Account movement, Ledger Transaction, holding mutation, Planning capacity, or Goal progress.

It supports:

- Total current investment value: sum of latest known current values for non-archived holdings.
- Total remaining cost basis: sum only holdings with known remaining basis.
- Unrealized gain/loss: sum only holdings with both known current value and known remaining basis.
- Realized sale gain/loss: sum immutable sell outcomes with known basis.
- Investment income: sum linked `INVESTMENT_INCOME` cash receipts.
- Investment fees: sum explicit fee VND values once, regardless of payment asset.
- Allocation by asset class: each class's known current value divided by total known current investment value.

Unknown basis or valuation is never treated as zero. Every aggregate must expose coverage/completeness, including excluded holding count or value status. Allocation excludes holdings without known current value and discloses that exclusion.

## Main acceptance cases

### Weighted-average buy

Given cash `C`, quantity `Q`, known basis `B`, bought net quantity `q`, and total acquisition cost `A`:

- Cash changes by the actual cash leg once.
- Quantity becomes `Q + q`.
- Basis becomes `B + A`.
- Derived average cost becomes `(B + A) / (Q + q)`.
- One correlated operation and its fee components exist; retry creates no second movement.

### Weighted-average partial sell

Given cash `C`, pre-sale quantity `Q`, known basis `B`, total source quantity consumed `q`, and actual net proceeds `P`:

- `consumed_basis = round(B × q / Q)`.
- Cash becomes `C + P`, adjusted only by any separately paid cash fee once.
- Quantity becomes `Q - q`.
- Remaining basis becomes `B - consumed_basis`.
- Realized sale result follows the Sell contract and remains distinct from proceeds.
- Linked sell and fee activity share one correlation ID; retry creates no duplicate movement.

### Full sell

- Consume all remaining source quantity and all remaining basis.
- Resulting quantity and known basis are both zero.
- Holding becomes `Exited`.
- Never leave a rounding residual in basis.

### Asset conversion

- Cash and Ledger count remain unchanged unless a documented actual cash leg exists.
- Source quantity/basis decrease once under weighted average.
- Destination net quantity and rolled basis increase once.
- Realized sale result remains unchanged.
- Both legs and every fee remain one auditable correlated operation.

### Valuation

- Cash, Ledger count, quantities, and bases remain unchanged.
- Append one valuation observation.
- Only current valuation and derived unrealized display change.

### Opening position

- Create the declared quantity and basis status as of the declared date.
- Cash and Ledger count remain unchanged.
- No historical transaction is fabricated.

## Implementation boundary

Expected Investments paths:

- `app/[locale]/(product)/money/investments/page.tsx`
- `app/[locale]/(product)/money/investments/new/page.tsx`
- `app/[locale]/(product)/money/investments/[id]/page.tsx`
- Route-local opening-position, buy, sell, conversion, income, fee, and valuation actions/forms.
- `modules/investments/application/investments-constants.ts`
- `modules/investments/application/investments-types.ts`
- `modules/investments/application/commands/*`
- `modules/investments/application/queries/*`
- `modules/investments/application/index.ts`
- `modules/tenancy/application/app-path.ts`
- EN and VI Investments message namespaces.
- Reviewed Investments persistence/RPC migration files.

Direct integration boundary:

- Use existing public Accounts/Transactions application APIs for real cash movement.
- Add semantic transaction/activity classifications at their documented constants homes before use.
- Add only minimum typed correlation/link support for operations, Transactions, holdings, activities, fees, valuations, and idempotency.
- Do not redesign generic Accounts, Transactions, or Money UI.

Expected tests:

- Holding, state, history-status, provider/custodian, query, and portfolio-aggregate unit tests.
- Weighted-average buy, partial sell, full sell, rounding, unknown-basis, exact delta, classification, linking, atomicity, and retry tests.
- Cash/source/destination/other-asset fee tests proving quantity, basis, cash, reporting, and no-duplicate behavior.
- Conversion two-leg, basis roll, fee, no-realized-result, no-fabricated-cash, atomicity, and retry tests.
- Opening-position no-cash/no-ledger and known/unknown-basis tests.
- Slippage derived-only tests.
- Valuation no-cash/no-ledger and immutable-history tests.
- Investment-income classification/linking tests.
- Authenticated overview/detail, create/opening, buy, sell, conversion, income, fee, and valuation browser tests at required locales, themes, and mobile widths.

Must remain untouched except for a direct typed dependency required above:

- Savings, Cards, Loans, Debts, Planning, Goals, Jars, Inbox, Health, Together policy, generic Money redesign, app shell, and retired legacy code.
- Existing financial history and prior migrations.
- Provider integration, automation, advice, tax accounting, corporate actions, and non-V1 ownership/value models.
