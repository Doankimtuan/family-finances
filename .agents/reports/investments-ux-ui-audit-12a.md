# Investments 12A — UX/UI + Financial Semantics Audit

Date: 2026-08-21  
Scope: investment overview/list, holding detail, buy, sell, valuation/price update, income, fees, opening/import flow, account routing, transaction/Home integration, privacy, state handling, and responsive/accessibility behavior.  
Mode: audit only. No production code was modified.

## Executive outcome

The investment read path has a usable foundation: holdings, remaining cost basis, current value, estimated P&L, realized P&L, and investment income are modeled separately; sell previews calculate gross proceeds, net proceeds, remaining quantity, and realized P&L; valuation records do not create a cash transaction; and closed holdings are preserved rather than deleted.

The feature is not ready for 12B without integrity work. The highest-risk gaps are cash-fee classification, retry-key regeneration, server-side ownership enforcement, an inconsistent per-unit price contract, and fund/CCQ cost-basis accounting. These can change cashflow, privacy, or realized P&L.

Finding counts: 5 P0 integrity, 10 P1 UX/state, 6 P2 polish.

## Audit evidence

### Repository and domain review

- Canonical IA/design/UX artifacts, investment application/domain code, ledger semantics, queries/view models, migrations/RPCs, translations, and investment unit/E2E tests were reviewed.
- Authenticated fixture credentials from `.env.local` were used through the existing authenticated browser session. No form was submitted and no fixture mutation was performed.
- Relevant runtime evidence includes:
  - `app/[locale]/(product)/money/investments/investment-operation-form.tsx:334-393`
  - `modules/investments/application/commands/investment-commands.schema.ts:97-119`
  - `supabase/migrations/20260810022409_lean_investments_v1.sql:227-305,350-380`
  - `modules/ledger/application/financial-semantics.ts`

### Browser matrix

Inspected authenticated routes in EN and VI:

- `/en/money/investments`
- `/vi/money/investments`
- an active holding detail
- buy, sell, valuation, and income forms
- `/vi/money/investments/new`, including the Fund/CCQ path in both historical and live-purchase modes
- Together settings for dark-theme verification

Viewport checks on the investment overview:

| Viewport | Theme | Result                                                                                                                                 |
| -------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 390      | light | No horizontal overflow; layout fits. Large unused allocation-chart height; closed row is not actionable.                               |
| 440      | dark  | No horizontal overflow; shell is preserved. Overview values and controls remain readable. Hardcoded chart colors are not token-backed. |
| 768      | light | No horizontal overflow; centered mobile shell remains intact.                                                                          |
| 1280     | light | No horizontal overflow; centered mobile shell remains intact.                                                                          |

The authenticated fixture showed active and closed holdings, current value, remaining basis, estimated P&L, realized P&L, and received income. The detail route showed current value, estimated/unrealized P&L, remaining basis, realized P&L, quantity, a derived current reference price, and activity history.

## Financial-rule verification

| Rule                                                             | Result                      | Evidence / concern                                                                                                                                                                                                          |
| ---------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Buy principal is not an Expense                                  | PASS for principal          | Buy uses `investment_buy`; ledger semantics exclude it from ordinary expense. Cash-fee treatment is a separate P0 failure below.                                                                                            |
| Sell proceeds are not Income                                     | PASS for proceeds           | Sell uses `investment_sell_proceeds`; ledger semantics exclude it from ordinary income.                                                                                                                                     |
| Investment income/dividend is Income                             | PASS                        | Income RPC creates `investment_income`; Home/ledger semantics classify it as income. The UI only selects dividend for non-funds and distribution for funds.                                                                 |
| Investment fee is Expense                                        | FAIL for buy/sell cash fees | Buy/sell add the cash fee to the neutral buy/sell cash transaction and only attach an `investment_fees` row. Conversion creates a separate `investment_fee` transaction, so behavior is inconsistent.                       |
| Market-price update creates no cash transaction                  | PASS                        | Valuation RPC inserts only `investment_valuations` and returns `cashDelta: 0`; the browser confirmation has no cash account.                                                                                                |
| Holding value = quantity × unit price                            | PARTIAL                     | Sell and valuation previews calculate quantity × unit price. The legacy storage/RPC contract accepts total VND values and does not persist the entered unit price. Bond is explicitly allowed to use total-value semantics. |
| Cost basis remains separate from market value                    | PASS                        | Portfolio/query/view-model fields keep `remainingTotalCostBasis` and `currentValue` separate; the browser overview displays both.                                                                                           |
| Partial/full sell updates quantity and realized result correctly | PARTIAL                     | Quantity and proportional-basis math are implemented, and `MAX`/“All” maps to available quantity. Fund/CCQ accounting method is not explicit or wired consistently, and cash fees distort expense/P&L semantics.            |
| Mutations are retry-safe/idempotent                              | FAIL at UI boundary         | Database uniqueness and replay receipts exist, but the form creates a new UUID on every submit, including a user retry after an unknown network result. The same logical action can therefore get a new idempotency key.    |
| No unsafe hard delete of financial history                       | PASS                        | No product delete action was found. Financial foreign keys use restrictive deletes for operations/fees/valuations; closed holdings preserve history.                                                                        |

