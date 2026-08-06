# Cards Domain Discovery

## Overview

Cards are payment instruments that let a household spend, withdraw cash, or access credit through an issuer-defined account relationship. In real life, cards are not just plastic objects; they combine an issuing institution, card network, spending limits, billing rules, merchant acceptance, fees, security controls, and dispute processes.

This discovery focuses on Vietnam first, where households commonly encounter domestic NAPAS debit cards, international debit cards, credit cards, co-branded cards, virtual cards, supplementary cards, and occasional prepaid cards.

## Purpose

This pack documents the real-world nature of Cards before any business, UX, architecture, database, or API design begins.

It is intentionally observational. It does not redesign ViNha, introduce requirements, create product decisions, or modify existing Sources of Truth.

## Scope

Included:

- Debit, credit, prepaid, physical, virtual, domestic, international, and supplementary cards.
- Card identity, issuer relationship, limit, billing cycle, authorization, settlement, fees, rewards, disputes, and lifecycle.
- Vietnam card operations, NAPAS context, and ordinary household behavior.
- Boundaries with Accounts, Transactions, Loans, Debts, Jars, Planning, Inbox, Health, and external card providers.

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
