# Notification Contract

## Notification Principle

Notifications exist to support timely user awareness. They must not execute money movement, change loan state, or imply provider-confirmed truth.

## Notifications

| Notification | Trigger | Recipient | Purpose |
|--------------|---------|-----------|---------|
| Due reminder | Upcoming due date requires attention. | Authorized household users affected by loan visibility. | Remind household to review or record payment. |
| Overdue warning | Due date passed without recorded repayment. | Authorized household users affected by loan visibility. | Warn that loan may need review. |
| Payment confirmation | Repayment record succeeds. | Acting user and relevant household viewers if enabled. | Confirm record was captured. |
| Payment failure | Repayment record fails validation or permission. | Acting user. | Explain no money or loan progress was recorded. |
| Needs Review warning | Loan enters Needs Review. | Authorized household users affected by loan visibility. | Signal uncertainty requiring human review. |
| Completion confirmation | Loan becomes Completed. | Acting user and relevant household viewers if enabled. | Confirm active obligation ended in product record. |
| Cancellation confirmation | Loan becomes Cancelled. | Acting user. | Confirm loan is no longer active as obligation. |
| Default status warning | Loan becomes Defaulted. | Authorized household users affected by loan visibility. | Signal serious state change. |
| Archive confirmation | Loan becomes Archived. | Acting user. | Confirm current-use view changed while history remains. |
| Rate-change confirmation | Rate awareness update succeeds. | Acting user. | Confirm repayment context changed. |

## Forbidden Notifications

- No notification may claim the lender received payment unless that is known through approved evidence.
- No notification may trigger automatic repayment.
- No notification may mutate Health, Planning, Accounts, or Transactions.
- No notification may present payoff estimate as a lender quote.

