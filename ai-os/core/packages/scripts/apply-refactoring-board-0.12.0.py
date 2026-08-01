#!/usr/bin/env python3
"""
AIOS Refactoring Board — v0.12.0 safe simplification.

Applies ONLY safe changes that preserve RE / Spec / Validation / Review / Runtime / Qualification.
Does not delete registered workers (would break packaging smokes). Introduces Capability Layer
as the primary human/runtime mental model and consolidates duplicate config/docs.
"""
from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
FW_VERSION = "0.12.0"

# Capability layer: 8 capabilities replace 81-worker cognitive model
CAPABILITIES = [
    {
        "id": "discover",
        "title": "Discover",
        "purpose": "Map repository, contracts, registry, domain, runtime surface, gaps",
        "pipeline": "discovery",
        "workers": [
            "discover-repo-map", "discover-domain-map", "discover-contract-inventory",
            "discover-registry-audit", "discover-runtime-surface", "discover-gap-report",
        ],
        "decision": "KEEP",
        "run_commands": ["@Run full"],
    },
    {
        "id": "reverse-engineer",
        "title": "Reverse Engineer",
        "purpose": "Extract product knowledge: features, business rules, workflows, requirements, acceptance",
        "pipeline": "product-re",
        "workers": [
            "product-knowledge-ingest", "feature-surface-inventory", "business-rules-extractor",
            "product-architecture-observer", "product-analyst", "workflow-analyzer",
            "requirement-generator", "acceptance-criteria-generator", "product-re-gap-report",
        ],
        "decision": "KEEP",
        "run_commands": ["@Run full", "@Run incremental"],
    },
    {
        "id": "architect",
        "title": "Architect",
        "purpose": "Solution redesign: architecture-v2, tech stack, migration, folder structure",
        "pipeline": "solution-architecture",
        "workers": [
            "architecture-consultant", "tech-stack-consultant", "refactoring-consultant",
            "folder-structure-designer",
        ],
        "decision": "KEEP",
        "run_commands": ["@Run full"],
    },
    {
        "id": "specify",
        "title": "Specify",
        "purpose": "Specifications, tasks, roadmap, implementation plan",
        "pipeline": "specification-engineering",
        "workers": [
            "specification-generator", "task-generator", "roadmap-generator", "implementation-planner",
        ],
        "decision": "KEEP",
        "run_commands": ["@Run full"],
    },
    {
        "id": "validate",
        "title": "Validate",
        "purpose": "Deterministic artifact / schema / dependency / consistency validation + scores + report",
        "pipeline": "validation-engine",
        "workers": [
            "artifact-validator", "schema-validator", "dependency-validator", "pipeline-validator",
            "traceability-validator", "completeness-validator", "consistency-validator",
            "quality-scoring-engine", "validation-orchestrator", "validation-reporter",
        ],
        "decision": "GENERALIZE",
        "future": "Collapse 7 specialized validators into rule-pack driven validation-engine; keep orchestrator+reporter",
        "run_commands": ["@Run validate", "@Run full"],
    },
    {
        "id": "review",
        "title": "Review",
        "purpose": "Qualitative multi-dimension review + governance decision",
        "pipeline": "review-engine",
        "workers": [
            "architecture-reviewer", "product-reviewer", "business-reviewer",
            "specification-reviewer", "documentation-reviewer", "maintainability-reviewer",
            "scalability-reviewer", "extensibility-reviewer", "ai-quality-reviewer",
            "review-orchestrator", "final-decision-board",
        ],
        "decision": "GENERALIZE",
        "future": "Collapse 9 reviewers into rubric-driven review-engine; keep orchestrator+board",
        "run_commands": ["@Run review", "@Run full"],
    },
    {
        "id": "qualify",
        "title": "Qualify",
        "purpose": "Benchmark, metrics, certification, release Go/No-Go",
        "pipeline": "qualification-framework",
        "workers": [
            "reference-project-catalog", "benchmark-runner", "qualification-runner",
            "evaluation-engine", "stress-test-runner", "metrics-engine", "coverage-analyzer",
            "regression-runner", "certification-engine", "release-qualification-board",
        ],
        "decision": "MERGE",
        "future": "Merge evaluation+metrics+coverage into quality-metrics; merge stress+regression into resilience-bench",
        "run_commands": ["@Run benchmark"],
    },
    {
        "id": "runtime",
        "title": "Runtime",
        "purpose": "Single-command orchestration: config, plan, schedule, execute, checkpoint, resume, retry",
        "pipeline": "runtime-engine",
        "workers": [
            "runtime-configuration-loader", "event-bus", "logging-engine", "command-interpreter",
            "dependency-resolver", "execution-context-manager", "artifact-manager",
            "execution-planner", "checkpoint-manager", "progress-tracker", "worker-scheduler",
            "retry-engine", "resume-engine", "pipeline-engine", "master-orchestrator",
        ],
        "decision": "MERGE",
        "future": "4 subsystems: config-commands, planning, resilience(checkpoint+retry+resume), execute",
        "run_commands": [
            "@Run full", "@Run incremental", "@Run resume", "@Run retry",
            "@Run validate", "@Run review", "@Run benchmark", "@Run status", "@Run freeze",
        ],
    },
]

