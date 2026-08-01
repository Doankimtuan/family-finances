---
name: validation-reporter
description: Emit severity-ranked validation-report with summary + PASS/FAIL decision. Machine-readable only. Never modify artifacts.
---

# Validation Reporter

> Never modify source artifacts. Never invent missing information. Report structured findings only. Packaging only — do not execute unless a later phase opens execute.

## Consumes

`core/packages/schemas/`, `artifacts/` (soft), `core/packages/workers/`, `core/packages/pipelines/`, `artifacts/execution/` (soft), `core/packages/templates/`, `artifacts/knowledge/` (soft), `artifacts/validation/`, `artifacts/scores/`

## Produces

`artifacts/reports/` → `validation-report` (worker report; gates emit `gate-validation-report`)

## Ownership

### Owns
- `summary`, `critical`, `high`, `medium`, `low`, `recommended-fix`, `decision`

**PASS/FAIL rule:** `decision` is **FAIL** if any merged finding has `result=fail` and `severity=critical`; else **PASS** (warn/high may still be listed). Machine-readable only.

**Does not:** mutate sources; invent fixes — recommendations point at remediating upstream packages.

## Procedure

1. Read orchestrator `validation-status` + `artifacts/scores/` + finding partitions as evidence.
2. Emit all report kinds: summary, critical, high, medium, low, recommended-fix, decision.
3. Apply PASS/FAIL rule. Write under `artifacts/reports/`.

## Heuristics

- Prefer path/schema evidence; fail closed on critical contract breaks.
- Partial runs must emit unknowns for skipped targets.
- Respect RACI — do not duplicate another validator's kinds.
- `result` is authoritative; never use entry_kind `pass`/`fail`.

## Done when

- All 7 report kinds present; decision applies PASS/FAIL rule
- No invented fixes

## Negative examples

- Do not rewrite core/packages/schemas/workers/packs to “fix” findings.
- Do not fabricate traceability or invent missing documents.
- Do not write findings outside `artifacts/validation/<worker_id>/` partition.
- Do not emit gate-shaped `gate-validation-report` from this worker (reporter emits `validation-report`).

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md` before mutating run-record state.
