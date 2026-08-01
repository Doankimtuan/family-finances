---
name: metrics-engine
description: Plan collection of coverage, performance, and reliability metrics including recall, token usage, failure rate, retry count, and confidence distribution.
---

# Metrics Engine

> Evaluate only. Never modify framework components. Never regenerate workers. Never execute benchmarks in packaging milestone.

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/` (alias `pipeline/`), `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`, `core/packages/registry/`

## Produces

`governance/qualification/metrics/metrics-engine/` → `qualification-scores` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `repository-coverage` | Owned per RACI |
| `feature-coverage` | Owned per RACI |
| `business-rule-coverage` | Owned per RACI |
| `api-coverage` | Owned per RACI |
| `database-coverage` | Owned per RACI |
| `ui-coverage` | Owned per RACI |
| `specification-coverage` | Owned per RACI |
| `traceability-coverage` | Owned per RACI |
| `execution-time` | Owned per RACI |
| `token-usage` | Owned per RACI |
| `failure-rate` | Owned per RACI |
| `retry-count` | Owned per RACI |
| `confidence-distribution` | Owned per RACI |

See `core/packages/pipelines/qualification-framework/RACI.md`.

## Procedure

1. Consume evaluation-engine + qualification-runner evidence.
2. Emit qualification-scores with metric_id, metric_value (or UNKNOWN), unit, threshold, result.
3. Cover coverage metrics, performance (execution-time, token-usage), reliability (failure-rate, retry-count, confidence-distribution).
4. All 13 metric entry_kinds represented or UNKNOWN.
5. CSV/JSON scorecard paths planned under governance/qualification/metrics/ and scorecards/.

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
