# ViNha Transactions Track — 09P0.1 Remote Verification

## A. Final verdict

TRANSACTIONS P0 GATE PASS

## B. Environment

- Target: configured DEVELOPMENT Supabase project `family-finances-2`.
- Safe project ref: `bbzffxvgocjwsdbujvgn`.
- Status: `ACTIVE_HEALTHY`, region `ap-southeast-2`, Postgres 17.6.1.155.
- The configured `.env.local` Supabase host matches this project ref.
- Local Docker/Postgres was not required. The CLI linked-migration command was attempted but could not authenticate because no Supabase CLI access token was configured; remote MCP migration/schema queries were used instead.
- No secrets, passwords, tokens, or financial fixture values were written to this report.

## C. Migration

- Before apply, remote history ended at `20260818160000 rpc_acl_security_hardening_15b`; no 09P0 migration was present.
- The migration was reviewed before execution, then applied once through the remote Supabase migration workflow.
- Remote history now contains exactly one `20260820052850 transactions_financial_integrity_gate_09p0` entry.
- The local migration filename is aligned to the remote-applied version: `supabase/migrations/20260820052850_transactions_financial_integrity_gate_09p0.sql`.
- Remote schema checks confirmed `transactions.loan_payment_id`, its loan-payment FK, `loan_interest` type support, and the changed RPC definitions.

## D. RPC security

Remote `pg_proc` and privilege checks returned the following for `record_card_transaction`, `record_loan_payment`, `correct_transaction`, `refund_transaction`, `record_transaction`, and `settle_card_payment`:

| Property                | Result           |
| ----------------------- | ---------------- |
| `SECURITY DEFINER`      | true for all     |
| `search_path`           | `public` for all |
| `anon EXECUTE`          | false for all    |
| `authenticated EXECUTE` | true for all     |
| `service_role EXECUTE`  | true for all     |

Authenticated live calls still enforced household membership. Outsider C received `Forbidden`, `Not a household member`, or `Active household membership required` and created no rows.

Supabase security advisors still report unrelated pre-existing warnings, including `savings_simple_interest` mutable search path, intentional public invitation preview, and the project’s expected authenticated SECURITY DEFINER functions. The 09P0 RPC ACL query itself is clean and matches the protected manifest.

## E. Correction verification

- Remote ordinary income correction passed: `100000` income became a reversed original plus a `90000` corrected expense linked by `corrects_transaction_id`.
- Remote ordinary expense correction passed separately: original status became `reversed`, reversal and corrected rows were append-only and linked correctly.
- Remote correction negative matrix passed for 15 owner-controlled representatives, including transfer legs, card payment, debt events, investment events, savings placement/return, liability payment, and loan payment.
- Application semantic and transaction-edit tests cover derived balance/reporting behavior; no mutable original ledger row was used.

## F. Refund verification

- Remote ordinary expense partial refund passed: refund row used `reverses_transaction_id`, and the original moved to the expected partial-refund state.
- Full refund passed separately.
- Over-refund and refunding the reversal/refund row were rejected.
- Remote negative refund matrix passed for card, transfer, savings, debt/loan, investment, liability, and loan-owned events.
- Refund rows remain reversal-shaped for storage; the canonical projector classifies reversal legs as refund/non-counting events, preserving the current reporting policy rather than treating them as new income.

## G. Credit-card atomicity

- `record_card_transaction` created the ledger transaction, billing month/item, amount, and transaction-to-billing link in one successful remote operation.
- Replaying the same idempotency key returned the stable transaction ID and left exactly one billing item.
- A credit-limit violation was rejected and left transaction and billing-item counts unchanged.
- The controlled card payment regression also confirmed the billing item was applied atomically.

## H. Card owner-boundary verification

- Generic correction against the card purchase was rejected at the RPC boundary.
- Generic refund against the card purchase was rejected at the RPC boundary.
- Billing/outstanding state remained unchanged after both rejected attempts.

## I. Card payment regression

