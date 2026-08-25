# TRANSACTIONS 17A — Reference Gap Recheck

Date: 2026-08-24  
Scope: Transactions list, detail, filters, capture, correction/refund, grouped
events, privacy, ownership, Home/Money consistency, and bounded reads.  
Mode: Audit only; no production fixes implemented.

## Verdict

**TRANSACTIONS AUDIT COMPLETE**

P0: **0**  
P1: **2**  
P2: **0**

The canonical ledger commands, append-only correction/refund contracts,
ownership gates, and financial classifier remain intact. Two reference gaps
remain in the Transactions read model.

## Findings

### P1 — Grouped loan payment hides the Expense component

`LOAN_INTEREST` is canonically an Expense and counts toward Home Expense
(`modules/ledger/application/financial-semantics.ts:263-274`). The user-facing
loan grouping in `modules/ledger/application/transaction-activity.ts:274-296`
then combines principal and interest into one amount and forces:

- neutral tone;
- empty sign;
- `countsTowardExpense: false`.

As a result, a loan payment containing principal plus interest is coherent as
one row but the Transactions activity/filter read model no longer exposes the
interest Expense semantics that Home uses. The current unit test explicitly
locks this neutral grouped result (`tests/unit/transaction-activity.test.ts`).
This is a misleading cross-screen event classification, not a ledger mutation
or balance-integrity failure.

### P1 — Cursor pagination is cosmetic; list reads remain unbounded

`listTransactionEvents()` calls `listTransactions({ limit: null })` and loads
the entire transaction history before projecting activities, applying the
semantic filter, checking the cursor, and slicing the page
(`modules/ledger/application/queries/get-transaction.ts:378-409`). The UI
exposes a cursor and `load more`, but the database read is not paginated or
bounded. This violates the required bounded-loading contract and will scale
with total household history even when the user requests one page.

## Contract audit

### Canonical financial semantics

PASS for ordinary Income/Expense, Savings interest/tax/fee, Investment
income/fee/buy/sell, transfer legs, credit-card payment, Debt borrowing/
lending/receipt, and Loan principal/interest at the canonical row classifier.
No sign-based type inference was found. The grouped loan presentation gap is
reported above.

### Specialized event presentation

PASS for semantic labels and user-level projection of transfers, card
purchase/payment, Savings placement/return, Investment buy/sell/income/fee,
Debt movement, and Loan activity. Transfer legs and loan payment legs are
grouped; raw ledger internals are not shown in the active list/detail UI.

### Grouped events

PASS for transfer source/destination and loan principal/interest grouping as
one activity. Investment sell proceeds and fee remain separate semantic rows,
which preserves their distinct Income/Expense treatment. No unrelated rows are
merged.

### Refund, correction, reversal

PASS. Refunds project as Refund rather than ordinary Income; reversed originals
are excluded from monthly Income/Expense while remaining in append-only
balance math; generic correction/refund capabilities are owner/status-gated;
the audit-chain and mutation contracts preserve history without hard delete.

### Opening positions

PASS by Accounts, Savings, Investments, Loans/Debt, and Transactions contracts.
Account opening balances, Savings `HISTORICAL_OPENING`, Investment historical
opening, and applicable Loan/Debt seeds do not create synthetic Transactions
rows.

### Filtering

PASS for the active Transactions page. Income, Expense, and Transfer filters
are applied to projected activity semantics, not amount sign or raw row amount.
Tag filtering, cursor state, and specialized read-model kinds remain bounded
by the current page contract. Specialized type constants exist for the lower
level adapter; no contradictory active UI filter was found.

### Detail and receipts

PASS. Detail and receipt surfaces expose event identity, amount, account
context, transfer route where applicable, category/jar context, date, note,
product context, and correction/refund relationship history using semantic
labels rather than raw database terminology. Financial amounts are privacy
wrapped.

### Ownership and security

PASS by the certified Accounts/Transactions integrity evidence. Reads are
household-scoped through the active membership gate; personal-account
visibility and former/read-only behavior remain contract-controlled;
correction/refund/tag mutations use their application authority checks and do
not grant authority over the owning Money object.

### Privacy

PASS. List rows, grouped rows, detail amounts, filters/receipts, and
correction/refund previews use `FinancialValue` or privacy-aware shared amount
components. Existing privacy tests confirm masked accessible output rather
than merely visual masking.

### Home/Money consistency

PASS for opening balance, transfer/card-payment neutrality, Savings principal,
Investment buy/sell principal, Debt principal, Investment income/fee, Savings
interest/tax/fee, and Loan interest at the canonical classifier boundary.
The grouped loan activity presentation is the one remaining inconsistency:
Home counts the interest component as Expense while the grouped Transactions
activity suppresses it.

### Performance

P1 as above for the unbounded Transactions history read. Detail reads remain
bounded: one base transaction read plus one bounded transfer/loan group read,
with one card-payment enrichment read when applicable. No per-row linked
product loop or full Savings/Investment/Loan/Debt history query was found in
Transactions.

### UX/browser

The current authenticated Transactions and capture smoke passed. Existing 09F
authenticated evidence covers the populated list/detail/capture flows at 390,
440, 768, and 1280px, Vietnamese/English, light/dark, reduced motion,
privacy, and no horizontal overflow. Current focused smoke passed at the
configured authenticated fixture, including list shell, filters, capture, and
the `/money/add` compatibility route. No raw i18n keys or duplicate capture
CTA was found in the checked surfaces.

## Remaining ambiguity (not counted as a finding)

Savings settlement may create principal, interest, and tax/fee rows with
different or absent grouping keys. The current projector safely groups only
rows sharing a transfer group; merging all same-day Savings components would
need a stable product-event identifier to avoid merging unrelated events. No
new grouping semantics are invented by this audit.

## Validation

Focused Transactions/module/privacy/i18n/semantics run: **28 files, 234 tests
passed**.

Focused authenticated Transactions/capture browser smoke: **5 passed**.  
`npm run typecheck`: **passed**.  
`npm run build`: **passed**.

The full unit suite and repository-wide lint were intentionally not run in
this audit.

## Smallest recommended implementation sequence

1. Define one grouped-loan activity contract that preserves the principal+
   interest split for Expense filtering and detail presentation while keeping one
   user event.
2. Replace the full-history `limit: null` read with a bounded semantic event
   query/RPC that preserves grouping, filters, cursor ordering, and tag behavior.
3. Add focused regression/browser coverage for mixed loan payments, Savings
   settlement components, and large-history pagination before changing UI copy.