## Findings — P0 integrity

### P0-01 — Buy/sell cash fees are not separate investment expenses

**Impact:** Investment fees paid in cash disappear from ordinary expense semantics. Home cashflow and transaction classification treat the entire buy/sell cash movement as neutral, even though the fee portion must be an Expense.

**Evidence:**

- Buy creates one `investment_buy` transaction for `executed_value + cash_fee` at `supabase/migrations/20260810022409_lean_investments_v1.sql:255-262`.
- Sell creates one `investment_sell_proceeds` transaction for net proceeds after cash fee at `:289-297`.
- The fee row points back to that neutral transaction; unlike conversion, no separate `investment_fee` transaction is created for buy/sell.

**Required correction:** Split principal/proceeds and cash-fee ledger legs, or introduce an equivalent ledger projection that classifies the fee as Expense while retaining the investment operation linkage. Recheck Home, transactions, account balances, and realized P&L together.

### P0-02 — Retry can duplicate a financial mutation

**Impact:** A network timeout after the server commits can leave the user unsure whether to retry. The form generates a fresh idempotency key on every submit at `investment-operation-form.tsx:331-335`, so a second confirmation is not a replay of the first request.

**Required correction:** Create one idempotency key per logical form action and retain it through confirmation, pending, error, and retry. Disable duplicate submission while pending and show the correlation/receipt on recovery.

### P0-03 — Investment mutation RPCs do not enforce personal ownership

**Impact:** The UI correctly renders a read-only state for a personal holding not owned by the current member, but the server boundary is weaker. The buy, sell, income, and valuation RPCs check household membership and holding/account IDs, not `financial_scope`/`owner_membership_id` mutation rights. A crafted authenticated RPC call can therefore bypass the client restriction.

**Evidence:**

- UI gate: `investment-operation-page.tsx:65-83` and detail actions use `holding.ownership.canMutate`.
- The ownership helper exists in `supabase/migrations/20260818032212_ownership_aware_rls.sql:59-84`.
- The investment RPCs in `20260810022409_lean_investments_v1.sql:227-240,271-280,350-358,367-378` only resolve the active household and validate household-owned holding/account IDs; no ownership helper invocation was found.

**Required correction:** Enforce the same ownership policy inside every investment mutation RPC, including source and destination holdings, cash accounts, fees, and conversion paths. Add a negative authenticated test for a partner attempting to mutate a personal holding.

### P0-04 — Per-unit price is not the persisted buy/valuation contract

**Impact:** The explicit requirement is “prices are PER UNIT, never total holding value.” The buy UI asks for `Actual executed value (VND)` rather than unit price; the schema and RPC accept only `executedValueVnd`; the valuation UI accepts a per-unit price but submits/stores a derived total `valueVnd`. The legacy operation/event projection stores total amount and has no `unit_price` field populated.

**Evidence:**

- Browser buy form: `Quantity` + `Actual executed value (VND)`.
- Browser sell form: `Sale price / BTC`, quantity, and `Sell all 90 BTC: All`.
- Browser valuation form: `Current price / BTC` and `New value`.
- Form branching: `investment-operation-form.tsx:606-632`; valuation submit at `:385-393`.
- Input schemas: `investment-commands.schema.ts:97-119`.
- Legacy RPC signatures and storage: `20260810022409_lean_investments_v1.sql:227-229,271-273,367-378`.
- Projection writes `executed_quantity` and `gross_amount` but no unit price: `20260815193000_investment_event_projection.sql:50-70`.

**Required correction:** Make unit price a first-class input/output for buy, sell, and valuation where the asset uses units; derive total from quantity × unit price; persist both total and unit price/source/date as needed. Preserve an explicit total-value exception only for asset classes whose canonical semantics require it.

