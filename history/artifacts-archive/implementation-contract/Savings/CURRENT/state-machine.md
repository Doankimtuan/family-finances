# State Machine Contract

## States

Draft: configured but unfunded. No provider-held principal.

Pending Funding: funding initiated but not provider-confirmed. v1 state; MVP may skip to Active only when funding is manually confirmed.

Active: provider-held principal exists under known terms.

Grace Period: maturity date reached and provider has a known grace/review window.

Awaiting Renewal: matured/actionable product requires household decision.

Renewed: prior cycle rolled/closed and a new cycle is established.

Completed: matured product fully settled or confirmed settled.

Closed Early: active product closed before maturity after confirmed early-withdrawal decision or provider-confirmed exception.

Cancelled: product never became active or funding was rejected/cancelled before active contract.

Archived: non-operational historical record.

Paused: forbidden Savings state. Pause belongs to Planning.

## Allowed Transitions

| Transition | Trigger | Preconditions | Business Rules | Result |
|---|---|---|---|---|
| Draft -> Pending Funding | Initiate funding | funding source valid; settlement destination valid | no posted Ledger write unless funding is confirmed under Ledger policy | funding in progress |
| Draft -> Active | Create confirmed saving | provider/product terms known; funding already confirmed/manual accepted | write funding Ledger entries if not already posted | active cycle starts |
| Draft -> Cancelled | Cancel before funding | no accepted provider contract | no Ledger write | cancelled record |
| Pending Funding -> Active | Confirm funding | provider accepted amount and terms | write funding outflow/inflow | active cycle starts |
| Pending Funding -> Cancelled | Funding failed/rejected | no provider product exists | reverse/correct prior posting only if it exists | cancelled or failed review |
| Active -> Grace Period | Maturity reached with grace | grace period known | create maturity decision/reminder; no Ledger write | grace review |
| Active -> Awaiting Renewal | Maturity reached without grace | product matured | create maturity decision; no Ledger write unless provider separately posted interest | awaiting decision |
| Active -> Closed Early | Early withdrawal confirmed | preview shown; confirmation recorded; actual/manual settlement accepted | write actual net payout | closed early |
| Active -> Archived | Historical closed import | imported as non-operational | no Ledger write unless historical truth separately confirmed | archived |
| Grace Period -> Awaiting Renewal | Grace needs action | decision still unresolved | escalate/maintain Inbox decision; no Ledger write | awaiting decision |
| Grace Period -> Renewed | Renew during grace | household chose renewal; terms confirmed | write only actual payout/interest entries if applicable | new cycle created |
| Grace Period -> Completed | Withdraw/settle during grace | settlement account valid; provider/manual outcome known | write settlement | completed |
| Awaiting Renewal -> Renewed | Renew or switch | decision recorded; package/rate accepted; no silent rollover | write renewal-related actuals only | new cycle |
| Awaiting Renewal -> Completed | Withdraw all | decision recorded; settlement destination valid | write settlement | completed |
| Awaiting Renewal -> Closed Early | provider exceptional close | provider confirms exception | write actual payout | closed early |
| Renewed -> Active | New cycle established | immutable cycle exists | no additional Ledger write | active |
| Completed -> Archived | Archive | product non-operational | no Ledger write | archived |
| Closed Early -> Archived | Archive | product non-operational | no Ledger write | archived |
| Cancelled -> Archived | Archive | product non-operational | no Ledger write | archived |

## Forbidden Transitions

- Draft -> Completed.
- Pending Funding -> Completed.
- Active -> Renewed without maturity/grace/awaiting-renewal decision.
- Awaiting Renewal -> Renewed from saved preference alone.
- Any state -> Paused.
- Health -> any Savings state.
- Inbox acknowledgment -> Ledger write.

