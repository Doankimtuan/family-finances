# Inbox Contract

## Inbox Creation Rules

Together should create no unnecessary Inbox items.

| Business event | Should Inbox item exist? | Type | Priority | Required action | Expiration | Auto resolution | Dismiss rules |
|----------------|--------------------------|------|----------|-----------------|------------|-----------------|---------------|
| Household created | No | N/A | N/A | N/A | N/A | N/A | N/A |
| Active household identified | No | N/A | N/A | N/A | N/A | N/A | N/A |
| Members listed | No | N/A | N/A | N/A | N/A | N/A | N/A |
| Partner invited | No by default | N/A | N/A | Invitee responds through invitation, not Inbox. | Invitation expiry applies. | Expiry handled by invitation lifecycle. | N/A |
| Invitation accepted | No | N/A | N/A | N/A | N/A | N/A | N/A |
| Invitation declined | No | N/A | N/A | N/A | N/A | N/A | N/A |
| Invitation revoked | No | N/A | N/A | N/A | N/A | N/A | N/A |
| Invitation expired | No | N/A | N/A | N/A | N/A | N/A | N/A |
| Role changed | No by default | N/A | N/A | N/A | N/A | N/A | N/A |
| Household policy changed | No by default | N/A | N/A | Partner-visible context is required, but not necessarily Inbox. | N/A | N/A | N/A |
| Invalid action | No | N/A | N/A | User corrects action in place. | N/A | N/A | N/A |
| Inactive member represented | No by default | N/A | N/A | N/A | N/A | N/A | N/A |

## Inbox Escalation Rule

An Inbox item may exist only if a future approved product decision explicitly classifies a Together event as requiring household decision. Current Phase 5 contract creates no Together-owned Inbox review items.

## Dismissal Rule

Together notifications or confirmations must not be implemented as Inbox items unless Product Decision scope changes.
