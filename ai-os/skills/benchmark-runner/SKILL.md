---
name: benchmark-runner
description: Plan execution of the complete AIOS against benchmark repositories: full, incremental, partial, comparison, and repeatability modes. Never modify framework; never execute in packaging.
---

# Benchmark Runner

> Evaluate only. Never modify framework components. Never regenerate workers. Never execute benchmarks in packaging milestone.

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/` (alias `pipeline/`), `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`, `core/packages/registry/`

## Produces

`governance/qualification/benchmarks/benchmark-runner/` → `qualification-finding` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `full-analysis` | Owned per RACI |
| `incremental-analysis` | Owned per RACI |
| `partial-analysis` | Owned per RACI |
| `repository-comparison` | Owned per RACI |
| `repeatability-test` | Owned per RACI |
| `benchmark-report-plan` | Owned per RACI |

See `core/packages/pipelines/qualification-framework/RACI.md`.

## Procedure

1. Load catalog from reference-project-catalog partition evidence.
2. For every catalog project, plan five mandatory modes: full, incremental, partial, resume, retry (map resume/retry under full-analysis extensions or dedicated plan notes).
3. Also plan repository-comparison and repeatability-test entries.
4. Cite core/packages/workers/, core/packages/pipelines/, core/packages/schemas/ as soft consumes; never mutate them.
5. Emit benchmark-report-plan summarizing planned report paths under governance/qualification/benchmarks/.

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
