# Cards + Loans Lean Screen Blueprint

## Scope and authority

This blueprint covers only Cards and Loans. It preserves the current ledger ownership model, current routes, approved domain contracts, and the existing mobile product shell. It does not authorize new provider behavior, issuer formulas, lender formulas, automatic payments, reconciliation, or historical rewrites.

Canonical rules take precedence over current source behavior when they conflict.

Financial-effect labels used below:

- `NONE`: no real-money movement; a domain fact or lifecycle state may change.
- `REAL_MONEY`: exactly one transaction-owned cash movement occurs.
- `DERIVED_DISPLAY`: read-only calculation or presentation; no persisted money movement.

## Non-negotiable financial model

### Cards

- Card purchases remain transaction-owned spending facts and create card obligation context.
- A card payment is a distinct liability payment. It is neither income nor expense and must not duplicate the original purchase.
- Accounts owns the source balance, Transactions owns the movement, and Cards owns application of that payment to the obligation.
- Statement amount, paid amount, remaining due, and due date come from the recorded billing period. The preferred due display is the earliest open or partially paid billing period, with `remaining = max(0, statement amount - paid amount)`.
- Available credit is borrowing capacity, never cash.
- Card-origin installments remain attached to their originating card purchase and must not create a second Loan obligation.
- Archive/close preserves purchases, statements, payments, and installment history.

### Loans

- A repayment is one transaction-owned cash movement plus a linked loan-payment record.
- Principal, interest, and fee are distinct. Unknown components are shown as unknown, never inferred.
- A schedule is planned information; actual repayment history is historical fact.
- The approved early-payoff capability is an estimate only. It is not a lender quote, does not move money, and does not close the loan.
- A rate update applies only to unpaid periods on or after its effective date. Paid schedule entries, payment splits, prior rate periods, and other historical facts are immutable.
- Completed and archived loans remain readable with repayment and rate history.

## Current-surface inspection

The following are the ten implementation-relevant issues found in the current Cards/Loans surfaces.

1. `/money/cards` and `/money/cards/[id]` redirect to Loans, so they are compatibility routes rather than usable Cards surfaces.
2. The actual Cards overview is embedded in Money and the actual card detail is `/money/accounts/[id]`; this boundary is not made explicit in the current UI.
3. Card payment submits immediately from inline fields. It has no consequence preview, explicit target card/effective date, confirmation, or durable receipt.
4. Card payment is currently stored as an ordinary expense and billing months are updated after that transaction in separate writes. This violates payment semantics and permits partial or duplicate outcomes.
5. Statement rows emphasize statement and paid values but do not clearly present the remaining due as the primary amount; raw values are not consistently localized.
6. Card billing items are queried but not presented, leaving card activity and card-origin installment review absent from card detail.
7. Complex create/edit/archive controls are mixed into account/card detail instead of being secondary actions with consequence-aware confirmation.
8. Loans overview embeds the full creation form above the list, competing with orientation and violating the list-page hierarchy.
9. Loan detail places payment, early payoff, editing, rate change, close, schedule, and history into one long action stack; the next due and repayment breakdown do not lead the hierarchy.
10. Loan payment and “early payoff” show only one total. They omit principal/interest/fee breakdown, effective date, affected records, and receipt; the current payoff execution also charges all future scheduled interest and closes the loan, contrary to the approved estimate-only contract.

## Main UX surfaces

### Cards

