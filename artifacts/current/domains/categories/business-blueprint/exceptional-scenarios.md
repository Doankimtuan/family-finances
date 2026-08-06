# Exceptional Scenarios

## Cancellation

Scenario:

- Household decides a category should no longer be used.

Business expectation:

- The category may be archived for future use.
- Historical meaning remains available.
- No money movement changes.

## Correction

Scenario:

- A transaction has the wrong category.

Business expectation:

- Household may correct category meaning.
- Transaction amount, account, date, currency, and direction remain owned by Transactions.
- Actuals use corrected meaning after correction.

## Recovery

Scenario:

- Category was archived by mistake, suggestion was accepted incorrectly, or meaning was left unknown.

Business expectation:

- Archived category may be restored.
- Suggested category may be overridden.
- Uncategorized transaction may become categorized.
- Invalid attempts return to the prior valid state.

## Emergency

Scenario:

- Medical, family support, or urgent expense is recorded before category meaning is known.

Business expectation:

- Transaction may remain Uncategorized.
- Category meaning may be clarified later.
- Emergency classification must not distort normal spending without household-understood meaning.

## Conflict

Scenario:

- Partners disagree about category meaning.

Business expectation:

- Categories supports shared comprehension only.
- Category review does not become spending approval or punishment.
- If no valid shared meaning exists, prior valid meaning remains or the transaction is Uncategorized.

## Expired Data

Scenario:

- Provider hint, merchant context, or memory is stale.

Business expectation:

- Stale evidence is not authoritative.
- Household meaning remains final only when understood and accepted.
- Unknown meaning can remain Uncategorized.

## Invalid State

Scenario:

- Category is archived but someone attempts ordinary future assignment.

Business expectation:

- Assignment fails unless the category is first restored as valid household vocabulary.
- Prior transaction meaning remains unchanged.

## Unexpected User Behavior

Scenario:

- User tries to create category named like a bank account, wallet, jar, or budget.

Business expectation:

- Boundary-breaking category meaning is rejected or treated as invalid.
- Categories remain purpose labels.

## System Interruption

Scenario:

- Category creation, rename, archive, restore, assignment, or correction is interrupted before completion.

Business expectation:

- No partial business meaning is accepted.
- Prior valid category state or assignment remains.
- Household may retry the business action.

## Provider Misclassification

Scenario:

- Bank, card, wallet, or merchant evidence suggests the wrong category.

Business expectation:

- Suggestion remains non-authoritative.
- Household can reject or override.
- Provider error does not change category meaning by itself.

## Boundary Violation

Scenario:

- A category action attempts to move money, create available balance, enforce a cap, or change planning state.

Business expectation:

- Action is rejected.
- Prior valid state remains.
- Owning domain remains responsible for its own business truth.
