---
name: reference-project-catalog
description: Catalog benchmark reference projects with expected outputs, metrics, specifications, ground truth, and acceptance thresholds. Never modify framework components.
---

# Reference Project Catalog

> Evaluate only. Never modify framework components. Never regenerate workers. Never execute benchmarks in packaging milestone.

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/` (alias `pipeline/`), `artifacts/`, `schemas/`, `templates/`, `reports/`, `knowledge/`, `specifications/`, `registry/`

## Produces

`qualification/reference-projects/reference-project-catalog/` → `qualification-finding` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `catalog-entry` | Owned per RACI |
| `ground-truth` | Owned per RACI |
| `expected-outputs` | Owned per RACI |
| `expected-metrics` | Owned per RACI |
| `expected-specifications` | Owned per RACI |
| `acceptance-threshold` | Owned per RACI |

See `pipelines/qualification-framework/RACI.md`.

## Procedure

1. Enumerate required reference project types from contract (14 project classes).
2. For each project class, plan catalog-entry with expected-outputs, expected-metrics, expected-specifications, ground-truth, acceptance-threshold.
3. Bind thresholds from certification requirements; mark absent ground truth as UNKNOWN.
4. Write plans under qualification/reference-projects/ only — never invent repo contents.
5. Emit one entry per owned entry_kind covering all project classes or UNKNOWN per class.

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
