# AIOS Release Notes — 0.7.0

**Date:** 2026-08-01  
**Phase:** Validation Engine packaging  
**Scope:** `core/packages/pipelines/validation-engine/` and related core/packages/workers/skills/schemas/folders  
**Non-goals:** Execute validations, Feature Workers, invent missing info, mutate source artifacts, redesign unrelated pipelines

## Summary

Adds the Validation Engine: ten discovery-class workers that will later automatically validate AIOS artifacts (structure, schemas, dependencies, traceability, completeness, consistency, pipeline registration, quality scores, and PASS/FAIL reports).

**This release does not execute validations** and does not modify existing Product RE / Solution Architecture / Specification Engineering produce artifacts (SA `governance/quality/` templates remain intact; scorecards live under `governance/quality/validation-scorecard/`).

## Added

| Area | Detail |
|------|--------|
| Pipeline | `core/packages/pipelines/validation-engine/` — 10 workers · 6 waves · 27 edges |
| Workers | `artifact-validator`, `schema-validator`, `dependency-validator`, `pipeline-validator`, `traceability-validator`, `completeness-validator`, `consistency-validator`, `quality-scoring-engine`, `validation-orchestrator`, `validation-reporter` |
| I/O | Consume `core/packages/schemas/`, `artifacts/`, `core/packages/workers/`, `core/packages/pipelines/`, `artifacts/execution/`, `core/packages/templates/`, `artifacts/knowledge/`; produce `artifacts/validation/`, `artifacts/reports/`, `artifacts/scores/` (+ additive `governance/quality/validation-scorecard/`) |
| Contract | `core/packages/contracts/validation-engine.md` |
| Schemas | `validation-engine-payload.schema.json` + typed wrappers |
| Gates | `validation-engine-schema-check` / `validation-engine-coverage-review` (+ rubric) |
| Knowledge | `validateValidationEnginePipelineRegistration()` |
| Smoke | `npm run aios:validation-engine:smoke` |

## Invariants

- Never modify source artifacts
- Never invent missing information
- Every finding: validation_id, target, rule, result, evidence, severity, recommendation, confidence, traceability, unknowns
- Partial + incremental supported via extensions
- Feature Workers still forbidden; Core still does not invoke workers

## Verification

```bash
npm run aios:validation-engine:smoke
npm run aios:discovery:smoke
npm run aios:specification-engineering:smoke
```
