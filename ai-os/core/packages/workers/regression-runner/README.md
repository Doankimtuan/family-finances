# Worker — `regression-runner`

> **Pipeline:** `qualification-framework` · **Status:** draft · **Evaluate only — never modify framework**  
> **Primary output:** `qualification-finding`

## Mission

Compare framework versions to detect regression, lost capabilities, governance/quality/performance drops, output differences, and breaking changes.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `regression-runner` |
| Pipeline | `qualification-framework` |
| Skill | `regression-runner` |
| Partition | `governance/qualification/benchmarks/regression-runner/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`

## Produces

`governance/qualification/benchmarks/regression-runner/` → `qualification-finding`

## Modes

- Version Diff
- Capability Diff
- Quality Diff
- Performance Diff
- Output Diff
- Breaking Change

## References

- `core/packages/contracts/qualification-framework.md`
- `core/packages/pipelines/qualification-framework/`
- `core/packages/schemas/qualification-framework-payload.schema.json`
