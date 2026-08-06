# Consistency Check

## No Contradictory Rules

The blueprint consistently treats Loans as obligations, not accounts, cards, expenses, jars, or advice products.

Recorded remaining principal, planned schedule, rate awareness, and payoff estimate are consistently treated as recorded or planning truth unless provider confirmation exists in a later approved scope.

## No Duplicated Responsibilities

| Responsibility | Owner |
|----------------|-------|
| Obligation lifecycle | Loans |
| Money location | Accounts |
| Real money movement | Transactions |
| Revolving credit-card behavior | Cards |
| Virtual allocation | Planning / Jars / Goals |
| Review surface | Inbox |
| Read-only summary | Health |
| Partner coordination | Together |

## No Circular Ownership

Loans can consume account and transaction context, and other domains can consume loan burden, but no domain is required to own another domain's core truth.

## No Orphan Flows

Every primary state has at least one business flow:

- Draft: Create Loan.
- Active: Update, Review, Record Repayment, Rate Awareness, Early Payoff Estimate.
- Needs Review: Review, Correct, Recover.
- Completed: Mark Completed, Archive.
- Cancelled: Cancel, Archive.
- Defaulted: Mark Defaulted, Archive.
- Archived: Archive, Recovery through Needs Review.

## No Missing Lifecycle Stages

Lifecycle covers:

- Beginning.
- Normal operation.
- Changes.
- Completion.
- Termination.
- Recovery.
- Exceptional situations.

## No BR Violations

| Rule / principle | Verification |
|------------------|--------------|
| BR-01 Real Ledger is not Virtual Planning | Repayments are real; schedules and payoff estimates are planning; payoff jars are excluded. |
| BR-24 Health read-only | Health cannot mutate loans. |
| No unnecessary automation | Automatic repayment and auto reconciliation are excluded. |
| User understands where money is | Payment source remains owned by Accounts and visible to loan repayment meaning. |
| Financial safety over convenience | Provider truth, advice, and automation remain constrained or deferred. |

