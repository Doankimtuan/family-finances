# ViNha Transactions Track — 09P0 Financial Integrity & Privacy Gate

Date: 2026-08-20  
Scope: P0 financial integrity, ownership, privacy, and local-date corrections only.  
Verdict: **PARTIAL — code and application tests pass; database/RLS/browser authenticated verification remains environment-blocked.**

## A. Scope and non-goals

Implemented 09P0 only. No 09B visual redesign, search/filter work, new transaction product UI, or unrelated product redesign was started.

## B. Root causes addressed

- Generic correction/refund previously inferred eligibility from `type` and status alone.
- Credit-card ledger creation and billing assignment were separate application writes.
- Loan payment stored principal and interest in one ledger row.
- Transaction detail sign logic treated every non-expense as positive.
- Audit strings, previews, confirmation summaries, and receipts could interpolate raw money values.
- Server-side date defaults used UTC rather than the household timezone.

## C. Canonical capability and semantic model

`modules/ledger/application/financial-semantics.ts` now owns transaction owner, display direction, home contribution, spending classification, and generic correction/refund capabilities. It handles ordinary ledger events, transfers, savings markers, card-owned income/expense, loan interest, debt, investment, and reversal/correction links.

All persisted ledger types have an exhaustive capability test. `loan_interest` is classified as loan-owned expense/outflow and is not generically correctable/refundable.

## D. Generic correction and refund gate

Application commands now load the original row and consult the canonical capability model before calling the RPC. Direct correction/refund pages use the same model. The RPCs independently enforce household membership, ordinary income/expense ownership, status, link, savings, and credit-card exclusions.

## E. Credit-card atomicity

Migration `20260820042411_transactions_financial_integrity_gate_09p0.sql` adds `record_card_transaction`. It records the ledger/inbox row and card billing month/item in one security-definer transaction, preserving idempotent replay behavior and database-side credit-limit enforcement. The application no longer performs a second billing write after recording the ledger transaction.

## F. Loan payment classification

`record_loan_payment` now emits separate `liability_payment` principal and `loan_interest` interest rows, links both through `loan_payment_id`, and updates the aggregate loan payment/schedule atomically. Fee remains zero because the current schema has no loan-fee component.

## G. Local-date correctness

`todayIsoDate()` now formats in the household Vietnam timezone. Refund application defaults use this helper; correction preserves the original transaction date; card and loan RPC defaults use the same timezone.

## H. Privacy boundary

- `FinancialValue` no longer marks masked output `aria-hidden`, so assistive technology receives the mask rather than the raw value.
- `ConfirmSummary` and `TransactionReceipt` fail closed: unclassified legacy rows are masked, while explicit financial rows continue through `FinancialValue`.
- Transaction audit-chain amounts use rich translations with `FinancialValue` components.
- Capture and transfer previews, capture account-effect receipts, and refund maximum guidance no longer expose raw interpolated money values.

## I. UI and direction semantics

Transaction detail uses canonical semantic direction/sign and capability state. Card-owned and product-owned actions are hidden/blocked from direct routes. No visual redesign was performed, consistent with the 09P0 brief.

## J. Database/security changes

The migration adds the loan-payment link, expands the transaction type constraint for `loan_interest`, replaces generic refund/correction RPC bodies with ownership guards, adds the atomic card RPC, replaces the loan payment RPC, and revokes/grants RPC execution explicitly to `authenticated`.

## K. Tests and checks

Passed:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test -- --run` — 128 files, 966 tests
- focused financial semantics/privacy/integration tests
- `git diff --check`

The full test suite retains pre-existing warning output from HeroUI test rendering and fail-closed Supabase mocks; no tests failed.

## L. Browser verification

Started the app and navigated `/en/money/transactions` with Playwright. The route correctly redirected to `/en/login`. The public shell was inspected at 390, 440, 768, and 1280px. Authenticated transaction screens could not be exercised because the local environment has no authenticated fixture/database.

## M. Blocked verification

`supabase db lint --local --level error --fail-on error` could not connect because Postgres is not running on `127.0.0.1:54322`. The ownership harness reports no controlled admin/partner test identities. Therefore migration execution, RPC behavior against Postgres, and RLS adversarial tests remain unverified here.

## N. Changed-file groups

- Ledger semantics, constants, row mapping, commands, and queries.
- Card/loan/refund/correction migration.
- Local-date and privacy primitives.
- Transaction detail and preview privacy wrappers.
- Financial semantics/privacy regression tests.

## O. Follow-up before release

Run the migration against a disposable Supabase database, execute RPC security and rollback tests for card/loan/generic actions, seed controlled ownership identities, and repeat authenticated browser checks for detail, correction, refund, card capture, loan payment, dark mode, and reduced motion.

## P. Final verdict

**PARTIAL.** The implementation and application-level regression suite are green. Release sign-off is blocked only by missing local database/auth test infrastructure and the resulting inability to prove migration/RPC/RLS behavior in this environment.
