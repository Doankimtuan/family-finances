# Debt Track — 10A: UX/UI + Financial Semantics Audit

Audit-only review completed. No production code was modified.

## Scope and evidence

Reviewed:

- Debt list/overview, detail, create sheet, payment sheet, and payment history.
- Debt domain mapping, progress and due-state derivation, server actions, account queries, and Supabase Debt RPCs.
- Financial semantics, Home metric selectors, Transaction activity mapping, and the 09P0 transaction integrity migration.
- Empty, loading, error, offline, privacy, ownership, accessibility, and motion behavior.
- Live browser UI at `/en/money/debts` and the seeded Debt detail at 390px, 440px, 768px, and 1280px, in light and dark modes; Vietnamese list/detail were also inspected.

Live seeded record observed: one borrowed household record, `₫111,111,111` principal, `₫1,111` paid, `₫111,110,000` remaining.

## Executive verdict

The financial classification foundation is sound for the current informal-principal Debt model. Borrowing, lending, and principal settlement are represented as neutral cash movements, not ordinary income or expense. Idempotent atomic RPCs also prevent a retry from creating a second Debt or payment.

The experience is not ready for implementation sign-off. Two P0 issues must be handled first: the account picker and RPC can target the internal `Savings Products` account, and successful financial mutations do not give the user a transaction receipt or a route to verify the resulting ledger record. The current Debt surface is also create-only, privacy-incomplete, and weak on load/error/recovery states.

## What currently passes

### Borrowed vs lent and principal semantics

The model distinguishes `borrowed` and `lent`, derives separate payable/receivable totals, and derives paid/received progress from principal minus remaining amount (`modules/ledger/application/debt-domain.ts:236-250`).

The canonical event table is correct:

- `debt_borrowing`: cash inflow, non-income.
- `debt_lending`: cash outflow, non-expense.
- `debt_receivable_payment`: cash inflow, non-income.
- `liability_payment`: cash outflow, non-expense.
- `loan_interest`: expense, when the Loan domain owns the interest event.

Evidence: `modules/ledger/application/financial-semantics.ts:207-275`, `modules/ledger/application/transaction-activity.ts:90-99`, and the existing Debt/financial-semantics unit tests.

No current code path was found that counts Debt principal as Home income or expense. This satisfies:

| Event                        | Home/ordinary metrics                               | Cash position | Debt state                                 |
| ---------------------------- | --------------------------------------------------- | ------------- | ------------------------------------------ |
| Borrowed principal           | Neutral                                             | Inflow        | Remaining liability increases              |
| Lent principal               | Neutral                                             | Outflow       | Remaining receivable increases             |
| Borrowed principal repayment | Neutral                                             | Outflow       | Remaining liability decreases              |
| Lent principal received      | Neutral                                             | Inflow        | Remaining receivable decreases             |
| Interest/fee                 | Expense only where an explicit expense event exists | Outflow       | Must not be silently folded into principal |

### Due and completion derivation

Due state is derived from `dueDate`, `today`, active status, and remaining amount. It supports upcoming, due soon, due today, overdue, no due date, and completed (`modules/ledger/application/debt-domain.ts:253-275`). Completed state is retained as Debt history; there is no hard-delete UI.

### Payment safety already present

The payment flow has a form step, account/date/amount validation, a review step, an idempotency key, an atomic RPC, an amount ceiling against remaining principal, and a completion result. The database writes the transaction and `debt_payments` row before updating remaining amount (`supabase/migrations/20260814004248_rebuild_debts_domain.sql:330-441`).

### Responsive and accessibility baseline

The live UI preserves the intentional centered 440px shell at wider viewports. At 390px the list, detail, and sheets remain one-column and usable; primary actions are reachable in the sheet footer. The browser snapshot exposed named headings, links, buttons, radiogroups, progressbars, and a payment dialog. Motion is limited to shared reveal/step primitives rather than animated money values.

## P0 — financial integrity and trust blockers

### P0-1 — Internal `Savings Products` is selectable as a Debt source/destination

The Debt page passes every result from `listAccounts()` into the create and payment pickers (`app/[locale]/(product)/money/debts/page.tsx:65-69`; detail equivalent at `app/[locale]/(product)/money/debts/[id]/page.tsx:86-89`). `listAccounts()` excludes only credit cards (`modules/ledger/application/queries/list-accounts.ts:24-35`). In the live browser, the repayment picker visibly offered `Cash`, `E2E Transfer Dest`, and `Savings Products`.

The database RPC repeats the same weak guard: both creation and payment reject `credit_card` but accept `savings_product` (`supabase/migrations/20260814004248_rebuild_debts_domain.sql:168-176` and `345-354`). `savings_product` is an internal product account, explicitly excluded from the liquid account set in `modules/ledger/application/account-constants.ts:28-35` and excluded by other product RPCs.

