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
| Partition | `governance/qualification/benchmarks/benchmark-runner/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`

## Produces

`governance/qualification/benchmarks/benchmark-runner/` → `qualification-finding`

## Modes

- Full Analysis
- Incremental Analysis
- Partial Analysis
- Repository Comparison
- Repeatability Tests

## References

- `core/packages/contracts/qualification-framework.md`
- `core/packages/pipelines/qualification-framework/`
- `core/packages/schemas/qualification-framework-payload.schema.json`
