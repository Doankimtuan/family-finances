# Notification Contract

## Rules

- Notifications never change Savings state.
- Notifications never write Ledger.
- Decision-worthy notifications must link to Inbox; informational notifications must not create Inbox noise.

## Lifecycle Notifications

| Event | Notification Kind | When | Recipient | Message Purpose |
|---|---|---|---|---|
| Funding initiated | Information | Pending Funding starts | actor/household as policy allows | confirm funding is in progress |
| Funding confirmed | Completion | Active starts | actor/household | confirm savings is active |
| Funding failed | Warning | failure known | actor/household | prompt review if needed |
| Maturity reminder | Reminder | maturity window | household decision participants | remind upcoming decision |
| Matured | Warning/decision prompt | maturity/grace begins | household decision participants | prompt renewal/withdrawal decision |
| Renewal completed | Completion | Renewed -> Active | household | confirm new cycle |
| Withdrawal completed | Completion | Completed | household | confirm settlement |
| Early withdrawal preview | Warning | preview generated | actor | show cost/forfeiture |
| Early withdrawal completed | Completion | Closed Early | household | confirm net payout |
| Interest paid | Information | posted interest confirmed | household | show actual interest received |
| Rate changed | Warning | v1 when known and relevant | household | prompt explicit acceptance/review |
| Package unavailable | Warning | v1 when selected package unavailable | household | prevent invalid renewal |
| Settlement mismatch | Warning | v1 when actual differs | household/admin as policy allows | prompt correction/review |
| Archived | None by default | Archived | none | avoid noise |