Impact: a Debt borrowing/lending or principal settlement can be posted against an internal savings-product ledger account. That makes the source/destination story untruthful and can contaminate product-account accounting. This is a financial-integrity issue, not just a picker-filter bug.

Required fix sequence:

1. Define one canonical eligible Debt movement account policy from the existing liquid-account contract.
2. Apply it to list/create/payment UI data.
3. Enforce it again inside `create_debt` and `record_debt_payment` so direct RPC calls cannot bypass the UI.
4. Add regression coverage proving `savings_product` and credit-card accounts are rejected while liquid household accounts work.

### P0-2 — Financial mutations have no visible receipt or transaction verification path

Money-moving Debt creation submits directly from the sheet and closes after refresh (`app/[locale]/(product)/money/debts/debt-create-sheet.tsx:114-142`). There is no consequence preview or post-save receipt for the generated `debt_borrowing`/`debt_lending` transaction.

Payment confirmation is safer because it previews amount, account, date, and remaining-after-payment, but a successful result is discarded and the sheet simply closes and refreshes (`app/[locale]/(product)/money/debts/[id]/debt-payment-sheet.tsx:146-166`). The server result includes `transactionId` and `paymentId` (`modules/ledger/application/commands/debt-commands.ts:168-182`), yet the UI does not show either, link to Transactions, or identify the account movement as the canonical ledger record.

Impact: users cannot verify whether the real transaction was created, which account moved, or that the event was neutral to Home income/expense. This violates the product’s preview/receipt contract for consequential multi-domain actions and makes a correct atomic write feel invisible.

Required behavior:

- Money-moved creation: preview direction, principal, source/destination account, date, and the fact that it is not income/expense before commit.
- Debt payment: keep the review step, then show a receipt containing direction, amount, source/destination account, date, remaining balance, completion state, and a link to the related Transaction.
- Preserve idempotent replay messaging without creating a second receipt that implies a second movement.

## P1 — UX, semantic clarity, and state issues

### P1-1 — Add/Edit contract is incomplete: there is no Edit Debt path

The canonical IA defines Debt create and detail, but the current implementation only exposes `DebtCreateSheet`; there is no edit route, edit action, update schema, or update command. The detail page exposes only payment or completed text (`app/[locale]/(product)/money/debts/[id]/page.tsx:175-201`).

Users cannot correct a counterparty typo, due date, note, direction mistake, or ownership scope without creating another record. Adding a generic delete would be unsafe; history should remain immutable unless the domain explicitly supports a safe correction/archive operation.

Implementation should separate editable descriptive fields from financial facts. Direction, creation mode, principal, and any existing origin transaction require explicit policy before allowing edits. Completed records should not be silently reopened.

### P1-2 — Interest and fee semantics are not represented or explained

Debt supports principal, paid, remaining, due date, and note, but no interest or fee fields exist in the Debt schema/domain (`modules/ledger/application/debt-constants.ts`, `modules/ledger/application/debt-domain.ts:26-43`, `modules/ledger/application/commands/debt.schemas.ts`). Payment is explicitly principal-only.

This is safe only if informal Debt is intentionally principal-only. The UI does not say that. A user with an interest-bearing or fee-bearing obligation has no clear boundary between “Debt” and “Loan”, and no way to record interest/fees as expenses without manually leaving the Debt flow.

Decision required before 10C/10D: either state clearly that Debt is principal-only and route scheduled/interest-bearing obligations to Loans, or add explicit expense components without folding them into principal. Never make interest/fees increase neutral principal silently.

### P1-3 — Privacy mode does not cover Debt amounts

The shared `FinancialValue` masks money when privacy mode is enabled (`shared/patterns/financial-value.tsx:8-25`), and Transactions/Home use it. Debt list summary, active rows, history rows, and detail amounts call `formatCurrency` directly (`app/[locale]/(product)/money/debts/page.tsx:112-129`, `202-208`, `257-264`; detail `:134-171`).

Impact: turning on financial privacy hides other financial surfaces but leaves Debt principal, paid, and remaining amounts visible. This is especially sensitive because Debt is relationship data.

### P1-4 — Read failures are collapsed into empty/not-found states

`listDebts`, `getDebt`, and `listDebtPayments` all return `null` for permission, not-found, and query failures (`modules/ledger/application/queries/debt-queries.ts:17-50`, `55-94`, `97-130`). The list maps `null` to a generic error, but detail maps a missing Debt to “Debt not found”, and payment-history `null` becomes an empty array (`app/[locale]/(product)/money/debts/[id]/page.tsx:50-85`).

