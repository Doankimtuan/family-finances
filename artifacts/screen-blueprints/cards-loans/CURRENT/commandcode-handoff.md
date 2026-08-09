# CommandCode Handoff — Cards + Loans

## Mission

Implement one coherent Cards + Loans main-flow pass from this handoff without broad repository rereading. Preserve current routes and canonical financial contracts. Do not expand into provider integrations, automatic payment, detailed fees, lender-grade payoff quotes, route migration, or unrelated Money domains.

Read `blueprint.md` in this directory for the screen/flow detail. The constraints below are implementation gates.

## Required implementation sequence

### 1. Establish safe financial primitives before UI

Do not wire new confirmation UI to the current mutation behavior.

#### Card payment gate

Replace the current multi-write `settleCard` path with one atomic, idempotent Transactions-owned database operation that:

- validates membership, eligible real source, target credit card, amount, effective date, and approved overpayment rule;
- creates exactly one transaction-owned liability-payment movement that is not classified as income or expense;
- creates/preserves an explicit payment/application link to the card and affected billing period(s);
- applies the amount once in approved order and updates billing status in the same transaction;
- returns transaction ID, payment/application ID, source delta, applied amount, and remaining due;
- rolls back all changes on any error;
- returns an existing result for a repeated idempotency key.

The present source uses `TransactionDirection.EXPENSE`, a hardcoded note, a null idempotency key, then separate billing updates. Do not preserve those semantics. If the Transactions model lacks a liability-payment kind, add the minimum explicit ledger constant/schema mechanism at the documented domain-constant home before use; do not encode it as a route/UI magic string.

#### Loan repayment gate

Keep the existing atomic `record_loan_payment` shape for regular scheduled payment, but expose and verify its transaction/payment IDs and component split end to end. The operation must remain one transaction plus one linked `loan_payments` row and one principal update.

Do not treat principal as an ordinary consumption expense. The resulting transaction must retain repayment meaning through the approved Transactions-owned mechanism and its linked loan-payment record. Interest and a canonically stored fee may be cost components; do not fabricate a fee field or value.

#### Early-payoff gate

Disable/remove the current mutating `EARLY_PAYOFF` mode from the UI and do not call it from the phase implementation. The approved domain contract authorizes only `Estimate Early Payoff`:

- no source account;
- no transaction or loan-payment record;
- no schedule status update;
- no principal/status update;
- no completion Inbox item.

Do not use all future scheduled interest as “accrued interest.” Present a payoff estimate only when a canonical date-sensitive calculation source exists. Otherwise show recorded remaining principal plus explicitly unknown accrued interest/fee and state that a safe estimate is unavailable or incomplete. Never invent a formula.

#### Future-rate gate

Constrain rate updates to a future effective boundary on an unpaid period. In one atomic operation:

- preserve paid/waived entries and their payment links;
- preserve all loan-payment rows and splits;
- preserve prior rate-period history;
- append the new period and close the previous period at the boundary;
- rebuild only unpaid entries whose due/effective period is on or after the boundary;
- return a before/after future-schedule summary for the receipt.

Reject a past date, a paid-period boundary, a fixed-rate loan, an ineligible promo period, or an update that would rewrite historical periods.

### 2. Implement Cards within the existing route model

- Keep `/money/cards` and `/money/cards/[id]` redirect-only.
- Treat the Cards section in `/money` as the overview.
- Treat `/money/accounts/[id]` as card detail when account type is credit card.
- Do not add visible navigation to compatibility routes.
- Make remaining due/due date the card-detail hierarchy lead when a statement is open.
- Add card activity and card-origin installment presentation from existing billing-item/transaction links.
- Replace inline immediate payment with preview -> explicit confirm -> receipt.
- Keep create/edit/archive in the existing account-owned flow and preserve history.

The card-payment preview must identify amount, source account, target card, effective date, remaining due after, and resulting linked records. The receipt must say real money changed once and must not label the payment income or expense.

### 3. Simplify Loans surfaces

- On Loans overview, keep list orientation first and launch creation rather than rendering the long form above the list.
- On Loan detail, lead with recorded remaining principal, next total/date, and recorded-value caveat.
- Put regular payment in the primary action position.
- Show next schedule entry before later/paid entries.
- Show payment history with total, principal, interest, known fee if present, source, and linked transaction.
- Move metadata edit, future-rate update, complete/archive into secondary actions.
- Replace the payment/payoff toggle with a regular-payment flow plus a separate read-only payoff-estimate flow.

