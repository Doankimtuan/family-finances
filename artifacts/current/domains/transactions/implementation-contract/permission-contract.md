# Permission Contract

## Role Matrix

| Action | Owner | Partner | Viewer | Admin | Background Worker | System | Reason |
|--------|-------|---------|--------|-------|-------------------|--------|--------|
| Record Income | Allowed | Allowed | Forbidden | Allowed | Forbidden unless acting as System | Allowed with valid business source | Money mutation requires household action authority. |
| Record Expense | Allowed | Allowed | Forbidden | Allowed | Forbidden unless acting as System | Allowed with valid business source | Money mutation requires household action authority. |
| Record Owned-Account Transfer | Allowed | Allowed | Forbidden | Allowed | Forbidden unless acting as System | Allowed with valid business source | Transfer affects real ledger interpretation. |
| Add/Change Meaning | Allowed | Allowed | Forbidden | Allowed | Forbidden unless deterministic system classification is non-final | System may suggest, not finalize without allowed action | Meaning affects household interpretation. |
| Send To Review | Allowed | Allowed | Forbidden | Allowed | Allowed | Allowed | Review item does not move money. |
| Resolve Review | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden unless resolving due to valid state transition | Household decision required. |
| Search/Filter | Allowed | Allowed | Allowed if household visibility permits | Allowed | Allowed for read-only processing | Allowed | Read-only access. |
| Record Refund | Allowed | Allowed | Forbidden | Allowed | Forbidden unless acting as System | Allowed with valid business source | Real money event. |
| Correct Transaction | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden except deterministic system recovery with household-approved facts | Correction changes trusted ledger story. |
| Reverse Transaction | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden except deterministic system recovery with household-approved facts | Reversal unwinds active truth. |
| Lightweight Reconciliation | Allowed | Allowed | Viewer allowed read-only comparison if visibility permits | Allowed | Allowed read-only | Allowed read-only | Confidence behavior only. |
| Archive As Historical | Allowed | Allowed | Forbidden | Allowed | Allowed when no active review remains | Allowed when deterministic | Changes active-work state, not money. |

## Permission Rules

- Viewer can read only; Viewer cannot mutate money, meaning, review status, correction, reversal, refund, or historical state.
- Background Worker cannot make household judgment decisions.
- System cannot use AI, Health, or provider data as final transaction truth.
- Admin can act within household money boundaries but cannot violate BR-01 or BR-24.
- Forbidden actions must leave prior state unchanged.
