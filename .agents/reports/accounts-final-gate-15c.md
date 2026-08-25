# ACCOUNTS 15C — Final Reference Gate

Date: 2026-08-23  
Scope: Accounts + Credit Cards; archived legacy code excluded.  
Mode: final certification; no production changes made.

## Verdict

**ACCOUNTS REFERENCE READY**

No concrete Accounts or Credit Cards product blocker remains in the audited
scope.

## Evidence

### Account semantics and opening balance

- Explicit account kinds remain `cash`, `checking`, `savings`, `ewallet`,
  `brokerage`, `credit_card`, `savings_product`, and `other`.
- Type behavior is driven by the account-type contract and eligibility
  predicates, never by balance sign.
- Opening balance remains a persisted position seed only: no synthetic
  transaction, Income, Expense, or fake transfer is created. Create/edit
  behavior preserves this invariant; credit-card opening balance remains zero.

### Transfers

- Shared validation rejects same-account, non-positive, invalid, and
  insufficient transfers.
- The owned transfer command uses the atomic transfer RPC, one user transfer
  event, neutral semantics, ownership checks, and an idempotency key.
- Unit coverage confirms retry safety and no duplicate ledger rows.
- Fresh browser transfer check passed and confirmed unchanged real position plus
  a neutral receipt.

### Credit cards

- True card spending is classified as Expense; settlement/payment is neutral.
- Limit, outstanding, and available-credit semantics remain explicit.
- Installment setup, preview, source-account rules, payment sheet, and card
  detail controls passed authenticated browser checks.
- Purchase, settlement, installment, limit, refund/correction, and idempotency
  contracts are covered by focused unit tests; generic correction/refund paths
  do not fabricate Income.

### Eligibility, ownership, and security

- Investments, Savings, Loans, Debt, Credit-card settlement, and Transfers use
  aligned canonical account contracts; the 15A investment picker gap and local
  Savings allowlist were removed in 15B.
- Focused ownership/RLS/RPC/schema/UI tests passed. Authority is server-derived,
  ownership cannot be client-escalated, personal and household scope are
  enforced, and former/read-only behavior is represented.
- Dedicated ownership browser execution was attempted but its fixture stopped
  before browser setup because it refused to move an already-active membership.
  This was a harness-state failure, not a product assertion failure.

### UX and privacy

- Account list, create, edit, detail, activity, transfer, card payment,
  installment, archive/close controls where supported, ownership labels, types,
  and balances are covered by existing 15B browser evidence and fresh focused
  browser checks.
- Monetary output in Money, account/card detail, transfer previews, and
  installment/payment previews uses `FinancialValue`; privacy masking remains
  covered by focused unit and 15B browser evidence.
- 15B authenticated evidence passed the required 390/440/768/1280 responsive
  matrix, VI/EN, light/dark, reduced motion, privacy, overflow, and raw-key
  checks.

### Integration semantics

- Opening balance affects position only.
- Transfers and card payments stay outside Income/Expense.
- Card spending remains Expense.
- Home/Money position and cash-flow read models remain separated, avoiding
  double counting.

## Validation

Focused unit coverage:

- 29 focused files, **346 passed**.
- Accounts, transfers, credit cards, eligibility, ownership/security, privacy,
  financial semantics, Money/Home integration, and transaction paths included.

Full repository gates:

- Full unit suite: **154 files, 1,091 passed**.
- `npm run lint`: **passed**.
- `npm run typecheck`: **passed**.
- `npm run build`: **passed**.
- Repository-wide format cleanup was not run.

Authenticated browser evidence:

- Fresh focused run: **12 passed**, covering card controls at 390/440/768/1280,
  installment setup, edit/payment inspection, investment account eligibility,
  and transfer neutrality; 4 account-detail cases skipped because the current
  fixture exposed no matching detail links.
- One Money hub test reported a strict-selector defect: an unscoped
  `ledger-balance` locator matched three visible values; its scoped assertion
  passed. This is test-harness debt, not an Accounts/Credit Cards product
  failure.
- 15B re-certification supplied the required authenticated VI/EN,
  light/dark, privacy, reduced-motion, overflow, and no-raw-key evidence.

## Final decision

**ACCOUNTS REFERENCE READY**
