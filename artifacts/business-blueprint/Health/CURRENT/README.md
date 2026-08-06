# Health Business Blueprint

## Overview

This blueprint defines the deterministic business behavior of the Health domain for ViNha.

Health is the household's read-only financial condition mirror. It answers one business question: what does the household's financial condition appear to be from visible, grounded facts?

## Scope

In scope:

- Household financial condition assessment.
- Source-factor explanation.
- Data completeness awareness.
- Read-only interpretation of decision pressure, plan rhythm, recent activity, visible liquidity context, obligations, debt/card burden, medical-expense pressure, emergency resilience, partner rhythm, and light scenarios.
- Stable comparison against prior grounded condition when valid.

Out of scope:

- Creating, editing, deleting, approving, reconciling, repaying, closing, or moving money.
- Owning accounts, transactions, cards, loans, savings, plans, goals, inbox items, categories, or household membership.
- Medical, insurance, credit, investment, tax, or legal advice.
- Treating virtual planning as real money.
- Inventing hidden balances, obligations, income, claims, or risk facts.
- Black-box precise scoring.

## Business Responsibility

Health owns interpretation only. It consumes source-domain facts, determines whether assessment is possible, produces a condition signal, explains the factors behind it, and identifies when the signal is incomplete, stale, or unavailable.

Health does not own the facts it interprets.

## Relationship With Previous Phases

- Phase 1 discovered Health as a read-only household financial condition mirror.
- Phase 2 validated that young Vietnamese households need a shared, calm way to understand financial condition.
- Phase 3 approved the guarded Health scope and rejected mutation, advice, automation, virtual-money confusion, invented facts, and black-box scoring.
- Phase 4 converts approved and modified decisions into this business contract.

## Document Index

- [business-purpose.md](./business-purpose.md)
- [lifecycle.md](./lifecycle.md)
- [business-flows.md](./business-flows.md)
- [state-machine.md](./state-machine.md)
- [money-flow.md](./money-flow.md)
- [business-rules.md](./business-rules.md)
- [cross-domain-interactions.md](./cross-domain-interactions.md)
- [decision-points.md](./decision-points.md)
- [exceptional-scenarios.md](./exceptional-scenarios.md)
- [business-boundaries.md](./business-boundaries.md)
- [consistency-check.md](./consistency-check.md)
- [final-verdict.md](./final-verdict.md)
