# Money Flow

## Principles

- Every posted money movement belongs to Real Ledger.
- Savings never creates money.
- Expected/accrued amounts are explanatory until provider-confirmed or posted.
- Plan/Goal purpose references never move money.
- Inbox acknowledgment is not money movement.

## Funding

Source: funding account.

Destination: savings product representation of provider-held money.

Trigger: household initiates or records funding.

Ledger entries:

- Debit/outflow from funding account.
- Credit/inflow to savings product value.

Expected versus actual:

- Expected funding amount is the requested principal.
- Actual funding amount is provider-confirmed accepted principal.
- If actual differs, create review before finalizing.

Failure:

- If no ledger movement posted: move Pending Funding -> Cancelled.
- If ledger movement posted: create reversal/correction and move to Cancelled after reconciliation.

## Interest

Source: provider interest obligation.

Destination: savings product, settlement account, or new renewed principal depending on payout rule.

Ledger entries:

- Expected interest: never writes.
- Accrued estimate: never writes.
- Posted interest paid to account: writes income/interest transaction.
- Interest rolled into renewed principal: writes only when provider confirms and product cycle records new principal; no fake cash payout is created.

Expected versus actual:

- Expected interest is calculated from product terms.
- Actual interest is provider-confirmed posted or settlement amount.
- Difference creates expected-versus-actual history and optional review if material.

## Renewal

Principal + interest renewal:

- Matured principal and confirmed/eligible interest become new principal.
- Ledger writes posted interest only if policy records interest as realized income.
- New cycle begins with immutable principal and terms.

Principal-only renewal:

- Principal rolls into new cycle.
- Interest pays to settlement account.
- Ledger writes interest payout to settlement account.

Change package:

- Existing cycle closes/rolls.
- New cycle starts with selected package terms.
- Ledger effect follows principal + interest or principal-only settlement rule.

## Withdrawal

Full maturity withdrawal:

- Source: matured savings product.
- Destination: settlement account.
- Ledger entries: savings product outflow; settlement account inflow; posted interest if not already posted.
- Result: Completed.

Early full withdrawal:

- Source: active savings product.
- Destination: settlement account.
- Ledger entries: net provider payout; eligible interest if paid; penalty/forfeiture as context or posted fee only if provider explicitly charges a fee.
- Result: Closed Early.

## Partial Withdrawal

Product decision status: Deferred.

Deterministic current rule:

- User-requested partial withdrawal is not offered as standard Savings behavior.
- If provider has already confirmed a partial settlement, treat it as an exception review.
- Actual money movement writes according to provider-confirmed amounts.
- Remaining principal continues only if provider confirms remaining active product terms.

## Tax

Product decision status: Deferred.

Current deterministic rule:

- Tax is not posted by Savings unless provider confirms withholding/tax movement.
- Tax treatment metadata is future scope.
- Net interest equals posted interest minus provider-confirmed tax/withholding only when such tax exists.

## Provider Settlement

Provider-confirmed settlement outranks internal estimate.

Settlement states:

- Pending settlement: money requested but not confirmed.
- Settled: actual provider amount confirmed.
- Failed settlement: provider rejects or transfer fails.
- Mismatch: provider amount differs from expected.

MVP may operate on manual confirmed settlement. v1 must handle pending/failed/mismatch.