| Surface | Purpose and hierarchy | Primary action | Secondary actions | Component mapping | Navigation destination | Financial effect |
|---|---|---|---|---|---|---|
| Cards overview within Money | Orient by earliest due obligation. Order: section title -> total/next due context -> active card rows -> archived entry when supported -> empty/error state. | Open the card needing attention. | Create credit-card account; view other cards. | Existing `Page`, `Section`, `CreditCardCard`/`BalanceRow` role, `EmptyState`, `ErrorState`, `Skeleton`. | `/money/accounts/[id]`; creation stays in the existing Accounts flow. | `DERIVED_DISPLAY` |
| Card detail | Explain one card. Order: card identity -> remaining due and due date -> statement facts -> payment action -> installments/activity -> secondary lifecycle actions. | Make card payment when due is positive. | Edit safe card facts, review installment/activity, archive when eligible. | Existing `Page`, `Section`, `CreditCardCard` or `MoneySummary` role, `BottomActionBar`, route-local statement/activity rows. | Stay on `/money/accounts/[id]`; linked transaction opens transaction detail when available. | `DERIVED_DISPLAY` |
| Statement/due | Make statement amount, paid amount, remaining due, due date, billing period, and recorded-source caveat unambiguous. Remaining due is dominant. | Pay remaining due. | Review earlier billing periods. | `MoneySummary` role, `ScheduleRow`-style route-local row, `Section`. | Card payment confirmation or same detail. | `DERIVED_DISPLAY` |
| Card payment | Preview one liability payment from one real account to one target card. | Confirm payment. | Cancel/back without mutation. | `MoneyMovementPreview` role, `FinancialPreview` role, `ConfirmDialog` or short sheet, `BottomActionBar`, success receipt pattern. | Receipt, then card detail; receipt links resulting transaction/payment record. | `REAL_MONEY` |
| Installment review | Explain original purchase, card origin, installment schedule/status, paid/remaining amount, and linked records without creating a Loan. | View linked purchase or current billing period. | Return to card detail. | Existing `InstallmentCard` only as a compatibility presentation if it preserves card origin; otherwise route-local `ScheduleRow` list. | Card detail or transaction detail. | `DERIVED_DISPLAY` |
| Card activity | Show transaction-owned purchases and adjustments separately from liability payments, with billing-period association. | Open activity record. | Filter only if already supported. | Existing `TransactionRow`, `Section`, `EmptyState`, `Skeleton`. | Transaction detail. | `DERIVED_DISPLAY` |
| Create/edit/archive | Record or safely maintain card identity, limit, statement/due days, linked account, and historical visibility. | Save/confirm. | Cancel; review unresolved due. | Existing account form primitives, `FinancialPreview` role when opening facts are affected, `ConfirmDialog`, `BottomActionBar`. | Card detail or Money. | `NONE` unless a separately approved opening posting occurs |

Cards do not receive new canonical routes in this task. `/money/cards*` remains redirect-only; Cards overview/detail use the current Money and Account surfaces.

### Loans

| Surface | Purpose and hierarchy | Primary action | Secondary actions | Component mapping | Navigation destination | Financial effect |
|---|---|---|---|---|---|---|
| Loans overview | Browse obligations. Order: title -> nearest payment context -> active rows -> completed/archive access -> empty/error state. Creation is launched, not expanded inline. | Open nearest-due loan. | Create loan; open other loans. | Existing `Page`, `Section`, `LoanCard`/`BalanceRow` role, `EmptyState`, `ErrorState`, `Skeleton`. | `/money/loans/[id]`; create remains within current route boundary. | `DERIVED_DISPLAY` |
| Loan detail | Explain one obligation. Order: recorded remaining principal -> next total due/date -> current rate/source caveat -> primary repayment -> schedule -> repayment history -> rate/lifecycle actions. | Record regular payment. | View payoff estimate; update future rate; edit metadata; complete/archive when eligible. | Existing `Page`, `Section`, `LoanCard`/`LoanSummary` role, `BottomActionBar`, `ScheduleRow`-style rows. | Stay on `/money/loans/[id]` or open linked transaction/receipt. | `DERIVED_DISPLAY` |
| Repayment schedule | Put next unpaid/partial entry first; each row shows date, principal, interest, known fee, total, remaining principal, and status. Paid entries are historical and visibly immutable. | Record payment for next eligible entry. | Review later or paid entries. | `Section`, route-local `ScheduleRow`; avoid nested card soup. | Payment preview or same detail. | `DERIVED_DISPLAY` |
| Regular payment | Preview source, lender/loan, effective date, principal, interest, known fee, total cash outflow, remaining principal after payment, and linked records. | Confirm payment. | Cancel/back. | `MoneyMovementPreview` role, `LoanSummary`/`FinancialPreview` role, `ConfirmDialog`, `BottomActionBar`, success receipt pattern. | Receipt, then loan detail; link transaction and loan-payment record. | `REAL_MONEY` |
| Early-payoff estimate | Explain recorded remaining principal plus only canonically known accrued amounts; label uncertainty and “not a lender quote.” | Return to loan detail or use the estimate for planning context. | None that moves money. | `LoanSummary` payoff variant or route-local summary, `FinancialPreview` estimate variant. | Loan detail. | `DERIVED_DISPLAY` |
| Future rate update | Preview old rate, new rate, future effective date, first affected unpaid period, and future schedule delta. Historical periods remain visible and unchanged. | Confirm future rate facts. | Cancel/back. | Percentage/date fields, `FinancialPreview`, `ConfirmDialog`, `BottomActionBar`. | Loan detail at rate history/schedule. | `NONE`; preview is `DERIVED_DISPLAY` |
| Complete/archive | End current-use tracking without deleting facts. Completion requires zero recorded principal or explicit approved settlement confirmation; archive is allowed only for non-active eligible states. | Confirm complete/archive. | Cancel; route uncertainty to review. | `ConfirmDialog`, `FinancialPreview`, success receipt pattern. | Loan detail for completed; Loans overview after archive. | `NONE` |
| Repayment history | Preserve actual date, total, principal, interest, known fee, source account, and linked transaction. | Open linked transaction. | None. | `Section`, transaction/history rows, `EmptyState`. | Transaction detail. | `DERIVED_DISPLAY` |

