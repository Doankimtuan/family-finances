# Loans Track — 11A: UX/UI + Financial Semantics Audit

Status: Audit and implementation planning only  
Date: 2026-08-21  
Scope: Loans list/overview, detail, create/edit, principal/interest/fees, schedule, payment, due/overdue/completed states, account integration, Transactions/Home classification, privacy, loading/error/offline states, responsive behavior, themes, accessibility, and reduced motion. No production code was modified.

Evidence base:

- Source under `app/[locale]/(product)/money/loans`, `modules/ledger/application`, `modules/home/application`, related transaction queries/semantics, and loan migrations.
- Canonical Information Architecture, UX redesign, design-system, motion, and project instructions.
- Authenticated local browser session using `.env.local` at `http://localhost:3000`.
- Browser checks: `/en/money/loans` empty state and Add loan form; `/en/money/loans/{invalid-id}` not-found state; 390px and 440px viewport checks; light and dark theme checks; no horizontal overflow.
- Loan fixture was not available in the authenticated household, so populated detail/payment/overdue screens were source-audited and remain a required 11E browser gate.

## Executive result

The core principal/interest classification is sound for one successful scheduled payment, and client-visible hard delete is blocked. The Loans track is not ready for implementation polish because three P0 integrity gaps can make retries or fees disagree with the rest of the ledger.

| Priority               | Count | Outcome                                |
| ---------------------- | ----: | -------------------------------------- |
| P0 financial integrity |     3 | Must precede UI implementation         |
| P1 UX/state issues     |    12 | Fix in the named implementation tracks |
| P2 polish              |     2 | Final quality pass                     |

## Financial invariants

| Rule                                                    | Current result                                | Evidence / risk                                                                                                                                                                                                                                                               |
| ------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Borrowed principal ≠ Income                             | Pass for current tracking-only loan model     | Loan creation creates the loan and schedule only; it does not emit an income transaction. The UI explicitly says the loan is separate from account balances. There is no supported opening-cash movement if borrowed proceeds should enter an account.                        |
| Principal repayment ≠ Expense                           | Pass                                          | `LIABILITY_PAYMENT` is `NON_EXPENSE_OUTFLOW`, excluded from Home expense and spending.                                                                                                                                                                                        |
| Interest = Expense                                      | Pass for scheduled interest                   | `LOAN_INTEREST` is `EXPENSE`, included in Home expense/spending.                                                                                                                                                                                                              |
| Fees = Expense where applicable                         | **Fail / unsupported contract**               | No fee field exists in schedule/payment persistence; the detail page sets `feeDue = 0`, the RPC returns `feePaid: 0`, and the payment split constraint only contains principal + interest. See P0-03.                                                                         |
| One payment does not double count principal + interest  | Pass for one successful call                  | The RPC inserts separate principal and interest transaction rows, both debiting the same source account once in `applyTransactionDeltas`; principal is neutral to Home and interest is expense. Transaction history can look duplicated because the two rows are not grouped. |
| Account balance, loan balance, Transactions, Home agree | Pass only for one successful call with no fee | The RPC updates the loan and creates both ledger rows atomically; account balance applies both debits; Home uses the centralized semantic classification. Retry and fee gaps break this guarantee.                                                                            |
| Retries are idempotent                                  | **Fail**                                      | Payment and create inputs have no idempotency key or replay path. Row locks serialize concurrent calls but do not identify a committed request replay. See P0-01 and P0-02.                                                                                                   |
| Financial history cannot be hard-deleted unsafely       | Pass                                          | Authenticated delete on `loans` is revoked; payment transactions reference `loan_payments` with `on delete restrict`; the UI exposes archive/status actions rather than delete.                                                                                               |

## P0 — financial integrity

### P0-01 — Scheduled payment retries can post a second payment

