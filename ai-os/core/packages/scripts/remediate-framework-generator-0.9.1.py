#!/usr/bin/env python3
"""Sprint 9 Board HOLD remediation → v0.9.1 (packaging only)."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
PIPELINE = "framework-generator"
PKG_VERSION = "0.1.1"
FW_VERSION = "0.9.1"

COMMON_CONSUMES = [
    "templates", "schemas", "workers", "validators", "reviewers",
    "pipelines", "knowledge", "configs", "artifacts", "registry",
]

GENERATORS = [
    {"id": "schema-generator", "title": "Schema Generator",
     "mission": "Generate JSON Schemas, markdown templates, configuration schemas, validation schemas, and artifact schemas from capability specs.",
     "entry_kinds": ["json-schema", "config-schema", "validation-schema", "artifact-schema", "markdown-template"],
     "depends": [], "modes": ["JSON Schema", "Markdown Templates", "Configuration Schemas", "Validation Schemas", "Artifact Schemas"],
     "partition_prefix": "core/packages/scaffold/generators/schema-generator/"},
    {"id": "artifact-generator", "title": "Artifact Generator",
     "mission": "Generate artifact definitions: folder structure, contracts, naming rules, lifecycle, dependencies, versioning, retention policy.",
     "entry_kinds": ["artifact-contract", "folder-structure", "naming-rules", "lifecycle", "retention-policy"],
     "depends": ["schema-generator"], "modes": ["Folder Structure", "Artifact Contracts", "Naming Rules", "Lifecycle", "Retention Policy"],
     "partition_prefix": "core/packages/scaffold/generators/artifact-generator/"},
    {"id": "prompt-generator", "title": "Prompt Generator",
     "mission": "Generate production-quality prompts for builder, reviewer, validator, improve, freeze, and execution roles.",
     "entry_kinds": ["builder-prompt", "reviewer-prompt", "validator-prompt", "improve-prompt", "freeze-prompt", "execution-prompt"],
     "depends": [], "modes": ["Builder Prompt", "Reviewer Prompt", "Validator Prompt", "Improve Prompt", "Freeze Prompt", "Execution Prompt"],
     "partition_prefix": "core/packages/scaffold/generators/prompt-generator/"},
    {"id": "worker-generator", "title": "Worker Generator",
     "mission": "Generate Worker package skeleton (README, skill, manifest, examples pointers) from capability specs. Does NOT generate validators, reviewers, tests, or docs — see overlap table in core/packages/contracts/framework-generator.md.",
     "entry_kinds": ["worker-package", "worker-readme", "worker-skill", "worker-manifest"],
     "depends": ["schema-generator"], "modes": ["Worker README", "Worker skill", "Worker manifest", "Examples scaffold pointers"],
     "partition_prefix": "core/packages/scaffold/generators/worker-generator/"},
    {"id": "validator-generator", "title": "Validator Generator",
     "mission": "Generate validator packages (artifact, schema, traceability, dependency, completeness, consistency, quality checks).",
     "entry_kinds": ["artifact-validation", "schema-validation", "traceability-validation", "dependency-validation",
                     "completeness-validation", "consistency-validation", "quality-validation"],
     "depends": ["worker-generator", "schema-generator"], "modes": ["Artifact", "Schema", "Traceability", "Dependency", "Completeness", "Consistency", "Quality"],
     "partition_prefix": "core/packages/scaffold/generators/validator-generator/"},
    {"id": "reviewer-generator", "title": "Reviewer Generator",
     "mission": "Generate reviewer packages and rubrics for architecture, business, specification, quality, documentation, security, performance review.",
     "entry_kinds": ["architecture-review", "business-review", "specification-review", "quality-review",
                     "documentation-review", "security-review", "performance-review"],
     "depends": ["worker-generator", "schema-generator"], "modes": ["Architecture", "Business", "Specification", "Quality", "Documentation", "Security", "Performance"],
     "partition_prefix": "core/packages/scaffold/generators/reviewer-generator/"},
    {"id": "pipeline-generator", "title": "Pipeline Generator",
     "mission": "Generate pipeline.json, dependency-graph.json, waves, retry/checkpoint/rollback strategies.",
     "entry_kinds": ["sequential-pipeline", "parallel-pipeline", "conditional-pipeline", "resume-pipeline",
                     "incremental-pipeline", "retry-strategy", "checkpoint-strategy", "rollback-strategy"],
     "depends": ["worker-generator", "validator-generator", "reviewer-generator"],
     "modes": ["Sequential", "Parallel", "Conditional", "Resume", "Incremental", "Retry", "Checkpoint", "Rollback"],
     "partition_prefix": "core/packages/scaffold/generators/pipeline-generator/"},
    {"id": "test-generator", "title": "Test Generator",
     "mission": "Generate testcases, validation cases, edge cases, regression tests, sample projects, acceptance tests for generated components.",
     "entry_kinds": ["test-case", "validation-case", "edge-case", "regression-test", "sample-project", "acceptance-test"],
     "depends": ["worker-generator"], "modes": ["Test Cases", "Validation Cases", "Edge Cases", "Regression", "Sample Projects", "Acceptance"],
     "partition_prefix": "core/packages/scaffold/generators/test-generator/"},
    {"id": "documentation-generator", "title": "Documentation Generator",
     "mission": "Generate architecture docs, usage guides, developer guides, migration guides, changelogs, release notes for generated components.",
     "entry_kinds": ["architecture-doc", "usage-guide", "example-doc", "developer-guide", "migration-guide", "changelog", "release-notes"],
     "depends": ["worker-generator", "pipeline-generator"],
     "modes": ["Architecture Docs", "Usage Guides", "Examples", "Developer Guides", "Migrations", "Changelogs", "Release Notes"],
     "partition_prefix": "core/packages/scaffold/generators/documentation-generator/"},
    {"id": "project-bootstrap-generator", "title": "Project Bootstrap Generator",
     "mission": "Bootstrap full AI OS projects: repo init, folders, worker/pipeline registration patches, configs, default templates.",
     "entry_kinds": ["repo-init", "folder-scaffold", "worker-registration", "pipeline-registration", "config-generation", "default-templates"],
     "depends": [g["id"] for g in []],  # filled below
     "modes": ["Repo Init", "Folder Scaffold", "Worker Registration", "Pipeline Registration", "Config Generation", "Default Templates"],
     "partition_prefix": "core/packages/scaffold/generators/project-bootstrap-generator/"},
]

GENERATORS[-1]["depends"] = [g["id"] for g in GENERATORS[:-1]]

ORCHESTRATOR = {
    "id": "generation-orchestrator",
    "title": "Generation Orchestrator",
    "mission": "Record wave order, merge partitioned scaffold plans, dedupe by generation_id+entry_kind, emit framework-generation-status.",
    "entry_kinds": ["plan", "order", "merge", "dedupe", "overall-status"],
    "depends": [g["id"] for g in GENERATORS],
    "partition": "core/packages/scaffold/status/generation-orchestrator/",
    "output_type": "framework-generation-status",
}

REPORTER = {
    "id": "generation-reporter",
    "title": "Generation Reporter",
    "mission": "Emit human-readable framework-generation-report and gate-framework-generation-report envelope from merged status.",
    "entry_kinds": ["summary", "critical-gaps", "overall-recommendation", "gate-envelope"],
    "depends": ["generation-orchestrator"],
    "partition": "core/packages/scaffold/reports/generation-reporter/",
    "output_type": "framework-generation-report",
}

# Topologically valid waves (C1)
WAVES = [
    ["schema-generator", "prompt-generator"],
    ["artifact-generator"],
    ["worker-generator"],
    ["validator-generator", "reviewer-generator"],
    ["pipeline-generator"],
    ["test-generator", "documentation-generator"],
    ["project-bootstrap-generator"],
    ["generation-orchestrator"],
    ["generation-reporter"],
]

ALL_WORKERS = [g["id"] for g in GENERATORS] + [ORCHESTRATOR["id"], REPORTER["id"]]

SKILL_PROCEDURES: dict[str, str] = {
    "schema-generator": """1. Parse `generation-spec` (`capability`, `target_generator`, `modes[]`).
