---
name: evaluation-engine
description: Plan evaluation of every generated artifact for accuracy, completeness, consistency, traceability, maintainability, extensibility, AI reliability, and documentation quality.
---

# Evaluation Engine

> Evaluate only. Never modify framework components. Never regenerate workers. Never execute benchmarks in packaging milestone.

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/` (alias `pipeline/`), `artifacts/`, `schemas/`, `templates/`, `reports/`, `knowledge/`, `specifications/`, `registry/`

## Produces

`qualification/metrics/evaluation-engine/` → `qualification-finding` (required `folder_mirror` under partition)

## Ownership

### Rule catalog (owns)
| entry_kind | Rule |
|------|------|
| `accuracy` | Owned per RACI |
| `completeness` | Owned per RACI |
| `consistency` | Owned per RACI |
| `traceability` | Owned per RACI |
| `maintainability` | Owned per RACI |
| `extensibility` | Owned per RACI |
| `ai-reliability` | Owned per RACI |
| `documentation-quality` | Owned per RACI |

See `pipelines/qualification-framework/RACI.md`.

## Procedure

1. Soft-read planned benchmark artifacts and ground-truth refs.
2. Score dimensions: accuracy, completeness, consistency, traceability, maintainability, extensibility, ai-reliability, documentation-quality.
3. Each dimension entry includes measurement method + acceptance threshold.
4. Prefer path evidence; never invent scores — packaging uses planned metric placeholders with UNKNOWN for measured values.
5. Eight entry_kinds required.

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
