# Inbox Contract

## Rules

- No Inbox item without a required decision or meaningful review purpose.
- Inbox acknowledgment never writes Ledger.
- Savings maturity and early withdrawal never auto-resolve.
- Duplicate reminders for the same decision are cancelled/resolved when final decision is made.

## Event Matrix

| Event | Create Inbox? | Type | Priority | Required Action | Auto Resolution | Expiry | Dismiss Rules |
|---|---|---|---|---|---|---|---|
| Maturity window reached | Yes | Maturity Reminder | Normal, high if near | Review later, renew, withdraw when actionable | No | product matured/renewed/withdrawn/closed/archived | Dismiss allowed only if no matured decision required |
| Maturity date reached | Yes | Matured Product Decision | High | Renew, switch if v1, withdraw all, settle/review | No | completed/renewed/closed/cancelled/archived | Dismiss must not move money; if dismissed, product remains Awaiting Renewal unless business chooses review-later |
| Grace period begins | Yes | Matured Product Decision | High | Renew/withdraw/review | No | grace ends or product resolved | Dismiss does not settle or renew |
| Early withdrawal preview requested | Usually yes if continuing | Early Withdrawal Confirmation | High, urgent if emergency | Confirm or cancel | No | product matures, closes, or preview stale | Cancel/dismiss keeps product Active |
| Material penalty/forfeiture | Yes | Penalty Warning | High if withdrawal pending | Acknowledge before confirm | No | withdrawal cancelled/confirmed/stale | Dismiss blocks or cancels pending withdrawal unless explicit confirm still required |
| Rate changed at maturity | v1 Yes | Rate/Package Change Warning | Normal or High if tied to maturity | Accept rate, choose alternative, withdraw | No | decision made/product closed | Dismiss cannot accept new rate |
| Package removed/unavailable | v1 Yes | Rate/Package Change Warning | High if selected package | Choose different package or withdraw | No | decision made/product closed | Dismiss cannot renew unavailable package |
| Funding failed/reversed | v1 Yes if user action needed | Failed Funding Review | High | Confirm cancellation/correction/retry outside Savings automation | No | corrected/cancelled | Dismiss allowed only after no unresolved money discrepancy |
| Settlement failed/mismatch | v1 Yes | Failed Settlement Review | High | Confirm correction path | No | corrected/accepted | Dismiss cannot hide unresolved Ledger mismatch |
| Interest paid | No by default | Notification only | N/A | None | N/A | N/A | N/A |
| Product archived | No | None | N/A | None | N/A | N/A | N/A |

