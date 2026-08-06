# Loans Implementation Contract

## Overview

This contract defines deterministic implementation behavior for the Loans domain.

Loans represent household borrowing obligations: what is owed, who is owed, what repayment is expected, what has actually been paid, and whether the obligation is active or historical.

## Scope

Included:

- Loan creation, editing, review, repayment, rate awareness, payoff estimate, completion, cancellation, default, archive, and recovery.
- State transitions.
- Money movement responsibilities.
- Inbox and notification expectations.
- Permissions.
- Required UI behavior.
- Edge cases and validations.
- Cross-domain responsibilities.

Excluded:

- Business redesign.
- UX redesign.
- Architecture redesign.
- Database, APIs, DTOs, events, or code.
- Provider import or automatic bank reconciliation.
- Automatic repayment execution.
- Credit-card revolving balances.
- Loan-owned payoff jars.

## Relationship With Previous Phases

This contract is traceable to:

- Phase 1 Domain Discovery.
- Phase 2 Household Reality Validation.
- Phase 3 Product Decision.
- Phase 4 Business Blueprint.

It implements only the approved and approved-with-modifications Loans scope.

## Implementation Principles

- Real Ledger is not Virtual Planning (BR-01).
- Health is read-only (BR-24).
- No automatic repayment execution.
- Recorded loan values are not provider-confirmed unless explicitly stated.
- Every state change must follow the state contract.
- Every money movement must be owned by the correct money domain.
- Invalid attempts preserve the previous valid state.

