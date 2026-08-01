---
name: reviewer-generator
description: Generate reviewer packages and rubrics for architecture, business, specification, quality, documentation, security, performance review.
---

# Reviewer Generator

> Configuration-driven scaffold planning only. Never mutate existing workers. Never execute generation.

## Consumes

`core/packages/templates/`, `core/packages/schemas/`, `core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/knowledge/`, `core/packages/configs/`, `artifacts/`, `core/packages/registry/`

## Produces

`core/packages/scaffold/generators/reviewer-generator/` → `framework-generation` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `architecture-review` | Rule for `architecture-review` per RACI |
| `business-review` | Rule for `business-review` per RACI |
| `specification-review` | Rule for `specification-review` per RACI |
| `quality-review` | Rule for `quality-review` per RACI |
| `documentation-review` | Rule for `documentation-review` per RACI |
| `security-review` | Rule for `security-review` per RACI |
| `performance-review` | Rule for `performance-review` per RACI |

See `core/packages/pipelines/framework-generator/RACI.md` and `core/packages/contracts/framework-generator.md` overlap table.

## Procedure

1. Require worker id + pipeline context from spec.
2. Plan `core/packages/reviewers/<id>/manifest.json` + `rubric/*.json` with criteria, weights, veto_conditions.
3. Seven review modes as separate entries; security/performance require explicit spec flags.
4. Rubric must reference `core/packages/schemas/reviewer-spec.schema.json`.
5. Never plan deterministic validator checks.

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
