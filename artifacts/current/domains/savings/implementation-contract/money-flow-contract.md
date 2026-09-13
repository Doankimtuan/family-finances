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

Ledger writes: maturity detection and Inbox creation do not write Ledger. An eligible `auto_renew_until_cancelled` policy runs the configured rollover and existing interest/tax calculation in the same transaction.

No Ledger writes: reminders, manual maturity review, Inbox read/acknowledgment, expected/accrued interest outside the preauthorized rollover path.

Virtual changes: no Plan/Jar movement.

Real money movement: none for maturity detection itself; the preauthorized rollover may recognize interest and update the renewed product principal.

## Renewal Principal + Interest

Money comes from: matured product principal plus provider-confirmed eligible interest or interest recognized by the preauthorized rollover calculation.

Money goes to: new savings cycle principal.

Ledger writes: manual renewal follows provider/manual confirmation; an eligible saved auto-renewal policy may record interest and tax using the existing rollover calculation. No settlement account inflow.

No Ledger writes: saved preferences other than `auto_renew_until_cancelled`, Inbox acknowledgment/read state, expected interest outside the preauthorized rollover path.

Virtual changes: purpose reference may continue, no jar balance change.

Real money movement: provider rollover.

Automatic renewal preauthorization: only `auto_renew_until_cancelled` authorizes this configured rollover without a new maturity confirmation. A missing or invalid package, rule, or required account leaves the cycle matured, moves no money, and asks the user through Inbox.

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
