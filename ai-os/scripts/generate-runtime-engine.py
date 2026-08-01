#!/usr/bin/env python3
"""Scaffold Runtime Engine pipeline v0.11.0 (packaging only — no worker execution)."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
PIPELINE = "runtime-engine"
PKG_VERSION = "0.1.0"
FW_VERSION = "0.11.0"

COMMON_CONSUMES = [
    "workers", "validators", "reviewers", "pipelines", "workflow",
    "templates", "schemas", "configs", "artifacts", "knowledge", "registry",
]

# Topologically valid waves (no hard edge within a wave)
WORKERS = [
    {
        "id": "runtime-configuration-loader",
        "title": "Runtime Configuration Loader",
        "mission": "Load .ai-os.yaml, run.yaml, workspace.yaml, environment variables, and defaults into a normalized runtime config. Never execute workers.",
        "entry_kinds": ["aios-yaml", "run-yaml", "workspace-yaml", "env-vars", "defaults", "normalized-config"],
        "depends": [],
        "wave": 0,
        "modes": [".ai-os.yaml", "run.yaml", "workspace.yaml", "Environment Variables", "Defaults"],
        "output_type": "runtime-status",
        "partition": "runtime/configs/runtime-configuration-loader/",
    },
    {
        "id": "event-bus",
        "title": "Event Bus",
        "mission": "Define and plan runtime events: WorkerStarted/Finished, Validation*, Review*, PhaseCompleted, CheckpointCreated, ExecutionCompleted/Failed. Never mutate workers.",
        "entry_kinds": [
            "worker-started", "worker-finished", "validation-started", "validation-finished",
            "review-started", "review-finished", "phase-completed", "checkpoint-created",
            "execution-completed", "execution-failed",
        ],
        "depends": [],
        "wave": 0,
        "modes": ["Worker Events", "Validation Events", "Review Events", "Phase Events", "Execution Events"],
        "output_type": "runtime-event",
        "partition": "runtime/events/event-bus/",
    },
    {
        "id": "logging-engine",
        "title": "Logging Engine",
        "mission": "Plan structured execution, worker, validation, review, failure, and performance logs. Never modify worker implementations.",
        "entry_kinds": [
            "execution-log", "worker-log", "validation-log", "review-log", "failure-log", "performance-log",
        ],
        "depends": [],
        "wave": 0,
        "modes": ["Execution Logs", "Worker Logs", "Validation Logs", "Review Logs", "Failure Logs", "Performance Logs"],
        "output_type": "runtime-log",
        "partition": "runtime/logs/logging-engine/",
    },
    {
        "id": "command-interpreter",
        "title": "Command Interpreter",
        "mission": "Parse single-command UX (@Run full|incremental|phase N|resume|retry|validate|review|freeze|status|benchmark) into normalized run intents. Never invoke workers directly.",
        "entry_kinds": [
            "run-full", "run-incremental", "run-phase", "run-resume", "run-retry",
            "run-validate", "run-review", "run-freeze", "run-status", "run-benchmark",
        ],
        "depends": ["runtime-configuration-loader"],
        "wave": 1,
        "modes": ["@Run full", "@Run incremental", "@Run phase", "@Run resume", "@Run retry", "@Run validate", "@Run review", "@Run freeze", "@Run status", "@Run benchmark"],
        "output_type": "runtime-command",
        "partition": "runtime/commands/command-interpreter/",
    },
    {
        "id": "dependency-resolver",
        "title": "Dependency Resolver",
        "mission": "Resolve worker, artifact, pipeline, and execution dependencies; reject circular dependencies. Never modify dependency graphs on disk.",
        "entry_kinds": [
            "worker-dependency", "artifact-dependency", "pipeline-dependency",
            "execution-dependency", "circular-rejection",
        ],
        "depends": ["runtime-configuration-loader"],
        "wave": 1,
        "modes": ["Worker Deps", "Artifact Deps", "Pipeline Deps", "Execution Deps", "Circular Rejection"],
        "output_type": "runtime-status",
        "partition": "runtime/scheduler/dependency-resolver/",
    },
    {
        "id": "execution-context-manager",
        "title": "Execution Context Manager",
        "mission": "Maintain current phase, completed workers, execution state, temporary memory, shared context, worker outputs, and global variables. Orchestration state only.",
        "entry_kinds": [
            "current-phase", "completed-workers", "execution-state", "temporary-memory",
            "shared-context", "worker-outputs", "global-variables",
        ],
        "depends": ["runtime-configuration-loader"],
        "wave": 1,
        "modes": ["Phase", "Completed Workers", "State", "Memory", "Shared Context", "Outputs", "Globals"],
        "output_type": "runtime-status",
        "partition": "runtime/state/execution-context-manager/",
    },
    {
        "id": "artifact-manager",
        "title": "Artifact Manager",
        "mission": "Track generated artifacts, versions, lifecycle, ownership, and dependencies during runtime. Never invent business artifacts.",
        "entry_kinds": [
            "artifact-track", "artifact-version", "artifact-lifecycle",
            "artifact-ownership", "artifact-dependency",
        ],
        "depends": ["runtime-configuration-loader"],
        "wave": 1,
        "modes": ["Track", "Version", "Lifecycle", "Ownership", "Dependencies"],
        "output_type": "runtime-status",
        "partition": "runtime/execution/artifact-manager/",
    },
    {
        "id": "execution-planner",
        "title": "Execution Planner",
        "mission": "Before execution, generate execution graph, worker order, estimated outputs/runtime, validation/review/checkpoint plans. Never execute immediately.",
        "entry_kinds": [
            "execution-graph", "worker-order", "estimated-outputs", "estimated-runtime",
            "validation-plan", "review-plan", "checkpoint-plan",
        ],
        "depends": ["command-interpreter", "dependency-resolver"],
        "wave": 2,
        "modes": ["Execution Graph", "Worker Order", "Estimates", "Validation Plan", "Review Plan", "Checkpoint Plan"],
        "output_type": "runtime-plan",
        "partition": "runtime/execution/execution-planner/",
    },
    {
        "id": "checkpoint-manager",
        "title": "Checkpoint Manager",
        "mission": "Plan checkpoints before every phase, after validation, before retries, before freeze; support rollback. Never modify workers.",
        "entry_kinds": [
            "phase-checkpoint", "validation-checkpoint", "retry-checkpoint",
            "freeze-checkpoint", "rollback-plan",
        ],
        "depends": ["execution-context-manager", "artifact-manager"],
        "wave": 2,
        "modes": ["Before Phase", "After Validation", "Before Retry", "Before Freeze", "Rollback"],
        "output_type": "runtime-checkpoint",
        "partition": "runtime/checkpoint/checkpoint-manager/",
    },
    {
        "id": "progress-tracker",
        "title": "Progress Tracker",
        "mission": "Track overall progress, current phase, worker status, execution time, ETA, generated artifacts, and quality status.",
        "entry_kinds": [
            "overall-progress", "current-phase-status", "worker-status",
            "execution-time", "estimated-completion", "generated-artifacts", "quality-status",
        ],
        "depends": ["execution-context-manager", "event-bus"],
        "wave": 2,
        "modes": ["Overall", "Phase", "Worker Status", "Time", "ETA", "Artifacts", "Quality"],
        "output_type": "runtime-status",
        "partition": "runtime/state/progress-tracker/",
    },
    {
        "id": "worker-scheduler",
        "title": "Worker Scheduler",
        "mission": "Select workers, resolve execution order, prevent duplicated execution, support priorities and concurrency. Never implement worker logic.",
        "entry_kinds": [
            "worker-selection", "execution-order", "dedupe-guard", "priority", "concurrency",
        ],
        "depends": ["execution-planner", "dependency-resolver"],
        "wave": 3,
        "modes": ["Select", "Order", "Dedupe", "Priority", "Concurrency"],
        "output_type": "runtime-status",
        "partition": "runtime/scheduler/worker-scheduler/",
    },
    {
        "id": "retry-engine",
        "title": "Retry Engine",
        "mission": "Plan retries for failed workers/phases/validation/review with updated context and retry limits from runtime config.",
        "entry_kinds": [
            "retry-worker", "retry-phase", "retry-validation", "retry-review",
            "retry-updated-context", "retry-limits",
        ],
        "depends": ["checkpoint-manager", "worker-scheduler"],
        "wave": 4,
        "modes": ["Retry Worker", "Retry Phase", "Retry Validation", "Retry Review", "Updated Context", "Limits"],
        "output_type": "runtime-status",
        "partition": "runtime/execution/retry-engine/",
    },
    {
        "id": "resume-engine",
        "title": "Resume Engine",
        "mission": "Resume from latest checkpoint, failed worker, failed phase, or interrupted execution. Deterministic resume plans only in packaging.",
        "entry_kinds": [
            "resume-checkpoint", "resume-failed-worker", "resume-failed-phase", "resume-interrupted",
        ],
        "depends": ["checkpoint-manager", "execution-context-manager"],
        "wave": 4,
        "modes": ["Latest Checkpoint", "Failed Worker", "Failed Phase", "Interrupted"],
        "output_type": "runtime-status",
        "partition": "runtime/resume/resume-engine/",
    },
    {
        "id": "pipeline-engine",
        "title": "Pipeline Engine",
        "mission": "Execute execution graphs: sequential, parallel, conditional, dynamic, resume, and incremental modes. Orchestration only — never implement business analysis.",
        "entry_kinds": [
            "sequential-execution", "parallel-execution", "conditional-execution",
            "dynamic-execution", "resume-execution", "incremental-execution",
        ],
        "depends": [
            "worker-scheduler", "retry-engine", "resume-engine",
            "progress-tracker", "logging-engine",
        ],
        "wave": 5,
        "modes": ["Sequential", "Parallel", "Conditional", "Dynamic", "Resume", "Incremental"],
        "output_type": "runtime-status",
        "partition": "runtime/execution/pipeline-engine/",
    },
    {
        "id": "master-orchestrator",
        "title": "Master Orchestrator",
        "mission": "Single entry point: load config/pipeline/workers, resolve deps, drive pipeline engine, handle failures/retries/resume, freeze phases, produce execution summary. End users invoke only @Run commands — never individual workers.",
        "entry_kinds": [
            "load-config", "load-pipeline", "load-workers", "resolve-dependencies",
            "execute-pipeline", "handle-failure", "handle-retry", "handle-resume",
            "freeze-phase", "execution-summary",
        ],
        "depends": [
            "pipeline-engine", "execution-planner", "command-interpreter",
            "runtime-configuration-loader",
        ],
        "wave": 6,
        "modes": ["Config", "Pipeline", "Workers", "Deps", "Execute", "Failure", "Retry", "Resume", "Freeze", "Summary"],
        "output_type": "runtime-execution-report",
        "partition": "runtime/orchestrator/master-orchestrator/",
    },
]

WAVES: list[list[str]] = [[] for _ in range(7)]
for w in WORKERS:
    WAVES[w["wave"]].append(w["id"])

COMMANDS = [
    "@Run full", "@Run incremental", "@Run phase 1", "@Run phase 2",
    "@Run resume", "@Run retry", "@Run validate", "@Run review",
    "@Run freeze", "@Run status", "@Run benchmark",
]

SKILL_PROCEDURES = {
    "runtime-configuration-loader": """1. Locate `.ai-os.yaml`, `run.yaml`, `workspace.yaml` under project root / `runtime/configs/`.
