# Validation Contract

## Required Fields

Create Loan requires:

- Lender identity.
- Original principal.
- Broad loan type.
- Repayment term or schedule basis.
- Expected payment amount or sufficient repayment expectation.
- Start or due timing.

Record Repayment requires:

- Loan reference.
- Payment source.
- Payment amount.
- Payment date.

State-changing actions require:

- Loan reference.
- Current state eligibility.
- User confirmation when action is destructive or serious.

## Business Validation

- Loan must be a real borrowing obligation.
- Loan must not be card revolving balance.
- Loan must not be jar, goal, account, or plan.
- Broad type must stay household-understandable.
- Informal loan notes must not create legal contract semantics.
- Completion must not imply lender confirmation unless supported outside current scope.

## Financial Validation

- Principal must be positive.
- Repayment amount must be positive.
- Recorded remaining principal cannot become negative unless settlement is explicitly handled as completion.
- Unknown fees, penalties, and interest splits must not be invented.
- Early payoff estimate must be labeled as estimate.
- Scheduled due date and expected payment must not create money movement.

## Ownership Validation

- Actor must belong to active household.
- Viewer cannot mutate.
- Background Worker cannot move money or mutate loan balance.
- Payment source must be household-relevant and valid through Accounts.

## State Validation

- Every action must validate current state.
- Forbidden transitions must be rejected.
- Recovery from Completed, Cancelled, Defaulted, or Archived must pass through Needs Review.
- Draft can become Active or Abandoned Draft only.
- Archived cannot become Active directly.

## Cross-Domain Validation

- Repayment must use Transaction-owned money movement.
- Payment source must be owned by Accounts.
- Credit-card revolving balance must route to Cards, not Loans.
- Payoff intention must route to Planning/Jars/Goals, not Loans.
- Health must not write loan data.
- Inbox acknowledgement must not change money or loan balance.

