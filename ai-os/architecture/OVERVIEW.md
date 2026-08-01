# AIOS Overview

## System model

```
Goal (art_…)
   │
   ▼
Orchestrator ──► Planner ──► Plan + Task artifacts + Dependency graph
    │
    ▼
Discovery Worker packages (registered) ──► discovery-report (ready)
    │                                         ▲
    │                                         │
    └──── Core loads/validates registries ────┘
          (does not invoke workers yet)

Validator ──► Reviewer ──► Quality gate ──► publish | hold | retry | replan | abort | escalate
```

Workers are contracted (`contracts/worker-port.md`). **Discovery Workers** are packaged under `ai-os/workers/discover-*`, registered in `registry/workers.json`, and bound by `pipelines/discovery/`. **Feature Workers are not implemented** in this phase. Core Engine **loads and validates** pipelines; it does not claim/run workers.

## Core objects

All durable objects are **artifacts** (`art_…` + `type`).

| Type | Producer |
|------|----------|
| `goal` | human / orchestrator |
| `plan` | planner |
| `task` | planner |
| `dependency-graph` | planner / orchestrator |
| `discovery-report` | Discovery Workers (primary payload) |
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
| Capability | skills, validators, reviewers (discovery reserved stubs present) |
| Policy | `policies/gate-profiles.json` |
| Execution | Discovery Worker packages (`workers/discover-*`); Feature Workers deferred |
| Pipelines | `pipelines/discovery/` |

## Design principles

1. Declarative first — manifests and schemas before code.
2. Artifact-native — chat is ephemeral.
3. Dependency-explicit — predecessor/successor edges only.
4. Gate separation — validators then reviewers.
5. Shared defs — `common.schema.json` is the only enum source.
6. Registry-open types — extend via `artifact-types` entries, not closed enums.
7. No hidden workers — Discovery Workers must be registered; Feature Workers forbidden.
8. Registry paths must exist on disk (or must not be registered).

## Cursor skills vs AIOS skills

See `contracts/cursor-bridge.md`.

## Versioning

- Framework: `VERSION` (now `0.4.1`)
- Core Engine: `ai-os/core/` (planner, orchestrator, artifacts, memory, knowledge)
- Breaking changes: `architecture/MIGRATIONS.md`
- Packages: semver in manifests
- Artifacts: monotonic `artifact_version`
