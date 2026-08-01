---
name: test-generator
description: Generate testcases, validation cases, edge cases, regression tests, sample projects, acceptance tests for generated components.
---

# Test Generator

> Configuration-driven scaffold planning only. Never mutate existing workers. Never execute generation.

## Consumes

`core/packages/templates/`, `core/packages/schemas/`, `core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/knowledge/`, `core/packages/configs/`, `artifacts/`, `core/packages/registry/`

## Produces

`core/packages/scaffold/generators/test-generator/` → `framework-generation` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `test-case` | Rule for `test-case` per RACI |
| `validation-case` | Rule for `validation-case` per RACI |
| `edge-case` | Rule for `edge-case` per RACI |
| `regression-test` | Rule for `regression-test` per RACI |
| `sample-project` | Rule for `sample-project` per RACI |
| `acceptance-test` | Rule for `acceptance-test` per RACI |

See `core/packages/pipelines/framework-generator/RACI.md` and `core/packages/contracts/framework-generator.md` overlap table.

## Procedure

1. Bind to worker id from spec; load `core/packages/templates/worker/testcases/` as baseline.
2. Plan case-01..05 JSON fixtures with input spec + expected entry_kind + severity.
3. Cover happy path, missing spec, invalid schema ref, registry gap, budget exceed.
4. sample-project entry_kind plans minimal ai-os/ tree scaffold only.
5. Does not generate worker README or skills.

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
