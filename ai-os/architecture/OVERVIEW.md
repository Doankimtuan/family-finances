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
    ├─ Product RE Workers ──► product knowledge chain
    │
    └─ Solution Architecture Workers ──► architecture-v2 / tech-stack / migration / folder-structure
         │
         └─ Specification Engineering Workers ──► specifications / tasks / roadmap / implementation
                                                  (packaged; not invoked yet)
              │
              └─ Validation Engine Workers ──► validation / scores / reports
                                               (packaged; never mutate sources; not invoked yet)
                                         ▲
                                         │
          Core loads/validates registries/pipelines
          (does not invoke workers yet)

Validator ──► Reviewer ──► Quality gate ──► publish | hold | retry | replan | abort | escalate
```

Workers are contracted (`contracts/worker-port.md`). **Discovery**, **Product RE**, **Solution Architecture**, and **Specification Engineering** packages use `worker_class: discovery`. **Feature Workers are not implemented**. Core Engine **loads and validates** pipelines; it does not claim/run workers.

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
| `project-specification` / `engineering-task-graph` / `delivery-roadmap` / `implementation-plan` | Specification Engineering (packaged) |
| `validation-finding` / `validation-status` / `quality-scores` / `validation-report` | Validation Engine (packaged) |
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
| Capability | skills, validators, reviewers (registered pipeline stubs) |
| Policy | `policies/gate-profiles.json` |
| Execution | Discovery + Product RE + SA + Spec Eng packages; Feature Workers deferred |
| Pipelines | `pipelines/discovery/`, `pipelines/product-re/`, `pipelines/solution-architecture/`, `pipelines/specification-engineering/`, `pipelines/validation-engine/` |

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

- Framework: `VERSION` (now `0.7.0`)
- Release notes: `RELEASE_NOTES_0.7.0.md` (Validation Engine packaged); see also `MIGRATIONS.md`
- Core Engine: `ai-os/core/` (planner, orchestrator, artifacts, memory, knowledge)
- Breaking changes: `architecture/MIGRATIONS.md`
- Packages: semver in manifests
- Artifacts: monotonic `artifact_version`
