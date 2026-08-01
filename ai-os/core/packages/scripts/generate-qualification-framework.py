#!/usr/bin/env python3
"""Scaffold Qualification Framework pipeline v0.10.0 (packaging only — no benchmark execution)."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
PIPELINE = "qualification-framework"
PKG_VERSION = "0.1.0"
FW_VERSION = "0.10.0"

COMMON_CONSUMES = [
    "workers", "validators", "reviewers", "pipelines", "artifacts",
    "schemas", "templates", "reports", "knowledge", "specifications", "registry",
]

# Topologically valid wave assignment
WORKERS = [
    {
        "id": "reference-project-catalog",
        "title": "Reference Project Catalog",
        "mission": "Catalog benchmark reference projects with expected outputs, metrics, specifications, ground truth, and acceptance thresholds. Never modify framework components.",
        "entry_kinds": [
            "catalog-entry", "ground-truth", "expected-outputs", "expected-metrics",
            "expected-specifications", "acceptance-threshold",
        ],
        "depends": [],
        "wave": 0,
        "modes": [
            "Small React", "Large React", "Next.js", "Vue", "Angular", "Node Backend",
            "NestJS", "Monorepo", "Microservices", "Desktop", "Mobile", "CLI", "Library", "Full Stack",
        ],
        "output_type": "qualification-finding",
        "partition": "governance/qualification/reference-projects/reference-project-catalog/",
    },
    {
        "id": "benchmark-runner",
        "title": "Benchmark Runner",
        "mission": "Plan execution of the complete AIOS against benchmark repositories: full, incremental, partial, comparison, and repeatability modes. Never modify framework; never execute in packaging.",
        "entry_kinds": [
            "full-analysis", "incremental-analysis", "partial-analysis",
            "repository-comparison", "repeatability-test", "benchmark-report-plan",
        ],
        "depends": ["reference-project-catalog"],
        "wave": 1,
        "modes": ["Full Analysis", "Incremental Analysis", "Partial Analysis", "Repository Comparison", "Repeatability Tests"],
        "output_type": "qualification-finding",
        "partition": "governance/qualification/benchmarks/benchmark-runner/",
    },
    {
        "id": "qualification-runner",
        "title": "Qualification Runner",
        "mission": "Plan qualification suites verifying pipeline execution, worker cooperation, artifact/knowledge/specification integrity, and execution stability.",
        "entry_kinds": [
            "pipeline-execution", "worker-cooperation", "artifact-integrity",
            "knowledge-integrity", "specification-integrity", "execution-stability",
        ],
        "depends": ["benchmark-runner"],
        "wave": 2,
        "modes": ["Pipeline Execution", "Worker Cooperation", "Artifact Integrity", "Knowledge Integrity", "Specification Integrity", "Execution Stability"],
        "output_type": "qualification-finding",
        "partition": "governance/qualification/benchmarks/qualification-runner/",
    },
    {
        "id": "evaluation-engine",
        "title": "Evaluation Engine",
        "mission": "Plan evaluation of every generated artifact for accuracy, completeness, consistency, traceability, maintainability, extensibility, AI reliability, and documentation quality.",
        "entry_kinds": [
            "accuracy", "completeness", "consistency", "traceability",
            "maintainability", "extensibility", "ai-reliability", "documentation-quality",
        ],
        "depends": ["benchmark-runner"],
        "wave": 2,
        "modes": ["Accuracy", "Completeness", "Consistency", "Traceability", "Maintainability", "Extensibility", "AI Reliability", "Documentation Quality"],
        "output_type": "qualification-finding",
        "partition": "governance/qualification/metrics/evaluation-engine/",
    },
    {
        "id": "stress-test-runner",
        "title": "Stress Test Runner",
        "mission": "Plan stress tests: large repos, monorepos, microservices, huge dependency graphs, long pipelines, repeated execution, memory pressure.",
        "entry_kinds": [
            "large-repository", "monorepo", "microservice", "huge-dependency-graph",
            "long-pipeline", "repeated-execution", "memory-pressure",
        ],
        "depends": ["benchmark-runner"],
        "wave": 2,
        "modes": ["Large Repository", "Monorepo", "Microservice", "Huge Dependency Graph", "Long Pipeline", "Repeated Execution", "Memory Pressure"],
        "output_type": "qualification-finding",
        "partition": "governance/qualification/benchmarks/stress-test-runner/",
    },
    {
        "id": "metrics-engine",
        "title": "Metrics Engine",
        "mission": "Plan collection of coverage, performance, and reliability metrics including recall, token usage, failure rate, retry count, and confidence distribution.",
        "entry_kinds": [
            "repository-coverage", "feature-coverage", "business-rule-coverage", "api-coverage",
            "database-coverage", "ui-coverage", "specification-coverage", "traceability-coverage",
            "execution-time", "token-usage", "failure-rate", "retry-count", "confidence-distribution",
        ],
        "depends": ["evaluation-engine", "qualification-runner"],
        "wave": 3,
        "modes": ["Coverage Metrics", "Performance Metrics", "Reliability Metrics"],
        "output_type": "qualification-scores",
        "partition": "governance/qualification/metrics/metrics-engine/",
    },
    {
        "id": "coverage-analyzer",
        "title": "Coverage Analyzer",
        "mission": "Identify missing features, business rules, APIs, requirements, specifications, relationships, and traceability gaps against ground truth.",
        "entry_kinds": [
            "missing-features", "missing-business-rules", "missing-apis", "missing-requirements",
            "missing-specifications", "missing-relationships", "missing-traceability",
        ],
        "depends": ["evaluation-engine", "metrics-engine"],
        "wave": 4,
        "modes": ["Feature Gaps", "Business Rule Gaps", "API Gaps", "Requirement Gaps", "Spec Gaps", "Relationship Gaps", "Traceability Gaps"],
        "output_type": "qualification-finding",
        "partition": "governance/qualification/metrics/coverage-analyzer/",
    },
    {
        "id": "regression-runner",
        "title": "Regression Runner",
        "mission": "Compare framework versions to detect regression, lost capabilities, governance/quality/performance drops, output differences, and breaking changes.",
        "entry_kinds": [
            "regression", "lost-capability", "quality-drop", "performance-drop",
            "output-difference", "breaking-change",
        ],
        "depends": ["metrics-engine", "evaluation-engine"],
        "wave": 4,
        "modes": ["Version Diff", "Capability Diff", "Quality Diff", "Performance Diff", "Output Diff", "Breaking Change"],
        "output_type": "qualification-finding",
        "partition": "governance/qualification/benchmarks/regression-runner/",
    },
    {
        "id": "certification-engine",
        "title": "Certification Engine",
        "mission": "Evaluate framework against certification thresholds and emit certification report, capability/quality/coverage/reliability matrices, maturity assessment, and release recommendation.",
        "entry_kinds": [
            "certification-report", "capability-matrix", "quality-matrix", "coverage-matrix",
            "reliability-matrix", "maturity-assessment", "release-recommendation",
        ],
        "depends": [
            "metrics-engine", "coverage-analyzer", "regression-runner",
            "stress-test-runner", "qualification-runner",
        ],
        "wave": 5,
        "modes": ["Certification Report", "Capability Matrix", "Quality Matrix", "Coverage Matrix", "Reliability Matrix", "Maturity", "Release Recommendation"],
        "output_type": "certification-report",
        "partition": "governance/qualification/certification/certification-engine/",
    },
    {
        "id": "release-qualification-board",
        "title": "Release Qualification Board",
        "mission": "Aggregate all benchmarks into PASS/FAIL, Go/No-Go, release candidate decision, known limitations, production readiness, and improvement backlog.",
        "entry_kinds": [
            "pass-fail", "go-no-go", "release-candidate-decision",
            "known-limitations", "production-readiness", "improvement-backlog",
        ],
        "depends": ["certification-engine"],
        "wave": 6,
        "modes": ["PASS/FAIL", "Go/No-Go", "Release Candidate", "Known Limitations", "Production Readiness", "Improvement Backlog"],
        "output_type": "release-qualification-decision",
        "partition": "governance/qualification/release/release-qualification-board/",
    },
]

WAVES: list[list[str]] = [[] for _ in range(7)]
for w in WORKERS:
    WAVES[w["wave"]].append(w["id"])

CERT_THRESHOLDS = {
    "feature_discovery_recall": 0.95,
    "business_rule_coverage": 0.90,
    "specification_completeness": 0.95,
    "traceability": 1.0,
    "critical_failures": 0,
    "pipeline_completion": 0.99,
    "worker_reliability": 0.98,
    "documentation_coverage": 0.95,
}

REFERENCE_PROJECTS = [
    "small-react-app", "large-react-app", "nextjs-app", "vue-app", "angular-app",
    "node-backend", "nestjs-backend", "monorepo", "microservices", "desktop-app",
    "mobile-app", "cli-project", "library-project", "fullstack-project",
]

SKILL_PROCEDURES = {
    "reference-project-catalog": """1. Enumerate required reference project types from contract (14 project classes).
