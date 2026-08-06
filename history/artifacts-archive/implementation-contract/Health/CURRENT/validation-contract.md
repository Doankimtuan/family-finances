# Validation Contract

## Required Fields

Health has no create/edit fields.

Assessment requires:

- Household context.
- Actor context.
- Permission context.
- Source visibility context or explicit source unavailability.

## Business Validation

- Assessment must map to exactly one Health state.
- Every displayed condition must have factor explanation or explicit no-factor state.
- Scenarios must be read-only.
- Completeness must be present when missing or stale facts affect interpretation.

## Financial Validation

- Health must not create ledger writes.
- Health must not update planning.
- Health must not treat virtual planning as real money.
- Health must not include credit availability as real money.
- Health must not infer hidden balances.
- Health must not authorize spending, transfer, repayment, withdrawal, deposit, or correction.

## Ownership Validation

- Accounts own real money containers.
- Transactions own money movement.
- Cards own card truth.
- Loans own loan truth.
- Savings owns savings-product truth.
- Planning owns virtual intention.
- Goals own target intention.
- Inbox owns decision state.
- Categories own classification meaning.
- Together owns membership and permissions.
- Health owns interpretation only.

## State Validation

- Current source facts determine current Health state.
- Stale facts cannot produce current Starting, Steady, or Strong unless refreshed.
- Invalid Attempt cannot transition directly to Strong.
- Unavailable must result when household or permission context is invalid.

## Cross-Domain Validation

- Health can consume source facts only when actor visibility allows.
- Health must omit factors that actor cannot view.
- Health must mark Partial when omitted visible requirements materially affect interpretation.
- Health must not request source-domain mutation as part of assessment.

## Advice Boundary Validation

- No clinical advice.
- No insurance advice.
- No credit advice.
- No investment advice.
- No tax advice.
- No legal advice.
- No prescriptive financial action.
