# Planning Product Decision Board

## Overview

This board makes product decisions for the Planning domain based on:

- Phase 1 Domain Discovery: `artifacts/domain-discovery/Planning/CURRENT/`
- Phase 2 Household Reality Validation: `artifacts/household-reality-validation/Planning/CURRENT/`

Planning is evaluated as ViNha's household intention domain: expected income, planned allocation, jars, goals, recurring expectations, due pressure, review, and correction.

This board does not redesign business flows, UX, architecture, database, APIs, or implementation. It does not modify frozen Sources of Truth.

## Decision Process

Each discovered capability was reviewed against:

- Real household behavior for Vietnamese young households aged 20-35.
- Shared finance between partners.
- Long-term household financial management.
- Phase 1 domain boundaries.
- Phase 2 validation confidence and unresolved research gaps.
- Existing ViNha product principles and business rules.

Every capability receives one decision:

- APPROVED.
- APPROVED WITH MODIFICATIONS.
- DEFERRED.
- REJECTED.

No capability remains undecided.

## Decision Criteria

Capabilities are approved when they:

- Solve a validated household problem.
- Keep Planning as intention, not real money truth.
- Are understandable to ordinary households.
- Support shared finance without unnecessary blame.
- Are maintainable for 5-10 years.

Capabilities are modified when they:

- Are valuable but need scope, language, or boundary protection.
- Risk confusing planned money with real money.
- Require simpler household framing.

Capabilities are deferred when they:

- Are real but not simple-first.
- Need direct Vietnam-first research.
- Depend on provider maturity, long-term usage, or stronger evidence.

Capabilities are rejected when they:

- Create advisory, tax, automation, or financial-safety risk.
- Conflict with BR-01 Real Ledger != Virtual Planning.
- Conflict with BR-24 Health read-only.
- Add high maintenance cost with low household value.

## Document Index

- [capability-review.md](./capability-review.md)
- [approved-features.md](./approved-features.md)
- [modified-features.md](./modified-features.md)
- [deferred-features.md](./deferred-features.md)
- [rejected-features.md](./rejected-features.md)
- [business-rules-impact.md](./business-rules-impact.md)
- [requirement-impact.md](./requirement-impact.md)
- [acceptance-impact.md](./acceptance-impact.md)
- [cross-domain-impact.md](./cross-domain-impact.md)
- [roadmap.md](./roadmap.md)
- [product-risks.md](./product-risks.md)
- [implementation-priority.md](./implementation-priority.md)
- [consistency-check.md](./consistency-check.md)
- [final-verdict.md](./final-verdict.md)
