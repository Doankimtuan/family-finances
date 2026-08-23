# Investments — Discovery & UI-Surface Inventory (pre-redesign)

Date: 2026-08-23 · Scope: discovery only, no code changed.
Sources: full read of `app/[locale]/(product)/money/investments/**`, `modules/investments/**`,
`.agents/design-system.md`, prior reports (12A/12B/12C/UI01/UI02/UI03/final gate), i18n catalogs,
plus an authenticated English-mode browser walkthrough at 440px (list, detail, More actions,
create steps 1–2, instrument picker, Buy sheet, Sell sheet, Convert page) against the running dev server.

---

## 1. Surface inventory

Routes (all locale-prefixed; constants in `modules/shared-kernel/app-path.ts:151-169`):

| #   | Surface                     | Route / trigger                                                          | Type               | Purpose & key content                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | --------------------------- | ------------------------------------------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Money hub Investments row   | `/money` → "Growing money" card                                          | inline row (entry) | `MoneyModuleRow`: label, holdings head-count (`countActiveInvestmentHoldings`), `empty`/`unavailable` row states. No attention pill.                                                                                                                                                                                                                                                                  |
| 2   | Investments list            | `/money/investments`                                                     | page               | `TopAppBar` + offline banner; states: read error → `InvestmentReadError`, empty → `EmptyState`, else `InvestmentOverviewClient`. Footer "Back to Money".                                                                                                                                                                                                                                              |
| 3   | Portfolio summary           | list top                                                                 | inline card        | Estimated market value (or "No price yet" when no valued holding), remaining cost basis, estimated PnL + %, realized, received income; incomplete-basis warning alert.                                                                                                                                                                                                                                |
| 4   | Coverage alerts             | list                                                                     | inline             | Valuation coverage ("includes N of M… excluded, not zero") + PnL coverage warnings.                                                                                                                                                                                                                                                                                                                   |
| 5   | Allocation by asset class   | list                                                                     | chart              | Recharts donut + legend with % and VND, chart tokens, aria-label.                                                                                                                                                                                                                                                                                                                                     |
| 6   | Holdings scan               | list                                                                     | inline             | Search input + asset-class filter chips (All/Stocks/Funds/Crypto/Gold/Bonds); sorted by current value desc; "no results" text state.                                                                                                                                                                                                                                                                  |
| 7   | Position card               | list rows                                                                | inline card (Link) | Icon, name, instrument context, provider, ownership badge, quantity (units / fund units), current value or "No price yet", PnL or "Insufficient data", basis or Unavailable, COST_BASIS_UNKNOWN tag, `InvestmentValuationMeta`.                                                                                                                                                                       |
| 8   | Closed section              | list bottom                                                              | inline list        | "Closed · N" heading, quiet rows linking to detail.                                                                                                                                                                                                                                                                                                                                                   |
| 9   | List footer actions         | list bottom                                                              | links              | "Import position" → `/new`, "Convert assets" → `/convert`.                                                                                                                                                                                                                                                                                                                                            |
| 10  | List loading                | `loading.tsx`                                                            | skeleton           | Mirrors summary + holdings composition.                                                                                                                                                                                                                                                                                                                                                               |
| 11  | List read error             | `investment-read-error.tsx`                                              | inline             | Danger `StatusAlert` + Retry (`router.refresh`).                                                                                                                                                                                                                                                                                                                                                      |
| 12  | Holding detail              | `/money/investments/[id]`                                                | page               | Hero (ownership badge, current value / closed-unavailable, PnL or missing-basis line), receipt banner (`?receipt=`), missing-basis warning, action row, closed info alert, Performance grid (quantity, reference price/NAV meta, remaining basis, unrealized, realized, received income), Instrument & valuation section (+ gold note), Activity history, back link. Not-found and read-error states. |
| 13  | Detail action row           | detail                                                                   | inline             | Buy (always when `canMutate`), Sell + More actions (hidden when closed).                                                                                                                                                                                                                                                                                                                              |
| 14  | More actions dropdown       | detail                                                                   | dropdown (HeroUI)  | Income (always) + Update value (only when `canUpdateManualValue` = canMutate ∧ not closed ∧ not auto-priced).                                                                                                                                                                                                                                                                                         |
| 15  | Detail loading              | `[id]/loading.tsx`                                                       | skeleton           | Hero + metrics + activity bones.                                                                                                                                                                                                                                                                                                                                                                      |
| 16  | Create wizard               | `/money/investments/new`                                                 | page (3 steps)     | `FinancialScopeField`, custom step dots "N / 3", `MotionStep`; Step 1 asset-class grid (Stocks/Funds/Crypto/Gold/Bonds); Step 2 entry-mode tiles (Historical vs Purchase) + fields; Step 3 review. `BottomActionBar` (back/continue/review/confirm).                                                                                                                                                  |
| 17  | Step-2 historical fields    | create                                                                   | inline             | Holding name, instrument picker trigger, symbol (non-gold/bond, unlinked only), provider, quantity, gold unit select, basis per-unit ⇄ total toggle, current valuation, live basis/valuation/PnL preview, as-of date, notes.                                                                                                                                                                          |
| 18  | Step-2 purchase fields      | create                                                                   | inline             | Execution price (unit price, or total value for bond/TOTAL_VALUE) + source account (`SelectField`, savings products excluded) + date/notes.                                                                                                                                                                                                                                                           |
| 19  | Instrument picker           | create step 2                                                            | bottom sheet       | `FieldSelect`-trigger + `Sheet`: debounced search, listbox (symbol/name/exchange), loading/load-error/empty states, "Track manually" fallback (footer + empty state).                                                                                                                                                                                                                                 |
| 20  | Operation pages             | `/[id]/buy`, `/[id]/sell`, `/[id]/income`, `/[id]/valuation`, `/convert` | page → sheet       | Thin wrappers → `InvestmentOperationPage`: loads portfolio + accounts + holding; guards: no holding → EmptyState; VALUATION on auto-priced → info "automatic pricing active"; `!canMutate` → partner read-only info. Else `InvestmentOperationSheet` (bottom sheet, dismiss = back) around the form. Ownership badge above.                                                                           |
| 21  | Operation form — BUY        | sheet                                                                    | form               | Market-price context note (+`InvestmentValuationMeta` when auto-priced), quantity `DecimalField`, purchase price per unit (asset-suffixed label; fund → NAV label), live preview (invested principal, fee, cash leaving) with insufficient-balance block, quoted value (optional), source account, effective date, notes, fee section, Review → `ConfirmSummary` → Confirm.                           |
| 22  | Operation form — SELL       | sheet                                                                    | form               | Same shell; "Sell all" MAX button (fills `normalizeAvailableQuantity`), sale price per unit, live preview (gross, fees/tax, net, realized PnL), destination account ("Where to receive money?"), no quote field.                                                                                                                                                                                      |
| 23  | Operation form — INCOME     | sheet                                                                    | form               | Amount + destination cash account (+ date/notes); fund holdings default `distribution`, others `dividend` (implicit, not user-chosen).                                                                                                                                                                                                                                                                |
| 24  | Operation form — VALUATION  | sheet                                                                    | form               | Holding context (qty), valuation price per unit (or total value for TOTAL_VALUE), derived current value preview, valuation date, notes. No account.                                                                                                                                                                                                                                                   |
| 25  | Operation form — CONVERSION | sheet                                                                    | form               | Source holding, destination holding (mutually exclusive selects), source quantity, destination quantity ("Exact quantity received"), optional executed/quoted value, date. No cash account ("no cash movement" in confirm).                                                                                                                                                                           |
| 26  | Fee section                 | buy/sell/conversion forms                                                | inline             | Native checkbox; fee source select (mode-filtered), crypto fee-asset text, cash amount vs asset quantity, other-investment holding select, fee value (VND, reporting).                                                                                                                                                                                                                                |
| 27  | Review / confirm            | all operations                                                           | inline + footer    | `ConfirmSummary` rows incl. cash-effect line ("one ledger movement" / "none"); footer Confirm (asset-class action label, pending label swap) + Edit (regenerates idempotency key).                                                                                                                                                                                                                    |
| 28  | Success                     | post-mutation                                                            | redirect           | `router.replace` → detail `?receipt=<correlationId>` → success `StatusAlert`.                                                                                                                                                                                                                                                                                                                         |
| 29  | Offline handling            | all screens                                                              | inline             | `MoneyOfflineBanner`; create submit disabled offline.                                                                                                                                                                                                                                                                                                                                                 |
| 30  | Goal funding deep link      | Plan goal detail                                                         | entry              | HOLDING-funded goals push to `moneyInvestmentBuyPath/SellPath`.                                                                                                                                                                                                                                                                                                                                       |