### P0-05 — Fund/CCQ realized-basis policy is not consistent with the runtime path

**Impact:** Multiple fund-certificate purchases can produce a different realized result depending on whether FIFO or weighted average is intended. The current v1 aggregate holding consumes basis proportionally for every partial sell. The newer domain strategy makes FIFO the default for funds and includes lot-aware tests, but the current route/RPC does not persist/use fund lots or an accounting-method choice.

**Evidence:**

- Runtime partial consumption is proportional: `20260810022409_lean_investments_v1.sql:148-164`.
- Domain strategy defaults funds to FIFO and permits weighted average: `modules/investments/domain/investment-domain.ts:431-445`.
- Domain tests explicitly verify FIFO fund disposal: `tests/unit/investment-domain-foundation.test.ts:44-82`.
- Browser VI flow uses `Số CCQ` and `NAV / CCQ`, so the UX expectation is unit-based even though the legacy operation contract remains total-based.

**Required correction:** Decide and document the accounting method for CCQ/funds, persist the required lots or a declared weighted-average policy, then make RPC, projections, previews, and realized-P&L tests use the same method. Do not ship a silent method switch.

## Findings — P1 UX/state

### P1-01 — Valuation freshness and “not cash” meaning are under-explained

The overview and detail show “Current value” and “Estimated PnL,” but do not show valuation date, source, stale status, or a clear “estimated value, not cash” explanation. The detail only warns for unknown cost basis at `investment/[id]/page.tsx:161-167`. A user can read a stale provider/manual valuation as current spendable money.

### P1-02 — Closed holdings are a dead end from the overview

The closed section says history and realized P&L are preserved in detail, but renders a static `<li>` with no detail link at `investment-overview-client.tsx:391-420`. Closed history is therefore not reachable from the place that advertises it.

### P1-03 — Loading, error, and offline states are not distinct enough

- Overview failure renders a danger alert without retry at `investments/page.tsx:35-42`.
- Operation missing-data state renders an empty state without retry at `investment-operation-page.tsx:43-53`.
- Detail activity failure is indistinguishable from no activity because `activities ?? []` falls through to the empty copy at `investment/[id]/page.tsx:303-373`.
- No investment-specific loading/error/offline boundary or mutation offline recovery was found.

### P1-04 — Source/destination account intent is not visible in the consequence receipt

Buy/sell/income forms select an account, and the RPC validates household-owned non-archived cash accounts. However, the confirmation summary only communicates a generic ledger movement; it does not make the selected source/destination account, cash amount, fee leg, or account balance effect prominent. The browser forms also default to the first available account, increasing misrouting risk.

### P1-05 — Transaction and Home integration is semantically correct for principal but not discoverable enough

The ledger semantics correctly keep buy/sell neutral and count investment income as income. Home intentionally excludes an unreliable portfolio summary, so this is not a request to add an unsafe aggregate. However, there is no direct investment orientation/launch point on Home, and detail activity cards do not link to the originating transaction or show source/destination accounts and fee legs. A user must navigate through Money to find the investment surface.

### P1-06 — Asset-class coverage is incomplete in list filtering

The application constants include Stocks, Funds, Crypto, Gold, and Bonds, but the overview filter values only include All, Stocks, Funds, Crypto, and Gold. Bond/other holdings cannot be isolated from the list. The VI opening flow labels the generic class as `Khác`, which is understandable but does not clarify whether a bond is being tracked with unit-price or total-value semantics.

### P1-07 — Income-kind UX is narrower than the domain

The RPC supports dividend, interest, distribution, and other. The current operation form chooses distribution for every fund and dividend for every non-fund at `investment-operation-form.tsx:373-381`; there is no user choice for interest/other and no explicit distinction between cash income and non-cash distribution context.

### P1-08 — Detail activity history omits financial linkage and fee detail

Activity rows show operation label/date/quantity/value/realized result/slippage but not transaction ID/link, cash account, fee source, fee amount, valuation source, or valuation date. That makes reconciliation to Transactions and audit of realized P&L difficult.

### P1-09 — Lifecycle/status vocabulary is compressed in the UI

The domain model has richer states such as recognized, under review, impaired, partially exited, exited, written off, transferred out, cancelled, and archived. Runtime UI largely exposes active/exited/under-review concepts and quantity zero. Missing states and stale/under-review explanations weaken exception handling and privacy/user trust.

