---
name: retry-engine
description: Plan retries for failed workers/phases/validation/review with updated context and retry limits from runtime config.
---

# Retry Engine

> Orchestrate only. Never modify workers/validators/reviewers. Never execute in packaging milestone. Never analyze product repos.

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/` (alias `pipeline/`), `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`, `registry/`

## Produces

`runtime/execution/retry-engine/` → `runtime-status` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `retry-worker` | Owned per RACI |
| `retry-phase` | Owned per RACI |
| `retry-validation` | Owned per RACI |
| `retry-review` | Owned per RACI |
| `retry-updated-context` | Owned per RACI |
| `retry-limits` | Owned per RACI |

See `pipelines/runtime-engine/RACI.md`.

## Procedure

1. Read maxRetry from normalized-config.
2. Plan retry-worker / retry-phase / retry-validation / retry-review.
3. retry-updated-context must reference checkpoint + failure log evidence.
4. Exceeding retry-limits → fail to master-orchestrator handle-failure.
5. Six entry_kinds required.

## Heuristics

- Prefer registry/path evidence; mark gaps `UNKNOWN: …`.
- Deterministic plans; reproducible given same config + command.
- Single-command UX: never require users to invoke workers by id.
- Respect RACI; never duplicate another runtime worker's kinds.

## Done when

- All owned entry_kinds represented (or explicit UNKNOWN)
- Full payload fields + valid `folder_mirror`
- No worker/validator/reviewer mutation; no execution in packaging

## Negative examples

- Do not modify `workers/`, `validators/`, `reviewers/` implementations.
- Do not analyze product repositories or invent business specs.
- Do not execute pipelines in packaging milestone.
- Do not bypass Execution Planner for immediate execution.
