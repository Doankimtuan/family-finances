#!/usr/bin/env python3
"""Scaffold Framework Generator pipeline (packaging only — no execution)."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
PIPELINE = "framework-generator"
VERSION = "0.1.0"
FW_VERSION = "0.9.0"

GENERATORS = [
    {
        "id": "schema-generator",
        "title": "Schema Generator",
        "mission": "Generate JSON Schemas, markdown templates, configuration schemas, validation schemas, and artifact schemas from capability specs.",
        "entry_kinds": ["json-schema", "config-schema", "validation-schema", "artifact-schema", "markdown-template"],
        "wave": 0,
        "depends": [],
        "modes": ["JSON Schema", "Markdown Templates", "Configuration Schemas", "Validation Schemas", "Artifact Schemas"],
    },
    {
        "id": "artifact-generator",
        "title": "Artifact Generator",
        "mission": "Generate artifact definitions including folder structure, contracts, naming rules, lifecycle, dependencies, versioning, and retention policy.",
        "entry_kinds": ["artifact-contract", "folder-structure", "naming-rules", "lifecycle", "retention-policy"],
        "wave": 0,
        "depends": ["schema-generator"],
        "modes": ["Folder Structure", "Artifact Contracts", "Naming Rules", "Lifecycle", "Dependencies", "Versioning", "Retention Policy"],
    },
    {
        "id": "prompt-generator",
        "title": "Prompt Generator",
        "mission": "Generate production-quality prompts for builder, reviewer, validator, improve, freeze, and execution roles.",
        "entry_kinds": ["builder-prompt", "reviewer-prompt", "validator-prompt", "improve-prompt", "freeze-prompt", "execution-prompt"],
        "wave": 0,
        "depends": [],
        "modes": ["Builder Prompt", "Reviewer Prompt", "Validator Prompt", "Improve Prompt", "Freeze Prompt", "Execution Prompt"],
    },
    {
        "id": "worker-generator",
        "title": "Worker Generator",
        "mission": "Generate a complete Worker package from a high-level capability description including README, skill, validator, reviewer, examples, schemas, tests, registration, and documentation.",
        "entry_kinds": ["worker-package", "worker-readme", "worker-skill", "worker-manifest", "worker-registration"],
        "wave": 1,
        "depends": ["schema-generator"],
        "modes": ["README", "skill", "validator", "reviewer", "examples", "schemas", "tests", "registration", "documentation"],
    },
    {
        "id": "validator-generator",
        "title": "Validator Generator",
        "mission": "Generate validators for any Worker supporting artifact, schema, traceability, dependency, completeness, consistency, and quality validation.",
        "entry_kinds": ["artifact-validation", "schema-validation", "traceability-validation", "dependency-validation", "completeness-validation", "consistency-validation", "quality-validation"],
        "wave": 1,
        "depends": ["worker-generator", "schema-generator"],
        "modes": ["Artifact Validation", "Schema Validation", "Traceability Validation", "Dependency Validation", "Completeness Validation", "Consistency Validation", "Quality Validation"],
    },
    {
        "id": "reviewer-generator",
        "title": "Reviewer Generator",
        "mission": "Generate engineering reviewers for architecture, business, specification, quality, documentation, security, and performance review.",
        "entry_kinds": ["architecture-review", "business-review", "specification-review", "quality-review", "documentation-review", "security-review", "performance-review"],
        "wave": 1,
        "depends": ["worker-generator", "schema-generator"],
        "modes": ["Architecture Review", "Business Review", "Specification Review", "Quality Review", "Documentation Review", "Security Review", "Performance Review"],
    },
    {
        "id": "pipeline-generator",
        "title": "Pipeline Generator",
        "mission": "Generate execution pipelines with sequential, parallel, conditional, resume, and incremental strategies plus retry, checkpoint, and rollback support.",
        "entry_kinds": ["sequential-pipeline", "parallel-pipeline", "conditional-pipeline", "resume-pipeline", "incremental-pipeline", "retry-strategy", "checkpoint-strategy", "rollback-strategy"],
        "wave": 1,
        "depends": ["worker-generator", "validator-generator", "reviewer-generator"],
        "modes": ["Sequential Pipeline", "Parallel Pipeline", "Conditional Pipeline", "Resume Pipeline", "Incremental Pipeline", "Retry Strategy", "Checkpoint Strategy", "Rollback Strategy"],
    },
    {
        "id": "test-generator",
        "title": "Test Generator",
        "mission": "Generate test cases, validation cases, edge cases, regression tests, sample projects, and acceptance tests for generated components.",
        "entry_kinds": ["test-case", "validation-case", "edge-case", "regression-test", "sample-project", "acceptance-test"],
        "wave": 2,
        "depends": ["worker-generator"],
        "modes": ["Test Cases", "Validation Cases", "Edge Cases", "Regression Tests", "Sample Projects", "Acceptance Tests"],
    },
    {
        "id": "documentation-generator",
        "title": "Documentation Generator",
        "mission": "Automatically generate architecture docs, usage guides, examples, developer guides, migration guides, changelogs, and release notes.",
        "entry_kinds": ["architecture-doc", "usage-guide", "example-doc", "developer-guide", "migration-guide", "changelog", "release-notes"],
        "wave": 2,
        "depends": ["worker-generator", "pipeline-generator"],
        "modes": ["Architecture Docs", "Usage Guides", "Examples", "Developer Guides", "Migration Guides", "Changelogs", "Release Notes"],
    },
    {
        "id": "project-bootstrap-generator",
        "title": "Project Bootstrap Generator",
        "mission": "Generate a complete AI OS project from configuration including repository initialization, folder creation, worker registration, pipeline registration, configuration generation, and default templates.",
        "entry_kinds": ["repo-init", "folder-scaffold", "worker-registration", "pipeline-registration", "config-generation", "default-templates"],
        "wave": 3,
        "depends": [g["id"] for g in []],  # filled below
        "modes": ["Repository Initialization", "Folder Creation", "Worker Registration", "Pipeline Registration", "Configuration Generation", "Default Templates"],
    },
]

# bootstrap depends on all others
GENERATORS[-1]["depends"] = [g["id"] for g in GENERATORS[:-1]]

COMMON_CONSUMES = [
    "templates",
    "schemas",
    "workers",
    "validators",
    "reviewers",
    "pipelines",
    "knowledge",
    "configs",
    "artifacts",
    "registry",
]

WAVES = [
    ["schema-generator", "artifact-generator", "prompt-generator"],
    ["worker-generator", "validator-generator", "reviewer-generator", "pipeline-generator"],
    ["test-generator", "documentation-generator"],
    ["project-bootstrap-generator"],
]


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def gen_worker_readme(g: dict) -> str:
    return f"""# Worker — `{g["id"]}`

