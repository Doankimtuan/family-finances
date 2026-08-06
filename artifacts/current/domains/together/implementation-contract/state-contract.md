# State Contract

## Household States

| State | Description |
|-------|-------------|
| No Active Household | User has no valid household scope. |
| Active Household | Household is current shared financial unit. |
| Historical Household Context | Household context exists only for historical interpretation. |

Allowed transitions:

- No Active Household -> Active Household.
- Active Household -> Historical Household Context.

Forbidden transitions:

- No Active Household -> Historical Household Context.
- Historical Household Context -> Active Household without explicit future approved scope.

Terminal states:

- None in current scope.

Recovery transitions:

- Invalid household scope -> No Active Household.

## Membership States

| State | Description |
|-------|-------------|
| Non-Member | Person is outside household trust boundary. |
| Active Member | Person currently belongs to household. |
| Inactive Member | Person previously belonged; historical context only. |

Allowed transitions:

- Non-Member -> Active Member through create household or accept invitation.
- Active Member -> Inactive Member.

Forbidden transitions:

- Non-Member -> Inactive Member.
- Inactive Member -> Active Member without valid re-entry.
- Active Member -> Non-Member with history erased.

Terminal states:

- None. Inactive Member is not terminal if future approved re-entry exists.

Recovery transitions:

- Invalid Active Member -> Non-Member or Inactive Member based on established history.

## Invitation States

| State | Description |
|-------|-------------|
| Pending | Invitation can be accepted, declined, revoked, or expire. |
| Accepted | Invitee joined; terminal. |
| Declined | Invitee refused; terminal. |
| Revoked | Household withdrew invite; terminal. |
| Expired | Invite validity ended; terminal. |

Allowed transitions:

- Pending -> Accepted.
- Pending -> Declined.
- Pending -> Revoked.
- Pending -> Expired.

Forbidden transitions:

- Terminal invitation -> any other state.
- Any non-pending invitation -> Accepted.

Terminal states:

- Accepted.
- Declined.
- Revoked.
- Expired.

Recovery transitions:

- Ambiguous pending after expiry -> Expired.
- Duplicate pending -> keep one valid Pending business state; reject duplicate action.

## Role States

| State | Description |
|-------|-------------|
| Partner | Active member with daily shared finance participation. |
| Admin | Active member with policy responsibility plus daily participation. |

Allowed transitions:

- Partner -> Admin.
- Admin -> Partner.

Forbidden transitions:

- Partner/Admin -> custom role.
- Partner/Admin -> Owner, Viewer, Guest, Legal Spouse, Approver.
- Role transition that removes daily Money/Plan/Inbox participation from Partner.

Terminal states:

- None.

## Policy States

| State | Description |
|-------|-------------|
| Current | Active household assumption. |
| Superseded | Historical prior policy value. |
| Invalid | Proposed value with no business effect. |

Allowed transitions:

- Current -> Superseded when valid replacement becomes Current.
- Valid proposed value -> Current.

Forbidden transitions:

- Invalid -> Current.
- Superseded -> Current by implication.
- Current -> money movement.

Recovery transitions:

- Invalid proposed policy -> preserve existing Current.
