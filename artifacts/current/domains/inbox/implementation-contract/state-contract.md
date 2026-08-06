# State Contract

## Business States

| State | Meaning | Active? | Terminal? |
| --- | --- | --- | --- |
| Candidate | Source attention identified but not accepted. | No | No |
| Pending | Active unresolved financial attention. | Yes | No |
| Deferred | Active unresolved attention intentionally postponed. | Yes | No |
| Resolved | Household made required decision. | No | No |
| Acknowledged | Household awareness is sufficient. | No | No |
| Dismissed | Household intentionally removed active attention. | No | No |
| Expired | Time-bound attention is no longer active. | No | No |
| Auto-Resolved | Accepted constrained pattern resolved item. | No | No |
| Archived | Historical retained item. | No | Yes for normal work |
| Invalid Attempt | Failed action marker only. | No | Yes for failed action only |

## Allowed Transitions

| From | To |
| --- | --- |
| Candidate | Pending |
| Candidate | Invalid Attempt |
| Pending | Resolved |
| Pending | Acknowledged |
| Pending | Dismissed |
| Pending | Deferred |
| Pending | Expired |
| Pending | Auto-Resolved |
| Pending | Invalid Attempt |
| Deferred | Pending |
| Deferred | Dismissed |
| Deferred | Expired |
| Deferred | Invalid Attempt |
| Resolved | Archived |
| Acknowledged | Archived |
| Dismissed | Archived |
| Expired | Archived |
| Auto-Resolved | Archived |
| Resolved | Pending |
| Acknowledged | Pending |
| Dismissed | Pending |
| Expired | Pending |
| Archived | Pending |
| Invalid Attempt | Pending |
| Invalid Attempt | Deferred |

## Forbidden Transitions

| Transition | Reason |
| --- | --- |
| Candidate -> Resolved | Item must first become active attention. |
| Candidate -> Archived | Unaccepted attention cannot become history. |
| Pending -> Archived | Active unresolved attention cannot be hidden. |
| Deferred -> Archived | Deferred unresolved attention cannot be hidden. |
| Acknowledged -> Resolved | Acknowledgement and resolution are distinct. |
| Dismissed -> Resolved | Recovery is required before a new decision. |
| Expired -> Resolved | Expiration is not household decision. |
| Auto-Resolved -> Resolved | Auto-resolution remains distinct history. |
| Any -> Real Ledger state | Inbox cannot become money movement. |
| Any -> Planning state | Inbox cannot become virtual allocation. |
| Any -> Health-mutated state | Health cannot mutate Inbox. |

## Terminal States

Archived:

- Terminal for ordinary active Inbox work.
- May recover only with explainable new attention.

Invalid Attempt:

- Terminal for failed action only.
- Must leave prior valid state recoverable.

Rejected Candidate:

- Candidate that fails eligibility does not become an Inbox item.

## Recovery Transitions

| Scenario | Transition |
| --- | --- |
| Missing context arrives | Deferred -> Pending |
| Prior resolution questioned | Resolved -> Pending |
| Prior acknowledgement insufficient | Acknowledged -> Pending |
| Prior dismissal wrong | Dismissed -> Pending |
| Expired item relevant again | Expired -> Pending |
| Archived item needs renewed review | Archived -> Pending |
| Invalid attempt failed | Invalid Attempt -> prior valid state |
