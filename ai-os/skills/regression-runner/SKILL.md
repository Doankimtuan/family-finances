---
name: regression-runner
description: Compare framework versions to detect regression, lost capabilities, governance/quality/performance drops, output differences, and breaking changes.
---

# Regression Runner

> Evaluate only. Never modify framework components. Never regenerate workers. Never execute benchmarks in packaging milestone.

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/` (alias `pipeline/`), `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`, `core/packages/registry/`

## Produces

`governance/qualification/benchmarks/regression-runner/` → `qualification-finding` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `regression` | Owned per RACI |
| `lost-capability` | Owned per RACI |
| `quality-drop` | Owned per RACI |
| `performance-drop` | Owned per RACI |
| `output-difference` | Owned per RACI |
| `breaking-change` | Owned per RACI |

See `core/packages/pipelines/qualification-framework/RACI.md`.

## Procedure

1. Accept baseline_version + candidate_version in generation-spec or config.
2. Plan diffs: regression, lost-capability, quality-drop, performance-drop, output-difference, breaking-change.
3. Cite VERSION + RELEASE_NOTES_* as evidence sources.
4. Six entry_kinds required.
5. Never mutate either framework version under comparison.

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
