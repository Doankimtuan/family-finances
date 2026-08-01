---
name: stress-test-runner
description: Plan stress tests: large repos, monorepos, microservices, huge dependency graphs, long pipelines, repeated execution, memory pressure.
---

# Stress Test Runner

> Evaluate only. Never modify framework components. Never regenerate workers. Never execute benchmarks in packaging milestone.

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/` (alias `pipeline/`), `artifacts/`, `schemas/`, `templates/`, `reports/`, `knowledge/`, `specifications/`, `registry/`

## Produces

`qualification/benchmarks/stress-test-runner/` → `qualification-finding` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `large-repository` | Owned per RACI |
| `monorepo` | Owned per RACI |
| `microservice` | Owned per RACI |
| `huge-dependency-graph` | Owned per RACI |
| `long-pipeline` | Owned per RACI |
| `repeated-execution` | Owned per RACI |
| `memory-pressure` | Owned per RACI |

See `pipelines/qualification-framework/RACI.md`.

## Procedure

1. Select stress profiles from catalog (large, monorepo, microservice, huge-dependency-graph).
2. Plan long-pipeline, repeated-execution, memory-pressure scenarios with stop conditions.
3. Record expected failure-recovery observables without executing.
4. Seven entry_kinds required or UNKNOWN.
5. Never modify framework under stress plans.

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