Not present (verified): no Edit Investment surface, no archive/close/delete surface (exit = full sell only),
no price-history chart (valuation updates appear as activity rows only), no investments entry from Home/Inbox,
no per-holding notes display, no partial-sale UI distinct from sell (quantity field covers it).

## 2. Flow map

```
Money hub (Growing money → Investments row)
└─ Investments list ──────────────── Import position → Create wizard (type → details → review) → detail (receipt)
│   │                                Convert assets → Convert sheet (source → destination → qty) → detail
│   ├─ position card ──► Holding detail
│   └─ closed row ─────► Holding detail (closed: history + realized only)
│
└─ Holding detail
    ├─ Buy more ────► Buy sheet (qty → price/unit → source account → fees → review → confirm) → detail?receipt
    ├─ Sell ────────► Sell sheet (qty [Sell all] → price/unit → destination account → fees → review) → detail?receipt
    ├─ More ▸ Dividend/Income ─► Income sheet (amount → account) → detail?receipt
    └─ More ▸ Update value ────► Valuation sheet (price/unit or total → date) → detail?receipt   [manual/unlinked only]
Plan goal (HOLDING funding) ──► Buy/Sell sheet directly
```

## 3. Financial semantics (do not regress)

- **Price is per unit, not total** — buy/sell take `unitPriceVnd` (nonnegative integer VND) and total is derived
  as `quantity × unitPrice` with half-up BigInt rounding (`investment-operation-view-model.ts:48-63`).
  Exceptions that use **total value** instead: `BOND` asset class and instruments whose pricing mode is
  `TOTAL_VALUE` (`investment-commands.schema.ts:100-118`; `resolveInvestmentPricingContract`, `investment-ux.ts:148-172`).
  Valuation update likewise takes `unitPriceVnd` or `totalValueVnd`.
