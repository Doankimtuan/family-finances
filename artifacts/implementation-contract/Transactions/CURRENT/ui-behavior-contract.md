# UI Behavior Contract

This contract defines required UI behavior only. It does not design screens.

## State-Based Behavior

| State | Visible actions | Hidden actions | Disabled actions | Required messages |
|-------|-----------------|----------------|------------------|-------------------|
| Empty history | Record income, record expense, search/filter empty state | Correction, refund, reversal, archive | Search/filter may be disabled or show empty result | Explain no transactions exist yet. |
| Recorded | Add/change meaning, send to review, refund if eligible, correct, reverse, search/filter | None by default | Archive if active meaning incomplete | Show transaction facts clearly. |
| Needs Review | Resolve review, add/change meaning, correct, reverse, refund link if relevant | Archive unless accepted uncertainty is explicit | Money-mutating shortcuts that bypass review | Show why review is needed. |
| Resolved | Add/change meaning, refund if eligible, correct, reverse, archive, search/filter | None by default | Resolve review | Show meaning and real money facts. |
| Refund Linked | View original/refund relation, correct if valid, archive | Ordinary income treatment for linked refund | Duplicate refund if not allowed | Show refund relationship. |
| Corrected | View correction story, archive | Silent edit | Re-correct if state no longer eligible | Show original and corrected story. |
| Reversed | View reversal story, archive | Resolve as ordinary active transaction | Ordinary meaning edits that imply active truth | Show transaction has been unwound. |
| Historical | View, search/filter | Record against historical state, resolve ordinary active review | Mutating actions unless restored by valid business route | Show historical status. |
| Invalid Attempt | Retry after fixing issue | None | Submit while same invalid condition remains | Show no state changed. |

## Confirmation Dialogs

Required confirmation:

- Correct financial facts.
- Reverse transaction.
- Archive transaction with accepted unresolved uncertainty.

Not required:

- Search/filter.
- Meaning-only change when it does not change money.
- Sending a transaction to review.

## Warning Messages

Warnings required for:

- Transfer classified as income or expense without clear basis.
- Refund treated as ordinary income while linked original exists.
- Category or jar reference that might imply money movement.
- Offline money mutation attempt.
- Correction or reversal that affects account explanation.

## Loading Behavior

- Money mutation actions must show pending/working state until success or failure.
- During pending/working state, duplicate submission must be prevented.
- Read-only search/filter may show loading without blocking unrelated actions.

## Empty States

- Empty transaction history must explain that no activity has been recorded.
- Empty search results must not imply money is missing.
- Empty Inbox review for Transactions must indicate no transaction review is pending.

## Error States

- Errors must state that no transaction state changed when action failed.
- Permission failures must not reveal hidden transaction details.
- Boundary failures must explain real ledger versus virtual planning separation in plain language.
