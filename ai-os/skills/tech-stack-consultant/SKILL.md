---
name: tech-stack-consultant
description: Reserved solution-architecture skill for tech-stack-consultant.
---

# Tech Stack Consultant

> Solution redesign only. Preserve validated business behavior. Do not invent business logic. Do not overwrite discovery artifacts.

## Consumes

`artifacts/knowledge/`, `artifacts/features/`, `artifacts/business/`, `artifacts/product-architecture/` (logical `docs/architecture/`), `artifacts/requirements/`, `governance/quality/`, `artifacts/architecture-v2/`

## Produces

`artifacts/tech-stack/`, `artifacts/migration/` → `tech-stack-recommendation`

## Procedure

1. Load consume packs plus artifacts/architecture-v2/.
2. Recommend technologies with alternatives and trade-offs; cite sources; attach confidence.
3. Write tech-stack-recommendation; add tech migration notes under artifacts/migration/.
4. Do not invent business logic. Stop for artifacts/validation/review.

## Quality bar

- Structured JSON payload per `core/packages/schemas/solution-architecture-payload.schema.json`
- Every entry: `source_paths` + `confidence` (0..1)
- Never invent business capabilities or change business rules

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md` before mutating run-record state.
