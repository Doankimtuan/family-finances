# Phase E6: Lean Savings and Investments Blueprint

## Status and authority

This document is an implementation blueprint, not permission to change financial behavior. The canonical domain contracts remain authoritative:

- Savings: `artifacts/current/domains/savings/implementation-contract/`
- Investments: `artifacts/current/domains/investments/implementation-contract/`
- Cross-domain money ownership: `artifacts/current/architecture/money-flow/`
- UX and route authority: the current IA, UX redesign, and design-system artifacts

Financial effects use only:

- `NONE`: state, preference, navigation, or context changes without money movement.
- `REAL_MONEY`: confirmed cash movement owned by Accounts and Transactions, committed exactly once.
- `DERIVED_DISPLAY`: calculated or estimated information that never writes a cash transaction.

## Current surface inspection

The scoped inspection found these implementation-relevant issues. This is not a repository-wide audit.

1. The current Savings runtime is `/money/savings*`, while the IA target is `/money/products/savings*`. This phase must not migrate routes. All links must continue through `app-path.ts`.
2. The Savings list and detail pages assemble local cards, amounts, status badges, and timelines instead of the canonical `Page`, `Section`, financial-preview, and receipt patterns. Some visible fallbacks, raw dates, raw statuses, and separators also bypass localization or domain constants.
3. Savings detail visually mixes principal, accrued interest, rate, maturity, and cycle facts without a dominant distinction between provider-held principal, expected/accrued interest, and posted settlement.
4. The current create wizard creates and funds an Active contract in one commit. It does not expose Draft or Pending Funding. This is allowed only for the canonical confirmed/manual-funding MVP path and must be described as create-and-fund, not draft creation.
5. Maturity actions are routed to Inbox, but the saving detail does not itself present the full maturity consequence preview or a durable success receipt.
6. The current maturity RPC derives settlement interest from `saving_cycles.accrued_interest`. Canonical behavior requires provider/manual actual principal, interest, tax, fee, penalty, and net settlement before posting. An estimate must not become posted truth.
7. Early-withdrawal calculation currently includes local default/provider-formula evaluation and sends calculated principal, interest, penalty, and net values into the settlement RPC. Canonical behavior forbids inventing formulas and requires provider/manual actuals for posting.
8. Early-withdrawal preview has no durable quote/version or expiry contract. Recomputing on request or confirm does not by itself prove that the user confirmed the same still-valid result.
9. Maturity and early-withdrawal orchestration acknowledges the Inbox item before the money mutation succeeds. A failed money RPC can therefore leave decision state inconsistent with financial state.
10. Investments has no current app route, module, migration, message namespace, or focused tests. Its canonical verdict is `NEEDS CLARIFICATION` and explicitly says not to implement it for MVP or Version 1.x until terminology, asset priority, visibility, manual-tracking tolerance, and provider-data questions are resolved.

## Main surfaces

### Savings

| Surface | Purpose and hierarchy | Primary action | Secondary actions | Component mapping | Destination | Effect |
|---|---|---|---|---|---|---|
| Overview | Orientation summary, active or attention-needed contracts, then history | Create and fund saving | Open contract | `Page`, `MoneySummary`, `Section`, module-local `SavingsSummary`, `EmptyState`, `ErrorState`, `Skeleton` | Saving detail or new flow | `DERIVED_DISPLAY` |
| Contract detail | Product identity, principal, status/source, active-cycle facts, maturity, then immutable cycle history | State-dependent: review maturity or preview early withdrawal | Edit renewal preference, view activity/history | `Page`, `MoneySummary`, module-local `SavingsSummary`, `MaturitySummary`, `BalanceRow`, activity list, `BottomActionBar` | Maturity review, early-withdraw route, or history | `DERIVED_DISPLAY` |
| Create and fund | Required-first source, provider/package, principal, terms, settlement destination, preview | Confirm create and fund | Back or cancel | `Page`, `Section`, form fields, `FinancialPreview`, `MoneyMovementPreview`, `BottomActionBar`, `ConfirmDialog`, success receipt | Created saving detail | `REAL_MONEY` |
| Maturity review | Decision question, actual/provider-confirmed proceeds or renewal inputs, consequence preview | Confirm selected maturity action | Review later where allowed | `Page` or Inbox-owned `ReviewFlow`, `MaturitySummary`, `FinancialPreview`, `MoneyMovementPreview`, `BottomActionBar` | Saving detail or Inbox origin | `NONE` until confirmed; then action-specific |
| Early-withdrawal preview | Canonical quote, amount breakdown, freshness, destination, consequence | Continue to confirmation | Cancel | `Page`, `FinancialPreview`, `MoneyMovementPreview`, `StatusAlert`, `BottomActionBar` | Early-withdraw confirmation | `DERIVED_DISPLAY` |
| Completed/history | Final settlement receipt followed by immutable cycles and linked transactions | View linked transaction | Archive when allowed | `Page`, `MoneySummary`, `Section`, success receipt, activity list | Transaction detail or Savings | `DERIVED_DISPLAY` |

