# AIOS Release Notes — 0.8.0

**Date:** 2026-08-01  
**Phase:** Review Engine packaging  
**Scope:** `core/packages/pipelines/review-engine/` and related core/packages/workers/skills/schemas/folders  
**Non-goals:** Execute reviews, Feature Workers, mutate artifacts, regenerate outputs, validate schemas, invent missing data

## Summary

Adds the Review Engine: eleven discovery-class workers for critical engineering governance review of validated AIOS artifacts (architecture, product, business, specifications, documentation, maintainability, scalability, extensibility, AI quality, orchestration, and final go/no-go).

**This release does not execute reviews.**

## Added

| Area | Detail |
|------|--------|
| Pipeline | `core/packages/pipelines/review-engine/` — 11 workers · 3 waves · 10 edges |
| Reviewers | `architecture-reviewer`, `product-reviewer`, `business-reviewer`, `specification-reviewer`, `documentation-reviewer`, `maintainability-reviewer`, `scalability-reviewer`, `extensibility-reviewer`, `ai-quality-reviewer` |
| Orchestration | `review-orchestrator`, `final-decision-board` |
| I/O | Consume artifacts/validation/reports/scores + artifacts/knowledge/specifications; produce governance/reviews/governance/recommendations/decisions/improvements |
| Contract | `core/packages/contracts/review-engine.md` |
| Schemas | `review-engine-payload.schema.json` + typed wrappers |
| Gates | `review-engine-schema-check` / `review-engine-coverage-review` (+ rubric) |
| Smoke | `npm run aios:review-engine:smoke` |

## Invariants

- Never modify source artifacts
- Never regenerate outputs
- Never validate schemas (assume prior validation passed)
- Never invent missing information
- Every review entry: review_id, target, finding, evidence, impact, severity, recommendation, alternative_solution, confidence, traceability
- 10-dimension review scoring
- Feature Workers forbidden; Core does not invoke workers

## Verification

```bash
npm run aios:review-engine:smoke
npm run aios:validation-engine:smoke
npm run aios:discovery:smoke
```
