# Permission Contract

## Role Permissions

| Action | Owner | Partner | Viewer | Admin | Background Worker | System |
| --- | --- | --- | --- | --- | --- | --- |
| Assess Household Health | Allowed | Allowed when household-visible | Allowed when household-visible | Allowed for support/governance context | Allowed for read-only computation | Allowed for read-only computation |
| Refresh Health Assessment | Allowed | Allowed when household-visible | Allowed when household-visible | Allowed | Allowed | Allowed |
| Determine Data Completeness | Allowed indirectly | Allowed indirectly | Allowed indirectly | Allowed indirectly | Allowed | Allowed |
| Explain Health Factors | Allowed | Allowed when source factors visible | Allowed when source factors visible | Allowed | Allowed for read-only preparation | Allowed |
| Present Read-Only Scenario | Allowed | Allowed when household-visible | Allowed when household-visible | Allowed | Allowed for read-only preparation | Allowed |
| View Source Factor Context | Allowed if source visible | Allowed if source visible | Allowed if source visible | Allowed if support/governance permits | Forbidden for interactive viewing | Forbidden for interactive viewing |
| Create/Edit/Delete Source Fact | Forbidden | Forbidden | Forbidden | Forbidden through Health | Forbidden | Forbidden |
| Move Money | Forbidden | Forbidden | Forbidden | Forbidden through Health | Forbidden | Forbidden |
| Resolve Inbox | Forbidden | Forbidden | Forbidden | Forbidden through Health | Forbidden | Forbidden |
| Create Notification | Forbidden | Forbidden | Forbidden | Forbidden through Health | Forbidden | Forbidden |

## Reasons

- Owner and Partner may view Health when household visibility allows.
- Viewer may view Health only when their household permissions allow the underlying source context.
- Admin may view or support within governance constraints but cannot use Health to mutate source domains.
- Background Worker and System may compute read-only assessment context only.

## Permission Failure Result

- Action returns Unavailable or permission-blocked context.
- No source facts are changed.
- No Inbox item or notification is created.