### Investments

Investments surfaces are a future implementation plan only. Do not create these routes or code until the conditions in this blueprint are resolved.

| Surface | Purpose and hierarchy | Primary action | Secondary actions | Component mapping | Destination | Effect |
|---|---|---|---|---|---|---|
| Overview | Not-cash portfolio orientation, active holdings, stale/unknown valuation warnings, history | Create holding | Open holding | `Page`, `MoneySummary` estimate variant, `Section`, module-local `InvestmentSummary`, `EmptyState`, `ErrorState`, `Skeleton` | Holding detail or create flow | `DERIVED_DISPLAY` |
| Holding detail | Identity/state, contribution context, estimated value with date/source, realized outcome, unrealized change, then activity | State-dependent: record buy, exit, or update valuation | Record income, edit/review facts, view history | `Page`, module-local `InvestmentSummary`, `FinancialPreview`, activity list, `BottomActionBar` | Action flow or activity detail | `DERIVED_DISPLAY` |
| Create holding | Recognize holding without implying a purchase | Save holding | Cancel | `Page`, progressive form, not-cash preview, `BottomActionBar`, success receipt | Holding detail | `NONE` |
| Buy | Source and actual cash contribution first, then holding context | Confirm buy record | Cancel | `Page`, `MoneyMovementPreview`, `FinancialPreview`, `ConfirmDialog`, receipt | Holding detail | `REAL_MONEY` |
| Sell | Exit portion and actual proceeds first, then remaining exposure and realized context | Confirm sell/exit record | Cancel or mark facts unknown | Same confirmation patterns plus holding summary | Holding detail | `REAL_MONEY` when cash proceeds exist |
| Dividend/income | Cash receipt and investment-income meaning | Confirm income record | Record non-cash context only when canonical | Money preview, confirmation, receipt | Transaction detail, then holding | `REAL_MONEY` when cash arrived; otherwise `NONE` |
| Valuation update | Estimated value, date, source, and uncertainty | Save valuation | Mark unknown/cancel | `Page`, form fields, estimate preview, `BottomActionBar` | Holding detail | `NONE`; displayed performance is `DERIVED_DISPLAY` |

## Savings flows

### View savings

- Entry: Money Products, Money overview, deep link, or a completed receipt.
- Required data: contract identity, status, latest immutable cycle, principal, maturity, provider/package, freshness, and historical cycles.
- Financial effect: `DERIVED_DISPLAY`.
- Preview and confirmation: none.
- Resulting records: none.
- Success receipt: none for read-only viewing.
- Success destination: selected saving detail.
- Failure recovery: retain known facts where safe, show retry and return to Money.

### Create and fund contract

- Entry: Savings overview.
- Required data: funding account, settlement account, provider, package, principal, confirmed/manual funding status, term/start/maturity, locked rate, interest method, settlement rule, and renewal preference.
- Financial effect: `REAL_MONEY` only when funding is confirmed/manual accepted.
- Preview: source account, savings product destination, principal, effective date, expected interest clearly marked non-posted, term, maturity, settlement destination, and the exact records to be created.
- Confirmation: explicit create-and-fund confirmation. A Draft-only save would be `NONE`, but no separate Draft flow should be added without extending current state support.
- Resulting records: one saving aggregate, immutable cycle 1, one logical funding movement represented by the canonical source and destination transaction postings, and stable links from the cycle.
- Success receipt: real money changed; plan unchanged; saving and funding movement created; new status Active.
- Success destination: new saving detail.
- Failure recovery: no partial saving or transaction; keep form values; explain invalid account, insufficient balance, package, permission, offline, or provider/manual confirmation failure.

