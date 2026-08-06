# Edge Case Contract

## Duplicate Action

Trigger:

- User submits the same action more than once.

Expected behavior:

- Only one business result is accepted.

Business result:

- No duplicate Active account, state transition, adjustment, export side effect, or Inbox item.

User-visible result:

- User sees a single success or clear duplicate prevention state.

Recovery behavior:

- If duplicate is suspected, account may enter Needs Review only when identity is unclear.

## Expired / Stale State

Trigger:

- User acts on account state that changed since view loaded.

Expected behavior:

- Validate current state before action.

Business result:

- Invalid transition rejected.

User-visible result:

- User is told account state changed and should review current facts.

Recovery behavior:

- Refresh account context; no money movement.

## Cancelled Operation

Trigger:

- User cancels draft, review, adjustment, closure, or export.

Expected behavior:

- No partial business action persists.

Business result:

- Draft may become Abandoned Draft only when cancellation is explicit in Draft.
- Other cancelled actions preserve previous state.

User-visible result:

- User returns to prior valid state.

Recovery behavior:

- User may restart action.

## Provider Changes

Trigger:

- Bank/wallet/card provider state differs from recorded account.

Expected behavior:

- Provider automation is not assumed.
- User may review or reconcile manually.

Business result:

- Account may enter Needs Review.

User-visible result:

- User sees account truth is uncertain.

Recovery behavior:

- Manual review/reconciliation.

## Manual Adjustment

Trigger:

- User adjusts recorded balance.

Expected behavior:

- Reason must be explainable.
- Adjustment must not be silent.

Business result:

- Account position becomes explainable or remains Needs Review.

User-visible result:

- User sees adjustment success or unresolved discrepancy.

Recovery behavior:

- Further review if explanation fails.

## Interrupted Process

Trigger:

- User loses connection or exits during action.

Expected behavior:

- No ambiguous partial state.

Business result:

- Account remains prior valid state, Draft, or Needs Review depending on last completed business step.

User-visible result:

- User sees retry or current state.

Recovery behavior:

- Retry action after current state validation.

## Network Retry

Trigger:

- User or system retries due to interruption.

Expected behavior:

- Retry must not create duplicate business result.

Business result:

- Single account, transition, adjustment, Inbox item, or export result.

User-visible result:

- User sees final deterministic outcome.

Recovery behavior:

- If outcome unknown, account enters Needs Review only when business truth is uncertain.

## Partner Conflict

Trigger:

- Partners disagree about household relevance, closure, adjustment, or restoration.

Expected behavior:

- Accounts does not create surveillance or permission redesign.

Business result:

- Account may remain Active or Needs Review until household resolves.

User-visible result:

- Conflict appears as unresolved account context, not blame.

Recovery behavior:

- Household review; Together owns access and membership rules.

## Boundary Violation

Trigger:

- User or system tries jar-to-account mapping, Health write-back, or automatic money movement.

Expected behavior:

- Reject action.

Business result:

- Previous valid account state preserved.

User-visible result:

- Clear boundary error.

Recovery behavior:

- User chooses a valid Accounts, Transactions, Planning, or Health action.

