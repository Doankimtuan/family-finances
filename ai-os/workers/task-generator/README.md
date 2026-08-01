# Worker — `task-generator`

> **Pipeline:** `specification-engineering` · **Status:** draft · **Never invent business logic**  
> **Primary output:** `engineering-task-graph` · **RACI:** `pipelines/specification-engineering/RACI.md`

## Mission

Convert validated specifications into executable engineering work items with dependencies, complexity, priority, work-item milestones, and DoD. Never invent business logic.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `task-generator` |
| Pipeline | `specification-engineering` |
| Skill | `task-generator` v0.1.1 |

## Consumes

`knowledge/`, `repository/` (soft human/pre-step), `features/`, `business/`, `product-architecture/` (logical `architecture/`), `architecture-v2/`, `decision-records/`, `tech-stack/`, `migration/`, `folder-structure/`, `requirements/`, `quality/`, `redesign/`, `workflow/`, `acceptance/`, `specifications/`

## Produces

`tasks/`

## Rules

1. Implementation-ready specs/plans only — do not execute product code.
2. Never invent business logic, redesign, or change requirements.
3. Restate Product RE with pointers (do not rewrite).
4. Every entry: `source_paths`, `confidence`, `traceability`, `unknowns` (`UNKNOWN: …`).
5. Never overwrite validated upstream artifacts.
6. Do not treat AIOS `architecture/` as product architecture input.
7. Soft `repository/` is human/pre-step authored — not produced by Spec Eng workers.

## References

- `contracts/worker-port.md`
- `pipelines/specification-engineering/`
- `pipelines/specification-engineering/RACI.md`
- `schemas/specification-engineering-payload.schema.json`
