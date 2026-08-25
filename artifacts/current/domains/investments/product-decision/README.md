# Investments Product Decision Board

## Overview

This artifact records Product Decision Board decisions for the Investments domain in ViNha.

The board reviewed Phase 1 Domain Discovery and Phase 2 Household Reality Validation for young Vietnam-first households. Decisions here are product-scope decisions only. They do not modify frozen Sources of Truth and do not define UX, architecture, database, API, or implementation details.

## Decision Process

The board evaluated every discovered Investments capability against:

- Phase 1 financial-domain fit.
- Phase 2 household-reality validation.
- ViNha product principles.
- BR-01: Real Ledger is not Virtual Planning.
- BR-24: Health is read-only.
- Simple before powerful.
- Household-first understanding.
- Financial safety over convenience.
- Long-term maintainability over 5-10 years.

Each capability receives exactly one decision:

- APPROVED.
- APPROVED WITH MODIFICATIONS.
- DEFERRED.
- REJECTED.

## Decision Criteria

Approved capabilities are behaviorally validated, financially safe, and necessary for a future household-level Investments domain.

Modified capabilities are valid but require tighter scope, softer terminology, or boundary protection before any implementation phase.

Deferred capabilities are valid but premature, insufficiently validated, dependent on provider maturity, or too complex for current ViNha scope.

Rejected capabilities conflict with product philosophy, create advice or automation risk, confuse real and virtual money, or impose unjustified maintenance cost.

## Source Trace

- Current source: `artifacts/current/domains/investments/`
