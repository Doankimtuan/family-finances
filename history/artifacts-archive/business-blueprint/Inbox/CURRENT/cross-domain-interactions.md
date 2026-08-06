# Cross-Domain Interactions

## Accounts

Producer:

- Accounts may provide source-container context.

Consumer:

- Inbox consumes account context for recognition only.

Ownership:

- Accounts owns real container identity and balances.

Responsibilities:

- Inbox must not alter account balances or account status.

## Transactions

Producer:

- Transactions produces review needs for unclear, unmapped, corrected, refunded, or incomplete transaction meaning.

Consumer:

- Transactions may consume a valid Inbox resolution as household meaning.

Ownership:

- Transactions owns real ledger transaction truth.

Responsibilities:

- Inbox must not alter transaction amount, account, date, currency, or direction by itself.

## Cards

Producer:

- Cards may produce decision-bearing reminders, statement attention, refund attention, or installment completion attention.

Consumer:

- Cards may consume acknowledgement or decision outcome when valid.

Ownership:

- Cards owns credit lifecycle, statement truth, and repayment obligations.

Responsibilities:

- Inbox must not represent card payment as completed unless Cards owns that truth.

## Loans

Producer:

- Loans may produce installment completion, due attention, or repayment review needs.

Consumer:

- Loans may consume acknowledgement or valid decision outcome.

Ownership:

- Loans owns loan contract and repayment truth.

Responsibilities:

- Inbox must not own loan balance or payment status.

## Savings

Producer:

- Savings may produce maturity, renewal, early withdrawal, rate-change, or settlement attention.

Consumer:

- Savings may consume valid household decisions from Inbox.

Ownership:

- Savings owns product terms, maturity, renewal, withdrawal, and settlement truth.

Responsibilities:

- Inbox must not renew or withdraw savings by itself.

## Planning

Producer:

- Planning may produce review needs when household intention requires decision.

Consumer:

- Planning may consume valid decisions that affect virtual intention.

Ownership:

- Planning owns virtual allocation and intention.

Responsibilities:

- Inbox must not create real money movement or planning truth by itself.

## Goals

Producer:

- Goals may produce attention when goal-related decisions require review.

Consumer:

- Goals may consume decision context when valid.

Ownership:

- Goals owns goal intention and progress interpretation.

Responsibilities:

- Inbox must not own goal progress.

## Inbox

Producer:

- Inbox produces active queue state, review outcome, and historical decision memory.

Consumer:

- Inbox consumes source attention from owning domains.

Ownership:

- Inbox owns only attention state and outcome.

Responsibilities:

- Inbox remains a decision queue.

## Health

Producer:

- Health does not produce Inbox mutations.

Consumer:

- Health may read unresolved count, staleness, or workload context.

Ownership:

- Health owns read-only interpretation.

Responsibilities:

- Health must not mutate Inbox.

## Categories

Producer:

- Categories provides household meaning vocabulary.

Consumer:

- Categories may be referenced by valid Inbox decisions.

Ownership:

- Categories owns category definitions.

Responsibilities:

- Inbox must not redefine category taxonomy.

## Together

Producer:

- Together may define household visibility and partner norms.

Consumer:

- Together may consume shared attention context where appropriate.

Ownership:

- Together owns shared-household policy and relationship-sensitive rules.

Responsibilities:

- Inbox must not create partner performance analytics or surveillance.