2. Map each mode to schema template under `core/packages/templates/` + `$ref` targets in `core/packages/schemas/common.schema.json`.
3. Plan `json-schema` / `config-schema` / `validation-schema` / `artifact-schema` / `markdown-template` entries.
4. Emit one entry per owned entry_kind (or UNKNOWN for out-of-scope modes).
5. `output_plan.artifacts` lists planned schema paths; `output_plan.registries` must include `schemas`.""",
    "artifact-generator": """1. Require upstream `schema-generator` plans or `core/packages/schemas/` refs in evidence.
2. Plan artifact-contract + folder-structure from `core/packages/templates/artifact/`.
3. Derive naming-rules from `docs/architecture/TRACEABILITY.md` + registry conventions.
4. Document lifecycle, retention-policy with semver + deprecation in `output_plan.migration`.
5. Never plan JSON Schema field typing (owned by schema-generator).""",
    "prompt-generator": """1. Load role from spec (`builder` | `reviewer` | `validator` | `improve` | `freeze` | `execution`).
2. Bind prompt sections: ROLE, GOAL, INPUT, OUTPUT, STOP, NEGATIVE examples.
3. Reference `core/packages/templates/skill/SKILL.md` structure for builder prompts only.
4. Emit all six prompt entry_kinds when spec.mode=full; else UNKNOWN for skipped roles.
5. Do not embed worker business logic — framework prompts only.""",
    "worker-generator": """1. Copy plan from `core/packages/templates/worker/` layout (README, skill.md, manifest.json, examples/, testcases/).
2. Map spec.outputs.worker_id → kebab-case; validate against `core/packages/schemas/worker-manifest.schema.json`.
3. Plan worker-package + worker-readme + worker-skill + worker-manifest entries only.
4. Do NOT plan validator.md, reviewer.md, tests, or release docs (other generators own those).
5. `output_plan.registries`: workers + skills only (registration patches owned by bootstrap).""",
    "validator-generator": """1. Require planned worker id from spec or upstream worker-generator evidence.
2. For each validation mode, plan `core/packages/validators/<id>/manifest.json` + SPEC.md from `core/packages/templates/validation/`.
3. Map entry_kind → check_id list; cite `core/packages/schemas/validator-spec.schema.json`.
4. Seven validation modes must appear as entries or explicit UNKNOWN.
5. Never plan reviewer rubrics or worker skills.""",
    "reviewer-generator": """1. Require worker id + pipeline context from spec.
