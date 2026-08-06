# Cross-Domain Contract

## Accounts

Producer:

- Accounts provides cash container context.

Consumer:

- Investments consumes source/destination account names or context for explanation.

Shared responsibility:

- Keep cash balance separate from holding value.

Expected result:

- Users understand where cash is and what investment is held.

## Transactions

Producer:

- Transactions provides real money movement facts.

Consumer:

- Investments consumes contribution, proceeds, income, fee, refund, and correction context.

Shared responsibility:

- Transactions owns money movement; Investments owns investment meaning.

Expected result:

- No market value change is posted as a transaction.

## Cards

Producer:

- Cards provides card obligation context if card-funded investing is identified.

Consumer:

- Investments consumes only as risk context.

Shared responsibility:

- Do not encourage card-funded investment.

Expected result:

- Risk is visible without advice or automation.

## Loans

Producer:

- Loans provides borrowed-money context.

Consumer:

- Investments consumes only as leverage/risk context.

Shared responsibility:

- Loans owns repayment and obligation.

Expected result:

- Borrowed investment exposure is not normalized as strategy.

## Savings

Producer:

- Savings provides savings-product classification when relevant.

Consumer:

- Investments reclassifies out when item is actually Savings.

Shared responsibility:

- Avoid confusion between guaranteed/term savings and risk-bearing investment.

Expected result:

- Savings products do not leak into Investments.

## Planning

Producer:

- Planning may provide intended contribution context.

Consumer:

- Investments consumes optional purpose/intention only as explanation.

Shared responsibility:

- Planning intention never creates investment state.

Expected result:

- BR-01 remains protected.

## Goals

Producer:

- Goals may provide long-term purpose.

Consumer:

- Investments consumes purpose note only.

Shared responsibility:

- Investments does not complete goals.

Expected result:

- Purpose and ownership remain distinct.

## Inbox

Producer:

- Investments produces review-worthy conditions.

Consumer:

- Inbox consumes review context and returns user resolution context.

Shared responsibility:

- Inbox resolves attention, not strategy.

Expected result:

- Uncertainty is surfaced without unnecessary Inbox noise.

## Health

Producer:

- Investments produces read-only exposure, liquidity, risk, and stale-value context.

Consumer:

- Health reads only.

Shared responsibility:

- Health cannot write or recommend.

Expected result:

- BR-24 remains protected.

## Categories

Producer:

- Categories provides labels for transaction context.

Consumer:

- Investments may display/interpret labels as context only.

Shared responsibility:

- Categories do not own holdings or value.

Expected result:

- Investment-related transactions can be understood without moving ownership.

## Together

Producer:

- Together provides household membership, visibility, and permission context.

Consumer:

- Investments enforces access and visibility.

Shared responsibility:

- Together owns policy; Investments respects it.

Expected result:

- Sensitive investment data is visible only to allowed actors.