Regular-payment preview and receipt must show principal, interest, known fee, total cash outflow, source, loan/lender, date, remaining principal after, and linked records.

### 4. Add only main states and receipts

Cards: no cards, active, due/statement, payment pending, payment success, archived.

Loans: no loans, active, payment due, payment success, payoff estimate, completed, future-rate effective.

Use owner-specific error recovery. Pending UI must not apply optimistic money/due/principal changes. Money success is never toast-only.

## Exact current source boundary

### Cards UI and application paths likely to change

- `app/[locale]/(product)/money/page.tsx`
- `app/[locale]/(product)/money/money-hub-accounts.tsx`
- `app/[locale]/(product)/money/money-accounts-scan.tsx`
- `app/[locale]/(product)/money/accounts/[id]/page.tsx`
- `app/[locale]/(product)/money/accounts/[id]/credit-card-detail-actions.tsx`
- `app/[locale]/(product)/money/accounts/actions.ts`
- `modules/ledger/application/commands/settle-card.ts`
- `modules/ledger/application/credit-card-billing.ts`
- `modules/ledger/application/credit-card-types.ts`
- `modules/ledger/application/queries/list-credit-cards.ts`
- `modules/ledger/application/ledger-constants.ts` only if the required transaction/payment constant is missing
- `modules/ledger/application/index.ts` and `modules/ledger/application/client.ts` only for the changed typed API export
- one new forward-only Supabase migration for an atomic card-payment/payment-link mechanism
- `messages/en/money.json`
- `messages/vi/money.json`

Do not repurpose `app/[locale]/(product)/money/cards/page.tsx` or `app/[locale]/(product)/money/cards/[id]/page.tsx`; they remain compatibility redirects.

### Loans UI and application paths likely to change

- `app/[locale]/(product)/money/loans/page.tsx`
- `app/[locale]/(product)/money/loans/create-loan-form.tsx`
- `app/[locale]/(product)/money/loans/[id]/page.tsx`
- `app/[locale]/(product)/money/loans/[id]/loan-pay-action.tsx`
- `app/[locale]/(product)/money/loans/[id]/loan-edit-interest-action.tsx`
- `app/[locale]/(product)/money/loans/[id]/loan-close-action.tsx`
- `app/[locale]/(product)/money/money-products-actions.ts`
- `modules/ledger/application/commands/money-products.ts`
- `modules/ledger/application/loan-amortization.ts`
- `modules/ledger/application/money-product-types.ts` only if receipts need already-returned typed fields exposed
- `modules/ledger/application/ledger-constants.ts` only to remove/constrain the unsafe payoff mutation mode or add a required canonical value
- `modules/ledger/application/index.ts` and `modules/ledger/application/client.ts` only for changed typed exports
- one new forward-only Supabase migration to constrain repayment/payoff and make future-rate update history-safe
- `messages/en/money.json`
- `messages/vi/money.json`

Do not edit old migrations. Add a forward migration that replaces/constrains the RPCs safely.

### Shared components

Reuse these existing files before adding anything:

- `shared/patterns/page.tsx`
- `shared/patterns/section.tsx`
- `shared/patterns/bottom-action-bar.tsx`
- `shared/patterns/credit-card-card.tsx`
- `shared/patterns/loan-card.tsx`
- `shared/patterns/amount.tsx`
- `shared/patterns/balance.tsx`
- `shared/patterns/transaction-row.tsx`
- `shared/patterns/dialog.tsx`
- `shared/patterns/empty-state.tsx`
- `shared/patterns/error-state.tsx`
- `shared/ui/skeleton.tsx`

The design-system concepts `MoneySummary`, `BalanceRow`, `FinancialPreview`, `MoneyMovementPreview`, `ConfirmDialog`, `SuccessState`, `ScheduleRow`, and `LoanSummary` are not current exact exports. Compose the minimum route-local versions from existing primitives. Do not create all of them as speculative shared abstractions.

### Tests likely to change/add

- `tests/unit/credit-card-billing.test.ts`
- `tests/unit/loan-amortization.test.ts`
- `tests/unit/money-products.test.ts`
- `tests/e2e/money-hub.smoke.spec.ts`
- `tests/e2e/money-products.smoke.spec.ts`
- focused database/integration tests for the new atomic card-payment RPC, regular loan payment, payoff non-mutation, and future-rate history boundary, in the repository's existing test location

