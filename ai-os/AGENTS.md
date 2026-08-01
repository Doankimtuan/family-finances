# AIOS Agent Entry Contract

Read this before contributing to or operating within AIOS.

## Mission boundaries

| Allowed now | Forbidden now |
|-------------|----------------|
| Maintain Discovery Workers (`workers/discover-*`) | Implement **Feature Workers** |
| Extend reserved discovery skills/validators/reviewers | Skill bodies that mutate the product repo |
| Load/validate pipelines via KnowledgeBase | Invoke/claim workers from Core |
| Use / extend Core Engine (`ai-os/core`) | Bypass validation/review gates |
| Extend architecture docs | Re-inline enums already in common schemas |
| Add/adjust JSON + Zod schemas via common defs | Mix validator/reviewer logic into skills |
| Add templates & registry entries | Raise discovery side effects above `runtime-write` |
| Clarify role charters | Register package paths that do not exist on disk |

## Core Engine

Import: `@/ai-os/core` → `createAiosCore()`.

Modules: `planner`, `orchestrator`, `artifacts`, `memory`, `knowledge`, `schemas`, `templates`, `configs`.

Smoke: `npm run aios:core:smoke` · Discovery registration: `npm run aios:discovery:smoke`

## Role selection

| Goal | Role |
|------|------|
| Decompose a goal into tasks + deps | `planner` |
| Coordinate lifecycle / gates / retries | `orchestrator` |
| Produce a discovery artifact from a task | `executor` via Discovery Workers |
| Produce a product feature artifact | deferred Feature Workers |
| Run deterministic checks | `validator` |
| Apply qualitative judgment | `reviewer` |

## Status vocabulary (use the correct enum)

- **Artifacts / plans:** `draft` → `ready` → `published` → `superseded` → `archived`
- **Tasks:** `pending` \| `ready` \| `running` \| `succeeded` \| `failed` \| `blocked` \| `cancelled`
- **Runs:** `pending` \| `claimed` \| `running` \| `succeeded` \| `failed` \| `cancelled`
- **Orchestrations:** see `orchestrationStatus` in common schema
- **Gate results:** `pass` \| `fail` \| `warn` \| `skip`

Do not mix these enums.

## Artifact rule

Every meaningful step emits an artifact with:

- `meta.json` (`schemas/artifact.schema.json`)
- canonical `payload.*` path only
- `depends_on` declared
- `trace` filled when control-plane (see TRACEABILITY.md)

## Identity

Durable IDs are always `art_…`. Package IDs are kebab-case registry keys.

## Framework version

Current: see `VERSION`. Schema `$id` base: `https://aios.dev/schemas/`. Breaking contract changes require `architecture/MIGRATIONS.md` entry.