## Cards flows

### View cards

- Entry: Money overview Cards section.
- Amount/source data: `listCreditCards`; recorded billing months; localized household currency.
- Financial effect: `DERIVED_DISPLAY`.
- Preview/confirmation: none.
- Success destination: selected `/money/accounts/[id]`.
- Linked records: card account, credit-card settings, billing periods.
- Failure behavior: preserve known content if available; otherwise `ErrorState` with retry. No synthetic zero due.

### View card detail and review statement/due

- Entry: card row from Money.
- Amount/source data: `getCreditCardDetail`; earliest open/partial billing month is the current due source; historical periods stay separate.
- Financial effect: `DERIVED_DISPLAY`.
- Preview/confirmation: none.
- Success destination: same detail.
- Linked records: account, settings, billing periods/items, linked transactions, card-origin installment reference.
- Failure behavior: missing card routes safely to Money; incomplete or conflicting billing truth displays Needs Review and disables payment rather than guessing.

### Make card payment

- Entry: card detail when remaining due is positive and an eligible real-money source exists.
- Amount/source data: user-entered positive amount bounded by the approved remaining-due/overpayment rule; selected source account; target card; user-visible effective date; billing periods to which payment will apply.
- Financial effect: `REAL_MONEY` exactly once.
- Preview/confirmation: must show amount paid, source account, target card, effective date, application order, remaining due after payment, and the transaction/payment record that will be linked. State explicitly that this is a liability payment, not income or expense.
- Success destination: receipt, then the same card detail.
- Linked records: one transaction-owned liability-payment movement and one card-payment/application record linking the transaction to affected billing period(s). If the schema retains application rows rather than one payment row, the receipt still exposes one payment identity and one transaction identity.
- Failure behavior: atomic rollback leaves source balance, transaction count, billing paid amounts, and statuses unchanged. Retry uses an idempotency key. Uncertain posting goes to Needs Review; never submit a second movement silently.

### Review installment

- Entry: installment item in card detail/activity.
- Amount/source data: original linked purchase, card billing item, approved installment schedule/reference.
- Financial effect: `DERIVED_DISPLAY`.
- Preview/confirmation: none.
- Success destination: card detail or linked purchase.
- Linked records: transaction, billing item, card-origin installment reference. No new Loan.
- Failure behavior: missing or conflicting origin becomes Needs Review; do not infer a schedule or duplicate obligation.

### Create/edit/archive card

- Entry: existing Accounts creation/detail actions.
- Amount/source data: issuer/name, type, credit limit, statement day, due day, linked account, lifecycle eligibility.
- Financial effect: `NONE` for ordinary metadata/lifecycle actions.
- Preview/confirmation: edit previews any future-facing date interpretation; archive confirms history preservation and blocks unresolved due unless the canonical review path allows it.
- Success destination: card detail after create/edit; Money after archive.
- Linked records: account and credit-card settings only; history remains linked.
- Failure behavior: validation preserves prior facts and state; unresolved obligation routes to Needs Review.

