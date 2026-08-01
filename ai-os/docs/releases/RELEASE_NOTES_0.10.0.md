# AIOS Release Notes — 0.10.0

**Date:** 2026-08-01  
**Phase:** Sprint 10 Qualification Framework  
**Scope:** `core/packages/pipelines/qualification-framework/`, `governance/qualification/`, ten qualification workers, schemas, registries, reference project catalog

## Summary

Introduces the **Qualification Framework** — objective evaluation, benchmarking, stress testing, and certification of AIOS using reference projects. Packaging only: **benchmarks are not executed**.

## Components

| Worker | Purpose |
|--------|---------|
| `reference-project-catalog` | 14 reference project classes + ground truth / thresholds |
| `benchmark-runner` | Full / incremental / partial / comparison / repeatability plans |
| `qualification-runner` | Pipeline, worker, artifact, knowledge, spec, stability suites |
| `evaluation-engine` | Accuracy through documentation-quality dimensions |
| `stress-test-runner` | Large / monorepo / microservice / memory / long-pipeline stress |
| `metrics-engine` | Coverage, performance, reliability scorecards |
| `coverage-analyzer` | Missing feature/rule/API/spec/traceability gaps |
| `regression-runner` | Version comparison / breaking-change detection |
| `certification-engine` | Matrices, maturity, release recommendation |
| `release-qualification-board` | PASS/FAIL, Go/No-Go, production readiness |

## Output layout

```
governance/qualification/
├── benchmarks/
├── metrics/
├── certification/
├── artifacts/reports/
├── scorecards/
├── reference-projects/   # 14 planned project stubs
├── release/
└── core/packages/templates/
```

## Certification thresholds (documented)

| Metric | Threshold |
|--------|-----------|
| Feature Discovery Recall | >= 95% |
| Business Rule Coverage | >= 90% |
| Specification Completeness | >= 95% |
| Traceability | >= 100% |
| Critical Failures | == 0 |
| Pipeline Completion | >= 99% |
| Worker Reliability | >= 98% |
| Documentation Coverage | >= 95% |

## Artifact types

- `qualification-finding`
- `qualification-scores`
- `certification-report`
- `release-qualification-decision`
- `gate-qualification-report`

## Compatibility

- Prior pipelines and workers unchanged (read-only consumes)
- Pipeline id `qualification-framework`; 10 new worker ids only
- Evaluate-only invariants: never mutate framework, never regenerate workers

## Verification

```bash
npm run aios:qualification-framework:smoke
npm run aios:framework-generator:smoke
npm run aios:review-engine:smoke
npm run aios:validation-engine:smoke
npm run aios:discovery:smoke
```

Benchmarks were **not** executed.
