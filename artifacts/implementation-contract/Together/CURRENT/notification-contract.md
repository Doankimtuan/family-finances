# Notification Contract

## Notification Rules

Notifications are allowed only when they protect consent, visibility, or recovery. They must not create surveillance or unnecessary noise.

| Notification | Trigger | Recipient | Purpose |
|--------------|---------|-----------|---------|
| Invitation sent | Pending invitation created. | Invitee. | Let invitee accept or decline household membership. |
| Invitation accepted confirmation | Invitee accepts invitation. | Inviter and invitee. | Confirm household boundary expanded. |
| Invitation declined confirmation | Invitee declines invitation. | Invitee; inviter only if product scope requires invite status visibility. | Confirm invitation ended without membership. |
| Invitation revoked confirmation | Pending invitation revoked. | Inviter; invitee only if already exposed to invitation. | Confirm invitation can no longer be accepted. |
| Invitation expired notice | Pending invitation expires. | Inviter and invitee where relevant. | Explain why invitation no longer works. |
| Policy changed notice | Material household policy changes. | Active household members. | Satisfy partner-visible policy context. |
| Role changed notice | Partner/Admin responsibility changes. | Affected member and active household members where relevant. | Prevent misunderstanding of policy responsibility. |
| Preference changed confirmation | Household preferences change. | Actor; active household members if interpretation materially changes. | Confirm shared interpretation context changed. |
| Action failure message | User action fails validation or permission. | Acting user. | Explain action did not occur. |

## Forbidden Notifications

- Partner engagement or activity ranking.
- Blame-oriented policy attribution.
- Non-material policy noise.
- Money-movement confirmation from Together.
- Health or AI mutation notification from Together.
