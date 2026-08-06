# UI Behavior Contract

This file defines required UI behavior only. It does not design UI.

## No Active Household

Visible actions:

- Create household.
- Accept valid invitation if available.

Hidden actions:

- Household money actions.
- Member list.
- Household policies.

Disabled actions:

- None required; forbidden actions should not appear.

Error states:

- If user attempts household-scoped action, explain active household membership is required.

## Active Household

Visible actions:

- View active members.
- View current policies.
- View household preferences.
- Invite partner when capacity allows.

Hidden actions:

- Create second active household.
- Custom role management.
- Legal family status.
- Partner engagement summaries.

Empty states:

- If only one member exists, household may show partner invitation path.
- If no pending invitations exist, show no pending invitations state.

## Pending Invitation

Visible actions:

- Accept for matching invitee.
- Decline for matching invitee.
- Revoke for allowed household actor.

Hidden actions:

- Accept for non-matching identity.
- Accept after expiry or revocation.

Warning messages:

- Explain if invitation is expired, revoked, declined, accepted, or identity-mismatched.

## Terminal Invitation

Visible actions:

- None that mutate the terminal invitation.

Hidden actions:

- Accept.
- Decline.
- Revoke.

Error states:

- If user attempts terminal transition, show that invitation is no longer active.

## Policy Current

Visible actions:

- Members can view policy.
- Admin can edit policy.

Hidden actions:

- Partner policy edit if not Admin.
- Any action implying money movement.

Confirmation dialogs:

- Material policy save requires confirmation or equivalent clear final review.

Warning messages:

- Explain that policy change does not move money.

## Role State

Visible actions:

- Admin can change Partner/Admin responsibility where allowed.

Hidden actions:

- Owner, Viewer, Guest, Approver, custom roles.

Warning messages:

- Role language must not imply money ownership.

## Inactive Member Context

Visible actions:

- Show only historical context where needed.

Hidden actions:

- Current active member actions for inactive members.

Warning messages:

- Inactive member does not imply current access.

## Loading Behavior

- During action submission, prevent duplicate submission of the same action.
- Loading state must not show partial success.
- On interruption, UI must return to the last confirmed valid state or show a recoverable error.

## Error Behavior

- Validation errors explain what failed.
- Permission errors explain actor cannot perform action.
- State errors explain current state no longer permits action.
- No error state may imply money moved when Together action failed.
