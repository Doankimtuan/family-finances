# Together Implementation Contract

## Overview

This implementation contract defines deterministic behavior for the Together domain.

It converts the approved Business Blueprint into implementation-ready rules without creating implementation code, database design, API design, DTOs, or architecture changes.

## Scope

In scope:

- Household actions.
- Membership actions.
- Invitation actions.
- Role responsibility actions.
- Household policy actions.
- Household preference actions.
- Limited inactive-member interpretation.
- Validations.
- State transitions.
- Money no-op behavior.
- Inbox and notification behavior.
- Permissions.
- Required UI behavior.
- Edge cases.
- Cross-domain contracts.
- Acceptance checklist.

Out of scope:

- Multi-household support.
- Complex family structures.
- Temporary access.
- Separation or household split workflows.
- External provider consent.
- Legal family status.
- Relationship dispute resolution.
- Partner engagement summaries.
- Granular custom roles.
- Together-initiated money movement.

## Relationship With Previous Phases

- Phase 1 discovered Together as the household trust boundary.
- Phase 2 validated young-household shared finance behavior.
- Phase 3 approved the simple Together product scope.
- Phase 4 defined the deterministic business blueprint.
- Phase 5 defines deterministic implementation contracts for the approved scope.

## Implementation Principles

- Together defines who belongs to shared household finance.
- Partner/Admin is a responsibility distinction, not hierarchy.
- Together never moves, allocates, corrects, or creates money.
- Real Ledger remains separate from Virtual Planning (BR-01).
- Health remains read-only (BR-24).
- Invalid actions preserve the previous valid state.
- Terminal invitation states cannot be reopened.
- Policy attribution is context, not surveillance or blame.
- Non-members must not access household-scoped data.
