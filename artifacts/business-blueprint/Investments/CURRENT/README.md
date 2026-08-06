# Investments Business Blueprint

## Overview

This blueprint defines deterministic business behavior for the Investments domain in ViNha.

Investments represents risk-bearing household assets whose value can change without cash movement. It exists to keep investment holdings understandable without confusing them with Accounts, Transactions, Savings products, Goals, Planning, or Health.

This pack defines business behavior only. It does not write code, create schema, define APIs, design UX, or modify frozen Sources of Truth.

## Scope

Included:

- Investment domain separation.
- Holding identity.
- Broad asset class.
- Contribution amount.
- Cost context.
- Estimated value, valuation date, and valuation source.
- Unrealized and realized gain/loss interpretation.
- Investment income context.
- Cash movement distinction.
- Simple liquidity and risk context.
- Ownership/visibility sensitivity.
- Historical preservation after exit.
- Manual valuation confidence.
- Margin/leverage risk visibility.
- Optional household purpose context.
- Private/family investment uncertainty.
- Health read-only interaction.

Excluded:

- Provider integrations.
- Automatic price/NAV refresh.
- Statement import.
- Tax optimization.
- Corporate action depth.
- Advanced performance analytics.
- Portfolio recommendations.
- Automated trading or rebalancing.
- Crypto trading depth.
- Treating unrealized value as spendable plan capacity.

## Business Responsibility

Investments owns the business truth of risk-bearing household holdings: what is held, why it is considered an investment, what was contributed, what it is believed to be worth, how fresh that value is, whether the value is liquid, and what happened when the holding exited.

Investments does not own cash balances, cash movement posting, savings-product contracts, debt obligations, goals, plans, categories, partner permissions, or Health decisions.

## Relationship With Previous Phases

Source artifacts:

- Phase 1: `artifacts/domain-discovery/Investments/CURRENT/`
- Phase 2: `artifacts/household-reality-validation/Investments/CURRENT/`
- Phase 3: `artifacts/product-decision/Investments/CURRENT/`

Phase 3 concluded that Investments is product-valid but not current-scope ready. This blueprint therefore defines the business contract for the approved and approved-with-modifications foundation only. Deferred and rejected capabilities are explicitly outside this blueprint.

## Contents

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
