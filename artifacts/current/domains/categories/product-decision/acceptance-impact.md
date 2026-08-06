# Acceptance Impact

This document identifies Acceptance Criteria impacts only. It does not redesign tests.

## Required Acceptance Criteria Changes

| Acceptance area | Affected capabilities | Impact |
| --- | --- | --- |
| Create category | CAT-PD-001, CAT-PD-002, CAT-PD-008 | Acceptance should verify household category creation preserves kind and household scope. |
| Categorize transaction | CAT-PD-003, CAT-PD-005 | Acceptance should verify category assignment changes meaning only, not amount, account, date, or direction. |
| Uncategorized state | CAT-PD-004 | Acceptance should verify unknown meaning can remain explicit without forced guessing. |
| Category filter | CAT-PD-006 | Acceptance should verify filtering returns transaction facts by assigned category. |
| Category actuals summary | CAT-PD-007 | Acceptance should verify summary copy and behavior do not imply budgets, balances, or available money. |
| Boundary protection | CAT-PD-010, CAT-PD-011 | Acceptance should verify Categories do not mutate Accounts, Jars, Goals, Health, Cards, Loans, or Provider truth. |
| Rename/archive/restore | CAT-PD-009, CAT-PD-012, CAT-PD-013, CAT-PD-014 | Acceptance should verify historical transactions remain interpretable after category lifecycle changes. |
| Provider suggestion | CAT-PD-018, CAT-PD-036, CAT-PD-037 | Acceptance should verify provider or inferred labels are not silently treated as final household truth. |
| Shared meaning | CAT-PD-030 | Acceptance should verify shared category meaning is visible as household context without creating approval or surveillance behavior. |

## Negative Acceptance Areas

| Rejected behavior | Affected capabilities | Impact |
| --- | --- | --- |
| Category holds money | CAT-PD-031 | Acceptance should prevent category balance or money-container behavior. |
| Category shows available balance | CAT-PD-032 | Acceptance should prevent category spendable-balance semantics. |
| Category executes payment | CAT-PD-033 | Acceptance should prevent category-triggered payment execution. |
| Category enforces cap | CAT-PD-034 | Acceptance should prevent category-owned limit enforcement. |
| Category replaces jar | CAT-PD-035 | Acceptance should prevent category-as-planning-container behavior. |

## Test Design Note

Later acceptance design should focus on business behavior and boundary safety. This board does not define implementation tests.
