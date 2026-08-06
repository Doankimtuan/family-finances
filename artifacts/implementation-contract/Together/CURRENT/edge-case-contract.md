# Edge Case Contract

## Duplicate Household Create

Trigger:

- User with active household attempts creation.

Expected behavior:

- Reject creation.

Business result:

- Existing active household remains.

User-visible result:

- Explain one active household exists in current scope.

Recovery behavior:

- Continue with existing active household.

## Duplicate Pending Invitation

Trigger:

- Same invitee is invited while valid pending invitation exists.

Expected behavior:

- Reject duplicate or surface existing pending state.

Business result:

- One valid Pending invitation remains.

User-visible result:

- Explain invitation already pending.

Recovery behavior:

- Revoke, wait for response, or let invitation expire.

## Expired Invitation Acceptance

Trigger:

- Invitee accepts after expiry.

Expected behavior:

- Reject acceptance.

Business result:

- Invitation is Expired.
- Invitee remains Non-Member.

User-visible result:

- Explain invitation expired.

Recovery behavior:

- New invitation required.

## Revoked Invitation Acceptance

Trigger:

- Invitee accepts revoked invitation.

Expected behavior:

- Reject acceptance.

Business result:

- Invitation remains Revoked.

User-visible result:

- Explain invitation is no longer active.

Recovery behavior:

- New invitation required if household still wants invitee.

## Identity Mismatch

Trigger:

- Authenticated invitee identity does not match invitation target.

Expected behavior:

- Reject accept/decline.

Business result:

- Invitation remains valid current state if otherwise active.

User-visible result:

- Explain invitation is for another identity.

Recovery behavior:

- Use matching identity or request new invitation.

## Household Full

Trigger:

- Invite or accept would exceed household capacity.

Expected behavior:

- Reject action.

Business result:

- Membership unchanged.
- Invitation not accepted.

User-visible result:

- Explain household cannot add another member in current scope.

Recovery behavior:

- None within current scope.

## Interrupted Policy Update

Trigger:

- Policy update interrupted.

Expected behavior:

- Resolve to unchanged Current policy or completed new Current policy.

Business result:

- No partial policy state.

User-visible result:

- Show success or recoverable failure.

Recovery behavior:

- Retry only from visible current state.

## Invalid Role Request

Trigger:

- User attempts Owner, Viewer, Guest, Approver, or custom role.

Expected behavior:

- Reject role.

Business result:

- Existing role unchanged.

User-visible result:

- Explain only Partner/Admin responsibilities exist.

Recovery behavior:

- Choose valid role if allowed.

## Non-Member Access

Trigger:

- Non-member requests household data.

Expected behavior:

- Deny access.

Business result:

- No household data disclosed.

User-visible result:

- Explain active household membership is required.

Recovery behavior:

- Create household or accept valid invitation.

## Network Retry / Duplicate Submit

Trigger:

- Same action is submitted twice due to retry.

Expected behavior:

- Result must be idempotent at business level.

Business result:

- No duplicate household, member, invitation, policy event, or notification beyond valid business outcome.

User-visible result:

- Show one final state.

Recovery behavior:

- Refresh to current confirmed state.

## Conflict

Trigger:

- Two users act on the same pending invitation or policy.

Expected behavior:

- First valid terminal transition wins for invitation.
- Policy resolves to one current value with prior value superseded.

Business result:

- No contradictory state.

User-visible result:

- Later actor sees current state no longer permits attempted action.

Recovery behavior:

- Continue from current confirmed state.