2. Plan `core/packages/reviewers/<id>/manifest.json` + `rubric/*.json` with criteria, weights, veto_conditions.
3. Seven review modes as separate entries; security/performance require explicit spec flags.
4. Rubric must reference `core/packages/schemas/reviewer-spec.schema.json`.
5. Never plan deterministic validator checks.""",
    "pipeline-generator": """1. Require worker ids for `pipeline.workers[]` from spec.outputs.
2. Plan pipeline.json + dependency-graph.json; compute waves via topological sort (never same-wave hard edges).
3. Map strategy modes: retry/checkpoint/rollback as extensions metadata entries.
4. Cite `core/packages/schemas/pipeline.schema.json` and `core/packages/schemas/pipeline-dependency-graph.schema.json`.
5. Registration patches owned by project-bootstrap-generator.""",
    "test-generator": """1. Bind to worker id from spec; load `core/packages/templates/worker/testcases/` as baseline.
2. Plan case-01..05 JSON fixtures with input spec + expected entry_kind + severity.
3. Cover happy path, missing spec, invalid schema ref, registry gap, budget exceed.
4. sample-project entry_kind plans minimal ai-os/ tree scaffold only.
5. Does not generate worker README or skills.""",
    "documentation-generator": """1. Require worker/pipeline ids from spec evidence paths.
2. Plan architecture-doc, usage-guide, developer-guide, migration-guide, changelog, release-notes entries.
3. Migration entries must reference semver bump + `docs/architecture/MIGRATIONS.md` row template.
4. example-doc points to `examples/` not duplicate worker-generator scaffold.
5. Never plan validator/reviewer specs.""",
    "project-bootstrap-generator": """1. Aggregate plans from all upstream generators (glob `core/packages/scaffold/generators/*/`).
2. Plan repo-init + folder-scaffold from `core/packages/scaffold/scaffolding/`.
3. Sole owner of worker-registration + pipeline-registration registry patch plans under `core/packages/scaffold/registries/`.
4. config-generation emits `core/packages/configs/` starter files; default-templates copies from `core/packages/templates/`.
5. Emit six entry_kinds minimum for full bootstrap spec.""",
    "generation-orchestrator": """1. Read `core/packages/pipelines/framework-generator/pipeline.json` waves → emit plan + order entries.
2. Glob `core/packages/scaffold/generators/*/**` scaffold plans; cite paths in merge evidence.
3. Dedupe key: `generation_id` + `entry_kind`; emit dedupe summary entry.
4. overall-status aggregates severity counts; never mutate generator outputs.
5. Emit `framework-generation-status` under `core/packages/scaffold/status/generation-orchestrator/`.""",
    "generation-reporter": """1. Consume merged `framework-generation-status` from orchestrator evidence.
2. Emit summary + critical-gaps + overall-recommendation entries.
3. gate-envelope entry wraps report metadata for `gate-framework-generation-report` type.
4. Never execute generation or write registry files.
5. Partition under `core/packages/scaffold/reports/generation-reporter/`.""",
}


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def raci_md() -> str:
    rows = []
    for g in GENERATORS:
        for k in g["entry_kinds"]:
            rows.append(f"| `{k}` | `{g['id']}` |")
    for k in ORCHESTRATOR["entry_kinds"]:
        rows.append(f"| `{k}` | `generation-orchestrator` |")
    for k in REPORTER["entry_kinds"]:
        rows.append(f"| `{k}` | `generation-reporter` |")
    return f"""# RACI — Framework Generator (v0.9.1)

Complete entry_kind ownership. Generators must not emit kinds owned by another worker.

| entry_kind | Owner |
|------------|-------|
{chr(10).join(rows)}

## Overlap resolution

| Concern | Owner | Not owner |
|---------|-------|-----------|
| Worker package skeleton | worker-generator | validator/reviewer/test/documentation generators |
| Registry patch files | project-bootstrap-generator | worker-generator (plans ids only) |
| JSON Schema fields | schema-generator | artifact-generator |
| Prompt text | prompt-generator | worker-generator skill.md content |
| Gate report envelope | generation-reporter | generation-orchestrator |

Packaging only — no generation execution.
"""


def gen_skill_md(g: dict, is_orch: bool = False, is_rep: bool = False) -> str:
    wid = g["id"]
    proc = SKILL_PROCEDURES.get(wid, SKILL_PROCEDURES.get(g["id"], ""))
    kinds = "\n".join(f"| `{k}` | Rule for `{k}` per RACI |" for k in g["entry_kinds"])
    part = g.get("partition_prefix") or g.get("partition", f"core/packages/scaffold/generators/{wid}/")
    out_type = g.get("output_type", "framework-generation")
    return f"""---
name: {wid}
description: {g["mission"]}
---

# {g["title"]}

> Configuration-driven scaffold planning only. Never mutate existing workers. Never execute generation.

## Consumes

`core/packages/templates/`, `core/packages/schemas/`, `core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/knowledge/`, `core/packages/configs/`, `artifacts/`, `core/packages/registry/`

## Produces

`{part}` → `{out_type}` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
{kinds}

See `core/packages/pipelines/framework-generator/RACI.md` and `core/packages/contracts/framework-generator.md` overlap table.

## Procedure

{proc}

## Heuristics

- Reuse `core/packages/templates/` packs; never duplicate template file contents in plans.
- Every `output_plan` requires `artifacts`, `registries`, `semver`; add `migration` when breaking.
- Mark skipped modes `UNKNOWN: …`; never invent spec fields.
- Dedupe key for orchestrator: `generation_id` + `entry_kind`.