2. Merge env vars over file config over defaults; emit normalized-config.
3. Validate keys: mode, entry, projectRoot, output, resume, validation, review, freezeEachPhase, parallelWorkers, maxRetry, logging.
4. Never execute workers; never mutate prior sprint packages.
5. All six entry_kinds required or UNKNOWN.""",
    "event-bus": """1. Register event schema for the ten runtime event kinds.
2. Plan publish/subscribe paths under `runtime/events/` (JSONL/JSON).
3. Bind events to logging-engine and progress-tracker consumers (soft).
4. Never invent business events outside runtime lifecycle.
5. Ten event entry_kinds required.""",
    "logging-engine": """1. Plan structured log sinks under `runtime/logs/` with correlation ids.
2. Map log kinds: execution, worker, validation, review, failure, performance.
3. Honor logging level from normalized-config (detailed|standard|minimal).
4. Never write into workers/ or validators/ trees.
5. Six log entry_kinds required.""",
    "command-interpreter": """1. Parse user command tokens (`@Run …`) into run intent + options.
2. Map to entry_kinds; reject unknown commands with fail result.
3. Single-command UX: user never names individual workers.
4. Emit runtime-command for master-orchestrator / execution-planner.
5. Ten command entry_kinds covered in catalog; sample covers primary set.""",
    "dependency-resolver": """1. Soft-read `pipelines/*/dependency-graph.json` and registry workers.
