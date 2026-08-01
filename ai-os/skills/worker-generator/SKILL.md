---
name: worker-generator
description: Generate Worker package skeleton (README, skill, manifest, examples pointers) from capability specs. Does NOT generate validators, reviewers, tests, or docs — see overlap table in core/packages/contracts/framework-generator.md.
---

# Worker Generator

> Configuration-driven scaffold planning only. Never mutate existing workers. Never execute generation.

## Consumes

`core/packages/templates/`, `core/packages/schemas/`, `core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/knowledge/`, `core/packages/configs/`, `artifacts/`, `core/packages/registry/`

## Produces

`core/packages/scaffold/generators/worker-generator/` → `framework-generation` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `worker-package` | Rule for `worker-package` per RACI |
| `worker-readme` | Rule for `worker-readme` per RACI |
| `worker-skill` | Rule for `worker-skill` per RACI |
| `worker-manifest` | Rule for `worker-manifest` per RACI |

See `core/packages/pipelines/framework-generator/RACI.md` and `core/packages/contracts/framework-generator.md` overlap table.

## Procedure

1. Copy plan from `core/packages/templates/worker/` layout (README, skill.md, manifest.json, examples/, testcases/).
2. Map spec.outputs.worker_id → kebab-case; validate against `core/packages/schemas/worker-manifest.schema.json`.
3. Plan worker-package + worker-readme + worker-skill + worker-manifest entries only.
4. Do NOT plan validator.md, reviewer.md, tests, or release docs (other generators own those).
5. `output_plan.registries`: workers + skills only (registration patches owned by bootstrap).

## Heuristics

- Reuse `core/packages/templates/` packs; never duplicate template file contents in plans.
- Every `output_plan` requires `artifacts`, `registries`, `semver`; add `migration` when breaking.
- Mark skipped modes `UNKNOWN: …`; never invent spec fields.
- Dedupe key for orchestrator: `generation_id` + `entry_kind`.

## Done when

- All owned entry_kinds represented (or explicit UNKNOWN per mode)
- Full payload fields + valid `folder_mirror`
- No source mutation; `execute_generation` remains false

## Negative examples

- Do not modify prior sprint workers or registries on disk.
- Do not create project-specific business workers.
- Do not emit kinds owned by another generator (RACI violation).
