# UI Behavior Contract

This file defines required UI behavior only. It does not design screens or components.

## Candidate

Visible actions:

- Start tracking account.

Hidden actions:

- Close, restore, export, transaction use.

Disabled actions:

- None required; Candidate is not yet an account.

Empty/Error states:

- If no accounts exist, communicate that the household has not added real containers yet.

## Draft

Visible actions:

- Complete account.
- Cancel setup.

Hidden actions:

- Close, archive, restore, export, transaction use.

Disabled actions:

- Complete must be disabled until required validations pass.

Warning messages:

- Must warn if user tries to create a jar, goal, budget, or plan as an account.

Loading behavior:

- During submit, prevent duplicate submission.

## Active

Visible actions:

- Edit.
- Review.
- Reconcile/adjust if supported by current scope.
- Mark historical/archive.
- Close.
- Export where export is available.
- Use as transaction context.

Hidden actions:

- Restore.
- Abandon draft.

Warning messages:

- Warn before state changes that remove account from active use.
- Warn when action could affect real position confidence.

## Needs Review

Visible actions:

- Review.
- Reconcile/adjust.
- Mark historical if appropriate.
- Close if closure is confirmed.

Hidden actions:

- Abandon draft.

Disabled actions:

- High-confidence treatment must be disabled or visually qualified.
- Ordinary transaction targeting should be disabled or require resolution unless owning flow explicitly allows review.

Warning messages:

- Must explain why the account needs review.

## Historical

Visible actions:

- View history.
- Restore.
- Export where export is available.

Hidden actions:

- Ordinary transaction use.
- Abandon draft.

Disabled actions:

- Edit actions that imply active use should be disabled unless restored.

Warning messages:

- Must make clear history is preserved.

## Closed

Visible actions:

- View history.
- Export where export is available.

Hidden actions:

- Use as active transaction target.
- Ordinary edit.
- Abandon draft.

Disabled actions:

- Restore to Active must not be direct; review is required if restoration is attempted.

Warning messages:

- Must make clear closure does not delete history.

## Abandoned Draft

Visible actions:

- None required except leave/restart separately.

Hidden actions:

- All account lifecycle actions.

Business result:

- Must not appear as financial history.

## Invalid Attempt

Visible result:

- Explain why action failed.

Required behavior:

- Preserve previous valid state.
- Do not show partial success.
- Do not imply money moved.

## Confirmation Dialogs

Required confirmations:

- Mark Historical / Archive.
- Close Account.
- Manual balance adjustment.
- Restore Historical account.

Confirmation copy must state business consequence:

- Whether active use changes.
- Whether history remains.
- Whether money moves. For Accounts-only state changes, money does not move.

## Error States

Errors must identify one of:

- Missing required field.
- Invalid account type.
- Permission denied.
- Invalid state transition.
- BR-01 boundary violation.
- BR-24 boundary violation.
- Unknown failure with no state change.

