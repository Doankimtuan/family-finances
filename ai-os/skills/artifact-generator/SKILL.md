---
name: artifact-generator
description: Generate artifact definitions: folder structure, contracts, naming rules, lifecycle, dependencies, versioning, retention policy.
---

# Artifact Generator

> Configuration-driven scaffold planning only. Never mutate existing workers. Never execute generation.

## Consumes

`templates/`, `schemas/`, `workers/`, `validators/`, `reviewers/`, `pipelines/`, `knowledge/`, `configs/`, `artifacts/`, `registry/`

## Produces

`framework-generator/generators/artifact-generator/` → `framework-generation` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `artifact-contract` | Rule for `artifact-contract` per RACI |
| `folder-structure` | Rule for `folder-structure` per RACI |
| `naming-rules` | Rule for `naming-rules` per RACI |
| `lifecycle` | Rule for `lifecycle` per RACI |
| `retention-policy` | Rule for `retention-policy` per RACI |

See `pipelines/framework-generator/RACI.md` and `contracts/framework-generator.md` overlap table.

## Procedure

1. Require upstream `schema-generator` plans or `schemas/` refs in evidence.
2. Plan artifact-contract + folder-structure from `templates/artifact/`.
3. Derive naming-rules from `architecture/TRACEABILITY.md` + registry conventions.
4. Document lifecycle, retention-policy with semver + deprecation in `output_plan.migration`.
5. Never plan JSON Schema field typing (owned by schema-generator).

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
