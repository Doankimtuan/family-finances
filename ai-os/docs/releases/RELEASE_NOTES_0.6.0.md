# Release Notes — 0.6.0

**Date:** 2026-08-01  
**Theme:** Specification Engineering workers packaged (not executed)

## Summary

Adds the Specification Engineering pipeline: four discovery-class workers that will later transform validated Product RE + Solution Architecture artifacts into implementation-ready specifications, task graphs, roadmaps, and implementation plans.

**This release does not execute those workers and does not generate Family Finances project specifications.**

## Added

| Area | Detail |
|------|--------|
| Pipeline | `core/packages/pipelines/specification-engineering/` (4 workers · 4 waves · 6 edges) |
| Workers | `specification-generator` → `artifacts/specifications/` |
| | `task-generator` → `artifacts/tasks/` |
| | `roadmap-generator` → `artifacts/roadmap/` |
| | `implementation-planner` → `artifacts/implementation/` |
| Soft input | `artifacts/repository/` (`repository-notes`) |
| Schemas | `specification-engineering-payload.schema.json` + typed wrappers |
| Gates | `specification-engineering-schema-check` / `specification-engineering-coverage-review` |
| Knowledge | `validateSpecificationEngineeringPipelineRegistration()` |
| Smoke | `npm run aios:specification-engineering:smoke` |

## Invariants

- Never invent business logic, redesign the system, or change requirements
- Logical `docs/architecture/` → `artifacts/product-architecture/` (+ soft `artifacts/architecture-v2/`)
- Every entry: `source_paths`, `confidence`, `traceability`, `unknowns` (`UNKNOWN: …`)
- Never overwrite validated upstream artifacts
- Feature Workers still forbidden; Core still does not invoke workers

## Smoke

```bash
npm run aios:specification-engineering:smoke
npm run aios:discovery:smoke
npm run aios:solution-architecture:smoke
```
