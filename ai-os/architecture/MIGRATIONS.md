# Migrations

## Policy

- Framework `VERSION` is semver.
- Document every breaking contract change here before bumping minor/major.
- Additive schema fields may stay on the same `schema_version` const when optional.
- Removing/renaming required fields or changing enum membership is breaking.

## 0.3.2 → 0.3.3 (2026-08-01)

Architect FAIL remediation (still no workers).

| Change | Detail |
|--------|--------|
| Run contract | Shared Zod `ErrorPhase` ≡ `common.schema.json#/$defs/errorPhase` (incl. `gating`/`settling`; no `control`) |
| Settling | Publish gate from `gating` → `settling`; `settle()` / `markSucceeded()` → `succeeded` |
| Gates | `validators_blocking` requires ≥1 validation; `blocking_severities` consulted via fail→critical / warn→high |
| Gate profile JSON | `reviews_blocking` required on profile (parity with Zod) |
| Retries | Soft-fail when attempts remain; `retryTask` requeues stub run; fail-fast cancel only when retries exhausted |
| FSM | `planAndAttach` only from `accepting`\|`planning`; revise clears waves/`plan_ref`/`task_outcomes`; `escalate` non-terminal only |
| Smoke | Settling asserted; validation evidence required; fail-fast / soft-retry / illegal planAndAttach / escalate negatives |
| Docs | OVERVIEW / VERSION `0.3.3` |

## 0.3.1 → 0.3.2 (2026-08-01)

Architect FAIL remediation (still no workers).

| Change | Detail |
|--------|--------|
| Run contract | Zod `ExecutionRunPayload` mirrors JSON `runPhase` + gate_results/outputs shape; stub marker in `extensions` |
| Orchestration schema | `task_outcomes` (+ optional `attempt`) added to `orchestration-state.schema.json` |
| FSM | `acceptPlan` only from `planning`; `rejectOrRevisePlan` from `planning\|scheduled`; waves complete → `gating` |
| Fail-fast | Cancels sibling stub runs + task artifacts |
| Gates | `reviews_blocking` requires reviews; `require_review_on_repo_write` triggers planGate when tasks request `repo-write` |
| Skills | `resolveSkillVersion` for `"active"` pins; retries bounded by `max_retries_per_task` |
| Store | `assertArtifactType` required on `ArtifactStore` |
| Worker templates | `manifest.json`; cases 04–05; mandatory tree synced |
| Docs | OVERVIEW / VERSION `0.3.2` |

## 0.3.0 → 0.3.1 (2026-08-01)

Core Engine FAIL remediation (still no workers).

| Change | Detail |
|--------|--------|
| Gates | `acceptPlan` enforces `require_review_on_plan` / blocking reviews; settle requires quality gate when validators/reviews blocking |
| Publish | Plan publish writes new version with synced `payload.status`; old version superseded |
| Registry | `ArtifactStore.write` asserts artifact type; `requireActiveSkills` defaults true |
| Ownership | Reject accept/reject/revise when `plan.trace.orchestration_id` mismatches |
| Trace | Reject/revise plan-decisions include `goal_id`; all decision paths `.parse()` |
| Lifecycle | `startNextWave` + `recordTaskOutcome` (stub run-records) → settling |
| Schemas | Zod `.strict()`; edge endpoints `ArtifactId`; `ExecutionRunPayload`; `task_outcomes` on orchestration state |
| Knowledge | Single `GateProfileEntry` schema; `Severity` enum |
| Wiring | Single shared Planner; MemoryManager-backed session memory |
| Docs | OVERVIEW 0.3.0; folder-structure includes `core/`; lifecycle + role charter updated |

## 0.2.0 → 0.3.0 (2026-08-01)

Core Engine implementation (no workers).

| Change | Detail |
|--------|--------|
| Package | `ai-os/core/` TypeScript control plane |
| Modules | planner, orchestrator, artifacts, memory, knowledge, schemas (Zod), templates loader, configs |
| Runtime | Filesystem artifact store under `runtime/artifacts` |
| Explicit non-goals | No workers, no skill execution, no validator/reviewer runners |

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