2. Build worker/artifact/pipeline/execution dependency views.
3. Detect cycles; emit circular-rejection as critical fail when found.
4. Never rewrite dependency graphs on disk in packaging.
5. Five entry_kinds required.""",
    "execution-context-manager": """1. Initialize execution-state from normalized-config + command intent.
2. Track current-phase, completed-workers, worker-outputs, globals.
3. Isolate temporary-memory per run id; shared-context is read-mostly.
4. Persist state plans under `runtime/state/` only.
5. Seven entry_kinds required.""",
    "artifact-manager": """1. Index planned/generated artifact refs from context (paths only).
2. Track version, lifecycle, ownership, dependency edges.
3. Never invent product/business artifacts; orchestration metadata only.
4. Five entry_kinds required.
5. Partition under `runtime/execution/artifact-manager/`.""",
    "execution-planner": """1. Consume command intent + resolved dependency graph.
2. Emit execution-graph (Mermaid/JSON), worker-order, estimates.
3. Attach validation-plan, review-plan, checkpoint-plan — never execute.
4. Fail closed if circular deps unresolved.
5. Seven entry_kinds required; packaging proves plan-only.""",
    "checkpoint-manager": """1. Plan checkpoints before phase, after validation, before retry/freeze.
2. Include rollback-plan referencing checkpoint ids.
3. Store plans under `runtime/checkpoint/`.
4. Never mutate worker packages to create checkpoints.
5. Five entry_kinds required.""",
    "progress-tracker": """1. Subscribe to event-bus kinds for status transitions.
2. Emit overall-progress, phase, worker-status, timing, ETA, artifacts, quality-status.
3. Quality status is orchestration-level (gate pending/pass/fail), not business QA.
4. Seven entry_kinds required.
5. Read-only against prior pipeline outputs.""",
    "worker-scheduler": """1. From execution-plan worker-order, select runnable workers.
2. Apply priority + concurrency from config (parallelWorkers).
3. Dedupe-guard prevents duplicate claims for same worker+task.
4. Never implement worker business logic.
5. Five entry_kinds required.""",
    "retry-engine": """1. Read maxRetry from normalized-config.
2. Plan retry-worker / retry-phase / retry-validation / retry-review.
3. retry-updated-context must reference checkpoint + failure log evidence.
4. Exceeding retry-limits → fail to master-orchestrator handle-failure.
5. Six entry_kinds required.""",
    "resume-engine": """1. Locate latest checkpoint under `runtime/checkpoint/`.
2. Plan resume from checkpoint, failed worker, failed phase, or interrupted run.
3. Rebuild context via execution-context-manager plans — no re-analysis of product repos.
4. Four entry_kinds required.
5. Packaging sample shows resume-checkpoint plan only.""",
    "pipeline-engine": """1. Consume scheduler + retry + resume + progress + logging plans.
2. Support sequential/parallel/conditional/dynamic/resume/incremental execution modes.
3. Drive validators/reviewers as gates declared by target pipeline — never rewrite them.
4. Six execution entry_kinds required.
5. Never analyze projects or generate product artifacts.""",
    "master-orchestrator": """1. Single entry: accept runtime-command from command-interpreter.
2. Load config → plan → pipeline-engine; handle failure/retry/resume; freeze phases.
3. Discover workers/validators/reviewers via registry soft-reads.
4. Produce execution-summary / runtime-execution-report under `runtime/orchestrator/`.
5. End user never manually invokes individual workers; ten entry_kinds required.
6. Packaging: plans only — do not execute any worker.""",
}


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def raci_md() -> str:
    rows = [f"| `{k}` | `{w['id']}` |" for w in WORKERS for k in w["entry_kinds"]]
    return f"""# RACI — Runtime Engine

Complete entry_kind ownership. Workers must not emit kinds owned by another worker.

| entry_kind | Owner |
|------------|-------|
{chr(10).join(rows)}

## Overlap resolution

| Concern | Owner | Not owner |
|---------|-------|-----------|
| Normalized config | runtime-configuration-loader | command-interpreter |
| @Run parsing | command-interpreter | master-orchestrator |
| Pre-exec plans | execution-planner | pipeline-engine |
| Graph execution | pipeline-engine | worker-scheduler |
| Single UX entry | master-orchestrator | all others |
| Checkpoints | checkpoint-manager | resume-engine (consumes) |

**Never modify worker / validator / reviewer implementations. Orchestrate only.**

Packaging only — workers not executed.
"""


def gen_skill(w: dict) -> str:
    kinds = "\n".join(f"| `{k}` | Owned per RACI |" for k in w["entry_kinds"])
    return f"""---
name: {w["id"]}
description: {w["mission"]}
---

# {w["title"]}