> **Pipeline:** `{PIPELINE}` · **Status:** draft · **Never execute generation in packaging milestone**  
> **Primary output:** `framework-generation`

## Mission

{g["mission"]}

## Identity

| Field | Value |
|-------|-------|
| Worker id | `{g["id"]}` |
| Pipeline | `{PIPELINE}` |
| Skill | `{g["id"]}` |

## Consumes

`core/packages/templates/`, `core/packages/schemas/`, `core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/` (alias `pipeline/`), `artifacts/knowledge/`, `core/packages/configs/`, `artifacts/`, `core/packages/registry/`

## Produces

`core/packages/scaffold/generators/{g["id"]}/` → `framework-generation`

## Configuration-driven generation

Accept capability specs as YAML or JSON under `core/packages/configs/` or inline `generation-spec`. Emit scaffold plans only — do not mutate existing workers.

## Modes supported

{chr(10).join(f"- {m}" for m in g["modes"])}

## Self-registration

Generated packages must register into Worker, Validator, Reviewer, Pipeline, Artifact, Template, and Schema registries when executed in a later phase.

## References

- `core/packages/contracts/framework-generator.md`
- `core/packages/pipelines/framework-generator/`
- `core/packages/schemas/framework-generator-payload.schema.json`
"""


def gen_skill_md(g: dict) -> str:
    kinds = "\n".join(f"| `{k}` | Owned by `{g['id']}` |" for k in g["entry_kinds"][:5])
    return f"""---
name: {g["id"]}
description: {g["mission"]}
---

# {g["title"]}

> Configuration-driven generation only. Never mutate existing workers. Never execute generation in packaging milestone.

## Consumes

`core/packages/templates/`, `core/packages/schemas/`, `core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/knowledge/`, `core/packages/configs/`, `artifacts/`, `core/packages/registry/`

## Produces

`core/packages/scaffold/generators/{g["id"]}/` → `framework-generation` (required `folder_mirror`: `core/packages/scaffold/generators/{g["id"]}/…`)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
{kinds}

See `core/packages/pipelines/framework-generator/RACI.md`.

## Procedure

1. Load capability spec (YAML/JSON) from `core/packages/configs/` or task input.
2. Resolve template packs from `core/packages/templates/` and reference schemas from `core/packages/schemas/`.
3. Plan outputs under `core/packages/scaffold/generators/{g["id"]}/` — scaffold only.
4. Emit `framework-generation` entries with full fields + `folder_mirror`.
5. Include self-registration plan (registry targets) without writing registries in packaging phase.
6. Mark gaps `UNKNOWN: …`. Never mutate sources.

## Heuristics

