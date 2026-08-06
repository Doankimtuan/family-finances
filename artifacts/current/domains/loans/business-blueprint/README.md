# Loans Business Blueprint

## Overview

This blueprint defines the business behavior of Loans in ViNha.

Loans are household borrowing obligations. They describe what the household owes, who is owed, what repayment is expected, what has actually been paid, and whether the obligation is still active.

## Scope

Included:

- Loan obligation identity.
- Lender identity.
- Household relevance.
- Principal and recorded remaining principal.
- Broad loan type.
- Repayment term, frequency, due dates, and expected payment amount.
- Real repayments and payment history.
- Payment source context.
- Loan status and completion history.
- Lightweight planned-versus-actual awareness.
- Upcoming and overdue awareness.
- Simple informal loan notes.
- Simple variable or promotional rate awareness.
- Early payoff estimate as planning information only.

Excluded:

- Credit-card revolving balances.
- Loan-owned payoff jars or virtual allocations.
- Automatic repayment execution.
- Health mutations.
- Provider import and automatic reconciliation.
- Collateral, guarantor, refinance, consolidation, and regulatory comparison.
- Technical implementation, APIs, database, DTOs, or event contracts.

## Business Responsibility

Loans owns the household's understanding of scheduled borrowing obligations.

It does not own the account that money leaves from, the transaction record of money movement, virtual planning allocations, credit-card statement behavior, or financial advice.

## Relationship With Previous Phases

Phase 1 discovered the real-world Loans domain.

Phase 2 validated the domain against young Vietnamese household behavior.

Phase 3 approved and scoped product decisions.

This Phase 4 blueprint converts approved and modified decisions into deterministic business behavior for future implementation-contract work.

