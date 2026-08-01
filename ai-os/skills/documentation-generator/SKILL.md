---
name: documentation-generator
description: Generate architecture docs, usage guides, developer guides, migration guides, changelogs, release notes for generated components.
---

# Documentation Generator

> Configuration-driven scaffold planning only. Never mutate existing workers. Never execute generation.

## Consumes

`templates/`, `schemas/`, `workers/`, `validators/`, `reviewers/`, `pipelines/`, `knowledge/`, `configs/`, `artifacts/`, `registry/`

## Produces

`framework-generator/generators/documentation-generator/` → `framework-generation` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `architecture-doc` | Rule for `architecture-doc` per RACI |
| `usage-guide` | Rule for `usage-guide` per RACI |
| `example-doc` | Rule for `example-doc` per RACI |
| `developer-guide` | Rule for `developer-guide` per RACI |
| `migration-guide` | Rule for `migration-guide` per RACI |
| `changelog` | Rule for `changelog` per RACI |
| `release-notes` | Rule for `release-notes` per RACI |

See `pipelines/framework-generator/RACI.md` and `contracts/framework-generator.md` overlap table.

## Procedure

1. Require worker/pipeline ids from spec evidence paths.
2. Plan architecture-doc, usage-guide, developer-guide, migration-guide, changelog, release-notes entries.
3. Migration entries must reference semver bump + `architecture/MIGRATIONS.md` row template.
4. example-doc points to `examples/` not duplicate worker-generator scaffold.
5. Never plan validator/reviewer specs.

## Heuristics

- Reuse `templates/` packs; never duplicate template file contents in plans.
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
