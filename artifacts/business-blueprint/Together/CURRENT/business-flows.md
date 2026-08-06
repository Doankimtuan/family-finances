# Business Flows

## Create Household

Trigger:

- A user starts shared household finance without an active household.

Preconditions:

- User identity is known.
- User has no active household in current scope.
- Household has a recognizable name.
- Required household preferences are known or defaulted.

Business Rules:

- One active household per user in current scope.
- Household becomes the financial collaboration unit.
- Initial member must be active.
- Initial policy defaults must be understandable.

Expected Result:

- Household becomes Active.
- User becomes active household member.
- Household has current policies and preferences.

Failure Result:

- Household is not created.
- User remains in No Active Household state.

## Identify Active Household

Trigger:

- User attempts to access household-scoped product behavior.

Preconditions:

- User identity is known.

Business Rules:

- Money actions require authenticated active household membership.
- A user without active membership cannot act on household money.

Expected Result:

- Active household is found and becomes the business scope.

Failure Result:

- User is treated as having no active household.

## List Active Members

Trigger:

- Household needs to know who belongs.

Preconditions:

- User is an active member.
- Household is active.

Business Rules:

- Only valid household members can see household membership.
- Active members are shown as current participants.
- Inactive members may appear only as historical context where needed.

Expected Result:

- Household membership is understandable.

Failure Result:

- Membership is not disclosed to non-members.

## Invite Partner

Trigger:

- Active household member invites another person to join.

Preconditions:

- Inviter is an active household member.
- Invitee identity target is known enough to send an invitation.
- Household has capacity under current scope.
- Invitee is not already an active member.
- No duplicate pending invitation exists for the same household and invitee.

Business Rules:

- Invitation is consent entry into shared finance.
- Invitation starts Pending.
- Invitation must have an initiator for accountability.

Expected Result:

- Invitation becomes Pending.
- Invitee may accept or decline before expiry or revocation.

Failure Result:

- No invitation is created.
- Existing valid membership or pending invitation remains unchanged.

## Accept Invitation

Trigger:

- Invitee chooses to join the household.

Preconditions:

- Invitation is Pending.
- Invitation is not expired.
- Invitation has not been revoked or declined.
- Invitee identity matches the invitation.
- Invitee has no conflicting active household under current scope.
- Household has capacity.

Business Rules:

- Joining requires explicit acceptance.
- Acceptance creates active household membership.
- Accepted invitation is terminal.

Expected Result:

- Invitee becomes active member.
- Invitation becomes Accepted.
- Household trust boundary expands to include the new member.

Failure Result:

- Invitee does not become a member.
- Invitation remains Pending only if still valid; otherwise it moves or remains in its valid end state.

## Decline Invitation

Trigger:

- Invitee chooses not to join.

Preconditions:

- Invitation is Pending.
- Invitee identity matches the invitation.

Business Rules:

- Decline preserves consent.
- Declined invitation is terminal.

Expected Result:

- Invitation becomes Declined.
- Invitee does not become a member.

Failure Result:

- If invitation is not pending or identity does not match, no decline is applied.

## Revoke Invitation

Trigger:

- Household withdraws a pending invitation.

Preconditions:

- Invitation is Pending.
- Actor is allowed to manage the invitation.

Business Rules:

- Revocation ends a pending invitation.
- Revoked invitation cannot be accepted.

Expected Result:

- Invitation becomes Revoked.

Failure Result:

- If invitation is already terminal, it remains unchanged.

## Expire Invitation

Trigger:

- Pending invitation passes its valid acceptance window.

Preconditions:

- Invitation is Pending.
- Current business time is after invitation expiry.

Business Rules:

- Expired invitation cannot be accepted.
- Expired invitation is terminal.

Expected Result:

- Invitation becomes Expired.

Failure Result:

- If invitation was already accepted, declined, or revoked, that terminal state remains.

## Update Household Policy

Trigger:

- Household policy responsibility holder changes a current policy.

Preconditions:

- Household is active.
- Actor is active member with policy responsibility.
- New policy value is valid.

Business Rules:

- Policy changes must remain household-level.
- Material policy changes are partner-visible.
- Policy attribution is accountability context, not partner scoring.
- Policy change must not move money.

Expected Result:

- Current policy changes.
- Material policy event is available as recent household context.

Failure Result:

- Policy remains unchanged.
- No material policy event is created.

## View Household Policy

Trigger:

- Active member needs to understand current household assumptions.

Preconditions:

- User is active household member.

Business Rules:

- Current policy state is visible to members.
- Policy visibility does not grant money ownership.

Expected Result:

- Member can understand current policy state.

Failure Result:

- Non-member cannot view policy state.

## Update Household Preferences

Trigger:

- Household changes shared interpretation settings.

Preconditions:

- Household is active.
- Actor is active member with required responsibility.
- Preference values are valid.

Business Rules:

- Preferences shape interpretation of dates, language, and base currency.
- Preference changes must not rewrite historical money truth.

Expected Result:

- Current household preferences change.

Failure Result:

- Invalid preference change is rejected.

## Clarify Household Meaning

Trigger:

- Household needs simple descriptive context for itself.

Preconditions:

- Household is active.
- Actor is active member.

Business Rules:

- Clarification is descriptive, not legal.
- Clarification is not a contract, approval workflow, or dispute-resolution record.
- Clarification must not override domain-owned financial facts.

Expected Result:

- Household meaning becomes easier for members to understand.

Failure Result:

- Boundary-breaking clarification is rejected or ignored as business meaning.

## Represent Inactive Member

Trigger:

- A member is no longer active, or historical records require member interpretation.

Preconditions:

- Person previously belonged to household.
- Historical context remains relevant.

Business Rules:

- Inactive member context is historical.
- Inactive status must not imply current household participation.
- Full leave, split, divorce, or deletion workflows are deferred.

Expected Result:

- Historical records remain understandable.
- Current active membership is not overstated.

Failure Result:

- If prior membership cannot be established, no inactive member context is asserted.
