# Migrations

## Policy

- Framework `VERSION` is semver.
- Document every breaking contract change here before bumping minor/major.
- Additive schema fields may stay on the same `schema_version` const when optional.
- Removing/renaming required fields or changing enum membership is breaking.

## 0.5.0 → 0.5.1 (2026-08-01)

Product Review Board HOLD remediation for Sprint 4 Product RE (Feature Workers still forbidden; Core still does not invoke workers). Solution Architecture pipeline unchanged.

| Change | Detail |
|--------|--------|
| C3-R | Soft inputs typed as `doc-source` / `app-surface` / `discovery-report` (never `goal`) |
| H1-R | Worker-specific SKILL.md with Ownership, Heuristics, Done when, Negative examples |
| H2-R | `aios:product-re:smoke` asserts skill input `artifact_type` |
| H3-R | Generator ids retained (BC); `mission_verb=extract` + extractor titles |
| H4-R | Wave-0 ownership/exclusion rules in skills |
| M1 | `gaps/` produce folder for `product-re-gap-report` |
| M2–M3 | Produce-folder examples; specialized knowledge/features/business JSON templates |
| M4–M5 | `soft_discovery_handoff` ingest-only; hard edges for workflow/gap ↔ ingest |
| M7–M8 | Ingest `entry_kind` enums + validator check; product-analyst `value-prop` sample |
| Docs | Mirror rule (folder templates vs `entries[]`); pipeline README 0.2.1 |

## 0.4.2 → 0.5.0 (2026-08-01)

Solution Architecture redesign phase (Feature Workers still forbidden; Core still does not invoke workers).

| Change | Detail |
|--------|--------|
| Pipeline | `pipelines/solution-architecture/` — 4 workers, 3 waves |
| Workers | `architecture-consultant`, `tech-stack-consultant`, `refactoring-consultant`, `folder-structure-designer` |
| I/O | Consume quality/ + product-architecture/ (alias for architecture/); produce redesign/, architecture-v2/, tech-stack/, migration/, folder-structure/, decision-records/ |
| Schemas | `solution-architecture-payload.schema.json` + typed specs; entries require `source_paths` + `confidence` |
| Validator/Reviewer | `solution-architecture-schema-check` / `solution-architecture-coverage-review` |
| Knowledge | `validateSolutionArchitecturePipelineRegistration()` |
| Smoke | `npm run aios:solution-architecture:smoke` |
| Invariants | Preserve business behavior; never invent business logic; never overwrite discovery/Product RE artifacts |

## 0.4.1 → 0.4.2 (2026-08-01)

Product Review Board FAIL remediation for Product Reverse Engineering (Feature Workers still forbidden; Core still does not invoke workers).

| Change | Detail |
|--------|--------|
| Phase | `worker-port` / `AGENTS` / `folder-structure` / `pipeline` contracts legalize `pipelines/product-re/` |
| Path | Product architecture consume → `product-architecture/`; remove product-RE templates from `architecture/` |
| Workers | Ingest wave 0 + `product-re-gap-report`; narrow transform consumes; extractor `role_alias` on generator ids |
| Schemas | Typed product-re payloads; `source_paths` required; type if/then for product/workflow/requirements/acceptance |
| Validator/Reviewer | `product-re-schema-check` / `product-re-coverage-review` v0.2.0 |
| Knowledge | `validateProductRePipelineRegistration()` |
| Smoke | `npm run aios:product-re:smoke`; discovery smoke allows registered product-re packages |
| Docs | `RELEASE_NOTES_0.4.2.md`; I/O templates specialized; domain fixtures under `examples/` |

## 0.4.0 → 0.4.1 (2026-08-01)

Architect FAIL remediation for Discovery Worker phase (still no Feature Workers / no invoke).

| Change | Detail |
|--------|--------|
| Docs | README non-negotiable #5; template phase rule; OVERVIEW diagram + `discovery-report`; skills/validators/reviewers READMEs |
| Packages | Reserved stubs on disk for all registered `skills/discover-*`, `validators/discovery-schema-check`, `reviewers/discovery-coverage-review` |
| Schemas | `discovery-report.schema.json`, `pipeline.schema.json`, `worker-output-envelope.schema.json` |
| Contracts | `contracts/pipeline.md` |
| Workers | CONCURRENCY lock wording; reserved-skill claim policy; checklists honest; sample discovery-report payloads; purge “Replace placeholders” |
| Knowledge | `getPipeline`, `getPipelineDependencyGraph`, `validateDiscoveryPipelineRegistration`, `assertRegistryPathExists` |
| Smoke | `npm run aios:discovery:smoke` — registry/pipeline/graph/path validation only |

## 0.3.3 → 0.4.0 (2026-08-01)

Discovery Worker phase open (Feature Workers still forbidden).

| Change | Detail |
|--------|--------|
| Workers | Six Discovery Worker packages under `workers/discover-*` from `templates/worker/` |
| Registry | `registry/workers.json`; `registry_kind` adds `workers`; reserved discovery skills/validator/reviewer |
| Artifact type | `discovery-report` |
| Pipeline | `pipelines/discovery/` with `pipeline.json` + `dependency-graph.json` (3 waves) |
| Schema | `pipeline-dependency-graph.schema.json` for worker-kebab dependency graphs |
| Knowledge | `KnowledgeBase.workers()` |
| Policy | Feature Workers must not be added; side-effect ceiling remains `runtime-write` |

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
