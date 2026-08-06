# Categories Implementation Contract

## Overview

This implementation contract defines deterministic behavior for the Categories domain.

It converts the approved Business Blueprint into implementation-ready rules without creating implementation code, database design, API design, DTOs, events, or architecture changes.

## Scope

In scope:

- Category actions.
- Category states and transitions.
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
- Category balances.
- Category budgets or spending caps.
- Category payment execution.
- Autonomous final categorization.
- Merge, split, visual identity, duplicate detection, confidence scoring, merchant learning, merchant normalization, templates, provider reconciliation, drift detection, export portability, and multi-currency category behavior.

## Relationship With Previous Phases

- Phase 1 discovered Categories as household classification labels.
- Phase 2 validated young-household category behavior.
- Phase 3 approved the product scope.
- Phase 4 defined the business blueprint.
- Phase 5 defines deterministic implementation contracts for the approved scope.

## Implementation Principles

- Categories classify transaction meaning only.
- Real Ledger must remain separate from Virtual Planning (BR-01).
- Health must remain read-only (BR-24).
- Provider and merchant labels are evidence only.
- Unknown category meaning must not be guessed.
- Category actuals are past transaction facts only.
- Invalid actions must preserve the previous valid category or assignment state.
- Category behavior must remain understandable to young households for 5-10 years.
