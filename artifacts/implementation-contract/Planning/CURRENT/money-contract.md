# Money Contract

## Money Behavior By Action

| Action | Money source | Money destination | Ledger writes | Planning updates | Read-only updates | No-op situations |
| --- | --- | --- | --- | --- | --- | --- |
| Create Income Intention | None | None | None | Create expected income intention | Accounts/Transactions may later confirm income | Invalid expectation, permission failure |
| Create Jar | None | None | None | Create virtual purpose container | Home/Health may read plan pulse later | Jar framed as account/balance |
| Update Jar Or Allocation | None | None | None | Update virtual allocation/capacity | Home/Health may read updated plan | Locked period, invalid target, invalid amount |
| Pause Intention | None | None | None | State becomes Paused | Consumers read inactive state | Already terminal or invalid state |
| Resume Intention | None | None | None | State becomes Active | Consumers read active state | Not Paused or terminal |
| Create Or Update Goal | None | None | None | Create/update goal intention | Savings may remain source of product truth | Goal framed as product balance |
| Create Or Update Recurring Expectation | None | None | None | Create/update expected recurrence | Transactions may later confirm payment | Recurring item framed as paid |
| Maintain Expected Due Date | None | None | None | Update expected due pressure | Cards/Loans/Savings may provide confirmed dates read-only | Invalid date or source ambiguity |
| Compare Plan With Facts | None | None | None | May mark Needs Review or retain Active | Reads source-domain facts | Missing/stale facts |
| Review Period | None | None | None | Reviewed or Locked period | Reads facts for context | Required review unresolved |
| Correct Planning | None | None | None | Correct Planning state/data | Source facts remain unchanged | Correction attempts to alter Ledger/product truth |
| Emergency Reallocation | None | None | None | Virtual reallocation only | Real spending may be read if recorded elsewhere | Claims real withdrawal/payment/transfer |
| Complete Intention | None | None | None | Completed then Historical | Source facts may explain completion | Completion claims unconfirmed money fact |
| Cancel Intention | None | None | None | Cancelled then Historical | Consumers read inactive history | Already terminal |
| Archive Intention | None | None | None | Archived then Historical | Consumers read inactive history | Active unresolved review hidden |
| Reject Invalid Attempt | None | None | None | None; prior valid state retained | None | Not applicable |

## BR-01 Contract

- No Planning action writes real ledger movement.
- No Planning action changes account balance.
- No Planning action marks a transaction paid.
- No Planning action confirms card, loan, or savings truth.
- No Inbox acknowledgment moves money.
- No notification moves money.
- No Health read creates Planning mutation.

## Ambiguity Rules

- If money moved, implementation must route to the owning real-money domain, not Planning.
- If a user attempts to treat a jar as an account, action fails or is reframed as virtual intention.
- If a user attempts to mark recurring expectation as paid, Planning must not create paid status.
- If a user completes a goal without source fact, completion is Planning-only.
