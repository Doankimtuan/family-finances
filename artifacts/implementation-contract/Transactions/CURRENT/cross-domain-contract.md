# Cross-Domain Contract

## Accounts

Producer: Accounts.

Consumer: Transactions.

Shared responsibility: Accounts confirms real active container; Transactions records movement.

Expected result: Every money transaction has valid account context or fails/Needs Review.

## Transactions

Producer: Transactions.

Consumer: Transactions.

Shared responsibility: Prior transaction history supports refund, correction, reversal, and search.

Expected result: Audit relationships preserve truth.

## Cards

Producer: Transactions for card-related money movement.

Consumer: Cards.

Shared responsibility: Transactions own purchase/payment/refund facts; Cards own statement and credit lifecycle.

Expected result: Card domain can interpret facts without rewriting them.

## Loans

Producer: Transactions for disbursement, repayment, fee, or cash movement.

Consumer: Loans.

Shared responsibility: Transactions own money event; Loans own obligation schedule and status.

Expected result: Loan state may reference transaction evidence without owning transaction truth.

## Savings

Producer: Transactions for deposit, withdrawal, interest, and payout movements.

Consumer: Savings.

Shared responsibility: Transactions own money event; Savings owns product lifecycle.

Expected result: Savings activity remains explainable by real ledger facts.

## Planning

Producer: Transactions.

Consumer: Planning.

Shared responsibility: Transactions provide facts; Planning interprets virtual intent.

Expected result: Planning never creates or mutates transaction truth.

## Goals

Producer: Transactions.

Consumer: Goals.

Shared responsibility: Transactions provide real evidence; Goals own target/intention meaning.

Expected result: Goal progress uses facts read-only unless valid real money action occurs elsewhere.

## Inbox

Producer: Transactions.

Consumer: Inbox.

Shared responsibility: Transactions identify review need; Inbox manages review work.

Expected result: Inbox resolution clarifies meaning without moving money.

## Health

Producer: Transactions.

Consumer: Health.

Shared responsibility: Transactions provide facts; Health interprets read-only signals.

Expected result: Health never writes transaction data.

## Categories

Producer: Categories.

Consumer: Transactions.

Shared responsibility: Categories provide valid labels; Transactions attach meaning.

Expected result: Category meaning does not alter real money movement.

## Together

Producer: Transactions.

Consumer: Together.

Shared responsibility: Transactions provide shared evidence; Together supports household collaboration.

Expected result: Collaboration context does not mutate transaction truth or judge personal behavior.
