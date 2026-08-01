---
name: refactoring-consultant
description: Reserved solution-architecture skill for refactoring-consultant.
---

# Refactoring Consultant

> Solution redesign only. Preserve validated business behavior. Do not invent business logic. Do not overwrite discovery artifacts.

## Consumes

`artifacts/knowledge/`, `artifacts/features/`, `artifacts/business/`, `artifacts/product-architecture/` (logical `docs/architecture/`), `artifacts/requirements/`, `governance/quality/`, `artifacts/architecture-v2/`

## Produces

`artifacts/migration/`, `artifacts/redesign/` → `migration-plan`

## Procedure

1. Load consume packs plus artifacts/architecture-v2/.
2. Identify refactoring opportunities and a phased migration strategy that preserves behavior.
3. Write migration-plan under artifacts/migration/; note redesign opportunities under artifacts/redesign/ without changing business rules.
4. Stop for artifacts/validation/review. Never invent business logic.

## Quality bar

- Structured JSON payload per `core/packages/schemas/solution-architecture-payload.schema.json`
- Every entry: `source_paths` + `confidence` (0..1)
- Never invent business capabilities or change business rules

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md` before mutating run-record state.
