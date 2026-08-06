# Implementation Priority

This document recommends implementation order only. It does not define implementation details.

## High Priority

| Capability IDs | Capabilities | Dependency reason |
|----------------|--------------|-------------------|
| CARD-PD-001, CARD-PD-003 | Card instrument and issuer identity | Establishes recognizable card record. |
| CARD-PD-007, CARD-PD-009, CARD-PD-010 | Credit limit, statement date, due date | Required before due amount and planning awareness can be meaningful. |
| CARD-PD-011, CARD-PD-012, CARD-PD-013 | Statement, paid, remaining due amounts | Core credit-card obligation model. |
| CARD-PD-015, CARD-PD-022 | Purchase/repayment separation and repayment source | Protects BR-01 and avoids double-counting. |

## Medium Priority

| Capability IDs | Capabilities | Dependency reason |
|----------------|--------------|-------------------|
| CARD-PD-014 | Billing-period association | Depends on basic card and date facts. |
| CARD-PD-016 | Refund awareness | Depends on purchase and billing context. |
| CARD-PD-023 | History preservation | Depends on card lifecycle and transaction history clarity. |
| CARD-PD-002, CARD-PD-006, CARD-PD-008 | Type distinction, lightweight status, available credit framing | Useful after core credit-card record is stable. |
| CARD-PD-017, CARD-PD-018, CARD-PD-019 | Fee, interest, cashback awareness | Should follow stable statement and transaction concepts. |

## Low Priority

| Capability IDs | Capabilities | Dependency reason |
|----------------|--------------|-------------------|
| CARD-PD-004, CARD-PD-005 | Network and cardholder-role awareness | Useful but not required for minimum household safety. |
| CARD-PD-021, CARD-PD-024, CARD-PD-026, CARD-PD-031 | Supplementary spending, detailed fees, card installments, repayment pattern | Needs validation and clear boundaries after base model. |
| CARD-PD-038 | Health read-only analysis | Depends on trustworthy card data and Health guardrails. |

## Not Prioritized For Implementation

Deferred and rejected capabilities should not enter implementation planning until a later Product Decision review changes their status.