2. For each project class, plan catalog-entry with expected-outputs, expected-metrics, expected-specifications, ground-truth, acceptance-threshold.
3. Bind thresholds from certification requirements; mark absent ground truth as UNKNOWN.
4. Write plans under governance/qualification/reference-projects/ only — never invent repo contents.
5. Emit one entry per owned entry_kind covering all project classes or UNKNOWN per class.""",
    "benchmark-runner": """1. Load catalog from reference-project-catalog partition evidence.
2. For every catalog project, plan five mandatory modes: full, incremental, partial, resume, retry (map resume/retry under full-analysis extensions or dedicated plan notes).
3. Also plan repository-comparison and repeatability-test entries.
4. Cite core/packages/workers/, core/packages/pipelines/, core/packages/schemas/ as soft consumes; never mutate them.
5. Emit benchmark-report-plan summarizing planned report paths under governance/qualification/benchmarks/.""",
    "qualification-runner": """1. Require benchmark-runner evidence paths.
2. Plan suites for pipeline-execution, worker-cooperation, artifact-integrity, knowledge-integrity, specification-integrity, execution-stability.
3. Each suite cites expected PASS criteria from contract certification thresholds.
4. Never execute pipelines in packaging milestone.
5. All six entry_kinds required or UNKNOWN with justification.""",
    "evaluation-engine": """1. Soft-read planned benchmark artifacts and ground-truth refs.
