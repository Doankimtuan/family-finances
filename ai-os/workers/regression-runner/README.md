# Worker — `regression-runner`

> **Pipeline:** `qualification-framework` · **Status:** draft · **Evaluate only — never modify framework**  
> **Primary output:** `qualification-finding`

## Mission

Compare framework versions to detect regression, lost capabilities, quality/performance drops, output differences, and breaking changes.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `regression-runner` |
| Pipeline | `qualification-framework` |
| Skill | `regression-runner` |
| Partition | `qualification/benchmarks/regression-runner/` |

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `artifacts/`, `schemas/`, `templates/`, `reports/`, `knowledge/`, `specifications/`

## Produces

`qualification/benchmarks/regression-runner/` → `qualification-finding`

## Modes

- Version Diff
- Capability Diff
- Quality Diff
- Performance Diff
- Output Diff
- Breaking Change

## References

- `contracts/qualification-framework.md`
- `pipelines/qualification-framework/`
- `schemas/qualification-framework-payload.schema.json`