- `settle_card_payment` succeeded from the controlled liquid account.
- One payment row existed with `applied_amount = 25000`; no duplicate payment row was created.
- The payment decreased the card obligation and liquid source exactly once.
- Canonical semantics classify card payment as a non-income, non-expense, non-spending liability movement; the original card purchase remains the only spending event.

## J. Loan payment

- A remote scheduled loan fixture contained `80000` principal and `20000` interest.
- `record_loan_payment` created one aggregate payment row with those exact components.
- Two linked transaction rows were created: `liability_payment = 80000` and `loan_interest = 20000`, both linked by `loan_payment_id`.
- Remaining principal changed from `200000` to `120000`; source cash debit equals `100000`.
- Replaying the single-entry schedule was rejected with `No upcoming schedule entry`; payment count remained one.
- Fee remained `0`, as permitted by the schema.

## K. Loan classification

- `liability_payment`: no income, no expense, no spending; principal-only liability reduction.
- `loan_interest`: expense and spending under the canonical policy; no income; Home net contribution is expense.
- The focused semantic suite passed the loan-interest and liability-payment classifications, and the remote rows matched those semantics.

## L. Direction/sign matrix

The canonical `classifyFinancialEvent` projector and exhaustive semantic test matrix passed for income, expense, transfer legs, debt borrowing/lending/receivable payment, liability payment, loan interest, investment buy/sell/income/fee, card payment, refund/reversal, and savings principal placement/return.

Representative remote owner-event correction/refund rejection covered the same non-generic domains. No touched screen infers direction using a generic `non-expense = positive` rule.

## M. Privacy

- `financial-privacy.test.tsx` passed: raw masked financial values are absent from the accessible content path, and confirmation summaries fail closed.
- The canonical privacy wrappers cover transaction detail, audit-chain, capture preview, transfer preview, receipt, refund summary, and correction summary paths.
- Browser checks found no raw financial value on the authenticated home shell at 390px and 440px. The public transactions route redirects to login.

## N. Browser

- Public `/en/money/transactions` route: redirected to `/en/login` at the tested responsive sizes (390, 440, 768, and 1280px in the existing browser pass).
- Authenticated controlled identity reached `/en/home` at 390px and 440px; no raw financial text was present.
- Authenticated transaction-detail, correction, refund, card, and loan result screens were not completed in-browser because the supported fixture flow routes the freshly authenticated identity through the home/onboarding boundary and the task does not authorize redesigning authentication. This is a non-integrity browser fixture gap; the remote DB/RPC proof and component privacy proof are complete.

## O. Security/ownership

- Existing ownership harness was used with controlled A/Admin, B/Partner, and outsider C identities.
- A/B/C sign-in and household membership setup passed.
- Cross-household correction, refund, card purchase, and loan payment attempts all denied with no row-count change.
- Protected RPC manifest validation passed: 2 tests.

## P. Cleanup

- Disposable accounts, transactions, card settings/billing/payment rows, loan schedules/payments, and loan fixtures were removed using supported cleanup plus dependency-aware cleanup for append-only/self-referencing rows.
- Final remote cleanup query: `p0_accounts = 0`, `p0_loans = 0`, `ownership_memberships = 0`.
- Harness cleanup retained the controlled auth users but removed the disposable households, as supported by the harness.
- Migration history was not deleted or altered.

## Q. Validation

Passed:

- `npm run typecheck`
- `npm run lint`
- `npm run test -- --run` — 128 files, 966 tests
- `npm run build`
- Focused Vitest run — 6 files, 69 tests
- `npx vitest run tests/unit/ownership-rpc-manifest-14d1.test.ts` — 2 tests
- `git diff --check`
- Remote Supabase migration list, schema, function security/ACL, advisor, ownership harness, positive RPC, negative RPC, and cleanup checks

Not claimed: local `supabase db lint`; local Docker/Postgres was unavailable. Remote advisor and direct SQL/function privilege checks were used instead.

## R. Remaining non-P0 debt

- Authenticated browser coverage of detail/action screens remains a fixture/infrastructure follow-up.
- Existing unrelated Supabase advisor warnings remain tracked outside 09P0.
- No Transactions 09B UI work was started.