2. Score dimensions: accuracy, completeness, consistency, traceability, maintainability, extensibility, ai-reliability, documentation-quality.
3. Each dimension entry includes measurement method + acceptance threshold.
4. Prefer path evidence; never invent scores — packaging uses planned metric placeholders with UNKNOWN for measured values.
5. Eight entry_kinds required.""",
    "stress-test-runner": """1. Select stress profiles from catalog (large, monorepo, microservice, huge-dependency-graph).
2. Plan long-pipeline, repeated-execution, memory-pressure scenarios with stop conditions.
3. Record expected failure-recovery observables without executing.
4. Seven entry_kinds required or UNKNOWN.
5. Never modify framework under stress plans.""",
    "metrics-engine": """1. Consume evaluation-engine + qualification-runner evidence.
2. Emit qualification-scores with metric_id, metric_value (or UNKNOWN), unit, threshold, result.
3. Cover coverage metrics, performance (execution-time, token-usage), reliability (failure-rate, retry-count, confidence-distribution).
4. All 13 metric entry_kinds represented or UNKNOWN.
5. CSV/JSON scorecard paths planned under governance/qualification/metrics/ and scorecards/.""",
    "coverage-analyzer": """1. Diff ground-truth from catalog against planned evaluation/metrics results.
2. Emit missing-* findings with severity; critical when certification threshold would fail.
3. Traceability gaps are always critical (threshold 100%).
4. Seven gap entry_kinds required.
5. Never regenerate missing artifacts — report only.""",
    "regression-runner": """1. Accept baseline_version + candidate_version in generation-spec or config.
2. Plan diffs: regression, lost-capability, quality-drop, performance-drop, output-difference, breaking-change.
3. Cite VERSION + RELEASE_NOTES_* as evidence sources.
4. Six entry_kinds required.
5. Never mutate either framework version under comparison.""",
    "certification-engine": """1. Aggregate metrics, coverage, regression, stress, qualification evidence.
2. Apply certification thresholds; fail closed on critical_failures > 0 or unmet thresholds.
3. Emit certification-report + four matrices + maturity-assessment + release-recommendation.
4. Matrices as structured entries with folder_mirror under governance/qualification/certification/.
5. Seven entry_kinds required.""",
    "release-qualification-board": """1. Consume certification-engine primary payload.
2. Emit pass-fail, go-no-go, release-candidate-decision, known-limitations, production-readiness, improvement-backlog.
3. GO only if all certification thresholds met and critical_failures == 0.
4. Partition under governance/qualification/release/; mirror scorecards/ and artifacts/reports/.
5. Six entry_kinds required; packaging sample demonstrates NO-GO with UNKNOWN measured metrics.""",
}


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def raci_md() -> str:
    rows = []
    for w in WORKERS:
        for k in w["entry_kinds"]:
            rows.append(f"| `{k}` | `{w['id']}` |")
    return f"""# RACI — Qualification Framework

Complete entry_kind ownership. Workers must not emit kinds owned by another worker.

| entry_kind | Owner |
|------------|-------|
{chr(10).join(rows)}

## Overlap resolution

| Concern | Owner | Not owner |
|---------|-------|-----------|
| Ground truth / catalog | reference-project-catalog | all runners |
| Benchmark execution plans | benchmark-runner | evaluation-engine |
| Metric collection | metrics-engine | coverage-analyzer |
| Gap identification | coverage-analyzer | metrics-engine |
| Certification thresholds | certification-engine | release-qualification-board (consumes) |
| Go/No-Go decision | release-qualification-board | certification-engine |

**Never modify framework components. Never regenerate workers. Evaluate only.**

Packaging only — benchmarks not executed.
"""


def gen_skill(w: dict) -> str:
    kinds = "\n".join(f"| `{k}` | Owned per RACI |" for k in w["entry_kinds"])
    return f"""---
name: {w["id"]}
description: {w["mission"]}
---

# {w["title"]}

