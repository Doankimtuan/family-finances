# Exceptional Scenarios

## Cancellation

Scenario:

- A card was created by mistake or was never relevant to household finances.

Business expectation:

- If no meaningful history exists, setup can be abandoned.
- If meaningful history exists, the card should be closed or archived rather than erased from interpretation.

## Correction

Scenario:

- Issuer, type, limit, statement date, due date, amount, refund, fee, or repayment meaning was wrong.

Business expectation:

- Correction must preserve historical meaning.
- Correction must not silently rewrite real money movement.
- If correction affects obligation truth, card or billing period enters Needs Review until resolved.

## Recovery

Scenario:

- Closed, expired, archived, or settled card state later proves incomplete.

Business expectation:

- Record returns to Needs Review.
- Household resolves whether the prior state remains valid.
- History remains preserved.

## Emergency

Scenario:

- Household uses credit card for urgent medical, family, travel, or home expense.

Business expectation:

- Purchase creates obligation.
- Repayment pressure becomes visible.
- Product does not provide emergency credit advice or execute payment.

## Conflict

Scenario:

- Partners disagree about a card purchase, responsibility, or repayment.

Business expectation:

- Card can remain Needs Review.
- Together owns permissions and household membership.
- Cards owns financial interpretation, not relationship judgment.

## Expired Data

Scenario:

- Statement date, due date, limit, or remaining due is stale.

Business expectation:

- Current card interpretation may become Needs Review.
- Stale values must not be treated as provider-confirmed truth.

## Invalid State

Scenario:

- User attempts to treat available credit as cash, classify revolving card debt as Loan by default, or close a card with unresolved obligation.

Business expectation:

- Attempt is invalid.
- Previous valid state remains.
- Review is required when obligation truth is uncertain.

## Unexpected User Behavior

Scenario:

- User records repayment before purchase, records purchase twice, records refund as income, or records fee as purchase.

Business expectation:

- Business meaning must be clarified.
- Real money movement must remain separate from card obligation.
- Ambiguous items remain Needs Review.

## System Interruption

Scenario:

- User begins card review or card update but does not complete it.

Business expectation:

- Last valid state remains.
- Incomplete business action does not move money.
- Draft or Needs Review state persists where appropriate.

## Provider Mismatch

Scenario:

- Household record differs from issuer app or statement.

Business expectation:

- Provider evidence can inform review.
- Household-recorded truth must not pretend to be provider-confirmed truth.
- Unresolved mismatch remains Needs Review.
