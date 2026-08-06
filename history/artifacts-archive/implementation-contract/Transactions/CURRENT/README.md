# Transactions Implementation Contract

## Overview

This implementation contract defines deterministic behavior for the Transactions domain.

It converts the approved Business Blueprint into implementation-ready rules without creating implementation code, database design, API design, DTOs, events, or architecture changes.

## Scope

In scope:

- Transaction actions.
- Transaction states and transitions.
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
- Provider import.
- Merchant normalization.
- Receipt attachments.
- Split categorization.
- Formal reconciliation workflow.
- Multi-currency/remittance behavior.

## Relationship With Previous Phases

- Phase 1 discovered Transactions as real money movement facts.
- Phase 2 validated young-household behavior.
- Phase 3 approved the product scope.
- Phase 4 defined the business blueprint.
- Phase 5 defines deterministic implementation contracts for the approved scope.

## Implementation Principles

- Transactions record what happened to real money.
- Real Ledger must remain separate from Virtual Planning (BR-01).
- Health must remain read-only (BR-24).
- Transfers between owned accounts are neutral by default.
- Categories and jar references explain meaning; they do not move money.
- Refunds, corrections, and reversals must preserve audit-safe history.
- Invalid actions must preserve the previous valid transaction state.
- Provider and AI information must not override ledger truth.
- Transaction behavior must remain understandable to young households for 5-10 years.
