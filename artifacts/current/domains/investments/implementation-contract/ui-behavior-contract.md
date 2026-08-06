# UI Behavior Contract

This document defines required UI behavior only. It does not design UI.

## Global UI Rules

- Estimated value must not be displayed as cash balance.
- Unrealized gain/loss must be distinguishable from realized outcome.
- Value date and source must be visible or accessible wherever value is shown.
- Risk context must be descriptive and non-advisory.
- Disabled actions must explain why they are unavailable.
- Loading must not imply an action succeeded.
- Errors must preserve previous valid state.

## State Behavior

| State | Visible actions | Hidden actions | Disabled actions | Required confirmations/warnings |
|-------|-----------------|----------------|------------------|---------------------------------|
| Recognized | Activate, Edit, Review, Cancel, Reclassify | Archive | Exit actions until active ownership confirmed | Warn if identity/ownership/value facts are incomplete |
| Active | Edit, Update Valuation, Review, Mark Impaired, Partial Exit, Full Exit, Reclassify | Cancel | Archive | Warn that estimated value is not cash before exit actions |
| Under Review | Edit, Update Valuation, Resolve Review, Cancel if no ownership, Reclassify, Exit if facts support it | Archive | Activate when required facts missing | Show review reason and missing facts |
| Impaired | Edit, Update Valuation, Review, Partial Exit, Full Exit, Write Off | Cancel | Archive | Warn that value/recoverability is doubtful |
| Partially Exited | Edit, Update Valuation, Review, Full Exit, Reclassify | Cancel | Archive until remaining exposure resolved | Show remaining exposure uncertainty when applicable |
| Exited | Archive, View history | Activate, Update market valuation | Edit active exposure fields | Confirm no active exposure remains |
| Written Off | Archive, View history | Activate, Update market valuation | Edit active exposure fields | Warn that write-off is historical outcome |
| Transferred Out | Archive, View history | Activate, Update market valuation | Edit active exposure fields | Confirm no household-visible active exposure |
| Cancelled | Archive, View history | Activate without new recognition | Exit actions | Confirm active ownership never formed |
| Archived | View history | All active actions | All mutation actions | Show historical-only status |

## Confirmation Dialogs

Required confirmations:

- Mark Impaired.
- Partial Exit.
- Full Exit.
- Write Off.
- Transfer Out.
- Cancel Investment.
- Reclassify Holding.
- Archive Holding.

Confirmation content must state:

- Whether money will move.
- Which domain owns money movement if money moved.
- Whether the action affects active exposure.
- Whether the action is reversible only through correction/recovery, not silent undo.

## Warning Messages

Required warning contexts:

- Estimated value is stale or source unknown.
- User attempts to treat unrealized value as spendable.
- User records contribution as gain.
- User attempts exit without proceeds/remaining exposure clarity.
- Holding has unclear ownership/visibility.
- Holding is impaired or manually valued.
- Action is forbidden by state or permission.

## Empty States

When no investments exist:

- UI may state that no investment holdings are tracked.
- UI must not pressure user to invest.
- UI must not recommend investment products.

## Error States

Errors must:

- Explain validation, permission, or state failure.
- Preserve prior valid state.
- Avoid advice.
- Avoid claiming money moved when it did not.
