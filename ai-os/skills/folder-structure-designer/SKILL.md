---
name: folder-structure-designer
description: Reserved solution-architecture skill for folder-structure-designer.
---

# Folder Structure Designer

> Solution redesign only. Preserve validated business behavior. Do not invent business logic. Do not overwrite discovery artifacts.

## Consumes

`artifacts/knowledge/`, `artifacts/features/`, `artifacts/business/`, `artifacts/product-architecture/` (logical `docs/architecture/`), `artifacts/requirements/`, `governance/quality/`, `artifacts/architecture-v2/`, `artifacts/tech-stack/`

## Produces

`artifacts/folder-structure/` → `folder-structure-spec`

## Procedure

1. Load consume packs plus artifacts/architecture-v2/ and artifacts/tech-stack/.
2. Design feature-based repository layout and module boundaries with conventions.
3. Write folder-structure-spec under artifacts/folder-structure/ with confidence and source_paths.
4. Stop for artifacts/validation/review. Never invent business logic.

## Quality bar

- Structured JSON payload per `core/packages/schemas/solution-architecture-payload.schema.json`
- Every entry: `source_paths` + `confidence` (0..1)
- Never invent business capabilities or change business rules

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md` before mutating run-record state.
