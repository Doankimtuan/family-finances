# AIOS Agent Entry Contract

Read this before contributing to or operating within AIOS.

## Mission boundaries

| Allowed now | Forbidden now |
|-------------|----------------|
| Maintain Discovery Workers (`workers/discover-*`) | Implement **Feature Workers** |
| Maintain Product RE Workers (`pipelines/product-re/`) | Skill bodies that mutate the product repo |
| Extend reserved skills/validators/reviewers for discovery + product-re | Bypass validation/review gates |
| Load/validate pipelines via KnowledgeBase | Invoke/claim workers from Core |
| Use / extend Core Engine (`ai-os/core`) | Re-inline enums already in common schemas |
| Extend architecture docs | Mix validator/reviewer logic into skills |
| Add/adjust JSON + Zod schemas via common defs | Raise side effects above `runtime-write` |
| Add templates & registry entries | Register package paths that do not exist on disk |
| Clarify role charters | Treat `architecture/` as product architecture input |

## Core Engine

Import: `@/ai-os/core` → `createAiosCore()`.

Modules: `planner`, `orchestrator`, `artifacts`, `memory`, `knowledge`, `schemas`, `templates`, `configs`.

Smoke: `npm run aios:core:smoke` · Discovery: `npm run aios:discovery:smoke` · Product RE: `npm run aios:product-re:smoke`

## Role selection

| Goal | Role |
|------|------|
| Decompose a goal into tasks + deps | `planner` |
| Coordinate lifecycle / gates / retries | `orchestrator` |
| Produce a discovery artifact from a task | `executor` via Discovery Workers |
| Reverse-engineer product knowledge | `executor` via Product RE Workers |
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

## Product RE path rule

- Consume product architecture from `product-architecture/` only.
- Never treat `architecture/` (AIOS OVERVIEW / TRACEABILITY / CONCURRENCY) as product input.

## Framework version

Current: see `VERSION`. Schema `$id` base: `https://aios.dev/schemas/`. Breaking contract changes require `architecture/MIGRATIONS.md` entry.
