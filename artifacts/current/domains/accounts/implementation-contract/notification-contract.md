# Notification Contract

## Principle

Notifications must support confidence and safety, not noise. Routine successful account actions do not require external notification.

## Notifications

| Notification | Trigger | Recipient | Purpose |
|--------------|---------|-----------|---------|
| Validation warning | User submits invalid account action | Acting user | Explain why action cannot proceed. |
| Permission warning | User lacks household permission | Acting user | Explain access/action limitation. |
| Account needs review warning | Account enters Needs Review from user action | Household-visible context or acting user | Signal that account truth is uncertain. |
| Historical confirmation | Account becomes Historical | Acting user; partner-visible if product policy requires material-change visibility | Confirm account removed from active use while history remains. |
| Closure confirmation | Account becomes Closed | Acting user; partner-visible if product policy requires material-change visibility | Confirm account ended for active use and history remains. |
| Restore confirmation | Historical account becomes Active | Acting user; partner-visible if material | Confirm account is active again. |
| Adjustment confirmation | Manual adjustment succeeds | Acting user; partner-visible if material | Confirm explainable trust repair occurred. |
| Export completion | Account export completes | Requesting user | Confirm read-only export completion. |
| Export failure | Account export cannot complete | Requesting user | Explain no account state changed. |

## Forbidden Notifications

- No routine reminder to update every account unless a future board approves freshness reminders.
- No Health-driven notification that changes Accounts.
- No notification implying credit limit is owned money.
- No notification implying jar allocation is account balance.