## Loans flows

### View loans and detail

- Entry: Money -> Loans -> loan row.
- Amount/source data: `listLoans`, `getLoan`, schedules, payments, and rate periods.
- Financial effect: `DERIVED_DISPLAY`.
- Preview/confirmation: none.
- Success destination: `/money/loans/[id]`.
- Resulting/linked records: loan, schedule, payments, rate periods.
- Failure recovery: empty/error states do not invent lender-confirmed values; missing detail returns to Loans.

### View repayment schedule

- Entry: Loan detail.
- Amount/source data: persisted schedule entries. Use their principal/interest/total/status values; fee is displayed only if a canonical stored field exists.
- Financial effect: `DERIVED_DISPLAY`.
- Preview/confirmation: none.
- Success destination: same detail or payment preview.
- Resulting/linked records: none.
- Failure recovery: show schedule unavailable/Needs Review; do not recompute silently merely to render.

### Make regular payment

- Entry: active loan detail with eligible source and next unpaid/partial schedule entry.
- Amount/source data: canonical next entry, selected source, effective date. Show principal, interest, fee if canonically present, and total cash outflow. If split is unknown, explicitly label unknown and follow the domain review rule.
- Financial effect: `REAL_MONEY` exactly once.
- Preview: source -> lender/loan; principal; interest; known fee; total; effective date; remaining principal after; affected schedule entry; transaction and loan-payment records.
- Confirmation: explicit, controls locked while pending.
- Resulting records: one transaction-owned repayment movement and one linked loan-payment record; the eligible schedule entry and recorded remaining principal update in the same atomic operation.
- Success receipt: total cash outflow, source balance delta, principal delta, interest/fee classification, linked transaction/payment IDs, new next due/status.
- Failure recovery: rollback all effects; duplicate-safe retry; unchanged prior state shown. Unclear interpretation moves to Needs Review without false progress.

### Early payoff

- Entry: active loan detail.
- Amount/source data: recorded remaining principal plus only canonical, date-sensitive accrued interest and canonical penalty/fee if those sources exist. Current contracts do not approve future scheduled interest as accrued interest and defer prepayment-fee behavior.
- Financial effect: `DERIVED_DISPLAY` only.
- Preview: recorded principal, canonically known accrued interest, canonically known penalty/fee, estimate total, effective/as-of date, uncertainty, and “not a lender quote.”
- Confirmation: no payment confirmation is allowed in this phase.
- Resulting records/state: none; loan remains Active.
- Success receipt: not applicable; return to detail with the estimate context.
- Failure recovery: show that an estimate cannot be safely calculated; do not display an authoritative zero or execute payment.

### Future interest-rate update

- Entry: active floating or eligible post-promo loan.
- Amount/source data: current rate period, new rate, strictly future effective date aligned to an unpaid period, recorded remaining principal, unpaid schedule.
- Financial effect: `NONE`; schedule comparison is `DERIVED_DISPLAY`.
- Preview: first affected period, before/after rate, before/after future payment values and total future interest, with an explicit “past payments unchanged” statement.
- Confirmation: explicit because the schedule changes.
- Resulting records: append a new rate period; close the prior period at the boundary; replace/recompute only eligible future schedule entries.
- Success receipt: effective date, new rate, count/date range of future entries changed, historical entries unchanged.
- Failure recovery: atomic rollback; keep old rate and schedule; invalid past/paid-period dates are blocked.

### Complete/archive

- Entry: Loan detail secondary lifecycle actions.
- Amount/source data: current status, recorded remaining principal, unresolved review state, history counts.
- Financial effect: `NONE`.
- Preview: state transition, why eligible/ineligible, and preserved history.
- Confirmation: explicit.
- Resulting records: status/audit record only; no transaction from completion/archive alone.
- Success receipt: new state and history destination.
- Failure recovery: preserve previous state; residual uncertainty becomes/stays Needs Review.

## Main state coverage

### Cards

