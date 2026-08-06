# Consistency Check

## No Contradictory Rules

No contradictory rule is present.

Key alignments:

- Estimated value can exist, but spendable plan capacity from unrealized value is forbidden.
- Risk context can exist, but recommendations are forbidden.
- Health can read investment exposure, but Health write-back is forbidden.
- Margin/leverage can be visible as risk, but leverage tools are not supported.

## No Duplicated Responsibilities

Responsibilities remain distinct:

- Accounts: cash containers.
- Transactions: real cash movement.
- Savings: savings products.
- Investments: risk-bearing holding/value truth.
- Planning and Goals: intention.
- Inbox: review attention.
- Health: read-only interpretation.
- Together: household/partner context.

## No Circular Ownership

No circular ownership is introduced.

Investments may consume transaction/account context and may produce read-only context for Health or Inbox, but it does not depend on those domains to define holding truth.

## No Orphan Flows

Every flow maps to a lifecycle state:

- Recognize Investment -> Recognized.
- Activate Holding -> Active.
- Review Holding -> Under Review.
- Partial Exit -> Partially Exited.
- Full Exit -> Exited, Written Off, or Transferred Out.
- Cancel -> Cancelled.
- Archive -> Archived.

## No Missing Lifecycle Stages

The blueprint covers:

- Beginning.
- Normal operation.
- Changes.
- Completion.
- Termination.
- Recovery.
- Exceptional situations.

## No BR Violations

BR-01 is protected:

- Market value is not cash.
- Investment purpose is not planning allocation.
- Unrealized gain/loss is not spendable.

BR-24 is protected:

- Health is read-only.
- Health does not mutate Investments.

No unnecessary automation is protected:

- No automated trading, rebalancing, redeeming, or investing.

## No Architecture Violations

No database, API, DTO, event, state persistence, sequence diagram, or implementation contract is defined.
