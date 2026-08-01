# Worker — `specification-generator`

> **Pipeline:** `specification-engineering` · **Status:** draft · **Never invent business logic**  
> **Primary output:** `project-specification` · **RACI:** `pipelines/specification-engineering/RACI.md`

## Mission

Transform validated project knowledge into implementation-ready software specifications with full traceability. Never invent business logic or redesign. Mark missing info as UNKNOWN.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `specification-generator` |
| Pipeline | `specification-engineering` |
| Skill | `specification-generator` v0.1.1 |

## Consumes

`knowledge/`, `repository/` (soft human/pre-step), `features/`, `business/`, `product-architecture/` (logical `architecture/`), `architecture-v2/`, `decision-records/`, `tech-stack/`, `migration/`, `folder-structure/`, `requirements/`, `quality/`, `redesign/`, `workflow/`, `acceptance/`

## Produces

`specifications/`

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
