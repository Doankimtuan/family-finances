---
document: Module Spec — platform
technical_specification: v2.0.0
status: OFFICIAL_IMPLEMENTATION_SPEC
run_id: run_technical_specification_20260801T153000Z
created_at: 2026-08-01T15:00:41Z
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
redesign_product: false
redesign_architecture: false
frozen: true
---

# Module Spec — platform

## Purpose

Supabase clients, proxy session, observability, outbox/jobs hooks.

## Responsibilities

- createClient server/browser
- proxy updateSession
- request_id
- structured logging
- outbox helpers

## Public Interfaces

- `modules/platform/application/index.ts` exports commands/queries only.
- Infrastructure and domain are internal.

## Application Services

Commands: `EnqueueOutbox`  
Queries: —

## Domain Services

Enforce invariants for owned aggregates; no I/O.

## Entities

`OutboxMessage`

## Value Objects

—

## Repositories

`platformRepository` ports in application; Supabase adapters in infrastructure.

## DTOs / Commands / Queries

Zod schemas colocated with each command/query (`*.input.ts`, `*.result.ts`).

## Validation Rules

- Zod at boundary  
- Domain invariants after parse  
- Module-specific: see Authorization and Business Rules mapping below

## Authorization Rules

Service role only inside platform jobs

## Events

—

## Dependencies

`shared-kernel`  
Must comply with Architecture Dependency Matrix.

## Folder Structure

`modules/platform/{supabase,observability,jobs}`

## Naming Rules

Per Architecture Naming Standards — `platform` prefix not required in symbols; folder owns namespace.

## Error Handling

Map domain errors → shared-kernel codes → Action/API envelope.

## Logging

Log command name, `request_id`, `household_id`, outcome; never raw secrets/PII.

## Testing Strategy

- Unit: domain + application with in-memory repos  
- Contract: if exposed via `/api/v1`  
- E2E: covered via product journeys when user-facing

## Performance Notes

Avoid N+1 in list queries; tenant+status indexes.

## Security Notes

RLS on all tenant tables; no service-role from UI adapters.

## Business rule implementation guidance

Faithfully implement Product BR-* / REQ-* owned by this module's surfaces; do not invent product behavior.
