# Goals Implementation Contract

## Overview

This contract defines deterministic implementation behavior for the Goals domain.

Goals are household future intentions. They can be created, edited, progressed, paused, resumed, completed, cancelled, and interpreted against read-only evidence. They never move money and never own source-domain financial truth.

## Scope

Included:

- Goal actions and validations.
- Goal state transitions.
- Money contract under BR-01.
- Inbox and notification behavior.
- Permissions.
- Required UI behavior.
- Edge cases.
- Cross-domain responsibilities.
- Acceptance checklist.

Excluded:

- Goal priority ranking.
- Recurring planned contributions.
- Goal-jar association.
- Forecasting.
- Provider-assisted matching.
- Confidence scoring.
- AI explanations.
- Business, UX, architecture, database, API, or code design.

## Relationship With Previous Phases

This contract is directly traceable to:

- Phase 1 Goals Domain Discovery.
- Phase 2 Goals Household Reality Validation.
- Phase 3 Goals Product Decision Board.
- Phase 4 Goals Business Blueprint.

It does not alter approved business behavior. It removes ambiguity for future implementation.

## Implementation Principles

- Goals are intention, not real money.
- Goal progress is not account, wallet, cash, or savings balance.
- Goal contribution is not transfer, payment, or withdrawal.
- Goal completion is not purchase or payment completion.
- Source domains own source truth.
- Health is read-only.
- No unnecessary automation.
- Every invalid action preserves prior valid state.