> Evaluate only. Never modify framework components. Never regenerate workers. Never execute benchmarks in packaging milestone.

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/` (alias `pipeline/`), `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`, `core/packages/registry/`

## Produces

`{w["partition"]}` → `{w["output_type"]}` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
{kinds}

See `core/packages/pipelines/qualification-framework/RACI.md`.

## Procedure

{SKILL_PROCEDURES[w["id"]]}

## Heuristics

- Prefer path evidence from catalog/ground-truth; mark unmeasured values `UNKNOWN: …`.
- Fail closed on critical certification breaches when measured values exist.
- Reproducible report plans only — no side effects on prior pipelines.
- Respect RACI — do not duplicate another worker's entry_kinds.

## Done when

- All owned entry_kinds represented (or explicit UNKNOWN)
- Full payload fields + valid `folder_mirror`
- No framework mutation; no benchmark execution

## Negative examples

- Do not modify core/packages/workers/, core/packages/validators/, core/packages/reviewers/, core/packages/schemas/ from prior sprints.
- Do not regenerate Framework Generator outputs.
- Do not invent ground-truth metrics.
- Do not execute benchmarks in packaging milestone.
"""


def gen_entry(w: dict, kind: str, idx: int, **extra) -> dict:
    part = w["partition"]
    e = {
        "id": f"qf_{w['id']}_{idx:03d}",
        "entry_kind": kind,
        "statement": f"Qualification plan for {kind} via {w['title']}",
        "qualification_id": f"qual_{w['id']}_sample",
        "target": part,
        "rule": f"{kind} per Qualification Framework contract + RACI",
        "result": "planned",
        "evidence": [
            "core/packages/contracts/qualification-framework.md",
            f"core/packages/pipelines/{PIPELINE}/RACI.md",
            "governance/qualification/reference-projects/",
        ],
        "impact": f"Enables reproducible {kind} evaluation without mutating the framework",
        "severity": "info",
        "recommendation": "Review plan before execution phase opens",
        "alternative_solution": "Manual audit against certification thresholds",
        "confidence": 0.8,
        "source_paths": ["core/packages/workers/", "core/packages/pipelines/", "core/packages/schemas/", "core/packages/templates/"],
        "unknowns": ["UNKNOWN: benchmarks not executed in packaging milestone"],
        "traceability": {
            "pipeline": PIPELINE,
            "worker": w["id"],
            "certification_thresholds": CERT_THRESHOLDS,
        },
        "folder_mirror": f"{part}{kind}.json",
        "metric_value": None,
        "threshold": None,
    }
    e.update(extra)
    return e


def gen_payload(w: dict, multi: bool = False) -> dict:
    kinds = w["entry_kinds"]
    if multi:
        entries = [gen_entry(w, k, i + 1) for i, k in enumerate(kinds)]
    else:
        # at least 2 for smoke multi-mode on board/cert; default first 2
        take = kinds[: max(2, min(3, len(kinds)))]
        entries = [gen_entry(w, k, i + 1) for i, k in enumerate(take)]

    # Gold NO-GO for release board
    if w["id"] == "release-qualification-board":
        entries = [
            gen_entry(w, "pass-fail", 1, severity="high", result="fail",
                      statement="PASS/FAIL: FAIL — measured metrics UNKNOWN; cannot certify",
                      unknowns=["UNKNOWN: no benchmark run results"]),
            gen_entry(w, "go-no-go", 2, severity="critical", result="fail",
                      statement="NO-GO — packaging milestone; Critical Failures unknown; Traceability unmeasured",
                      recommendation="Execute benchmarks before release consideration"),
            gen_entry(w, "release-candidate-decision", 3, result="fail",
                      statement="Not a release candidate until certification thresholds are measured"),
            gen_entry(w, "known-limitations", 4,
                      statement="Packaging only: benchmarks, stress, and regression not executed"),
            gen_entry(w, "production-readiness", 5, result="fail",
                      statement="Not production-ready pending measured certification"),
            gen_entry(w, "improvement-backlog", 6,
                      statement="Backlog: execute 14 reference projects through full RE + incremental + partial + resume + retry"),
        ]

    if w["id"] == "certification-engine":
        entries = [
            gen_entry(w, "certification-report", 1,
                      statement="Certification report plan — thresholds defined; measured values UNKNOWN until execution",
                      threshold=CERT_THRESHOLDS),
            gen_entry(w, "capability-matrix", 2),
            gen_entry(w, "quality-matrix", 3),
            gen_entry(w, "coverage-matrix", 4),
            gen_entry(w, "reliability-matrix", 5),
            gen_entry(w, "maturity-assessment", 6),
            gen_entry(w, "release-recommendation", 7, severity="high", result="fail",
                      statement="Recommend HOLD until benchmarks execute and thresholds are measured"),
        ]

    if w["id"] == "metrics-engine":
        # cover all score dimensions in sample
        entries = [
            gen_entry(w, k, i + 1, metric_value=None, threshold=CERT_THRESHOLDS.get(k.replace("-", "_")))
            for i, k in enumerate(kinds)
        ]

    return {
        "schema_version": "1.0.0",
        "artifact_id": f"art_qf_{w['id']}_primary",
        "type": w["output_type"],
        "worker_id": w["id"],
        "title": f"{w['title']} sample",
        "summary": f"Sample {w['output_type']} for {w['id']} (packaging; benchmarks not executed)",
        "entries": entries,
        "status": "draft",
        "created_at": NOW,
    }


def create_worker(w: dict) -> None:
    wid = w["id"]
    wdir = ROOT / "workers" / wid
    sdir = ROOT / "skills" / wid
    multi = wid in ("metrics-engine", "certification-engine", "release-qualification-board", "reference-project-catalog")
    payload = gen_payload(w, multi=multi)

    write(wdir / "README.md", f"""# Worker — `{wid}`

> **Pipeline:** `{PIPELINE}` · **Status:** draft · **Evaluate only — never modify framework**  
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

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`

## Produces

`{w["partition"]}` → `{w["output_type"]}`

## Modes

{chr(10).join(f"- {m}" for m in w["modes"])}

## References

- `core/packages/contracts/qualification-framework.md`
- `core/packages/pipelines/qualification-framework/`
- `core/packages/schemas/qualification-framework-payload.schema.json`
""")
    write(wdir / "skill.md", f"See `skills/{wid}/SKILL.md`.")
    write(wdir / "validator.md", f"""# Validator binding — `{wid}`

Pipeline gate: `qualification-framework-schema-check`

## Checks

1. Payload validates against `core/packages/schemas/qualification-framework-payload.schema.json`.
2. `folder_mirror` under `{w["partition"]}`.
3. entry_kind owned per RACI.
4. Never-mutate / never-regenerate / evaluate-only invariants.
""")
    write(wdir / "reviewer.md", f"""# Reviewer binding — `{wid}`

Pipeline gate: `qualification-framework-coverage-review`

## Rubric focus

