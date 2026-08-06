# Inbox Business Blueprint

## Overview

This blueprint defines the deterministic business behavior of the Inbox domain for ViNha.

Inbox is the household's queue of unresolved financial attention. It answers one business question: what financial item needs a household decision, acknowledgement, dismissal, deferral, expiration, or historical record before the household can trust its money picture?

## Scope

In scope:

- Pending financial attention.
- Source linkage and reason for attention.
- Business states for active and no-longer-active review items.
- Household resolution, acknowledgement, dismissal, deferral, expiration, archive, and recovery.
- Explainable suggestions and constrained pattern-based auto-resolution.
- Staleness and workload context as non-punitive operational information.
- Cross-domain decision routing without taking ownership of source truth.

Out of scope:

- General notifications.
- Marketing or awareness-only feeds.
- Real money movement.
- Virtual planning ownership.
- Health scoring or write-back.
- Partner performance analytics.
- Provider matching, rich evidence review, tax evidence, and advanced decision learning.

## Business Responsibility

Inbox owns the business truth of unresolved financial attention and its review outcome. It does not own the financial fact, the money movement, the planning intention, the health interpretation, or partner relationship policy.

## Relationship With Previous Phases

- Phase 1 discovered Inbox as a decision queue.
- Phase 2 validated that young households accumulate unresolved financial attention.
- Phase 3 approved the core and modified scope while rejecting notification-center behavior and partner analytics.
- Phase 4 converts those decisions into a business contract for future implementation-contract work.
