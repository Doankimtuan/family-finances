# AI Operating System (AIOS)

Framework-only control plane for multi-role AI work.

**Phase:** Framework + Core Engine (`v0.3.1`)  
**Scope:** architecture, contracts, schemas, templates, registries, policies, role definitions, **Core Engine** (`ai-os/core`)  
**Out of scope:** workers, skill implementations, executable runners

## What this is

AIOS defines how work is planned, orchestrated, executed, validated, and reviewed — via typed artifacts, shared schemas, and explicit dependencies.

The **Core Engine** (`ai-os/core`) is the production TypeScript control plane: planner, orchestrator, artifact store, memory, knowledge. It does **not** run workers.

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
| `contracts/` | Cross-role + worker port + Cursor bridge |
| `runtime/` | Run mounts (gitignored) |
| `skills/` `validators/` `reviewers/` | Empty package roots |
| `workers/` | Deferred — docs only |

## Start here

1. [AGENTS.md](AGENTS.md)
2. [core/README.md](core/README.md) — Core Engine API
3. [architecture/OVERVIEW.md](architecture/OVERVIEW.md)
4. [architecture/MIGRATIONS.md](architecture/MIGRATIONS.md)

## Non-negotiables

1. Artifacts over chat (`art_…` only)
2. Shared `$defs` — never re-inline enums
3. Registry-open artifact types
4. Validate then review
5. No workers in this phase
6. Canonical `payload.*` paths only
7. Core Engine never invokes skills/workers
