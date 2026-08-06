# Permission Contract

## Role Matrix

| Action | Owner | Partner | Viewer | Admin | Background Worker | System | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| View goal | Allowed | Allowed | Allowed | Allowed | Allowed read-only | Allowed read-only | Household visibility is approved. |
| Create Goal | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Requires household money-action rights. |
| Edit Goal | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Changes household intention. |
| Add Contribution Update | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Changes goal progress intention. |
| Pause Goal | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Changes lifecycle state. |
| Resume Goal | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Changes lifecycle state. |
| Complete Goal | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Ends ordinary pursuit. |
| Cancel Goal | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Ends ordinary pursuit. |
| Associate Savings Product Context | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Changes contextual relationship. |
| Review Real-Money Evidence | Allowed | Allowed | Allowed read-only | Allowed | Allowed read-only | Allowed read-only | Evidence review must not mutate source facts. |
| Handle Deadline Pressure | Allowed view/action | Allowed view/action | Allowed view-only | Allowed view/action | Allowed read-only | Allowed read-only | Deadline pressure does not mutate without user action. |
| Create Inbox item for evidence conflict | Forbidden manually unless using Inbox rules | Forbidden manually unless using Inbox rules | Forbidden | Allowed only through Inbox rules | Allowed when rule condition is met | Allowed when rule condition is met | Avoid unnecessary Inbox items. |
| Mutate Health from Goals | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | BR-24. |
| Write ledger from Goals | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | BR-01. |

## Permission Rules

- Owner, Partner, and Admin must be active household members.
- Viewer can inspect but cannot mutate Goals.
- Background Worker and System can evaluate read-only timing or evidence conditions only.
- No actor can use Goals to mutate real money domains.
