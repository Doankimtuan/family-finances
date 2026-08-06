# Validation Contract

## Required Fields

Create Account:

- Household context.
- Account name.
- Broad account type.
- Starting recorded balance or explicit zero.
- Real-world container assertion.

Edit Account:

- Existing account.
- Updated field values.

Manual Adjustment:

- Existing account.
- Adjustment amount or resulting recorded position.
- Explanation/reason.

Close Account:

- Existing account.
- Closure confirmation.

Export:

- Household context.
- Export scope limited to account facts.

## Business Validation

- Account must represent a real-world container.
- Account name must be household-recognizable.
- Account type must be broad and allowed.
- Account cannot be jar, goal, budget, or plan.
- Closure must preserve history.
- Historical account restoration must not duplicate an Active account.

## Financial Validation

- Credit limit must not count as owned money.
- Real-position eligibility must be determinable.
- Transfer must have distinct source and destination accounts.
- Transfer must not count as income or expense.
- Manual adjustment must be explainable.
- Planning allocation must not alter account balance.

## Ownership Validation

- Actor must be active household member for mutations.
- Viewer cannot mutate.
- Background Worker cannot move money or change account state under current scope.
- Together owns membership and access authority.

## State Validation

- Draft can become Active only after required facts pass.
- Active can become Needs Review, Historical, or Closed.
- Needs Review can become Active, Historical, or Closed.
- Historical can become Active only through valid restore.
- Closed cannot be used as active transaction target.
- Abandoned Draft cannot become Active.
- Invalid attempts cannot mutate state.

## Cross-Domain Validation

- Transactions must own money movement.
- Cards must own card obligations.
- Loans must own loan lifecycle.
- Savings must own savings-product lifecycle.
- Planning/Jars must own intention.
- Goals must own targets.
- Inbox must own decision queue only.
- Health must read only.
- Categories must own purpose labels.

