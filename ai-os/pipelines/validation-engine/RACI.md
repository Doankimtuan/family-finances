# Validation Engine — Finding Ownership RACI

> Resolves overlap between specialized validators writing into `validation/`.

| Concern / entry_kind family | artifact | schema | dependency | pipeline | traceability | completeness | consistency | scoring | orchestrator | reporter |
|-----------------------------|----------|--------|------------|----------|--------------|--------------|-------------|---------|--------------|----------|
| folder / files / naming / output-location / artifact-contract | **R/A** | C | I | I | I | C | I | I | I | I |
| json-schema / required-fields / data-types / schema-compat | C | **R/A** | I | I | I | C | I | I | I | I |
| worker/pipeline deps, circular, invalid-reference | I | I | **R/A** | C | I | I | I | I | I | I |
| waves, registration, lifecycle, resume, incremental | I | I | C | **R/A** | I | I | I | I | C | I |
| feature/business/arch/req/knowledge trace + orphan | I | I | I | I | **R/A** | C | C | I | I | I |
| missing-document/field/module/spec/worker/example/schema | I | C | I | I | C | **R/A** | I | I | I | I |
| contradiction / duplication / conflicting-* / naming-inconsistency | I | I | I | I | C | I | **R/A** | I | I | I |
| 9 quality score dimensions | I | I | I | I | I | I | I | **R/A** | C | C |
| plan / order / merge / overall-status / partial / incremental status | I | I | I | C | I | I | I | C | **R/A** | C |
| summary / severity bands / recommended-fix / PASS-FAIL decision | I | I | I | I | I | I | I | C | C | **R/A** |

**R** = Responsible · **A** = Accountable · **C** = Consulted · **I** = Informed

## Partition + merge

1. Each finding writer writes under `validation/<worker_id>/` (`folder_mirror` required).
2. `validation-orchestrator` merges `validation/*/…` findings + `scores/` into `validation-status` (does not rewrite finding files).
3. `validation-reporter` reads merged status + scores → `reports/` as `validation-report`.
4. Gate packages under `validators/` emit **`gate-validation-report`** — not worker `validation-report`.

## Order ownership

`pipeline.json` **waves** own execution order. Orchestrator **records** that order (`plan`/`order` entries) and merges; it does not re-plan waves at runtime in this packaging milestone.
