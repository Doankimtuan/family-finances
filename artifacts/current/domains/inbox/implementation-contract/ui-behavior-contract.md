# UI Behavior Contract

This document defines required UI behavior only. It does not design UI.

## Behavior By State

| State | Visible actions | Hidden actions | Disabled actions | Confirmation / warning | Loading behavior | Empty / error behavior |
| --- | --- | --- | --- | --- | --- | --- |
| Candidate | None to household | All outcome actions | All | None | None | Not shown as Inbox item until accepted. |
| Pending | Review, valid item-specific outcomes | Invalid outcomes for item type | Actions blocked by permissions or offline/mutation constraints | Warn when outcome may be confused with payment, deletion, or completion | Show pending action state and prevent duplicate submission | Error leaves item Pending. |
| Deferred | Review, return to Pending if allowed, dismiss if allowed | Resolve unless returned or explicitly allowed by contract | Actions blocked by permissions | Explain item remains unresolved | Show pending action state | Empty state should not count Deferred as completed. |
| Resolved | Review history, archive if allowed | Resolve, acknowledge, dismiss, defer, expire | Mutating actions unless recovery allowed | Explain completed decision if needed | Archive/recovery loading only | Error leaves Resolved. |
| Acknowledged | Review history, archive if allowed | Resolve without recovery | Mutating actions unless recovery allowed | Must not imply payment | Archive/recovery loading only | Error leaves Acknowledged. |
| Dismissed | Review history, archive if allowed, recover if allowed | Resolve without recovery | Mutating actions unless recovery allowed | Must not imply deletion | Archive/recovery loading only | Error leaves Dismissed. |
| Expired | Review history, archive if allowed, recover if allowed | Resolve without recovery | Mutating actions unless recovery allowed | Must state expiration is not payment | Archive/recovery loading only | Error leaves Expired. |
| Auto-Resolved | Review history, archive if allowed, recover if allowed | Manual resolve as if user acted | Mutating actions unless recovery allowed | Must identify as pattern-based outcome | Archive/recovery loading only | Error leaves Auto-Resolved. |
| Archived | Review history, recover if allowed | All normal active actions | All active actions | Recovery requires explainable reason | Recovery loading only | Archived empty state separate from active empty state. |
| Invalid Attempt | Prior valid state actions after recovery | Invalid requested action | Failed action remains disabled until corrected | Show user-visible error and prior state unchanged | Stop loading after failure | Error state must not imply mutation. |

## Queue Behavior

- Active queue shows Pending and Deferred items as unresolved attention.
- Historical queue shows Resolved, Acknowledged, Dismissed, Expired, Auto-Resolved, and Archived items.
- Empty active queue means no active Inbox attention, not complete financial safety.
- Generic notifications must not appear in Inbox.

## Suggestion Behavior

- Suggestions are visibly optional.
- User must be able to ignore suggestion.
- Suggestion failure must not block manual review.

## Error Behavior

- Failed actions preserve prior valid state.
- Error message must identify category: permission, validation, state, source, or boundary.
- Duplicate submission must not create duplicate state changes.
