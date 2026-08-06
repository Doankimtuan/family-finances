# Cross-Domain Contract

## Accounts

Producer:

- Together produces household scope and membership validity.

Consumer:

- Accounts.

Shared responsibility:

- Together verifies household participation; Accounts owns account facts.

Expected result:

- Only active household members can access household-scoped account context.

## Transactions

Producer:

- Together produces household scope.

Consumer:

- Transactions.

Shared responsibility:

- Together gates household access; Transactions owns money movement.

Expected result:

- Together never creates transaction records.

## Cards

Producer:

- Together produces household scope.

Consumer:

- Cards.

Shared responsibility:

- Together determines member visibility; Cards owns card obligations.

Expected result:

- Card behavior remains outside Together.

## Loans

Producer:

- Together produces household scope.

Consumer:

- Loans.

Shared responsibility:

- Together gates visibility; Loans owns loan terms and repayment state.

Expected result:

- Together does not determine loan fairness or responsibility.

## Savings

Producer:

- Together produces household scope.

Consumer:

- Savings.

Shared responsibility:

- Together gates visibility; Savings owns maturity, renewal, withdrawal, and settlement.

Expected result:

- Together never executes savings action.

## Planning

Producer:

- Together produces current household policy values.

Consumer:

- Planning.

Shared responsibility:

- Together owns policy state; Planning owns planning execution.

Expected result:

- Policy changes affect future interpretation only through Planning-owned behavior.

## Goals

Producer:

- Together produces household scope.

Consumer:

- Goals.

Shared responsibility:

- Together gates participation; Goals owns targets and progress.

Expected result:

- Together does not fund goals.

## Inbox

Producer:

- Together may produce material policy-change context.

Consumer:

- Inbox only if future product scope explicitly requires item creation.

Shared responsibility:

- Together does not create Inbox items by default.

Expected result:

- No unnecessary Inbox noise from Together.

## Health

Producer:

- Together produces household scope.

Consumer:

- Health.

Shared responsibility:

- Health reads scope; Together does not calculate Health.

Expected result:

- Health remains read-only.

## Categories

Producer:

- Together produces household scope.

Consumer:

- Categories.

Shared responsibility:

- Categories owns classification vocabulary.

Expected result:

- Together does not create or edit categories.

## Together

Producer:

- Together produces household, membership, invitation, role, policy, preference, and historical context states.

Consumer:

- Together and other household-scoped domains.

Shared responsibility:

- Together owns collaboration context only.

Expected result:

- No responsibility leakage to money, planning, legal, or dispute domains.
