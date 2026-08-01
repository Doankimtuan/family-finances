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
| Partition | `qualification/benchmarks/qualification-runner/` |

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `artifacts/`, `schemas/`, `templates/`, `reports/`, `knowledge/`, `specifications/`

## Produces

`qualification/benchmarks/qualification-runner/` → `qualification-finding`

## Modes

- Pipeline Execution
- Worker Cooperation
- Artifact Integrity
- Knowledge Integrity
- Specification Integrity
- Execution Stability

## References

- `contracts/qualification-framework.md`
- `pipelines/qualification-framework/`
- `schemas/qualification-framework-payload.schema.json`
