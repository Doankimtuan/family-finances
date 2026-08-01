---
name: release-qualification-board
description: Aggregate all benchmarks into PASS/FAIL, Go/No-Go, release candidate decision, known limitations, production readiness, and improvement backlog.
---

# Release Qualification Board

> Evaluate only. Never modify framework components. Never regenerate workers. Never execute benchmarks in packaging milestone.

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/` (alias `pipeline/`), `artifacts/`, `schemas/`, `templates/`, `reports/`, `knowledge/`, `specifications/`, `registry/`

## Produces

`qualification/release/release-qualification-board/` → `release-qualification-decision` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `pass-fail` | Owned per RACI |
| `go-no-go` | Owned per RACI |
| `release-candidate-decision` | Owned per RACI |
| `known-limitations` | Owned per RACI |
| `production-readiness` | Owned per RACI |
| `improvement-backlog` | Owned per RACI |

See `pipelines/qualification-framework/RACI.md`.

## Procedure

1. Consume certification-engine primary payload.
2. Emit pass-fail, go-no-go, release-candidate-decision, known-limitations, production-readiness, improvement-backlog.
3. GO only if all certification thresholds met and critical_failures == 0.
4. Partition under qualification/release/; mirror scorecards/ and reports/.
5. Six entry_kinds required; packaging sample demonstrates NO-GO with UNKNOWN measured metrics.

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