## Done when

- All owned entry_kinds represented (or explicit UNKNOWN per mode)
- Full payload fields + valid `folder_mirror`
- No source mutation; `execute_generation` remains false

## Negative examples

- Do not modify prior sprint workers or registries on disk.
- Do not create project-specific business workers.
- Do not emit kinds owned by another generator (RACI violation).
"""


def gen_entry(g: dict, entry_kind: str, idx: int, extra: dict | None = None) -> dict:
    wid = g["id"]
    part = g.get("partition_prefix") or g.get("partition", f"core/packages/scaffold/generators/{wid}/")
    title = g["title"]
    e = {
        "id": f"fg_{wid}_{idx:03d}",
        "entry_kind": entry_kind,
        "statement": f"Scaffold plan for {entry_kind} via {title}",
        "generation_id": f"gen_{wid}_sample",
        "target": part,
        "spec_ref": f"core/packages/configs/examples/{wid}.yaml",
        "output_plan": {
            "artifacts": [f"{part}{entry_kind}.json"],
            "registries": ["workers", "skills", "schemas"] if wid != "project-bootstrap-generator" else ["workers", "skills", "pipelines", "schemas"],
            "semver": "0.1.0",
            "migration": None,
            "deprecation": None,
        },
        "evidence": ["core/packages/templates/worker/", "core/packages/schemas/worker-manifest.schema.json"],
        "impact": f"Enables configuration-driven {title} without manual coding",
        "severity": "info",
        "recommendation": "Review scaffold plan before execution phase",
        "alternative_solution": "Manual copy from core/packages/templates/",
        "confidence": 0.85,
        "source_paths": [f"core/packages/configs/examples/{wid}.yaml", "core/packages/templates/worker/"],
        "unknowns": ["UNKNOWN: execution phase not open"],
        "traceability": {"spec_version": "0.1.0", "generator": wid},
        "folder_mirror": f"{part}{entry_kind}.json",
    }
    if extra:
        e.update(extra)
    return e


def gen_primary_payload(g: dict, multi: bool = False) -> dict:
    wid = g["id"]
    out_type = g.get("output_type", "framework-generation")
    kinds = g["entry_kinds"]
    if multi and len(kinds) > 1:
        entries = [gen_entry(g, k, i + 1) for i, k in enumerate(kinds[:3])]
    else:
        entries = [gen_entry(g, kinds[0], 1)]
    return {
        "schema_version": "1.0.0",
        "artifact_id": f"art_fg_{wid}_primary",
        "type": out_type,
        "worker_id": wid,
        "title": f"{g['title']} sample scaffold",
        "summary": f"Sample {out_type} for {wid}",
        "entries": entries,
        "status": "draft",
        "created_at": NOW,
    }


def create_generator_worker(g: dict) -> None:
    wid = g["id"]
    wdir = ROOT / "workers" / wid
    sdir = ROOT / "skills" / wid
    multi = wid in ("worker-generator", "project-bootstrap-generator", "pipeline-generator")
    payload = gen_primary_payload(g, multi=multi)

    write(wdir / "README.md", f"""# Worker — `{wid}`

> **Pipeline:** `{PIPELINE}` v0.1.1 · **Primary output:** `framework-generation`

## Mission

{g["mission"]}

## Produces

`{g["partition_prefix"]}`

## References

