# Implementation Priority

This file recommends implementation order only. It does not define implementation.

## High

| Capability IDs | Capabilities | Dependency rationale |
|----------------|--------------|----------------------|
| LOAN-PD-001, LOAN-PD-002, LOAN-PD-004, LOAN-PD-005, LOAN-PD-007, LOAN-PD-009, LOAN-PD-010, LOAN-PD-012, LOAN-PD-013, LOAN-PD-014, LOAN-PD-015, LOAN-PD-016, LOAN-PD-018 | Core obligation, lender, principal, remaining principal, term, due date, expected payment, real repayment, payment source, history, status, completed history, upcoming/overdue awareness. | These are the minimum safe household loan layer. |

## Medium

| Capability IDs | Capabilities | Dependency rationale |
|----------------|--------------|----------------------|
| LOAN-PD-003, LOAN-PD-006, LOAN-PD-008, LOAN-PD-011, LOAN-PD-017, LOAN-PD-019, LOAN-PD-020, LOAN-PD-023, LOAN-PD-024, LOAN-PD-025 | Household relevance, broad type, repayment frequency, component distinction, planned-vs-actual awareness, partner visibility, informal notes, variable/promotional rate awareness, early payoff estimate. | These add clarity and trust after core loan facts exist; several require careful language. |

## Low

| Capability IDs | Capabilities | Dependency rationale |
|----------------|--------------|----------------------|
| LOAN-PD-026, LOAN-PD-029 | Prepayment fee awareness and payment-method preference. | Useful but not necessary before stable core tracking and user validation. |

## Not Prioritized Now

Deferred and rejected capabilities are not implementation priorities.