> Orchestrate only. Never modify workers/validators/reviewers. Never execute in packaging milestone. Never analyze product repos.

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/` (alias `pipeline/`), `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`, `registry/`

## Produces

`{w["partition"]}` → `{w["output_type"]}` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
{kinds}

See `pipelines/runtime-engine/RACI.md`.

## Procedure

{SKILL_PROCEDURES[w["id"]]}

## Heuristics

- Prefer registry/path evidence; mark gaps `UNKNOWN: …`.
- Deterministic plans; reproducible given same config + command.
- Single-command UX: never require users to invoke workers by id.
- Respect RACI; never duplicate another runtime worker's kinds.

## Done when

- All owned entry_kinds represented (or explicit UNKNOWN)
- Full payload fields + valid `folder_mirror`
- No worker/validator/reviewer mutation; no execution in packaging

## Negative examples

- Do not modify `workers/`, `validators/`, `reviewers/` implementations.
- Do not analyze product repositories or invent business specs.
- Do not execute pipelines in packaging milestone.
- Do not bypass Execution Planner for immediate execution.
"""


def gen_entry(w: dict, kind: str, idx: int, **extra) -> dict:
    part = w["partition"]
    e = {
        "id": f"rt_{w['id']}_{idx:03d}",
        "entry_kind": kind,
        "statement": f"Runtime plan for {kind} via {w['title']}",
        "runtime_id": f"run_{w['id']}_sample",
        "target": part,
        "rule": f"{kind} per Runtime Engine contract + RACI",
        "result": "planned",
        "evidence": [
            "contracts/runtime-engine.md",
            f"pipelines/{PIPELINE}/RACI.md",
            "runtime/configs/.ai-os.yaml",
        ],
        "impact": f"Enables orchestrated {kind} without manual worker invocation",
        "severity": "info",
        "recommendation": "Review plan before execution phase opens",
        "alternative_solution": "Manual Core invocation (not supported for end users)",
        "confidence": 0.85,
        "source_paths": ["workers/", "pipelines/", "schemas/", "configs/", "registry/"],
        "unknowns": ["UNKNOWN: runtime execution not opened in packaging milestone"],
        "traceability": {"pipeline": PIPELINE, "worker": w["id"]},
        "folder_mirror": f"{part}{kind}.json",
    }
    e.update(extra)
    return e


def gen_payload(w: dict) -> dict:
    kinds = w["entry_kinds"]
    # multi-mode gold for key workers
    if w["id"] in (
        "command-interpreter", "execution-planner", "master-orchestrator",
        "event-bus", "pipeline-engine",
    ):
        entries = [gen_entry(w, k, i + 1) for i, k in enumerate(kinds)]
    else:
        take = kinds[: max(2, min(3, len(kinds)))]
        entries = [gen_entry(w, k, i + 1) for i, k in enumerate(take)]

    if w["id"] == "execution-planner":
        entries = [
            gen_entry(w, "execution-graph", 1,
                      statement="Execution graph planned; execution deferred (never execute immediately)"),
            gen_entry(w, "worker-order", 2),
            gen_entry(w, "estimated-outputs", 3),
            gen_entry(w, "estimated-runtime", 4),
            gen_entry(w, "validation-plan", 5),
            gen_entry(w, "review-plan", 6),
            gen_entry(w, "checkpoint-plan", 7),
        ]

    if w["id"] == "master-orchestrator":
        entries = [
            gen_entry(w, "load-config", 1),
            gen_entry(w, "load-pipeline", 2),
            gen_entry(w, "load-workers", 3),
            gen_entry(w, "resolve-dependencies", 4),
            gen_entry(w, "execute-pipeline", 5, result="planned",
                      statement="Execute pipeline planned — packaging does not run workers"),
            gen_entry(w, "handle-failure", 6),
            gen_entry(w, "handle-retry", 7),
            gen_entry(w, "handle-resume", 8),
            gen_entry(w, "freeze-phase", 9),
            gen_entry(w, "execution-summary", 10,
                      statement="Execution summary template for @Run full single-command UX"),
        ]

    if w["id"] == "dependency-resolver":
        entries.append(gen_entry(
            w, "circular-rejection", len(entries) + 1,
            severity="critical", result="pass",
            statement="Circular dependency rejection rule armed; packaging sample has no cycle",
        ))

    return {
        "schema_version": "1.0.0",
        "artifact_id": f"art_rt_{w['id']}_primary",
        "type": w["output_type"],
        "worker_id": w["id"],
        "title": f"{w['title']} sample",
        "summary": f"Sample {w['output_type']} for {w['id']} (packaging; workers not executed)",
        "entries": entries,
        "status": "draft",
        "created_at": NOW,
    }


def create_worker(w: dict) -> None:
    wid = w["id"]
    wdir = ROOT / "workers" / wid
    sdir = ROOT / "skills" / wid
    payload = gen_payload(w)

    write(wdir / "README.md", f"""# Worker — `{wid}`

> **Pipeline:** `{PIPELINE}` · **Status:** draft · **Orchestrate only — never modify workers**  
> **Primary output:** `{w["output_type"]}`

## Mission

{w["mission"]}

## Identity

| Field | Value |
|-------|-------|
| Worker id | `{wid}` |
| Pipeline | `{PIPELINE}` |
| Skill | `{wid}` |
| Partition | `{w["partition"]}` |

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`

## Produces

`{w["partition"]}` → `{w["output_type"]}`

## Modes

{chr(10).join(f"- {m}" for m in w["modes"])}

## References

- `contracts/runtime-engine.md`
- `pipelines/runtime-engine/`
- `schemas/runtime-engine-payload.schema.json`
""")
    write(wdir / "skill.md", f"See `skills/{wid}/SKILL.md`.")
    write(wdir / "validator.md", f"""# Validator binding — `{wid}`

Pipeline gate: `runtime-engine-schema-check`

## Checks

1. Payload validates against `schemas/runtime-engine-payload.schema.json`.
2. `folder_mirror` under `{w["partition"]}`.
3. entry_kind owned per RACI.
4. Orchestrate-only / no-mutate-workers invariants.
""")
    write(wdir / "reviewer.md", f"""# Reviewer binding — `{wid}`

Pipeline gate: `runtime-engine-coverage-review`

## Rubric focus

- Single-command UX completeness
- Plan-before-execute (Execution Planner)
- Determinism / resume / retry coverage
- RACI compliance
""")
    write(wdir / "checklist.md", f"""# Checklist — `{wid}`

- [ ] README identity complete
- [ ] Domain SKILL.md procedure present
- [ ] RACI entry_kinds covered
- [ ] sample-primary-payload.json validates
- [ ] testcases with input/expect
- [ ] Registered in registry
- [ ] Partition documented
- [ ] Status draft until execution phase
""")
    write(wdir / "testcases.md", f"""# Test cases — `{wid}`

