# Permission Contract

## Actor Definitions

| Actor | Meaning |
|-------|---------|
| Owner | Forbidden term for Together permissions; no owner role exists. |
| Partner | Active member with daily shared finance participation. |
| Viewer | Forbidden role; no view-only household member exists in current scope. |
| Admin | Active member with policy responsibility plus daily participation. |
| Background Worker | Non-human process for approved lifecycle maintenance. |
| System | Product process resolving scope, state, or display context. |

## Permission Matrix

| Action | Owner | Partner | Viewer | Admin | Background Worker | System | Reason |
|--------|-------|---------|--------|-------|-------------------|--------|--------|
| Create Household | Forbidden | Allowed if no active household | Forbidden | Allowed if no active household | Forbidden | Forbidden | Household begins from user consent. |
| Identify Active Household | Forbidden | Allowed | Forbidden | Allowed | Forbidden | Allowed | Scope resolution is required. |
| List Active Members | Forbidden | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Members may see household boundary. |
| Invite Partner | Forbidden | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Partner participation includes inviting within capacity. |
| Accept Invitation | Forbidden | Allowed as invitee | Forbidden | Allowed as invitee | Forbidden | Forbidden | Invitee consent required. |
| Decline Invitation | Forbidden | Allowed as invitee | Forbidden | Allowed as invitee | Forbidden | Forbidden | Invitee consent required. |
| Revoke Invitation | Forbidden | Allowed for household invite | Forbidden | Allowed | Forbidden | Forbidden | Household can withdraw pending invite. |
| Expire Invitation | Forbidden | Forbidden | Forbidden | Forbidden | Allowed | Allowed | Expiry is lifecycle maintenance. |
| Change Role | Forbidden | Forbidden | Forbidden | Allowed | Forbidden | Forbidden | Admin policy responsibility only. |
| Update Household Policy | Forbidden | Forbidden | Forbidden | Allowed | Forbidden | Forbidden | Admin owns policy responsibility. |
| View Household Policy | Forbidden | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Policy state is member-visible. |
| Update Household Preferences | Forbidden | Forbidden | Forbidden | Allowed | Forbidden | Forbidden | Preferences are elevated household context. |
| Clarify Household Meaning | Forbidden | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Descriptive context can be member-authored. |
| Represent Inactive Member | Forbidden | Forbidden | Forbidden | Allowed | Allowed | Allowed | Historical interpretation requires controlled action. |

## Forbidden Permission Patterns

- Owner overrides.
- Viewer-only membership.
- Per-account permissions.
- Per-domain custom permissions.
- Approver role in Together.
- Legal spouse role.
- Background Worker changing money.
- System inferring consent.
