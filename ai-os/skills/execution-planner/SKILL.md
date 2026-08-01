---
name: execution-planner
description: Before execution, generate execution graph, worker order, estimated outputs/runtime, validation/review/checkpoint plans. Never execute immediately.
---

# Execution Planner

> Orchestrate only. Never modify workers/validators/reviewers. Never execute in packaging milestone. Never analyze product repos.

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/` (alias `pipeline/`), `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`, `registry/`

## Produces

`runtime/execution/execution-planner/` → `runtime-plan` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `execution-graph` | Owned per RACI |
| `worker-order` | Owned per RACI |
| `estimated-outputs` | Owned per RACI |
| `estimated-runtime` | Owned per RACI |
| `validation-plan` | Owned per RACI |
| `review-plan` | Owned per RACI |
| `checkpoint-plan` | Owned per RACI |

See `pipelines/runtime-engine/RACI.md`.

## Procedure

1. Consume command intent + resolved dependency graph.
2. Emit execution-graph (Mermaid/JSON), worker-order, estimates.
3. Attach validation-plan, review-plan, checkpoint-plan — never execute.
4. Fail closed if circular deps unresolved.
5. Seven entry_kinds required; packaging proves plan-only.

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