- Prefer template reuse over duplicated logic.
- Semantic versioning on every generated package plan.
- Backward compatibility and deprecation paths documented in entries.
- Modular, configurable, extensible output plans.

## Done when

- ≥1 structured entry covering owned entry_kinds
- Every entry has generation_id, target, spec_ref, output_plan, evidence, severity, recommendation, confidence, traceability, unknowns, source_paths, folder_mirror
- No source mutation; no execution of generation

## Negative examples

- Do not modify existing workers, validators, or pipelines.
- Do not create project-specific business workers.
- Do not run generated scaffolds in packaging milestone.
"""


def gen_validator_md(g: dict) -> str:
    return f"""# Validator binding — `{g["id"]}`

Pipeline gate: `framework-generator-schema-check`

## Pre-publish checks

1. Payload validates against `core/packages/schemas/framework-generator-payload.schema.json`.
2. `folder_mirror` starts with `core/packages/scaffold/generators/{g["id"]}/`.
3. Capability spec reference present or explicit UNKNOWN.
4. Self-registration plan lists target registries.

## Blocking severities

`critical`, `high` on schema or partition violations block publish.
"""


def gen_reviewer_md(g: dict) -> str:
    return f"""# Reviewer binding — `{g["id"]}`

Pipeline gate: `framework-generator-coverage-review`

## Rubric focus

- Template reuse and modularity
- Registry self-registration completeness
- Semantic versioning and migration notes in output plan
- Configuration-driven spec coverage (all required modes represented or UNKNOWN)
"""


def gen_checklist(g: dict) -> str:
    return f"""# Checklist — `{g["id"]}`

- [ ] README.md identity complete
- [ ] skill.md rule catalog present
- [ ] validator.md and reviewer.md bindings documented
- [ ] output-schema.json references framework-generator-payload
- [ ] examples/sample-primary-payload.json validates
- [ ] testcases/case-01-happy-path.json present
- [ ] Registered in core/packages/registry/workers.json and core/packages/registry/skills.json
- [ ] Partition `core/packages/scaffold/generators/{g["id"]}/` documented
- [ ] No template markers remain
- [ ] Status remains `draft` until execution phase opens
"""


def gen_testcases_md(g: dict) -> str:
    return f"""# Test cases — `{g["id"]}`

