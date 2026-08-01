# Specification Engineering Pipeline

**Status:** draft · **Version:** 0.1.1 · **Workers packaged (Board HOLD remediated)** · **Feature Workers:** forbidden · **Invent business logic:** forbidden

## Workers

| Worker | Wave | Produces | RACI focus |
|--------|------|----------|------------|
| `specification-generator` | 0 | `specifications/` | Spec sections + gaps |
| `task-generator` | 1 | `tasks/` | Work-item graph + work-item milestones |
| `roadmap-generator` | 2 | `roadmap/` | Delivery order + release milestones + risks |
| `implementation-planner` | 3 | `implementation/` | Build order + critical path |

See [RACI.md](RACI.md).

## Consumes

`knowledge/`, `repository/` (soft **human/pre-step**), `features/`, `business/`, `product-architecture/` (logical `architecture/`), `architecture-v2/`, `decision-records/`, `tech-stack/`, `migration/`, `folder-structure/`, `requirements/`, `quality/`, `redesign/`, `workflow/`, `acceptance/`

## Rules

- Never invent business logic or redesign the system.
- Restate Product RE with pointers — do not rewrite requirements.
- Mark missing information as `UNKNOWN: …`.
- Never overwrite validated upstream artifacts.
- Produce folder `tasks/` ≠ Core Engine `task` artifacts.
- This phase still **does not execute workers** by default (`execute_workers: false`).

## Gates

- Validator `specification-engineering-schema-check` **v0.2.0**
- Reviewer `specification-engineering-coverage-review` **v0.2.0** + on-disk rubric

## Smoke

`npm run aios:specification-engineering:smoke`
