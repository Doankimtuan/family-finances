# Exceptional Scenarios

## Cancellation

Scenario:

- User starts adding an account but stops before activation.

Business expectation:

- Draft becomes Abandoned Draft.
- No account history is created.
- Real position is unchanged.

## Correction

Scenario:

- Account name, type, relevance, or recorded balance is wrong.

Business expectation:

- Correction must preserve history.
- Balance correction must be explainable.
- Invalid corrections are rejected.

## Recovery

Scenario:

- Account truth is uncertain after stale cash, duplicate movement, wrong transfer treatment, or user confusion.

Business expectation:

- Account enters Needs Review.
- Household resolves uncertainty.
- Account returns to Active, Historical, or Closed depending on facts.

## Emergency

Scenario:

- Household needs to know usable money quickly.

Business expectation:

- Accounts provide real location and simple liquidity context.
- Accounts do not advise, allocate, or move money.

## Conflict

Scenario:

- Partners disagree whether a personal account is household-relevant.

Business expectation:

- Account relevance is a household business decision.
- Together owns membership and access rules.
- Accounts do not create surveillance or granular permission behavior.

## Expired Data

Scenario:

- Recorded account balance may be stale.

Business expectation:

- Account may be treated as Needs Review or lower-confidence.
- Health and Planning should not over-trust stale data.
- Account balance is not automatically replaced by external assumptions.

## Invalid State

Scenario:

- Closed account used as active transaction target, or draft treated as active.

Business expectation:

- Action is rejected or requires recovery.
- Previous valid state is preserved.

## Unexpected User Behavior

Scenario:

- User tries to create a jar as an account, count credit limit as money, or map a jar to a bank account.

Business expectation:

- Boundary-breaking attempt is rejected.
- BR-01 is protected.

## System Interruption

Scenario:

- User is interrupted during account creation, review, or export.

Business expectation:

- No partial business action should change real position.
- Account remains in previous valid state or Draft/Needs Review.

## Provider Confusion

Scenario:

- User expects bank or wallet balances to import automatically.

Business expectation:

- Provider automation is deferred.
- Current account truth is based on recorded household facts and manual review.

