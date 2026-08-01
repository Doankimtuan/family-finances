---
name: certification-engine
description: Evaluate framework against certification thresholds and emit certification report, capability/quality/coverage/reliability matrices, maturity assessment, and release recommendation.
---

# Certification Engine

> Evaluate only. Never modify framework components. Never regenerate workers. Never execute benchmarks in packaging milestone.

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/` (alias `pipeline/`), `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`, `core/packages/registry/`

## Produces

`governance/qualification/certification/certification-engine/` → `certification-report` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `certification-report` | Owned per RACI |
| `capability-matrix` | Owned per RACI |
| `quality-matrix` | Owned per RACI |
| `coverage-matrix` | Owned per RACI |
| `reliability-matrix` | Owned per RACI |
| `maturity-assessment` | Owned per RACI |
| `release-recommendation` | Owned per RACI |

See `core/packages/pipelines/qualification-framework/RACI.md`.

## Procedure

1. Aggregate metrics, coverage, regression, stress, qualification evidence.
2. Apply certification thresholds; fail closed on critical_failures > 0 or unmet thresholds.
3. Emit certification-report + four matrices + maturity-assessment + release-recommendation.
4. Matrices as structured entries with folder_mirror under governance/qualification/certification/.
5. Seven entry_kinds required.

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
