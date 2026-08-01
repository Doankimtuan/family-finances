# Qualification Framework

**Pipeline:** `qualification-framework` · **Framework:** 0.10.0

Objective evaluation, benchmarking, stress testing, and certification of AIOS.

## Layout

| Path | Purpose |
|------|---------|
| `benchmarks/` | Benchmark / qualification / stress / regression partitions |
| `metrics/` | Evaluation + metrics + coverage partitions |
| `certification/` | Certification engine outputs |
| `reports/` | Aggregated human reports |
| `scorecards/` | Metric scorecards (JSON/CSV plans) |
| `reference-projects/` | Catalog + ground-truth plans |
| `release/` | Release Qualification Board decisions |
| `templates/` | Report templates per worker |

## Invariants

- Never modify framework components
- Never regenerate workers
- Evaluate only
- Do not execute benchmarks in packaging milestone
