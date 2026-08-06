# State Machine

This is a business state model only. It does not define implementation state, database state, or technical contracts.

## Business States

| State | Meaning |
| --- | --- |
| Active | Goal is currently pursued as household intention. |
| Paused | Goal is temporarily not being pursued, but remains meaningful. |
| Completed | Household considers the goal intention fulfilled. |
| Cancelled | Household intentionally ended the goal before completion. |
| Invalid Attempt | Requested action violated business rules and did not change prior valid state. |

## Allowed Transitions

| From | To | Allowed when |
| --- | --- | --- |
| None | Active | Valid goal is created. |
| Active | Active | Goal meaning, target, date, note, progress, or evidence context changes validly. |
| Active | Paused | Household temporarily stops pursuit. |
| Paused | Active | Household resumes pursuit. |
| Paused | Paused | Paused goal meaning or context changes validly. |
| Active | Completed | Household considers intention fulfilled. |
| Paused | Completed | Household considers paused intention fulfilled. |
| Active | Cancelled | Household ends goal before fulfillment. |
| Paused | Cancelled | Household ends paused goal. |
| Any non-terminal | Invalid Attempt | Requested change violates business rules. |
| Invalid Attempt | Prior valid state | Failed action is abandoned or corrected. |

## Forbidden Transitions

| From | To | Reason |
| --- | --- | --- |
| Completed | Active | Completed goal cannot resume as ordinary continuation. A new or corrected intention is required. |
| Cancelled | Active | Cancelled goal cannot silently become active again. A new or corrected intention is required. |
| Completed | Paused | Completed intention is no longer active pursuit. |
| Cancelled | Paused | Cancelled intention is no longer active pursuit. |
| Completed | Cancelled | Completion and cancellation are distinct terminal meanings. |
| Cancelled | Completed | Cancelled goal cannot become completed without a new or corrected intention. |
| Any | Account balance | Goal state cannot become real account truth. |
| Any | Transaction | Goal state cannot become real money movement. |
| Any | Savings product state | Goal state cannot become savings product truth. |
| Any | Health-mutated state | Health is read-only and cannot change Goals. |

## Recovery Transitions

| Situation | Recovery transition |
| --- | --- |
| Wrong target or date | Active/Paused -> Active/Paused with corrected meaning |
| Mistaken progress | Active/Paused -> Active/Paused with corrected progress interpretation |
| Emergency interruption | Active -> Paused or Cancelled |
| Partner disagreement | Active -> Paused or prior valid Active state remains |
| Completion mistake | Completed remains terminal until explicitly treated as corrected business meaning |
| Cancellation mistake | Cancelled remains terminal until explicitly treated as corrected business meaning |
| Invalid boundary attempt | Any non-terminal -> Invalid Attempt -> prior valid state |

## Terminal States

Terminal for ordinary goal pursuit:

- Completed.
- Cancelled.

Invalid Attempt is terminal only for the failed action. It does not terminate the underlying valid Goal.