| State | Required presentation and action |
|---|---|
| No cards | Explain that no household-relevant cards are tracked; offer the existing credit-card account creation path. |
| Active card | Show identity, obligation context, borrowing-capacity warning, statement/activity sections. |
| Due/statement available | Remaining due and due date lead; statement and paid amounts explain it; payment CTA is available if source and truth are valid. |
| Payment pending | Lock duplicate submission; keep preview visible; do not optimistically change balances or due. |
| Payment success | Receipt announces one real-money change and linked records, then returns to refreshed detail. |
| Archived card | Historical facts remain readable; normal payment/purchase actions hidden unless recovery through review is approved. |

### Loans

| State | Required presentation and action |
|---|---|
| No loans | Explain no current obligations; one create action. |
| Active loan | Recorded-principal caveat, next due, repayment CTA, schedule/history. |
| Payment due | Next total/date lead; principal/interest/known fee explain total. |
| Payment success | Receipt shows exact source, cash delta, obligation delta, split, and linked records. |
| Early payoff preview | Estimate-only label, as-of date, components/unknowns, no money action. |
| Completed loan | No repayment CTA; retained schedule/payment/rate history and archive action. |
| Rate change effective future period | Old/new periods visible; only future unpaid schedule differs. |

## Component reuse rule

Use the existing implementation first: `Page`, `Section`, `BottomActionBar`, `CreditCardCard`, `LoanCard`, `Amount`, `Balance`, `TransactionRow`, `Dialog`, `EmptyState`, `ErrorState`, and `Skeleton`.

The canonical design system names `MoneySummary`, `BalanceRow`, `FinancialPreview`, `MoneyMovementPreview`, `ConfirmDialog`, `SuccessState`, `ScheduleRow`, and `LoanSummary`, but those exact exports do not currently exist. Implement the minimum route-local composition from existing primitives for this flow. Promote a shared abstraction only after genuine reuse; do not create speculative shared components.

All visible copy belongs in the English and Vietnamese message catalogs. Use semantic design tokens only. Meet WCAG AA, 44px targets, logical focus order, screen-reader amount/date meaning, safe-area behavior, and usable light/dark presentation at 390px and 440px.

## Acceptance criteria

### Cards

- Money Cards overview and account-owned card detail work without navigating to the Cards compatibility redirects.
- Remaining due is derived from the approved billing-period source and rendered with statement, paid, and due date.
- One card-payment happy path creates one linked liability-payment movement, changes the source balance once, applies payment once, and shows a receipt.
- Card payment is not classified as income or expense and does not duplicate purchase spending.
- Card activity and card-origin installment context are visible without creating a Loan.
- Archive preserves history and cannot hide unresolved due silently.

### Loans

- Loans overview/detail, repayment schedule, and repayment history work.
- Regular payment preview and receipt match the persisted principal/interest/known-fee split and exact total.
- Regular payment changes source balance once, principal once, and creates exactly one transaction plus one linked loan-payment record.
- Early payoff is estimate-only and never closes or pays the loan in this phase.
- Future rate update changes only future unpaid periods and preserves paid entries, payments, and prior rate history.
- Completed/archived loans remain historically readable.

### UI and safety

- Main flows render in English and Vietnamese, in light and dark mode, without critical breakage at 390px and 440px.
- No hardcoded user-facing strings, domain values, routes, or colors are introduced.
- Real-money failures are atomic and duplicate-safe.
- No historical financial fact is silently edited.

## Minimal test plan

1. `npm run typecheck`.
2. `npm run lint`.
3. Focused unit/integration tests for card billing/payment, loan amortization/rate boundaries, and money-product mapping.
4. Authenticated Playwright main paths only.

Cards browser cases:

- Money Cards overview -> card detail.
- Statement/due presentation.
- One card payment preview -> confirm -> receipt.

Loans browser cases:

- Loans overview -> detail -> schedule/history.
- One regular payment preview -> confirm -> receipt.
- Early-payoff estimate with no mutation.
- Future rate change preview -> confirm for a supported floating loan.

For each `REAL_MONEY` test, capture before/after source balance, liability/principal, relevant transaction count, linked payment count, and schedule/billing state. Assert the exact delta, correct component semantics, one transaction, one linked payment, and no duplicate movement.
