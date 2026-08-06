# Lifecycle

## Canonical States

Draft

Trigger: Household begins configuring a savings product.
Business rule: No money movement and no provider contract exists.
Ledger impact: None.
Inbox impact: None unless abandoned-draft reminders are later approved as a product behavior.
State change: Draft may become Created or Discarded.

Created

Trigger: Product terms are selected and funding is prepared.
Business rule: Provider, principal, funding source, settlement target, term, rate, ownership, and rules must be known enough to request funding.
Ledger impact: None unless funding is executed immediately.
Inbox impact: None.
State change: Created may become FundingPending, Active, Failed, or Cancelled.

FundingPending

Trigger: Money transfer is initiated but not fully accepted by provider.
Business rule: Funds are not yet final savings principal.
Ledger impact: Pending or posted transfer depending on ledger policy, but must remain reconcilable.
Inbox impact: Failure or delayed settlement may create a decision or review item.
State change: FundingPending may become Active, Failed, or Reversed.

Active

Trigger: Provider accepts funds and savings product/cycle begins.
Business rule: Principal, start date, end date, rate, settlement rule, and early withdrawal terms are fixed or otherwise defined.
Ledger impact: Principal is now provider-held savings value.
Inbox impact: Future maturity reminders may be scheduled.
State change: Active may become NearMaturity, Matured, EarlyWithdrawalRequested, Frozen, Transferred, or Closed by exceptional provider action.

NearMaturity

Trigger: Product enters a maturity alert window.
Business rule: Household must be informed before passive rollover or low-yield default behavior creates harm.
Ledger impact: None.
Inbox impact: Maturity decision or reminder item is created under BR-10.
State change: NearMaturity may remain Active, become Matured, or return to Active if reminder dismissed without decision.

Matured

Trigger: End date arrives and provider makes maturity options available.
Business rule: Principal and eligible interest are available for settlement or renewal according to contract.
Ledger impact: Accrued or estimated interest must not be posted as final unless provider-confirmed or policy-approved.
Inbox impact: A maturity decision must exist or be refreshed.
State change: Matured may become Settling, Renewing, Closed, or Exception.

DecisionAcknowledged

Trigger: Household chooses renew, switch, withdraw, change settlement, confirm configured preference, or dismiss.
Business rule: Acknowledgment is a decision record; it is not itself money movement.
Ledger impact: None at acknowledgment.
Inbox impact: The item is acknowledged, dismissed, or rescheduled. Related cascade reminders are cancelled when the decision is final.
State change: DecisionAcknowledged routes to Settling, Renewing, or Closed/Archived depending on action.

Settling

Trigger: Household requests withdrawal or interest payout.
Business rule: Destination account must be valid; provider settlement must be confirmed or later reconciled.
Ledger impact: Transfer out of savings product and into settlement account when settlement posts.
Inbox impact: Failure or mismatch may create review.
State change: Settling may become Closed, PartiallySettled, or Exception.

Renewing

Trigger: Household chooses rollover or a new package.
Business rule: New cycle must have confirmed or selected terms; saved preference cannot bypass required household confirmation under current BR-10 posture.
Ledger impact: Principal and possibly interest roll into a new cycle; interest paid out, if any, moves through Ledger.
Inbox impact: Previous maturity items close; new maturity schedule may be planned.
State change: Renewing becomes Active with a new cycle, or Exception.

EarlyWithdrawalRequested

Trigger: Household requests withdrawal before maturity.
Business rule: Penalty and eligible interest must be previewed before confirmation.
Ledger impact: None at preview.
Inbox impact: Confirmation or penalty warning item may be required.
State change: EarlyWithdrawalRequested may become EarlyWithdrawn, Active, or Exception.

EarlyWithdrawn

Trigger: Provider confirms early closure and payout.
Business rule: Product no longer earns term interest; penalty/forfeiture is recorded.
Ledger impact: Net payout moves to settlement account; penalty/forfeited interest is audit context.
Inbox impact: Confirmation item resolves.
State change: Closed.

Closed

Trigger: Product is fully settled, withdrawn, matured without renewal, or closed by provider.
Business rule: No active provider obligation remains except audit, tax, dispute, or historical reporting.
Ledger impact: No further normal movements.
Inbox impact: Any pending maturity items should be resolved, archived, or cancelled.
State change: Archived after retention period or user archival.

Archived

Trigger: Product is historical and no longer operational.
Business rule: Must remain available for audits, household history, tax, dispute, and financial analysis.
Ledger impact: None.
Inbox impact: None.
State change: Terminal except correction/reopen by audited support process.

