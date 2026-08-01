---
name: schema-validator
description: Validate JSON Schemas, markdown structure, required fields, data types, and schema compatibility. Never modify artifacts.
---

# Schema Validator

> Never modify source artifacts. Never invent missing information. Report structured findings only. Packaging only — do not execute unless a later phase opens execute.

## Consumes

`core/packages/schemas/`, `artifacts/` (soft), `core/packages/workers/`, `core/packages/pipelines/`, `artifacts/execution/` (soft), `core/packages/templates/`, `artifacts/knowledge/` (soft), `core/packages/registry/`

## Produces

`artifacts/validation/schema-validator/` → `validation-finding` (required `folder_mirror`: `artifacts/validation/schema-validator/…`)

## Ownership

### Rule catalog (owns)
| Kind | Rule |
|------|------|
| json-schema | Payloads validate against declared schemas |
| markdown-structure | Required markdown headings when demanded |
| required-fields | Required JSON fields present |
| data-types | Field types match schema |
| schema-compatibility | Refs resolve; BC breaks noted in MIGRATIONS |

**Distinct from** Core `core/packages/validators/*-schema-check` gates — this worker audits *content* schemas; gates audit *this pipeline's* payloads.

## Procedure

1. Load declared consume paths (honor `extensions.partial` / `incremental` + `validation_scope`).
2. Evaluate **only** owned rule kinds (RACI); skip others.
3. Emit entries with full fields + `folder_mirror` under `artifacts/validation/schema-validator/`.
4. Mark gaps `UNKNOWN: …`. Never mutate sources.
5. Stop for artifacts/validation/review (`core/packages/validators/validation-engine-schema-check` → `gate-validation-report`).

## Heuristics

- Prefer path/schema evidence; fail closed on critical contract breaks.
- Partial runs must emit unknowns for skipped targets.
- Respect RACI — do not duplicate another validator's kinds.
- `result` is authoritative; never use entry_kind `pass`/`fail`.

## Done when

- ≥1 structured entry covering owned kinds (or explicit skip/UNKNOWN for scoped runs)
- Every entry has full fields + `folder_mirror` matching `artifacts/validation/schema-validator/`
- No source mutation; no invented missing info; RACI respected

## Negative examples

- Do not rewrite core/packages/schemas/workers/packs to “fix” findings.
- Do not fabricate traceability or invent missing documents.
- Do not write findings outside `artifacts/validation/<worker_id>/` partition.
- Do not emit gate-shaped `gate-validation-report` from this worker (reporter emits `validation-report`).

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md` before mutating run-record state.
