# Cross-Domain Interaction

## Accounts

Savings uses Accounts for funding source and settlement destination.

Savings must not own account balances.

Accounts must not own product maturity or renewal rules.

## Transactions

Transactions records posted funding, interest, settlement, withdrawal, reversal, and correction.

Savings must not treat expected/accrued interest as a transaction.

Transactions must not decide renewal.

## Goals

Goals may provide purpose context.

Savings may reference a purpose but must never become the goal balance.

Goal progress must not mutate Savings principal.

## Planning

Planning may express recurring saving intention, monthly contribution target, or pause/resume planned saving.

Savings must not own automatic recurring transfers.

Planning pause does not pause an active savings product.

## Inbox

Inbox owns maturity decisions, early withdrawal confirmations, penalty warnings, and failed funding/settlement reviews.

Inbox acknowledgment does not write Ledger.

Savings executes lifecycle transition only after required decision.

## Health

Health reads Savings for resilience, liquidity, maturity, and concentration insight.

Health is read-only under BR-24.

Health must not prescribe or execute product actions.

## Together

Together owns household membership, visibility, decision memory, and partner policies.

Savings records legal/household-relevant product facts.

Together cannot override provider/legal depositor reality.