Evidence: [`recordLoanPaymentInputSchema`](../../modules/ledger/application/commands/loans.ts:250) accepts only loan, account, mode, and date; the RPC call passes those four values ([`loans.ts`](../../modules/ledger/application/commands/loans.ts:279)). The database function has no request key or replay lookup ([`09p0 migration`](../../supabase/migrations/20260820052850_transactions_financial_integrity_gate_09p0.sql:389)). It locks the next schedule row, posts the payment, and marks it paid ([same migration](../../supabase/migrations/20260820052850_transactions_financial_integrity_gate_09p0.sql:421)), but a network retry after commit selects the next upcoming row.

Impact: a user can see one payment submission produce two schedule payments, two principal reductions, multiple transaction rows, and divergent Home/account/loan totals.

Required direction: add a client-generated idempotency key to the command/RPC, persist it with a unique household scope, and return the original result on replay. Keep the entire split, payment aggregate, schedule update, loan update, and receipt payload in one transaction.

### P0-02 — Loan creation retries can create duplicate loans and schedules

Evidence: [`createLoan`](../../modules/ledger/application/commands/loans.ts:105) validates and calls `create_loan_with_schedule` ([`loans.ts`](../../modules/ledger/application/commands/loans.ts:183)) without an idempotency key or replay contract.

Impact: a timeout after a successful commit can leave duplicate financial obligations with identical user-entered terms.

Required direction: reuse the same idempotency pattern as other money-product mutations, scoped to the household and operation, and return the original loan ID on replay. Do not use name/date heuristics.

### P0-03 — Fees are displayed but cannot be represented or classified

Evidence: the detail page hardcodes [`feeDue = 0`](<../../app/[locale]/(product)/money/loans/[id]/page.tsx:126>), the payment RPC always returns `feePaid: 0` ([`09p0 migration`](../../supabase/migrations/20260820052850_transactions_financial_integrity_gate_09p0.sql:493)), and the persisted split constraint is only principal + interest ([`loan_payments` migration](../../supabase/migrations/20260804100958_loan_domain_evolution.sql:223)). The payment UI still renders a Fee row ([`loan-pay-action.tsx`](<../../app/[locale]/(product)/money/loans/[id]/loan-pay-action.tsx:210>)).

Impact: any applicable origination fee, late fee, or payment fee is either silently omitted or presented as zero. Account balance, loan payment history, Transactions, and Home Expense cannot agree on the real cash movement.

Required direction: before 11D, choose one explicit product contract: model fees as a first-class expense component with atomic transaction linkage and tests, or remove fee language from the Loans flow until fees are supported. Never display a zero fee placeholder as if it were verified.

## P1 — UX and state issues

### P1-01 — Due and overdue states are not modeled

Schedule statuses are only `upcoming`, `paid`, `partial`, and `waived` ([`loan-constants.ts`](../../modules/ledger/application/loan-constants.ts:1)); the list renders only “next due” and the detail groups upcoming/partial versus paid/waived ([`page.tsx`](<../../app/[locale]/(product)/money/loans/[id]/page.tsx:104>)). No due-today/overdue calculation or warning is exposed. `defaulted` is an available loan status, not a derived schedule state. Add explicit, localized due/overdue semantics without changing the amortization math.

### P1-02 — Partial schedule support is inconsistent with payment behavior

The read model treats `partial` as actionable, but the scheduled payment RPC always pays the selected entry in full and changes it to `paid` ([`09p0 migration`](../../supabase/migrations/20260820052850_transactions_financial_integrity_gate_09p0.sql:429)). The aggregate/list logic counts upcoming entries but not partial entries. Either implement partial amount allocation or remove the partial state from the user-facing contract until it is real.

### P1-03 — Read failures can look like valid empty data

The list maps `null` to an error alert but uses the empty title and has no retry ([`loans/page.tsx`](<../../app/[locale]/(product)/money/loans/page.tsx:45>)). Detail maps nullable schedule, payment, rate, and account results to empty arrays and returns the same “Loan not found” surface for missing data and read failure ([`loans/[id]/page.tsx`](<../../app/[locale]/(product)/money/loans/[id]/page.tsx:77>)). Payment history disappears entirely when empty ([`loan-detail-panels.tsx`](<../../app/[locale]/(product)/money/loans/[id]/loan-detail-panels.tsx:109>)). Add route-specific loading, error, retry, and explicit empty states; preserve a read-only offline state.

