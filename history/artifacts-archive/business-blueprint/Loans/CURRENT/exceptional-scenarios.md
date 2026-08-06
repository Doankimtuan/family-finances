# Exceptional Scenarios

## Cancellation

Scenario:

- Loan was entered but never disbursed, was voided, or was not a real obligation.

Business expectation:

- Loan can become Cancelled.
- Cancellation does not create repayment or money movement.
- If evidence conflicts, loan needs review.

## Correction

Scenario:

- Principal, lender, rate, due date, type, or note is wrong.

Business expectation:

- Correction is allowed when it preserves historical meaning.
- Historical repayments are not silently rewritten.
- Unclear correction moves the loan to Needs Review.

## Recovery

Scenario:

- Loan was completed, cancelled, archived, or defaulted incorrectly.

Business expectation:

- Loan returns through Needs Review before becoming Active or Completed.
- Previous valid state is preserved until review resolves.

## Emergency

Scenario:

- Household records urgent borrowing with incomplete details.

Business expectation:

- If minimum business facts are present, the loan can be Active.
- If facts are insufficient, the loan remains Draft or Needs Review.
- No provider facts are invented.

## Conflict

Scenario:

- Partners disagree whether a loan is personal, shared, real, gift-like, or family obligation.

Business expectation:

- Loan can carry household relevance without declaring complex legal ownership.
- If responsibility is unclear, loan needs review.
- The business record should not force relationship resolution.

## Expired Data

Scenario:

- Rate, payoff estimate, schedule, or provider screen is stale.

Business expectation:

- Stale information must not be treated as confirmed truth.
- Loan remains Active if core obligation is clear.
- Loan enters Needs Review if repayment expectation becomes unreliable.

## Invalid State

Scenario:

- Attempted transition violates business rules.

Business expectation:

- Attempt is rejected as Invalid Attempt.
- Loan remains in previous valid state.

## Unexpected User Behavior

Scenario:

- User tries to record credit-card revolving balance as loan, create payoff jar in Loans, close active loan without confidence, or record payment without source.

Business expectation:

- Boundary-breaking action is rejected.
- Unclear real-world action moves loan to Needs Review where appropriate.
- No automatic money movement occurs.

## System Interruption

Scenario:

- User cannot complete a loan-affecting action.

Business expectation:

- Partial business interpretation must not be assumed.
- Previous valid loan state remains.
- User can retry or review later.

## Provider Mismatch

Scenario:

- Provider app shows different balance or payment status than ViNha record.

Business expectation:

- Product record is treated as recorded truth, not provider truth.
- Loan enters Needs Review until household resolves discrepancy.

