# State Machine

This is a business state model only. It does not define implementation state, database state, or technical contracts.

## Business States

| State | Meaning |
| --- | --- |
| Draft | Intention exists but is not yet active for household planning. |
| Active | Intention participates in current planning. |
| Paused | Intention is temporarily inactive and not an allocation target. |
| Needs Review | Intention has unresolved meaning, conflict, stale data, or source uncertainty. |
| Adjusted | Intention was changed and is ready to return to Active or review. |
| Reviewed | Planning period or item was examined by the household. |
| Locked | Reviewed planning period is closed for normal changes. |
| Corrected | Planning mistake was explicitly corrected. |
| Completed | Household considers the intention fulfilled. |
| Cancelled | Household intentionally ended the intention before completion. |
| Archived | Intention is no longer active but remains historical. |
| Historical | Item or period remains for memory and interpretation only. |
| Invalid Attempt | Requested action violated business rules and did not change prior valid state. |

## Allowed Transitions

| From | To | Allowed when |
| --- | --- | --- |
| Draft | Active | Household confirms the intention is usable. |
| Draft | Cancelled | Household abandons the draft. |
| Draft | Invalid Attempt | Draft violates Planning boundaries. |
| Active | Adjusted | Household changes amount, purpose, timing, or allocation. |
| Adjusted | Active | Change is valid and period is not locked. |
| Active | Paused | Household temporarily stops using the intention. |
| Paused | Active | Household resumes the intention. |
| Active | Needs Review | Conflict, stale data, or source uncertainty appears. |
| Needs Review | Active | Household resolves uncertainty without correction. |
| Needs Review | Corrected | Household identifies prior planning mistake. |
| Active | Reviewed | Household reviews item or period. |
| Reviewed | Locked | Household closes the period. |
| Locked | Corrected | Explicit correction path is used. |
| Corrected | Historical | Correction no longer needs active work. |
| Active | Completed | Household considers intention fulfilled. |
| Paused | Completed | Household considers paused intention fulfilled. |
| Active | Cancelled | Household ends intention before fulfillment. |
| Paused | Cancelled | Household ends paused intention. |
| Active | Archived | Household removes intention from active use. |
| Paused | Archived | Household removes paused intention from active use. |
| Completed | Historical | Completed intention becomes historical. |
| Cancelled | Historical | Cancelled intention becomes historical. |
| Archived | Historical | Archived intention becomes historical. |
| Any non-terminal | Invalid Attempt | Requested change violates business rules. |
| Invalid Attempt | Prior valid state | Failed action is abandoned. |

## Forbidden Transitions

| From | To | Reason |
| --- | --- | --- |
| Draft | Completed | Intention must become active or be explicitly cancelled first. |
| Paused | Locked | A planning period may lock; a paused item does not directly lock itself. |
| Completed | Active | Completed intention cannot resume without a new or corrected intention. |
| Cancelled | Active | Cancelled intention cannot resume as ordinary continuation. |
| Archived | Active | Archived intention must not silently become active. |
| Historical | Active | Historical record is not active planning. |
| Locked | Active | Locked period cannot return to normal active state without explicit correction handling. |
| Any | Real Ledger State | Planning states cannot become transaction, account, card, loan, or savings truth. |
| Any | Health-mutated state | Health is read-only and cannot change Planning state. |
| Any | Advisory state | Tax-aware or advisory-grade planning is rejected. |

## Recovery Transitions

| Situation | Recovery transition |
| --- | --- |
| Wrong amount or timing | Active/Reviewed/Locked -> Corrected -> Active or Historical |
| Missing meaning | Active -> Needs Review -> Active |
| Emergency disruption | Active -> Adjusted -> Active |
| Partner conflict | Active -> Needs Review -> Active, Paused, or Cancelled |
| Stale source-domain facts | Active -> Needs Review until facts are refreshed or marked expected |
| Invalid boundary attempt | Any non-terminal -> Invalid Attempt -> prior valid state |

## Terminal States

Terminal for active planning:

- Historical.
- Completed once converted to Historical.
- Cancelled once converted to Historical.
- Archived once converted to Historical.

Invalid Attempt is terminal only for the failed action. It does not terminate the underlying valid Planning item.