### Fund an existing Draft contract

- Entry: Draft contract detail, only after the domain/runtime supports Draft.
- Required data: source, requested principal, provider/manual actual, destination representation, effective date.
- Financial effect: `REAL_MONEY` on confirmation only.
- Preview: source, destination, requested versus actual principal, date, and transaction links.
- Confirmation: explicit.
- Resulting records: Draft to Pending Funding or Active per canonical contract; transactions only on confirmed/manual funding.
- Success receipt: exact source delta, confirmed principal, state, linked postings.
- Success destination: contract detail.
- Failure recovery: Draft or Pending Funding remains; no fake principal; correction/reversal only if a prior posting exists.
- Boundary: not part of the current MVP route set. Do not simulate it in UI while persistence only supports immediate Active creation.

### Review active cycle

- Entry: contract detail.
- Required data: immutable principal/terms, start/maturity, expected/accrued interest status, latest provider/manual facts, renewal preference, and activity links.
- Financial effect: `DERIVED_DISPLAY`.
- Preview and confirmation: none.
- Resulting records: none.
- Success destination: remains on detail; linked activity opens its owner detail.
- Failure recovery: stale/partial labels and review route. Never convert an estimate into posted money.

### Review maturity

- Entry: matured saving detail or maturity ReviewItem.
- Required data: matured principal, provider/manual actual interest where known, tax/fee/penalty only when provider-confirmed, settlement destination, available renewal package and rate, settlement rule, and effective date.
- Financial effect: `NONE` while deciding.
- Preview: compare withdraw, renew principal and interest, renew principal only, and change package only when each is approved and available.
- Confirmation: the selected money action gets its own preview-confirm step.
- Resulting records: decision context only until execution.
- Success destination: confirmation flow or origin.
- Failure recovery: remain Grace Period/Awaiting Renewal; refresh stale package/rate; leave Inbox unresolved.

### Renew

- Entry: maturity review for Grace Period/Awaiting Renewal.
- Required data: old cycle, selected confirmed package, accepted locked rate, settlement rule, provider/manual eligible interest, new start/maturity, and destination if interest pays out.
- Financial effect: `REAL_MONEY` only for provider rollover and any actual interest payout/posting. Saved preference alone is `NONE`.
- Preview: old principal, eligible interest, tax/fee only when actual, new principal, any cash payout, destination, rate, term, and effective date.
- Confirmation: explicit; saved preference may prefill only.
- Resulting records: old cycle becomes immutable rolled history; exactly one new cycle; actual interest transaction only when canonical; one decision record.
- Success receipt: money changed or unchanged, old/new cycle identifiers, new principal, any payout, and destination.
- Success destination: saving detail focused on the new Active cycle.
- Failure recovery: old cycle remains actionable; no new cycle or duplicate postings; refresh unavailable package/rate.

### Change package

- Entry: maturity review only; v1 capability.
- Required data: selected available package, accepted rate and term, settlement rule, actual interest treatment, and effective date.
- Financial effect: same as Renew.
- Preview: before/after package, rate, term, principal, interest treatment, destination, and linked records.
- Confirmation: explicit acceptance of changed terms.
- Resulting records: immutable prior cycle and one new cycle with selected snapshot.
- Success receipt and destination: same as Renew.
- Failure recovery: remain Awaiting Renewal; no ledger write when package is unavailable or rate is not accepted.

### Withdraw at maturity

