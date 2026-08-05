# Ledger Impact

## Events That Write to Real Ledger

Funding confirmed:

- Funding account outflow.
- Savings product inflow.

Funding reversed after prior posting:

- Reversal/correction entries.

Posted interest paid to settlement/account:

- Interest income/inflow to destination.

Maturity full withdrawal:

- Savings product outflow.
- Settlement account inflow.
- Posted interest entry if not already posted.

Principal-only renewal with interest payout:

- Interest payout to settlement account.
- Principal remains provider-held in new cycle.

Early full withdrawal:

- Actual net payout to settlement account.
- Savings product outflow.
- Provider-confirmed fee/tax/penalty writes only if it is an actual posted charge or withheld amount.

Provider-confirmed partial settlement exception:

- Actual payout entries.
- Remaining principal adjusted only to provider-confirmed amount.

Settlement correction:

- Correction/reversal entries when actual differs from prior posted truth.

Duplicate settlement correction:

- Reversal or duplicate marker/correction according to Ledger correction policy.

## Events That Never Write to Real Ledger

- Draft creation.
- Product setup/edit before funding.
- Expected interest calculation.
- Accrued interest estimate.
- Maturity reminder.
- Inbox acknowledgment alone.
- Saved renewal preference.
- Health insight.
- Plan saving intention.
- Goal/purpose association.
- Notification.
- Rate/package warning.
- Early withdrawal preview.
- Penalty warning before confirmed withdrawal.
- Provider catalog change by itself.
- Archival by itself.

## BR-01 Protection

- Jars, goals, and plans may reference purpose but cannot affect Savings balance.
- Savings cannot label planned saving as provider-held principal.
- Ledger entries must correspond to real or manually confirmed money events.

## BR-24 Protection

- Health may read active, matured, completed, locked, liquidity, and concentration facts.
- Health may not create Inbox decisions.
- Health may not change Savings state.
- Health may not write Ledger.
- Health may not execute renewal, withdrawal, settlement, or correction.

