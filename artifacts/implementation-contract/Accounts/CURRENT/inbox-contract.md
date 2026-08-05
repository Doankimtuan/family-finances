# Inbox Contract

## Principle

Accounts must not create unnecessary Inbox items. Inbox exists only when a human decision is required.

## Business Events

| Business event | Should Inbox item exist? | Type | Priority | Required action | Expiration | Auto resolution | Dismiss rules |
|----------------|--------------------------|------|----------|-----------------|------------|-----------------|---------------|
| Account created successfully | No | None | None | None | None | Not applicable | Not applicable |
| Account edited successfully | No | None | None | None | None | Not applicable | Not applicable |
| Account review confirms truth | No | None | None | None | None | Not applicable | Not applicable |
| Account discrepancy cannot be resolved | Yes | Account Review | Medium | Confirm, adjust, mark historical, or keep under review | None by default | No | Dismiss only if account remains Needs Review or user confirms no action needed |
| Manual adjustment completed | No | None | None | None | None | Not applicable | Not applicable |
| Transfer clearly recognized | No | None | None | None | None | Not applicable | Not applicable |
| Transfer source/destination unclear | Yes | Account Review | Medium | Identify source/destination or reject transfer interpretation | None by default | No | Dismiss only without money change or after resolution |
| Attempt to use Historical account as active target | Yes, only if user action needs follow-up | Account Review | Low | Restore account or select Active account | None by default | No | Dismiss if user abandons action |
| Attempt to use Closed account as active target | Yes, only if user action needs follow-up | Account Review | Medium | Choose Active account or review closure | None by default | No | Dismiss if action cancelled |
| Suspected duplicate account | Yes | Account Review | Medium | Review identity and choose which account remains active | None by default | No automatic merge | Dismiss only if duplicate suspicion is explicitly ignored |
| Export succeeds or fails | No | None | None | None | None | Not applicable | Not applicable |
| Health flags stale account | No by Accounts default | None | None | None | None | Not applicable | Health may display read-only concern, not create Accounts Inbox item |

## Inbox Item Requirements

When an Account Review item exists, it must include:

- Account reference.
- Reason review is needed.
- Whether money is affected.
- Required user decision.
- Statement that resolving the item does not move money unless a Transaction-owned or adjustment action occurs.

## Forbidden Inbox Behavior

- No Inbox item for routine account creation confirmation.
- No Inbox item for informational balance display.
- No Inbox auto-resolution that changes account state or money.
- No Inbox action that maps jars to accounts.