- **Quantity**: decimal string ≤ 18 dp, fixed-point BigInt; must be > 0 (`decimal-quantity.ts`, `quantitySchema`).
  MAX/full sell fills exact available quantity; full disposal = remaining 0 (`isFullDisposal`).
- **Cost basis**: acquisitions add to `remainingCostBasis` (incl. fees/tax); average cost = basis/quantity.
  Disposal consumes basis by **weighted average**, or **FIFO lots** for fund holdings (`disposeCostBasis`,
  `consumeWeightedAverageBasis`, lots ordered by `acquiredAt`).
- **Realized P/L** = gross proceeds − disposed basis − fee − tax (`deriveRealizedPnl`).
  **Unrealized** = currentValue − remaining basis; % = pnl / basis. Nulls propagate as "Unknown / No price yet".
- **Buy preview**: investedPrincipal = qty × price (or manual total); cash leaving = principal + cash fee;
  insufficient source balance blocks submit. **Sell preview**: gross → net = gross − fee; realized PnL row.
- **Historical import** (create, HISTORICAL mode): optional basis per-unit ⇄ total, optional valuation (per-unit or
  total by pricing contract); PnL = valuation − basis; no cash movement, no transactions.
- **Initial purchase** (create, PURCHASE mode): real cash leg from selected account; bond = total value only.
- **Income** → lands in cash account; kinds dividend/interest/distribution/other.
- **Conversion**: source qty out + destination qty in; no cash account; optional executed/quoted value (slippage).
- **Market valuation**: auto path = provider price × FX→VND (`currentValue = round(qty × price × fx)`; TOTAL_VALUE
  instruments use price as total and null unit price). Quality: AUTO_CURRENT / AUTO_STALE (crypto >24h, stock/fund
  > 1 publication weekday, FX >24h; gold/bond never auto-stale) / MANUAL (latest manual valuation) / UNKNOWN (no
  > price at all). Any auto failure falls back to manual/unknown. Valuation updates never post cash.
- **Portfolio aggregation** (list): partial-sum semantics — totals include only holdings with known values;
  `valuationCoverage`/`basisCoverage`/`pnlCoverage` surfaced as warnings; allocation via largest-remainder basis
  points; hub row shows only a head-count (cheap read, no valuation semantics).
