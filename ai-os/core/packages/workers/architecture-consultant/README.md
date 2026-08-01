# Worker — `architecture-consultant`

> **Pipeline:** `solution-architecture` · **Class:** solution redesign (preserve business behavior) · **Status:** draft  
> **Primary output:** `architecture-v2-spec`

## Mission

Design the target solution architecture that preserves validated business capabilities. Improve modularity and recommend patterns. Produce architecture-v2 specs and Architecture Decision Records. Never invent business logic.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `architecture-consultant` |
| Pipeline | `solution-architecture` |
| Depends on | — |
| Skill | `architecture-consultant` |

## Consumes

`artifacts/knowledge/`, `artifacts/features/`, `artifacts/business/`, `artifacts/product-architecture/` (logical `docs/architecture/`), `artifacts/requirements/`, `governance/quality/`

## Produces

`artifacts/architecture-v2/`, `governance/decision-records/`, `artifacts/redesign/`

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
