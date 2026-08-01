# AI Operating System (AIOS)

Control plane for multi-role AI work.

**Phase:** Framework + Core Engine + Discovery Worker packages (`v0.4.1`)  
**Scope:** architecture, contracts, schemas, templates, registries, policies, role definitions, Core Engine, **Discovery Worker packages** + reserved discovery skills/validators/reviewers, pipeline registration  
**Out of scope:** Feature Workers, executable worker runtimes that claim/run tasks, skill bodies that mutate the product repo

## What this is

AIOS defines how work is planned, orchestrated, executed, validated, and reviewed — via typed artifacts, shared schemas, and explicit dependencies.

The **Core Engine** (`ai-os/core`) is the production TypeScript control plane: planner, orchestrator, artifact store, memory, knowledge. It **loads and validates** Discovery registries/pipelines; it does **not** invoke workers.

## Quick map

| Path | Purpose |
|------|---------|
| `core/` | **Core Engine** (planner, orchestrator, artifacts, memory, knowledge) |
| `architecture/` | Canonical design docs |
| `schemas/` | JSON Schema contracts (`common.schema.json` = shared defs) |
| `templates/` | Copy-from starters (`payload.*` canonical) |
| `policies/` | Gate profile data |
| `registry/` | `entries` maps keyed by id |
| `roles/` | Role charters |
| `contracts/` | Cross-role + worker port + pipeline + Cursor bridge |
| `runtime/` | Run mounts (gitignored) |
| `skills/` `validators/` `reviewers/` | Packages (discovery reserved stubs present) |
| `workers/` | **Discovery Workers only** (`discover-*`); Feature Workers forbidden |
| `pipelines/` | Registered worker pipelines (`discovery/`) |

## Start here

1. [AGENTS.md](AGENTS.md)
2. [core/README.md](core/README.md) — Core Engine API
3. [architecture/OVERVIEW.md](architecture/OVERVIEW.md)
4. [architecture/MIGRATIONS.md](architecture/MIGRATIONS.md)
5. [pipelines/discovery/](pipelines/discovery/) — Discovery pipeline

## Non-negotiables

1. Artifacts over chat (`art_…` only)
2. Shared `$defs` — never re-inline enums
3. Registry-open artifact types
4. Validate then review
5. **Discovery Workers only** — Feature Workers forbidden; no undeclared workers
6. Canonical `payload.*` paths only
7. Core Engine never **invokes** skills/workers (load/validate registries and pipelines only)
