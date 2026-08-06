# Permission Contract

## Roles

- Owner: Active household member who created or primarily manages a planning item.
- Partner: Active household member with daily Money/Plan/Inbox rights.
- Viewer: Read-only participant, if supported by consuming surface.
- Admin: Household member with elevated household policy authority.
- Background Worker: System actor performing approved reminders, stale checks, or read-only comparisons.
- System: Contract enforcement actor.

## Permission Matrix

| Action | Owner | Partner | Viewer | Admin | Background Worker | System | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Create Income Intention | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Human planning action. |
| Create Jar | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Human purpose decision. |
| Update Jar Or Allocation | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Changes household intention. |
| Pause Intention | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Changes active planning state. |
| Resume Intention | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Changes active planning state. |
| Create Or Update Goal | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Human goal decision. |
| Create Or Update Recurring Expectation | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Human expectation decision. |
| Maintain Expected Due Date | Allowed | Allowed | Forbidden | Allowed | Allowed only from read-only source facts | Forbidden directly | Due pressure may be human or read-only derived. |
| Compare Plan With Facts | Allowed | Allowed | View only | Allowed | Allowed | Allowed for enforcement | Read-only comparison. |
| Review Period | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Household review decision. |
| Correct Planning | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Human correction. |
| Emergency Reallocation | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Human emergency planning decision. |
| Complete Intention | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Human completion judgment. |
| Cancel Intention | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Human termination decision. |
| Archive Intention | Allowed | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Human historical decision. |
| Create Inbox Review Need | Allowed when action creates need | Allowed when action creates need | Forbidden | Allowed | Allowed for stale/mismatch detection | Allowed for enforcement | Creates decision work only. |
| Send Notification | Forbidden directly | Forbidden directly | Forbidden | Forbidden directly | Allowed for approved reminders | Allowed for enforcement | Notification is system behavior. |
| Reject Invalid Attempt | Not applicable | Not applicable | Not applicable | Not applicable | Not applicable | Allowed | Contract enforcement. |

## Universal Permission Rules

- Non-members cannot read or mutate Planning.
- Viewer cannot create, edit, correct, approve, cancel, archive, or reallocate.
- Background Worker cannot make household choices.
- System may reject invalid actions but must not invent household facts.
- Admin authority does not allow advisory-grade, tax-aware, or real-money Planning behavior.
