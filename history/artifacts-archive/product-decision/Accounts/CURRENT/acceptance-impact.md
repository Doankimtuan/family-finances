# Acceptance Impact

This file identifies acceptance-criteria impacts only. It does not redesign tests.

## Required Acceptance Criteria Areas

| Area | Affected capabilities | Acceptance impact |
|------|----------------------|-------------------|
| Real account creation and recognition | ACC-PD-001, ACC-PD-002, ACC-PD-003 | User can recognize an account as a real household container. |
| Starting and recorded balance | ACC-PD-004, ACC-PD-005 | Recorded balance is visible and traceable to account context. |
| Real position correctness | ACC-PD-006, ACC-PD-011, ACC-PD-012 | Real position excludes virtual planning and does not inflate owned money with credit. |
| Account history | ACC-PD-007, ACC-PD-010, ACC-PD-035 | Historical accounts remain understandable after leaving active use. |
| Transaction account context | ACC-PD-008, ACC-PD-022 | Transactions and transfers do not corrupt account truth. |
| Reconciliation and adjustments | ACC-PD-009, ACC-PD-017, ACC-PD-020 | Manual trust repair remains explainable. |
| Recognition metadata | ACC-PD-013, ACC-PD-016 | Metadata supports recognition without changing domain ownership. |
| Export | ACC-PD-024 | Account facts can be exported when export scope includes Accounts. |

## Prohibited Acceptance Criteria Areas

| Prohibited area | Reason |
|-----------------|--------|
| Jar balances tied to account balances | Violates BR-01. |
| Health mutating account balances | Violates Health read-only (BR-24). |
| Automatic account movement without user decision | Violates household-first financial safety. |
| Account analytics replacing transaction/category analysis | Duplicates ownership. |

