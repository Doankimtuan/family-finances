# State Contract

## Business States

| State | Meaning | Visible as active work? |
| --- | --- | --- |
| Draft | Intention exists but is not active. | Yes |
| Active | Intention participates in current planning. | Yes |
| Paused | Intention is inactive and not an allocation target. | Yes |
| Needs Review | Intention has unresolved meaning, stale data, conflict, or source uncertainty. | Yes |
| Adjusted | Valid change was made and should return to Active or review. | Yes |
| Reviewed | Item or period was examined. | Yes |
| Locked | Period is closed for normal planning changes. | Yes |
| Corrected | Planning mistake was explicitly corrected. | Transitional |
| Completed | Household considers intention fulfilled. | Transitional |
| Cancelled | Household ended intention before fulfillment. | Transitional |
| Archived | Intention removed from active use. | Transitional |
| Historical | Record remains for memory only. | No |
| Invalid Attempt | Failed action did not alter prior valid state. | No |

## Allowed Transitions

| From | To | Contract |
| --- | --- | --- |
| Draft | Active | Valid create/confirm action. |
| Draft | Cancelled | User abandons draft. |
| Draft | Invalid Attempt | Boundary or validation failure. |
| Active | Adjusted | Valid edit, allocation, due, recurring, or emergency change. |
| Adjusted | Active | Change is accepted. |
| Active | Paused | Valid pause. |
| Paused | Active | Valid resume. |
| Active | Needs Review | Conflict, stale fact, invalid source, or partner challenge. |
| Needs Review | Active | Review resolves without correction. |
| Needs Review | Corrected | Review finds Planning mistake. |
| Active | Reviewed | Period or item review occurs. |
| Reviewed | Locked | Household approves/locks period. |
| Locked | Corrected | Explicit correction path. |
| Corrected | Active | Correction applies to ongoing intention. |
| Corrected | Historical | Correction closes old period or item. |
| Active | Completed | Household marks fulfilled. |
| Paused | Completed | Household marks fulfilled. |
| Active | Cancelled | Household abandons active intention. |
| Paused | Cancelled | Household abandons paused intention. |
| Active | Archived | Household removes from active use. |
| Paused | Archived | Household removes from active use. |
| Completed | Historical | Completion leaves active work. |
| Cancelled | Historical | Cancellation leaves active work. |
| Archived | Historical | Archive leaves active work. |
| Any non-terminal | Invalid Attempt | Contract violation. |
| Invalid Attempt | Prior valid state | Failed attempt closes. |

## Forbidden Transitions

| From | To | Reason |
| --- | --- | --- |
| Draft | Completed | Must be active or cancelled first. |
| Paused | Locked | Only periods lock directly. |
| Completed | Active | Completed intent cannot silently resume. |
| Cancelled | Active | Cancelled intent cannot silently resume. |
| Archived | Active | Archived intent cannot silently resume. |
| Historical | Active | Historical record is inactive. |
| Locked | Active | Locked period requires correction path. |
| Any | Real Ledger state | Planning cannot become money movement. |
| Any | Health-mutated state | Health is read-only. |
| Any | Advisory state | Advisory-grade planning is rejected. |

## Terminal States

- Historical is terminal for active Planning work.
- Completed, Cancelled, and Archived are terminal only after conversion to Historical.
- Invalid Attempt is terminal only for the failed action.

## Recovery Transitions

| Problem | Recovery |
| --- | --- |
| Wrong amount or timing | Active/Reviewed/Locked -> Corrected -> Active or Historical |
| Missing meaning | Active -> Needs Review -> Active |
| Emergency disruption | Active -> Adjusted -> Active |
| Partner conflict | Active -> Needs Review -> Active, Paused, or Cancelled |
| Stale source facts | Active -> Needs Review until refreshed or marked expected |
| Invalid action | Any non-terminal -> Invalid Attempt -> prior valid state |
