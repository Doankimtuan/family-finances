# Risk Register

## R-01 Canonical Event Registry Missing

Invariant violated: Every cross-domain financial effect has one owner, one event contract, and one idempotency rule.

Why: Existing sources describe interactions consistently but not in one implementation registry.

Impact: Duplicate, missing, or misrouted money effects.

Likelihood: Medium.

Risk: High.

Suggested safeguard: Create canonical event registry with producer, consumer, source owner, payload, related ids, idempotency key, and forbidden side effects.

Implementation complexity: Medium.

Priority: P1.

## R-02 Ledger Link Constraints Not Enforced

Invariant violated: Every reversal has origin; every correction preserves history; every refund references original when identifiable.

Why: Business rules require links, but implementation must enforce with constraints.

Impact: Orphan refunds, broken correction chains, audit gaps.

Likelihood: Medium.

Risk: High.

Suggested safeguard: Add database and domain-service constraints for refund/reversal/correction links and status transitions.

Implementation complexity: Medium.

Priority: P1.

## R-03 Non-Idempotent Financial Commands

Invariant violated: Retry, double click, duplicate API call, and worker replay must not duplicate money.

Why: Idempotency is an implementation concern not fully specified in frozen business docs.

Impact: Duplicate income, expense, refund, renewal, repayment, or reminder effects.

Likelihood: High.

Risk: High.

Suggested safeguard: Require command idempotency table and natural uniqueness keys for all financial and temporal operations.

Implementation complexity: Medium.

Priority: P1.

## R-04 Temporal Worker Timing Drift

Invariant violated: Month Close, renewal, maturity, recurring events, reminders, and emergency declarations remain deterministic regardless of execution timing.

Why: Scheduled workers can run late, early, twice, or after crash.

Impact: Duplicate reminders, missed locks, stale reviews, unsafe renewal outcomes.

Likelihood: Medium.

Risk: High.

Suggested safeguard: Persist schedule anchors, worker cursors, run ids, natural keys, and compare-and-set transitions.

Implementation complexity: Medium.

Priority: P1.

## R-05 Future Currency And Country Defaults

Invariant violated: Money must remain traceable and not be silently converted or reinterpreted.

Why: Current model is VND-first; future multi-currency/country is explicitly future-scalable.

Impact: False balances, false gains/losses, incorrect reports.

Likelihood: Medium over product lifetime.

Risk: Medium.

Suggested safeguard: Require currency on all money amounts and FX source/date for converted views before multi-currency launch.

Implementation complexity: High.

Priority: P2.

## R-06 Ownership Transition Ambiguity

Invariant violated: Every financial object has valid ownership and authority.

Why: Household split, death, departure, and account ownership transfer are partially deferred.

Impact: Unauthorized mutation, hidden ownership, incorrect visibility, audit disputes.

Likelihood: Medium over product lifetime.

Risk: Medium to High.

Suggested safeguard: Add inactive/deceased/member-departure visibility, legal-owner flags, authority checks, and blocked writes where ownership is unclear.

Implementation complexity: High.

Priority: P2.

