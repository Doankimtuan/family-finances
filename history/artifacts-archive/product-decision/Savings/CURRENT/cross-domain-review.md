# Cross-Domain Review

## Accounts

Approved relationship: Funding source and settlement destination.

Boundary: Accounts owns account identity and balances. Savings owns product contract and lifecycle.

No duplication: Savings must not become a generic account list.

## Transactions

Approved relationship: Funding, interest posting, withdrawal, settlement, correction references.

Boundary: Transactions owns posted money movement. Savings owns reason and product state.

No duplication: Estimated interest must not create fake transactions.

## Inbox

Approved relationship: Maturity decision, early withdrawal confirmation, penalty warning, failed settlement review.

Boundary: Inbox owns decision queue and acknowledgment. Savings owns product facts and lifecycle outcome after decision.

No duplication: Inbox must not settle money by itself.

## Goals

Approved relationship: Purpose reference only.

Boundary: Goals owns target/purpose. Savings owns real product.

No duplication: A goal is not a savings balance.

## Planning

Approved relationship: Planned saving amount, pause/resume intention, monthly trade-offs.

Boundary: Planning owns intention and recurring plan. Savings owns actual product state.

No duplication: Planning must not execute savings funding.

## Health

Approved relationship: Read-only liquidity, maturity, concentration, and resilience insight.

Boundary: Health reads only under BR-24.

No duplication: Health must not prescribe renewal, switch, or withdrawal.

## Together

Approved relationship: Partner visibility, decision memory, consent policy where household rules require it.

Boundary: Together owns household membership and collaboration policy. Savings owns product and legal-owner facts.

No duplication: Together must not override legal depositor reality.

