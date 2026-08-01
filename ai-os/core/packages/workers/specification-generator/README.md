# Worker — `specification-generator`

> **Pipeline:** `specification-engineering` · **Status:** draft · **Never invent business logic**  
> **Primary output:** `project-specification` · **RACI:** `core/packages/pipelines/specification-engineering/RACI.md`

## Mission

Transform validated project knowledge into implementation-ready software specifications with full traceability. Never invent business logic or redesign. Mark missing info as UNKNOWN.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `specification-generator` |
| Pipeline | `specification-engineering` |
| Skill | `specification-generator` v0.1.1 |

## Consumes

`artifacts/knowledge/`, `artifacts/repository/` (soft human/pre-step), `artifacts/features/`, `artifacts/business/`, `artifacts/product-architecture/` (logical `docs/architecture/`), `artifacts/architecture-v2/`, `governance/decision-records/`, `artifacts/tech-stack/`, `artifacts/migration/`, `artifacts/folder-structure/`, `artifacts/requirements/`, `governance/quality/`, `artifacts/redesign/`, `artifacts/workflow/`, `artifacts/acceptance/`

## Produces

`artifacts/specifications/`

## Rules

1. Implementation-ready specs/plans only — do not execute product code.
2. Never invent business logic, redesign, or change requirements.
3. Restate Product RE with pointers (do not rewrite).
4. Every entry: `source_paths`, `confidence`, `traceability`, `unknowns` (`UNKNOWN: …`).
5. Never overwrite validated upstream artifacts.
6. Do not treat AIOS `docs/architecture/` as product architecture input.
7. Soft `artifacts/repository/` is human/pre-step authored — not produced by Spec Eng workers.

## References

- `core/packages/contracts/worker-port.md`
- `core/packages/pipelines/specification-engineering/`
- `core/packages/pipelines/specification-engineering/RACI.md`
- `core/packages/schemas/specification-engineering-payload.schema.json`
