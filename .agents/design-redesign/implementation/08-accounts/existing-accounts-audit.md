# Implementation 08 — Existing Accounts Audit

## Baseline

The baseline audit covers the app immediately before the Accounts migration. Query and command paths were read before UI changes; the authenticated browser was used read-only.

| Surface                       | Baseline implementation                                                                                                                                  | Classification |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Accounts overview             | The route loaded real account position and credit-card queries, but presented accounts as a flat inventory.                                              | REFACTOR       |
| Add account                   | One `AddAccountForm` sheet offered supported types, name/icon, scope, and opening balance.                                                               | REFACTOR       |
| Add credit account            | The same sheet switched to card fields: name/icon, limit, statement/due days, and optional linked asset account.                                         | REFACTOR       |
| Asset detail                  | `/money/accounts/[id]` used a Server Component for balance, ownership, recent typed activity, and an account-management sheet.                           | RESTYLE        |
| Credit detail                 | The same detail route loaded card billing, activity, installments, and eligible-purchase data. `/money/cards/[id]` is a compatibility redirect to loans. | RESTYLE        |
| Edit account                  | Existing sheet updates name, supported type, and icon through the existing command.                                                                      | REUSE          |
| Archive account               | Existing confirmation calls the supported soft-archive command. No hard delete or close command exists here.                                             | REUSE          |
| Loading / unavailable / empty | Overview/detail loading, query-unavailable, and empty-activity states already existed.                                                                   | REUSE          |

## Current implementation

- Accounts overview now shows the real owned-account total and bank, combined cash/e-wallet, and separate credit-liability groups. Rows use shared `AccountRow`/`Balance` patterns.
- The directory links to dedicated Add Account and Add Credit pages. The existing quick-create sheet on Money remains in place for its other entry point.
- Both page forms use existing `createAccountAction`/`createAccount`. Add Account exposes the supported type, name/icon, scope, and opening balance. Add Credit exposes the existing card settings and explicitly states that a new card starts with zero debt.
- Asset/credit detail queries and action flows remain in place. Detail back navigation now returns to Accounts. The existing shared capture shortcut, edit/archive sheet, and card payment/refund/installment flows remain authoritative.
- Asset and credit detail layouts still differ materially from the exact Stitch compositions. See `visual-qa.md`; those two screen migrations are NOT DONE.

## Data, commands, and financial semantics

- `createAccount` parses the established input schema, persists an asset opening balance, and forces a credit card opening balance to zero. It does not create an income transaction.
- Credit limit, current debt, available credit, utilization, statement balance, and due date are read from the existing ledger queries. Credit accounts are excluded from the owned-asset account set.
- `updateAccount` changes name, type, and icon only. It does not change an account balance or create a financial transaction.
- `archiveAccount` is a soft archive. There is no account delete/close behavior in this flow.
- Recent activity receives transaction type from the ledger and renders its existing transfer semantics; type is not inferred from amount sign.
- Account screens call application queries/actions; they do not access Supabase directly.

## Stitch data not supported by the current domain

- No issuer/network selection, bank-provider catalog, account-number metadata, autopay, automatic statement reconciliation, or opening-debt command is available to these create forms.
- The existing capture shortcut opens the general transaction flow and does not prefill an account. No account-specific transaction/transfer/balance-adjustment prefill API exists; do not add action buttons that imply those workflows are supported.
- These are documented product/data gaps. The implementation keeps them out of the forms and does not use mock financial values.

## Validation safety

Browser review opened routes and existing action sheets only. No account was created, edited, archived, paid, or otherwise mutated. Technical validation results are in `qa.md`.
