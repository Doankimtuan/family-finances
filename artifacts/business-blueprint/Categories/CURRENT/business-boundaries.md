# Business Boundaries

## What Belongs Here

Categories owns:

- Household category definition.
- Category income or expense kind.
- Category assignment as transaction meaning.
- Uncategorized meaning state.
- Category assignment correction.
- Category-based transaction retrieval and actuals interpretation.
- Household-specific vocabulary.
- Active and archived category business meaning.
- Rename and restore as vocabulary lifecycle.
- Non-authoritative provider or merchant suggestions as classification evidence.

## What Belongs Elsewhere

| Concern | Owning domain |
| --- | --- |
| Transaction amount, account, date, currency, direction, refund, correction, and reversal truth | Transactions |
| Real account balance and money location | Accounts |
| Payment rail, provider settlement, and statement truth | Accounts / Cards / Provider integrations |
| Card billing, rewards, fees, MCC, and repayment truth | Cards |
| Loan schedule, principal, interest, repayment, and payoff truth | Loans |
| Savings balance, product terms, maturity, renewal, withdrawal, and interest | Savings |
| Jar capacity, allocation, rollover, and virtual planning state | Planning |
| Goal target, progress, funding interpretation, and completion | Goals |
| Review queue state and household work routing | Inbox |
| Financial health interpretation | Health |
| Household membership, roles, and shared rights | Together |

## What Categories Must Never Own

Categories must never own:

- Real money.
- Available balance.
- Budget or spending cap.
- Payment execution.
- Transfer execution.
- Debt repayment.
- Savings maturity or withdrawal.
- Goal funding.
- Jar capacity.
- Provider-certified truth.
- Health score or recommendation.
- Partner permission policy.
- Autonomous household intent.

## Responsibility Leakage Prevention

- If the question is "where is the money?", Accounts owns it.
- If the question is "what money moved?", Transactions owns it.
- If the question is "what is this money meant to do?", Planning or Goals owns it.
- If the question is "what should the household review?", Inbox owns it.
- If the question is "is the household financially healthy?", Health owns it.
- If the question is "what was this transaction for?", Categories owns it.