- `core/packages/contracts/framework-generator.md`
- `core/packages/pipelines/framework-generator/RACI.md`
""")
    write(wdir / "skill.md", f"See `skills/{wid}/SKILL.md`.")
    write(wdir / "validator.md", f"# Validator — `{wid}`\n\nGate: `framework-generator-schema-check` v0.2.0\n")
    write(wdir / "reviewer.md", f"# Reviewer — `{wid}`\n\nGate: `framework-generator-coverage-review` v0.2.0\n")
    write(wdir / "checklist.md", f"# Checklist — `{wid}`\n\nSee `core/packages/pipelines/framework-generator/RACI.md`.\n")
    write(wdir / "testcases.md", f"# Test cases — `{wid}`\n")
    write(wdir / "manifest.json", json.dumps({
        "schema_version": "1.0.0", "id": wid, "version": PKG_VERSION, "title": g["title"],
        "implements_roles": ["executor"], "side_effects": ["runtime-write"], "entrypoint": "skill.md",
        "status": "draft",
        "extensions": {"worker_class": "discovery", "pipeline": PIPELINE, "mutate_source_artifacts": False,
                       "execute_generation": False, "configuration_driven": True, "remediation": FW_VERSION,
                       "partition": g["partition_prefix"]},
    }, indent=2) + "\n")
    write(wdir / "output-schema.json", json.dumps({
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": f"https://aios.dev/schemas/workers/{wid}/output-schema.json",
        "allOf": [{"$ref": "https://aios.dev/schemas/framework-generation.schema.json"}],
    }, indent=2) + "\n")
    write(sdir / "SKILL.md", gen_skill_md(g))
    write(sdir / "manifest.json", json.dumps({
        "schema_version": "1.0.0", "id": wid, "version": PKG_VERSION, "title": g["title"],
        "description": g["mission"], "role": "executor", "grade": "guided",
        "inputs": [
            {"name": "goal", "artifact_type": "goal", "required": True, "description": "Framework generator goal"},
            {"name": "generation_spec", "artifact_type": "generation-spec", "required": True, "description": "Capability spec"},
        ] + [{"name": c, "artifact_type": "doc-source", "required": c in ("templates", "schemas", "workers"),
              "description": f"{c}/"} for c in COMMON_CONSUMES],
        "outputs": [{"name": "primary", "artifact_type": "framework-generation", "primary": True,
                     "description": "framework-generation scaffold plan"}],
        "requires_skills": g["depends"], "validators": ["framework-generator-schema-check"],
        "reviewers": ["framework-generator-coverage-review"], "side_effects": ["runtime-write"],
        "status": "draft", "entrypoint": "SKILL.md",
        "extensions": {"pipeline": PIPELINE, "mutate_source_artifacts": False, "execute_generation": False,
                       "configuration_driven": True, "partition": g["partition_prefix"],
                       "raci": f"core/packages/pipelines/{PIPELINE}/RACI.md", "gate_output_type": "gate-framework-generation-report",
                       "entry_kinds": g["entry_kinds"]},
    }, indent=2) + "\n")
    write(wdir / "examples/sample-primary-payload.json", json.dumps(payload, indent=2) + "\n")
    write(wdir / "examples/sample-input.json", json.dumps({"spec": f"core/packages/configs/examples/{wid}.yaml"}, indent=2) + "\n")
    write(wdir / "examples/sample-output.json", json.dumps({"type": "framework-generation", "worker_id": wid}, indent=2) + "\n")
    write(wdir / "examples/README.md", f"# Examples — `{wid}`\n")
    # Real testcases
    write(wdir / "testcases/case-01-happy-path.json", json.dumps({
        "case_id": "case-01-happy-path", "worker_id": wid,
        "input": {"spec_ref": f"core/packages/configs/examples/{wid}.yaml"},
        "expect": {"min_entries": 1, "severity_max": "info", "requires_folder_mirror": True},
    }, indent=2) + "\n")
    write(wdir / "testcases/case-02-missing-spec.json", json.dumps({
        "case_id": "case-02-missing-spec", "worker_id": wid,
        "input": {"spec_ref": "UNKNOWN"},
        "expect": {"unknowns_required": True, "severity_min": "medium"},
    }, indent=2) + "\n")
    write(wdir / "testcases/case-03-invalid-schema-ref.json", json.dumps({
        "case_id": "case-03-invalid-schema-ref", "worker_id": wid,
        "input": {"spec_ref": "core/packages/configs/examples/invalid.yaml"},
        "expect": {"severity_min": "critical", "entry_kind": "schema-validation" if wid == "validator-generator" else None},
    }, indent=2) + "\n")
    write(wdir / "testcases/case-04-registry-gap.json", json.dumps({
        "case_id": "case-04-registry-gap", "worker_id": wid,
        "input": {"output_plan": {"registries": []}},
        "expect": {"severity_min": "high", "check": "registry-plan"},
    }, indent=2) + "\n")
    write(wdir / "testcases/case-05-budget-exceed.json", json.dumps({
        "case_id": "case-05-budget-exceed", "worker_id": wid,
        "input": {"budget_exceeded": True},
        "expect": {"blocked": True, "result": "fail"},
    }, indent=2) + "\n")
    write(wdir / "testcases/README.md", f"# Testcases — `{wid}`\n")
    write(ROOT / "framework-generator" / "generators" / wid / "examples" / f"{wid}-scaffold.json", json.dumps(payload, indent=2) + "\n")


def create_closure_worker(meta: dict) -> None:
    wid = meta["id"]
    wdir = ROOT / "workers" / wid
    sdir = ROOT / "skills" / wid
    payload = gen_primary_payload(meta, multi=True)
    write(wdir / "README.md", f"# Worker — `{wid}`\n\n{meta['mission']}\n")
    write(wdir / "skill.md", f"See skills/{wid}/SKILL.md")
    write(wdir / "validator.md", "# Validator binding\n")
    write(wdir / "reviewer.md", "# Reviewer binding\n")
    write(wdir / "checklist.md", f"# Checklist — `{wid}`\n")
    write(wdir / "testcases.md", f"# Test cases — `{wid}`\n")
    write(wdir / "manifest.json", json.dumps({
        "schema_version": "1.0.0", "id": wid, "version": PKG_VERSION, "title": meta["title"],
        "implements_roles": ["orchestrator"] if "orchestrator" in wid else ["executor"],
        "side_effects": ["runtime-write"], "entrypoint": "skill.md", "status": "draft",
        "extensions": {"worker_class": "discovery", "pipeline": PIPELINE, "mutate_source_artifacts": False,
                       "execute_generation": False, "remediation": FW_VERSION, "partition": meta["partition"]},
    }, indent=2) + "\n")
    schema_ref = "framework-generation-status.schema.json" if "orchestrator" in wid else "framework-generation-report.schema.json"
    write(wdir / "output-schema.json", json.dumps({
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "allOf": [{"$ref": f"https://aios.dev/schemas/{schema_ref}"}],
    }, indent=2) + "\n")
    write(sdir / "SKILL.md", gen_skill_md(meta, is_orch="orchestrator" in wid, is_rep="reporter" in wid))
    out_type = meta["output_type"]
    write(sdir / "manifest.json", json.dumps({
        "schema_version": "1.0.0", "id": wid, "version": PKG_VERSION, "title": meta["title"],
        "description": meta["mission"], "role": "orchestrator" if "orchestrator" in wid else "executor",
        "grade": "guided", "inputs": [{"name": "goal", "artifact_type": "goal", "required": True, "description": "goal"}],
        "outputs": [{"name": "primary", "artifact_type": out_type, "primary": True, "description": out_type}],
        "requires_skills": meta["depends"], "validators": ["framework-generator-schema-check"],
        "reviewers": ["framework-generator-coverage-review"], "side_effects": ["runtime-write"],
        "status": "draft", "entrypoint": "SKILL.md",
        "extensions": {"pipeline": PIPELINE, "partition": meta["partition"], "entry_kinds": meta["entry_kinds"],
                       "gate_output_type": "gate-framework-generation-report"},
    }, indent=2) + "\n")
    write(wdir / "examples/sample-primary-payload.json", json.dumps(payload, indent=2) + "\n")
    if "reporter" in wid:
        gate = dict(payload)
        gate["type"] = "gate-framework-generation-report"
        gate["artifact_id"] = f"art_fg_{wid}_gate"
        write(wdir / "examples/sample-gate-payload.json", json.dumps(gate, indent=2) + "\n")


def create_schemas() -> None:
    base = ROOT / "schemas" / "framework-generator-payload.schema.json"
    data = json.loads(base.read_text())
    data["description"] = "Framework Generator payloads v0.9.1"
    data["properties"]["type"]["enum"] = [
        "framework-generation",
        "framework-generation-status",
        "framework-generation-report",
        "gate-framework-generation-report",
    ]
    entry_props = data["properties"]["entries"]["items"]["properties"]
    data["properties"]["entries"]["items"]["properties"]["output_plan"] = {
        "type": "object",
        "required": ["artifacts", "registries", "semver"],
        "properties": {
            "artifacts": {"type": "array", "items": {"type": "string"}},
            "registries": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "semver": {"type": "string"},
            "migration": {"type": ["string", "null"]},
            "deprecation": {"type": ["string", "null"]},
        },
    }
    write(base, json.dumps(data, indent=2) + "\n")
    for name, const in [
        ("framework-generation", "framework-generation"),
        ("framework-generation-status", "framework-generation-status"),
        ("framework-generation-report", "framework-generation-report"),
    ]:
        write(ROOT / "schemas" / f"{name}.schema.json", json.dumps({
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": f"https://aios.dev/schemas/{name}.schema.json",
            "title": f"AIOS {name}",
            "allOf": [
                {"$ref": "https://aios.dev/schemas/framework-generator-payload.schema.json"},
                {"type": "object", "properties": {"type": {"const": const}}},
            ],
        }, indent=2) + "\n")
    write(ROOT / "schemas" / "gate-framework-generation-report.schema.json", json.dumps({
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://aios.dev/schemas/gate-framework-generation-report.schema.json",
        "title": "Gate Framework Generation Report",
        "allOf": [
            {"$ref": "https://aios.dev/schemas/framework-generator-payload.schema.json"},
            {"type": "object", "properties": {"type": {"const": "gate-framework-generation-report"}}},
        ],
    }, indent=2) + "\n")
    spec = json.loads((ROOT / "schemas" / "generation-spec.schema.json").read_text())
    spec["required"] = ["capability", "version", "target_generator", "modes"]
    spec["properties"]["modes"] = {"type": "array", "items": {"type": "string"}, "minItems": 1}
    write(ROOT / "schemas" / "generation-spec.schema.json", json.dumps(spec, indent=2) + "\n")


def create_gates() -> None:
    write(ROOT / "validators" / "framework-generator-schema-check" / "manifest.json", json.dumps({
        "schema_version": "1.0.0", "id": "framework-generator-schema-check", "version": "0.2.0",
        "title": "Framework Generator Schema Check",
        "description": "Deterministic checks for framework-generator payloads v0.9.1.",
        "applies_to": ["framework-generation", "framework-generation-status", "framework-generation-report", "gate-framework-generation-report"],
        "checks": [
            {"check_id": "schema-valid", "severity": "critical", "rule": "payload validates against framework-generator-payload.schema.json"},
            {"check_id": "generation-spec-valid", "severity": "critical", "rule": "spec_ref YAML/JSON validates against generation-spec.schema.json when present"},
            {"check_id": "folder-mirror-partition", "severity": "critical", "rule": "folder_mirror matches generator or status/reports partition"},
            {"check_id": "raci-entry-kind", "severity": "critical", "rule": "entry_kind owned by worker_id per RACI.md"},
            {"check_id": "output-plan-typed", "severity": "high", "rule": "output_plan has artifacts, registries, semver"},
            {"check_id": "registry-plan", "severity": "high", "rule": "output_plan.registries lists target registries"},
            {"check_id": "mode-coverage", "severity": "high", "rule": "all worker entry_kinds represented or UNKNOWN documented"},
            {"check_id": "no-execution-flag", "severity": "critical", "rule": "execute_generation false on all workers"},
            {"check_id": "gate-type-separate", "severity": "critical", "rule": "gate-framework-generation-report type distinct from framework-generation-report"},
        ],
    }, indent=2) + "\n")
    write(ROOT / "reviewers" / "framework-generator-coverage-review" / "rubric" / "framework-generator-coverage.json", json.dumps({
        "schema_version": "1.0.0", "id": "framework-generator-coverage", "version": "0.2.0",
        "title": "Framework Generator Coverage Rubric", "score_mode": "weighted_0_1", "pass_threshold": 0.7,
        "criteria": [
            {"id": "mode-coverage", "description": "All owned entry_kinds planned or UNKNOWN", "weight": 0.2, "scale_min": 0, "scale_max": 1},
            {"id": "template-reuse", "description": "Plans cite core/packages/templates/ not duplicate content", "weight": 0.2, "scale_min": 0, "scale_max": 1},
            {"id": "registry-self-registration", "description": "output_plan.registries complete", "weight": 0.2, "scale_min": 0, "scale_max": 1},
            {"id": "semver-migration", "description": "semver + artifacts/migration/deprecation when breaking", "weight": 0.2, "scale_min": 0, "scale_max": 1},
            {"id": "raci-compliance", "description": "No overlap violations vs overlap table", "weight": 0.2, "scale_min": 0, "scale_max": 1},
        ],
        "veto_conditions": ["mutate_source_artifacts", "execute_generation", "raci_violation", "invent_missing_information"],
    }, indent=2) + "\n")


def create_pipeline_files() -> None:
    nodes = [{"id": w, "node_type": "worker", "label": w, "worker_class": "discovery"} for w in ALL_WORKERS]
    edges = []
    for g in GENERATORS:
        for dep in g["depends"]:
            edges.append({"predecessor": dep, "successor": g["id"], "type": "blocks", "relation": "requires"})
    for dep in ORCHESTRATOR["depends"]:
        edges.append({"predecessor": dep, "successor": ORCHESTRATOR["id"], "type": "blocks", "relation": "requires"})
    for dep in REPORTER["depends"]:
        edges.append({"predecessor": dep, "successor": REPORTER["id"], "type": "blocks", "relation": "requires"})

    write(ROOT / "pipelines" / PIPELINE / "dependency-graph.json", json.dumps({
        "schema_version": "1.0.0", "artifact_id": "art_fg_pipeline_deps", "kind": "worker",
        "pipeline_id": PIPELINE, "title": "Framework Generator Worker Dependency Graph",
        "created_at": NOW, "notes": ["v0.9.1 — topologically valid waves", "Packaging only"],
        "nodes": nodes, "edges": edges,
        "extensions": {"schema": "pipeline-dependency-graph.schema.json", "allows_feature_workers": False},
    }, indent=2) + "\n")

    pipeline = json.loads((ROOT / "pipelines" / PIPELINE / "pipeline.json").read_text())
    pipeline["version"] = PKG_VERSION
    pipeline["workers"] = ALL_WORKERS
    pipeline["waves"] = WAVES
    pipeline["primary_output_type"] = "framework-generation-report"
    pipeline["created_at"] = pipeline.get("created_at", NOW)
    write(ROOT / "pipelines" / PIPELINE / "pipeline.json", json.dumps(pipeline, indent=2) + "\n")
    write(ROOT / "pipelines" / PIPELINE / "RACI.md", raci_md())

    meta = {}
    for g in GENERATORS:
        meta[g["id"]] = {"wave": WAVES.index(next(w for w in WAVES if g["id"] in w)),
                         "partition": g["partition_prefix"], "entry_kinds": g["entry_kinds"],
                         "produces": ["framework-generation"]}
    meta[ORCHESTRATOR["id"]] = {"wave": 7, "partition": ORCHESTRATOR["partition"],
                                "entry_kinds": ORCHESTRATOR["entry_kinds"], "produces": ["framework-generation-status"]}
    meta[REPORTER["id"]] = {"wave": 8, "partition": REPORTER["partition"],
                            "entry_kinds": REPORTER["entry_kinds"], "produces": ["framework-generation-report", "gate-framework-generation-report"]}
    write(ROOT / "pipelines" / PIPELINE / ".workers-meta.json", json.dumps(meta, indent=2) + "\n")

    write(ROOT / "pipelines" / PIPELINE / "execution-graph.md", """# Execution Graph (v0.9.1)

