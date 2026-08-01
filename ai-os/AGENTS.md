# AIOS Agent Entry Contract

Read this before contributing to or operating within AIOS.

## Mission boundaries

| Allowed now | Forbidden now |
|-------------|----------------|
| Use / extend Core Engine (`ai-os/core`) | Implement workers |
| Extend architecture docs | Skill bodies that mutate the product repo |
| Add/adjust JSON + Zod schemas via common defs | Re-inline enums already in common schemas |
| Add templates & registry entries | Bypass validation/review gates |
| Clarify role charters | Mix validator/reviewer logic into skills |

## Core Engine

Import: `@/ai-os/core` → `createAiosCore()`.

Modules: `planner`, `orchestrator`, `artifacts`, `memory`, `knowledge`, `schemas`, `templates`, `configs`.

Smoke: `npm run aios:core:smoke`

## Role selection

| Goal | Role |
|------|------|
| Decompose a goal into tasks + deps | `planner` |
| Coordinate lifecycle / gates / retries | `orchestrator` |
| Produce a work artifact from a task | `executor` (future workers) |
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
