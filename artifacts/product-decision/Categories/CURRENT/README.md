# Categories Product Decision Board

## Overview

This artifact records Product Decision Board decisions for the Categories domain in ViNha.

The board reviewed Phase 1 Domain Discovery and Phase 2 Household Reality Validation for young Vietnam-first households. Decisions here are product-scope decisions only. They do not modify frozen Sources of Truth and do not define UX, architecture, database, API, or implementation details.

## Decision Process

The board evaluated each discovered capability against:

- Phase 1 financial-domain fit.
- Phase 2 household-reality validation.
- ViNha product principles.
- BR-01: Real Ledger is not Virtual Planning.
- Health read-only (BR-24) principle.
- Financial safety before convenience.
- Young-household comprehension.
- Vietnam-first relevance.
- Manual-work tolerance.
- Long-term maintainability over 5-10 years.

Each capability receives exactly one decision:

- APPROVED.
- APPROVED WITH MODIFICATIONS.
- DEFERRED.
- REJECTED.

## Decision Criteria

Approved capabilities are simple, household-relevant, financially safe, and necessary for making transaction history understandable.

Modified capabilities are valid but need tighter scope, terminology, or boundary protection before implementation.

Deferred capabilities are valid but premature, insufficiently researched, provider-dependent, automation-dependent, or too complex for simple-first scope.

Rejected capabilities conflict with product philosophy, blur real and virtual money, create dangerous misunderstanding, duplicate another domain, add unjustified automation, or make Categories own truth they cannot safely own.

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
