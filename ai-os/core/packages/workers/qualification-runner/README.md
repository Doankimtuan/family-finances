# Worker — `qualification-runner`

> **Pipeline:** `qualification-framework` · **Status:** draft · **Evaluate only — never modify framework**  
> **Primary output:** `qualification-finding`

## Mission

Plan qualification suites verifying pipeline execution, worker cooperation, artifact/knowledge/specification integrity, and execution stability.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `qualification-runner` |
| Pipeline | `qualification-framework` |
| Skill | `qualification-runner` |
| Partition | `governance/qualification/benchmarks/qualification-runner/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`

## Produces

`governance/qualification/benchmarks/qualification-runner/` → `qualification-finding`

## Modes

- Pipeline Execution
- Worker Cooperation
- Artifact Integrity
- Knowledge Integrity
- Specification Integrity
- Execution Stability

## References

- `core/packages/contracts/qualification-framework.md`
- `core/packages/pipelines/qualification-framework/`
- `core/packages/schemas/qualification-framework-payload.schema.json`
