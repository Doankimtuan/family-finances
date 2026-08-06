# Exceptional Scenarios

## Cancellation

Invitation revoked:

- Pending invitation can be cancelled by revocation.
- Revoked invitation cannot be accepted.
- Household membership does not change.

Policy update abandoned:

- If policy change is not completed, current policy remains unchanged.

## Correction

Wrong invite recipient:

- Pending invitation should be revoked.
- Correct recipient requires a separate valid invitation.

Wrong policy value:

- Existing policy remains until a valid policy change is completed.
- A later valid change supersedes the wrong value.

Wrong member recognition identity:

- Recognition context may be corrected if it does not alter financial history.

## Recovery

Expired invitation:

- Expired invitation is terminal.
- Recovery requires a new valid invitation.

No active household:

- User cannot perform household money actions.
- User must enter a valid household state before household-scoped behavior.

Ambiguous membership:

- Business behavior must resolve to Active Member, Inactive Member, or Non-Member.

## Emergency

Urgent policy change:

- Policy responsibility still applies.
- Material change visibility still applies.
- Emergency does not allow Together to move money.

Member unavailable:

- Together records membership and policy facts.
- It does not infer consent or decide relationship authority.

## Conflict

Partner disagreement:

- Together preserves household facts.
- Together does not decide fairness, blame, or relationship resolution.

Admin misunderstanding:

- Admin means policy responsibility only.
- Admin does not own household money.

Shared visibility concern:

- Non-member access remains forbidden.
- Safety-sensitive lifecycle decisions beyond inactive historical context are deferred.

## Expired Data

Expired invitation:

- Cannot be accepted.
- Must remain Expired once terminal.

Stale policy understanding:

- Current policy is authoritative for current household assumption.
- Superseded policy remains historical only.

## Invalid State

Duplicate pending invitation:

- Existing valid pending state remains.
- Conflicting duplicate state should not be created.

Terminal invitation response:

- Accepted, declined, revoked, or expired invitation cannot be accepted later.

Custom role request:

- Rejected as outside approved business scope.

## Unexpected User Behavior

Invitee uses different identity:

- Acceptance fails if invitee identity does not match.

User tries to join second active household:

- Rejected under current one-active-household scope.

User treats policy as money movement:

- Together rejects this interpretation; money movement belongs elsewhere.

## System Interruption

Interrupted invitation response:

- Business state must be either still Pending or one terminal invitation state.

Interrupted policy update:

- Business state must be either unchanged Current policy or completed new Current policy with historical supersession.

Interrupted household creation:

- Business state must be either No Active Household or Active Household, not partial household meaning.
