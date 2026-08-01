# AIOS Overview

## System model

```
Goal (art_…)
   │
   ▼
Orchestrator ──► Planner ──► Plan + Task artifacts + Dependency graph
   │
   ▼
Executor (worker, future) ──► Output artifacts (ready)
   │
   ▼
Validator ──► Reviewer ──► Quality gate ──► publish | hold | retry | replan | abort | escalate
```

Workers are contracted (`contracts/worker-port.md`) but **not implemented** in this phase.

## Core objects

All durable objects are **artifacts** (`art_…` + `type`).

| Type | Producer |
|------|----------|
| `goal` | human / orchestrator |
| `plan` | planner |
| `task` | planner |
| `dependency-graph` | planner / orchestrator |
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
| Capability | skills, validators, reviewers |
| Policy | `policies/gate-profiles.json` |
| Execution | workers (deferred) |

## Design principles

1. Declarative first — manifests and schemas before code.
2. Artifact-native — chat is ephemeral.
3. Dependency-explicit — predecessor/successor edges only.
4. Gate separation — validators then reviewers.
5. Shared defs — `common.schema.json` is the only enum source.
6. Registry-open types — extend via `artifact-types` entries, not closed enums.
7. No hidden workers.

## Cursor skills vs AIOS skills

See `contracts/cursor-bridge.md`.

## Versioning

- Framework: `VERSION` (now `0.2.0`)
- Breaking changes: `architecture/MIGRATIONS.md`
- Packages: semver in manifests
- Artifacts: monotonic `artifact_version`