| Case | Intent |
|------|--------|
| case-01-happy-path | Valid runtime plan |
| case-02-missing-config | UNKNOWN when .ai-os.yaml absent |
| case-03-circular-deps | critical circular-rejection |
| case-04-raci-violation | fail on foreign entry_kind |
| case-05-worker-mutation | veto if mutate_workers true |
""")
    write(wdir / "manifest.json", json.dumps({
        "schema_version": "1.0.0",
        "id": wid,
        "version": PKG_VERSION,
        "title": w["title"],
        "implements_roles": ["orchestrator"] if wid in ("master-orchestrator", "pipeline-engine") else ["executor"],
        "side_effects": ["runtime-write"],
        "entrypoint": "skill.md",
        "status": "draft",
        "extensions": {
            "worker_class": "discovery",
            "pipeline": PIPELINE,
            "mutate_workers": False,
            "mutate_validators": False,
            "mutate_reviewers": False,
            "execute_workers": False,
            "orchestrate_only": True,
            "remediation": FW_VERSION,
            "partition": w["partition"],
        },
    }, indent=2) + "\n")

    type_schema = {
        "runtime-status": "runtime-status.schema.json",
        "runtime-event": "runtime-event.schema.json",
        "runtime-log": "runtime-log.schema.json",
        "runtime-command": "runtime-command.schema.json",
        "runtime-plan": "runtime-plan.schema.json",
        "runtime-checkpoint": "runtime-checkpoint.schema.json",
        "runtime-execution-report": "runtime-execution-report.schema.json",
    }[w["output_type"]]
    write(wdir / "output-schema.json", json.dumps({
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": f"https://aios.dev/schemas/workers/{wid}/output-schema.json",
        "allOf": [{"$ref": f"https://aios.dev/schemas/{type_schema}"}],
    }, indent=2) + "\n")

    write(sdir / "SKILL.md", gen_skill(w))
    write(sdir / "manifest.json", json.dumps({
        "schema_version": "1.0.0",
        "id": wid,
        "version": PKG_VERSION,
        "title": w["title"],
        "description": w["mission"],
        "role": "orchestrator" if wid in ("master-orchestrator", "pipeline-engine") else "executor",
        "grade": "guided",
        "inputs": [
            {"name": "goal", "artifact_type": "goal", "required": True, "description": "Runtime goal"},
        ] + [
            {"name": c, "artifact_type": "doc-source",
             "required": c in ("workers", "schemas", "pipelines", "configs"),
             "description": f"{c}/"}
            for c in COMMON_CONSUMES
        ],
        "outputs": [
            {"name": "primary", "artifact_type": w["output_type"], "primary": True,
             "description": w["output_type"]},
        ],
        "requires_skills": w["depends"],
        "validators": ["runtime-engine-schema-check"],
        "reviewers": ["runtime-engine-coverage-review"],
        "side_effects": ["runtime-write"],
        "status": "draft",
        "entrypoint": "SKILL.md",
        "extensions": {
            "pipeline": PIPELINE,
            "mutate_workers": False,
            "mutate_validators": False,
            "mutate_reviewers": False,
            "execute_workers": False,
            "orchestrate_only": True,
            "partition": w["partition"],
            "raci": f"pipelines/{PIPELINE}/RACI.md",
            "gate_output_type": "gate-runtime-report",
            "entry_kinds": w["entry_kinds"],
        },
    }, indent=2) + "\n")

    write(wdir / "examples/README.md", f"# Examples — `{wid}`\n")
    write(wdir / "examples/sample-input.json", json.dumps({
        "command": "@Run full",
        "config": "runtime/configs/.ai-os.yaml",
        "mode": "packaging",
    }, indent=2) + "\n")
    write(wdir / "examples/sample-output.json", json.dumps({
        "type": w["output_type"], "worker_id": wid,
    }, indent=2) + "\n")
    write(wdir / "examples/sample-primary-payload.json", json.dumps(payload, indent=2) + "\n")

    for name, body in [
        ("case-01-happy-path.json", {
            "case_id": "case-01-happy-path", "worker_id": wid,
            "input": {"command": "@Run full"},
            "expect": {"min_entries": 1, "requires_folder_mirror": True},
        }),
        ("case-02-missing-config.json", {
            "case_id": "case-02-missing-config", "worker_id": wid,
            "input": {"config": None},
            "expect": {"unknowns_required": True},
        }),
        ("case-03-circular-deps.json", {
            "case_id": "case-03-circular-deps", "worker_id": wid,
            "input": {"cycle": True},
            "expect": {"severity_min": "critical"},
        }),
        ("case-04-raci-violation.json", {
            "case_id": "case-04-raci-violation", "worker_id": wid,
            "input": {"entry_kind": "foreign-kind"},
            "expect": {"blocked": True},
        }),
        ("case-05-worker-mutation.json", {
            "case_id": "case-05-worker-mutation", "worker_id": wid,
            "input": {"mutate_workers": True},
            "expect": {"veto": True},
        }),
    ]:
        write(wdir / "testcases" / name, json.dumps(body, indent=2) + "\n")
    write(wdir / "testcases/README.md", f"# Testcases — `{wid}`\n")

    write(ROOT / "runtime" / "templates" / wid / "report.template.md", f"""# {w["title"]} Report Template

Worker: `{wid}`  
Pipeline: `{PIPELINE}`

## Summary

{{{{summary}}}}

## Entries

{{{{entries}}}}
""")


def create_output_tree() -> None:
    write(ROOT / "runtime" / "README.md", f"""# Runtime Engine

**Pipeline:** `{PIPELINE}` · **Framework:** {FW_VERSION}

Executes AIOS by coordinating Workers, Validators, Reviewers, and Pipelines.

## First-class UX

```
@Run full
@Run incremental
@Run review
@Run validate
@Run benchmark
@Run resume
```

End users never manually invoke individual workers.

## Layout

| Path | Purpose |
|------|---------|
| `orchestrator/` | Master Orchestrator partitions |
| `execution/` | Planner, pipeline engine, artifact/retry managers |
| `commands/` | Command interpreter |
| `state/` | Context + progress |
| `logs/` | Structured logs |
| `events/` | Event bus |
| `configs/` | Runtime configuration files |
| `checkpoint/` | Checkpoint manager |
| `resume/` | Resume engine |
| `scheduler/` | Scheduler + dependency resolver |
| `templates/` | Report templates |

## Invariants

- Never modify worker / validator / reviewer implementations
- Only orchestrate execution
- Packaging: do not execute workers
""")
    for sub, note in [
        ("orchestrator", "Master Orchestrator execution reports."),
        ("execution", "Planner, pipeline engine, artifact manager, retry engine."),
        ("commands", "Command interpreter @Run intents."),
        ("state", "Execution context + progress tracker."),
        ("logs", "Structured runtime logs."),
        ("events", "Event bus event streams."),
        ("configs", "Runtime configuration (.ai-os.yaml, run.yaml, workspace.yaml)."),
        ("checkpoint", "Checkpoint + rollback plans."),
        ("resume", "Resume engine plans."),
        ("scheduler", "Worker scheduler + dependency resolver."),
    ]:
        write(ROOT / "runtime" / sub / "README.md", f"# {sub}\n\n{note}\n")

    # Default configs
    aios_yaml = """# AIOS Runtime default configuration
