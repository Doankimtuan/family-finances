# Naming Conventions

## General

| Element | Convention | Example |
|---------|------------|---------|
| Package IDs | `kebab-case`, ≤ 64 chars | `review-ui-a11y` |
| File stems | `kebab-case` or `SCREAMING` role docs | `quality-gate.schema.json`, `SKILL.md` |
| JSON fields | `snake_case` | `artifact_id` |
| Enums | `kebab-case` strings | `skill-output` |
| Markdown headers | Sentence case | `## Dependency kinds` |

## Identity (single model)

**All durable objects use `art_` IDs.** Type is `meta.type`, never the ID prefix.

| Concept | How it is identified |
|---------|----------------------|
| Goal, plan, task, run, validation, review, orchestration, gate | `artifact_id` = `art_…` + `type` |
| Skill / validator / reviewer packages | `kebab-case` package id in registry `entries` |
| Trace fields (`goal_id`, `plan_id`, `task_id`, `run_id`, `orchestration_id`) | Also `art_…` (aliases into the same ID space) |

Do **not** invent `goal_`, `plan_`, `task_`, `run_`, `val_`, `rev_`, or `orc_` prefixes for durable IDs.

Prefer ULID/UUID after `art_`. Human-readable kebab slugs after `art_` are allowed for curated seeds only. Collision policy: first writer wins; supersede via new `artifact_version` or new `artifact_id`.

## Status enums (disjoint — do not mix)

| Enum | Values | Used by |
|------|--------|---------|
| `ArtifactStatus` | `draft` \| `ready` \| `published` \| `superseded` \| `archived` | artifact meta, plan payload status |
| `TaskStatus` | `pending` \| `ready` \| `running` \| `succeeded` \| `failed` \| `blocked` \| `cancelled` | task payload |
| `RunStatus` | `pending` \| `claimed` \| `running` \| `succeeded` \| `failed` \| `cancelled` | run-record |
| `OrchestrationStatus` | `idle`…`superseded` | orchestration-state |
| `PackageStatus` | `reserved` \| `draft` \| `active` \| `deprecated` | manifests / registry |
| `GateResult` | `pass` \| `fail` \| `warn` \| `skip` | validations, reviews, gates |

Canonical defs: `core/packages/schemas/common.schema.json` `$defs`. Never re-inline.

## Payload paths

Canonical only:

`payload.json` | `payload.md` | `payload.patch` | `payload.bin`

Optional human companion: `ARTIFACT.md` / `PLAN.md` / etc. — **never** referenced by `meta.payload.path`.

## Schema `$id` base

```
https://aios.dev/schemas/<concept>.schema.json
```

## Registry shape

Registries are maps under `entries`, keyed by id (not arrays):

```json
{ "registry_kind": "skills", "entries": { "my-skill": { "id": "my-skill", ... } } }
```

## Control decisions (unified)

`continue` | `retry` | `replan` | `abort` | `escalate` | `publish` | `hold`

## Severity

`critical` | `high` | `medium` | `low` | `info`
