---
name: validation-reporter
description: Generate validation summary, severity-ranked issues, recommended fixes, and PASS/FAIL decision. Machine-readable only.
---

# Validation Reporter

> Never modify source artifacts. Never invent missing information. Report structured findings only. Packaging only — do not execute unless a later phase opens execute.

## Consumes

`schemas/`, `artifacts/` (soft), `workers/`, `pipelines/`, `execution/` (soft), `templates/`, `knowledge/` (soft)

## Produces

`reports/` → `validation-report`

## Ownership

- **Owns:** summary, critical, high, medium, low…
- **Does not:** mutate sources; invent gaps; run business workers

## Procedure

1. Load declared consume paths (honor partial/incremental scopes).
2. Evaluate rules; emit entries with full validation fields.
3. Mark unknowns `UNKNOWN: …`.
4. Write `validation-report` under produce folder(s) only.
5. Stop for validation/review.

## Heuristics

- Prefer path/schema evidence.
- Fail closed on orphans / critical contract breaks.
- Partial runs must emit unknowns for skipped targets.

## Done when

- ≥1 structured entry with full validation fields
- No source mutation; no invented missing info

## Negative examples

- Do not rewrite schemas/workers to “fix” findings.
- Do not fabricate traceability.

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md` before mutating run-record state.
