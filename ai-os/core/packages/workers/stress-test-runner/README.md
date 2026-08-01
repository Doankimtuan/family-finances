# Worker — `stress-test-runner`

> **Pipeline:** `qualification-framework` · **Status:** draft · **Evaluate only — never modify framework**  
> **Primary output:** `qualification-finding`

## Mission

Plan stress tests: large repos, monorepos, microservices, huge dependency graphs, long pipelines, repeated execution, memory pressure.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `stress-test-runner` |
| Pipeline | `qualification-framework` |
| Skill | `stress-test-runner` |
| Partition | `governance/qualification/benchmarks/stress-test-runner/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`

## Produces

`governance/qualification/benchmarks/stress-test-runner/` → `qualification-finding`

## Modes

- Large Repository
- Monorepo
- Microservice
- Huge Dependency Graph
- Long Pipeline
- Repeated Execution
- Memory Pressure

## References

- `core/packages/contracts/qualification-framework.md`
- `core/packages/pipelines/qualification-framework/`
- `core/packages/schemas/qualification-framework-payload.schema.json`
