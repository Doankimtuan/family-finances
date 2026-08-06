# Cards Implementation Contract

## Overview

This contract defines deterministic implementation behavior for the Cards domain.

Cards represent household card instruments. Credit cards additionally represent borrowing capacity, statement obligations, due dates, repayment progress, and card-specific financial adjustments.

## Scope

Included:

- Card creation, editing, review, purchase recording, statement recording, repayment, partial repayment, refund, fee, interest, cashback, card-origin installment recognition, close, archive, and recovery.
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
- Provider feeds, automatic reconciliation, statement parsing, fraud detection, reward optimization, tokenized-card tracking, and country rule packs.
- Automatic repayment execution.
- Treating available credit as real money.
- Treating revolving card debt as Loans by default.
- Health mutation of card state.

## Relationship With Previous Phases

This contract is traceable to:

- Phase 1 Domain Discovery.
- Phase 2 Household Reality Validation.
- Phase 3 Product Decision.
- Phase 4 Business Blueprint.

It implements only the approved and approved-with-modifications Cards scope.

## Implementation Principles

- Real Ledger is not Virtual Planning (BR-01).
- Health is read-only (BR-24).
- No automatic repayment execution.
- Credit limit and available credit are borrowing capacity, not cash.
- Card purchase and card repayment are distinct.
- Recorded card values are not provider-confirmed unless explicitly supported by approved scope.
- Every state change must follow the state contract.
- Every money movement must be owned by the correct money domain.
- Invalid attempts preserve the previous valid state.
