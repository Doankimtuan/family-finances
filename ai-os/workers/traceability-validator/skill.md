---
name: traceability-validator
description: Verify every artifact traces to features, business rules, architecture, requirements, knowledge. Reject orphans. Never modify artifacts.
---

# Traceability Validator

> Never modify source artifacts. Never invent missing information. Report structured findings only. Packaging only — do not execute unless a later phase opens execute.

## Consumes

`schemas/`, `artifacts/` (soft), `workers/`, `pipelines/`, `execution/` (soft), `templates/`, `knowledge/` (soft), `registry/`, `features/` (soft), `business/` (soft), `requirements/` (soft), `acceptance/` (soft), `product-architecture/` (soft), `architecture-v2/` (soft), `specifications/` (soft)

## Produces

`validation/traceability-validator/` → `validation-finding` (required `folder_mirror`: `validation/traceability-validator/…`)

## Ownership

### Rule catalog (owns)
| Kind | Rule |
|------|------|
| feature-trace | Feature claims → features/ |
| business-rule-trace | Business claims → business/ |
| architecture-trace | Arch claims → product-architecture/ or architecture-v2/ |
| requirement-trace | Req claims → requirements/ or acceptance/ |
| knowledge-trace | Knowledge claims → knowledge/ |
| orphan | No upstream pointer → **fail** orphan (critical)

**Does not own:** missing-document inventory (completeness-validator).

## Procedure

1. Load declared consume paths (honor `extensions.partial` / `incremental` + `validation_scope`).
2. Evaluate **only** owned rule kinds (RACI); skip others.
3. Emit entries with full fields + `folder_mirror` under `validation/traceability-validator/`.
4. Mark gaps `UNKNOWN: …`. Never mutate sources.
5. Stop for validation/review (`validators/validation-engine-schema-check` → `gate-validation-report`).

## Heuristics

- Prefer path/schema evidence; fail closed on critical contract breaks.
- Partial runs must emit unknowns for skipped targets.
- Respect RACI — do not duplicate another validator's kinds.
- `result` is authoritative; never use entry_kind `pass`/`fail`.

- Orphans without upstream pointer → `result=fail`, `severity=critical`, kind `orphan`.

## Done when

- ≥1 structured entry covering owned kinds (or explicit skip/UNKNOWN for scoped runs)
- Every entry has full fields + `folder_mirror` matching `validation/traceability-validator/`
- No source mutation; no invented missing info; RACI respected

## Negative examples

- Do not rewrite schemas/workers/packs to “fix” findings.
- Do not fabricate traceability or invent missing documents.
- Do not write findings outside `validation/<worker_id>/` partition.
- Do not emit gate-shaped `gate-validation-report` from this worker (reporter emits `validation-report`).

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md` before mutating run-record state.
