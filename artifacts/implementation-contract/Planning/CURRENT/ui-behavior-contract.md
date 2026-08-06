# UI Behavior Contract

This file defines required UI behavior only. It does not design layout.

## State Behavior

| State | Visible actions | Hidden actions | Disabled actions | Confirmation dialogs | Warning messages |
| --- | --- | --- | --- | --- | --- |
| Draft | Confirm, edit, cancel | Complete, lock | Allocate if required fields missing | Cancel draft if data would be lost | Missing required planning information |
| Active | Edit, pause, review, complete, cancel, archive | Resume | None unless period locked | Cancel, archive, emergency reallocation when material | Planned amount is not a balance |
| Paused | Resume, edit, cancel, archive, complete | Pause | Allocation target use | Cancel/archive | Paused item is not an active allocation target |
| Needs Review | Resolve, correct, keep expected, cancel | Complete without resolution when blocked | Lock period if required review unresolved | Dismiss unresolved review | Needs review before confidence |
| Adjusted | Save/confirm, review | None | Lock until adjustment accepted | Material adjustment | Change is virtual and does not move money |
| Reviewed | Lock, correct, reopen only if allowed by business path | Normal edit if period ready to lock | None | Lock period | Review does not change Ledger |
| Locked | Correct | Normal edit, pause, cancel active changes | All normal period changes | Correction | Locked period requires correction path |
| Corrected | View correction, return or historical | Normal edit when historical | None | None by default | Correction affects Planning only |
| Completed | View, historical | Resume, normal edit | Allocation use | None by default | Completion does not prove money moved |
| Cancelled | View, historical | Resume, normal edit | Allocation use | None by default | Cancelled item is inactive |
| Archived | View, historical | Resume by ordinary action, allocation use | Normal edit | None by default | Archived item is inactive |
| Historical | View only | Edit, pause, resume, complete, cancel, archive | All mutating actions | None | Historical record is read-only |
| Invalid Attempt | Retry valid action or dismiss error | None | Invalid action | None | No change was made |

## Loading Behavior

- Mutating action shows pending state for the affected action.
- Prior values remain visible until success.
- On failure, prior valid state remains visible.
- Read-only comparison loading must not block unrelated Planning review unless required facts are needed.

## Empty States

- No jars: show Planning empty state with create action if actor can create.
- No goals: show empty goal intention state with create action if actor can create.
- No recurring expectations: show empty recurring state with create action if actor can create.
- Viewer sees read-only empty state without create action.

## Error States

- Permission error: explain actor cannot perform action.
- State error: explain current state does not allow action.
- Financial boundary error: explain Planning does not move money or own balances.
- Cross-domain error: explain source facts are unavailable or owned elsewhere.
- Validation error: identify missing or invalid required field.

## Required Copy Behavior

- Planned values must not be labeled as balance.
- Expected items must not be labeled as paid.
- Due pressure must identify expected versus source-confirmed.
- Goal progress must not imply Savings product balance.
- Emergency reallocation must state that no real money moved.
