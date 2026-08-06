# Investments Implementation Contract

## Overview

This implementation contract defines deterministic behavior for the Investments domain.

It converts the approved Business Blueprint into implementation-ready rules without creating implementation code, database design, API design, DTOs, event contracts, or architecture changes.

## Scope

In scope:

- Investment actions.
- Investment states and transitions.
- Validations.
- Money behavior.
- Inbox behavior.
- Notifications.
- Permissions.
- Required UI behavior.
- Edge cases.
- Cross-domain contracts.
- Acceptance checklist.

Out of scope:

- Business redesign.
- UX redesign.
- Architecture redesign.
- Database/API contracts.
- Code.
- Provider integrations.
- Automatic price refresh.
- Statement import.
- Investment advice.
- Automated trading/rebalancing.
- Tax optimization.
- Crypto trading depth.

## Relationship With Previous Phases

- Phase 1 discovered Investments as risk-bearing household assets.
- Phase 2 validated the domain against young Vietnamese household behavior.
- Phase 3 approved and modified the future Investments foundation while deferring or rejecting advanced scope.
- Phase 4 defined deterministic business behavior.
- Phase 5 defines deterministic implementation contracts for the approved and modified Phase 4 behavior.

## Implementation Principles

- Investments explain risk-bearing holdings; they do not hold cash.
- Accounts identify where cash is; Transactions record money movement.
- Real Ledger must remain separate from Virtual Planning (BR-01).
- Health must remain read-only (BR-24).
- Estimated investment value is not spendable cash.
- No investment advice, trading automation, market timing, or gamification.
- Invalid actions preserve the previous valid state.
- Historical records remain understandable after exit or archive.
- Future implementation must remain understandable to young households for 5-10 years.
