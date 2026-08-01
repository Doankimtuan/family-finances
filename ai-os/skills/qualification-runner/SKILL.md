---
name: qualification-runner
description: Plan qualification suites verifying pipeline execution, worker cooperation, artifact/knowledge/specification integrity, and execution stability.
---

# Qualification Runner

> Evaluate only. Never modify framework components. Never regenerate workers. Never execute benchmarks in packaging milestone.

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/` (alias `pipeline/`), `artifacts/`, `schemas/`, `templates/`, `reports/`, `knowledge/`, `specifications/`, `registry/`

## Produces

`qualification/benchmarks/qualification-runner/` → `qualification-finding` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `pipeline-execution` | Owned per RACI |
| `worker-cooperation` | Owned per RACI |
| `artifact-integrity` | Owned per RACI |
| `knowledge-integrity` | Owned per RACI |
| `specification-integrity` | Owned per RACI |
| `execution-stability` | Owned per RACI |

See `pipelines/qualification-framework/RACI.md`.

## Procedure

1. Require benchmark-runner evidence paths.
2. Plan suites for pipeline-execution, worker-cooperation, artifact-integrity, knowledge-integrity, specification-integrity, execution-stability.
3. Each suite cites expected PASS criteria from contract certification thresholds.
4. Never execute pipelines in packaging milestone.
5. All six entry_kinds required or UNKNOWN with justification.

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

- Do not modify workers/, validators/, reviewers/, schemas/ from prior sprints.
- Do not regenerate Framework Generator outputs.
- Do not invent ground-truth metrics.
- Do not execute benchmarks in packaging milestone.
