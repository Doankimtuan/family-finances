# Business Boundaries

## Belongs Here

- Real account/container identity.
- Household account name.
- Broad account type.
- Account active/historical/closed status.
- Starting and recorded balance context.
- Real-position eligibility.
- Simple liquidity distinction.
- Recognition metadata.
- Lightweight reconciliation status.
- Account context for transactions.
- Historical preservation after closure.

## Belongs Elsewhere

Transactions:

- Money movement events.
- Refunds, corrections, transfers, transaction status.

Cards:

- Credit card limits, statements, due dates, interest, repayment obligations.

Loans:

- Loan principal, schedule, interest, payoff, default, completion.

Savings:

- Term deposit lifecycle, maturity, renewal, withdrawal, settlement.

Planning / Jars:

- Allocation, intention, remaining planned money, overspend behavior.

Goals:

- Targets, aspirations, planned progress.

Inbox:

- Human decision queue.

Health:

- Read-only interpretation and scoring.

Categories:

- Transaction purpose and classification.

Together:

- Household membership, access, partner participation.

## Must Never Own

- Jar-to-account mapping.
- Planned allocations.
- Health write-back.
- Spending analytics.
- Automated money movement.
- Investment advice.
- Provider-import authority in current scope.
- Detailed account integration state before provider features are approved.

## Responsibility Leakage Prevention

- If the question is "where is money?", Accounts owns it.
- If the question is "why did money move?", Transactions/Categories own it.
- If the question is "what is money for?", Planning/Jars/Goals own it.
- If the question is "what should we do?", Inbox may coordinate a decision.
- If the question is "how healthy are we?", Health reads and summarizes.
- If the question is "who may see or act?", Together owns it.

