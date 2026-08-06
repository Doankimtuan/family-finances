# Validation Contract

## Required Fields

Create Household:

- Household name.
- Household preference values or defaults.

Invite Partner:

- Invitee contact identity.

Accept / Decline Invitation:

- Invitation identity.
- Authenticated invitee identity.

Update Policy:

- Policy type.
- Policy value.

Update Preferences:

- Changed preference values.

Clarify Household Meaning:

- Descriptive text or equivalent simple context.

## Business Validation

- User must have no active household to create household.
- Active household must have at least one active member.
- Invitation must be Pending to accept, decline, revoke, or expire.
- Terminal invitation must not transition.
- Role must be Partner or Admin.
- Policy value must be allowed.
- Clarification must be descriptive only.

## Financial Validation

- Together action must not create money movement.
- Together action must not alter account balances.
- Together action must not create ledger transaction.
- Together action must not allocate jars or fund goals.
- Together action must not change Health data.

## Ownership Validation

- Actor must be active household member for household-scoped actions.
- Invitee identity must match invitation for accept/decline.
- Non-member must not see household data.
- Inactive member must not act as active member.
- Admin-only actions require Admin responsibility.

## State Validation

- No Active Household can only become Active Household through create or accept.
- Active Member can become Inactive Member only with established current membership.
- Non-Member cannot become Inactive Member.
- Invalid policy cannot become Current.
- Superseded policy cannot become Current by implication.

## Cross-Domain Validation

- Planning may consume policy only after valid policy update.
- Inbox item is not created unless explicitly allowed by product scope.
- Health consumes Together scope read-only.
- Accounts, Transactions, Cards, Loans, Savings, Goals, and Categories consume household scope only; Together does not validate their domain facts.

## Notification Validation

- Notification trigger must match approved notification list.
- Notification recipient must be active member, invitee, or inviter as applicable.
- Notification must not expose household data to non-members.
- Notification must not imply money moved.
