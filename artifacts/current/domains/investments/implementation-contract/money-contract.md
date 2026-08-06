# Money Contract

## Action Money Matrix

| Action | Money source | Money destination | Ledger writes | Planning updates | Read-only updates | No-op situations |
|--------|--------------|-------------------|---------------|------------------|-------------------|------------------|
| Recognize Investment | None | None | None | None | Holding context may be created | Always no money movement |
| Activate Holding | None | None | None | None | State changes to Active | No money movement |
| Edit Holding Facts | None | None | None | None | Holding facts update | No money movement |
| Update Valuation | None | None | None | None | Estimated value/date/source update | No money movement |
| Review Holding | None | None | None | None | Review state/context update | No money movement |
| Mark Impaired | None | None | None | None | Risk/recoverability context update | No money movement |
| Record Investment Income Context | Investment issuer/provider only if cash actually moved | Account receiving cash | Transactions owns cash receipt when present | None | Investment income context updates | If no cash receipt, read-only only |
| Partial Exit | Holding being exited | Account receiving proceeds, external transferee, or none for write-off | Transactions owns proceeds/fees when cash moved | None | Realized outcome context updates | Transfer/write-off may have no cash proceeds |
| Full Exit | Holding being exited | Account receiving proceeds, external transferee, or none for write-off | Transactions owns proceeds/fees when cash moved | None | Final realized outcome updates | Transfer/write-off may have no cash proceeds |
| Cancel Investment | None or prior cash movement handled elsewhere | None or refund destination handled elsewhere | Transactions owns refund/reversal if cash moved | None | State becomes Cancelled | If no cash moved, read-only only |
| Reclassify Holding | None | None | None | None | Ownership moves to correct domain context | No money movement |
| Archive Holding | None | None | None | None | Historical state updates | No money movement |

## BR-01 Guards

- Estimated value never creates spendable money.
- Unrealized gain/loss never creates Ledger writes.
- Household purpose never creates Planning updates.
- Investment contribution intention never creates a holding or transaction.

## Ledger Write Rules

Ledger writes occur only when real cash moves and only through the owning Real Ledger domain:

- Contributions: Transactions records cash outflow/transfer when money leaves an account.
- Income: Transactions records receipt when dividend/coupon/distribution cash arrives.
- Proceeds: Transactions records receipt when sale/redemption/repayment/surrender cash arrives.
- Fees: Transactions records fee only when real fee cash movement or deduction is known.
- Refund/reversal: Transactions records correction/refund when a failed investment returns cash.

Investments never independently writes cash movement.

## Planning Update Rules

Planning updates are always no-op from Investments actions.

Planning may separately hold intended contribution, but Investments actions do not:

- Fund jars.
- Complete goals.
- Increase plan capacity.
- Reduce planned spending.

## Read-Only Update Rules

Read-only updates include:

- Holding identity.
- Asset class.
- Contribution context.
- Estimated value.
- Valuation date/source.
- Liquidity/risk context.
- Ownership/visibility context.
- Realized/unrealized interpretation.
- Historical state.