### P1-04 — Payment receipt and history expose only one of two ledger rows

The RPC creates a `liability_payment` transaction and a separate `loan_interest` transaction, then stores one coalesced `transaction_id` in `loan_payments` while linking both rows through `loan_payment_id` ([`09p0 migration`](../../supabase/migrations/20260820052850_transactions_financial_integrity_gate_09p0.sql:438)). The receipt and history link only the singular transaction ID ([`loan-pay-action.tsx`](<../../app/[locale]/(product)/money/loans/[id]/loan-pay-action.tsx:145>); [`loan-detail-panels.tsx`](<../../app/[locale]/(product)/money/loans/[id]/loan-detail-panels.tsx:149>)). Group the payment as one user event, disclose the principal/interest split, and link to the complete related transaction set so users do not mistake the two rows for two payments.

### P1-05 — Source/destination semantics are incomplete

Payment entry selects only a source account ([`loan-pay-action.tsx`](<../../app/[locale]/(product)/money/loans/[id]/loan-pay-action.tsx:94>)); the lender is only a text label and no destination/sink is recorded. Loan creation similarly has no opening source/destination account. Keep the current tracking-only model if intentional, but state clearly that it does not move borrowed proceeds into an account and that repayment destination is the lender/loan liability, not another user account.

### P1-06 — Loan list status and route model are underspecified

The list renders all returned statuses in one stream ([`loans/page.tsx`](<../../app/[locale]/(product)/money/loans/page.tsx:69>)), with no active/history grouping or filters. The canonical IA names `/money/products/loans*`, while the current route is `/money/loans`. Resolve the route migration and separate active, completed, archived, cancelled, and defaulted states without hiding history.

### P1-07 — Reducing-balance monthly label is misleading

The card always labels `loan.monthlyPayment` as a monthly amount ([`loans/page.tsx`](<../../app/[locale]/(product)/money/loans/page.tsx:95>)); for reducing balance, that is the first scheduled payment and later payments decline. Use “from … / first payment” or show the next scheduled total when that is the user decision point.

### P1-08 — Create form is long and lacks a mobile action strategy

The authenticated 390px form is a long inline surface; the initial viewport reaches only the principal section while Save is farther below. Source shows a single form with many conditional fields ([`create-loan-form.tsx`](<../../app/[locale]/(product)/money/loans/create-loan-form.tsx:205>)). The canonical mobile UX calls for progressive steps and a sticky action area for long loan forms. Preserve the existing fields and preview; change only task sequencing and action reachability.

### P1-09 — Edit forms do not discard abandoned local state

The metadata and interest edit actions use local state rather than a reset-on-open shared form. Closing and reopening can retain unsaved edits, contrary to the ephemeral action-form contract. Add a reset from persisted loan data on open/cancel and field-level validation feedback; do not alter the domain mutation rules.

### P1-10 — Payment controls do not follow the canonical control system

The payment flow uses the native-field `LabeledSelect` and `LabeledDateInput` for primary account/date input ([`loan-pay-action.tsx`](<../../app/[locale]/(product)/money/loans/[id]/loan-pay-action.tsx:1>)). The product constitution requires HeroUI v3/shared primitives for primary Select and Date/Time UX, with accessible labels, errors, and 44px targets. Resolve this in 11D, including keyboard focus and date semantics.

### P1-11 — Privacy masking is inconsistent across Loans

The shared `Amount`, confirmation summary, and receipt support financial privacy, but LoanCard and detail panels receive preformatted currency strings and render them directly ([`loan-card.tsx`](../../modules/ledger/ui/loan-card.tsx:72); [`loan-detail-panels.tsx`](<../../app/[locale]/(product)/money/loans/[id]/loan-detail-panels.tsx:83>)). The create preview also renders formatted amounts directly ([`create-loan-form.tsx`](<../../app/[locale]/(product)/money/loans/create-loan-form.tsx:139>)). Apply `FinancialValue` at the display boundary and verify hidden/revealed state in both themes and all loan steps.

