# Validation Contract

## Required Fields

Recognize Investment:

- Holding identity.
- Asset class or explicit unknown.
- Ownership/visibility context or explicit unclear.
- Contribution amount, estimate, or explicit unknown.

Activate Holding:

- Holding identity.
- Active ownership confirmation.
- State is Recognized or Under Review.

Update Valuation:

- Estimated value or explicit unknown.
- Valuation date or explicit unknown.
- Valuation source or explicit unknown.

Exit:

- Exit type or explicit unknown.
- Full or partial status.
- Proceeds, transfer, write-off, or explicit unknown.
- Remaining exposure status for partial exit.

Archive:

- Terminal non-active state.

## Business Validation

- Holding cannot be cash-only account.
- Holding cannot be a jar, plan, or goal.
- Holding cannot be guaranteed savings product unless reclassified out of Investments.
- Purpose note cannot create goal progress.
- Risk label cannot recommend action.
- Investment income cannot be ordinary salary by default.

## Financial Validation

- Estimated value is not cash.
- Unrealized gain/loss is not Ledger movement.
- Contribution is not gain.
- Realized gain/loss requires exit.
- Cash movement must be represented by Transactions when money moved.
- Planning updates are always no-op from investment actions.

## Ownership Validation

- Actor must have household access.
- Actor must have visibility or authority over the holding.
- Viewer cannot mutate.
- Partner mutation requires shared/visible holding or Admin authority.
- Background Worker cannot make judgment-based changes.

## State Validation

- Action must be allowed for current state.
- Terminal states cannot return to Active without new recognition or recovery path where allowed.
- Archived is final.
- Active/Under Review/Impaired/Partially Exited cannot be archived.
- Market movement cannot trigger exit.

## Cross-Domain Validation

- Accounts owns cash containers.
- Transactions owns cash movement.
- Savings owns savings-product lifecycle.
- Goals and Planning own intention.
- Inbox owns attention, not strategy.
- Health is read-only.
- Together owns household visibility/permission context.

## Rejected Behavior Validation

Implementation must reject:

- Buy/sell/hold recommendations.
- Automated trading.
- Automated rebalancing.
- Market timing prompts.
- Unrealized value as plan capacity.
- Health write-back.
- Detailed tax optimization.
- Crypto trading mechanics.