# Optional meta — not on critical @Run full path
OPTIONAL = {
    "id": "scaffold",
    "title": "Scaffold (optional meta)",
    "purpose": "Generate new framework packages from capability specs",
    "pipeline": "framework-generator",
    "decision": "MOVE",
    "note": "Move off critical path; invoke only via explicit @Run scaffold (future). Not required for RE/Spec/Validate/Review.",
    "workers": [
        "schema-generator", "artifact-generator", "prompt-generator", "worker-generator",
        "validator-generator", "reviewer-generator", "pipeline-generator", "test-generator",
        "documentation-generator", "project-bootstrap-generator",
        "generation-orchestrator", "generation-reporter",
    ],
}


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def delete_safe() -> list[str]:
    deleted = []
    untitled = ROOT / "Untitled"
    if untitled.exists():
        try:
            shutil.rmtree(untitled)
            deleted.append("Untitled/ (accidental nested .git stub — not part of AIOS)")
        except Exception as exc:  # noqa: BLE001
            deleted.append(f"Untitled/ DELETE deferred ({exc})")
    # Duplicate runtime config mirror — keep pointer README only
    dup = ROOT / "configs" / "runtime"
    if dup.exists():
        for p in list(dup.iterdir()):
            if p.name == "README.md":
                continue
            if p.is_file():
                p.unlink()
                deleted.append(f"core/packages/configs/runtime/{p.name} (duplicate of runtime/configs/)")
        write(
            dup / "README.md",
            """# Runtime configs (pointer)

Canonical runtime configuration lives at:

- `runtime/configs/.ai-os.yaml`
- `runtime/configs/run.yaml`
- `runtime/configs/workspace.yaml`

Do not maintain a second copy here (v0.12.0 consolidation).
""",
        )
        deleted.append("core/packages/configs/runtime/* duplicated YAML (replaced with pointer README)")
    return deleted


