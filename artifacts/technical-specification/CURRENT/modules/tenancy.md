---
document: Module Spec — tenancy
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

# Module Spec — tenancy

## Purpose

Household membership, invitations, auth context resolution (Together/Auth).

## Responsibilities

- Resolve session→membership
- Create/join household
- Invite/revoke
- Admin elevation checks
- Policy audit hooks

## Public Interfaces

- `modules/tenancy/application/index.ts` exports commands/queries only.
- Infrastructure and domain are internal.

## Application Services

Commands: `CreateHousehold`, `AcceptInvitation`, `InviteMember`, `RevokeInvitation`, `UpdateHouseholdPolicy`, `UpdateAssumptions`  
Queries: `GetAuthContext`, `GetHousehold`, `ListMembers`, `ListInvitations`

## Domain Services

Enforce invariants for owned aggregates; no I/O.

## Entities

`Household`, `Member`, `Invitation`

## Value Objects

`Role(partner|admin)`, `Locale`, `CurrencyCode`, `OverspendPolicy`, `AutomationMode`

## Repositories

`tenancyRepository` ports in application; Supabase adapters in infrastructure.

## DTOs / Commands / Queries

Zod schemas colocated with each command/query (`*.input.ts`, `*.result.ts`).

## Validation Rules

- Zod at boundary  
- Domain invariants after parse  
- Module-specific: see Authorization and Business Rules mapping below

## Authorization Rules

Authenticated user; admin for assumptions; partner-visible audit on material changes (REQ-013, REQ-020)

## Events

`HouseholdCreated`, `MemberJoined`, `InvitationAccepted`, `PolicyChanged`

## Dependencies

`shared-kernel`  
Must comply with Architecture Dependency Matrix.

## Folder Structure

`modules/tenancy/{domain,application/{commands,queries},infrastructure}`

## Naming Rules

Per Architecture Naming Standards — `tenancy` prefix not required in symbols; folder owns namespace.

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
