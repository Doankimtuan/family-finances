# Debt 10B — P0 Financial Integrity & Receipt Gate

## Verdict

## DEBT P0 GATE PASS

Only the two P0 findings from Debt 10A were implemented. No Debt financial
classification was changed.

## P0-1 — Eligible movement accounts

Debt movement accounts now reuse the existing liquid-account contract:

- `ACCOUNT_TYPE_LIQUID_VALUES` remains the source list.
- `isLiquidAccountType` provides the shared typed membership predicate.
- `isDebtMovementAccountType` is the Debt policy entry point and delegates to
  the liquid-account predicate.
- `listAccounts()` now queries only the liquid account set instead of excluding
  only credit cards.
- Debt list/detail UI filters the account options through the same Debt policy.
- `createDebt` re-checks the selected account in the application command before
  calling the RPC.
- `recordDebtPayment` performs the same application-level re-check.

The new migration
`supabase/migrations/20260820144206_debt_p0_integrity_receipt_gate_10b.sql`
adds one SQL policy function for both RPC entry points. The public RPC names
now wrap the previous atomic implementations, reject non-liquid or archived
accounts, and delegate only after the account policy passes. The unchecked
internal function names are not executable by `public`, `anon`, or
`authenticated`.

Rejected account types include:

- `credit_card`
- `savings_product`
- any type outside the explicit liquid set: `cash`, `checking`, `savings`,
  `ewallet`, `brokerage`, `other`

## P0-2 — Preview, receipt, and transaction verification

### Money-moved Debt creation

The create flow now has a review step before commit showing:

- borrowed/lent direction;
- principal;
- the direction-aware account source/destination;
- effective date;
- resulting Debt meaning;
- explicit neutral-movement copy: principal is not ordinary Income/Expense.

After a successful money-moving create, the sheet stays open and shows a
receipt with direction, principal, account, date, remaining principal, and a
`View transaction` link built from the returned `transactionId`. The receipt
does not expose raw IDs. Existing-balance creation still closes after success
and does not invent a Transaction receipt.

Idempotent create replay is labeled as already recorded and does not imply a
second movement.

### Debt payment

The existing form → review flow remains intact. After commit, the sheet stays
open and shows a receipt with:

- repayment or received-payment direction;
- amount;
- source or destination account;
- effective date;
- remaining principal;
- completed state when remaining principal is zero;
- a `View transaction` link from the returned `transactionId`;
- a Done action.

The SQL wrapper enriches idempotent replays with the current remaining amount
and completion state. The UI labels replayed payments as already recorded and
does not imply a second payment.

Payment-history transaction links remain deferred to 10D as requested.

## Required invariants

| Invariant                                                               | Result                                                                                  |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Borrowed principal increases cash and leaves Home Income unchanged      | Pass; existing financial-semantics and account-balance tests remain green               |
| Lent principal decreases cash and leaves Home Expense unchanged         | Pass; existing financial-semantics and account-balance tests remain green               |
| Borrowed repayment decreases cash and leaves Home Expense unchanged     | Pass; Debt transaction type and Home metric contracts unchanged and green               |
| Lent repayment received increases cash and leaves Home Income unchanged | Pass; Debt transaction type and Home metric contracts unchanged and green               |
| One idempotency key produces one financial mutation                     | Pass; existing unique indexes/atomic RPC behavior preserved; replay receipt is explicit |
| Debt-owned Transactions remain non-generic-correctable/refundable       | Pass; 09P0 capability tests remain green                                                |

## Tests added

- `tests/unit/debt-account-policy.test.ts`
  - all liquid account types accepted;
  - credit card, savings product, and unknown internal type rejected.
- `tests/unit/debt-account-eligibility.test.ts`
  - liquid create/payment accepted;
  - credit card and savings product rejected before RPC dispatch.
- `tests/unit/debt-rpc-account-guard.test.ts`
  - one SQL policy is used by both RPC wrappers;
  - only liquid types are allowed;
  - unchecked renamed functions are not executable by client roles.

## Browser evidence

The authenticated local Debt surface was inspected in light and dark themes at
390px, 440px, 768px, and 1280px. No horizontal overflow was observed after
the 390px page settled. The create and payment account pickers showed `Cash`
and `E2E Transfer Dest`; `Savings Products` was absent.

The money-movement create preview was captured with direction, amount, Cash,
effective date, and the neutral principal meaning. The payment review was
captured with amount, Cash, payment date, and remaining-after-payment.

The authenticated Playwright fixture from `.env.local` also passed its
authentication smoke suite: 3 tests passed. A real create/payment submission
was not executed during browser verification because it would create an actual
financial mutation; the code path is covered by the command contracts,
receipt wiring, targeted tests, typecheck, and production build.

## Validation

- Targeted Debt/account/semantics tests: 106 tests passed.
- Full Vitest suite: 134 files, 997 tests passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Authenticated E2E infrastructure: 3 tests passed.
- Targeted Prettier check for all changed TS/TSX/JSON/report files: passed.
- Repository-wide `npm run format:check` remains baseline-red across unrelated
  files; no unrelated formatting was changed.
- `supabase status`: local direct-RPC execution was unavailable because the
  Docker daemon was not running. The migration-level RPC guard contract is
  covered statically; the migration must be applied before deployment.

## Scope boundary

No edit flow, payment-history transaction links, privacy expansion, loading or
error redesign, interest/fee model, or general Debt polish was implemented.
Those remain outside 10B and belong to later Debt batches.