mode: reverse-engineering
entry: full
projectRoot: .
output: ./artifacts
resume: true
validation: true
review: true
freezeEachPhase: true
parallelWorkers: true
maxRetry: 3
logging: detailed
"""
    write(ROOT / "runtime" / "configs" / ".ai-os.yaml", aios_yaml)
    write(ROOT / "runtime" / "configs" / "run.yaml", """# run.yaml — per-run overrides
entry: full
resume: true
maxRetry: 3
""")
    write(ROOT / "runtime" / "configs" / "workspace.yaml", """# workspace.yaml — workspace binding
projectRoot: .
output: ./artifacts
""")
    # also copy default to configs/ for consume path convenience
    write(ROOT / "configs" / "runtime" / ".ai-os.yaml", aios_yaml)
    write(ROOT / "configs" / "runtime" / "README.md",
          "# Runtime configs\n\nCanonical copies also live under `runtime/configs/`.\n")

    write(ROOT / "runtime" / "commands" / "command-registry.json", json.dumps({
        "schema_version": "1.0.0",
        "updated_at": NOW,
        "commands": COMMANDS,
        "note": "End users invoke only these commands; workers are discovered automatically.",
    }, indent=2) + "\n")

    write(ROOT / "runtime" / "execution" / "execution-model.md", """# Execution Model

```mermaid
flowchart TD
  UR[User Request @Run] --> CI[Command Interpreter]
  CI --> EP[Execution Planner]
  EP --> MO[Master Orchestrator]
  MO --> PE[Pipeline Engine]
  PE --> WS[Worker Scheduler]
  WS --> W[Workers]
  W --> V[Validators]
  V --> R[Reviewers]
  R --> CP[Checkpoint]
  CP --> NP[Next Phase]
  NP --> Done[Completed]
```

