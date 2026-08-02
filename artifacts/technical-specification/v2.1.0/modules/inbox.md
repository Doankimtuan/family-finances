---
document: Module Spec — inbox
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

# Module Spec — inbox

## Purpose

Decision queue: review items, maturity/EMI coaches, future approvals (Inbox).

## Responsibilities

- Enqueue/list/resolve ReviewItems
- Surface savings/EMI decisions
- Map strangler jar_review_queue

## Public Interfaces

- `modules/inbox/application/index.ts` exports commands/queries only.
- Infrastructure and domain are internal.

## Application Services

Commands: `EnqueueReview`, `ResolveReviewToJar`, `DismissReview`, `AcknowledgeMaturityAction`  
Queries: `ListOpenInboxItems`, `GetInboxCount`, `GetInboxItem`

## Domain Services

Enforce invariants for owned aggregates; no I/O.

## Entities

`ReviewItem`, `ApprovalItem`

## Value Objects

`ReviewStatus`, `ReviewKind(UnmappedExpense|Maturity|EMI|Approval)`

## Repositories

`inboxRepository` ports in application; Supabase adapters in infrastructure.

## DTOs / Commands / Queries

Zod schemas colocated with each command/query (`*.input.ts`, `*.result.ts`).

## Validation Rules

- Zod at boundary  
- Domain invariants after parse  
- Module-specific: see Authorization and Business Rules mapping below

## Authorization Rules

Membership; both partners may resolve (REQ-020)

## Events

`ReviewItemCreated`, `ReviewItemResolved`

## Dependencies

`shared-kernel`, `tenancy`, `plan`, `ledger`  
Must comply with Architecture Dependency Matrix.

## Folder Structure

`modules/inbox/{domain,application/{commands,queries},infrastructure}`

## Naming Rules

Per Architecture Naming Standards — `inbox` prefix not required in symbols; folder owns namespace.

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