- Entry: maturity review.
- Required data: source savings product, settlement account, provider/manual actual principal and interest, actual tax/fee/penalty if any, net settlement, effective posting date.
- Financial effect: `REAL_MONEY`.
- Preview: every amount remains separate; net settlement must reconcile to provider/manual actuals. No estimate may be silently promoted.
- Confirmation: explicit.
- Resulting records: one logical savings-to-account settlement using canonical paired postings, linked settlement result, Completed state, decision resolution after successful commit.
- Success receipt: source/destination, principal, interest, tax, fee, penalty, net, effective date, and transaction link.
- Success destination: Completed saving detail, or Inbox origin with a link to detail.
- Failure recovery: remain Awaiting Renewal or settlement review; Inbox remains unresolved; safe retry is idempotent.

### Early-withdrawal preview

- Entry: Active saving detail.
- Required data: cycle snapshot, provider-approved calculation inputs or provider/manual quote, principal, accrued estimate, eligible interest, tax/fee/penalty, net, destination, effective date, quote freshness/version.
- Financial effect: `DERIVED_DISPLAY`.
- Preview: principal, accrued estimate, eligible actual/quoted interest, tax, fee, penalty/forfeiture, and net remain distinct. Unknown fields stay unknown.
- Confirmation: none yet; Continue opens confirmation.
- Resulting records: at most a decision/quote context record. No transaction or state change.
- Success destination: early-withdraw confirmation.
- Failure recovery: refresh missing/stale provider inputs; never fall back to an invented formula.

### Early-withdrawal confirmation

- Entry: valid non-stale preview.
- Required data: the exact confirmed quote/version, destination, provider/manual actual settlement, effective date, and actor permission.
- Financial effect: `REAL_MONEY`.
- Preview: repeat the confirmed breakdown and reversibility.
- Confirmation: explicit, after preview.
- Resulting records: one logical net payout using canonical paired postings, actual interest/fee/tax/penalty facts, one early-withdrawal audit record, Closed Early state, decision resolution after successful commit.
- Success receipt: full breakdown, destination, date, state, audit record, and transaction link.
- Success destination: Closed Early detail or Inbox origin.
- Failure recovery: stay Active or create failed-settlement review; stale preview blocks confirm; retry cannot duplicate movement.

## Investments flows

These flows are contract definitions only until the investment readiness conditions are resolved.

### View portfolio and holding

- Entry: future Money Products Investments group or deep link.
- Required data: holding identity/state, contribution context, quantity/units when known, estimated value/date/source, realized outcome, unrealized change, and history.
- Financial effect: `DERIVED_DISPLAY`.
- Resulting records: none.
- Success destination: holding detail or selected source record.
- Failure recovery: stale/unknown/source labels, Under Review where canonical, no pressure to invest.

### Create holding

- Entry: Investments overview.
- Required data: identity, broad asset class or explicit unknown, ownership/visibility or explicit unclear, contribution exact/estimated/unknown. Quantity and price are optional household context, not tax-lot precision.
- Financial effect: `NONE`.
- Preview: clearly state that recognition does not move cash and estimated value is not cash.
- Confirmation: lightweight save.
- Resulting records: Recognized holding, or Under Review when facts are insufficient. No transaction.
- Success receipt: real money unchanged; plan unchanged; holding created.
- Success destination: holding detail.
- Failure recovery: preserve entered facts and explain missing identity/permission/classification.

### Buy

- Entry: Active/Recognized holding or Transactions-owned investment contribution entry.
- Required data: source account, total actual cash amount, holding, effective date; quantity/units and unit price/value may be exact, estimated, or unknown. Fees are recorded only if real and known; detailed fee tracking is deferred.
- Financial effect: `REAL_MONEY`.
- Preview: source, external destination/context, total cash outflow, known fee, quantity/price context, contribution/cost context, and holding effect.
- Confirmation: explicit. ViNha records a fact and does not recommend the purchase.
- Resulting records: one canonical Transactions-owned outflow/transfer and linked investment contribution/buy context; holding activation or quantity/cost-context update according to the future domain API.
- Success receipt: exact source delta once, transaction link, contribution context, quantity state, and holding state.
- Success destination: holding detail.
- Failure recovery: no holding delta if transaction commit fails; no transaction duplication on retry; manual recognition without cash link remains explicitly unlinked.

### Sell

