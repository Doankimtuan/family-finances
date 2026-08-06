# Business Boundaries

## What Belongs Here

- Goal purpose.
- Goal name.
- Estimated target amount.
- Optional target date.
- Perceived progress.
- Contribution as progress update.
- Active, Paused, Completed, Cancelled state.
- Simple notes or reason.
- Household-level goal visibility.
- Read-only interpretation of source evidence.

## What Belongs Elsewhere

Accounts:

- Real account balances.
- Cash and wallet location.
- Account ownership and status.

Transactions:

- Real income, expense, transfer, refund, correction, and payment facts.

Savings:

- Product balance, rate, tenor, maturity, withdrawal, renewal, and settlement.

Cards:

- Card statement, card debt, repayment, installment, and billing truth.

Loans:

- Principal, interest, schedule, payoff, and liability truth.

Planning:

- Broader allocation, jars, period review, and household planning context.

Inbox:

- Decision queue and review workflow.

Health:

- Read-only scoring, trends, and insight.

Categories:

- Classification of income and spending.

Together:

- Household membership, partner relationship, visibility rules, and permissions.

## What Goals Must Never Own

- Real Ledger balance.
- Account balance.
- Wallet balance.
- Cash proof.
- Transaction creation or mutation.
- Savings product truth.
- Card or loan obligation truth.
- Health mutation.
- AI-generated financial action.
- Forecasted cash position.
- Advisory-grade recommendation.

## Responsibility Leakage Prevention

- If the question is "where is the money?", ownership is Accounts, Savings, cash reality, wallet provider, or another source domain.
- If the question is "did money move?", ownership is Transactions or the relevant product domain.
- If the question is "what is this money for?", Goals may own the intention.
- If the question is "is this goal safe or advisable?", Goals must not provide advisory-grade judgment.
