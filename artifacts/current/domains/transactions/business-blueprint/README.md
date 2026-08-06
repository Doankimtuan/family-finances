# Transactions Business Blueprint

## Overview

This blueprint defines the deterministic business behavior of the Transactions domain for ViNha.

Transactions are the household's factual record of real money movement. The domain answers one business question: what happened to the household's money?

## Scope

In scope:

- Recording real money movement.
- Income, expense, and owned-account transfer interpretation.
- Required transaction facts: amount, currency, date, account, and direction.
- Chronological household activity.
- Household notes and descriptions.
- Category meaning.
- Unresolved transaction review.
- Search and filtering as business retrieval behavior.
- Refund, reversal, and correction audit behavior.
- Transaction evidence for account changes.
- Read-only factual input to Planning, Inbox, Health, Cards, Loans, Savings, Goals, Categories, and Together.
- Lightweight reconciliation as confidence behavior.

Out of scope:

- Provider import.
- Merchant normalization.
- Pending versus posted provider lifecycle.
- Receipt attachment.
- Split categorization.
- Formal cash reconciliation.
- Duplicate detection beyond rejected repeated business attempts.
- Recurring pattern detection.
- Foreign currency and remittance context.
- Partner comments and household-level review history.
- Health write-back.
- AI or provider authority over ledger truth.

## Business Responsibility

Transactions owns the business truth of real money movement events. It does not own account identity, virtual planning allocation, health interpretation, card statement lifecycle, loan schedules, savings maturity, goal intent, partner permissions, or provider connectivity.

## Relationship With Previous Phases

- Phase 1 discovered Transactions as factual real-money movement.
- Phase 2 validated Transactions against young Vietnam-first household behavior.
- Phase 3 approved the factual transaction backbone and modified risky capabilities with guardrails.
- Phase 4 converts approved and modified decisions into a business contract.
