# Edge Case Contract

## Duplicate Action

Trigger:

- Same transaction action is submitted more than once.

Expected behavior:

- Do not create duplicate active money meaning.

Business result:

- Existing valid result is preserved or duplicate is rejected.

User-visible result:

- User sees confirmation of existing result or duplicate-prevention error.

Recovery behavior:

- User can review transaction history if uncertain.

## Expired Or Stale Evidence

Trigger:

- User relies on old notification, memory, or provider evidence.

Expected behavior:

- Stale evidence does not automatically mutate transaction truth.

Business result:

- Transaction remains unchanged or Needs Review.

User-visible result:

- User sees review/discrepancy message.

Recovery behavior:

- Reconcile, correct, refund, reverse, or no change.

## Cancelled Operation

Trigger:

- User abandons a transaction action before completion.

Expected behavior:

- No partial business fact is trusted.

Business result:

- Previous valid state remains.

User-visible result:

- No success confirmation is shown.

Recovery behavior:

- User can restart action.

## Provider Changes

Trigger:

- Bank, wallet, card, or external source later shows different information.

Expected behavior:

- Provider change is read-only evidence in current scope.

Business result:

- Transaction remains unchanged, Needs Review, Corrected, Refund Linked, Reversed, or no change through valid action only.

User-visible result:

- Discrepancy warning or review prompt when relevant.

Recovery behavior:

- Lightweight reconciliation routes to valid action.

## Manual Adjustment Attempt

Trigger:

- User attempts to fix balance by editing transaction truth without explanation.

Expected behavior:

- Silent overwrite is rejected.

Business result:

- Prior state remains or transaction enters Needs Review.

User-visible result:

- User sees correction/review requirement.

Recovery behavior:

- Use Correct Transaction with explainable corrected facts.

## Interrupted Process

Trigger:

- Network, session, or system interruption occurs during action.

Expected behavior:

- Duplicate retry must not create duplicate money meaning.

Business result:

- Either one valid result exists or no state changed.

User-visible result:

- User sees retry, confirmation, or failure state.

Recovery behavior:

- Search/review recent activity before retry if outcome is uncertain.

## Conflict

Trigger:

- Two household actors change meaning or review outcome concurrently.

Expected behavior:

- Financial anchors remain stable.
- Latest valid household meaning must not violate boundaries.

Business result:

- Transaction is Resolved if one valid outcome remains; otherwise Needs Review.

User-visible result:

- User sees current state or conflict/review message.

Recovery behavior:

- Household resolves review again.

## Missing Account

Trigger:

- Transaction references no active real account.

Expected behavior:

- Transaction cannot become ordinary Recorded/Resolved.

Business result:

- Invalid Attempt or Needs Review when a real fact already exists.

User-visible result:

- User sees account-context error.

Recovery behavior:

- Select valid active account or abandon invalid attempt.

## Refund Without Original

Trigger:

- Returned money is recorded but original transaction is unknown.

Expected behavior:

- Do not treat as ordinary income automatically.

Business result:

- Refund remains Needs Review.

User-visible result:

- User sees prompt to link original or accept unresolved meaning.

Recovery behavior:

- Link original, leave unresolved, or correct classification.

## Transfer Misclassification

Trigger:

- Owned-account transfer is attempted as income or expense.

Expected behavior:

- Prevent default income/expense distortion when ownership is clear.

Business result:

- Record as transfer or Needs Review.

User-visible result:

- User sees transfer-neutrality warning.

Recovery behavior:

- Confirm transfer, add fee as expense if applicable, or clarify ownership.