## Routes that must stay unchanged

- `/money` remains the visible Cards overview context.
- `/money/accounts/[id]` remains the credit-card detail path.
- `/money/cards` remains a redirect to `/money/loans` in the current compatibility contract.
- `/money/cards/[id]` remains a redirect to `/money/loans/[id]` in the current compatibility contract.
- `/money/loans` remains the current Loans list path.
- `/money/loans/[id]` remains the current Loan detail path.
- All code must use `APP_PATH`, `moneyAccountPath`, `moneyLoanPath`, `moneyTransactionPath`, and other existing route helpers; do not hardcode routes.

Canonical IA describes a later `/money/products/loans*` migration. That migration is explicitly outside this task.

## Canonical code that must remain authoritative

- Cards: `artifacts/current/domains/cards/implementation-contract/money-contract.md`, `action-contract.md`, `state-contract.md`, and the approved/modified product decisions.
- Loans: `artifacts/current/domains/loans/implementation-contract/money-contract.md`, `action-contract.md`, `state-contract.md`, and the approved/modified product decisions.
- Billing due source and statement application: typed card billing months and their approved remaining calculation.
- Loan schedule math: `modules/ledger/application/loan-amortization.ts`, after removing any use of future interest as accrued payoff interest.
- Route values: `modules/tenancy/application/app-path.ts`.
- Domain constants: `modules/ledger/application/ledger-constants.ts`; add missing values there first.
- Accounts/Transactions ownership and membership gate remain intact.

## Unrelated areas to leave untouched

- Plan, Jars, Goals, Recurring, Ritual, Calendar projections.
- Savings, Investments, Debts, Health, Together, tenancy policy, and Inbox flows except consuming an already-approved completion link returned by the loan operation.
- Provider feeds, statement parsing, reconciliation, rewards optimization, disputes, autopay, collateral, refinancing, and advisory analysis.
- `archive/legacy-v1` and deprecated Installment/Card aliases except removing direct unsafe use where this flow already imports one.
- Global navigation, route migration, shell redesign, and unrelated translations/tests.

## Main acceptance checks

### Card payment database check

Before:

- source balance `B`;
- card remaining due `D`;
- transaction count `T`;
- card-payment/application count `P`.

Action: confirm payment amount `A` with one idempotency key.

After:

- source balance is exactly `B - A` once;
- remaining due reflects exactly one approved application of `A`;
- transaction count is `T + 1`;
- payment/application count is `P + 1`;
- transaction is explicitly a card-liability payment, not income or expense;
- repeating the same idempotency key changes none of those counts/balances again.

Force an error after transaction staging and prove the whole operation rolls back.

### Regular loan payment database check

Before:

- source balance `B`;
- remaining principal `R`;
- next entry principal `p`, interest `i`, known fee `f` (zero only when canonically stored as zero);
- transaction/payment counts `T`/`P`.

Action: confirm one scheduled payment.

After:

- source is `B - (p + i + f)` exactly once;
- remaining principal is `R - p` exactly once;
- counts are `T + 1` and `P + 1`;
- the payment row links the transaction and preserves the split;
- the next schedule/status is correct;
- duplicate/retry does not create a second movement.

### Early-payoff estimate check

Before and after the estimate, assert identical source balance, principal, status, transaction count, payment count, and schedule states. Assert the UI says estimate/not lender quote and does not present future scheduled interest as accrued.

### Future-rate check

Capture paid entries, payment rows, prior rate periods, and future entries. Confirm a valid future change. Assert byte/value equality for paid/payment history, an appended rate period, and changes only to eligible future entries. Reject an effective date in historical or paid periods with no writes.

## Verification commands and browser evidence

Run:

```sh
npm run typecheck
npm run lint
npm test -- tests/unit/credit-card-billing.test.ts tests/unit/loan-amortization.test.ts tests/unit/money-products.test.ts
npm run test:e2e -- tests/e2e/money-hub.smoke.spec.ts tests/e2e/money-products.smoke.spec.ts
```

Use an authenticated real browser and retain evidence for:

- English and Vietnamese;
- light and dark mode;
- 390px and 440px widths;
- Cards overview/detail, due, and one payment happy path;
- Loans overview/detail, regular payment, payoff estimate non-mutation, and supported future-rate update;
- before/action/after database assertions for each real-money operation.

Do not mark the implementation complete if the browser cases pass but the database invariants fail, or if financial tests pass without preview/receipt and localized mobile UI evidence.
