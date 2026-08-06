# Edge Case Contract

## Duplicate Action

Trigger:

- Same user or multiple users submit the same outcome more than once.

Expected behavior:

- First valid transition wins.
- Later duplicate sees current state and does not create duplicate history.

Business result:

- One final state.

User-visible result:

- Current item state is shown.

Recovery behavior:

- If wrong, use Recover Item.

## Expired State

Trigger:

- User tries to resolve an Expired item.

Expected behavior:

- Direct resolution is forbidden.

Business result:

- Item remains Expired unless recovered to Pending.

User-visible result:

- Explain expiration is historical and recovery is required.

Recovery behavior:

- Recover to Pending with reason.

## Cancelled Operation

Trigger:

- User abandons action before completion.

Expected behavior:

- No state change.

Business result:

- Prior valid state remains.

User-visible result:

- Item remains available.

Recovery behavior:

- User may retry.

## Source Provider Changes

Trigger:

- Source domain changes or invalidates attention.

Expected behavior:

- Inbox does not edit source truth.
- Item may recover, dismiss, expire, or remain pending according to source-domain outcome.

Business result:

- Source ownership remains external.

User-visible result:

- Item shows current valid state or renewed attention.

Recovery behavior:

- Recover or create linked item when explainable.

## Manual Adjustment Elsewhere

Trigger:

- User changes the source record in another domain.

Expected behavior:

- Inbox must not assume completion unless owning domain confirms attention no longer applies.

Business result:

- Pending remains or transitions only through valid source/outcome.

User-visible result:

- If still pending, item remains active.

Recovery behavior:

- Owning domain may trigger recovery/update attention.

## Interrupted Process

Trigger:

- Process stops during action.

Expected behavior:

- No partial business meaning may be assumed.

Business result:

- Item is in prior valid state or one completed valid target state.

User-visible result:

- Show current authoritative state.

Recovery behavior:

- Retry action if still valid.

## Network Retry

Trigger:

- User retries after failure or timeout.

Expected behavior:

- Retry validates current state before acting.

Business result:

- No duplicate transition.

User-visible result:

- Current state or validation failure shown.

Recovery behavior:

- Retry with corrected context.

## Conflict

Trigger:

- Partner changes item before another user's action completes.

Expected behavior:

- Later action validates against current state.

Business result:

- Invalid transition is rejected.

User-visible result:

- Show updated state and explain action is no longer valid.

Recovery behavior:

- Recover if renewed attention is needed.

## Generic Notification Attempt

Trigger:

- Non-decision message attempts to create Inbox item.

Expected behavior:

- Reject Candidate.

Business result:

- No Inbox item.

User-visible result:

- None in Inbox.

Recovery behavior:

- Only source can create new decision-bearing attention.

## Auto-Resolution Ambiguity

Trigger:

- Pattern exists but item has conflicting context or high-risk implication.

Expected behavior:

- Auto-resolution is skipped.

Business result:

- Item remains Pending.

User-visible result:

- Item appears for normal review.

Recovery behavior:

- Household resolves manually.
