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
| Partition | `qualification/benchmarks/stress-test-runner/` |

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `artifacts/`, `schemas/`, `templates/`, `reports/`, `knowledge/`, `specifications/`

## Produces

`qualification/benchmarks/stress-test-runner/` → `qualification-finding`

## Modes

- Large Repository
- Monorepo
- Microservice
- Huge Dependency Graph
- Long Pipeline
- Repeated Execution
- Memory Pressure

## References

- `contracts/qualification-framework.md`
- `pipelines/qualification-framework/`
- `schemas/qualification-framework-payload.schema.json`
