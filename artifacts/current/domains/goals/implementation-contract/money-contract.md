# Money Contract

## Principle

Goals never writes Real Ledger entries.

For every Goals action:

- Money source: none.
- Money destination: none.
- Ledger writes: none.
- Planning updates: goal intention only.
- Read-only updates: source facts may be consumed but not mutated.

## Action Money Matrix

| Action | Money source | Money destination | Ledger writes | Planning updates | Read-only updates | No-op situations |
| --- | --- | --- | --- | --- | --- | --- |
| Create Goal | None | None | None | Creates Active goal intention. | None. | Invalid input or permission. |
| Edit Goal | None | None | None | Updates goal intention fields. | None. | Terminal goal or invalid edit. |
| Add Contribution Update | None | None | None | Increases perceived progress. | Optional source evidence remains read-only. | Terminal goal, invalid amount, or transfer implication. |
| Pause Goal | None | None | None | Active -> Paused. | None. | Already terminal or not Active. |
| Resume Goal | None | None | None | Paused -> Active. | None. | Not Paused or terminal. |
| Complete Goal | None | None | None | Active/Paused -> Completed. | Optional evidence remains read-only. | Terminal goal or false real-money claim. |
| Cancel Goal | None | None | None | Active/Paused -> Cancelled. | None. | Already terminal. |
| Associate Savings Product Context | None | None | None | Adds contextual relationship only. | Reads Savings truth. | Missing product or ownership confusion. |
| Review Real-Money Evidence | None | None | None | No automatic state change. | Reads source facts. | Missing, stale, or contradictory facts. |
| Handle Deadline Pressure | None | None | None | No automatic state change. | None. | Missing or invalid date. |

## Explicit Non-Movements

- Goal contribution is not a transfer.
- Goal completion is not a payment.
- Goal cancellation does not release money.
- Goal pause does not freeze money.
- Goal resume does not allocate money.
- Goal-savings association does not fund savings.
- Evidence review does not reconcile accounts.

## BR-01 Compliance

All Goals mutations are Virtual Planning changes only. Real money movement must be represented by Transactions, Accounts, Savings, Cards, Loans, cash reality, or external providers.
