---
name: coverage-analyzer
description: Identify missing features, business rules, APIs, requirements, specifications, relationships, and traceability gaps against ground truth.
---

# Coverage Analyzer

> Evaluate only. Never modify framework components. Never regenerate workers. Never execute benchmarks in packaging milestone.

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/` (alias `pipeline/`), `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`, `core/packages/registry/`

## Produces

`governance/qualification/metrics/coverage-analyzer/` → `qualification-finding` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `missing-features` | Owned per RACI |
| `missing-business-rules` | Owned per RACI |
| `missing-apis` | Owned per RACI |
| `missing-requirements` | Owned per RACI |
| `missing-specifications` | Owned per RACI |
| `missing-relationships` | Owned per RACI |
| `missing-traceability` | Owned per RACI |

See `core/packages/pipelines/qualification-framework/RACI.md`.

## Procedure

1. Diff ground-truth from catalog against planned evaluation/metrics results.
2. Emit missing-* findings with severity; critical when certification threshold would fail.
3. Traceability gaps are always critical (threshold 100%).
4. Seven gap entry_kinds required.
5. Never regenerate missing artifacts — report only.

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
