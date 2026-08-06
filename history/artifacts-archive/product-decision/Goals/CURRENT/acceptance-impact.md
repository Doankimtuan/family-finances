# Acceptance Impact

This document identifies Acceptance Criteria impacts only. It does not redesign tests.

## Required Acceptance Criteria Changes

| Impact area | Affected capabilities | Acceptance impact |
| --- | --- | --- |
| Goal progress wording | GOAL-PD-004, GOAL-PD-007 | Acceptance should verify progress is presented as intention, not bank balance. |
| Contribution semantics | GOAL-PD-005 | Acceptance should verify contribution does not imply a real transfer unless evidence exists elsewhere. |
| Lifecycle states | GOAL-PD-006, GOAL-PD-010 | Acceptance should verify active, paused, completed, and cancelled are intention states. |
| Target dates | GOAL-PD-003, GOAL-PD-016 | Acceptance should verify dates are treated as household target timing. |
| Read-only evidence | GOAL-PD-013, GOAL-PD-018 | Acceptance should verify Goals do not mutate Accounts, Transactions, Savings, Cards, Loans, or Health. |
| Savings association | GOAL-PD-012 | Acceptance should verify savings product truth remains owned by Savings. |
| Household visibility | GOAL-PD-009 | Acceptance should verify shared visibility does not imply partner-specific contribution policy beyond approved scope. |

## Deferred Acceptance Areas

Acceptance criteria should not be created yet for:

- Goal-jar association.
- Partner-specific contribution context.
- Goal priority.
- Recurring planned contributions.
- Non-cash gifts/support context.
- Multi-goal trade-off analysis.
- Life-event, education, and home modeling.
- Forecasting, provider matching, inflation review, confidence scoring, or AI explanations.