```mermaid
flowchart TD
  SG[schema-generator] --> AG[artifact-generator]
  SG --> WG[worker-generator]
  PG[prompt-generator] --> BS[project-bootstrap-generator]
  SG --> BS
  WG --> VG[validator-generator]
  WG --> RG[reviewer-generator]
  VG --> PL[pipeline-generator]
  RG --> PL
  WG --> PL
  WG --> TG[test-generator]
  PL --> DG[documentation-generator]
  WG --> DG
  AG --> BS
  VG --> BS
  RG --> BS
  PL --> BS
  TG --> BS
  DG --> BS
  BS --> GO[generation-orchestrator]
  GO --> GR[generation-reporter]
```

Waves are topologically valid — no hard edge within the same wave.
""")


def create_partition_examples() -> None:
    shared_tpl = """# Capability spec (shared template v0.9.1)
capability: "{{capability}}"
version: 0.1.0
target_generator: {{target_generator}}
modes: []
outputs: {}
registries:
  - workers
  - skills
  - schemas
semver: 0.1.0
"""
    write(ROOT / "framework-generator" / "templates" / "capability-spec.template.yaml", shared_tpl)
    write(ROOT / "framework-generator" / "bootstrap" / "example-repo-init.json", json.dumps({
        "entry_kind": "repo-init", "planned_paths": ["ai-os/", "ai-os/workers/", "ai-os/pipelines/"],
    }, indent=2) + "\n")
    write(ROOT / "framework-generator" / "scaffolding" / "folder-tree.json", json.dumps({
        "folders": ["workers", "skills", "schemas", "pipelines", "registry", "templates", "contracts"],
    }, indent=2) + "\n")
    write(ROOT / "framework-generator" / "registries" / "example-workers-patch.json", json.dumps({
        "registry_kind": "workers", "planned_entries": ["example-worker"], "note": "Not applied in packaging",
    }, indent=2) + "\n")
    write(ROOT / "configs" / "README.md", "# Configs\n\nCapability specs for framework-generator. See `core/packages/configs/examples/`.\n")
    for g in GENERATORS:
        write(ROOT / "configs" / "examples" / f"{g['id']}.yaml", f"""capability: {g['title']}
