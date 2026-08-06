# Asset Invariants

## Account Balance

Account balance must equal the account's last trusted position plus all accepted account-affecting ledger deltas since that position, adjusted only by explicit reconciliation/correction events.

Invariant: no domain other than Accounts may own account identity or silently alter account position.

## Savings Principal

Savings principal must equal provider-confirmed or manually confirmed product principal after funding, renewal, withdrawal, maturity, partial settlement exception, fee, tax, penalty, correction, or reversal.

Invariant: expected interest, reminders, saved renewal preferences, goals, and plans never increase savings principal.

## Investment Principal And Value

Investment contribution principal must be traceable to real contribution transactions. Estimated value must carry source and valuation date when known.

Invariant: unrealized value is not cash, plan capacity, account balance, or goal completion evidence until realized and settled through Accounts.

## Loan Remaining Principal

Loan remaining principal must equal recorded principal minus recorded principal repayment effects plus corrections, subject to provider-confirmed or household-recorded truth labels.

Invariant: schedules, reminders, payoff estimates, and Inbox acknowledgement do not reduce remaining principal.

## Card Balance

Card balance and remaining due must be explainable from purchases, repayments, refunds, statement credits, fees, interest, corrections, and statement/billing interpretation.

Invariant: credit limit and available credit are not owned money.

## Domain Isolation

No domain can silently modify another domain's asset truth. Cross-domain effects require source-owned commands, domain events, and idempotent consumers.