### P1-10 — Portfolio coverage metadata is inconsistent

`loadInvestmentPortfolio` aggregates only active holdings at `investment-queries.ts:245-261`, but reports valuation and basis coverage totals using all holdings, including closed holdings, at `:314-315`. If coverage is surfaced later, the denominator will not match the overview aggregate.

## Findings — P2 polish

### P2-01 — Overview chart uses arbitrary hardcoded colors

`investment-overview-client.tsx:41` defines raw hex colors, contrary to the token/design-system rule and with no dark-mode contrast guarantee. Chart colors should come from semantic design tokens or a tested chart palette.

### P2-02 — Investment screens hardcode VND in local formatters

The overview and detail use `formatCurrency(..., "VND", ...)` at `investment-overview-client.tsx:61-64` and `investment/[id]/page.tsx:110-113` instead of the shared/default currency contract. This is easy to miss when household base currency or localized formatting evolves.

### P2-03 — Crypto copy is not instrument-aware

The current operation language contains `/ BTC` and `USDT / BTC` for a generic crypto holding. The fixture also contains multiple crypto symbols, so BTC-specific copy can mislabel a non-BTC asset.

### P2-04 — Primary account/fee selectors are native controls

Investment operation and opening forms use `LabeledSelect` from `shared/patterns/labeled-native-field.tsx` and a native checkbox at `investment-operation-form.tsx:718-735`. This conflicts with the product constitution’s HeroUI-v3 primary control requirement and gives weaker consistent error/focus behavior.

### P2-05 — Filter focus affordance is weaker than the search field

The search input has explicit focus styling at `investment-overview-client.tsx:349-354`; filter buttons at `:361-370` have no equivalent visible focus class. Keyboard semantics (`aria-pressed`, group label) are present, but the visual focus treatment should be consistent.

### P2-06 — Allocation chart consumes excess vertical space on 390px

The authenticated VI 390px screenshot showed a large blank region between the chart center and legend. The page still fits and has no horizontal overflow, but the summary becomes vertically expensive before the holding list begins.

## Accessibility, localization, privacy, and responsive summary

- **Accessibility:** Search, filter group, pressed states, operation live previews, labels, and ownership badges are present. Remaining concerns are native primary selectors, inconsistent focus styling, chart data accessibility beyond the image/legend, and the lack of explicit retry/offline states.
- **VI/EN:** Both locales render and the VI fund flow correctly uses `Số CCQ` and `NAV / CCQ`. Gaps are the generic/ambiguous other-asset label, forced income-kind mapping, hardcoded BTC copy, and missing valuation freshness/not-cash language in both locales.
- **390/440:** No horizontal overflow observed. The 390px view is usable but vertically inefficient in the chart and has a non-actionable closed row.
- **768/1280:** The centered 440px shell remains intact with no overflow, consistent with the product constitution.
- **Light/dark:** Both rendered in the authenticated browser. Theme is controlled under Together Settings rather than the investment route. The main dark-mode risk is the raw chart palette; token-backed surfaces/text otherwise remain readable in the inspected overview.
- **Privacy/ownership:** Read-only ownership presentation is good at the UI layer. It is not sufficient until the server-side mutation boundary is corrected (P0-03). Portfolio reads are household-scoped, and financial history is not hard-deleted.
- **Offline:** No investment-specific offline/read-only banner, retry queue, or mutation recovery path was found. This is especially important because retry behavior is currently unsafe (P0-02).

## Recommended implementation sequence

1. **12B P0 integrity** — Fix fee ledger classification, stable idempotency across retries, server-side ownership enforcement, per-unit price persistence/commands, and fund/CCQ accounting policy. Add regression tests for cash deltas, Home classifications, duplicate retries, unauthorized mutation, partial/full sells, and multiple CCQ buys.
2. **12C List/Create** — Fix list asset filters, closed-history navigation, valuation freshness/not-cash language, empty/error/loading/offline states, and opening/import semantics for all asset classes.
3. **12D Detail/Buy/Sell/Price** — Align unit-price UX and persistence, improve account/fee consequence receipts, expose transaction/activity linkage, support explicit income kinds, and make MAX/partial/full sell behavior auditable.
4. **12E Final Quality Gate** — Run the refactor/code-quality review, full financial regression suite, authenticated browser checks at 390/440/768/1280 in VI/EN and light/dark, keyboard/focus/reduced-motion checks, and verify no unsafe delete path.
