---
name: runtime-configuration-loader
description: Load .ai-os.yaml, run.yaml, workspace.yaml, environment variables, and defaults into a normalized runtime config. Never execute workers.
---

# Runtime Configuration Loader

> Orchestrate only. Never modify core/packages/workers/validators/reviewers. Never execute in packaging milestone. Never analyze product repos.

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/` (alias `pipeline/`), `artifacts/workflow/`, `core/packages/templates/`, `core/packages/schemas/`, `core/packages/configs/`, `artifacts/`, `artifacts/knowledge/`, `core/packages/registry/`

## Produces

`runtime/configs/runtime-configuration-loader/` → `runtime-status` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `aios-yaml` | Owned per RACI |
| `run-yaml` | Owned per RACI |
| `workspace-yaml` | Owned per RACI |
| `env-vars` | Owned per RACI |
| `defaults` | Owned per RACI |
| `normalized-config` | Owned per RACI |

See `core/packages/pipelines/runtime-engine/RACI.md`.

## Procedure

1. Locate `.ai-os.yaml`, `run.yaml`, `workspace.yaml` under project root / `runtime/configs/`.
2. Merge env vars over file config over defaults; emit normalized-config.
3. Validate keys: mode, entry, projectRoot, output, resume, validation, review, freezeEachPhase, parallelWorkers, maxRetry, logging.
4. Never execute workers; never mutate prior sprint packages.
5. All six entry_kinds required or UNKNOWN.

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
