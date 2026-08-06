# Actors

| Actor | Responsibility |
| --- | --- |
| User | Reviews items, provides context, resolves or dismisses decisions, and remains accountable for their actions. |
| Partner | Shares household visibility, may resolve items, may provide missing context, and may challenge or clarify decisions. |
| Household | The shared financial unit whose records and intentions are affected by Inbox decisions. |
| Family / Relative | May create money movement or context through gifts, loans, reimbursements, or shared obligations. |
| Bank | Produces transaction facts, transfer confirmations, savings notices, card notices, and account messages. |
| Card Issuer | Produces card authorizations, statements, due reminders, installment completion notices, fees, and reversals. |
| E-wallet / Fintech | Produces wallet transactions, bill payments, promotions, refunds, and transfer confirmations. |
| Merchant / Biller | Creates receipts, invoices, refund notices, due notices, and service confirmations. |
| Tax / Invoice Provider | Produces e-invoice evidence or invoice-status information. |
| Third-party Data Provider | May provide read-only transaction, balance, invoice, or notification data. |
| System | Holds Inbox state, links items to source facts, preserves history, and exposes the current queue. |
| Background Worker | Detects stale or expired items, imports eligible signals, or routes internally generated review needs. |
| Other Domain | Owns the underlying financial truth or action that caused the Inbox item. |
| Support / Operations | May investigate data issues, provider failures, or user-reported discrepancies without becoming the financial decision-maker. |

## Actor Boundary

Inbox can identify who needs attention and who made a decision. It does not make the household's financial judgment on behalf of the actors.
