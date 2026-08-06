# Notification Contract

Inbox is not the notification system. These notifications describe communication expectations caused by Inbox business behavior.

## Notifications

| Notification | Trigger | Recipient | Purpose |
| --- | --- | --- | --- |
| New Inbox Attention | Pending item is created from decision-bearing source attention | Household members with visibility | Inform that a decision needs review. |
| Time-Sensitive Attention | Pending item has due/maturity/expiration pressure | Household members with visibility | Surface time-bound attention without implying urgency beyond source. |
| Deferred Item Returned | Deferred item returns to Pending | Household members with visibility | Inform review has resumed. |
| Item Expired | Time-bound item becomes Expired | Household members with visibility when relevant | Explain active Inbox attention ended, not that obligation was paid. |
| Auto-Resolved Item | Item becomes Auto-Resolved | Household members with visibility | Confirm constrained pattern was applied and history exists. |
| Action Failure | User action fails validation or permission | Acting user | Explain that prior state was unchanged. |
| Recovery Created | Prior outcome is reopened or linked attention is created | Household members with visibility | Explain renewed review is needed. |

## Notification Rules

- No marketing notification may create an Inbox item.
- Notification delivery failure must not change Inbox state.
- Notifications must not claim real money moved unless the owning money domain confirms it.
- Health must not trigger Inbox mutation through notification behavior.
