# Notification Contract

## Notification Principles

- Notifications inform; they do not move money.
- No notification may create, correct, reverse, refund, or categorize a transaction.
- Avoid unnecessary notifications for normal successful capture when inline confirmation is sufficient.

## Notification Matrix

| Notification | Trigger | Recipient | Purpose |
|--------------|---------|-----------|---------|
| Record confirmation | Income, expense, transfer, refund, correction, or reversal succeeds | Acting user | Confirm action completed and state is understandable. |
| Record failure | Any action fails validation, permission, state, or boundary rules | Acting user | Explain that no transaction state changed. |
| Needs review warning | Transaction becomes Needs Review | Household members allowed to resolve review | Indicate user action is needed to clarify meaning. |
| Review resolved confirmation | Needs Review becomes Resolved, Refund Linked, Corrected, Reversed, or Historical | Acting user | Confirm review work changed state without moving money unless valid money action occurred. |
| Refund linked confirmation | Refund relation is established | Acting user | Explain original and returned-money story is linked. |
| Correction confirmation | Correction succeeds | Acting user | Confirm history is corrected and audit truth preserved. |
| Reversal confirmation | Reversal succeeds | Acting user | Confirm active meaning is unwound and history preserved. |
| Reconciliation discrepancy warning | Lightweight reconciliation finds unresolved difference | Acting user or household reviewer | Prompt review without changing transaction truth. |
| Offline/connection failure | Money mutation is attempted while unavailable in current scope | Acting user | Explain action did not complete and no local write is queued. |

## Non-Notifications

- No reminder for ordinary historical transactions.
- No Health-driven notification that claims to correct transaction truth.
- No AI-driven notification that finalizes classification.
- No notification for read-only search/filter except empty or error state in UI.