| Case | File | Intent |
|------|------|--------|
| Happy path | case-01-happy-path.json | Valid capability spec → scaffold plan |
| Missing spec | case-02-missing-spec.json | UNKNOWN paths when spec absent |
| Invalid schema ref | case-03-invalid-schema-ref.json | critical finding |
| Registry plan gap | case-04-registry-gap.json | high finding on incomplete self-registration |
| Budget exceed | case-05-budget-exceed.json | Orchestration budget guard |
"""


def gen_worker_manifest(g: dict) -> dict:
    return {
        "schema_version": "1.0.0",
        "id": g["id"],
        "version": VERSION,
        "title": g["title"],
        "implements_roles": ["executor"],
        "side_effects": ["runtime-write"],
        "entrypoint": "skill.md",
        "status": "draft",
        "extensions": {
            "worker_class": "discovery",
            "pipeline": PIPELINE,
            "mutate_source_artifacts": False,
            "execute_generation": False,
            "configuration_driven": True,
            "remediation": FW_VERSION,
            "partition": f"core/packages/scaffold/generators/{g['id']}/",
        },
    }


def gen_skill_manifest(g: dict) -> dict:
    inputs = [
        {"name": "goal", "artifact_type": "goal", "required": True, "description": "Framework generator goal"},
        {"name": "generation_spec", "artifact_type": "generation-spec", "required": True, "description": "YAML/JSON capability spec"},
    ]
    for c in COMMON_CONSUMES:
        inputs.append(
            {
                "name": c.replace("/", "_").replace("-", "_"),
                "artifact_type": "doc-source",
                "required": c in ("templates", "schemas", "workers"),
                "description": f"{c}/",
            }
        )
    return {
        "schema_version": "1.0.0",
        "id": g["id"],
        "version": VERSION,
        "title": g["title"],
        "description": g["mission"],
        "role": "executor",
        "grade": "guided",
        "inputs": inputs,
        "outputs": [
            {
                "name": "primary",
                "artifact_type": "framework-generation",
                "primary": True,
                "description": "framework-generation scaffold plan",
            }
        ],
        "requires_skills": g["depends"],
        "validators": ["framework-generator-schema-check"],
        "reviewers": ["framework-generator-coverage-review"],
        "side_effects": ["runtime-write"],
        "status": "draft",
        "entrypoint": "SKILL.md",
        "extensions": {
            "pipeline": PIPELINE,
            "mutate_source_artifacts": False,
            "execute_generation": False,
            "configuration_driven": True,
            "partition": f"core/packages/scaffold/generators/{g['id']}/",
            "raci": f"core/packages/pipelines/{PIPELINE}/RACI.md",
            "gate_output_type": "gate-framework-generation-report",
            "entry_kinds": g["entry_kinds"],
        },
    }


def gen_sample_payload(g: dict) -> dict:
    entry = {
        "id": f"fg_{g['id']}_001",
        "entry_kind": g["entry_kinds"][0],
        "statement": f"Scaffold plan for {g['title']} from capability spec",
        "generation_id": f"gen_{g['id']}_sample",
        "target": f"core/packages/scaffold/generators/{g['id']}/",
        "spec_ref": "core/packages/configs/sample-capability.yaml",
        "output_plan": {
            "artifacts": [f"core/packages/scaffold/generators/{g['id']}/README.md"],
            "registries": ["workers", "skills", "schemas"],
            "semver": "0.1.0",
        },
        "evidence": [f"core/packages/templates/worker/", f"core/packages/schemas/worker-manifest.schema.json"],
        "impact": "Enables configuration-driven {g['title']} without manual coding",
        "severity": "info",
        "recommendation": "Review scaffold plan before execution phase",
        "alternative_solution": "Manual copy from core/packages/templates/worker/",
        "confidence": 0.85,
        "source_paths": ["core/packages/configs/sample-capability.yaml", "core/packages/templates/worker/"],
        "unknowns": ["UNKNOWN: execution phase not open"],
        "traceability": {"spec_version": "0.1.0", "generator": g["id"]},
        "folder_mirror": f"core/packages/scaffold/generators/{g['id']}/{g['entry_kinds'][0]}.json",
    }
    return {
        "schema_version": "1.0.0",
        "artifact_id": f"art_fg_{g['id']}_primary",
        "type": "framework-generation",
        "worker_id": g["id"],
        "title": f"{g['title']} sample scaffold",
        "summary": f"Sample framework-generation payload for {g['id']}",
        "entries": [entry],
        "status": "draft",
        "created_at": NOW,
    }


def gen_output_schema_ref() -> dict:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": f"https://aios.dev/schemas/workers/{{worker_id}}/output-schema.json",
        "title": "Framework Generator Worker Output",
        "description": "References framework-generator-payload.schema.json",
        "allOf": [{"$ref": "https://aios.dev/schemas/framework-generator-payload.schema.json"}],
    }


def create_worker_package(g: dict) -> None:
    wid = g["id"]
    wdir = ROOT / "workers" / wid
    sdir = ROOT / "skills" / wid
    write(wdir / "README.md", gen_worker_readme(g))
    write(wdir / "skill.md", f"Invoke skill `{wid}` — see `skills/{wid}/SKILL.md`.")
    write(wdir / "validator.md", gen_validator_md(g))
    write(wdir / "reviewer.md", gen_reviewer_md(g))
    write(wdir / "checklist.md", gen_checklist(g))
    write(wdir / "testcases.md", gen_testcases_md(g))
    write(wdir / "manifest.json", json.dumps(gen_worker_manifest(g), indent=2) + "\n")
    out_schema = gen_output_schema_ref()
    out_schema["$id"] = f"https://aios.dev/schemas/workers/{wid}/output-schema.json"
    write(wdir / "output-schema.json", json.dumps(out_schema, indent=2) + "\n")
    write(sdir / "SKILL.md", gen_skill_md(g))
    write(sdir / "manifest.json", json.dumps(gen_skill_manifest(g), indent=2) + "\n")
    write(wdir / "examples/README.md", f"# Examples — `{wid}`\n\nNon-normative fixtures for registration smoke.\n")
    write(wdir / "examples/sample-input.json", json.dumps({"capability": g["title"], "spec": "core/packages/configs/sample-capability.yaml"}, indent=2) + "\n")
    write(wdir / "examples/sample-output.json", json.dumps({"type": "framework-generation", "worker_id": wid}, indent=2) + "\n")
    write(wdir / "examples/sample-primary-payload.json", json.dumps(gen_sample_payload(g), indent=2) + "\n")
    write(wdir / "testcases/README.md", f"# Testcases — `{wid}`\n")
    for name in [
        "case-01-happy-path.json",
        "case-02-missing-spec.json",
        "case-03-invalid-schema-ref.json",
        "case-04-registry-gap.json",
        "case-05-budget-exceed.json",
    ]:
        write(wdir / "testcases" / name, json.dumps({"case": name, "worker_id": wid}, indent=2) + "\n")
    # generator-local templates
    tpl_dir = ROOT / "framework-generator" / "generators" / wid / "templates"
    write(tpl_dir / "capability-spec.template.yaml", f"""# Capability spec template for {g['title']}
capability: {g['title']}
version: 0.1.0
generator: {wid}
modes:
{chr(10).join(f'  - {m}' for m in g['modes'])}
outputs:
  partition: core/packages/scaffold/generators/{wid}/
