# Exceptional Scenarios

## Cancellation

Scenario: A payment is cancelled before or after being recorded.

Business expectation:

- If no real money movement occurred, no transaction fact should stand.
- If money moved and returned, refund or reversal behavior explains the story.
- History is preserved when a recorded fact existed.

## Correction

Scenario: Amount, account, date, direction, or meaning is wrong.

Business expectation:

- Financial fact corrections require audit-safe explanation.
- Meaning-only corrections do not change real ledger movement.
- Prior valid state remains if correction is invalid.

## Recovery

Scenario: Household discovers missing, unclear, or inconsistent activity.

Business expectation:

- Transaction enters Needs Review if uncertainty matters.
- Recovery uses review, correction, refund link, reversal, or no change.
- Trust is restored by explainability, not silent rewrite.

## Emergency

Scenario: High-stress spending happens across cash, card, wallet, and bank.

Business expectation:

- Transactions may be recorded late.
- Required facts still matter.
- Missing meaning can remain Needs Review until household can clarify.

## Conflict

Scenario: Partners disagree about purpose, shared status, or transfer meaning.

Business expectation:

- The real money fact remains stable.
- Meaning may remain Needs Review.
- Together may support collaboration context, but Transactions do not judge personal behavior.

## Expired Data

Scenario: Provider notification, receipt, or memory is stale.

Business expectation:

- Stale evidence does not automatically change transaction truth.
- Household may reconcile or mark Needs Review.
- Provider data is not authoritative by default in current scope.

## Invalid State

Scenario: Attempted action violates business rules.

Business expectation:

- Invalid attempt is rejected.
- Previous valid transaction state remains.
- Boundary-breaking action does not create partial business meaning.

## Unexpected User Behavior

Scenario: User tries to use transaction as a jar allocation, delete history, classify transfer as spending without context, or treat refund as salary.

Business expectation:

- Real/virtual boundary is protected.
- Misleading meaning is rejected or requires review.
- Financial safety outranks convenience.

## System Interruption

Scenario: User action is interrupted before business completion.

Business expectation:

- No partial business fact should be trusted.
- Previous valid state remains.
- User can retry or review later.

## Duplicate Attempt

Scenario: Same household action is attempted more than once.

Business expectation:

- Duplicate active meaning should not inflate income or expense.
- If duplicate truth is uncertain, it becomes Needs Review.

## Missing Account

Scenario: Transaction references no active real account.

Business expectation:

- Transaction cannot become ordinary Recorded/Resolved.
- Household must establish valid account context or abandon the attempt.

## Refund Without Original

Scenario: Returned money appears but original expense is not identifiable.

Business expectation:

- Refund may be recorded as real money movement.
- It remains Needs Review until meaning is clear.
