# Accounts Implementation Contract

## Overview

This implementation contract defines deterministic behavior for the Accounts domain.

It converts the approved Business Blueprint into implementation-ready rules without creating implementation code, database design, API design, DTOs, or architecture changes.

## Scope

In scope:

- Account actions.
- Account states and transitions.
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
- Provider integration.
- Multi-currency.
- Advanced reconciliation workflow.

## Relationship With Previous Phases

- Phase 1 discovered Accounts as real financial containers.
- Phase 2 validated young-household behavior.
- Phase 3 approved the product scope.
- Phase 4 defined the business blueprint.
- Phase 5 defines deterministic implementation contracts for the approved scope.

## Implementation Principles

- Accounts identify where money is; Transactions record money movement.
- Real Ledger must remain separate from Virtual Planning (BR-01).
- Health must remain read-only (BR-24).
- No automatic account money movement.
- Invalid actions must preserve the previous valid account state.
- Closed and Historical accounts must preserve past meaning.
- Account behavior must remain understandable to young households for 5-10 years.

