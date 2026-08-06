# Transactions Domain Discovery

## Overview

Transactions are the household's factual record of real money movement. They answer: what happened, when did it happen, how much moved, where did it move from or to, and what real-world event explains the change?

This discovery focuses on Vietnam first, where young households commonly move money through bank accounts, QR transfers, cash, e-wallets, debit cards, credit cards, salary payments, family transfers, merchant refunds, and recurring digital subscriptions.

## Purpose

This pack documents the real-world nature of Transactions before any business, UX, architecture, database, or API design begins.

It is intentionally observational. It does not redesign ViNha, introduce requirements, create product decisions, or modify existing Sources of Truth.

## Scope

Included:

- Real money movement events.
- Income, expense, refund, correction, transfer-like movement, fees, reversals, and read-only imported activity.
- Household transaction review behavior.
- Boundaries with Accounts, Cards, Savings, Loans, Plan, Inbox, Health, Tenancy, and external providers.
- Current factual product comparison based on existing artifacts and code.

Excluded:

- New product features.
- Implementation models.
- Database, API, or UX proposals.
- Official business-rule changes.
- Product decisions or roadmap commitments.

## Document Index

- [domain-purpose.md](./domain-purpose.md)
- [real-world-analysis.md](./real-world-analysis.md)
- [user-behaviors.md](./user-behaviors.md)
- [actors.md](./actors.md)
- [money-flow.md](./money-flow.md)
- [lifecycle.md](./lifecycle.md)
- [capabilities.md](./capabilities.md)
- [boundaries.md](./boundaries.md)
- [edge-cases.md](./edge-cases.md)
- [terminology.md](./terminology.md)
- [risks.md](./risks.md)
- [current-product-gap.md](./current-product-gap.md)
- [future-considerations.md](./future-considerations.md)
- [final-verdict.md](./final-verdict.md)
