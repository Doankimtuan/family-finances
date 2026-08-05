# Cross-Domain Contract

## Accounts

Producer:

- Account facts, state, real-position eligibility, recorded position context.

Consumer:

- Transaction effects and Together membership context.

Shared responsibility:

- Keep account truth explainable.

Expected result:

- Accounts remain real containers.

## Transactions

Producer:

- Income, expense, transfer, correction, refund, and adjustment money records.

Consumer:

- Account context.

Shared responsibility:

- Accounts validates container state; Transactions owns movement.

Expected result:

- Account positions reflect transaction interpretation.

## Cards

Producer:

- Card-specific obligations and repayment needs.

Consumer:

- Repayment account context.

Shared responsibility:

- Prevent credit limit from becoming owned money.

Expected result:

- Cards may use Accounts for repayment context without inflating real position.

## Loans

Producer:

- Loan payment needs and debt state.

Consumer:

- Payment account context.

Shared responsibility:

- Account only identifies payment container.

Expected result:

- Loan lifecycle remains outside Accounts.

## Savings

Producer:

- Funding, maturity, renewal, withdrawal, and settlement needs.

Consumer:

- Funding and settlement account context.

Shared responsibility:

- Savings owns product lifecycle; Accounts owns container context.

Expected result:

- Savings money movement uses valid account context through Transactions.

## Planning

Producer:

- Planned allocations and recurring intentions.

Consumer:

- Account real position as grounding.

Shared responsibility:

- No planning write to Accounts.

Expected result:

- BR-01 preserved.

## Goals

Producer:

- Goal targets and progress interpretation.

Consumer:

- Account reality may be read as context.

Shared responsibility:

- Goals never become account containers.

Expected result:

- Targets remain intention, not balance.

## Inbox

Producer:

- Account Review items when decision is required.

Consumer:

- Account context and state.

Shared responsibility:

- Inbox decisions do not move money unless routed to owning money action.

Expected result:

- No unnecessary Inbox items.

## Health

Producer:

- Read-only summary.

Consumer:

- Account facts.

Shared responsibility:

- Health never writes Accounts.

Expected result:

- BR-24 preserved.

## Categories

Producer:

- Transaction purpose labels.

Consumer:

- No direct account mutation.

Shared responsibility:

- Keep "where money is" separate from "what spending was for."

Expected result:

- Categories do not become account grouping.

## Together

Producer:

- Household membership and permissions.

Consumer:

- Account action requests.

Shared responsibility:

- Enforce access without redesigning permissions in Accounts.

Expected result:

- Only permitted household actors can act.

