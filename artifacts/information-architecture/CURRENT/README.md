# Information Architecture - Current Canonical Proposal

Phase B defines the canonical information architecture for the redevelopment program.

This package records the current information-architecture baseline. It does not
modify business logic, financial invariants, domain rules, product decisions,
or specifications.

## Deliverables

- [executive-summary.md](./executive-summary.md)
- [application-hierarchy.md](./application-hierarchy.md)
- [navigation-architecture.md](./navigation-architecture.md)
- [routing-philosophy.md](./routing-philosophy.md)
- [module-ownership.md](./module-ownership.md)
- [screen-hierarchy.md](./screen-hierarchy.md)
- [screen-catalog.md](./screen-catalog.md)
- [component-ownership.md](./component-ownership.md)
- [future-scalability.md](./future-scalability.md)
- [migration-plan.md](./migration-plan.md)
- [consistency-report.md](./consistency-report.md)
- [final-verdict.md](./final-verdict.md)

## Canonical IA Statement

The product uses a five-tab household-first shell:

1. Home
2. Money
3. Plan
4. Inbox
5. Together

Health and Settings are secondary household surfaces, not bottom tabs.

Money owns all money inventory and money history browsing. Plan owns intention, allocation, recurrence, calendar, and ritual. Inbox owns review work. Together owns household people, invitations, policies, preferences, onboarding, and account lifecycle. Home owns orientation and cross-module launch points.