Execution Planner never executes immediately.
""")


def create_schemas() -> None:
    payload = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://aios.dev/schemas/runtime-engine-payload.schema.json",
        "title": "AIOS Runtime Engine Payload",
        "description": "Runtime Engine payloads v0.11.0. Orchestrate only. Never mutate workers. Packaging does not execute.",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "schema_version", "artifact_id", "type", "worker_id", "title", "summary",
            "entries", "status", "created_at",
        ],
        "properties": {
            "schema_version": {"$ref": "https://aios.dev/schemas/common.schema.json#/$defs/schemaVersion"},
            "artifact_id": {"$ref": "https://aios.dev/schemas/common.schema.json#/$defs/artifactId"},
            "type": {
                "type": "string",
                "enum": [
                    "runtime-status", "runtime-event", "runtime-log", "runtime-command",
                    "runtime-plan", "runtime-checkpoint", "runtime-execution-report",
                    "gate-runtime-report",
                ],
            },
            "worker_id": {"$ref": "https://aios.dev/schemas/common.schema.json#/$defs/kebabId"},
            "title": {"type": "string", "minLength": 1},
            "summary": {"type": "string", "minLength": 1},
            "entries": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "id", "entry_kind", "statement", "runtime_id", "target", "rule",
                        "result", "evidence", "impact", "severity", "recommendation",
                        "alternative_solution", "confidence", "source_paths", "unknowns",
                        "traceability", "folder_mirror",
                    ],
                    "properties": {
                        "id": {"type": "string", "minLength": 2},
                        "entry_kind": {"type": "string", "minLength": 1},
                        "statement": {"type": "string", "minLength": 1},
                        "runtime_id": {"type": "string", "minLength": 1},
                        "target": {"type": "string", "minLength": 1},
                        "rule": {"type": "string", "minLength": 1},
                        "result": {"type": "string", "enum": ["planned", "pass", "fail", "warn", "skip"]},
                        "evidence": {"type": "array", "items": {"type": "string"}},
                        "impact": {"type": "string", "minLength": 1},
                        "severity": {"$ref": "https://aios.dev/schemas/common.schema.json#/$defs/severity"},
                        "recommendation": {"type": "string"},
                        "alternative_solution": {"type": "string"},
                        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                        "source_paths": {"type": "array", "items": {"type": "string"}},
                        "unknowns": {"type": "array", "items": {"type": "string"}},
                        "traceability": {"type": "object"},
                        "folder_mirror": {"type": "string", "minLength": 1},
                    },
                },
            },
            "status": {"$ref": "https://aios.dev/schemas/common.schema.json#/$defs/artifactStatus"},
            "created_at": {"type": "string", "format": "date-time"},
        },
    }
    write(ROOT / "schemas" / "runtime-engine-payload.schema.json", json.dumps(payload, indent=2) + "\n")

    for name, const in [
        ("runtime-status", "runtime-status"),
        ("runtime-event", "runtime-event"),
        ("runtime-log", "runtime-log"),
        ("runtime-command", "runtime-command"),
        ("runtime-plan", "runtime-plan"),
        ("runtime-checkpoint", "runtime-checkpoint"),
        ("runtime-execution-report", "runtime-execution-report"),
        ("gate-runtime-report", "gate-runtime-report"),
    ]:
        write(ROOT / "schemas" / f"{name}.schema.json", json.dumps({
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": f"https://aios.dev/schemas/{name}.schema.json",
            "title": f"AIOS {name}",
            "allOf": [
                {"$ref": "https://aios.dev/schemas/runtime-engine-payload.schema.json"},
                {"type": "object", "properties": {"type": {"const": const}}},
            ],
        }, indent=2) + "\n")


def create_gates() -> None:
    write(ROOT / "validators" / "runtime-engine-schema-check" / "manifest.json", json.dumps({
        "schema_version": "1.0.0",
        "id": "runtime-engine-schema-check",
        "version": "0.1.0",
        "title": "Runtime Engine Schema Check",
        "description": "Deterministic checks for runtime-engine payloads.",
        "applies_to": [
            "runtime-status", "runtime-event", "runtime-log", "runtime-command",
            "runtime-plan", "runtime-checkpoint", "runtime-execution-report",
            "gate-runtime-report",
        ],
        "checks": [
            {"check_id": "schema-valid", "severity": "critical",
             "rule": "payload validates against runtime-engine-payload.schema.json"},
            {"check_id": "folder-mirror-partition", "severity": "critical",
             "rule": "folder_mirror under runtime/"},
            {"check_id": "raci-entry-kind", "severity": "critical",
             "rule": "entry_kind owned by worker_id per RACI.md"},
            {"check_id": "orchestrate-only", "severity": "critical",
             "rule": "mutate_workers/validators/reviewers must be false"},
            {"check_id": "no-worker-execution", "severity": "critical",
             "rule": "execute_workers must be false in packaging"},
            {"check_id": "plan-before-execute", "severity": "high",
             "rule": "execution-planner emits plans; never execute immediately"},
            {"check_id": "command-registry", "severity": "high",
             "rule": "command-interpreter kinds ⊆ command-registry.json"},
            {"check_id": "circular-rejection", "severity": "high",
             "rule": "dependency-resolver documents circular-rejection"},
        ],
    }, indent=2) + "\n")
    write(ROOT / "validators" / "runtime-engine-schema-check" / "SPEC.md",
          "# Runtime Engine Schema Check\n\nDeterministic gate for runtime payloads.\n")

    write(ROOT / "reviewers" / "runtime-engine-coverage-review" / "manifest.json", json.dumps({
        "schema_version": "1.0.0",
        "id": "runtime-engine-coverage-review",
        "version": "0.1.0",
        "title": "Runtime Engine Coverage Review",
        "description": "Qualitative coverage of single-command UX, plan-before-execute, resume/retry.",
        "applies_to": [
            "runtime-status", "runtime-plan", "runtime-command", "runtime-execution-report",
        ],
        "rubric_ref": "reviewers/runtime-engine-coverage-review/rubric/runtime-engine-coverage.json",
    }, indent=2) + "\n")
    write(ROOT / "reviewers" / "runtime-engine-coverage-review" / "rubric" / "runtime-engine-coverage.json",
          json.dumps({
              "schema_version": "1.0.0",
              "id": "runtime-engine-coverage",
              "version": "0.1.0",
              "title": "Runtime Engine Coverage Rubric",
              "score_mode": "weighted_0_1",
              "pass_threshold": 0.7,
              "criteria": [
                  {"id": "single-command-ux", "description": "@Run commands cover full user journeys", "weight": 0.2, "scale_min": 0, "scale_max": 1},
                  {"id": "plan-before-execute", "description": "Execution Planner never executes immediately", "weight": 0.2, "scale_min": 0, "scale_max": 1},
                  {"id": "resume-retry-checkpoint", "description": "Resume/retry/checkpoint coverage", "weight": 0.2, "scale_min": 0, "scale_max": 1},
                  {"id": "orchestrate-only", "description": "No worker/validator/reviewer mutation", "weight": 0.2, "scale_min": 0, "scale_max": 1},
                  {"id": "raci-compliance", "description": "No entry_kind overlap", "weight": 0.2, "scale_min": 0, "scale_max": 1},
              ],
              "veto_conditions": [
                  "mutate_workers", "mutate_validators", "mutate_reviewers",
                  "execute_workers", "analyze_product_repo",
              ],
          }, indent=2) + "\n")


def create_pipeline() -> None:
    pdir = ROOT / "pipelines" / PIPELINE
    worker_ids = [w["id"] for w in WORKERS]
    nodes = [{"id": wid, "node_type": "worker", "label": wid, "worker_class": "discovery"} for wid in worker_ids]
    edges = []
    for w in WORKERS:
        for dep in w["depends"]:
            edges.append({"predecessor": dep, "successor": w["id"], "type": "blocks", "relation": "requires"})

    write(pdir / "dependency-graph.json", json.dumps({
        "schema_version": "1.0.0",
        "artifact_id": "art_rt_pipeline_deps",
        "kind": "worker",
        "pipeline_id": PIPELINE,
        "title": "Runtime Engine Worker Dependency Graph",
        "created_at": NOW,
        "notes": [
            "Packaging only — workers not executed.",
            "Never modify worker/validator/reviewer implementations.",
            "Waves are a topological partition of the hard graph.",
        ],
        "nodes": nodes,
        "edges": edges,
        "extensions": {"schema": "pipeline-dependency-graph.schema.json", "allows_feature_workers": False},
    }, indent=2) + "\n")

    write(pdir / "pipeline.json", json.dumps({
        "schema_version": "1.0.0",
        "id": PIPELINE,
        "title": "Runtime Engine Pipeline",
        "version": PKG_VERSION,
        "status": "draft",
        "worker_class": "discovery",
        "gate_profile": "standard",
        "allows_feature_workers": False,
        "side_effect_ceiling": ["none", "runtime-write"],
        "workers": worker_ids,
        "dependency_graph_ref": {
            "path": f"pipelines/{PIPELINE}/dependency-graph.json",
            "artifact_id": "art_rt_pipeline_deps",
            "schema": "schemas/pipeline-dependency-graph.schema.json",
        },
        "waves": WAVES,
        "created_at": NOW,
        "primary_output_type": "runtime-execution-report",
        "validator_id": "runtime-engine-schema-check",
        "reviewer_id": "runtime-engine-coverage-review",
        "goal": {
            "title": "Execute AIOS via single-command orchestration",
            "problem": "Coordinate workers, validators, reviewers, and pipelines without requiring users to invoke workers manually.",
            "success_criteria": [
                {"id": "fifteen-workers", "description": "Fifteen runtime workers registered with full packages"},
                {"id": "single-command-ux", "description": "@Run commands registered and interpreted"},
                {"id": "plan-before-execute", "description": "Execution Planner never executes immediately"},
                {"id": "valid-waves", "description": "Waves are topological partition of hard graph"},
                {"id": "no-execution", "description": "Workers not executed in packaging"},
            ],
            "non_goals": [
                "Execute any worker",
                "Analyze any project",
                "Generate project artifacts",
                "Modify prior framework components",
            ],
        },
        "extensions": {
            "schema": "schemas/runtime-engine-payload.schema.json",
            "contract": "contracts/runtime-engine.md",
            "output_types": [
                "runtime-status", "runtime-event", "runtime-log", "runtime-command",
                "runtime-plan", "runtime-checkpoint", "runtime-execution-report",
                "gate-runtime-report",
            ],
            "consumes": COMMON_CONSUMES,
            "produces": ["runtime/"],
            "orchestrate_only": True,
            "commands": COMMANDS,
        },
    }, indent=2) + "\n")

    meta = {
        w["id"]: {
            "wave": w["wave"],
            "partition": w["partition"],
            "entry_kinds": w["entry_kinds"],
            "produces": [w["output_type"]],
        }
        for w in WORKERS
    }
    write(pdir / ".workers-meta.json", json.dumps(meta, indent=2) + "\n")
    write(pdir / "RACI.md", raci_md())
    write(pdir / "README.md", f"""# Runtime Engine Pipeline