- Entry: Active, Under Review, Impaired, or Partially Exited holding where facts support exit.
- Required data: exit type, full/partial, quantity or portion exact/estimated/unknown, actual proceeds, destination account, effective date, remaining exposure; fees only when real and known.
- Financial effect: `REAL_MONEY` when proceeds arrive. Transfer-out or write-off may be `NONE` and must use their canonical action, not a fake sale.
- Preview: proceeds, destination, known fees, exited quantity/portion, remaining exposure, and realized outcome distinct from prior unrealized display.
- Confirmation: explicit with not-cash/no-advice language.
- Resulting records: one Transactions-owned proceeds receipt when cash moved, exit context, realized outcome, remaining holding state or terminal Exited state, preserved activity.
- Success receipt: account delta once, proceeds, fees, realized context, remaining quantity/state, and links.
- Success destination: holding detail.
- Failure recovery: Under Review if proceeds or remaining exposure are unclear; no cash claim or terminal exit without supporting facts.

### Record dividend or investment income

- Entry: holding detail or Transactions.
- Required data: holding/issuer, actual amount, destination account, effective date, approved investment-income classification. Non-cash distribution stays context only if supported.
- Financial effect: `REAL_MONEY` only when cash arrived; otherwise `NONE`.
- Preview: issuer, amount, destination, date, classification, and holding context.
- Confirmation: preview-confirm for real cash.
- Resulting records: one Transactions-owned receipt and investment-income context. It is not ordinary salary by default.
- Success receipt: destination delta once, classification, transaction link, and holding link.
- Success destination: transaction detail with a return link to holding.
- Failure recovery: leave uncategorized/Under Review; never invent a category or silently classify as salary.

### Update valuation

- Entry: eligible holding detail.
- Required data: estimated value or explicit unknown, date or explicit unknown, source or explicit unknown, manual/uncertain marker when applicable.
- Financial effect: `NONE`; resulting performance display is `DERIVED_DISPLAY`.
- Preview: old and new estimated value, date, source, confidence/uncertainty. State that balance and transactions will not change.
- Confirmation: lightweight save.
- Resulting records: valuation fact/history and derived unrealized display only. No Account or Transaction record.
- Success receipt: real money unchanged; plan unchanged; valuation updated.
- Success destination: holding detail.
- Failure recovery: prior valuation remains; mark stale or Under Review when contradictory.

## Main states

### Savings

| State | Required presentation and action |
|---|---|
| No contracts | Supportive `EmptyState`; one create action; drafts do not count as active savings. |
| Active | Principal dominates; accrued/expected interest is labeled non-posted; show maturity and early-withdraw preview entry. |
| Maturity approaching | `MaturitySummary` with date, consequence, and review entry; no automatic renewal claim. |
| Matured | Grace Period or Awaiting Renewal meaning; options only when canonical and available. |
| Settlement pending | Requested is not settled; lock duplicate confirmation; show recovery/review. |
| Completed | Final actual settlement receipt and immutable history; no money actions. |
| Early-withdrawal preview | Full separated breakdown, freshness/version, destination, cancel and continue. No money moved. |

### Investments

| State | Required presentation and action |
|---|---|
| No holdings | No-pressure `EmptyState`; one recognition action; no product recommendation. |
| Active holdings | Contribution and estimated value are distinct; source/date visible. |
| Holding with no valuation | Show unknown value, not zero; offer update without implying failure. |
| Holding with valuation | Estimated/not-cash label, date/source, stale state. |
| Buy/sell success | Receipt names account movement, holding change, and linked transaction. |
| Realized/unrealized display | Separate sections and labels; realized requires exit facts, unrealized never appears spendable. |

## Component reuse

Use existing implementations where present:

- `shared/patterns/page.tsx`
- `shared/patterns/section.tsx`
- `shared/patterns/section-header.tsx`
- `shared/patterns/bottom-action-bar.tsx`
- `shared/patterns/balance.tsx`
- `shared/patterns/confirm-summary.tsx`
- `shared/patterns/transaction-row.tsx`
- `shared/patterns/empty-state.tsx`
- `shared/patterns/error-state.tsx`
- `shared/ui/skeleton.tsx`

