# Phase 5 — Transaction content audit

Presentation-only audit of the existing Transactions and Add Transaction surfaces. Domain meaning is unchanged.

## Existing concepts (not invented)

| Concept | Source | Shown on list | Shown on detail | Shown on capture |
| --- | --- | --- | --- | --- |
| Description / note | `TransactionActivity.note` / `LedgerTransaction.note` | Primary title when present | Subtitle + fact when present | Optional field |
| Category | `categoryName` | Secondary line | Context fact | Optional; uncategorized is allowed |
| Account | source/destination names | Secondary line | Context fact | Required |
| Amount + sign | `amount`, `sign`, `tone` | Primary right column | Hero amount | Dominant field |
| Direction / kind | `TransactionActivityKind` / capture mode | Implied by sign, kind labels, filters | Title | Expense / income / transfer modes |
| Effective date | `effectiveDate` / `transactionDate` | Date group heading | Context fact | Date picker (default today, existing rule) |
| Status | `TransactionStatus` | Amount meta when not posted | Context fact | Not a capture field |
| Refund relationship | status + activity kind | Amount meta | History section | N/A |
| Jar | `jarId` / `jarName` | Not on list (keeps scan density) | Context fact | Optional (progressive disclosure) |
| Household tags | `tags` | Not on list | Tag editor | Optional (progressive disclosure) |
| Transfer route | source → destination | Title | Transfer detail facts | Transfer flow |
| Loan breakdown | `activity.breakdown` | Not on list | Facts card when present | N/A |
| Product context | owner / productEvent | Icon tone | Soft context copy | N/A |

## Fields intentionally not shown on the list

- Jar — Plan intention, not scan-first ledger identity
- Household tags — filterable, not row chrome
- Currency code as a separate badge — already in formatted amount
- Internal ids, transfer group ids, audit ids
- Created-at timestamp — grouping uses effective date already on the model
- Search notes — `listTransactionEvents` supports `q`, which matches transaction notes; do not imply search covers account names or categories

## Existing actions (unchanged)

- Add transaction: `APP_PATH.MONEY_ADD` through the center Add action and empty-state CTA; it is a primary destination with the main-screen header, not a child form with a Back button
- Open detail: existing `moneyTransactionPath`
- Correct / refund: existing routes, conditionally available for eligible non-transfer entries (`canGenericCorrect` / `canGenericRefund`); posted ledger entries cannot be edited or deleted
- Manage tags: existing tags destination
- Load more: existing cursor pagination
- Filters: existing type chips and account, category, jar, and tag filters; note search is supported

## Existing validation (unchanged)

Expense/income use `recordTransactionInputSchema` (positive whole amount, account, date, optional note/category/jar; tags are assigned separately). Transfer uses `recordTransferInputSchema` (positive whole amount, distinct eligible source/destination accounts, date, optional note). The confirm sheet precedes mutation and a receipt follows success. Opening balance is account setup data, not an income transaction.

## Transaction semantics

- A transfer is one activity backed by linked ledger legs; it is neither income nor expense and cannot be independently corrected or refunded from transfer detail.
- Posted entries are immutable. Eligible income/expense entries can use the existing correction or refund flows. There is no delete action.
- Screen examples are mock data and must be labeled as such; unsupported behavior is not presented as implemented.
