# UI Behavior Contract

This document defines required UI behavior only. It does not design UI.

## Empty State

Visible when:

- No non-terminal goals exist for the household.

Required behavior:

- Explain that no goals exist yet.
- Show Create action to actors with permission.
- Hide mutation actions from Viewer.

## Active State

Visible actions:

- Edit.
- Add contribution update.
- Pause.
- Complete.
- Cancel.
- Associate savings context when available.

Hidden actions:

- Resume.

Disabled actions:

- Any action requiring unavailable permission.

Required messages:

- Progress must be described as intention, not bank balance.
- Contribution action must not imply transfer.

## Paused State

Visible actions:

- Edit.
- Add contribution update.
- Resume.
- Complete.
- Cancel.
- Associate savings context when available.

Hidden actions:

- Pause.

Required messages:

- Paused means not currently pursued.
- Paused does not freeze or move money.

## Completed State

Visible actions:

- View.
- Review read-only evidence if available.

Hidden actions:

- Edit.
- Add contribution.
- Pause.
- Resume.
- Complete.
- Cancel.

Required messages:

- Completed means intention fulfilled.
- Completed does not prove payment or purchase.

## Cancelled State

Visible actions:

- View.
- Review read-only history if available.

Hidden actions:

- Edit.
- Add contribution.
- Pause.
- Resume.
- Complete.
- Cancel.

Required messages:

- Cancelled means pursuit ended.
- Cancellation does not erase history or move money.

## Confirmation Dialogs

Required confirmations:

- Complete Goal: must clarify no payment or purchase is created.
- Cancel Goal: must clarify pursuit ends and no money moves.

Optional confirmations:

- Pause Goal when target date is near.
- Contribution that reaches or exceeds target, if completion will occur.

## Warning Messages

Required warnings:

- Contribution is progress only.
- Savings association is context only.
- Evidence conflict is uncertainty, not automatic correction.
- Target date passed does not automatically change state.

## Loading Behavior

Required behavior:

- Disable duplicate submission for the in-flight action.
- Preserve prior visible state until success.
- On failure, show prior valid state.

## Error States

Required error cases:

- Permission denied.
- Invalid field.
- Invalid state transition.
- Terminal goal mutation attempt.
- Offline or unavailable mutation path.
- BR-01 boundary violation.
- Source evidence unavailable.
