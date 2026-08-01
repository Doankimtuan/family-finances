# Migrations

## Policy

- Framework `VERSION` is semver.
- Document every breaking contract change here before bumping minor/major.
- Additive schema fields may stay on the same `schema_version` const when optional.
- Removing/renaming required fields or changing enum membership is breaking.

## 0.1.0 → 0.2.0 (2026-08-01)

Contract remediation after architect FAIL review.

| Change | Detail |
|--------|--------|
| `$id` base | `https://family-finances.local/ai-os/schemas/` → `https://aios.dev/schemas/` |
| Shared defs | All schemas `$ref` `common.schema.json` `$defs` |
| Artifact types | Closed enum removed; registry-driven `artifactTypeId` |
| Identity | Sole durable prefix `art_`; dual prefixes retired |
| Plan model | No inlined tasks/edges; `task_refs` + `dependency_graph_ref` |
| Edges | `from`/`to` → `predecessor`/`successor` |
| Skill roles | `validator`/`reviewer` removed from skill manifests |
| Status enums | Split Artifact/Task/Run/Orchestration/Package |
| Decisions | Unified `controlDecision` vocab |
| Payload paths | Canonical `payload.*` only |
| Registries | `entries` maps keyed by id |
| New schemas | registry, gate-profile, run-event, plan-decision, escalation, worker-manifest |
| New types | `plan-decision`, `escalation` registered |
