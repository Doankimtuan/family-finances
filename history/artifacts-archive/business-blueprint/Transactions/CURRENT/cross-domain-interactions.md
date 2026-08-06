# Cross-Domain Interactions

## Accounts

Producer: Accounts provides real container context.

Consumer: Transactions consumes account identity and active validity.

Ownership: Accounts owns containers; Transactions owns money movement events.

Responsibilities: Transactions explain account changes. Accounts do not own transaction purpose.

## Transactions

Producer: Transactions produces real ledger facts.

Consumer: Transactions consumes prior transaction history for refunds, corrections, reversals, and search.

Ownership: Transactions owns its own factual lifecycle and audit relationships.

Responsibilities: Preserve cash-flow truth.

## Cards

Producer: Transactions produces card purchase, refund, and payment facts.

Consumer: Cards consumes card-related transaction facts for card business context.

Ownership: Cards owns statement, credit, due-date, and card lifecycle meaning.

Responsibilities: Transactions do not own card billing lifecycle.

## Loans

Producer: Transactions produces repayment, fee, disbursement, or cash movement facts.

Consumer: Loans consumes transaction facts as evidence of loan money movement.

Ownership: Loans owns principal, schedule, interest, and loan state.

Responsibilities: Transactions do not own loan obligations.

## Savings

Producer: Transactions produces deposit, withdrawal, interest, or payout movement facts.

Consumer: Savings consumes relevant transaction facts.

Ownership: Savings owns savings-product lifecycle and maturity meaning.

Responsibilities: Transactions do not own savings product state.

## Planning

Producer: Transactions produces factual activity.

Consumer: Planning consumes transaction facts and category/jar references.

Ownership: Planning owns virtual intention. Transactions own real movement.

Responsibilities: Planning must not create or mutate transaction truth.

## Goals

Producer: Transactions produces real progress or spending evidence.

Consumer: Goals consumes transaction facts as progress context.

Ownership: Goals owns intention and target meaning.

Responsibilities: Goals do not own transaction facts.

## Inbox

Producer: Transactions produces unresolved review needs.

Consumer: Inbox consumes review work.

Ownership: Inbox owns household decision queue. Transactions own transaction facts.

Responsibilities: Inbox resolution clarifies meaning without erasing facts.

## Health

Producer: Transactions produces read-only financial signals.

Consumer: Health consumes transaction patterns.

Ownership: Health owns interpretation only.

Responsibilities: Health must never write, correct, reverse, or create transactions.

## Categories

Producer: Categories provides household meaning labels.

Consumer: Transactions consumes category meaning.

Ownership: Categories owns label taxonomy. Transactions own the selected meaning on a transaction.

Responsibilities: Category changes must not alter money movement.

## Together

Producer: Transactions produces shared household evidence.

Consumer: Together consumes transaction facts for household collaboration context.

Ownership: Together owns collaboration and household relationship context.

Responsibilities: Together does not own transaction truth or personal spending judgment.
