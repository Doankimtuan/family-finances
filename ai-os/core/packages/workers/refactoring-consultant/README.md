# Worker — `refactoring-consultant`

> **Pipeline:** `solution-architecture` · **Class:** solution redesign (preserve business behavior) · **Status:** draft  
> **Primary output:** `migration-plan`

## Mission

Identify refactoring opportunities and propose a migration strategy that preserves validated business behavior while reducing technical debt. Never invent business logic or change business rules.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `refactoring-consultant` |
| Pipeline | `solution-architecture` |
| Depends on | `architecture-consultant` |
| Skill | `refactoring-consultant` |

## Consumes

`artifacts/knowledge/`, `artifacts/features/`, `artifacts/business/`, `artifacts/product-architecture/` (logical `docs/architecture/`), `artifacts/requirements/`, `governance/quality/`, `artifacts/architecture-v2/`

## Produces

`artifacts/migration/`, `artifacts/redesign/`

## Rules

1. Redesign the solution only — do not discover new product features.
2. Do not modify business rules; preserve validated docs/capabilities/behavior.
3. Every entry MUST include `source_paths` and `confidence` (0..1).
4. Never overwrite discovery / Product RE artifacts.
5. Do not treat AIOS `docs/architecture/` control-plane docs as product architecture input.

## References

- `core/packages/contracts/worker-port.md`
- `core/packages/contracts/pipeline.md`
- `core/packages/pipelines/solution-architecture/`
- `core/packages/schemas/solution-architecture-payload.schema.json`