def write_capabilities() -> None:
    caps_dir = ROOT / "capabilities"
    write(
        caps_dir / "README.md",
        f"""# AIOS Capabilities (v{FW_VERSION})

**Primary mental model.** Prefer capabilities over 81 individual workers.

End users run:

```
@Run full
@Run incremental
@Run validate
@Run review
@Run benchmark
@Run resume
```

Workers remain registered for packaging/BC but are **implementation details** of capabilities.

| Capability | Pipeline | Decision |
|------------|----------|----------|
{chr(10).join(f"| `{c['id']}` | `{c['pipeline']}` | {c['decision']} |" for c in CAPABILITIES)}
| `scaffold` (optional) | `framework-generator` | MOVE off critical path |

See `docs/architecture/SIMPLIFIED_ARCHITECTURE.md` and `docs/architecture/REFACTORING_BOARD_REPORT.md`.
""",
    )
    registry = {
        "schema_version": "1.0.0",
        "updated_at": NOW,
        "framework_version": FW_VERSION,
        "capabilities": [
            {
                "id": c["id"],
                "title": c["title"],
                "purpose": c["purpose"],
                "pipeline": c["pipeline"],
                "workers": c["workers"],
                "decision": c["decision"],
                "run_commands": c["run_commands"],
                **({"future": c["future"]} if "future" in c else {}),
            }
            for c in CAPABILITIES
        ],
        "optional": OPTIONAL,
        "run_full_order": [
            "discover", "reverse-engineer", "architect", "specify", "validate", "review",
        ],
        "notes": [
            "Capability layer is additive for DX; underlying workers preserved for BC.",
            "Physical worker merges deferred until execution phase + adapter layer exist.",
        ],
    }
    write(caps_dir / "registry.json", json.dumps(registry, indent=2) + "\n")

    for c in CAPABILITIES:
        write(
            caps_dir / c["id"] / "README.md",
            f"""# Capability — `{c["id"]}`

**Title:** {c["title"]}  
**Pipeline:** `{c["pipeline"]}`  
**Board decision:** {c["decision"]}

## Purpose

{c["purpose"]}

## @Run commands

{chr(10).join(f"- `{cmd}`" for cmd in c["run_commands"])}

## Implementation workers (packaging detail)

{chr(10).join(f"- `{w}`" for w in c["workers"])}

{f"## Future simplification{chr(10)}{chr(10)}{c['future']}{chr(10)}" if "future" in c else ""}
""",
        )

    write(
        caps_dir / "scaffold" / "README.md",
        f"""# Capability — `scaffold` (optional)

**Pipeline:** `framework-generator`  
**Board decision:** MOVE off critical path

{OPTIONAL["note"]}

## Workers

{chr(10).join(f"- `{w}`" for w in OPTIONAL["workers"])}
""",
    )


def write_simplified_architecture() -> None:
    write(
        ROOT / "architecture" / "SIMPLIFIED_ARCHITECTURE.md",
        f"""# AIOS Simplified Architecture (v{FW_VERSION})

## Mental model (8 capabilities)

```mermaid
flowchart LR
  CMD["@Run …"] --> RT[runtime]
  RT --> D[discover]
  RT --> RE[reverse-engineer]
  RT --> A[architect]
  RT --> S[specify]
  RT --> V[validate]
  RT --> R[review]
  RT --> Q[qualify]
```

| Layer | Responsibility | User command |
|-------|----------------|--------------|
| **runtime** | Orchestrate only | all `@Run` |
| **discover** | Repo/contract map | `@Run full` |
| **reverse-engineer** | Product knowledge | `@Run full` / `incremental` |
| **architect** | Solution redesign | `@Run full` |
| **specify** | Specs / tasks / roadmap | `@Run full` |
| **validate** | Deterministic gates | `@Run validate` |
| **review** | Qualitative governance | `@Run review` |
| **qualify** | Certify / benchmark | `@Run benchmark` |

Optional: **scaffold** (`framework-generator`) — meta tooling, not on `@Run full`.

## Target folder structure (logical)

```
ai-os/
  docs/capabilities/          # primary DX model
  runtime/               # execution
  core/packages/pipelines/             # capability bindings
  core/packages/workers/               # implementation details (BC)
  core/packages/contracts/             # normative invariants
  core/packages/schemas/               # shared contracts
  core/packages/registry/              # indexes
  docs/architecture/          # control-plane docs
  core/packages/templates/             # scaffolds
  <produce packs>/       # domain outputs (features, validation, reviews, …)
```

## What end users need

1. `runtime/configs/.ai-os.yaml`
2. One command: `@Run full`
3. Artifacts under declared produce packs

They do **not** need to know 81 worker ids.
""",
    )


