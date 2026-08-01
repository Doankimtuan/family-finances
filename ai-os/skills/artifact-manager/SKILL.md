---
name: artifact-manager
description: Track generated artifacts, versions, lifecycle, ownership, and dependencies during runtime. Never invent business artifacts.
---

# Artifact Manager

> Orchestrate only. Never modify core/packages/workers/validators/reviewers. Never execute in packaging milestone. Never analyze product repos.

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/` (alias `pipeline/`), `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`, `core/packages/registry/`

## Produces

`runtime/execution/artifact-manager/` → `runtime-status` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `artifact-track` | Owned per RACI |
| `artifact-version` | Owned per RACI |
| `artifact-lifecycle` | Owned per RACI |
| `artifact-ownership` | Owned per RACI |
| `artifact-dependency` | Owned per RACI |

See `core/packages/pipelines/runtime-engine/RACI.md`.

## Procedure

1. Index planned/generated artifact refs from context (paths only).
2. Track version, lifecycle, ownership, dependency edges.
3. Never invent artifacts/product/business artifacts; orchestration metadata only.
4. Five entry_kinds required.
5. Partition under `runtime/execution/artifact-manager/`.

## Heuristics

- Prefer core/packages/registry/path evidence; mark gaps `UNKNOWN: …`.
- Deterministic plans; reproducible given same config + command.
- Single-command UX: never require users to invoke workers by id.
- Respect RACI; never duplicate another runtime worker's kinds.

## Done when

- All owned entry_kinds represented (or explicit UNKNOWN)
- Full payload fields + valid `folder_mirror`
- No worker/validator/reviewer mutation; no execution in packaging

## Negative examples

- Do not modify `core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/` implementations.
- Do not analyze product repositories or invent business specs.
- Do not execute pipelines in packaging milestone.
- Do not bypass Execution Planner for immediate execution.
