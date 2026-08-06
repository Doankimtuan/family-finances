# Goals Business Blueprint

## Overview

This blueprint defines the business behavior of Goals in ViNha.

Goals are named household future intentions. They describe what the household is preparing for, the estimated target amount, optional timing pressure, perceived progress, lifecycle state, and simple context.

Goals are not accounts, wallets, savings products, transactions, jars, forecasts, or financial advice.

## Scope

Included:

- Goal creation, update, contribution, pause, resume, completion, cancellation, and recovery.
- Goal progress as intention.
- Target amount and optional target date.
- Household visibility within shared finance.
- Read-only cross-domain evidence.
- Savings product association as context only.
- Exceptional scenarios and boundary protection.

Excluded:

- Goal priority ranking.
- Recurring planned contributions.
- Goal-jar association.
- Multi-goal trade-off analysis.
- Forecasting.
- Provider-assisted matching.
- Inflation-aware target review.
- AI explanations.
- Advisory-grade financial planning.

## Business Responsibility

Goals owns household intention about future outcomes.

Goals does not own real money location, movement, provider balances, debt truth, card truth, savings product truth, or Health mutations.

## Relationship With Previous Phases

Phase 1 discovered Goals as a future-intention domain.

Phase 2 validated that young Vietnamese households naturally think in concrete goals but may confuse progress with real money.

Phase 3 approved the simple goal core and approved higher-risk capabilities only with strict BR-01 guardrails.

This Phase 4 blueprint turns those decisions into a deterministic business contract.

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
