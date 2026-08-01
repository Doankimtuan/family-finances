# Specification Engineering Pipeline

**Status:** draft · **Version:** 0.1.1 · **Workers packaged (Board HOLD remediated)** · **Feature Workers:** forbidden · **Invent business logic:** forbidden

## Workers

| Worker | Wave | Produces | RACI focus |
|--------|------|----------|------------|
| `specification-generator` | 0 | `artifacts/specifications/` | Spec sections + gaps |
| `task-generator` | 1 | `artifacts/tasks/` | Work-item graph + work-item milestones |
| `roadmap-generator` | 2 | `artifacts/roadmap/` | Delivery order + release milestones + risks |
| `implementation-planner` | 3 | `artifacts/implementation/` | Build order + critical path |

See [RACI.md](RACI.md).

## Consumes

`artifacts/knowledge/`, `artifacts/repository/` (soft **human/pre-step**), `artifacts/features/`, `artifacts/business/`, `artifacts/product-architecture/` (logical `docs/architecture/`), `artifacts/architecture-v2/`, `governance/decision-records/`, `artifacts/tech-stack/`, `artifacts/migration/`, `artifacts/folder-structure/`, `artifacts/requirements/`, `governance/quality/`, `artifacts/redesign/`, `artifacts/workflow/`, `artifacts/acceptance/`

## Rules

- Never invent business logic or redesign the system.
- Restate Product RE with pointers — do not rewrite requirements.
- Mark missing information as `UNKNOWN: …`.
- Never overwrite validated upstream artifacts.
- Produce folder `artifacts/tasks/` ≠ Core Engine `task` artifacts.
- This phase still **does not execute workers** by default (`execute_workers: false`).

## Gates

- Validator `specification-engineering-schema-check` **v0.2.0**
- Reviewer `specification-engineering-coverage-review` **v0.2.0** + on-disk rubric

## Smoke

`npm run aios:specification-engineering:smoke`
