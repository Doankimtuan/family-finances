# Validation Engine Pipeline

**Status:** draft · **Workers packaged only (not executed)** · **Feature Workers:** forbidden · **Mutate sources:** forbidden  
**Version:** 0.1.1 · **Framework:** 0.7.1 (HOLD remediation)

## Workers / Waves

| Wave | Workers | Produces |
|------|---------|----------|
| 0 | `artifact-validator`, `schema-validator` | `validation/<worker_id>/` |
| 1 | `dependency-validator`, `pipeline-validator` | `validation/<worker_id>/` |
| 2 | `traceability-validator`, `completeness-validator`, `consistency-validator` | `validation/<worker_id>/` |
| 3 | `quality-scoring-engine` | `scores/` (+ optional `quality/validation-scorecard/` mirror) |
| 4 | `validation-orchestrator` | `validation/` (`validation-status` merge) |
| 5 | `validation-reporter` | `reports/` (`validation-report`) |

Edges: 27 · RACI: [RACI.md](./RACI.md)

## Rules

- Never modify source artifacts; never invent missing information.
- Findings require `folder_mirror` under `validation/<worker_id>/`.
- Scores require all **9** dimensions + `score_value`.
- Report requires summary + severity bands + recommended-fix + decision.
- Gate output type: **`gate-validation-report`** (≠ worker `validation-report`).
- Order owner: **`pipeline.waves`** (orchestrator records + merges).
- Packaging milestone: **do not execute**.

## Smoke

`npm run aios:validation-engine:smoke`

## Contract

`contracts/validation-engine.md`
