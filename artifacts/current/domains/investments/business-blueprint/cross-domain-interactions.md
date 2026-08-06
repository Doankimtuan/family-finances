# Cross-Domain Interactions

## Accounts

Producer:

- Accounts produces cash container context.

Consumer:

- Investments consumes account context to explain where contribution cash came from or proceeds returned.

Ownership:

- Accounts owns cash balances and containers.
- Investments owns holding/value context.

Responsibilities:

- Investments must not turn holdings into account cash.

## Transactions

Producer:

- Transactions produces real cash movement facts.

Consumer:

- Investments consumes transaction context for contributions, exits, income, fees, and refunds.

Ownership:

- Transactions owns amount, date, account, direction, correction, refund, and cash movement truth.
- Investments owns investment meaning and realized/unrealized interpretation.

Responsibilities:

- Investments must not post transaction facts or reinterpret market value as transaction movement.

## Cards

Producer:

- Cards may produce context if card debt or cash advance funded investment exposure.

Consumer:

- Investments may consume this only as risk context.

Ownership:

- Cards owns card obligation, billing, fees, interest, and repayment.

Responsibilities:

- Investments must not encourage or automate card-funded investing.

## Loans

Producer:

- Loans may produce borrowed-money context.

Consumer:

- Investments may consume borrowed-risk context if household money was invested with debt exposure.

Ownership:

- Loans owns debt obligation and repayment.

Responsibilities:

- Investments must not optimize leverage or repayment strategy.

## Savings

Producer:

- Savings produces savings-product context when an asset is actually a fixed-return savings product.

Consumer:

- Investments may defer/reclassify to Savings when risk-bearing investment classification is wrong.

Ownership:

- Savings owns term deposit and savings-product lifecycle.

Responsibilities:

- Investments must not represent guaranteed savings products as risk-bearing holdings unless the product is genuinely investment-like.

## Planning

Producer:

- Planning may produce intended contribution context.

Consumer:

- Investments may consume purpose or intended-contribution context only as non-binding explanation.

Ownership:

- Planning owns intentions and month-level allocation.

Responsibilities:

- Investments must not make planned contributions real.

## Goals

Producer:

- Goals may produce long-term purpose context.

Consumer:

- Investments may reference purpose without owning goal progress.

Ownership:

- Goals owns targets, aspirations, progress interpretation, and completion.

Responsibilities:

- Investment value must not complete goals by default.

## Inbox

Producer:

- Investments may produce review-worthy conditions: stale value, missing source, unclear ownership, uncertain proceeds, partner conflict, impaired holding, or invalid classification.

Consumer:

- Investments consumes resolved review outcomes.

Ownership:

- Inbox owns attention workflow, not investment strategy.

Responsibilities:

- Inbox must not recommend investment decisions.

## Health

Producer:

- Investments may produce read-only exposure, value freshness, liquidity, and risk context.

Consumer:

- Health consumes investment context only for read-only interpretation.

Ownership:

- Health owns insight display and read-only interpretation.

Responsibilities:

- Health must not mutate Investments or advise buy/sell/hold.

## Categories

Producer:

- Categories may produce labels for investment-related transactions.

Consumer:

- Investments may consume labels as transaction context.

Ownership:

- Categories owns tag meaning.

Responsibilities:

- Categories do not own holding, value, or performance truth.

## Together

Producer:

- Together produces household membership, visibility, and partner context.

Consumer:

- Investments consumes household/partner context for ownership and visibility meaning.

Ownership:

- Together owns membership, permission, policy, and partner-visible audit behavior.

Responsibilities:

- Investments must not decide household authority or privacy policy.
