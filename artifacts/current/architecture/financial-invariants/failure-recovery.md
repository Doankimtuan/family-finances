# Failure Recovery

## Recovery Principle

No interrupted operation may leave the system in a trusted inconsistent financial state. Either the complete invariant-preserving transition commits, or the previous valid state remains and recovery/review is visible.

## Scenario Contracts

| Scenario | Required recovery behavior |
| --- | --- |
| Interrupted payment | No trusted payment unless ledger transaction and product/account effects commit as one recoverable unit. |
| Cancelled renewal | No new savings cycle unless renewal decision and terms commit; unresolved state remains review-visible. |
| Failed investment | Contribution/proceeds remain pending or under review until real cash movement and holding state are reconciled. |
| Refund failure | Original transaction status is unchanged unless linked refund record commits. |
| Correction failure | Original active truth remains unless full original/reversal/correction chain commits. |
| Month Close interruption | Completed steps are idempotent; incomplete steps resume from deterministic cursor. |
| System crash | Recovery scans in-flight commands and event outbox records without replaying duplicate money effects. |
| Power failure | Durable transaction boundary prevents partial trusted mutation. |

## Required Patterns

- Atomic write plus outbox for financial events.
- Idempotent command table for financial commands.
- Explicit pending/review states for externally uncertain outcomes.
- Compensating correction only through append-only ledger chains.
- Recovery jobs that detect incomplete command/event records and either finalize safely or move to Needs Review.

