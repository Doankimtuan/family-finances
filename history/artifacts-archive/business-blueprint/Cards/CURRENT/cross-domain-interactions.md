# Cross-Domain Interactions

## Accounts

Producer:

- Accounts provides real money sources and linked account context.

Consumer:

- Cards consumes account context for debit-card access and credit-card repayment source.

Ownership:

- Accounts owns where money is.
- Cards owns card obligation meaning.

## Transactions

Producer:

- Transactions records real purchase movements, repayments, refunds, fees, interest, cashback, and corrections when they are real ledger events.

Consumer:

- Cards consumes transaction meaning to update card obligation and billing-period interpretation.

Ownership:

- Transactions owns real ledger movement.
- Cards owns statement and obligation interpretation.

## Cards

Producer:

- Cards produces card obligation, due amount, status, and review context.

Consumer:

- Cards consumes issuer facts, household interpretation, transaction facts, and planning context.

Ownership:

- Cards owns card-specific business truth.

## Loans

Producer:

- Loans may provide scheduled-obligation context for comparison only.

Consumer:

- Cards may recognize that a card-origin installment creates future pressure.

Ownership:

- Revolving card debt remains Cards.
- Scheduled loan obligations remain Loans.

## Savings

Producer:

- Savings may provide real-money source context if savings proceeds are used for repayment.

Consumer:

- Cards does not consume savings plans directly.

Ownership:

- Savings owns savings product truth.
- Cards owns repayment obligation interpretation.

## Planning

Producer:

- Cards provides due date and remaining due for future cash-flow awareness.

Consumer:

- Planning reads card obligations.

Ownership:

- Planning owns virtual preparation and forecasts.
- Cards owns current card obligation.

## Goals

Producer:

- Cards may create repayment pressure that affects goal progress indirectly.

Consumer:

- Goals may read cash-flow pressure through Planning or Health context.

Ownership:

- Goals owns goal targets.
- Cards does not own goal allocation.

## Inbox

Producer:

- Cards may produce review-worthy conditions such as upcoming due, unclear statement, refund mismatch, fee, or payment uncertainty.

Consumer:

- Inbox consumes card attention needs.

Ownership:

- Inbox owns user review queue.
- Cards owns underlying card facts.

## Health

Producer:

- Cards provides read-only signals such as utilization, remaining due, repayment pattern, and interest/fee burden when known.

Consumer:

- Health reads card signals.

Ownership:

- Health owns interpretation only.
- Health must not mutate Cards.

## Categories

Producer:

- Categories provides household meaning for card purchases.

Consumer:

- Cards may reference category meaning for purchase interpretation.

Ownership:

- Categories owns classification.
- Cards owns billing and obligation context.

## Together

Producer:

- Together provides household membership, partner context, and permissions.

Consumer:

- Cards consumes household relevance and partner responsibility context.

Ownership:

- Together owns membership and access policy.
- Cards does not own privacy or permission policy.