def write_board_report(deleted: list[str]) -> None:
    worker_rows = []
    for c in CAPABILITIES:
        for w in c["workers"]:
            worker_rows.append(f"| `{w}` | `{c['id']}` | {c['decision']} (capability-level) |")
    for w in OPTIONAL["workers"]:
        worker_rows.append(f"| `{w}` | `scaffold` | MOVE (optional meta) |")

    write(
        ROOT / "architecture" / "REFACTORING_BOARD_REPORT.md",
        f"""# AI Framework Refactoring Board Report

**Version:** {FW_VERSION}  
**Date:** {NOW[:10]}  
**Stance:** Zero attachment. Legacy software. Justify or remove.

## Board

Principal Software Architect · AI Platform Architect · Staff Runtime Engineer · Senior Product Engineer · Principal Software Engineer · Platform Tech Lead

## Executive Summary

AIOS grew to **81 workers**, **9 pipelines**, **~1700 directories**, **~3700 files**, and **~970 markdown docs**. Capabilities are real and must be preserved, but the **cognitive model is worker-scaled**, not capability-scaled.

**Applied in v0.12.0 (safe):**

1. Introduce **Capability Layer** (8 + 1 optional) as primary DX / `@Run` model
2. Document **MERGE/GENERALIZE** targets for validate / review / qualify / runtime
3. **MOVE** Framework Generator (`scaffold`) off `@Run full` critical path
4. **DELETE** duplicate runtime config copies + accidental `Untitled/` stub
5. Rewrite entry docs (`AGENTS.md`, simplified architecture) around capabilities

**Deferred (unsafe without execution adapters):** physical deletion/merge of registered workers — would break packaging registration smokes and destroy BC for Sprint 0–11 artifacts.

## Current Architecture

| Engine | Pipeline | Workers (approx) |
|--------|----------|------------------|
| Discovery | `discovery` | 6 |
| Product RE | `product-re` | 9 |
| Solution Architecture | `solution-architecture` | 4 |
| Specification Engineering | `specification-engineering` | 4 |
| Validation | `validation-engine` | 10 |
| Review | `review-engine` | 11 |
| Framework Generator | `framework-generator` | 12 |
| Qualification | `qualification-framework` | 10 |
| Runtime | `runtime-engine` | 15 |

Plus Core Engine (`ai-os/core`), registries, schemas, produce packs.

## Problems

1. **Worker explosion** — 81 peers with near-clone SKILL shells in generator/qualification/runtime waves
2. **Parallel taxonomies** — pipelines vs produce folders vs engines vs gates all name the same ideas differently
3. **Runtime micro-workers** — 15 orchestration workers for what is 4 subsystems
4. **Validation/Review micro-workers** — rule packs modeled as separate packages
5. **Meta on critical path** — Framework Generator sits beside RE as if required for `@Run full`
6. **Doc surface** — ~970 MD files; many partition READMEs are empty shells
7. **Config duplication** — `core/packages/configs/runtime/` mirrored `runtime/configs/`
8. **Token cost** — agents load worker forests instead of capability maps

## Decisions (capability level)

| Capability | Decision | Rationale |
|------------|----------|-----------|
| discover | KEEP | Distinct lifecycle; low duplication |
| reverse-engineer | KEEP | Required capability |
| architect | KEEP | Required capability |
| specify | KEEP | Required capability |
| validate | GENERALIZE | 7 validators → rule packs + orchestrator/reporter |
| review | GENERALIZE | 9 reviewers → rubrics + orchestrator/board |
| qualify | MERGE | evaluation+metrics+coverage; stress+regression |
| runtime | MERGE | 15 → 4 subsystems |
| scaffold | MOVE | Optional meta; not required for RE/Spec/Validate/Review |

## Delete List (applied vs deferred)

### Applied

{chr(10).join(f"- {d}" for d in deleted) if deleted else "- (none)"}

### Deferred (cannot safely delete without adapters)

- Individual validation workers (`artifact-validator` … `consistency-validator`) — **GENERALIZE later**
- Individual review workers (`*-reviewer` except orchestrator/board) — **GENERALIZE later**
- Runtime micro-workers (event-bus, logging-engine, checkpoint/retry/resume split, etc.) — **MERGE later**
- Qualification micro-workers — **MERGE later**
- Framework Generator workers — **KEEP packages**, MOVE off critical path only
- Produce-pack TEMPLATE.md shells — needed as partition markers for existing contracts

## Merge Plan

| Merge into | Sources | When safe |
|------------|---------|-----------|
| `validation-ruleset` | 7 validators | After rule-pack schema + one executor |
| `review-rubric-runner` | 9 reviewers | After shared rubric runner |
| `runtime-observability` | event-bus + logging-engine | After event/log unified schema |
| `runtime-resilience` | checkpoint + retry + resume | After single state machine |
| `runtime-state` | context + progress + artifact-manager | After unified state store |
| `quality-metrics` | evaluation + metrics + coverage | After shared scorecard |
| `resilience-bench` | stress + regression | After shared bench harness |

## Split Plan

| Component | Split? | Why |
|-----------|--------|-----|
| `master-orchestrator` | NO | Already SRP as UX entry |
| `final-decision-board` | NO | Governance boundary clear |
| Core `orchestrator` vs Runtime `master-orchestrator` | RENAME later | Naming collision — Core stays control-plane; Runtime is product UX |

## Rename Plan (deferred physical)

| Current | Proposed | Why |
|---------|----------|-----|
| `framework-generator` pipeline | `scaffold` | Matches optional capability |
| Core module `orchestrator` | `task-orchestrator` | Disambiguate from Master Orchestrator |
| Produce `docs/architecture/` consume alias | keep → `artifacts/product-architecture/` | Already documented; enforce in DX |

## Simplification Plan

1. **Now:** Capability registry + `@Run` maps to capability order  
2. **Next:** Adapter that expands capability → worker list at runtime (no user-facing worker ids)  
3. **Then:** Physically merge micro-workers behind adapters; shrink registry  
4. **Finally:** Delete obsolete worker packages + update smokes  

## New Runtime Design

```
@Run <cmd>
  → command-interpreter (capability intent)
  → execution-planner (capability graph)
  → master-orchestrator
  → for capability in order:
       pipeline-engine.run(capability.pipeline)
       checkpoint
  → execution-summary
```

Users never select workers.

## New Pipeline (logical `@Run full`)

```mermaid
flowchart TD
  D[discover] --> RE[reverse-engineer]
  RE --> A[architect]
  A --> S[specify]
  S --> V[validate]
  V --> R[review]
```

`@Run benchmark` → `qualify` only  
`@Run validate` / `@Run review` → single capability  
`@Run resume` / `@Run retry` → runtime resilience  

## New Dependency Graph

Capability edges only (above). Worker graphs remain internal to each pipeline until physical merge.

## Migration Strategy

1. v0.12.0 — Capability layer + docs (this release)  
2. v0.13.x — Runtime expands capabilities → workers (transparent)  
3. v0.14.x — Merge validate/review micro-workers behind one package each  
4. v0.15.x — Merge runtime 15 → 4; delete obsolete ids from registry  

## Backward Compatibility Plan

- All worker ids, pipeline ids, schemas remain valid  
- Smokes unchanged except VERSION + capabilities presence  
- `scaffold` / `framework-generator` still registered  
- Produce pack paths unchanged  

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Physical worker deletion breaks smokes | High | Deferred |
| Dual models (capability + worker) confuse agents | Medium | AGENTS.md leads with capabilities |
| Framework Generator users expect critical-path status | Low | Documented as optional scaffold |

## Implementation Order

1. Capability registry + simplified architecture (done)  
2. Config dedupe + junk delete (done)  
3. AGENTS / contracts / release notes (done)  
4. Runtime command registry references capabilities (done)  
5. Future: runtime adapter + physical merges  

## Per-worker decision index

| Worker | Capability | Decision |
|--------|------------|----------|
{chr(10).join(worker_rows)}

## Gate packages

| Package | Decision |
|---------|----------|
| `*-schema-check` (9) | GENERALIZE later → one parameterized gate |
| `*-coverage-review` (9) | GENERALIZE later → one parameterized rubric |

## Folder decisions

| Folder | Decision |
|--------|----------|
| `docs/capabilities/` | CREATE (primary DX) |
| `runtime/` | KEEP (execution root) |
| `core/packages/workers/` | KEEP (implementation; shrink later) |
| `core/packages/scaffold/` | MOVE (optional meta) |
| `governance/qualification/` | KEEP |
| `Untitled/` | DELETE |
| `core/packages/configs/runtime/*.yaml` | DELETE duplicates |
| Produce packs (`artifacts/features/`, `artifacts/validation/`, …) | KEEP |
| `docs/architecture/` | KEEP + add simplified docs |

## Success criteria check

| Criterion | v0.12.0 status |
|-----------|----------------|
| Fewer components (cognitive) | YES — 8 capabilities vs 81 workers |
| Fewer components (physical workers) | DEFERRED — unsafe |
| Lower complexity for users | YES — `@Run` + capabilities |
| Preserve RE/Spec/Validate/Review/Runtime/Qualify | YES |
| Easier onboarding | YES — SIMPLIFIED_ARCHITECTURE + capabilities README |
""",
    )


