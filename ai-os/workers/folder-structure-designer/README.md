# Worker — `folder-structure-designer`

> **Pipeline:** `solution-architecture` · **Class:** solution redesign (preserve business behavior) · **Status:** draft  
> **Primary output:** `folder-structure-spec`

## Mission

Design the target repository layout using feature-based architecture and clear module boundaries. Produce folder conventions. Preserve business capabilities; never invent business logic.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `folder-structure-designer` |
| Pipeline | `solution-architecture` |
| Depends on | `architecture-consultant`, `tech-stack-consultant` |
| Skill | `folder-structure-designer` |

## Consumes

`knowledge/`, `features/`, `business/`, `product-architecture/` (logical `architecture/`), `requirements/`, `quality/`, `architecture-v2/`, `tech-stack/`

## Produces

`folder-structure/`

## Rules

1. Redesign the solution only — do not discover new product features.
2. Do not modify business rules; preserve validated capabilities/behavior.
3. Every entry MUST include `source_paths` and `confidence` (0..1).
4. Never overwrite discovery / Product RE artifacts.
5. Do not treat AIOS `architecture/` control-plane docs as product architecture input.

## References

- `contracts/worker-port.md`
- `contracts/pipeline.md`
- `pipelines/solution-architecture/`
- `schemas/solution-architecture-payload.schema.json`
