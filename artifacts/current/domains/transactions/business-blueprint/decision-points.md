# Decision Points

## Record Transaction

Who makes it: Household user or valid future trusted input, subject to household understanding.

Why: Real money moved and must be remembered.

Possible outcomes:

- Record as income.
- Record as expense.
- Record as transfer.
- Reject invalid attempt.
- Mark Needs Review.

Business impact: Creates or rejects a real ledger fact.

## Classify Direction

Who makes it: Household user or business interpretation.

Why: Direction determines income, expense, or neutral movement.

Possible outcomes:

- Income.
- Expense.
- Owned-account transfer.
- Needs Review.

Business impact: Prevents double-counting and cash-flow distortion.

## Add Meaning

Who makes it: Household user.

Why: The household needs to know what the transaction was for.

Possible outcomes:

- Category added.
- Note added.
- Planning reference added.
- Meaning left unresolved.

Business impact: Clarifies household understanding without changing real money.

## Send For Review

Who makes it: Household user or business rule.

Why: Meaning is incomplete or uncertain.

Possible outcomes:

- Needs Review.
- Remains Resolved.
- Rejected if no transaction fact exists.

Business impact: Creates household decision work.

## Resolve Review

Who makes it: Household user.

Why: An unresolved transaction needs meaning.

Possible outcomes:

- Resolved.
- Remains Needs Review.
- Correction.
- Refund link.
- Reversal.

Business impact: Determines whether other domains may safely consume clarified meaning.

## Recognize Refund

Who makes it: Household user or validated business interpretation.

Why: Returned money should explain a prior expense when possible.

Possible outcomes:

- Link to original transaction.
- Leave refund Needs Review.
- Treat as separate income only if no prior expense relationship exists.

Business impact: Prevents refunds from distorting income.

## Correct Transaction

Who makes it: Household user.

Why: A recorded fact is wrong.

Possible outcomes:

- Corrected.
- Needs Review.
- Invalid attempt rejected.

Business impact: Restores trust while preserving audit story.

## Reverse Transaction

Who makes it: Household user with valid reason.

Why: A transaction should not stand as active truth.

Possible outcomes:

- Reversed.
- Needs Review.
- Invalid attempt rejected.

Business impact: Unwinds active meaning without erasing history.

## Reconcile

Who makes it: Household user.

Why: Product record is compared with bank, wallet, card, cash, or memory.

Possible outcomes:

- Confirmed confidence.
- Needs Review.
- Correction.
- Refund link.
- Reversal.
- No change.

Business impact: Repairs or confirms household trust.

## Consume Read-Only Facts

Who makes it: Consuming domain.

Why: Other domains need transaction evidence.

Possible outcomes:

- Planning interpretation.
- Inbox review.
- Health signal.
- Card/loan/savings/goal context.

Business impact: Extends transaction value without transferring ownership.