Impact: an outage can be presented as “not found” or “no payments”, which is misleading and can prompt duplicate manual recording. Use typed read results with distinct `not_found`, `forbidden`, and `error` states; preserve known detail facts when only history fails.

### P1-5 — Loading, retry, and offline behavior are incomplete

There is no Debt-specific `loading.tsx`; the list has no skeleton preserving summary/row shape. The list error is a generic danger alert without retry. The offline banner is present and create/payment buttons fail closed, which is good, but read-only offline behavior is not explicit and no recovery/retry action is exposed.

Required states:

- List loading skeleton with summary and row shapes.
- List retry state that preserves the route and filters.
- Detail object-load error with a safe route back to Debts.
- Payment-history partial error that does not pretend history is empty.
- Offline read-only banner stating that review is available but financial mutations are blocked.

### P1-6 — Detail hierarchy omits important Debt facts and source context

The live detail shows counterparty, direction, ownership, remaining, paid progress, original amount, and payment history. It does not show start date, explicit due-date fact when no badge is rendered, creation mode, origin account, origin transaction, or note. The result is a visually clean card but an incomplete audit trail for a financial object.

The payment history shows an account name and signed movement, but not a link to the related Transaction even though `DebtPayment.transactionId` is loaded (`modules/ledger/application/debt-domain.ts:45-55`).

### P1-7 — Debt list urgency is too generic

The list calculates overdue and due-soon counts, but the alert only says “{count} records need attention” (`app/[locale]/(product)/money/debts/page.tsx:63-64`, `133-138`). It does not distinguish overdue from due soon or show the next due date in the overview summary. The card-level badge is useful, but the overview does not help users prioritize across multiple records.

### P1-8 — Copy and data model duplicate “name” and counterparty concepts

The create action sends the same value for both `name` and `counterparty` (`app/[locale]/(product)/money/debts/debt-create-sheet.tsx:120-123`). The UI asks only “Who do you owe?”/“Who owes you?”, while the detail title renders the counterparty. This leaves the stored `name` concept unexplained and makes the old `Name`/`Counterparty` translation keys stale or misleading.

Choose one clear identity model for informal Debt: either a single human-readable title plus counterparty, or one counterparty field with no duplicate name. Keep the UI copy sentence-case and avoid exposing database terms such as “liability”.

### P1-9 — Account loading failure can produce an unusable payment form

If `listAccounts()` returns `null`, both create and payment flows receive an empty account list without a specific account-load error. The primary action remains visible until the user discovers the selector has no options. This needs an explicit “accounts unavailable; retry” state and a disabled submit reason.

## P2 — Polish and consistency

- The active Debt row uses the default Card tone inside a link rather than the shared `interactive` tone, so its hover/press affordance is weaker than other product rows (`page.tsx:155-161`).
- The detail and overview repeat the same semantic facts in separate cards without a compact “at a glance” distinction; retain one dominant remaining amount and move supporting facts into a lighter fact list.
- Due-date badges omit the year, which is acceptable for near-term dates but ambiguous for long-lived Debt records.
- Vietnamese copy is generally present and readable, but the seeded payment history renders the account name `Cash` untranslated. Catalog/system account names should use the existing localization helper or be explicitly treated as user-created names.
- Empty state is calm and specific, but its only actionable control is the separate top “Add record” button; the empty state itself does not own the one next action described by the design contract.
- Keep current restrained motion. Do not animate money values or overdue warnings. Verify MotionReveal/MotionStep with reduced motion enabled after the flow is rebuilt.

## State audit matrix

| Surface     | Ready                                            | Empty                                       | Loading                        | Error                                                                        | Offline                                                 | Privacy                                                             |
| ----------- | ------------------------------------------------ | ------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| Debt list   | Present; summary + active/history rows           | Present; action is separate from EmptyState | Missing Debt-specific skeleton | Generic alert; no retry                                                      | Banner + create disabled; read-only guidance incomplete | Amounts unmasked                                                    |
| Debt detail | Present; remaining/progress/history              | Payment history empty copy                  | Missing detail skeleton        | Not-found can mask read failure                                              | Banner + payment disabled                               | Amounts unmasked                                                    |
| Add Debt    | Present; direction, ownership, principal, timing | Not applicable                              | Submit pending state present   | Inline/generic mutation alert                                                | Save disabled                                           | Form amount should follow privacy contract where applicable         |
| Edit Debt   | Missing                                          | Not applicable                              | Missing                        | Missing                                                                      | Missing                                                 | Missing                                                             |
| Payment     | Form + review + pending state                    | Not applicable                              | Pending state present          | Inline/generic mutation error; edits are retained only within the open sheet | Review/submit blocked                                   | Review amounts use `Amount`/`ConfirmSummary`; receipt still missing |

## Accessibility and motion assessment

