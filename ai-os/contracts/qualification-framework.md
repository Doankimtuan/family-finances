# Qualification Framework Contract

**Version:** 0.10.0 · **Pipeline:** `qualification-framework`

## Invariants

1. **Evaluate only** — never modify framework components.
2. **Never regenerate workers** — prior sprint packages are read-only.
3. **No benchmark execution** in packaging milestone.
4. **Partitioned output** — under `qualification/` via `folder_mirror`.
5. **Valid waves** — topological partition of the hard dependency graph.
6. **Reproducible reports** — support repeated benchmarking and version comparison when execution opens.

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/` (alias `pipeline/`), `artifacts/`, `schemas/`, `templates/`, `reports/`, `knowledge/`, `specifications/`, `registry/`

## Produces

`qualification/` (benchmarks, metrics, certification, reports, scorecards, reference-projects, release, templates)

## Artifact types

- `qualification-finding` — findings / gap / plan entries
- `qualification-scores` — metric scorecards
- `certification-report` — certification matrices + maturity
- `release-qualification-decision` — Go/No-Go board decision
- `gate-qualification-report` — gate envelope

## Benchmark modes (required per reference project when executed)

- Full Reverse Engineering
- Incremental Analysis
- Partial Analysis
- Resume Pipeline
- Retry Pipeline

## Certification thresholds

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

## Reference projects (14)

- `small-react-app`
- `large-react-app`
- `nextjs-app`
- `vue-app`
- `angular-app`
- `node-backend`
- `nestjs-backend`
- `monorepo`
- `microservices`
- `desktop-app`
- `mobile-app`
- `cli-project`
- `library-project`
- `fullstack-project`
