---
name: traceability-validator
description: Verify every artifact traces to features, business rules, architecture, requirements, knowledge. Reject orphans. Never modify artifacts.
---

# Traceability Validator

> Never modify source artifacts. Never invent missing information. Report structured findings only. Packaging only — do not execute unless a later phase opens execute.

## Consumes

`core/packages/schemas/`, `artifacts/` (soft), `core/packages/workers/`, `core/packages/pipelines/`, `artifacts/execution/` (soft), `core/packages/templates/`, `artifacts/knowledge/` (soft), `core/packages/registry/`, `artifacts/features/` (soft), `artifacts/business/` (soft), `artifacts/requirements/` (soft), `artifacts/acceptance/` (soft), `artifacts/product-architecture/` (soft), `artifacts/architecture-v2/` (soft), `artifacts/specifications/` (soft)

## Produces

`artifacts/validation/traceability-validator/` → `validation-finding` (required `folder_mirror`: `artifacts/validation/traceability-validator/…`)

## Ownership

### Rule catalog (owns)
| Kind | Rule |
|------|------|
| feature-trace | Feature claims → artifacts/features/ |
| business-rule-trace | Business claims → artifacts/business/ |
| architecture-trace | Arch claims → artifacts/product-architecture/ or artifacts/architecture-v2/ |
| requirement-trace | Req claims → artifacts/requirements/ or artifacts/acceptance/ |
| knowledge-trace | Knowledge claims → artifacts/knowledge/ |
| orphan | No upstream pointer → **fail** orphan (critical)

**Does not own:** missing-document inventory (completeness-validator).

## Procedure

1. Load declared consume paths (honor `extensions.partial` / `incremental` + `validation_scope`).
2. Evaluate **only** owned rule kinds (RACI); skip others.
3. Emit entries with full fields + `folder_mirror` under `artifacts/validation/traceability-validator/`.
4. Mark gaps `UNKNOWN: …`. Never mutate sources.
5. Stop for artifacts/validation/review (`core/packages/validators/validation-engine-schema-check` → `gate-validation-report`).

## Heuristics

- Prefer path/schema evidence; fail closed on critical contract breaks.
- Partial runs must emit unknowns for skipped targets.
- Respect RACI — do not duplicate another validator's kinds.
- `result` is authoritative; never use entry_kind `pass`/`fail`.

- Orphans without upstream pointer → `result=fail`, `severity=critical`, kind `orphan`.

## Done when

- ≥1 structured entry covering owned kinds (or explicit skip/UNKNOWN for scoped runs)
- Every entry has full fields + `folder_mirror` matching `artifacts/validation/traceability-validator/`
- No source mutation; no invented missing info; RACI respected

## Negative examples

- Do not rewrite core/packages/schemas/workers/packs to “fix” findings.
- Do not fabricate traceability or invent missing documents.
- Do not write findings outside `artifacts/validation/<worker_id>/` partition.
- Do not emit gate-shaped `gate-validation-report` from this worker (reporter emits `validation-report`).

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md` before mutating run-record state.