registries:
  - workers
  - skills
  - schemas
""")
    write(
        ROOT / "framework-generator" / "generators" / wid / "examples" / f"{wid}-scaffold.json",
        json.dumps(gen_sample_payload(g), indent=2) + "\n",
    )


def create_framework_generator_tree() -> None:
    fg = ROOT / "framework-generator"
    write(fg / "README.md", f"""# Framework Generator

**Pipeline:** `{PIPELINE}` · **Framework version:** {FW_VERSION}

Self-extensible scaffolding for Workers, Validators, Reviewers, Pipelines, and supporting artifacts.

## Layout

| Path | Purpose |
|------|---------|
| `generators/` | Per-generator output partitions and templates |
| `bootstrap/` | Project bootstrap scaffolds |
| `scaffolding/` | Shared scaffolding utilities |
| `core/packages/templates/` | Generator-specific template overrides |
| `registries/` | Planned registry patches (not applied in packaging) |
| `catalog/` | Worker, schema, and template catalogs |

## Stop condition

Packaging milestone — **do not execute generation**. Plans only.
""")
    write(fg / "bootstrap/README.md", "Repository initialization scaffolds produced by `project-bootstrap-generator`.")
    write(fg / "scaffolding/README.md", "Shared folder scaffolds and naming conventions.")
    write(fg / "core/packages/templates/README.md", "Generator template overrides; canonical templates remain under `ai-os/templates/`.")
    write(fg / "registries/README.md", "Self-registration plans target core/packages/registry/*.json — applied only in execution phase.")
    write(
        fg / "catalog/worker-catalog.json",
        json.dumps(
            {
                "schema_version": "1.0.0",
                "updated_at": NOW,
                "generators": [g["id"] for g in GENERATORS],
            },
            indent=2,
        )
        + "\n",
    )
    write(
        fg / "catalog/schema-catalog.json",
        json.dumps(
            {"schema_version": "1.0.0", "updated_at": NOW, "schemas": ["framework-generator-payload.schema.json", "generation-spec.schema.json"]},
            indent=2,
        )
        + "\n",
    )
    write(
        fg / "catalog/template-catalog.json",
        json.dumps(
            {"schema_version": "1.0.0", "updated_at": NOW, "templates": ["core/packages/templates/worker/", "core/packages/templates/skill/", "core/packages/templates/artifact/"]},
            indent=2,
        )
        + "\n",
    )
    write(
        ROOT / "configs" / "sample-capability.yaml",
        """# Sample capability spec — Architecture Consultant → Worker package
capability: Architecture Consultant
version: 0.1.0
target_generator: worker-generator
outputs:
  worker_id: architecture-consultant
  pipeline: solution-architecture
registries:
  - workers
  - skills
  - schemas
