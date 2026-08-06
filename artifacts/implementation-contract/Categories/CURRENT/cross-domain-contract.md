# Cross-Domain Contract

## Accounts

Producer:

- Accounts provides real money location through transaction context.

Consumer:

- Categories reads no account truth except through transaction context.

Shared responsibility:

- Category labels must not imply account balance.

Expected result:

- Account state remains unchanged by category actions.

## Transactions

Producer:

- Transactions provides transaction facts.

Consumer:

- Categories provides accepted category meaning for transactions.

Shared responsibility:

- Transactions owns amount, account, date, currency, and direction.
- Categories owns classification meaning.

Expected result:

- Category assignment changes meaning only.

## Cards

Producer:

- Cards may provide card transaction, merchant, MCC, statement, refund, fee, or reward evidence.

Consumer:

- Categories may treat card evidence as suggestion context.

Shared responsibility:

- Card evidence is not household category truth by itself.

Expected result:

- Household category can differ from card category.

## Loans

Producer:

- Loans provides loan obligation and repayment context.

Consumer:

- Categories may label transaction meaning.

Shared responsibility:

- Loan repayment truth stays with Loans.

Expected result:

- Category assignment does not alter principal, interest, schedule, or payoff.

## Savings

Producer:

- Savings provides product and movement context.

Consumer:

- Categories may label visible transaction meaning.

Shared responsibility:

- Savings product state remains outside Categories.

Expected result:

- Category assignment does not alter savings balance, maturity, interest, renewal, or withdrawal.

## Planning

Producer:

- Categories produces classification evidence.

Consumer:

- Planning may read category meaning for jar interpretation.

Shared responsibility:

- BR-01 separation is preserved.

Expected result:

- Category meaning may inform planning, but no category action creates jar movement or capacity.

## Goals

Producer:

- Categories provides actual spending/income evidence.

Consumer:

- Goals may read category meaning.

Shared responsibility:

- Goal progress remains owned by Goals.

Expected result:

- Category action does not fund, complete, pause, or cancel goals.

## Inbox

Producer:

- Categories may produce a category review need only when user action is required.

Consumer:

- Inbox owns review item lifecycle.

Shared responsibility:

- Review resolves by valid category action or accepted uncertainty.

Expected result:

- Inbox item resolution never moves money.

## Health

Producer:

- Categories provides read-only category patterns.

Consumer:

- Health reads category evidence.

Shared responsibility:

- Health is read-only.

Expected result:

- Health does not mutate categories.

## Categories

Producer:

- Categories produces household classification meaning.

Consumer:

- Categories consumes user decisions and non-authoritative suggestions.

Shared responsibility:

- None internal beyond preserving classification-only boundaries.

Expected result:

- Vocabulary and assignment states remain deterministic.

## Together

Producer:

- Together provides household membership and permissions context.

Consumer:

- Categories requires household context for all actions.

Shared responsibility:

- Shared category meaning must respect household access rights.

Expected result:

- Only allowed actors mutate shared category vocabulary or assignments.
