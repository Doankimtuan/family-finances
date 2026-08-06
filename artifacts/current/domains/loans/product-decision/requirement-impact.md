# Requirement Impact

This file identifies requirement impacts only. It does not define implementation.

## New Requirements

| Requirement area | Affected capabilities | Impact |
|------------------|----------------------|--------|
| Core loan record | LOAN-PD-001, LOAN-PD-002, LOAN-PD-004, LOAN-PD-006, LOAN-PD-007 | Product requirements need explicit loan obligation, lender, principal, broad type, and term. |
| Repayment schedule awareness | LOAN-PD-008, LOAN-PD-009, LOAN-PD-010, LOAN-PD-018 | Requirements need due date and expected payment awareness, primarily monthly. |
| Real repayment tracking | LOAN-PD-012, LOAN-PD-013, LOAN-PD-014 | Requirements need repayment history tied to real money source. |
| Status and history | LOAN-PD-015, LOAN-PD-016 | Requirements need lifecycle status and preservation after completion. |
| Partner relevance | LOAN-PD-003, LOAN-PD-019 | Requirements need household relevance without assuming all debt is shared debt. |
| Rate-change awareness | LOAN-PD-023, LOAN-PD-024 | Requirements need simple variable/promotional rate awareness where relevant. |

## Modified Requirements

| Requirement area | Affected capabilities | Impact |
|------------------|----------------------|--------|
| Remaining amount language | LOAN-PD-005 | Requirements should distinguish recorded remaining principal from provider-confirmed outstanding balance. |
| Component split | LOAN-PD-011 | Requirements should allow conceptual distinction without requiring complete fee/interest breakdown. |
| Planned vs actual | LOAN-PD-017 | Requirements should support lightweight mismatch awareness, not advanced reconciliation. |
| Early payoff | LOAN-PD-025 | Requirements should treat payoff as estimate unless provider-confirmed. |
| Informal loans | LOAN-PD-020 | Requirements should keep family/friend loan context lightweight. |

## Removed Requirements

| Requirement area | Affected capabilities | Impact |
|------------------|----------------------|--------|
| Credit-card balance as loan | LOAN-PD-043 | Any requirement treating revolving card balance as Loan should be removed or reassigned to Cards. |
| Loan-owned payoff jar | LOAN-PD-044 | Any requirement placing virtual payoff allocation inside Loans should be removed or reassigned to Planning/Jars/Goals. |
| Health write-back | LOAN-PD-045 | Any requirement allowing Health to mutate loan data should be removed. |
| Automatic repayment execution | LOAN-PD-046 | Any requirement allowing Loans to initiate real repayment should be removed. |

