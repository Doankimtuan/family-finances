# AI Operating System (AIOS)

Framework-only control plane for multi-role AI work.

**Phase:** Framework (`v0.2.0`)  
**Scope:** architecture, contracts, schemas, templates, registries, policies, role definitions  
**Out of scope:** workers, skill implementations, executable runners

## What this is

AIOS defines how work is planned, orchestrated, executed, validated, and reviewed — via typed artifacts, shared schemas, and explicit dependencies.

It does **not** run work. `runtime/` is a gitignored mount for future workers.

## Quick map

| Path | Purpose |
|------|---------|
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
2. [architecture/OVERVIEW.md](architecture/OVERVIEW.md)
3. [architecture/MIGRATIONS.md](architecture/MIGRATIONS.md) — 0.1.0 → 0.2.0 remediation
4. [architecture/TRACEABILITY.md](architecture/TRACEABILITY.md)

## Non-negotiables

1. Artifacts over chat (`art_…` only)
2. Shared `$defs` — never re-inline enums
3. Registry-open artifact types
4. Validate then review
5. No workers in this phase
6. Canonical `payload.*` paths only
