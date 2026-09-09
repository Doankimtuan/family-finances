# Phase 5 — Transaction content audit

Presentation-only audit of the existing Transactions and Add Transaction surfaces. Domain meaning is unchanged.

## Existing concepts (not invented)

| Concept | Source | Shown on list | Shown on detail | Shown on capture |
| --- | --- | --- | --- | --- |
| Description / note | `TransactionActivity.note` / `LedgerTransaction.note` | Primary title when present | Subtitle + fact when present | Optional field |
| Category | `categoryName` | Secondary line | Context fact | Required-path chips (uncategorized allowed) |
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
- Search box — `listTransactionEvents` has no `q`; `ListTransactionsFilter.q` is a different read path and was not wired (deferred, not invented)

## Existing actions (unchanged)

- Add transaction: `APP_PATH.MONEY_ADD` via FAB + empty-state CTA
- Open detail: existing `moneyTransactionPath`
- Correct / refund: existing routes, existing eligibility (`canGenericCorrect` / `canGenericRefund`)
- Manage tags: existing tags destination
- Load more: existing cursor pagination
- Filters: existing type chips + tag filter query params

## Existing validation (unchanged)

Capture still uses `recordTransactionInputSchema` (positive whole amount, account, date, optional note/category/jar). Confirm sheet still precedes the mutation. Transfer still uses `recordTransferInputSchema`. No Zod or command changes.

## Conflicts stopped

None. Desired UX that would need a new search API or new financial metrics was deferred instead of changing contracts.
