# AIOS Agent Entry Contract

Read this before contributing to or operating within AIOS.

## Mission boundaries

| Allowed now | Forbidden now |
|-------------|----------------|
| Maintain Discovery Workers (`workers/discover-*`) | Implement **Feature Workers** |
| Maintain Product RE Workers (`pipelines/product-re/`) | Skill bodies that mutate the product repo |
| Maintain Solution Architecture Workers (`pipelines/solution-architecture/`) | Invent business logic / change business rules |
| Maintain Specification Engineering Workers (`pipelines/specification-engineering/`) | Redesign the system / invent requirements |
| Maintain Validation Engine Workers (`pipelines/validation-engine/`) | Mutate source artifacts / invent missing info / execute validations in packaging milestone |
| Maintain Review Engine Workers (`pipelines/review-engine/`) | Mutate sources / regenerate outputs / validate schemas / execute reviews in packaging milestone |
| Maintain Framework Generator Workers (`pipelines/framework-generator/`) | Execute generation / mutate prior workers / create project-specific workers in packaging milestone |
| Maintain Qualification Framework Workers (`pipelines/qualification-framework/`) | Execute benchmarks / modify framework / regenerate workers / invent ground truth in packaging milestone |
| Extend reserved skills/validators/reviewers for registered pipelines | Bypass validation/review gates |
| Load/validate pipelines via KnowledgeBase | Invoke/claim workers from Core |
| Use / extend Core Engine (`ai-os/core`) | Re-inline enums already in common schemas |
| Extend architecture docs | Mix validator/reviewer logic into skills |
| Add/adjust JSON + Zod schemas via common defs | Raise side effects above `runtime-write` |
| Add templates & registry entries | Register package paths that do not exist on disk |
| Clarify role charters | Treat `architecture/` as product architecture input |
| | Overwrite discovery / Product RE artifacts |

## Core Engine

Import: `@/ai-os/core` → `createAiosCore()`.

Modules: `planner`, `orchestrator`, `artifacts`, `memory`, `knowledge`, `schemas`, `templates`, `configs`.

Smoke: `npm run aios:core:smoke` · Discovery: `npm run aios:discovery:smoke` · Product RE: `npm run aios:product-re:smoke` · Solution Architecture: `npm run aios:solution-architecture:smoke` · Specification Engineering: `npm run aios:specification-engineering:smoke` · Validation Engine: `npm run aios:validation-engine:smoke` · Review Engine: `npm run aios:review-engine:smoke` · Framework Generator: `npm run aios:framework-generator:smoke` · Qualification Framework: `npm run aios:qualification-framework:smoke`

## Role selection

| Goal | Role |
|------|------|
| Decompose a goal into tasks + deps | `planner` |
| Coordinate lifecycle / gates / retries | `orchestrator` |
| Produce a discovery artifact from a task | `executor` via Discovery Workers |
| Reverse-engineer product knowledge | `executor` via Product RE Workers |
| Redesign solution architecture (preserve behavior) | `executor` via Solution Architecture Workers |
| Produce specs / tasks / roadmap / implementation plan | `executor` via Specification Engineering Workers (packaged; not invoked yet) |
| Automatically validate AIOS artifacts | `executor` via Validation Engine Workers (packaged; not invoked yet) |
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

## Path rules

- Product architecture observations: `product-architecture/` (logical consume name `architecture/` for Solution Architecture).
- Never treat AIOS `architecture/` (OVERVIEW / TRACEABILITY / CONCURRENCY) as product architecture input.
- Solution Architecture produces under `redesign/`, `architecture-v2/`, `tech-stack/`, `migration/`, `folder-structure/`, `decision-records/`.

## Framework version

Current: see `VERSION`. Schema `$id` base: `https://aios.dev/schemas/`. Breaking contract changes require `architecture/MIGRATIONS.md` entry.
