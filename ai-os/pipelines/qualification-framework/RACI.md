# RACI — Qualification Framework

Complete entry_kind ownership. Workers must not emit kinds owned by another worker.

| entry_kind | Owner |
|------------|-------|
| `catalog-entry` | `reference-project-catalog` |
| `ground-truth` | `reference-project-catalog` |
| `expected-outputs` | `reference-project-catalog` |
| `expected-metrics` | `reference-project-catalog` |
| `expected-specifications` | `reference-project-catalog` |
| `acceptance-threshold` | `reference-project-catalog` |
| `full-analysis` | `benchmark-runner` |
| `incremental-analysis` | `benchmark-runner` |
| `partial-analysis` | `benchmark-runner` |
| `repository-comparison` | `benchmark-runner` |
| `repeatability-test` | `benchmark-runner` |
| `benchmark-report-plan` | `benchmark-runner` |
| `pipeline-execution` | `qualification-runner` |
| `worker-cooperation` | `qualification-runner` |
| `artifact-integrity` | `qualification-runner` |
| `knowledge-integrity` | `qualification-runner` |
| `specification-integrity` | `qualification-runner` |
| `execution-stability` | `qualification-runner` |
| `accuracy` | `evaluation-engine` |
| `completeness` | `evaluation-engine` |
| `consistency` | `evaluation-engine` |
| `traceability` | `evaluation-engine` |
| `maintainability` | `evaluation-engine` |
| `extensibility` | `evaluation-engine` |
| `ai-reliability` | `evaluation-engine` |
| `documentation-quality` | `evaluation-engine` |
| `large-repository` | `stress-test-runner` |
| `monorepo` | `stress-test-runner` |
| `microservice` | `stress-test-runner` |
| `huge-dependency-graph` | `stress-test-runner` |
| `long-pipeline` | `stress-test-runner` |
| `repeated-execution` | `stress-test-runner` |
| `memory-pressure` | `stress-test-runner` |
| `repository-coverage` | `metrics-engine` |
| `feature-coverage` | `metrics-engine` |
| `business-rule-coverage` | `metrics-engine` |
| `api-coverage` | `metrics-engine` |
| `database-coverage` | `metrics-engine` |
| `ui-coverage` | `metrics-engine` |
| `specification-coverage` | `metrics-engine` |
| `traceability-coverage` | `metrics-engine` |
| `execution-time` | `metrics-engine` |
| `token-usage` | `metrics-engine` |
| `failure-rate` | `metrics-engine` |
| `retry-count` | `metrics-engine` |
| `confidence-distribution` | `metrics-engine` |
| `missing-features` | `coverage-analyzer` |
| `missing-business-rules` | `coverage-analyzer` |
| `missing-apis` | `coverage-analyzer` |
| `missing-requirements` | `coverage-analyzer` |
| `missing-specifications` | `coverage-analyzer` |
| `missing-relationships` | `coverage-analyzer` |
| `missing-traceability` | `coverage-analyzer` |
| `regression` | `regression-runner` |
| `lost-capability` | `regression-runner` |
| `quality-drop` | `regression-runner` |
| `performance-drop` | `regression-runner` |
| `output-difference` | `regression-runner` |
| `breaking-change` | `regression-runner` |
| `certification-report` | `certification-engine` |
| `capability-matrix` | `certification-engine` |
| `quality-matrix` | `certification-engine` |
| `coverage-matrix` | `certification-engine` |
| `reliability-matrix` | `certification-engine` |
| `maturity-assessment` | `certification-engine` |
| `release-recommendation` | `certification-engine` |
| `pass-fail` | `release-qualification-board` |
| `go-no-go` | `release-qualification-board` |
| `release-candidate-decision` | `release-qualification-board` |
| `known-limitations` | `release-qualification-board` |
| `production-readiness` | `release-qualification-board` |
| `improvement-backlog` | `release-qualification-board` |

## Overlap resolution

| Concern | Owner | Not owner |
|---------|-------|-----------|
| Ground truth / catalog | reference-project-catalog | all runners |
| Benchmark execution plans | benchmark-runner | evaluation-engine |
| Metric collection | metrics-engine | coverage-analyzer |
| Gap identification | coverage-analyzer | metrics-engine |
| Certification thresholds | certification-engine | release-qualification-board (consumes) |
| Go/No-Go decision | release-qualification-board | certification-engine |

**Never modify framework components. Never regenerate workers. Evaluate only.**

Packaging only — benchmarks not executed.