Map requested conceptual patterns to existing equivalents before adding anything:

- `MoneySummary`: extend/reuse `Amount` or `Balance` only if its contract supports real/estimate labels; otherwise add one shared pattern after Rule of Three.
- `FinancialPreview` and `MoneyMovementPreview`: compose from `ConfirmSummary`, `Balance`, and `Section` first.
- `ConfirmDialog`: reuse the current shared confirmation primitive if present at implementation time.
- Success receipt: use the shared `SuccessState`/receipt pattern established by prior money-product batches.
- Activity/history: use `TransactionRow` for real ledger movement and a module-local cycle/holding activity row for non-transaction facts.

Add only domain-local components directly required by this flow:

- Savings: `SavingsSummary`, `MaturitySummary`, `SavingCycleRow`.
- Investments, after readiness approval: `InvestmentSummary`, `InvestmentActivityRow`.

Do not add a speculative shared portfolio, performance, quote, or financial-product abstraction.

## Narrow implementation boundary

### Savings paths likely to change

- `app/[locale]/(product)/money/savings/page.tsx`
- `app/[locale]/(product)/money/savings/[id]/page.tsx`
- `app/[locale]/(product)/money/savings/new/create-saving-wizard.tsx`
- `app/[locale]/(product)/money/savings/[id]/early-withdraw/page.tsx`
- `app/[locale]/(product)/money/savings/[id]/early-withdraw/early-withdraw-form.tsx`
- `app/[locale]/(product)/money/savings/[id]/renewal-policy-editor.tsx`
- `app/[locale]/(product)/money/savings/savings-actions.ts`
- `modules/savings/application/commands/create-saving.ts`
- `modules/savings/application/commands/settle-saving.ts`
- `modules/savings/application/commands/early-withdraw.ts`
- `modules/savings/application/queries/list-savings.ts`
- `modules/savings/application/savings-types.ts`
- `modules/savings/application/savings-constants.ts`
- A new imperative Supabase migration created through the project workflow, replacing unsafe RPC behavior without rewriting old migrations.
- `messages/en/money.json`
- `messages/vi/money.json`

### Investments paths, only after readiness approval

- `app/[locale]/(product)/money/investments/page.tsx`
- `app/[locale]/(product)/money/investments/new/page.tsx`
- `app/[locale]/(product)/money/investments/[id]/page.tsx`
- Action routes or route-local forms for buy, sell, income, and valuation only after their APIs and route constants are approved.
- `modules/investments/application/investments-constants.ts`
- `modules/investments/application/investments-types.ts`
- `modules/investments/application/commands/*`
- `modules/investments/application/queries/*`
- `modules/investments/application/index.ts`
- `modules/tenancy/application/app-path.ts`
- New EN/VI investment message namespaces.
- New migrations/tables/RPCs only after a reviewed schema and transaction-ownership decision.

These are prospective exact homes, not authorization to create them now.

### Tests likely to change

- `tests/unit/savings-domain.test.ts`
- `tests/unit/savings-renewal-policy.test.ts`
- New focused Savings settlement/idempotency tests next to current unit tests.
- New authenticated `tests/e2e/savings.smoke.spec.ts`.
- Investments unit and authenticated e2e tests only after the implementation gate is lifted.

### Routes that remain unchanged

- `/money/savings`
- `/money/savings/new`
- `/money/savings/[id]`
- `/money/savings/[id]/early-withdraw`
- Maturity decisions continue through `/inbox/[id]` and return to their origin/detail.

Do not perform the IA route migration to `/money/products/savings*` in this phase. Do not invent an Investments URL before route ownership is approved. All route additions or changes belong in `modules/tenancy/application/app-path.ts` first.

### Canonical code that must not be bypassed

- Ledger Accounts/Transactions remain the only owners of real money movement.
- Savings immutable cycle history and current application APIs remain the domain entry point.
- Inbox owns decision attention, but its resolution must be committed consistently with or after successful owner-domain mutation.
- Interest, fee, tax, penalty, settlement, realized outcome, and valuation inputs must come from approved domain/provider/manual contracts, never UI formulas.
- Supabase RLS, household membership checks, and RPC idempotency/atomicity are mandatory. Replace behavior with a new migration; never edit applied migrations.

