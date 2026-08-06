# Domain Boundaries

## Inside Savings

- Savings product identity.
- Provider and package.
- Legal depositor reference.
- Product type.
- Principal.
- Product term.
- Interest rate and interest method.
- Maturity date.
- Settlement rule.
- Renewal policy and decision history.
- Early withdrawal preview and final outcome.
- Product status and cycle history.
- Provider status and package availability.
- Deposit insurance exposure metadata.
- Contract evidence references.

## Never Inside Savings

- Jar balances.
- Budget allocations.
- Category spending rules.
- Income planning.
- Debt amortization.
- Credit card billing.
- Investment portfolio holdings.
- Health score mutations.
- Regulated financial advice.
- UI navigation or screen design.
- Database schema decisions in this discovery phase.
- API contracts in this discovery phase.

## Belongs to Ledger

- Real accounts.
- Real transactions.
- Posted money movement.
- Account balances.
- Reversals and corrections.
- Real position.

## Belongs to Plan

- Savings intentions.
- Jars and goals.
- Planned monthly allocation.
- Savings rate target as a planning objective.
- Future transfer plans.

## Belongs to Inbox

- Maturity decisions.
- Early withdrawal confirmation.
- Penalty warnings.
- Failed settlement review.
- Household acknowledgment.

## Belongs to Health

- Read-only liquidity analysis.
- Read-only yield insight.
- Read-only concentration risk narrative.
- Read-only trend signals.

## Dependencies

- Savings depends on Ledger for real movement.
- Savings depends on Tenancy for household authority.
- Savings depends on Provider data for contract rules.
- Inbox depends on Savings events and references.
- Health may read Savings snapshots only.

## Shared Ownership

- Maturity decision: Savings provides product facts; Inbox owns the decision workflow.
- Settlement: Savings owns product lifecycle intent; Ledger owns real postings.
- Savings purpose: Plan owns intention; Savings owns product.
- Household visibility: Tenancy owns membership and permissions; Savings owns product facts.

## Event Relationships

- SavingCreated.
- SavingFundingPending.
- SavingFunded.
- SavingMaturityApproaching.
- SavingMatured.
- SavingDecisionAcknowledged.
- SavingSettled.
- SavingRenewed.
- SavingEarlyWithdrawalRequested.
- SavingEarlyWithdrawn.
- SavingFailed.
- ProviderPackageChanged.
- ProviderInactive.

## Forbidden Coupling

- Savings must not mutate jars.
- Savings must not calculate Health by writing Health records.
- Savings must not resolve Inbox and move money in the same ownership boundary.
- Plan must not present savings product balance as jar balance.
- Health must not trigger renewal, settlement, or transfer.