- **Money is VND integer** everywhere (`INVESTMENT_REPORTING_CURRENCY`); source quote currency shown only beside
  unit price/NAV.
- **Idempotency**: key minted at review, kept across Confirm↔Edit, cleared after success; receipts expose
  correlation id + before/after quantities/basis/cashDelta/realizedResult.
- **Ownership**: `FinancialCapabilities` per holding; personal holdings of former members are read-only
  (`ownerStatus: former`, `canMutate: false`); server-side assertions in RPCs; creation resolves scope
  (household default; personal stamps owner membership).

## 4. Conditional states (actual branches)

- Lifecycle: active vs closed (`lifecycleStatus === exited || quantity ≤ 0`); closed detail = info alert +
  "closed value unavailable" hero + Buy still offered, Sell/More hidden; closed list rows quiet.
- Valuation quality: automatic-current / automatic-stale (warning badge + danger-toned date) / manual (info badge +
  manual date) / unknown (neutral "No price yet", no PnL). NAV instruments show "NAV on date".
- Basis: known / missing (`COST_BASIS_UNKNOWN` history status → card tag + detail warning) / unavailable.
- PnL: positive (success tone + "+"), negative (danger + "−"), zero, or insufficient-data; percent next to amount.
- Asset-class branches: fund (fund-unit labels, NAV price labels, FIFO, income defaults to distribution, symbol
  label "Fund code"), crypto (8-dp quantities, source-account label "counter asset", fee-asset field), gold
  (unit select chi/lượng…, buy-back valuation label, gold note, never auto-stale), bond (total-value pricing,
  no unit price, no symbol field), stock (default).
- Pricing contract: unit price vs total value (bond / TOTAL_VALUE instruments) across create/buy/sell/valuation.
- Ownership: owned (full actions) vs partner read-only (info guard, no form) vs former-member (badge + read-only);
  auto-priced holdings hide manual valuation entry (both detail More menu and /valuation guard page).
- Balance: insufficient buy balance → inline danger + disabled review.
- Errors: typed codes (`insufficient_quantity`, `forbidden`, `invalid`, …) rendered as danger StatusAlert;
  offline disables create submit; list/detail/activity each have distinct read-error vs empty states.
- Empty: no holdings (list EmptyState), filter/search no-results, picker empty → manual fallback, no closed
  section, no accounts (source-account select disabled).

## 5. Entry points

1. Money hub "Growing money" → Investments row (holdings count).
2. List → position card / closed row → detail.
3. List footer → Import position (`/new`), Convert assets (`/convert`).
4. Detail → Buy / Sell / More (Income, Update value).
5. Create step 2 → instrument picker sheet.
6. Plan goal detail (HOLDING funding) → buy/sell routes directly.
7. Post-mutation redirects (detail `?receipt=`).
8. Revalidation consumers (`app/mutation-revalidation.ts`) — non-UI.

## 6. Shared dependencies to handle carefully

`shared/patterns`: Page, TopAppBar, Section, Amount, FinancialValue (privacy masking — keep everywhere),
FinancialOwnershipBadge, FinancialScopeField, EmptyState, Sheet + ActionSheetLayout, BottomActionBar,
ControlledField, DecimalField, ConfirmSummary, LabeledSelect (native), SelectField, FieldSelect, DatePickerField.
`shared/ui`: Button, Input, Textarea, Text, StatusAlert, StatusBadge, Skeleton, AppIcon/ACTION_ICONS.
Support: `shared/i18n/formatters` (formatCurrency/Number/Percent/Date), `shared/theme/chart-colors`,
`shared/motion` (MotionStep), `useOnlineStatus`. Domain: `investment-ux.ts` label registry +
`resolveInvestmentPricingContract` (all per-class copy flows from here), `investment-operation-view-model`
(previews), `historical-import-view-model`, `market-valuation` freshness, `modules/ledger` accounts +
DEFAULT_CURRENCY, tenancy app-path constants. i18n namespaces: `money.investments.{overview,ux,opening,detail,valuation,operation}`

- `money.hub.modules.investmentsCount` (EN/VI parity).

