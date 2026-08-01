# AIOS Overview

## System model

```
Goal (art_…)
   │
   ▼
Orchestrator ──► Planner ──► Plan + Task artifacts + Dependency graph
    │
    ├─ Discovery Workers ──► discovery-report (ready)
    │
    └─ Product RE Workers ──► knowledge/features/business/product-architecture
                              → product/workflow/requirements/acceptance
                                         ▲
                                         │
          Core loads/validates registries/pipelines
          (does not invoke workers yet)

Validator ──► Reviewer ──► Quality gate ──► publish | hold | retry | replan | abort | escalate
```

Workers are contracted (`contracts/worker-port.md`). **Discovery Workers** live under `workers/discover-*` + `pipelines/discovery/`. **Product RE Workers** live under `pipelines/product-re/` (still `worker_class: discovery`). **Feature Workers are not implemented**. Core Engine **loads and validates** pipelines; it does not claim/run workers.

## Core objects

All durable objects are **artifacts** (`art_…` + `type`).

| Type | Producer |
|------|----------|
| `goal` | human / orchestrator |
| `plan` | planner |
| `task` | planner |
| `dependency-graph` | planner / orchestrator |
| `discovery-report` | Discovery Workers |
| `knowledge-notes` / `feature-inventory` / `business-rules` / `product-architecture-notes` | Product RE ingest |
| `product-model` / `workflow-model` / `requirement-spec` / `acceptance-criteria` | Product RE transforms |
| `product-re-gap` | Product RE gap synthesizer |
| `run-record` | executor / orchestrator |
| `validation-report` | validator |
| `review-report` | reviewer |
| `quality-gate` | orchestrator |
| `orchestration-state` | orchestrator |
| `plan-decision` | orchestrator |
| `escalation` | orchestrator |

## Planes

| Plane | Contents |
|-------|----------|
| Control | orchestration, plans, tasks, runs, gates, decisions |
| Data | artifacts, dependency graphs, registries |
| Capability | skills, validators, reviewers (discovery + product-re reserved stubs) |
| Policy | `policies/gate-profiles.json` |
| Execution | Discovery + Product RE Worker packages; Feature Workers deferred |
| Pipelines | `pipelines/discovery/`, `pipelines/product-re/` |

## Design principles

1. Declarative first — manifests and schemas before code.
2. Artifact-native — chat is ephemeral.
3. Dependency-explicit — predecessor/successor edges only.
4. Gate separation — validators then reviewers.
5. Shared defs — `common.schema.json` is the only enum source.
6. Registry-open types — extend via `artifact-types` entries, not closed enums.
7. No hidden workers — workers must be registered; Feature Workers forbidden.
8. Registry paths must exist on disk (or must not be registered).
9. Product architecture inputs use `product-architecture/`, never AIOS `architecture/`.

## Cursor skills vs AIOS skills

See `contracts/cursor-bridge.md`.

## Versioning

- Framework: `VERSION` (now `0.4.2`)
- Release notes: `RELEASE_NOTES_0.4.2.md`
- Core Engine: `ai-os/core/` (planner, orchestrator, artifacts, memory, knowledge)
- Breaking changes: `architecture/MIGRATIONS.md`
- Packages: semver in manifests
- Artifacts: monotonic `artifact_version`