version: 0.1.0
target_generator: {g['id']}
modes:
{chr(10).join(f'  - {m}' for m in g['modes'][:4])}
outputs:
  worker_id: sample-{g['id'].replace('-generator', '')}
registries:
  - workers
  - skills
semver: 0.1.0
""")


def update_contract() -> None:
    write(ROOT / "contracts" / "framework-generator.md", f"""# Framework Generator Contract

**Version:** {FW_VERSION} · **Pipeline:** `{PIPELINE}` v{PKG_VERSION}

## Invariants

1. **No execution** — scaffold plans only.
2. **No mutation** — never modify prior sprint core/packages/workers/registries on disk.
3. **Configuration-driven** — `generation-spec` YAML/JSON under `core/packages/configs/`.
4. **Partitioned output** — `core/packages/scaffold/generators/<id>/` via `folder_mirror`.
5. **Valid waves** — `pipeline.waves` is a topological partition of the hard dependency graph.

## Overlap resolution

| Concern | Owner | Not owner |
|---------|-------|-----------|
| Worker skeleton (README, skill, manifest) | worker-generator | validator/reviewer/test/doc generators |
| Registry patch files | project-bootstrap-generator | worker-generator |
| JSON Schema typing | schema-generator | artifact-generator |
| Prompts | prompt-generator | worker-generator |
| Status merge | generation-orchestrator | generators |
| Gate report | generation-reporter | orchestrator |

