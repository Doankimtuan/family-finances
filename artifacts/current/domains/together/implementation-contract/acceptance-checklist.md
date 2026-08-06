# Acceptance Checklist

## Household

- [ ] A user with no active household can create exactly one active household.
- [ ] A user with an active household cannot create another active household in current scope.
- [ ] Active household has at least one active member.
- [ ] No active household state blocks household money actions.

## Membership

- [ ] Active members can view active household members.
- [ ] Non-members cannot view household membership.
- [ ] Inactive members do not have active member permissions.
- [ ] Historical member context never erases past membership meaning.

## Invitations

- [ ] Invite creates Pending invitation only when household has capacity.
- [ ] Duplicate pending invitation is not created.
- [ ] Accepted invitation makes invitee Active Member.
- [ ] Declined invitation does not create membership.
- [ ] Revoked invitation cannot be accepted.
- [ ] Expired invitation cannot be accepted.
- [ ] Accepted, Declined, Revoked, and Expired are terminal.
- [ ] Identity mismatch prevents accept and decline.

## Roles

- [ ] Only Partner and Admin roles are accepted.
- [ ] Owner, Viewer, Guest, Approver, and custom roles are rejected.
- [ ] Admin does not remove daily partner participation.
- [ ] Partner cannot perform Admin-only policy actions.

## Policies And Preferences

- [ ] Current policy is visible to active members.
- [ ] Invalid policy value is rejected.
- [ ] Valid policy update supersedes prior policy.
- [ ] Material policy update is attributed.
- [ ] Policy update never moves money.
- [ ] Invalid preference value is rejected.
- [ ] Preference update does not rewrite historical financial facts.

## Money Safety

- [ ] No Together action writes ledger movement.
- [ ] No Together action changes account balance.
- [ ] No Together action allocates jars.
- [ ] No Together action funds goals.
- [ ] No Together action settles cards, loans, or savings.
- [ ] Health never writes Together or money data.

## Inbox And Notifications

- [ ] Together creates no Inbox items by default.
- [ ] Policy visibility is handled without unnecessary Inbox noise.
- [ ] Invitation notifications go only to valid invitee/household recipients.
- [ ] Notifications never disclose household data to non-members.
- [ ] Notifications never imply money moved.

## UI Behavior

- [ ] Forbidden actions are hidden or disabled according to state.
- [ ] Terminal invitations do not show active response actions.
- [ ] Loading state prevents duplicate action submission.
- [ ] Failure returns to previous valid state.
- [ ] Error messages distinguish validation, permission, and state failures.

## Consistency

- [ ] Every transition is valid.
- [ ] Every permission is enforced.
- [ ] Every invalid action preserves prior valid state.
- [ ] No Product Decision rejection is implemented.
- [ ] No deferred capability is introduced.
