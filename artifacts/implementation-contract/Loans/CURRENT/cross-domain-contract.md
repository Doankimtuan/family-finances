# Cross-Domain Contract

## Accounts

Producer:

- Accounts provides valid payment source context.

Consumer:

- Loans consumes source validity and display context.

Shared responsibility:

- Repayment must show where money left from.

Expected result:

- Loans never owns account balance.

## Transactions

Producer:

- Transactions produces or owns real ledger repayment movement.

Consumer:

- Loans consumes repayment fact for history and recorded principal progress.

Shared responsibility:

- Payment must be financially correct as movement plus obligation effect.

Expected result:

- No loan repayment exists as fake planning movement.

## Cards

Producer:

- Cards owns card balances, limits, billing, statements, and utilization.

Consumer:

- Loans consumes no revolving-card balance as Loan.

Shared responsibility:

- Prevent card/loan confusion.

Expected result:

- Credit-card revolving balance is rejected from Loans.

## Loans

Producer:

- Loans produces obligation state, schedule, due awareness, repayment history, and burden.

Consumer:

- Loans consumes authorized user corrections and repayment interpretations.

Shared responsibility:

- Internal loan facts remain deterministic.

Expected result:

- Loan lifecycle remains valid.

## Savings

Producer:

- Savings may provide read-only context for household payoff consideration.

Consumer:

- Loans does not control savings.

Shared responsibility:

- No automatic movement from savings to loan.

Expected result:

- Savings lifecycle remains independent.

## Planning

Producer:

- Loans produces repayment schedule and payoff estimate as planning inputs.

Consumer:

- Planning consumes future obligation pressure.

Shared responsibility:

- BR-01 separation.

Expected result:

- Planning intentions never change loan balance.

## Goals

Producer:

- Loans produces repayment burden.

Consumer:

- Goals consumes burden as context.

Shared responsibility:

- Goals remain aspirations; Loans remain liabilities.

Expected result:

- Goal progress is not loan repayment.

## Inbox

Producer:

- Loans produces due, overdue, completion, default, and review-worthy conditions.

Consumer:

- Inbox consumes attention needs.

Shared responsibility:

- Inbox acknowledgement never changes money.

Expected result:

- Human attention is surfaced without automation.

## Health

Producer:

- Loans produces read-only burden/risk facts.

Consumer:

- Health consumes facts.

Shared responsibility:

- Health remains read-only.

Expected result:

- Health never mutates loan state, payment, or balance.

## Categories

Producer:

- Categories may classify repayment components where known.

Consumer:

- Loans consumes no category as source of obligation truth.

Shared responsibility:

- Principal reduction is not only spending category.

Expected result:

- Loan repayment remains liability behavior.

## Together

Producer:

- Loans produces household relevance and visibility context.

Consumer:

- Together consumes partner-visible obligation facts.

Shared responsibility:

- Partner visibility follows household permissions and sensitivity.

Expected result:

- Personal obligation is not automatically declared shared debt.

