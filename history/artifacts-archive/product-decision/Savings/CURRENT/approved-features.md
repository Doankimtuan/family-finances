# Approved Features

Approved features are conceptually correct and should exist in the product.

## Core Product Identity

Define provider, funding source, settlement destination, term, start date, maturity date, rate, current cycle, principal, historical snapshots, and immutable cycle records.

Why: Households need to know where protected money is, when it unlocks, and what terms govern it.

Business value: High.

Complexity: Low to medium.

Risk: Low if kept factual.

Expected frequency: Setup monthly/quarterly; checking weekly/monthly; maturity occasional.

Maintenance cost: Low to medium.

Alternative: Treat savings as generic account. Rejected because it loses maturity and decision behavior.

Release: MVP.

## Funding Validation and Audit

Validate funding source and preserve an audit trail.

Why: Savings must not create money.

Business value: Very high.

Complexity: Low.

Risk: Low.

Expected frequency: Each savings creation or top-up if supported.

Maintenance cost: Low.

Alternative: Manual note-only tracking. Too weak for Real Ledger correctness.

Release: MVP.

## Interest Separation

Estimate expected interest, track posted interest, and keep accrued estimates separate from posted money.

Why: Phase 1 identified projected interest becoming accounting truth as a critical risk.

Business value: Very high.

Complexity: Medium.

Risk: Medium if labels or data ownership are weak.

Expected frequency: Viewed at maturity and during savings review.

Maintenance cost: Medium.

Alternative: Show no interest. Too little value for term deposits.

Release: MVP.

## Maturity Decision

Detect maturity windows, create maturity decisions, cancel duplicate reminders, and prevent silent rollover.

Why: Phase 2 validates maturity as one of the strongest household-fit capabilities.

Business value: Very high.

Complexity: Medium.

Risk: Low if Inbox remains decision-focused.

Expected frequency: Every term maturity.

Maintenance cost: Medium.

Alternative: Passive notification only. Too weak for ViNha's Household Money OS role.

Release: MVP.

## Settlement and Full Withdrawal

Settle principal and interest, support full withdrawal, and settle only as real ledger movement.

Why: Maturity must end in real money truth.

Business value: High.

Complexity: Medium.

Risk: Medium due to provider mismatch.

Expected frequency: Every withdrawal or maturity settlement.

Maintenance cost: Medium.

Alternative: Mark product closed without ledger movement. Rejected as financially incorrect.

Release: MVP.

## Early Withdrawal Decision

Preview early withdrawal, preview penalty/forfeiture, require confirmation, and execute only after decision.

Why: Emergencies and family support are real household scenarios.

Business value: High.

Complexity: Medium.

Risk: Medium because provider rules vary.

Expected frequency: Rare, high impact.

Maintenance cost: Medium.

Alternative: Force users to close manually. Too risky and shame-inducing.

Release: MVP.

## Renewal Same Package

Allow same-package renewal with a new immutable cycle snapshot.

Why: Rollover is common behavior and needs review.

Business value: High.

Complexity: Medium.

Risk: Medium if treated as automatic.

Expected frequency: At maturity.

Maintenance cost: Medium.

Alternative: Always withdraw and recreate. Too much friction.

Release: MVP.

## Savings Rate Metrics Ownership Boundary

Savings rate metrics belong to Health/Plan, not Savings.

Why: Savings owns product truth; Plan owns intention; Health reads and interprets.

Business value: High.

Complexity: Low.

Risk: Low.

Expected frequency: Ongoing.

Maintenance cost: Low.

Alternative: Savings owns behavior coaching. Rejected as duplicated responsibility.

Release: MVP.

