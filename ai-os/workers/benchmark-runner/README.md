# Worker — `benchmark-runner`

> **Pipeline:** `qualification-framework` · **Status:** draft · **Evaluate only — never modify framework**  
> **Primary output:** `qualification-finding`

## Mission

Plan execution of the complete AIOS against benchmark repositories: full, incremental, partial, comparison, and repeatability modes. Never modify framework; never execute in packaging.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `benchmark-runner` |
| Pipeline | `qualification-framework` |
| Skill | `benchmark-runner` |
| Partition | `qualification/benchmarks/benchmark-runner/` |

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `artifacts/`, `schemas/`, `templates/`, `reports/`, `knowledge/`, `specifications/`

## Produces

`qualification/benchmarks/benchmark-runner/` → `qualification-finding`

## Modes

- Full Analysis
- Incremental Analysis
- Partial Analysis
- Repository Comparison
- Repeatability Tests

## References

- `contracts/qualification-framework.md`
- `pipelines/qualification-framework/`
- `schemas/qualification-framework-payload.schema.json`
