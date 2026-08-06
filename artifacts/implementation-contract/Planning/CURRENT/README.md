# Planning Implementation Contract

## Overview

This contract defines deterministic implementation behavior for the Planning domain. It converts the approved Planning Business Blueprint into action, state, money, inbox, notification, permission, UI behavior, validation, cross-domain, and acceptance contracts.

Planning is the virtual household intention domain. It never owns real money movement, account balances, paid status, provider truth, Health mutation, tax advice, or advisory-grade financial recommendations.

## Scope

Included:

- Income intentions.
- Jars and allocation intentions.
- Goals as intention.
- Recurring expectations.
- Expected due dates.
- Plan-versus-fact comparison.
- Period review and lock.
- Corrections.
- Emergency virtual reallocation.
- Completion, cancellation, archive, and historical behavior.
- Shared household visibility.
- Read-only cross-domain facts.

Excluded:

- Real ledger writes.
- Provider payment or due confirmation.
- Automatic money movement.
- Tax-aware planning.
- Advisory-grade planning.
- APIs, database design, DTOs, code, or architecture changes.

## Relationship With Previous Phases

- Phase 1 discovered Planning as household intention.
- Phase 2 validated Planning against young Vietnamese household behavior.
- Phase 3 approved and modified Planning scope.
- Phase 4 defined deterministic business behavior.

This Phase 5 contract preserves those decisions and removes implementation ambiguity without redesigning business or UX.

## Implementation Principles

- Planning writes virtual intention only.
- Real Ledger != Virtual Planning.
- Every action preserves previous valid state on failure.
- Expected data must be distinguishable from confirmed data.
- Locked periods allow only explicit correction.
- Inbox exists only when a human decision is required.
- Notifications inform; they do not mutate money or planning state.
- Health is read-only.
- Viewers read only.
- Background workers may detect review needs and reminders but cannot move money or make household decisions.

## Document Index

- [action-contract.md](./action-contract.md)
- [state-contract.md](./state-contract.md)
- [money-contract.md](./money-contract.md)
- [inbox-contract.md](./inbox-contract.md)
- [notification-contract.md](./notification-contract.md)
- [permission-contract.md](./permission-contract.md)
- [ui-behavior-contract.md](./ui-behavior-contract.md)
- [edge-case-contract.md](./edge-case-contract.md)
- [validation-contract.md](./validation-contract.md)
- [cross-domain-contract.md](./cross-domain-contract.md)
- [acceptance-checklist.md](./acceptance-checklist.md)
- [consistency-report.md](./consistency-report.md)
- [final-verdict.md](./final-verdict.md)
