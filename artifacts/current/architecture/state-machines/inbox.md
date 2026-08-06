# State Machine

## Business States

| State | Meaning |
| --- | --- |
| Candidate | Source attention has been identified but is not yet accepted as an Inbox item. |
| Pending | Active unresolved financial attention awaiting household outcome. |
| Deferred | Active unresolved attention intentionally postponed. |
| Resolved | Household made the required decision. |
| Acknowledged | Household recognized the item and no deeper Inbox action is required. |
| Dismissed | Household intentionally removed the item from active attention. |
| Expired | Time-bound attention is no longer active. |
| Auto-Resolved | A constrained accepted pattern resolved the item without active review. |
| Archived | Historical item retained for decision memory. |
| Invalid Attempt | A requested action failed business rules and did not change the item. |

## Allowed Transitions

| From | To | Allowed when |
| --- | --- | --- |
| Candidate | Pending | Source, reason, household, and eligibility are valid. |
| Candidate | Invalid Attempt | Source, reason, or eligibility is invalid. |
| Pending | Resolved | Household decision is valid and complete. |
| Pending | Acknowledged | Awareness is sufficient and allowed for the item. |
| Pending | Dismissed | Dismissal will not hide required financial attention. |
| Pending | Deferred | Context is intentionally missing and deferral is allowed. |
| Pending | Expired | Time-bound active window has passed. |
| Pending | Auto-Resolved | Constrained accepted pattern applies. |
| Pending | Invalid Attempt | Requested outcome violates business rules. |
| Deferred | Pending | Context arrives or review resumes. |
| Deferred | Dismissed | Dismissal is valid and does not hide required attention. |
| Deferred | Expired | Time-bound active window has passed. |
| Deferred | Invalid Attempt | Requested outcome violates business rules. |
| Resolved | Archived | Outcome no longer needs active display. |
| Acknowledged | Archived | Outcome no longer needs active display. |
| Dismissed | Archived | Outcome no longer needs active display. |
| Expired | Archived | Outcome no longer needs active display. |
| Auto-Resolved | Archived | Outcome no longer needs active display. |
| Resolved | Pending | New source evidence reopens attention. |
| Acknowledged | Pending | New source evidence shows acknowledgement was insufficient. |
| Dismissed | Pending | Dismissal is later found incomplete. |
| Expired | Pending | New source evidence creates renewed attention. |
| Archived | Pending | Recovery requires active review with preserved history. |
| Invalid Attempt | Pending | Prior valid state was Pending. |
| Invalid Attempt | Deferred | Prior valid state was Deferred. |

## Forbidden Transitions

| From | To | Reason |
| --- | --- | --- |
| Candidate | Resolved | Item must first be accepted as active attention. |
| Candidate | Archived | Invalid or unaccepted attention cannot become history. |
| Pending | Archived | Active unresolved attention cannot be hidden as history. |
| Deferred | Archived | Deferred unresolved attention cannot be hidden as history. |
| Acknowledged | Resolved | Acknowledgement and resolution are different outcomes. |
| Dismissed | Resolved | Dismissal cannot later pretend a decision was made without recovery. |
| Expired | Resolved | Expiration does not imply household decision. |
| Auto-Resolved | Resolved | Auto-resolved history remains distinct from active user resolution. |
| Any | Real Ledger state | Inbox states cannot become money movement states. |
| Any | Planning state | Inbox states cannot become virtual allocation states. |
| Any | Health-mutated state | Health cannot change Inbox state. |

## Recovery Transitions

| Situation | Recovery transition |
| --- | --- |
| Missing context becomes available | Deferred -> Pending |
| Prior decision questioned | Resolved -> Pending |
| Dismissal was wrong | Dismissed -> Pending |
| Expired item becomes relevant again | Expired -> Pending |
| Archived item needs renewed review | Archived -> Pending |
| Invalid attempt made | Invalid Attempt -> prior valid state |

## Terminal States

Archived:

- Terminal for normal active Inbox work.
- May be recovered only when new attention is explainable.

Invalid Attempt:

- Terminal for the failed action only.
- Does not replace the prior valid state.

Rejected source attention:

- Candidate that fails eligibility does not become an Inbox item.