## Artifact types

- `framework-generation` — generator scaffold plans
- `framework-generation-status` — orchestrator merge/dedupe
- `framework-generation-report` — human report
- `gate-framework-generation-report` — gate envelope (distinct type)
- `generation-spec` — input capability spec

## Closure workers

- `generation-orchestrator` → `framework-generation-status`
- `generation-reporter` → `framework-generation-report` + gate envelope
""")


def update_registries() -> None:
    for fname in ("workers.json", "skills.json", "validators.json", "reviewers.json", "artifact-types.json"):
        data = json.loads((ROOT / "registry" / fname).read_text())
        data["updated_at"] = NOW

    workers = json.loads((ROOT / "registry" / "workers.json").read_text())
    skills = json.loads((ROOT / "registry" / "skills.json").read_text())
    validators = json.loads((ROOT / "registry" / "validators.json").read_text())
    reviewers = json.loads((ROOT / "registry" / "reviewers.json").read_text())

    for g in GENERATORS:
        wid = g["id"]
        workers["entries"][wid].update({
            "version": PKG_VERSION, "depends_on_workers": g["depends"],
            "description": g["mission"], "produces": [g["partition_prefix"]],
        })
        skills["entries"][wid].update({"version": PKG_VERSION, "description": g["mission"]})

    for meta in (ORCHESTRATOR, REPORTER):
        wid = meta["id"]
        workers["entries"][wid] = {
            "id": wid, "path": f"core/packages/workers/{wid}", "version": PKG_VERSION, "status": "draft",
            "description": meta["mission"], "worker_class": "discovery", "pipeline": PIPELINE,
            "skill_id": wid, "depends_on_workers": meta["depends"], "consumes": COMMON_CONSUMES + ["framework-generator"],
            "produces": [meta["partition"]],
        }
        skills["entries"][wid] = {"id": wid, "path": f"skills/{wid}", "version": PKG_VERSION,
                                  "status": "draft", "description": meta["mission"]}

    validators["entries"]["framework-generator-schema-check"]["version"] = "0.2.0"
    reviewers["entries"]["framework-generator-coverage-review"]["version"] = "0.2.0"

    write(ROOT / "registry" / "workers.json", json.dumps(workers, indent=2) + "\n")
    write(ROOT / "registry" / "skills.json", json.dumps(skills, indent=2) + "\n")
    write(ROOT / "registry" / "validators.json", json.dumps(validators, indent=2) + "\n")
    write(ROOT / "registry" / "reviewers.json", json.dumps(reviewers, indent=2) + "\n")


def main() -> None:
    for g in GENERATORS:
        create_generator_worker(g)
    create_closure_worker(ORCHESTRATOR)
    create_closure_worker(REPORTER)
    create_schemas()
    create_gates()
    create_pipeline_files()
    create_partition_examples()
    update_contract()
    update_registries()
    write(ROOT / "VERSION", FW_VERSION + "\n")
    print(f"Remediated Framework Generator → {FW_VERSION}")


if __name__ == "__main__":
    main()
