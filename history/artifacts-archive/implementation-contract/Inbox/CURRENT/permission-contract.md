# Permission Contract

## Role Matrix

| Action | Owner | Partner | Viewer | Admin | Background Worker | System | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Create Review Item | Allowed | Allowed when source valid | Forbidden | Allowed | Allowed with source reason | Allowed with source reason | Review item does not move money but requires valid household scope. |
| Review Item | Allowed | Allowed | Allowed if visibility permits | Allowed | Allowed read-only | Allowed read-only | Read-only inspection. |
| Resolve Item | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden except constrained auto-resolution action | Household decision required. |
| Acknowledge Item | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Household awareness decision required. |
| Dismiss Item | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden unless source invalidates attention deterministically | Active-work mutation. |
| Defer Item | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden unless deterministic source timing applies | Household postponement decision. |
| Return Deferred To Pending | Allowed | Allowed | Forbidden | Allowed | Allowed with valid timing/source | Allowed with valid timing/source | Restores active review. |
| Expire Time-Bound Item | Forbidden manually unless Admin policy permits | Forbidden manually unless Admin policy permits | Forbidden | Allowed | Allowed | Allowed | Time-based business rule. |
| Archive Completed Item | Allowed | Allowed | Forbidden | Allowed | Allowed when completed | Allowed when completed | Historical state only. |
| Suggest Resolution | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | Allowed | Read-only decision support. |
| Auto-Resolve Pattern | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | Allowed only if eligible | Constrained system outcome, no money movement. |
| Recover Item | Allowed | Allowed | Forbidden | Allowed | Allowed with source evidence | Allowed with source evidence | Renewed attention must be explainable. |

## Permission Rules

- Viewer can read only and cannot mutate Inbox state.
- Background Worker cannot make household judgment decisions.
- System cannot resolve ambiguous or high-risk items.
- Admin cannot violate BR-01, BR-24, or rejected Product Decision scope.
- Forbidden actions must leave prior state unchanged.