def update_command_registry() -> None:
    path = ROOT / "runtime" / "commands" / "command-registry.json"
    data = {
        "schema_version": "1.0.0",
        "updated_at": NOW,
        "framework_version": FW_VERSION,
        "commands": [
            "@Run full", "@Run incremental", "@Run phase 1", "@Run phase 2",
            "@Run resume", "@Run retry", "@Run validate", "@Run review",
            "@Run freeze", "@Run status", "@Run benchmark",
        ],
        "capability_map": {
            "@Run full": ["discover", "reverse-engineer", "architect", "specify", "validate", "review"],
            "@Run incremental": ["reverse-engineer"],
            "@Run validate": ["validate"],
            "@Run review": ["review"],
            "@Run benchmark": ["qualify"],
            "@Run resume": ["runtime"],
            "@Run retry": ["runtime"],
            "@Run freeze": ["runtime"],
            "@Run status": ["runtime"],
            "@Run phase 1": ["discover", "reverse-engineer"],
            "@Run phase 2": ["architect", "specify"],
        },
        "note": "v0.12.0 — commands resolve to capabilities; workers are implementation details.",
    }
    write(path, json.dumps(data, indent=2) + "\n")


def update_agents() -> None:
    write(
        ROOT / "AGENTS.md",
        f"""# AIOS Agent Entry Contract

**Framework {FW_VERSION} — Capability-first.**

Read `docs/architecture/SIMPLIFIED_ARCHITECTURE.md` and `docs/capabilities/README.md` before worker forests.

## User / agent UX

```
@Run full
@Run incremental
@Run validate
@Run review
@Run benchmark
@Run resume
```

Do **not** manually invoke individual workers for normal operation.

## Capabilities (primary)

| Capability | Purpose |
|------------|---------|
| `discover` | Repo / contract / registry map |
| `reverse-engineer` | Product knowledge extraction |
| `architect` | Solution redesign |
| `specify` | Specs / tasks / roadmap |
| `validate` | Deterministic validation |
| `review` | Qualitative governance |
| `qualify` | Benchmark / certify |
| `runtime` | Orchestration only |
| `scaffold` | Optional meta generator (not on `@Run full`) |

## Mission boundaries

| Allowed | Forbidden |
|---------|-----------|
| Extend capabilities + pipelines | Feature Workers |
| Orchestrate via Runtime `@Run` | Manually chaining 81 workers as UX |
| Soft-read prior packs | Mutate core/packages/workers/validators/reviewers from Runtime/Qualification |
| Packaging registration smokes | Executing benchmarks / workers in packaging milestones |

## Core Engine

Import: `@/ai-os/core` → `createAiosCore()`.

Smokes: `aios:core` · `discovery` · `product-re` · `solution-architecture` · `specification-engineering` · `validation-engine` · `review-engine` · `framework-generator` · `qualification-framework` · `runtime-engine` · `aios:capabilities:smoke`

## Refactoring

Board report: `docs/architecture/REFACTORING_BOARD_REPORT.md`  
Physical worker merges: deferred (BC). Capability layer: applied.
""",
    )