### P1-12 — Transactions/Home context is technically correct but not explainable

Central semantics correctly classify principal as neutral and interest as expense ([`financial-semantics.ts`](../../modules/ledger/application/financial-semantics.ts:249)). Account balances subtract both debit rows through [`applyTransactionDeltas`](../../modules/ledger/application/queries/get-real-position.ts:84), so the invariant holds for one successful payment. The Transactions feed still receives two raw activity rows, while the loan model only returns one transaction ID ([`money-product-types.ts`](../../modules/ledger/application/money-product-types.ts:144)). Add loan-aware grouping/context and make the Home/Transactions treatment explicit in detail and receipt copy; do not relabel principal as Expense.

## P2 — polish

### P2-01 — Create defaults capture today once per module load

`DEFAULT_VALUES.startDate` is evaluated at module load ([`create-loan-form.tsx`](<../../app/[locale]/(product)/money/loans/create-loan-form.tsx:49>)). A long-lived client crossing midnight can reopen with yesterday’s date. Compute fresh defaults when opening/resetting the ephemeral form.

### P2-02 — Detail history has weak empty-state affordances

Payment and rate-history panels return `null` when empty ([`loan-detail-panels.tsx`](<../../app/[locale]/(product)/money/loans/[id]/loan-detail-panels.tsx:120>)), while schedule has a label. Give each section a compact explicit empty label and keep it distinct from a failed query.

## Browser and accessibility evidence

Authenticated browser evidence covered:

- `/en/money/loans`: empty list, tracked-money explanation, Add loan CTA, and inline create form.
- Create preview after entering a principal: monthly payment, total interest, total repayment, and loan end date.
- `/en/money/loans/00000000-0000-0000-0000-000000000000`: not-found state; it has Back to loans but no retry or missing-vs-read-error distinction.
- 390px and 440px widths: no horizontal overflow (`scrollWidth` matched `innerWidth`); the form is vertically long and Save is below the first viewport.
- Light and dark themes: contrast and control boundaries remained legible; the fixed bottom navigation remains present while the long form scrolls.
- Offline create CTA is disabled in source and the payment confirmation disables submit when offline. A full offline read-only detail state was not available with the empty fixture.

Required 11E verification remains: populated loan, payment success/retry, overdue, partial, completed, error/retry, privacy hidden/revealed, keyboard focus, reduced motion, English/Vietnamese, light/dark, and 390/440/768/1280px in a real browser.

## Implementation plan

### 11B — P0 integrity

1. Add idempotency keys and replay responses to loan create and payment mutations.
2. Make payment persistence return and retain the complete principal/interest transaction set.
3. Decide and implement the fee contract; enforce `amount = principal + interest + fee` everywhere, or remove unsupported fee UI.
4. Add invariant tests for retry replay, account balance, loan balance, Transactions classification, Home metrics, and delete/archive protection.

### 11C — List/Create

1. Resolve the canonical route and active/history status model.
2. Add loading, recoverable error/retry, empty, and offline read-only states.
3. Keep the existing amortization inputs but use progressive mobile steps, sticky actions, precise reducing-balance labels, privacy-safe values, and due/overdue semantics.

### 11D — Detail/Payment

1. Show explicit due, overdue, partial, completed, failed, and empty states.
2. Use shared HeroUI controls and reset edit/action forms on close/open.
3. Present source account, lender/destination semantics, complete payment split, grouped Transactions links, and idempotent receipt replay.

### 11E — Final Quality Gate

Run unit/integration checks plus authenticated Chromium evidence for populated and empty fixtures at 390, 440, 768, and 1280px; English/Vietnamese; light/dark; privacy hidden/revealed; keyboard/focus; reduced motion; offline/read-only; retry/reload; and completed/overdue/partial states. Confirm no production code changes beyond the approved implementation track and no hard delete path for financial history.
