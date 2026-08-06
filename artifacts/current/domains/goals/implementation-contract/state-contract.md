# State Contract

## Business States

| State | Meaning |
| --- | --- |
| Active | Goal is currently pursued as household intention. |
| Paused | Goal is temporarily not pursued but remains meaningful. |
| Completed | Household considers the goal intention fulfilled. |
| Cancelled | Household ended the goal before completion. |
| Invalid Attempt | Requested action violated rules and did not change prior valid state. |

## Allowed Transitions

| From | To | Action |
| --- | --- | --- |
| None | Active | Create Goal |
| Active | Active | Edit Goal, Add Contribution, Review Evidence, Handle Deadline |
| Paused | Paused | Edit Goal, Add Contribution, Review Evidence, Handle Deadline |
| Active | Paused | Pause Goal |
| Paused | Active | Resume Goal |
| Active | Completed | Complete Goal or contribution reaches target and completion rule applies |
| Paused | Completed | Complete Goal |
| Active | Cancelled | Cancel Goal |
| Paused | Cancelled | Cancel Goal |
| Active | Invalid Attempt | Invalid action attempt |
| Paused | Invalid Attempt | Invalid action attempt |
| Invalid Attempt | Prior valid state | Failed action is abandoned |

## Forbidden Transitions

| From | To | Reason |
| --- | --- | --- |
| Completed | Active | Completed goal cannot resume as ordinary continuation. |
| Cancelled | Active | Cancelled goal cannot silently restart. |
| Completed | Paused | Completed goal is not active pursuit. |
| Cancelled | Paused | Cancelled goal is not active pursuit. |
| Completed | Cancelled | Completion and cancellation are distinct terminal meanings. |
| Cancelled | Completed | Cancelled goal cannot become completed without explicit corrected business meaning. |
| Any | Real Ledger movement | Goal state never creates money movement. |
| Any | Savings product state | Goal state never becomes product truth. |
| Any | Health mutation | Health cannot mutate Goals. |

## Terminal States

Terminal for ordinary actions:

- Completed.
- Cancelled.

Terminal states reject:

- Edit.
- Contribution.
- Pause.
- Resume.
- Savings association.
- Automatic deadline state changes.

## Recovery Transitions

| Situation | Required recovery |
| --- | --- |
| Invalid create | No goal exists; user retries with valid input. |
| Invalid edit | Prior valid state remains; user retries valid edit. |
| Invalid contribution | Progress remains unchanged; user retries valid contribution. |
| Mistaken Active/Paused meaning | Edit while non-terminal. |
| Mistaken Completed | Requires explicit corrected business handling outside ordinary resume. |
| Mistaken Cancelled | Requires explicit corrected business handling outside ordinary resume. |
| Source evidence conflict | Goal remains current state; evidence shown as uncertain/conflicting. |
