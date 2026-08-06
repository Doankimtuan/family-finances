# Cross-Domain Interactions

## Accounts

Producer:

- Accounts produces real balance and account-location facts.

Consumer:

- Goals may consume account facts read-only.

Ownership:

- Accounts owns where money is.
- Goals owns only goal meaning and progress interpretation.

## Transactions

Producer:

- Transactions produces real income, expense, transfer, refund, and correction facts.

Consumer:

- Goals may consume transaction facts as evidence.

Ownership:

- Transactions owns movement truth.
- Goals owns contribution meaning only when framed as progress.

## Cards

Producer:

- Cards produces statement, obligation, installment, and repayment pressure facts.

Consumer:

- Goals may consider card pressure as read-only context.

Ownership:

- Cards owns card debt and payment truth.
- Goals must not represent card repayment as completed unless Cards/Transactions own the fact.

## Loans

Producer:

- Loans produces loan balance, obligation, schedule, and payoff truth.

Consumer:

- Goals may understand loan pressure as context.

Ownership:

- Loans owns liability truth.
- Goals may not own payoff truth.

## Savings

Producer:

- Savings produces product balance, rate, tenor, maturity, withdrawal, renewal, and settlement facts.

Consumer:

- Goals may reference savings product context.

Ownership:

- Savings owns product truth.
- Goals owns purpose context.

## Planning

Producer:

- Planning produces household allocation context and period review context.

Consumer:

- Goals participates as a future intention within Planning.

Ownership:

- Planning owns broader allocation and review.
- Goals owns the goal-specific intention.

## Goals

Producer:

- Goals produces purpose, target, progress interpretation, lifecycle state, and simple context.

Consumer:

- Planning, Health, Home, and household members may consume goal context.

Ownership:

- Goals owns only goal business meaning.

## Inbox

Producer:

- Inbox may produce human decision resolution for goal-related uncertainty.

Consumer:

- Goals may consume the resolved household decision.

Ownership:

- Inbox owns decision queue behavior.
- Goals owns final goal meaning after household decision.

## Health

Producer:

- Health may produce read-only insight.

Consumer:

- Goals must not consume Health as a mutation source.

Ownership:

- Health reads Goals.
- Health cannot create, update, complete, pause, or cancel Goals.

## Categories

Producer:

- Categories produces spending and income classification context.

Consumer:

- Goals may be informed by category patterns indirectly through Planning or Transactions.

Ownership:

- Categories owns classification meaning.
- Goals owns future purpose.

## Together

Producer:

- Together produces household membership, partner context, and access expectations.

Consumer:

- Goals uses household context for shared visibility.

Ownership:

- Together owns household relationship and permissions.
- Goals owns shared goal meaning within that household.