- Certification threshold coverage
- Reproducibility of report plans
- RACI compliance
- Honest UNKNOWN for unmeasured metrics
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
| case-01-happy-path | Valid qualification plan |
| case-02-missing-ground-truth | UNKNOWN when catalog incomplete |
| case-03-threshold-breach | critical when measured value below threshold |
| case-04-raci-violation | fail on foreign entry_kind |
| case-05-framework-mutation | veto if mutate_framework true |
""")
    write(wdir / "manifest.json", json.dumps({
        "schema_version": "1.0.0",
        "id": wid,
        "version": PKG_VERSION,
        "title": w["title"],
        "implements_roles": ["orchestrator"] if "board" in wid else ["executor"],
        "side_effects": ["runtime-write"],
        "entrypoint": "skill.md",
        "status": "draft",
        "extensions": {
            "worker_class": "discovery",
            "pipeline": PIPELINE,
            "mutate_framework_components": False,
            "regenerate_workers": False,
            "execute_benchmarks": False,
            "evaluate_only": True,
            "remediation": FW_VERSION,
            "partition": w["partition"],
        },
    }, indent=2) + "\n")

    type_schema = {
        "qualification-finding": "qualification-finding.schema.json",
        "qualification-scores": "qualification-scores.schema.json",
        "certification-report": "certification-report.schema.json",
        "release-qualification-decision": "release-qualification-decision.schema.json",
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
        "role": "orchestrator" if "board" in wid else "executor",
        "grade": "guided",
        "inputs": [
            {"name": "goal", "artifact_type": "goal", "required": True, "description": "Qualification goal"},
        ] + [
            {"name": c, "artifact_type": "doc-source", "required": c in ("workers", "schemas", "pipelines"),
             "description": f"{c}/"}
            for c in COMMON_CONSUMES
        ],
        "outputs": [
            {"name": "primary", "artifact_type": w["output_type"], "primary": True,
             "description": w["output_type"]},
        ],
        "requires_skills": w["depends"],
        "validators": ["qualification-framework-schema-check"],
        "reviewers": ["qualification-framework-coverage-review"],
        "side_effects": ["runtime-write"],
        "status": "draft",
        "entrypoint": "SKILL.md",
        "extensions": {
            "pipeline": PIPELINE,
            "mutate_framework_components": False,
            "regenerate_workers": False,
            "execute_benchmarks": False,
            "evaluate_only": True,
            "partition": w["partition"],
            "raci": f"core/packages/pipelines/{PIPELINE}/RACI.md",
            "gate_output_type": "gate-qualification-report",
            "entry_kinds": w["entry_kinds"],
            "certification_thresholds": CERT_THRESHOLDS,
        },
    }, indent=2) + "\n")

    write(wdir / "examples/README.md", f"# Examples — `{wid}`\n")
    write(wdir / "examples/sample-input.json", json.dumps({
        "baseline_version": "0.9.1",
        "candidate_version": FW_VERSION,
        "mode": "packaging",
    }, indent=2) + "\n")
    write(wdir / "examples/sample-output.json", json.dumps({
        "type": w["output_type"], "worker_id": wid,
    }, indent=2) + "\n")
    write(wdir / "examples/sample-primary-payload.json", json.dumps(payload, indent=2) + "\n")

    for name, body in [
        ("case-01-happy-path.json", {"case_id": "case-01-happy-path", "worker_id": wid,
         "input": {"mode": "packaging"}, "expect": {"min_entries": 1, "requires_folder_mirror": True}}),
        ("case-02-missing-ground-truth.json", {"case_id": "case-02-missing-ground-truth", "worker_id": wid,
         "input": {"ground_truth": None}, "expect": {"unknowns_required": True}}),
        ("case-03-threshold-breach.json", {"case_id": "case-03-threshold-breach", "worker_id": wid,
         "input": {"feature_discovery_recall": 0.5}, "expect": {"severity_min": "critical"}}),
        ("case-04-raci-violation.json", {"case_id": "case-04-raci-violation", "worker_id": wid,
         "input": {"entry_kind": "foreign-kind"}, "expect": {"blocked": True}}),
        ("case-05-framework-mutation.json", {"case_id": "case-05-framework-mutation", "worker_id": wid,
         "input": {"mutate_framework_components": True}, "expect": {"veto": True}}),
    ]:
        write(wdir / "testcases" / name, json.dumps(body, indent=2) + "\n")
    write(wdir / "testcases/README.md", f"# Testcases — `{wid}`\n")

    # per-worker templates under qualification tree
    tpl = ROOT / "qualification" / "templates" / wid
    write(tpl / "report.template.md", f"""# {w["title"]} Report Template

Worker: `{wid}`  
Pipeline: `{PIPELINE}`

## Summary

{{{{summary}}}}

## Entries

{{{{entries}}}}

## Certification thresholds

{json.dumps(CERT_THRESHOLDS, indent=2)}
""")


def create_output_tree() -> None:
    write(ROOT / "qualification" / "README.md", f"""# Qualification Framework

**Pipeline:** `{PIPELINE}` · **Framework:** {FW_VERSION}

Objective evaluation, benchmarking, stress testing, and certification of AIOS.

## Layout

