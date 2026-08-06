# UI Behavior Contract

This document defines required UI behavior only. It does not design UI.

## Empty Category State

Visible actions:

- Create Category for actors with permission.

Hidden actions:

- Assign, rename, archive, and restore actions until a valid category exists.

Required messages:

- Categories are labels for transaction meaning.

## Active Category State

Visible actions:

- View.
- Rename.
- Archive.
- Assign to compatible transactions.
- Use in filters and actuals summaries.

Hidden actions:

- Restore.

Disabled actions:

- Mutation actions when actor lacks permission.
- Assignment to incompatible transaction meaning.

Required messages:

- Category does not hold money or available balance.

## Archived Category State

Visible actions:

- View historical meaning.
- Restore for actors with permission.
- Use for historical filtering when history exists.

Hidden actions:

- Ordinary new assignment.
- Archive.

Required messages:

- Archived means unavailable for future ordinary use; history remains.

## Uncategorized Assignment State

Visible actions:

- Assign category for actors with permission.
- Leave unknown where allowed.
- Review related Inbox item if one exists.

Hidden actions:

- Provider acceptance actions when no suggestion exists.

Required messages:

- Uncategorized means meaning is unknown, not that the transaction is invalid.

## Suggested Assignment State

Visible actions:

- Accept suggestion.
- Reject suggestion.
- Override with another valid category.
- Leave Uncategorized where allowed.

Hidden actions:

- Auto-approve.

Required messages:

- Suggestion is evidence, not final household truth.

## Categorized Assignment State

Visible actions:

- View category meaning.
- Correct category for actors with permission.
- Remove category to Uncategorized where allowed.
- Filter or summarize by category.

Hidden actions:

- Accept suggestion unless a new suggestion is explicitly present.

Required messages:

- Changing category changes meaning only, not money facts.

## Confirmation Dialogs

Required confirmations:

- Archive Category: must clarify future selection stops and historical meaning remains.
- Accept Provider Suggestion: must clarify suggestion becomes household meaning.

Optional confirmations:

- Rename Category when historical transactions exist.
- Remove category from transaction when an active review expectation exists.

## Warning Messages

Required warnings:

- Category actuals are not budgets, balances, or available money.
- Provider category is not final truth.
- Archived category cannot be used for ordinary new assignment.
- Health cannot change categories.
- Planning/Jars own capacity, not Categories.

## Loading Behavior

Required behavior:

- Disable duplicate submission for the in-flight action.
- Preserve prior visible state until success.
- On failure, show prior valid state.
- Read-only filters and summaries may show loading without mutating state.

## Empty States

Required empty states:

- No categories.
- No transactions for selected category.
- No category actuals for selected period.
- No provider suggestion.

## Error States

Required error cases:

- Permission denied.
- Invalid category name.
- Invalid kind.
- Duplicate active meaning.
- Invalid category state.
- Invalid assignment state.
- Archived category assignment attempt.
- Boundary violation.
- Provider suggestion invalid.
- Offline or unavailable mutation path.
