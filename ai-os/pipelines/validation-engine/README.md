# Validation Engine Pipeline

**Status:** draft · **Workers packaged only (not executed)** · **Feature Workers:** forbidden · **Mutate sources:** forbidden

## Workers / Waves

| Wave | Workers | Produces |
|------|---------|----------|
| 0 | `artifact-validator`, `schema-validator` | `validation/` |
| 1 | `dependency-validator`, `pipeline-validator` | `validation/` |
| 2 | `traceability-validator`, `completeness-validator`, `consistency-validator` | `validation/` |
| 3 | `quality-scoring-engine` | `scores/` (+ optional `quality/validation-scorecard/` mirror) |
| 4 | `validation-orchestrator` | `validation/` (`validation-status`) |
| 5 | `validation-reporter` | `reports/` |

Edges: 27

## Rules

- Never modify source artifacts.
- Never invent missing information.
- Structured findings with validation_id / target / rule / result / evidence / severity / recommendation / confidence / traceability.
- Partial + incremental supported via extensions.
- Packaging milestone: **do not execute**.

## Smoke

`npm run aios:validation-engine:smoke`

## Contract

`contracts/validation-engine.md`