### Unrelated modules that remain untouched

- Cards, loans, debts, general account pages, general transaction screens, Plan, Goals, Jars, Health, Together, and legacy-v1.
- Do not refactor the app shell, bottom navigation, or unrelated shared patterns.

## Minimal acceptance criteria

### Savings

- Overview and detail show principal, accrued/expected interest, posted actuals, maturity, and history without semantic ambiguity.
- Create-and-fund happy path commits one logical funding movement and creates one Active cycle.
- If separate Draft/fund is implemented later, Draft never implies provider-held principal.
- Maturity uses provider/manual actuals and never posts accrued estimates as actual interest.
- Renewal creates exactly one immutable new cycle and no duplicate money movement.
- Maturity withdrawal posts exactly one logical settlement and resolves the decision only after success.
- Early-withdraw preview uses canonical inputs/results, is versioned/fresh, and makes no money movement.
- Confirmed early withdrawal posts actual settlement exactly once and preserves the historical cycle/audit record.
- Completed and Closed Early records remain read-only and auditable.

### Investments, after the implementation gate

- Overview/detail and no-holding/unknown-valuation states work without advice or spendable-cash language.
- Create holding moves no money.
- Buy/sell/income use Transactions-owned cash movement exactly once and link context without duplicating facts.
- Valuation update changes no account balance and creates no transaction.
- Quantity, contribution/cost context, estimated value, realized outcome, and unrealized change remain distinct.
- Exited and archived history remains auditable.

### UI

- Main flows render at 390px and 440px without clipped content, hidden fields, or unreachable actions.
- EN and VI use message keys and localization formatters; no visible hardcoded copy, raw enum, raw date, or currency.
- Light and dark modes use semantic tokens and meet WCAG AA.
- Loading, empty, error, disabled, confirmation, and receipt states do not imply money moved when it did not.

## Minimal test plan

1. Run typecheck.
2. Run lint.
3. Run focused Savings tests and, only when authorized, focused Investments tests.
4. Run authenticated Playwright at 390px and 440px in EN/VI and light/dark for the main cases.

Savings browser cases:

- Overview and detail, including immutable cycle history.
- Create-and-fund or existing safe equivalent.
- Maturity withdrawal or a seeded safe settlement equivalent.
- Early-withdrawal preview and cancel.

Investments browser cases after readiness approval:

- Overview/detail.
- Buy.
- Sell.
- Valuation update.

For every `REAL_MONEY` action, capture before and after:

- Source and destination account balances.
- Product principal, holding quantity/context, and state.
- Relevant transaction count, IDs, types/classification, and linked-record IDs.
- Action retry result.

Assert exactly one expected logical movement. If the ledger models a transfer as paired postings, assert exactly one source posting and one destination posting with the same business correlation, not an arbitrary single-row count. Assert no extra interest, fee, tax, penalty, income, or settlement posting.

For valuation update, assert account balances and transaction count are unchanged and only valuation/history plus derived display changes.

## Implementation conditions

Savings coding may proceed only after the work item explicitly includes fixing these financial boundaries:

1. Maturity settlement accepts provider/manual actuals and cannot post accrued estimates as actual money.
2. Early-withdrawal confirmation uses an approved, durable, non-stale result and does not trust editable client-calculated settlement amounts.
3. Inbox resolution and money/state mutation cannot diverge on failure or retry.

Investments coding must not begin until the canonical product/domain gate resolves:

1. Vietnam-first product terminology and the first supported asset classes.
2. Personal versus household visibility/permission behavior.
3. Manual valuation expectations and supported source semantics.
4. The approved Transactions classification for investment contribution, proceeds, income, fee, refund, and correction.
5. The application/schema contract for holding, quantity, contribution/cost context, valuation history, exit/realized outcome, and transaction linking.
6. Canonical route ownership and URL constants.

These are blocking because guessing risks principal/settlement movement, investment-income classification, valuation behavior, and historical auditability.
