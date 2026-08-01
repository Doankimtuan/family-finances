# AI Operating System (AIOS)

Control plane for multi-role AI work.

**Phase:** Framework + Core Engine + Discovery + Product RE packages (`v0.4.2`)  
**Scope:** architecture, contracts, schemas, templates, registries, policies, role definitions, Core Engine, Discovery Workers, **Product RE Workers** + reserved skills/validators/reviewers, pipeline registration  
**Out of scope:** Feature Workers, executable worker runtimes that claim/run tasks, skill bodies that mutate the product repo

## What this is

AIOS defines how work is planned, orchestrated, executed, validated, and reviewed — via typed artifacts, shared schemas, and explicit dependencies.

The **Core Engine** (`ai-os/core`) is the production TypeScript control plane: planner, orchestrator, artifact store, memory, knowledge. It **loads and validates** registries/pipelines; it does **not** invoke workers.

## Quick map

| Path | Purpose |
|------|---------|
| `core/` | **Core Engine** (planner, orchestrator, artifacts, memory, knowledge) |
| `architecture/` | AIOS control-plane design docs (not Product RE consume) |
| `product-architecture/` | Product RE consume: observed product architecture |
| `knowledge/` `features/` `business/` | Product RE consume (ingest) |
| `product/` `workflow/` `requirements/` `acceptance/` | Product RE produce |
| `schemas/` | JSON Schema contracts (`common.schema.json` = shared defs) |
| `templates/` | Copy-from starters (`payload.*` canonical) |
| `policies/` | Gate profile data |
| `registry/` | `entries` maps keyed by id |
| `roles/` | Role charters |
| `contracts/` | Cross-role + worker port + pipeline + Cursor bridge |
| `runtime/` | Run mounts (gitignored) |
| `skills/` `validators/` `reviewers/` | Packages (discovery + product-re reserved stubs) |
| `workers/` | Discovery + Product RE; Feature Workers forbidden |
| `pipelines/` | `discovery/`, `product-re/` |

## Start here

1. [AGENTS.md](AGENTS.md)
2. [core/README.md](core/README.md) — Core Engine API
3. [architecture/OVERVIEW.md](architecture/OVERVIEW.md)
4. [architecture/MIGRATIONS.md](architecture/MIGRATIONS.md)
5. [RELEASE_NOTES_0.4.2.md](RELEASE_NOTES_0.4.2.md)
6. [pipelines/discovery/](pipelines/discovery/) · [pipelines/product-re/](pipelines/product-re/)

## Non-negotiables

1. Artifacts over chat (`art_…` only)
2. Shared `$defs` — never re-inline enums
3. Registry-open artifact types
4. Validate then review
5. **No Feature Workers** — Discovery + Product RE only; no undeclared workers
6. Canonical `payload.*` paths only
7. Core Engine never **invokes** skills/workers (load/validate registries and pipelines only)
8. Product RE never treats `architecture/` as product architecture input
