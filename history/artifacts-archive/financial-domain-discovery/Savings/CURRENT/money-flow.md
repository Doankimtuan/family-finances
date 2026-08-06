# Money Flow

Savings money flow must be explicit. Every movement has source, destination, ownership, temporary holding, settlement, and final destination.

## Funding a Savings Product

Money source:

Liquid household account, such as checking, cash, e-wallet, or another eligible real account.

Money destination:

Savings product provider or an internal real ledger representation of the provider-held savings product.

Temporary holding:

The sending account may show a pending transfer. The receiving institution may show pending funding, booked principal, or rejected funding depending on provider.

Settlement:

Funding settles only when the provider accepts funds and establishes the deposit/product contract. Until then, the movement is pending, failed, or reversed.

Final destination:

Provider-held savings principal owned by the legal depositor. In ViNha, this must be represented as Real Ledger value, not a virtual jar.

## Interest Accrual

Money source:

Provider interest obligation.

Money destination:

The savings product balance, settlement account, or a renewal principal depending on the contract.

Temporary holding:

Accrued but unpaid interest may exist economically but is not necessarily available or posted.

Settlement:

Interest becomes ledger truth only when credited, paid, or contractually settled by the provider.

Final destination:

Either compounded into the savings product, paid to a settlement account, or included in maturity settlement.

## Maturity Withdrawal

Money source:

Matured savings principal plus eligible interest at provider.

Money destination:

Selected settlement account.

Temporary holding:

Provider maturity processing, pending transfer, or settlement queue.

Settlement:

Provider confirms payout. The ledger records withdrawal from savings product and deposit into settlement account.

Final destination:

Liquid household account controlled by the legal owner or household.

## Principal and Interest Renewal

Money source:

Matured principal plus eligible interest.

Money destination:

New savings cycle or product.

Temporary holding:

Maturity suspense or provider rollover window.

Settlement:

Provider issues or confirms new term, principal, rate, start date, end date, and settlement rules.

Final destination:

New active savings cycle with locked or accepted terms.

## Principal-Only Renewal

Money source:

Matured principal and interest.

Money destination:

Principal moves into new savings cycle; interest moves to settlement account.

Temporary holding:

Provider payout/rollover processing.

Settlement:

Provider confirms new principal and separate interest payout.

Final destination:

New savings cycle for principal, settlement account for interest.

## Early Withdrawal

Money source:

Active savings product.

Money destination:

Settlement account.

Temporary holding:

Provider liquidation process; penalty calculation; possible cooling or branch approval.

Settlement:

Provider confirms principal returned, interest forfeited or reduced, fees/penalties, and net payout.

Final destination:

Settlement account with an audit record linking decision, penalty, and provider outcome.

## Failed or Reversed Funding

Money source:

Original funding account or provider rejection flow.

Money destination:

Funds return to original or selected account.

Temporary holding:

Pending transfer, suspense account, or provider hold.

Settlement:

Failure is confirmed and any previously expected savings product is voided or marked failed.

Final destination:

No active savings product; ledger reflects reversal or cancellation.

