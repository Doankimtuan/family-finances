# Cards Business Blueprint

## Overview

This blueprint defines the business behavior of Cards in ViNha.

Cards are household payment instruments. Credit cards additionally represent issuer-granted borrowing capacity, statement obligations, due dates, repayment progress, and household trust risk.

## Scope

Included:

- Card identity as a household-recognizable financial instrument.
- Card type distinction with credit-card obligation foregrounded.
- Issuer identity and optional secondary network identity.
- Lightweight cardholder responsibility and card status.
- Credit limit and available credit as borrowing capacity only.
- Statement date, due date, statement balance, paid amount, and remaining due amount.
- Billing-period association for card transactions.
- Separation of card purchase, card repayment, refund, fee, interest, and simple cashback or statement credit.
- Card-origin installment awareness without duplicating Loans.
- Card repayment from real money source.
- Card history after closure, expiry, replacement, or archive.
- Read-only Health interpretation of card risk.

Excluded:

- Treating available credit as cash.
- Treating revolving card debt as Loans by default.
- Automatic repayment execution.
- Health mutation of card state.
- Provider-verified feeds, automatic reconciliation, statement parsing, fraud detection, reward optimization, tokenized-card tracking, country rule packs, and detailed dispute lifecycle.
- Technical implementation, APIs, database, DTOs, or event contracts.

## Business Responsibility

Cards owns the household's understanding of card-specific obligations and card-specific payment behavior.

Cards does not own real money containers, transaction audit truth, virtual planning allocations, loan amortization, partner permissions, financial advice, or provider-grade statement confirmation.

## Relationship With Previous Phases

Phase 1 discovered the real-world Cards domain.

Phase 2 validated the domain against young Vietnamese household behavior.

Phase 3 approved and scoped product decisions.

This Phase 4 blueprint converts approved and modified decisions into deterministic business behavior for future implementation-contract work.
