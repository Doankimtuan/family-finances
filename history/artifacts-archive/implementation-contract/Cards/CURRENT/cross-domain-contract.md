# Cross-Domain Contract

## Accounts

Producer:

- Real money sources and linked account context.

Consumer:

- Cards consumes source context for repayments and debit-card access.

Shared responsibility:

- Accounts owns where money is; Cards owns card obligation interpretation.

Expected result:

- Repayment source remains visible and available credit never appears as cash.

## Transactions

Producer:

- Real money movement and recognized financial adjustments.

Consumer:

- Cards consumes transaction meaning for purchases, repayments, refunds, fees, interest, and cashback.

Shared responsibility:

- Transactions owns ledger truth; Cards owns billing and obligation meaning.

Expected result:

- No duplicate spending or repayment.

## Cards

Producer:

- Card status, due amount, billing period, and review state.

Consumer:

- Cards consumes household-entered card facts and transaction meaning.

Shared responsibility:

- Cards owns card-specific contract behavior.

Expected result:

- Card obligation remains deterministic and reviewable.

## Loans

Producer:

- Scheduled borrowing context when needed for boundary checks.

Consumer:

- Cards may reference Loans to avoid duplicate card-origin installment obligations.

Shared responsibility:

- Cards owns revolving card behavior; Loans owns scheduled non-card borrowing.

Expected result:

- Revolving card debt is not Loan by default.

## Savings

Producer:

- Savings may produce real money proceeds if used for repayment.

Consumer:

- Cards consumes repayment source only through Accounts/Transactions meaning.

Shared responsibility:

- Savings owns savings truth; Cards owns card repayment meaning.

Expected result:

- Savings withdrawal and card repayment remain distinct.

## Planning

Producer:

- Cards provides due dates, remaining due, and card-origin future pressure.

Consumer:

- Planning reads those facts for forecasts and virtual preparation.

Shared responsibility:

- Planning owns virtual planning; Cards owns obligation truth.

Expected result:

- Planning never reduces card obligation.

## Goals

Producer:

- Goals may receive indirect cash-flow pressure from Planning/Health.

Consumer:

- Cards does not consume goal allocation.

Shared responsibility:

- Goals owns targets; Cards owns card obligation.

Expected result:

- Card repayment pressure does not directly mutate goals.

## Inbox

Producer:

- Cards produces attention needs.

Consumer:

- Inbox consumes due, overdue, review, refund, charge, closure, and installment review needs.

Shared responsibility:

- Inbox owns review queue; Cards owns underlying facts.

Expected result:

- Inbox acknowledgement never moves money.

## Health

Producer:

- Cards provides read-only risk signals.

Consumer:

- Health reads utilization, repayment pattern, remaining due, fees, and interest when known.

Shared responsibility:

- Health interprets only; Cards remains operational owner.

Expected result:

- Health never writes card state or money.

## Categories

Producer:

- Categories provide purchase classification.

Consumer:

- Cards consumes category meaning for card activity readability.

Shared responsibility:

- Categories owns classification; Cards owns billing obligation.

Expected result:

- Category change does not alter card money truth.

## Together

Producer:

- Household membership, role, visibility, and permission context.

Consumer:

- Cards consumes permission and visibility context.

Shared responsibility:

- Together owns access; Cards enforces action permissions.

Expected result:

- Non-members cannot access card data and viewers cannot mutate.