| Path | Purpose |
|------|---------|
| `benchmarks/` | Benchmark / qualification / stress / regression partitions |
| `metrics/` | Evaluation + metrics + coverage partitions |
| `certification/` | Certification engine outputs |
| `artifacts/reports/` | Aggregated human reports |
| `scorecards/` | Metric scorecards (JSON/CSV plans) |
| `reference-projects/` | Catalog + ground-truth plans |
| `release/` | Release Qualification Board decisions |
| `core/packages/templates/` | Report templates per worker |

## Invariants

- Never modify framework components
- Never regenerate workers
- Evaluate only
- Do not execute benchmarks in packaging milestone
""")
    for sub, note in [
        ("benchmarks", "Benchmark runner, qualification runner, stress, regression partitions."),
        ("metrics", "Evaluation, metrics engine, coverage analyzer partitions."),
        ("certification", "Certification reports and matrices."),
        ("reports", "Human-readable aggregated reports."),
        ("scorecards", "Scorecard plans (JSON/CSV)."),
        ("reference-projects", "Reference project catalog and ground truth."),
        ("release", "Release Qualification Board decisions."),
    ]:
        write(ROOT / "qualification" / sub / "README.md", f"# {sub}\n\n{note}\n")

    # scorecard + metrics catalog
    write(ROOT / "qualification" / "scorecards" / "metrics-catalog.json", json.dumps({
        "schema_version": "1.0.0",
        "updated_at": NOW,
        "certification_thresholds": CERT_THRESHOLDS,
        "metrics": [
            "feature_discovery_recall", "business_rule_coverage", "api_recall", "database_recall",
            "specification_completeness", "traceability_coverage", "architecture_consistency",
            "worker_reliability", "pipeline_stability", "execution_time", "memory_usage",
            "token_consumption", "retry_rate", "failure_recovery", "overall_ai_reliability",
        ],
    }, indent=2) + "\n")
    write(ROOT / "qualification" / "scorecards" / "scorecard.template.csv",
          "metric_id,metric_value,threshold,result,worker_id,project_id,notes\n")

    # reference project stubs (plans only — not real apps)
    for proj in REFERENCE_PROJECTS:
        write(ROOT / "qualification" / "reference-projects" / proj / "manifest.json", json.dumps({
            "id": proj,
            "class": proj,
            "status": "planned",
            "expected_outputs": ["discovery-report", "feature-inventory", "requirement-spec"],
            "expected_metrics": CERT_THRESHOLDS,
            "acceptance_threshold": CERT_THRESHOLDS,
            "ground_truth": "UNKNOWN: ground truth fixtures not loaded in packaging",
            "benchmark_modes_required": [
                "full-reverse-engineering", "incremental-analysis", "partial-analysis",
                "resume-pipeline", "retry-pipeline",
            ],
        }, indent=2) + "\n")
        write(ROOT / "qualification" / "reference-projects" / proj / "README.md",
              f"# Reference project plan — `{proj}`\n\nPackaging stub. No project-specific implementation.\n")

    write(ROOT / "qualification" / "reference-projects" / "catalog.json", json.dumps({
        "schema_version": "1.0.0",
        "updated_at": NOW,
        "projects": REFERENCE_PROJECTS,
        "benchmark_modes_required": [
            "full-reverse-engineering", "incremental-analysis", "partial-analysis",
            "resume-pipeline", "retry-pipeline",
        ],
    }, indent=2) + "\n")


def create_schemas() -> None:
    payload = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://aios.dev/schemas/qualification-framework-payload.schema.json",
        "title": "AIOS Qualification Framework Payload",
        "description": "Qualification Framework payloads v0.10.0. Evaluate only. Never mutate framework. Benchmarks not executed in packaging.",
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
                    "qualification-finding",
                    "qualification-scores",
                    "certification-report",
                    "release-qualification-decision",
                    "gate-qualification-report",
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
                        "id", "entry_kind", "statement", "qualification_id", "target", "rule",
                        "result", "evidence", "impact", "severity", "recommendation",
                        "alternative_solution", "confidence", "source_paths", "unknowns",
                        "traceability", "folder_mirror",
                    ],
                    "properties": {
                        "id": {"type": "string", "minLength": 2},
                        "entry_kind": {"type": "string", "minLength": 1},
                        "statement": {"type": "string", "minLength": 1},
                        "qualification_id": {"type": "string", "minLength": 1},
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
                        "metric_value": {"type": ["number", "null"]},
                        "threshold": {},
                    },
                },
            },
            "status": {"$ref": "https://aios.dev/schemas/common.schema.json#/$defs/artifactStatus"},
            "created_at": {"type": "string", "format": "date-time"},
        },
    }
    write(ROOT / "schemas" / "qualification-framework-payload.schema.json", json.dumps(payload, indent=2) + "\n")

    for name, const in [
        ("qualification-finding", "qualification-finding"),
        ("qualification-scores", "qualification-scores"),
        ("certification-report", "certification-report"),
        ("release-qualification-decision", "release-qualification-decision"),
        ("gate-qualification-report", "gate-qualification-report"),
    ]:
        write(ROOT / "schemas" / f"{name}.schema.json", json.dumps({
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": f"https://aios.dev/schemas/{name}.schema.json",
            "title": f"AIOS {name}",
            "allOf": [
                {"$ref": "https://aios.dev/schemas/qualification-framework-payload.schema.json"},
                {"type": "object", "properties": {"type": {"const": const}}},
            ],
        }, indent=2) + "\n")


def create_gates() -> None:
    write(ROOT / "validators" / "qualification-framework-schema-check" / "manifest.json", json.dumps({
        "schema_version": "1.0.0",
        "id": "qualification-framework-schema-check",
        "version": "0.1.0",
        "title": "Qualification Framework Schema Check",
        "description": "Deterministic checks for qualification-framework payloads.",
        "applies_to": [
            "qualification-finding", "qualification-scores",
            "certification-report", "release-qualification-decision", "gate-qualification-report",
        ],
        "checks": [
            {"check_id": "schema-valid", "severity": "critical",
             "rule": "payload validates against qualification-framework-payload.schema.json"},
            {"check_id": "folder-mirror-partition", "severity": "critical",
             "rule": "folder_mirror under governance/qualification/"},
            {"check_id": "raci-entry-kind", "severity": "critical",
             "rule": "entry_kind owned by worker_id per RACI.md"},
            {"check_id": "evaluate-only", "severity": "critical",
             "rule": "mutate_framework_components=false; regenerate_workers=false"},
            {"check_id": "no-benchmark-execution", "severity": "critical",
             "rule": "execute_benchmarks must be false in packaging"},
            {"check_id": "certification-thresholds-documented", "severity": "high",
             "rule": "certification-engine / board cite thresholds"},
            {"check_id": "metrics-dimension-coverage", "severity": "high",
             "rule": "type=qualification-scores: all 13 metric kinds or UNKNOWN"},
            {"check_id": "go-no-go-present", "severity": "high",
             "rule": "release-qualification-decision includes go-no-go"},
        ],
    }, indent=2) + "\n")
    write(ROOT / "validators" / "qualification-framework-schema-check" / "SPEC.md",
          "# Qualification Framework Schema Check\n\nDeterministic gate for qualification payloads.\n")

    write(ROOT / "reviewers" / "qualification-framework-coverage-review" / "manifest.json", json.dumps({
        "schema_version": "1.0.0",
        "id": "qualification-framework-coverage-review",
        "version": "0.1.0",
        "title": "Qualification Framework Coverage Review",
        "description": "Qualitative coverage of certification, reproducibility, and RACI.",
        "applies_to": [
            "qualification-finding", "qualification-scores",
            "certification-report", "release-qualification-decision",
        ],
        "rubric_ref": "core/packages/reviewers/qualification-framework-coverage-review/rubric/qualification-framework-coverage.json",
    }, indent=2) + "\n")
    write(ROOT / "reviewers" / "qualification-framework-coverage-review" / "rubric" / "qualification-framework-coverage.json",
          json.dumps({
              "schema_version": "1.0.0",
              "id": "qualification-framework-coverage",
              "version": "0.1.0",
              "title": "Qualification Framework Coverage Rubric",
              "score_mode": "weighted_0_1",
              "pass_threshold": 0.7,
              "criteria": [
                  {"id": "certification-threshold-coverage", "description": "All 8 certification rules cited", "weight": 0.2, "scale_min": 0, "scale_max": 1},
                  {"id": "reproducibility", "description": "Reports reproducible; UNKNOWN honest", "weight": 0.2, "scale_min": 0, "scale_max": 1},
                  {"id": "raci-compliance", "description": "No entry_kind overlap", "weight": 0.2, "scale_min": 0, "scale_max": 1},
                  {"id": "evaluate-only", "description": "No framework mutation / worker regeneration", "weight": 0.2, "scale_min": 0, "scale_max": 1},
                  {"id": "benchmark-mode-coverage", "description": "Full/incremental/partial/resume/retry planned", "weight": 0.2, "scale_min": 0, "scale_max": 1},
              ],
              "veto_conditions": [
                  "mutate_framework_components", "regenerate_workers",
                  "execute_benchmarks", "invent_ground_truth",
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
        "artifact_id": "art_qf_pipeline_deps",
        "kind": "worker",
        "pipeline_id": PIPELINE,
        "title": "Qualification Framework Worker Dependency Graph",
        "created_at": NOW,
        "notes": [
            "Packaging only — benchmarks not executed.",
            "Never modify framework components; evaluate only.",
            "Waves are a topological partition of the hard graph.",
        ],
        "nodes": nodes,
        "edges": edges,
        "extensions": {"schema": "pipeline-dependency-graph.schema.json", "allows_feature_workers": False},
    }, indent=2) + "\n")

    write(pdir / "pipeline.json", json.dumps({
        "schema_version": "1.0.0",
        "id": PIPELINE,
        "title": "Qualification Framework Pipeline",
        "version": PKG_VERSION,
        "status": "draft",
        "worker_class": "discovery",
        "gate_profile": "standard",
        "allows_feature_workers": False,
        "side_effect_ceiling": ["none", "runtime-write"],
        "workers": worker_ids,
        "dependency_graph_ref": {
            "path": f"core/packages/pipelines/{PIPELINE}/dependency-graph.json",
            "artifact_id": "art_qf_pipeline_deps",
            "schema": "core/packages/schemas/pipeline-dependency-graph.schema.json",
        },
        "waves": WAVES,
        "created_at": NOW,
        "primary_output_type": "release-qualification-decision",
        "validator_id": "qualification-framework-schema-check",
        "reviewer_id": "qualification-framework-coverage-review",
        "goal": {
            "title": "Prove AIOS production readiness via qualification",
            "problem": "Objectively evaluate, benchmark, stress test, and certify AIOS using reference projects without modifying the framework.",
            "success_criteria": [
                {"id": "ten-workers", "description": "Ten qualification workers registered with full packages"},
                {"id": "catalog-14", "description": "Fourteen reference project classes catalogued"},
                {"id": "cert-thresholds", "description": "Eight certification thresholds documented"},
                {"id": "valid-waves", "description": "Waves are topological partition of hard graph"},
                {"id": "no-execution", "description": "Benchmarks not executed in packaging"},
            ],
            "non_goals": [
                "Execute any benchmark",
                "Modify previous framework components",
                "Create project-specific implementations",
            ],
        },
        "extensions": {
            "schema": "core/packages/schemas/qualification-framework-payload.schema.json",
            "contract": "core/packages/contracts/qualification-framework.md",
            "output_types": [
                "qualification-finding", "qualification-scores",
                "certification-report", "release-qualification-decision",
                "gate-qualification-report",
            ],
            "consumes": COMMON_CONSUMES,
            "produces": ["governance/qualification/"],
            "evaluate_only": True,
            "certification_thresholds": CERT_THRESHOLDS,
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
    write(pdir / "README.md", f"""# Qualification Framework Pipeline

