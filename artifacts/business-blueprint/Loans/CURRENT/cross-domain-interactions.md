# Cross-Domain Interactions

## Accounts

Producer:

- Accounts provides payment source context and real-money location.

Consumer:

- Loans consumes account context when repayment is recorded.

Ownership:

- Accounts owns where money is.
- Loans owns the obligation.

Responsibilities:

- Loans must not hide account impact.
- Accounts must not own loan schedule or payoff meaning.

## Transactions

Producer:

- Transactions records real repayment money movement.

Consumer:

- Loans consumes repayment facts to update obligation progress.

Ownership:

- Transactions owns ledger movement.
- Loans owns repayment history meaning.

Responsibilities:

- Repayment must remain financially correct as both movement and liability reduction.

## Cards

Producer:

- Cards may provide contextual information about card obligations.

Consumer:

- Loans does not consume revolving card balances as loan records.

Ownership:

- Cards owns revolving credit, limits, utilization, statements, and billing cycles.
- Loans owns scheduled borrowing obligations.

Responsibilities:

- Prevent card-balance-as-loan leakage.

## Loans

Producer:

- Loans produces obligation facts, due awareness, repayment progress, and status.

Consumer:

- Loans consumes household-confirmed loan facts and repayment interpretations.

Ownership:

- Loans owns loan lifecycle and obligation meaning.

## Savings

Producer:

- Savings may provide context when household considers payoff opportunity cost.

Consumer:

- Loans does not consume or control savings money.

Ownership:

- Savings owns savings-product lifecycle.
- Loans owns repayment obligation.

Responsibilities:

- No automatic movement from savings to loan.

## Planning

Producer:

- Loans produces future repayment pressure for planning.

Consumer:

- Planning consumes loan schedule and burden as future cash-flow context.

Ownership:

- Planning owns virtual allocation and future intention.
- Loans owns real obligation facts.

Responsibilities:

- Keep BR-01 separation.

## Goals

Producer:

- Loans produces repayment burden that can affect goal feasibility.

Consumer:

- Goals consumes obligation pressure as context.

Ownership:

- Goals owns aspirations.
- Loans owns liabilities.

## Inbox

Producer:

- Loans produces due, overdue, stale, completed, and review-worthy conditions.

Consumer:

- Inbox consumes these conditions as user-attention items.

Ownership:

- Inbox owns review surface.
- Loans owns loan facts.

Responsibilities:

- Inbox cannot execute payment or mutate loan truth without user action.

## Health

Producer:

- Loans produces read-only burden and risk signals.

Consumer:

- Health consumes these signals.

Ownership:

- Health owns summary and interpretation.
- Loans owns facts.

Responsibilities:

- Health must remain read-only.

## Categories

Producer:

- Transactions and Categories may classify spending, interest, or fees.

Consumer:

- Loans may reference conceptual split between principal, interest, and fees.

Ownership:

- Categories owns classification.
- Loans owns obligation progress.

Responsibilities:

- Do not collapse loan repayment into only original spending category.

## Together

Producer:

- Loans produces household-relevant obligation context.

Consumer:

- Together consumes shared-finance visibility and acknowledgement context.

Ownership:

- Together owns partner coordination surfaces.
- Loans owns loan facts.

Responsibilities:

- Do not assume every personal loan is automatically shared debt.

