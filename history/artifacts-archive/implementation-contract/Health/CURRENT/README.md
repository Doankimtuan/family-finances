# Health Implementation Contract

## Overview

This contract defines deterministic implementation behavior for the Health domain.

Health is a read-only household financial condition assessment. It reads grounded facts from owning domains, determines assessability, produces a condition state, explains factors, communicates completeness, and presents read-only scenarios.

## Scope

In scope:

- Assess household Health.
- Refresh assessment from current source facts.
- Determine data completeness.
- Explain Health factors.
- Interpret approved and modified Phase 3 factors.
- Present read-only scenarios.
- Show unavailable, partial, stale, and invalid states.
- Enforce BR-01 and BR-24.

Out of scope:

- Creating, editing, deleting, approving, reconciling, repaying, closing, archiving, or moving money.
- Writing to Accounts, Transactions, Cards, Loans, Savings, Planning, Goals, Inbox, Categories, or Together.
- Creating Inbox items or notifications.
- Medical, insurance, credit, investment, tax, or legal advice.
- Database, API, DTO, event, or code design.

## Relationship With Previous Phases

- Phase 1 discovered Health as a financial condition mirror.
- Phase 2 validated Health against young Vietnamese household behavior.
- Phase 3 approved read-only Health decisions and rejected mutation, advice, automation, invented facts, and black-box scoring.
- Phase 4 defined the business blueprint.
- Phase 5 converts that blueprint into deterministic implementation contracts.

## Implementation Principles

- Health is read-only.
- Health never moves money.
- Health never treats virtual planning as real ledger money.
- Health never invents facts.
- Health must explain every condition.
- Health must expose incompleteness when source facts are missing or stale.
- Health output is context only, never authorization.
