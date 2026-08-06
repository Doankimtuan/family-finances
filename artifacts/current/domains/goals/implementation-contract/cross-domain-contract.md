# Cross-Domain Contract

## Accounts

Producer: Accounts.

Consumer: Goals.

Shared responsibility:

- Accounts provides real balance context read-only.
- Goals does not mutate accounts.

Expected result:

- Goal evidence may mention account context without claiming ownership.

## Transactions

Producer: Transactions.

Consumer: Goals.

Shared responsibility:

- Transactions owns money movement.
- Goals may interpret movements as evidence only.

Expected result:

- Goal contribution remains intention unless linked to transaction-owned fact.

## Cards

Producer: Cards.

Consumer: Goals.

Shared responsibility:

- Cards owns card obligation truth.
- Goals may consider pressure read-only.

Expected result:

- Goal does not mark card repayment complete.

## Loans

Producer: Loans.

Consumer: Goals.

Shared responsibility:

- Loans owns liability truth.
- Goals may consider loan pressure read-only.

Expected result:

- Goal does not own payoff truth.

## Savings

Producer: Savings.

Consumer: Goals.

Shared responsibility:

- Savings owns product truth.
- Goals owns purpose context.

Expected result:

- Association does not duplicate balance, maturity, rate, withdrawal, or renewal behavior.

## Planning

Producer: Goals and Planning.

Consumer: Goals and Planning.

Shared responsibility:

- Goals provides future intention.
- Planning provides broader allocation and period constraints.

Expected result:

- Goal changes respect Planning lock behavior when applicable.

## Goals

Producer: Goals.

Consumer: Goals, Planning, Health, household views.

Shared responsibility:

- Goals owns goal purpose, target, progress interpretation, state, and simple context.

Expected result:

- Other domains consume goal context without taking ownership.

## Inbox

Producer: Goals when evidence conflict requires human review.

Consumer: Inbox and Goals.

Shared responsibility:

- Inbox owns review item lifecycle.
- Goals owns resulting goal meaning after user action.

Expected result:

- Inbox item never moves money or changes progress by acknowledgment alone.

## Health

Producer: Goals.

Consumer: Health.

Shared responsibility:

- Health reads goal data.
- Health never writes Goals.

Expected result:

- Insights cannot mutate goal state or progress.

## Categories

Producer: Categories.

Consumer: Goals indirectly.

Shared responsibility:

- Categories owns classification.
- Goals owns future purpose.

Expected result:

- Category information may inform context but does not create goal behavior.

## Together

Producer: Together.

Consumer: Goals.

Shared responsibility:

- Together owns household membership and visibility policy.
- Goals enforces action rights based on household context.

Expected result:

- Only permitted household actors mutate goals.
