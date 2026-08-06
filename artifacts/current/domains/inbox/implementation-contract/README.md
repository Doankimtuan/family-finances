# Inbox Implementation Contract

## Overview

This contract defines deterministic implementation behavior for the Inbox domain.

Inbox is the decision queue for unresolved household financial attention. It owns review item state, source linkage, reason for attention, outcome, and concise decision history. It does not own real money, planning truth, health interpretation, notifications delivery, or source-domain truth.

## Scope

In scope:

- Create, review, resolve, acknowledge, dismiss, defer, return, expire, archive, suggest, auto-resolve, recover.
- State validation and transition behavior.
- Permission behavior by actor.
- Money no-op behavior under BR-01.
- UI behavior requirements by state.
- Cross-domain contract expectations.

Out of scope:

- Business redesign.
- UX redesign.
- Architecture redesign.
- Database, API, DTO, or code design.
- Provider matching, rich evidence review, partner analytics, general notification center behavior.

## Relationship With Previous Phases

- Phase 1 discovered Inbox.
- Phase 2 validated household reality.
- Phase 3 approved and modified product scope.
- Phase 4 defined the business blueprint.
- Phase 5 converts the blueprint into deterministic implementation contracts.

## Implementation Principles

- Every action must validate household, actor, state, source, and business boundary before changing state.
- Inbox actions must never move real money.
- Inbox actions must never mutate Health.
- Resolution, acknowledgement, dismissal, expiration, archive, deferral, and auto-resolution must remain distinct.
- Invalid actions must leave the prior valid state unchanged.
- No generic notifications belong in Inbox.