**Version:** {PKG_VERSION} · **Workers:** {len(WORKERS)} · **Waves:** {len(WAVES)}

Single-command orchestration of AIOS. Packaging only — **do not execute workers**.

## Workers

{chr(10).join(f'- `{w["id"]}` — {w["title"]}' for w in WORKERS)}

## Commands

{chr(10).join(f'- `{c}`' for c in COMMANDS)}

## Verification

```bash
npm run aios:runtime-engine:smoke
```
""")
    write(pdir / "execution-graph.md", """# Execution Graph

```mermaid
flowchart TD
  RCL[runtime-configuration-loader] --> CI[command-interpreter]
  RCL --> DR[dependency-resolver]
  RCL --> ECM[execution-context-manager]
  RCL --> AM[artifact-manager]
  EB[event-bus] --> PT[progress-tracker]
  LE[logging-engine] --> PE[pipeline-engine]
  CI --> EP[execution-planner]
  DR --> EP
  ECM --> CM[checkpoint-manager]
  AM --> CM
  ECM --> PT
  EP --> WS[worker-scheduler]
  DR --> WS
  CM --> RE[retry-engine]
  WS --> RE
  CM --> RSE[resume-engine]
  ECM --> RSE
  WS --> PE
  RE --> PE
  RSE --> PE
  PT --> PE
  PE --> MO[master-orchestrator]
  EP --> MO
  CI --> MO
  RCL --> MO
```

Waves are topologically valid — no hard edge within the same wave.
""")


def create_contract() -> None:
    write(ROOT / "contracts" / "runtime-engine.md", f"""# Runtime Engine Contract

**Version:** {FW_VERSION} · **Pipeline:** `{PIPELINE}`

## Invariants

1. **Orchestrate only** — never modify worker, validator, or reviewer implementations.
2. **No product analysis** — never analyze repositories or generate business specs.
3. **No worker execution** in packaging milestone.
4. **Plan before execute** — Execution Planner never executes immediately.
5. **Single-command UX** — end users invoke `@Run …` only; never individual workers.
6. **Valid waves** — topological partition of the hard dependency graph.
7. **Deterministic / resumable** — support interruption, resume, incremental, retry.

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/` (alias `pipeline/`), `workflow/`, `templates/`, `schemas/`, `configs/`, `artifacts/`, `knowledge/`, `registry/`

## Produces

`runtime/` (orchestrator, execution, commands, state, logs, events, configs, checkpoint, resume, scheduler, templates)

## Artifact types

- `runtime-status` — context, progress, scheduler status
- `runtime-event` — event bus events
- `runtime-log` — structured logs
- `runtime-command` — parsed @Run intents
- `runtime-plan` — execution plans (pre-exec)
- `runtime-checkpoint` — checkpoint / rollback plans
- `runtime-execution-report` — master orchestrator summary
- `gate-runtime-report` — gate envelope

## Commands

{chr(10).join(f"- `{c}`" for c in COMMANDS)}

## Default configuration

See `runtime/configs/.ai-os.yaml`.

## Execution model

User Request → Command Interpreter → Execution Planner → Master Orchestrator → Pipeline Engine → Worker Scheduler → Workers → Validators → Reviewers → Checkpoint → Next Phase → Completed
""")


def update_registries() -> None:
    workers = json.loads((ROOT / "registry" / "workers.json").read_text())
    skills = json.loads((ROOT / "registry" / "skills.json").read_text())
    validators = json.loads((ROOT / "registry" / "validators.json").read_text())
    reviewers = json.loads((ROOT / "registry" / "reviewers.json").read_text())
    artifacts = json.loads((ROOT / "registry" / "artifact-types.json").read_text())

    for w in WORKERS:
        wid = w["id"]
        workers["entries"][wid] = {
            "id": wid,
            "path": f"workers/{wid}",
            "version": PKG_VERSION,
            "status": "draft",
            "description": w["mission"],
            "worker_class": "discovery",
            "pipeline": PIPELINE,
            "skill_id": wid,
            "depends_on_workers": w["depends"],
            "consumes": COMMON_CONSUMES,
            "produces": [w["partition"]],
        }
        skills["entries"][wid] = {
            "id": wid,
            "path": f"skills/{wid}",
            "version": PKG_VERSION,
            "status": "draft",
            "description": w["mission"],
        }

    validators["entries"]["runtime-engine-schema-check"] = {
        "id": "runtime-engine-schema-check",
        "path": "validators/runtime-engine-schema-check",
        "version": "0.1.0",
        "status": "draft",
        "description": "Deterministic checks for runtime-engine payloads.",
    }
    reviewers["entries"]["runtime-engine-coverage-review"] = {
        "id": "runtime-engine-coverage-review",
        "path": "reviewers/runtime-engine-coverage-review",
        "version": "0.1.0",
        "status": "draft",
        "description": "Qualitative coverage of runtime orchestration plans.",
    }

    for tid, desc in [
        ("runtime-status", "Runtime context / progress / scheduler status"),
        ("runtime-event", "Runtime event bus event"),
        ("runtime-log", "Structured runtime log entry"),
        ("runtime-command", "Parsed @Run command intent"),
        ("runtime-plan", "Pre-execution plan (never executes immediately)"),
        ("runtime-checkpoint", "Checkpoint / rollback plan"),
        ("runtime-execution-report", "Master orchestrator execution summary"),
        ("gate-runtime-report", "Gate envelope for runtime engine"),
    ]:
        artifacts["entries"][tid] = {
            "id": tid,
            "description": desc,
            "payload_kinds": ["json", "markdown", "yaml"],
            "status": "active",
        }

    for reg, data in [
        ("workers.json", workers), ("skills.json", skills),
        ("validators.json", validators), ("reviewers.json", reviewers),
        ("artifact-types.json", artifacts),
    ]:
        data["updated_at"] = NOW
        write(ROOT / "registry" / reg, json.dumps(data, indent=2) + "\n")


def main() -> None:
    create_output_tree()
    for w in WORKERS:
        create_worker(w)
    create_schemas()
    create_gates()
    create_pipeline()
    create_contract()
    update_registries()
    write(ROOT / "VERSION", FW_VERSION + "\n")
    print(f"Generated Runtime Engine @ {FW_VERSION} — {len(WORKERS)} workers, {len(WAVES)} waves")


if __name__ == "__main__":
    main()