**Version:** {PKG_VERSION} · **Workers:** {len(WORKERS)} · **Waves:** {len(WAVES)}

Objective evaluation and certification of AIOS. Packaging only — **do not execute benchmarks**.

## Workers

{chr(10).join(f'- `{w["id"]}` — {w["title"]}' for w in WORKERS)}

## Verification

```bash
npm run aios:qualification-framework:smoke
```
""")
    write(pdir / "execution-graph.md", """# Execution Graph

```mermaid
flowchart TD
  RPC[reference-project-catalog] --> BR[benchmark-runner]
  BR --> QR[qualification-runner]
  BR --> EE[evaluation-engine]
  BR --> ST[stress-test-runner]
  EE --> ME[metrics-engine]
  QR --> ME
  ME --> CA[coverage-analyzer]
  EE --> CA
  ME --> RR[regression-runner]
  EE --> RR
  ME --> CE[certification-engine]
  CA --> CE
  RR --> CE
  ST --> CE
  QR --> CE
  CE --> RQB[release-qualification-board]
```

Waves are topologically valid — no hard edge within the same wave.
""")


def create_contract() -> None:
    write(ROOT / "contracts" / "qualification-framework.md", f"""# Qualification Framework Contract

**Version:** {FW_VERSION} · **Pipeline:** `{PIPELINE}`

