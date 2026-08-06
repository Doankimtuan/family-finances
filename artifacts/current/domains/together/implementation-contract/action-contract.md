# Action Contract

## Create Household

Trigger:

- User starts household finance without an active household.

Actor:

- Authenticated user.

Preconditions:

- Actor has known identity.
- Actor has no active household.
- Household name is supplied.
- Household preferences are supplied or defaulted.

Validation:

- Household name is present and recognizable.
- Actor is not already an active member of another household in current scope.
- Preference values are valid.

Business Rules:

- BR-12, BR-02, TGT-BR-D01.

Success Result:

- Household enters Active Household state.
- Actor becomes Active Member with valid role.
- Current household policies and preferences exist.

Failure Result:

- No household is created.
- Actor remains No Active Household.
- No money, planning, Inbox, or Health change occurs.

## Identify Active Household

Trigger:

- User attempts household-scoped behavior.

Actor:

- Authenticated user or System.

Preconditions:

- Actor identity is known.

Validation:

- Active membership exists.
- Household is active.

Business Rules:

- BR-02, BR-02a, TGT-BR-D02.

Success Result:

- Household becomes current business scope.

Failure Result:

- User is treated as No Active Household.
- Household-scoped actions are forbidden.

## List Active Members

Trigger:

- Member opens household membership context.

Actor:

- Partner or Admin.

Preconditions:

- Actor is active household member.

Validation:

- Household scope is valid.
- Actor belongs to household.

Business Rules:

- BR-02a, TGT-BR-D02, TGT-BR-D06.

Success Result:

- Active members are visible.
- Limited inactive-member context may be visible only where historically needed.

Failure Result:

- Membership is not disclosed.

## Invite Partner

Trigger:

- Active member invites another person.

Actor:

- Partner or Admin.

Preconditions:

- Actor is active household member.
- Household is active.
- Household has capacity.
- Invitee contact identity is supplied.

Validation:

- Invitee identity target is valid.
- Invitee is not already active member.
- Invitee does not already have valid pending invitation for this household.
- Household capacity is not exceeded.

Business Rules:

- Invitation consent, BR-12, TGT-BR-D03.

Success Result:

- Invitation enters Pending.
- Invitation has inviter attribution.

Failure Result:

- No invitation is created.
- Existing membership or invitation state remains unchanged.

## Accept Invitation

Trigger:

- Invitee accepts pending invitation.

Actor:

- Invitee.

Preconditions:

- Invitation is Pending.
- Invitation is not expired, revoked, declined, or accepted.
- Invitee identity matches invitation.
- Household has capacity.
- Invitee has no active household in current scope.

Validation:

- Invitation state is Pending.
- Invitation is within valid time window.
- Actor identity matches invited identity.
- Household is active.

Business Rules:

- Explicit consent, BR-12, TGT-BR-D03.

Success Result:

- Invitee becomes Active Member.
- Invitation enters Accepted terminal state.
- Household trust boundary expands.

Failure Result:

- Invitee remains Non-Member.
- Invitation remains in its valid current state or terminal state.

## Decline Invitation

Trigger:

- Invitee declines pending invitation.

Actor:

- Invitee.

Preconditions:

- Invitation is Pending.
- Invitee identity matches invitation.

Validation:

- Invitation is not terminal.
- Actor identity matches invited identity.

Business Rules:

- Consent preservation, TGT-BR-D03.

Success Result:

- Invitation enters Declined terminal state.
- Household membership is unchanged.

Failure Result:

- No state change occurs.

## Revoke Invitation

Trigger:

- Household withdraws pending invitation.

Actor:

- Partner or Admin.

Preconditions:

- Actor is active household member.
- Invitation is Pending.

Validation:

- Invitation belongs to actor's household.
- Invitation is not terminal.

Business Rules:

- Terminal invitation protection, TGT-BR-D03.

Success Result:

- Invitation enters Revoked terminal state.

Failure Result:

- Invitation remains unchanged.

## Expire Invitation

Trigger:

- Pending invitation passes valid time window.

Actor:

- System or Background Worker.

Preconditions:

- Invitation is Pending.
- Current business time is after expiry.

Validation:

- Invitation is not terminal.
- Expiry condition is true.

Business Rules:

- Terminal invitation protection, TGT-BR-D03.

Success Result:

- Invitation enters Expired terminal state.

Failure Result:

- Terminal invitation remains unchanged.

## Change Role

Trigger:

- Household changes policy responsibility.

Actor:

- Admin.

Preconditions:

- Actor is active Admin.
- Target is active household member.
- New role is Partner or Admin.

Validation:

- Target belongs to same household.
- Role value is allowed.
- Change does not create custom role.
- Change does not remove daily partner participation.

Business Rules:

- Role simplicity, TGT-BR-D05.

Success Result:

- Target role becomes Partner or Admin.
- Household membership remains active.

Failure Result:

- Role remains unchanged.

## Update Household Policy

Trigger:

- Policy-responsible member changes household assumption.

Actor:

- Admin.

Preconditions:

- Actor is active Admin.
- Household is active.
- Proposed policy value is supplied.

Validation:

- Policy type is allowed.
- Policy value is valid.
- Change is household-level.
- Change does not imply money movement.

Business Rules:

- BR-04, BR-07, BR-09, BR-13, TGT-BR-D04.

Success Result:

- Proposed policy becomes Current.
- Previous policy becomes Superseded.
- Material policy-change context is attributed.

Failure Result:

- Current policy remains unchanged.
- No policy-change context is created.

## View Household Policy

Trigger:

- Member views current household assumptions.

Actor:

- Partner or Admin.

Preconditions:

- Actor is active household member.

Validation:

- Actor belongs to household.

Business Rules:

- Policy visibility, BR-02a.

Success Result:

- Current policy state is visible.

Failure Result:

- Policy state is not disclosed.

## Update Household Preferences

Trigger:

- Household updates interpretation context.

Actor:

- Admin.

Preconditions:

- Actor is active Admin.
- Household is active.

Validation:

- Locale, timezone, and base currency values are valid when changed.
- Change does not rewrite historical money facts.

Business Rules:

- TGT-BR-D07.

Success Result:

- Household preferences change going forward.

Failure Result:

- Preferences remain unchanged.

## Clarify Household Meaning

Trigger:

- Household adds or edits simple descriptive context.

Actor:

- Partner or Admin.

Preconditions:

- Actor is active household member.
- Household is active.

Validation:

- Clarification is descriptive.
- Clarification does not claim legal status.
- Clarification does not define money movement, approval, contract, or dispute outcome.

Business Rules:

- TGT-BR-D08.

Success Result:

- Household meaning is clarified.

Failure Result:

- Boundary-breaking clarification is rejected.

## Represent Inactive Member

Trigger:

- Prior membership needs historical interpretation.

Actor:

- Admin or System.

Preconditions:

- Person was previously Active Member.
- Historical context is relevant.

Validation:

- Prior membership is established.
- Inactive state does not imply current access.

Business Rules:

- TGT-BR-D06.

Success Result:

- Member enters Inactive Member state for historical context.

Failure Result:

- No inactive context is asserted.