semver: 0.1.0
""",
    )


def create_pipeline() -> None:
    pdir = ROOT / "pipelines" / PIPELINE
    worker_ids = [g["id"] for g in GENERATORS]
    pipeline = {
        "schema_version": "1.0.0",
        "id": PIPELINE,
        "title": "Framework Generator Pipeline",
        "version": VERSION,
        "status": "draft",
        "worker_class": "discovery",
        "gate_profile": "standard",
        "allows_feature_workers": False,
        "side_effect_ceiling": ["none", "runtime-write"],
        "workers": worker_ids,
        "dependency_graph_ref": {
            "path": f"core/packages/pipelines/{PIPELINE}/dependency-graph.json",
            "artifact_id": "art_fg_pipeline_deps",
            "schema": "core/packages/schemas/pipeline-dependency-graph.schema.json",
        },
  "waves": WAVES,
  "created_at": NOW,
  "primary_output_type": "framework-generation",
        "validator_id": "framework-generator-schema-check",
        "reviewer_id": "framework-generator-coverage-review",
        "goal": {
            "title": "Self-extensible framework generation from capability specs",
            "problem": "Enable configuration-driven creation of Workers, Validators, Reviewers, Pipelines, and artifacts without manual coding.",
            "success_criteria": [
                {"id": "ten-generators", "description": "Ten generator workers registered with full worker packages"},
                {"id": "config-driven", "description": "YAML/JSON capability specs drive scaffold plans"},
                {"id": "self-registration", "description": "Output plans include registry targets"},
                {"id": "partitioned", "description": "Outputs under core/packages/scaffold/generators/<id>/"},
                {"id": "no-execution", "description": "Packaging only — generation not executed"},
            ],
            "non_goals": [
                "Execute generation in this milestone",
                "Modify previous pipeline workers",
                "Create project-specific business workers",
            ],
        },
        "extensions": {
            "schema": "core/packages/schemas/framework-generator-payload.schema.json",
            "contract": "core/packages/contracts/framework-generator.md",
            "output_types": ["framework-generation", "framework-generation-status", "framework-generation-report", "gate-framework-generation-report"],
            "consumes": COMMON_CONSUMES,
            "produces": ["core/packages/scaffold/"],
            "configuration_driven": True,
            "semver_policy": "semantic",
        },
    }
    write(pdir / "pipeline.json", json.dumps(pipeline, indent=2) + "\n")

    nodes = [{"id": wid, "node_type": "worker", "label": wid, "worker_class": "discovery"} for wid in worker_ids]
    edges = []
    for g in GENERATORS:
        for dep in g["depends"]:
            edges.append({"predecessor": dep, "successor": g["id"], "type": "blocks", "relation": "requires"})
    graph = {
        "schema_version": "1.0.0",
        "artifact_id": "art_fg_pipeline_deps",
        "kind": "worker",
        "pipeline_id": PIPELINE,
        "title": "Framework Generator Worker Dependency Graph",
        "created_at": NOW,
        "notes": ["Framework Generator dependency graph — packaging only"],
        "nodes": nodes,
        "edges": edges,
        "extensions": {"schema": "pipeline-dependency-graph.schema.json", "allows_feature_workers": False},
    }
    write(pdir / "dependency-graph.json", json.dumps(graph, indent=2) + "\n")

    meta = {}
    for g in GENERATORS:
        meta[g["id"]] = {
            "wave": g["wave"],
            "partition": f"core/packages/scaffold/generators/{g['id']}/",
            "entry_kinds": g["entry_kinds"],
            "produces": ["framework-generation"],
        }
    write(pdir / ".workers-meta.json", json.dumps(meta, indent=2) + "\n")

    raci_rows = "\n".join(f"| `{k}` | `{g['id']}` |" for g in GENERATORS for k in g["entry_kinds"][:3])
    write(
        pdir / "RACI.md",
        f"""# RACI — Framework Generator

| entry_kind | Owner |
|------------|-------|
{raci_rows}

Packaging only — no generation execution.
""",
    )
    write(
        pdir / "README.md",
        f"""# Framework Generator Pipeline

**Version:** {VERSION} · **Workers:** {len(GENERATORS)} · **Waves:** {len(WAVES)}

Generates scaffold plans for framework components from YAML/JSON capability specs.

## Generators

{chr(10).join(f'- `{g["id"]}` — {g["title"]}' for g in GENERATORS)}

## Verification

```bash
npm run aios:framework-generator:smoke
```

Generation is **not** executed in packaging milestone.
""",
    )
    write(
        pdir / "execution-graph.md",
        """# Execution Graph

```mermaid
flowchart TD
  SG[schema-generator] --> WG[worker-generator]
  SG --> AG[artifact-generator]
  PG[prompt-generator]
  WG --> VG[validator-generator]
  WG --> RG[reviewer-generator]
  WG --> PL[pipeline-generator]
  VG --> PL
  RG --> PL
  WG --> TG[test-generator]
  WG --> DG[documentation-generator]
  PL --> DG
  SG --> BS[project-bootstrap-generator]
  AG --> BS
  PG --> BS
  WG --> BS
  VG --> BS
  RG --> BS
  PL --> BS
  TG --> BS
  DG --> BS
```

