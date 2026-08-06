# Acceptance Impact

This file identifies required Acceptance Criteria impacts only. It does not redesign tests.

## Required Acceptance Criteria Changes

| Area | Affected capabilities | Acceptance impact |
|------|----------------------|-------------------|
| Loan identity | LOAN-PD-001, LOAN-PD-002 | AC must confirm a loan is identifiable as an obligation with lender context. |
| Principal and remaining amount | LOAN-PD-004, LOAN-PD-005 | AC must confirm original principal and recorded remaining principal are distinguishable. |
| Schedule awareness | LOAN-PD-007, LOAN-PD-008, LOAN-PD-009, LOAN-PD-010 | AC must confirm term, due date, frequency, and expected amount are understandable. |
| Real repayment | LOAN-PD-012, LOAN-PD-013, LOAN-PD-014 | AC must confirm repayment records preserve real money source and history. |
| Status lifecycle | LOAN-PD-015, LOAN-PD-016 | AC must confirm active/completed/closed states do not erase history. |
| Upcoming/overdue awareness | LOAN-PD-018 | AC must confirm loan due awareness does not initiate payment automatically. |
| Planned vs actual | LOAN-PD-017 | AC must confirm mismatch language avoids claiming provider truth. |
| Rate awareness | LOAN-PD-023, LOAN-PD-024 | AC must confirm rate-change information is clear and does not imply provider confirmation unless present. |
| Early payoff | LOAN-PD-025 | AC must confirm payoff is treated as estimate, not lender quote. |
| Boundary protection | LOAN-PD-043, LOAN-PD-044, LOAN-PD-045, LOAN-PD-046 | AC must prevent card-balance-as-loan, loan-owned virtual jars, Health mutation, and automatic repayment execution. |

## Deferred Acceptance Areas

Acceptance criteria for collateral, guarantors, provider imports, reconciliation, credit-history education, refinancing, consolidation, and regulatory disclosure should wait until those capabilities leave deferred status.