def write_release_notes(deleted: list[str]) -> None:
    write(
        ROOT / "RELEASE_NOTES_0.12.0.md",
        f"""# AIOS Release Notes — 0.12.0

**Date:** {NOW[:10]}  
**Phase:** Refactoring Board — Capability-first simplification  
**Stance:** Zero attachment; safe changes only

## Executive summary

Introduces an **8-capability mental model** as the primary architecture for humans and `@Run` commands. Preserves all required capabilities (RE, Spec, Validation, Review, Runtime, Qualification). Physical worker deletion/merge deferred to protect packaging BC.

## Applied

- `docs/capabilities/` registry + per-capability READMEs
- `docs/architecture/SIMPLIFIED_ARCHITECTURE.md`
- `docs/architecture/REFACTORING_BOARD_REPORT.md` (full keep/merge/delete decisions)
- `@Run` → capability map in `runtime/commands/command-registry.json`
- Deleted duplicate `core/packages/configs/runtime/*.yaml` (pointer README remains)
- Removed accidental `Untitled/` stub
- Rewrote `AGENTS.md` capability-first

## Deferred (explicit)

Physical merge/delete of micro-workers in validate / review / qualify / runtime — requires execution adapters. See board report.

## Before vs After

| Metric | Before (0.11.0) | After (0.12.0) |
|--------|-----------------|----------------|
| User-facing units | 81 workers | **8 capabilities** (+1 optional scaffold) |
| `@Run full` mental steps | worker forest | **6 capabilities** |
| Registered workers (physical) | 81 | 81 (BC preserved) |
| Pipelines | 9 | 9 (scaffold marked optional) |
| Duplicate runtime YAML | 2 locations | **1 canonical** |
| Accidental `Untitled/` | present | **removed** |

## Board scores (subjective)

| Score | Before | After |
|-------|--------|-------|
| Architecture | 4/10 | **7/10** |
| Simplicity | 3/10 | **7/10** |
| Maintainability | 4/10 | **6/10** (docs); physical still heavy |
| Extensibility | 6/10 | **8/10** (capability extension point) |
| Production readiness | 5/10 | **6/10** (clearer UX; execution still packaging) |

## Estimated reductions (cognitive / future physical)

| Estimate | Value |
|----------|-------|
| Cognitive component reduction | ~90% (81 → 8) |
| Deferred physical worker removals | ~35–45 (validate/review/runtime/qualify micro-workers) |
| Token reduction for agents (entry path) | High — load capabilities first |
| Maintenance reduction (once physical merges land) | Medium–High |

## Deleted this release

{chr(10).join(f"- {d}" for d in deleted) if deleted else "- (none)"}

## Compatibility

- All pipeline ids and worker ids unchanged
- Required capabilities preserved
- Framework Generator remains registered as optional `scaffold`

## Verification

```bash
npm run aios:capabilities:smoke
npm run aios:runtime-engine:smoke
npm run aios:qualification-framework:smoke
npm run aios:discovery:smoke
```
""",
    )


