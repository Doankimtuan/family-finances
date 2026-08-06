# Notification Contract

## Principle

Notifications support awareness only. They must not execute repayment, mutate Health, or convert credit into cash.

## Notifications

| Notification | Trigger | Recipient | Purpose |
|--------------|---------|-----------|---------|
| Card due reminder | Due date approaching and remaining due exists | Household members allowed to view card | Prevent missed payment. |
| Card overdue warning | Due date passed and remaining due remains | Household members allowed to act on card | Warn about unresolved obligation. |
| Partial payment reminder | Partial payment recorded and due remains | Acting user and relevant household members | Clarify that obligation is not settled. |
| Statement review warning | Statement conflicts with known activity or cannot be interpreted | Acting user | Prompt review without claiming provider truth. |
| Refund review reminder | Refund timing or target billing period unclear | Acting user | Prompt clarification of card adjustment. |
| Unknown charge warning | Fee, interest, or unfamiliar charge needs review | Acting user | Prevent hidden card cost. |
| Card settled confirmation | Billing period reaches zero due | Acting user | Confirm repayment/credit outcome. |
| Card closure warning | User attempts closure with remaining due or unresolved refund | Acting user | Prevent hiding obligation. |
| Card archived confirmation | Card is archived successfully | Acting user | Confirm current-use visibility changed while history remains. |
| Invalid action feedback | Validation, permission, state, or boundary failure | Acting user | Explain why no change occurred. |

## Forbidden Notifications

- No notification may imply available credit is spendable cash.
- No notification may claim provider confirmation unless provider evidence exists in approved scope.
- No notification may execute payment.
- No notification may pressure reward optimization or spending.