## Invariants

1. **Evaluate only** — never modify framework components.
2. **Never regenerate workers** — prior sprint packages are read-only.
3. **No benchmark execution** in packaging milestone.
4. **Partitioned output** — under `governance/qualification/` via `folder_mirror`.
5. **Valid waves** — topological partition of the hard dependency graph.
6. **Reproducible reports** — support repeated benchmarking and version comparison when execution opens.

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/` (alias `pipeline/`), `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`, `core/packages/registry/`

## Produces

`governance/qualification/` (benchmarks, metrics, certification, reports, scorecards, reference-projects, release, templates)

## Artifact types

- `qualification-finding` — findings / gap / plan entries
- `qualification-scores` — metric scorecards
- `certification-report` — certification matrices + maturity
- `release-qualification-decision` — Go/No-Go board decision
- `gate-qualification-report` — gate envelope

## Benchmark modes (required per reference project when executed)

- Full Reverse Engineering
- Incremental Analysis
- Partial Analysis
- Resume Pipeline
- Retry Pipeline

## Certification thresholds

| Metric | Threshold |
|--------|-----------|
| Feature Discovery Recall | >= 95% |
| Business Rule Coverage | >= 90% |
| Specification Completeness | >= 95% |
| Traceability | >= 100% |
| Critical Failures | == 0 |
| Pipeline Completion | >= 99% |
| Worker Reliability | >= 98% |
| Documentation Coverage | >= 95% |

## Reference projects (14)

{chr(10).join(f"- `{p}`" for p in REFERENCE_PROJECTS)}
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
            "path": f"core/packages/workers/{wid}",
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

    validators["entries"]["qualification-framework-schema-check"] = {
        "id": "qualification-framework-schema-check",
        "path": "core/packages/validators/qualification-framework-schema-check",
        "version": "0.1.0",
        "status": "draft",
        "description": "Deterministic checks for qualification-framework payloads.",
    }
    reviewers["entries"]["qualification-framework-coverage-review"] = {
        "id": "qualification-framework-coverage-review",
        "path": "core/packages/reviewers/qualification-framework-coverage-review",
        "version": "0.1.0",
        "status": "draft",
        "description": "Qualitative coverage of qualification and certification plans.",
    }

    for tid, desc in [
        ("qualification-finding", "Qualification finding / gap / plan entry"),
        ("qualification-scores", "Qualification metric scorecard"),
        ("certification-report", "Certification report with matrices"),
        ("release-qualification-decision", "Release Qualification Board Go/No-Go decision"),
        ("gate-qualification-report", "Gate envelope for qualification framework"),
    ]:
        artifacts["entries"][tid] = {
            "id": tid,
            "description": desc,
            "payload_kinds": ["json", "markdown", "csv"],
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
    print(f"Generated Qualification Framework @ {FW_VERSION} — {len(WORKERS)} workers, {len(WAVES)} waves")


if __name__ == "__main__":
    main()