## 7. Legacy / inconsistent UI (flag only, do not fix now)

- **Raw action styling**: detail Buy/Sell and list footer links are hand-styled `<Link>`s (`rounded-md bg-accent…`)
  instead of `Button`; position-card icon is a hand-rolled circle instead of `IconContainer`.
- **Custom cards**: summary hero and detail hero use bespoke `rounded-(--radius-card) bg-surface-elevated` blocks
  instead of shared `Card` tones (design-system §3); detail hero value is inline `text-3xl`, not `Balance size="hero"`.
- **Native controls as primary UX**: `LabeledSelect`/`SelectField`/`FieldSelect` are native selects (constitution
  prefers HeroUI); fee "Record an explicit fee" is a raw native checkbox; notes uses `Textarea` with a manually
  duplicated label (labels should be owned by field components).
- **Custom step indicator**: create wizard uses bespoke dots, while onboarding's canonical pattern is shared thin
  `Progress` + "Step N of 2" (§23).
- **Copy oddity**: Bonds type tile description reads "Track manual assets or other products" (mismatched with bond
  semantics; manual-asset copy).
- **Duplicate per-file `money()` helpers** and per-file decimal-digit constants repeated across files.
- **Duplicate server-action file**: `investment-creation-actions.ts` re-exports two actions already in
  `investment-actions.ts`.
- **Convert sheet accessible-name quirk**: destination combobox button accessible name repeats "Source holding".
- **Dead code**: `investment-accounting.ts` facades (`applyInvestmentBuy/Consumption`) unused; `portfolio-view-model.ts`
  unused (and disagrees with live query on `basisCoverage` denominator); domain v2 archetypes/lifecycle previews
  (`investment-domain.ts`, `investment-lifecycle.ts`) unwired except `GoldUnit`; state-machine doc describes 10
  lifecycle states vs 3 persisted; no BOND archetype in domain layer.
- **List page** custom search input + filter chips (not shared controls); allocation chart legend colors are a local
  `CHART_COLORS` array of token names (acceptable, but should use `getChartPalette`).

## 8. Potentially unreachable / stale UI

- No unreachable routes found — every route (`list/new/convert/[id]/buy/sell/income/valuation`) has a live entry
  point; verified in browser.
- `/convert` is the weakest surface: reachable only from list footer, defaults to first holding, crypto-oriented
  copy, executed-value field, no balance/valuation context — functionally live but visually orphaned.
- Manual valuation route is intentionally double-guarded (hidden menu entry + guard page) for auto-priced
  holdings — reachable by URL only in that case.
- `InvestmentMoreActions` income entry uses fixed crypto/stock wording ("Dividend") regardless of asset class
  (label key is per-class in `ux.income` but detail passes `ux.incomeLabelKey`; verify fund wording).

## 9. Redesign checklist (must cover)

- [ ] Money hub Investments row (count / empty / unavailable states)
- [ ] List: summary (value, basis, PnL, realized, income), coverage + incomplete-basis alerts, allocation chart, search + filters, position cards (all quality/basis/PnL branches), closed section, footer actions, loading skeleton, read error, empty state, offline banner
- [ ] Detail: hero (value/closed/PnL/missing basis), receipt banner, action row (permutation of canMutate × closed), More dropdown (income; valuation conditional), performance grid, instrument & valuation section (incl. gold note, NAV), activity history (friendly labels, realized, slippage), not-found, read error, loading skeleton
- [ ] Create wizard: scope, 3 steps, 5 asset-class tiles (fix bond copy), entry-mode tiles, all step-2 field branches (historical vs purchase; gold unit; bond total-value; instrument-linked vs manual), live previews, review step, BottomActionBar, offline gating
- [ ] Instrument picker sheet: trigger, search, results, loading/error/empty, manual fallback
- [ ] Operation sheets: BUY, SELL (Sell-all MAX), INCOME, VALUATION, CONVERT — fields, live previews, fee section (4 sources × crypto fee asset), review/confirm summary, pending/error states, guards (no holding, auto-priced valuation, read-only, insufficient balance)
- [ ] Success receipt banner on detail
- [ ] Ownership/read-only/former-member treatments across list/detail/operations
- [ ] EN + VI copy via the `investment-ux` registry; no price-per-unit semantic changes anywhere
