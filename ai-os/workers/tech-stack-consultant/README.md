# Worker — `tech-stack-consultant`

> **Pipeline:** `solution-architecture` · **Class:** solution redesign (preserve business behavior) · **Status:** draft  
> **Primary output:** `tech-stack-recommendation`

## Mission

Recommend modern technologies with alternatives and trade-offs for the target architecture. Produce tech-stack recommendations and tech-related migration notes. Preserve business behavior; never invent business logic.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `tech-stack-consultant` |
| Pipeline | `solution-architecture` |
| Depends on | `architecture-consultant` |
| Skill | `tech-stack-consultant` |

## Consumes

`knowledge/`, `features/`, `business/`, `product-architecture/` (logical `architecture/`), `requirements/`, `quality/`, `architecture-v2/`

## Produces

`tech-stack/`, `migration/`

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
