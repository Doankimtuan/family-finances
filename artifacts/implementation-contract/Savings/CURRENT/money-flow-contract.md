# Money Flow Contract

## Create Saving

Money comes from: none.

Money goes to: none.

Ledger writes: none unless created as confirmed Active with funding.

No Ledger writes: Draft setup, expected interest.

Virtual changes: optional purpose reference only, no balance change.

Real money movement: none in Draft.

## Initiate/Confirm Funding

Money comes from: funding account.

Money goes to: savings product/provider-held value.

Ledger writes: funding account outflow and savings product inflow only on confirmed/manual funding.

No Ledger writes: unconfirmed Pending Funding.

Virtual changes: none.

Real money movement: provider/manual accepted principal.

## Maturity

Money comes from: none by maturity event alone.

Money goes to: none by maturity event alone.

Ledger writes: none unless provider separately posts interest.

No Ledger writes: maturity detection, reminder, Inbox creation, expected/accrued interest.

Virtual changes: no Plan/Jar movement.

Real money movement: none.

## Renewal Principal + Interest

Money comes from: matured product principal plus provider-confirmed eligible interest.

Money goes to: new savings cycle principal.

Ledger writes: actual posted interest only if realized per provider/manual confirmation; no settlement account inflow.

No Ledger writes: saved preference, Inbox acknowledgment, expected interest.

Virtual changes: purpose reference may continue, no jar balance change.

Real money movement: provider rollover.

## Renewal Principal Only

Money comes from: matured product.

Money goes to: principal to new cycle; interest to settlement account.

Ledger writes: interest payout to settlement account; principal remains provider-held.

No Ledger writes: renewal preference/pre-fill.

Virtual changes: none.

Real money movement: provider interest payout.

## Withdraw All

Money comes from: matured savings product.

Money goes to: settlement account.

Ledger writes: savings product outflow; settlement account inflow; posted interest if not already posted.

No Ledger writes: decision preview, Inbox acknowledgment alone.

Virtual changes: goal/purpose may mark context only.

Real money movement: actual provider/manual settlement.

## Early Withdrawal

Money comes from: active savings product.

Money goes to: settlement account.

Ledger writes: actual net payout; provider-confirmed fee/tax/penalty only if actual posted/withheld.

No Ledger writes: preview, penalty warning, confirmation before settlement actual.

Virtual changes: none.

Real money movement: provider/manual early settlement.

## Partial Early Withdrawal

Money comes from: provider-confirmed partial settlement only.

Money goes to: settlement account.

Ledger writes: actual provider-confirmed payout only.

No Ledger writes: user request for partial withdrawal; unsupported partial preview.

Virtual changes: none.

Real money movement: exception-only; remaining balance only if provider confirms remaining principal/terms.

## BR-01 Separation

Real Ledger: funding, posted interest, settlement, withdrawal, correction, reversal.

Planning: saving intention, pause planned saving, recurring saving plan.

Inbox: decisions and acknowledgments only.

Goals: purpose context only.

Health: read-only insights only.