def write_migrations() -> None:
    path = ROOT / "architecture" / "MIGRATIONS.md"
    text = path.read_text()
    block = f"""## 0.11.0 → 0.12.0 ({NOW[:10]})

Refactoring Board capability-first simplification (workers not deleted).

| Change | Detail |
|--------|--------|
| Capabilities | New `docs/capabilities/registry.json` — 8 primary + scaffold optional |
| DX | AGENTS + SIMPLIFIED_ARCHITECTURE lead with `@Run` → capabilities |
| Cleanup | Removed duplicate `core/packages/configs/runtime` YAML; removed `Untitled/` |
| Deferred | Physical validate/review/runtime/qualify micro-worker merges |

"""
    if "## 0.11.0 → 0.12.0" not in text:
        # insert after title/policy
        marker = "## 0.10.0 → 0.11.0"
        if marker in text:
            text = text.replace(marker, block + marker)
        else:
            text = text + "\n" + block
        path.write_text(text)


def update_pipeline_contract() -> None:
    path = ROOT / "contracts" / "pipeline.md"
    text = path.read_text()
    note = """
## Capability model (v0.12.0+)

Prefer `docs/capabilities/registry.json` over enumerating workers. `@Run full` expands to:

`discover` → `reverse-engineer` → `architect` → `specify` → `validate` → `review`

`framework-generator` is optional **scaffold**, not on the critical path.
"""
    if "Capability model (v0.12.0+)" not in text:
        write(path, text.rstrip() + "\n" + note)


def main() -> None:
    deleted = delete_safe()
    write_capabilities()
    write_simplified_architecture()
    write_board_report(deleted)
    update_command_registry()
    update_agents()
    write_release_notes(deleted)
    write_migrations()
    update_pipeline_contract()
    write(ROOT / "VERSION", FW_VERSION + "\n")
    print(json.dumps({"ok": True, "version": FW_VERSION, "deleted": deleted}, indent=2))


if __name__ == "__main__":
    main()