Wave 0: schema, artifact, prompt · Wave 1: worker, validator, reviewer, pipeline · Wave 2: test, documentation · Wave 3: bootstrap
""",
    )


def create_schema() -> None:
    schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://aios.dev/schemas/framework-generator-payload.schema.json",
        "title": "AIOS Framework Generator Payload",
        "description": "Framework Generator payloads v0.9.0. Scaffold plans only — never execute or mutate sources in packaging.",
        "type": "object",
        "additionalProperties": False,
        "required": ["schema_version", "artifact_id", "type", "worker_id", "title", "summary", "entries", "status", "created_at"],
        "properties": {
            "schema_version": {"$ref": "https://aios.dev/schemas/common.schema.json#/$defs/schemaVersion"},
            "artifact_id": {"$ref": "https://aios.dev/schemas/common.schema.json#/$defs/artifactId"},
            "type": {
                "type": "string",
                "enum": ["framework-generation", "framework-generation-status", "framework-generation-report"],
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
                        "id",
                        "entry_kind",
                        "statement",
                        "generation_id",
                        "target",
                        "spec_ref",
                        "output_plan",
                        "evidence",
                        "impact",
                        "severity",
                        "recommendation",
                        "alternative_solution",
                        "confidence",
                        "source_paths",
                        "unknowns",
                        "traceability",
                        "folder_mirror",
                    ],
                    "properties": {
                        "id": {"type": "string", "minLength": 2},
                        "entry_kind": {"type": "string", "minLength": 1},
                        "statement": {"type": "string", "minLength": 1},
                        "generation_id": {"type": "string", "minLength": 1},
                        "target": {"type": "string", "minLength": 1},
                        "spec_ref": {"type": "string", "minLength": 1},
                        "output_plan": {"type": "object"},
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
    write(ROOT / "schemas" / "framework-generator-payload.schema.json", json.dumps(schema, indent=2) + "\n")
    write(
        ROOT / "schemas" / "generation-spec.schema.json",
        json.dumps(
            {
                "$schema": "https://json-schema.org/draft/2020-12/schema",
                "$id": "https://aios.dev/schemas/generation-spec.schema.json",
                "title": "Generation Capability Spec",
                "type": "object",
                "required": ["capability", "version", "target_generator"],
                "properties": {
                    "capability": {"type": "string"},
                    "version": {"type": "string"},
                    "target_generator": {"type": "string"},
                    "outputs": {"type": "object"},
                    "registries": {"type": "array", "items": {"type": "string"}},
                    "semver": {"type": "string"},
                },
            },
            indent=2,
        )
        + "\n",
    )
    write(
        ROOT / "schemas" / "gate-framework-generation-report.schema.json",
        json.dumps(
            {
                "$schema": "https://json-schema.org/draft/2020-12/schema",
                "$id": "https://aios.dev/schemas/gate-framework-generation-report.schema.json",
                "title": "Gate Framework Generation Report",
                "allOf": [
                    {"$ref": "https://aios.dev/schemas/framework-generator-payload.schema.json"},
                    {"properties": {"type": {"const": "framework-generation-report"}}},
                ],
            },
            indent=2,
        )
        + "\n",
    )


def create_gate_packages() -> None:
    write(
        ROOT / "validators" / "framework-generator-schema-check" / "manifest.json",
        json.dumps(
            {
                "schema_version": "1.0.0",
                "id": "framework-generator-schema-check",
                "version": VERSION,
                "title": "Framework Generator Schema Check",
                "description": "Deterministic checks for framework-generator payloads.",
                "applies_to": ["framework-generation", "framework-generation-status", "framework-generation-report"],
                "checks": [
                    {"check_id": "schema-valid", "severity": "critical", "rule": "payload validates against framework-generator-payload.schema.json"},
                    {"check_id": "folder-mirror-partition", "severity": "critical", "rule": "folder_mirror starts with core/packages/scaffold/generators/<worker_id>/"},
                    {"check_id": "spec-ref-present", "severity": "high", "rule": "spec_ref present or UNKNOWN documented"},
                    {"check_id": "registry-plan", "severity": "high", "rule": "output_plan.registries lists target registries"},
                    {"check_id": "no-execution-flag", "severity": "critical", "rule": "packaging milestone — execute_generation must be false on workers"},
                ],
            },
            indent=2,
        )
        + "\n",
    )
    write(
        ROOT / "validators" / "framework-generator-schema-check" / "SPEC.md",
        "# Framework Generator Schema Check\n\nDeterministic gate for framework-generation payloads.\n",
    )
    write(
        ROOT / "reviewers" / "framework-generator-coverage-review" / "manifest.json",
        json.dumps(
            {
                "schema_version": "1.0.0",
                "id": "framework-generator-coverage-review",
                "version": VERSION,
                "title": "Framework Generator Coverage Review",
                "description": "Qualitative coverage of generator modes, template reuse, and self-registration plans.",
                "applies_to": ["framework-generation"],
                "rubric_ref": "core/packages/reviewers/framework-generator-coverage-review/rubric/framework-generator-coverage.json",
            },
            indent=2,
        )
        + "\n",
    )
    write(
        ROOT / "reviewers" / "framework-generator-coverage-review" / "rubric" / "framework-generator-coverage.json",
        json.dumps(
            {
                "schema_version": "1.0.0",
                "id": "framework-generator-coverage",
                "dimensions": [
                    {"id": "mode-coverage", "weight": 0.25},
                    {"id": "template-reuse", "weight": 0.25},
                    {"id": "registry-self-registration", "weight": 0.25},
                    {"id": "semver-migration", "weight": 0.25},
                ],
            },
            indent=2,
        )
        + "\n",
    )


def create_contract() -> None:
    write(
        ROOT / "contracts" / "framework-generator.md",
        f"""# Framework Generator Contract

**Version:** {FW_VERSION} · **Pipeline:** `{PIPELINE}`

## Invariants

1. **No execution** — packaging milestone generates plans only; do not run generators.
2. **No mutation** — never modify existing workers, validators, reviewers, or pipelines from prior sprints.
3. **Configuration-driven** — capability specs as YAML/JSON under `core/packages/configs/` or task input.
4. **Partitioned output** — `core/packages/scaffold/generators/<worker_id>/` via `folder_mirror`.
5. **Self-registration plans** — output_plan lists registry targets; registries updated only in execution phase.

