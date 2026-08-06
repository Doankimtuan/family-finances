# Notification Contract

## Notification Rules

- Categories should create minimal notifications.
- Category notifications must never imply money moved.
- Notifications are for action confirmation, warning, or failure only.
- No reminders are required by default for ordinary Categories behavior.

## Notification Matrix

| Notification | Trigger | Recipient | Purpose |
| --- | --- | --- | --- |
| Category created confirmation | Category creation succeeds | Acting user | Confirm category is available for future classification. |
| Category creation failure | Category creation fails validation or permission | Acting user | Explain why no category was created. |
| Category assignment confirmation | User assigns or corrects category successfully | Acting user | Confirm transaction meaning changed only. |
| Category assignment failure | Assignment fails validation or permission | Acting user | Explain prior meaning remains unchanged. |
| Uncategorized warning | User leaves important transaction uncategorized where review remains required | Acting user | Warn that category meaning is unresolved. |
| Actuals incompleteness warning | Category summary excludes or cannot fully interpret uncategorized/uncertain facts | Viewer of summary | Prevent false confidence in category actuals. |
| Rename confirmation | Category rename succeeds | Acting user | Confirm wording changed and money facts did not. |
| Rename failure | Rename fails validation | Acting user | Explain prior category name remains. |
| Archive confirmation | Category archive succeeds | Acting user | Confirm category is unavailable for future ordinary selection and history remains. |
| Archive warning | Archive may affect future selection or unresolved review | Acting user | Prevent accidental loss of active vocabulary. |
| Archive failure | Archive fails validation | Acting user | Explain category remains active. |
| Restore confirmation | Category restore succeeds | Acting user | Confirm category is available again. |
| Restore failure | Restore fails validation | Acting user | Explain category remains archived. |
| Provider suggestion warning | User reviews external or inferred category suggestion | Acting user | Clarify suggestion is evidence, not final truth. |
| Boundary violation failure | User attempts category balance, budget, payment, provider truth, or autonomous intent behavior | Acting user | Explain Categories cannot perform that action. |

## No Notification Cases

- Filtering with results.
- Filtering with no results, unless presented as ordinary empty result.
- Read-only Health consumption.
- Read-only Planning consumption.
- Background read-only summary generation.
