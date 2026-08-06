# Edge Case Contract

## Duplicate Action

Trigger:

- Same category action is submitted more than once.

Expected behavior:

- Only one valid business result is accepted.

Business result:

- Prior valid or first successful state remains authoritative.

User-visible result:

- Duplicate attempt is ignored or shown as already completed.

Recovery behavior:

- User may refresh or retry only if no success occurred.

## Duplicate Active Meaning

Trigger:

- User creates or renames category to obvious active duplicate meaning.

Expected behavior:

- Action fails validation.

Business result:

- Existing category remains unchanged.

User-visible result:

- User sees duplicate meaning failure.

Recovery behavior:

- User chooses clearer wording or uses existing category.

## Archived Category Assignment

Trigger:

- User assigns archived category to ordinary new transaction.

Expected behavior:

- Assignment is rejected.

Business result:

- Transaction remains in prior assignment state.

User-visible result:

- User sees archived category warning.

Recovery behavior:

- Restore category first or choose active category.

## Interrupted Process

Trigger:

- Network, session, or system interruption occurs during mutation.

Expected behavior:

- No partial business state is accepted.

Business result:

- Prior valid state remains unless action completed fully.

User-visible result:

- User sees uncertain/failure state and can retry.

Recovery behavior:

- Retry action after current state is reloaded.

## Provider Changes

Trigger:

- Provider or merchant evidence changes after suggestion.

Expected behavior:

- Old suggestion remains non-authoritative.

Business result:

- Accepted household category remains unless user changes it.

User-visible result:

- Suggestion may be unavailable, replaced, or rejected.

Recovery behavior:

- User reviews latest evidence and chooses valid category meaning.

## Manual Adjustment

Trigger:

- User manually corrects suggested or accepted category.

Expected behavior:

- Manual household meaning wins.

Business result:

- Assignment becomes corrected category or Uncategorized.

User-visible result:

- User sees corrected meaning.

Recovery behavior:

- User may correct again using valid action.

## Conflict

Trigger:

- Partners disagree about category meaning.

Expected behavior:

- No approval workflow is created by Categories.

Business result:

- Prior valid meaning remains, corrected meaning is accepted, or transaction becomes Uncategorized.

User-visible result:

- Category meaning is clarified or remains unresolved.

Recovery behavior:

- Household can correct category or leave unknown.

## Boundary Violation

Trigger:

- User tries category budget, balance, payment, jar capacity, provider truth, or Health mutation.

Expected behavior:

- Action is rejected.

Business result:

- Prior valid state remains.

User-visible result:

- User sees boundary explanation.

Recovery behavior:

- User uses the owning domain for the intended financial action.

## Invalid Kind

Trigger:

- Income category is assigned to expense meaning or expense category to income meaning.

Expected behavior:

- Assignment fails.

Business result:

- Prior assignment remains.

User-visible result:

- User sees incompatible category message.

Recovery behavior:

- User chooses compatible category or leaves Uncategorized.

## Missing Transaction

Trigger:

- Assignment references unavailable transaction.

Expected behavior:

- Assignment fails.

Business result:

- No category state changes.

User-visible result:

- User sees transaction unavailable message.

Recovery behavior:

- User reloads transaction context.

## Expired Or Stale Review

Trigger:

- Inbox or suggestion references a category or transaction state that changed.

Expected behavior:

- Review cannot apply stale action blindly.

Business result:

- Current valid state is preserved.

User-visible result:

- User sees stale review message.

Recovery behavior:

- User reviews current transaction and category state.