## Consumes

`core/packages/templates/`, `core/packages/schemas/`, `core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/` (alias `pipeline/`), `artifacts/knowledge/`, `core/packages/configs/`, `artifacts/`, `core/packages/registry/`

## Produces

`core/packages/scaffold/` (generators, bootstrap, scaffolding, templates, registries, catalog)

## Artifact types

- `framework-generation` — primary scaffold plan
- `framework-generation-status` — rollup status
- `framework-generation-report` — human report
- `gate-framework-generation-report` — gate envelope
- `generation-spec` — input capability spec

## Semantic versioning

Generated packages use semver with migration notes and deprecation paths in output_plan.
""",
    )
    write(ROOT / "framework-generator" / "TEMPLATE.md", "# Framework Generator output partition\n\nScaffold plans land under `core/packages/scaffold/generators/<worker_id>/`.\n")


def update_registries() -> None:
    for fname, kind in [
        ("workers.json", "workers"),
        ("skills.json", "skills"),
        ("validators.json", "validators"),
        ("reviewers.json", "reviewers"),
        ("artifact-types.json", "artifact-types"),
    ]:
        path = ROOT / "registry" / fname
        data = json.loads(path.read_text())
        data["updated_at"] = NOW

    workers = json.loads((ROOT / "registry" / "workers.json").read_text())
    skills = json.loads((ROOT / "registry" / "skills.json").read_text())
    validators = json.loads((ROOT / "registry" / "validators.json").read_text())
    reviewers = json.loads((ROOT / "registry" / "reviewers.json").read_text())
    artifacts = json.loads((ROOT / "registry" / "artifact-types.json").read_text())

    for g in GENERATORS:
        wid = g["id"]
        workers["entries"][wid] = {
            "id": wid,
            "path": f"core/packages/workers/{wid}",
            "version": VERSION,
            "status": "draft",
            "description": g["mission"],
            "worker_class": "discovery",
            "pipeline": PIPELINE,
            "skill_id": wid,
            "depends_on_workers": g["depends"],
            "consumes": COMMON_CONSUMES,
            "produces": [f"core/packages/scaffold/generators/{wid}/"],
        }
        skills["entries"][wid] = {
            "id": wid,
            "path": f"skills/{wid}",
            "version": VERSION,
            "status": "draft",
            "description": g["mission"],
        }

    validators["entries"]["framework-generator-schema-check"] = {
        "id": "framework-generator-schema-check",
        "path": "core/packages/validators/framework-generator-schema-check",
        "version": VERSION,
        "status": "draft",
        "description": "Deterministic checks for framework-generator payloads.",
    }
    reviewers["entries"]["framework-generator-coverage-review"] = {
        "id": "framework-generator-coverage-review",
        "path": "core/packages/reviewers/framework-generator-coverage-review",
        "version": VERSION,
        "status": "draft",
        "description": "Qualitative coverage of generator scaffold plans.",
    }
    for tid, desc in [
        ("framework-generation", "Scaffold plan for generated framework component"),
        ("framework-generation-status", "Rollup status for framework generation"),
        ("framework-generation-report", "Human-readable framework generation report"),
        ("gate-framework-generation-report", "Gate envelope for framework generation"),
        ("generation-spec", "YAML/JSON capability specification for generators"),
    ]:
        artifacts["entries"][tid] = {
            "id": tid,
            "description": desc,
            "payload_kinds": ["json", "yaml", "markdown"],
            "status": "active",
        }

    workers["updated_at"] = NOW
    skills["updated_at"] = NOW
    validators["updated_at"] = NOW
    reviewers["updated_at"] = NOW
    artifacts["updated_at"] = NOW

    write(ROOT / "registry" / "workers.json", json.dumps(workers, indent=2) + "\n")
    write(ROOT / "registry" / "skills.json", json.dumps(skills, indent=2) + "\n")
    write(ROOT / "registry" / "validators.json", json.dumps(validators, indent=2) + "\n")
    write(ROOT / "registry" / "reviewers.json", json.dumps(reviewers, indent=2) + "\n")
    write(ROOT / "registry" / "artifact-types.json", json.dumps(artifacts, indent=2) + "\n")


def main() -> None:
    create_framework_generator_tree()
    for g in GENERATORS:
        create_worker_package(g)
    create_pipeline()
    create_schema()
    create_gate_packages()
    create_contract()
    update_registries()
    write(ROOT / "VERSION", FW_VERSION + "\n")
    print(f"Generated Framework Generator @ {FW_VERSION} — {len(GENERATORS)} workers")


if __name__ == "__main__":
    main()
