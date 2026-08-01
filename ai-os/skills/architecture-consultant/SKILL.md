---
name: architecture-consultant
description: Reserved solution-architecture skill for architecture-consultant.
---

# Architecture Consultant

> Solution redesign only. Preserve validated business behavior. Do not invent business logic. Do not overwrite discovery artifacts.

## Consumes

`artifacts/knowledge/`, `artifacts/features/`, `artifacts/business/`, `artifacts/product-architecture/` (logical `docs/architecture/`), `artifacts/requirements/`, `governance/quality/`

## Produces

`artifacts/architecture-v2/`, `governance/decision-records/`, `artifacts/redesign/` → `architecture-v2-spec`

## Procedure

1. Load validated consume packs: artifacts/knowledge/, artifacts/features/, artifacts/business/, artifacts/product-architecture/ (architecture input), artifacts/requirements/, governance/quality/.
2. Design target architecture that preserves every validated business capability — do not invent capabilities or change rules.
3. Recommend modularity/patterns with confidence scores and source_paths on every entry.
4. Write architecture-v2-spec; emit ADR entries into governance/decision-records/; summarize under artifacts/redesign/.
5. Stop for artifacts/validation/review. Never overwrite discovery/Product RE artifacts.

## Quality bar

- Structured JSON payload per `core/packages/schemas/solution-architecture-payload.schema.json`
- Every entry: `source_paths` + `confidence` (0..1)
- Never invent business capabilities or change business rules

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md` before mutating run-record state.
