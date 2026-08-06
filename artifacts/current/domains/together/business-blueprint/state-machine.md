# State Machine

## Household States

| State | Meaning |
|-------|---------|
| No Active Household | User has no active household scope. |
| Active Household | Household is the current shared financial unit. |
| Historical Household Context | Household context remains needed for historical interpretation. |

Allowed transitions:

- No Active Household -> Active Household.
- Active Household -> Historical Household Context.
- Historical Household Context -> Active Household only if product scope later explicitly supports restoration.

Forbidden transitions:

- No Active Household -> Historical Household Context without prior household.
- Historical Household Context -> Active Household by implication or hidden recovery.

Terminal states:

- None in current approved scope. Full closure is deferred.

## Membership States

| State | Meaning |
|-------|---------|
| Non-Member | Person is outside the household trust boundary. |
| Active Member | Person currently belongs to the household. |
| Inactive Member | Person previously belonged and remains relevant only for historical interpretation. |

Allowed transitions:

- Non-Member -> Active Member through accepted invitation or household creation.
- Active Member -> Inactive Member when current participation ends under allowed business treatment.

Forbidden transitions:

- Non-Member -> Inactive Member without prior active membership.
- Inactive Member -> Active Member without explicit valid re-entry.
- Active Member -> Non-Member with history erased.

Recovery transitions:

- Invalid active membership -> Non-Member or Inactive Member based on established prior membership.

## Invitation States

| State | Meaning |
|-------|---------|
| Pending | Invitee may still respond. |
| Accepted | Invitee joined; terminal. |
| Declined | Invitee chose not to join; terminal. |
| Revoked | Household withdrew invitation; terminal. |
| Expired | Invitation validity ended; terminal. |

Allowed transitions:

- Pending -> Accepted.
- Pending -> Declined.
- Pending -> Revoked.
- Pending -> Expired.

Forbidden transitions:

- Accepted -> Pending.
- Declined -> Accepted.
- Revoked -> Accepted.
- Expired -> Accepted.
- Any terminal state -> any other terminal state.

Recovery transitions:

- Ambiguous pending invitation -> Expired if validity window passed.
- Duplicate pending invitation -> keep existing valid Pending state; do not create conflicting state.

Terminal states:

- Accepted.
- Declined.
- Revoked.
- Expired.

## Role States

| State | Meaning |
|-------|---------|
| Partner | Active member with daily shared finance participation. |
| Admin | Active member with policy responsibility in addition to daily participation. |

Allowed transitions:

- Partner -> Admin when household responsibility changes.
- Admin -> Partner when policy responsibility changes and household remains valid.

Forbidden transitions:

- Any role -> custom role.
- Any role -> owner, viewer, guest, or legal-spouse role.
- Role change that removes daily partner participation from an active member.

## Policy States

| State | Meaning |
|-------|---------|
| Current | Policy value governs household assumptions now. |
| Superseded | Policy value is historical after change. |
| Invalid | Proposed policy value has no business effect. |

Allowed transitions:

- Current -> Superseded when replaced by valid new Current policy.
- Proposed valid policy -> Current.

Forbidden transitions:

- Invalid -> Current.
- Superseded -> Current by implication.
- Current policy -> money movement.

Recovery transitions:

- Invalid proposed policy -> keep existing Current policy.
