# Business Boundaries

## What Belongs Here

Investments owns:

- Risk-bearing holding identity.
- Broad asset class.
- Contribution amount and cost context.
- Estimated value.
- Valuation date.
- Valuation source.
- Unrealized gain/loss interpretation.
- Realized gain/loss interpretation after exit.
- Investment income context.
- Simple liquidity context.
- Descriptive risk context.
- Ownership/visibility meaning as investment context.
- Private/family investment uncertainty.
- Historical investment memory after exit.

## What Belongs Elsewhere

Accounts owns:

- Cash containers.
- Bank balances.
- Wallet balances.
- Broker/platform cash if treated as cash container.

Transactions owns:

- Real cash movements.
- Fees, proceeds, dividends, coupons, refunds, corrections, and transfers as ledger facts.

Savings owns:

- Fixed-term savings products and guaranteed/term deposit lifecycle.

Planning owns:

- Intended contributions and household allocation intentions.

Goals owns:

- Targets, progress, and completion interpretation.

Inbox owns:

- Attention and review workflow.

Health owns:

- Read-only financial interpretation.

Categories owns:

- Transaction labeling.

Together owns:

- Household membership, visibility, authority, and partner policy.

## What This Domain Must Never Own

Investments must never own:

- Bank cash balance truth.
- Transaction posting truth.
- Savings-product maturity decisions.
- Goal progress.
- Jar or planning capacity.
- Partner permission policy.
- Health mutation.
- Investment recommendations.
- Trading, rebalancing, or market timing.
- Tax optimization.
- Crypto trading mechanics.
- Legal recovery guidance.

## Responsibility Leakage Guards

- If money moved, Transactions owns the movement.
- If money sits somewhere as cash, Accounts owns the container.
- If money is intended for something, Planning or Goals owns intention.
- If value changed but no cash moved, Investments owns only value interpretation.
- If investment uncertainty requires attention, Inbox owns attention but not strategy.
- If financial condition is interpreted, Health reads only.
