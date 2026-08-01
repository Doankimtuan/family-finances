---
name: prompt-generator
description: Generate production-quality prompts for builder, reviewer, validator, improve, freeze, and execution roles.
---

# Prompt Generator

> Configuration-driven scaffold planning only. Never mutate existing workers. Never execute generation.

## Consumes

`templates/`, `schemas/`, `workers/`, `validators/`, `reviewers/`, `pipelines/`, `knowledge/`, `configs/`, `artifacts/`, `registry/`

## Produces

`framework-generator/generators/prompt-generator/` → `framework-generation` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `builder-prompt` | Rule for `builder-prompt` per RACI |
| `reviewer-prompt` | Rule for `reviewer-prompt` per RACI |
| `validator-prompt` | Rule for `validator-prompt` per RACI |
| `improve-prompt` | Rule for `improve-prompt` per RACI |
| `freeze-prompt` | Rule for `freeze-prompt` per RACI |
| `execution-prompt` | Rule for `execution-prompt` per RACI |

See `pipelines/framework-generator/RACI.md` and `contracts/framework-generator.md` overlap table.

## Procedure

1. Load role from spec (`builder` | `reviewer` | `validator` | `improve` | `freeze` | `execution`).
2. Bind prompt sections: ROLE, GOAL, INPUT, OUTPUT, STOP, NEGATIVE examples.
3. Reference `templates/skill/SKILL.md` structure for builder prompts only.
4. Emit all six prompt entry_kinds when spec.mode=full; else UNKNOWN for skipped roles.
5. Do not embed worker business logic — framework prompts only.

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
