# Modified Features

Approved with modifications means the capability is valuable but must be narrowed.

## Product Type

Decision: APPROVED WITH MODIFICATIONS.

Modification: Use only household-relevant types: regulated bank deposit, flexible/digital saving, and manual saving. Do not expose a large financial-product taxonomy.

Why: Young households care whether money is locked, safe, and accessible, not banking taxonomy.

Business value: Medium-high.

Complexity: Medium.

Risk: Over-classification.

Frequency: Setup.

Maintenance cost: Medium.

Release: MVP basic, v1 stronger.

## Product Contract Terms

Decision: APPROVED WITH MODIFICATIONS.

Modification: Capture only terms needed for household decisions: amount, provider, term, maturity, rate, payout, early withdrawal, renewal.

Why: Full contract modeling would turn ViNha into banking software.

Business value: High.

Complexity: Medium.

Risk: Missing rare legal edge cases.

Frequency: Setup and maturity.

Maintenance cost: Medium.

Release: MVP.

## Legal Depositor

Decision: APPROVED WITH MODIFICATIONS.

Modification: v1 should capture depositor as simple household/legal-owner context, not full legal workflow.

Why: Phase 1 and Phase 2 both identify legal owner versus household relevance as important.

Business value: High for shared households.

Complexity: Medium.

Risk: Privacy and conflict.

Frequency: Setup, withdrawal, dispute.

Maintenance cost: Medium.

Release: v1.

## Interest Method and Payment Method

Decision: APPROVED WITH MODIFICATIONS.

Modification: MVP should support simple expected-interest display and posted-interest truth. Detailed compounding can remain hidden until v1.

Why: Users want "how much will we get," not formulas.

Business value: High.

Complexity: Medium.

Risk: Misleading projection.

Frequency: Review and maturity.

Maintenance cost: Medium.

Release: MVP basic, v1 detail.

## Early Withdrawal Policy

Decision: APPROVED WITH MODIFICATIONS.

Modification: Show household-readable penalty/forfeiture preview. Avoid exposing provider formula complexity.

Why: Emergency decisions must be understandable under stress.

Business value: High.

Complexity: Medium.

Risk: Provider mismatch.

Frequency: Rare.

Maintenance cost: Medium.

Release: MVP preview, v1 provider confirmation.

## Renewal Policy

Decision: APPROVED WITH MODIFICATIONS.

Modification: Saved preference may pre-fill or recommend only. It must not silently execute real money movement.

Why: Protects BR-10 and household awareness.

Business value: High.

Complexity: Low.

Risk: Low if no auto-execution.

Frequency: Maturity.

Maintenance cost: Low.

Release: MVP.

## Pending and Failed Money Movement

Decision: APPROVED WITH MODIFICATIONS.

Modification: v1 should model pending, failed, reversed, and settlement mismatch only where real provider/ledger uncertainty exists.

Why: Financial correctness requires it, but MVP can start with confirmed/manual flows.

Business value: High.

Complexity: Medium-high.

Risk: Accounting confusion.

Frequency: Occasional.

Maintenance cost: Medium.

Release: v1.

## Provider and Package Catalog

Decision: APPROVED WITH MODIFICATIONS.

Modification: Keep as infrastructure. Do not make provider browsing/rate shopping a primary user promise.

Why: Users care about their bank and product, not maintaining a marketplace.

Business value: Medium.

Complexity: Medium.

Risk: Stale data.

Frequency: Setup/maturity.

Maintenance cost: Medium-high.

Release: MVP manual, v1 hardened.

## Purpose Reference

Decision: APPROVED WITH MODIFICATIONS.

Modification: Allow a savings product to be associated with a purpose or goal for context only. Never make it a jar balance.

Why: Households think in purposes; BR-01 must still hold.

Business value: High.

Complexity: Medium.

Risk: Boundary confusion.

Frequency: Setup/review.

Maintenance cost: Medium.

Release: v1.

## Partner Decision Memory

Decision: APPROVED WITH MODIFICATIONS.

Modification: Track meaningful decisions such as large withdrawal, renewal, settlement, and emergency breakage. Do not require partner rituals for tiny savings.

Why: Savings is relational in young households.

Business value: High.

Complexity: Medium.

Risk: Too much friction.

Frequency: Maturity/withdrawal.

Maintenance cost: Medium.

Release: v1.