Passes observed:

- 44px-class primary controls and sheet footer actions.
- Named dialog, headings, links, direction/ownership choices, progressbar labels, and visible focus outlines.
- Direction-specific labels make “repay” versus “receive” understandable.
- Shared motion primitives are used rather than ad hoc animation; the current experience does not animate financial values.

Needs verification in implementation:

- Full keyboard traversal through ChoiceTile, SelectField, DatePickerField, sheet footer, and confirmation step.
- Error association and focus movement for amount/account/date validation.
- Screen-reader announcement of mutation pending, success receipt, and failure without relying on a toast.
- Reduced-motion behavior at 390px and 440px in both themes.
- Privacy toggle coverage for every Debt amount and accessible state change announcement.

## Transaction integration after Transactions 09P0–09F

### Confirmed correct

- Debt transactions use dedicated ledger types and are included in the transaction type constraint (`supabase/migrations/20260820052850_transactions_financial_integrity_gate_09p0.sql:9-29`).
- The Transaction activity mapper recognizes borrowing, lending, and Debt receipt events and marks them as Debt-owned (`modules/ledger/application/transaction-activity.ts:90-99`, `160-190`).
- Dedicated Debt/Loan events are not generic-correctable or generic-refundable, preventing the ordinary transaction editor from breaking product-owned history.
- Home/monthly selectors consume the shared financial semantics and therefore exclude principal Debt movements from ordinary income/expense totals.

### Missing integration experience

- Debt mutation results contain `transactionId`, but Debt UI does not expose it.
- Payment history contains `transactionId`, but rows are not links.
- There is no explicit receipt proving “cash moved, debt balance changed, ordinary income/expense unchanged”.
- The Transaction list can show a product event, but there is no Debt-to-Transaction back-link or Debt context in the Debt detail receipt.

### Required invariants for implementation tests

1. Borrowed principal increases the selected liquid account and does not increase Home income.
2. Lent principal decreases the selected liquid account and does not increase Home expense.
3. Borrowed principal repayment decreases the selected liquid account and does not increase Home expense.
4. Lent principal receipt increases the selected liquid account and does not increase Home income.
5. Interest/fee, if introduced, is a distinct expense event and never part of neutral principal.
6. A Debt action cannot target credit-card or internal savings-product accounts.
7. A retry with the same idempotency key creates one Debt/payment, one transaction, and one history row.
8. A completed Debt remains readable and linked to its immutable payment/transaction history.
9. Generic Transaction edit/refund/correction cannot mutate Debt-owned events.
10. Home, Transactions filters, account balances, and Debt remaining all agree after a payment.

## Recommended implementation plan

### 10B Debt List/Overview

- Fix the canonical eligible-account policy in the shared account query and both Debt RPC guards; add the P0 regression tests first.
- Add typed list read states, Debt-specific skeleton, retry/error state, and explicit offline read-only messaging.
- Wrap every overview/history amount in `FinancialValue`.
- Keep one primary summary: payable/receivable, overdue/due-soon breakdown, and next due context.
- Use the interactive row contract, retain 44px targets, and keep the 440px shell at every viewport.

### 10C Create/Edit Debt

- Decide and document the principal-only Debt versus interest-bearing Loan boundary.
- Add a safe Edit path for descriptive fields and dates; do not hard-delete or silently rewrite financial history.
- For money-moved creation, add a preview-confirm step with source/destination, direction, amount, date, and neutral-metric explanation.
- Return a receipt after creation, including the generated Transaction link when `creationMode` is `money_moved`.
- Preserve ephemeral create-form reset behavior; edit forms should reopen from persisted values.

### 10D Debt Detail + Payment

- Rebuild the detail fact hierarchy: remaining first, principal/paid, due state/date, start date, note, origin account/transaction, and ownership.
- Keep direction-specific repayment/receipt language and source/destination account labels.
- Preserve the existing review step, add a success receipt, show completion explicitly, and link every payment row to its Transaction.
- Model partial history failure separately from empty history; localize account display names where appropriate.
- Add privacy, keyboard, screen-reader, dark/light, and reduced-motion checks around the sheet and receipt.

### 10E Final Quality Gate

- Run focused domain/semantic tests plus the full repository lint, typecheck, and test commands.
- Verify no double counting across Debt, Transactions, account balances, Home metrics, and filters.
- Browser evidence at 390px, 440px, 768px, and 1280px in English/Vietnamese, light/dark, loading/empty/error/offline/privacy, and reduced motion.
- Verify no hard-delete path exists for Debt or payment history.
- Run the final changed-file refactor review and confirm only the intended implementation/report files changed.

**Audit disposition:** stop after 10A. Do not implement until P0-1 and P0-2 are resolved in the first implementation batch.
