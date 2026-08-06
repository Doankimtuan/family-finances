# Money Contract

Together never moves money.

## Action Money Effects

| Action | Money source | Money destination | Ledger writes | Planning updates | Read-only updates | No-op situations |
|--------|--------------|-------------------|---------------|------------------|-------------------|------------------|
| Create Household | None | None | None | None | Household context may become readable to member. | Failure creates no money effect. |
| Identify Active Household | None | None | None | None | Determines readable scope. | No active household creates no money effect. |
| List Active Members | None | None | None | None | Membership information read only. | Non-member receives no disclosure. |
| Invite Partner | None | None | None | None | Pending invitation context only. | Duplicate/invalid invite creates no money effect. |
| Accept Invitation | None | None | None | None | Household visibility expands to new member. | Invalid acceptance creates no money effect. |
| Decline Invitation | None | None | None | None | Invitation state read-only after terminal state. | Invalid decline creates no money effect. |
| Revoke Invitation | None | None | None | None | Invitation state read-only after terminal state. | Terminal invitation remains unchanged. |
| Expire Invitation | None | None | None | None | Invitation state read-only after terminal state. | Terminal invitation remains unchanged. |
| Change Role | None | None | None | None | Role context changes. | Invalid role change creates no money effect. |
| Update Household Policy | None | None | None | Policy state may be consumed by Planning later; no direct Planning mutation. | Current policy context changes. | Invalid policy creates no money effect. |
| View Household Policy | None | None | None | None | Policy state read only. | Non-member receives no disclosure. |
| Update Household Preferences | None | None | None | None | Interpretation context changes. | Invalid preference creates no money effect. |
| Clarify Household Meaning | None | None | None | None | Descriptive household context changes. | Boundary-breaking text has no money effect. |
| Represent Inactive Member | None | None | None | None | Historical context changes. | Unproven prior membership creates no money effect. |

## BR-01 Rules

- Together does not create income.
- Together does not create expense.
- Together does not create transfer.
- Together does not change account balance.
- Together does not allocate jars.
- Together does not fund goals.
- Together does not settle cards, loans, or savings.
- Together does not correct ledger records.

## No Ambiguous Money Movement

If an implementation path appears to require money movement, that path belongs to another domain and must not be implemented inside Together.
