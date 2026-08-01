# Worker — `final-decision-board`

> **Pipeline:** `review-engine` · **Status:** draft · **Never modify artifacts** · **Never regenerate outputs** · **Never validate schemas**  
> **Primary output:** `governance-decision`

## Mission

Collect all review reports; generate overall recommendation, critical risks, improvement plan, go/no-go, and release recommendation.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `final-decision-board` |
| Pipeline | `review-engine` |
| Depends on | review-orchestrator |
| Skill | `final-decision-board` |

## Consumes

`artifacts/`, `validation/`, `reports/`, `scores/`, `knowledge/`, `specifications/`, `pipelines/`, `reviews/`, `governance/`

## Produces

`decisions/`, `recommendations/`, `improvements/`, `governance/`

## Rules

1. Qualitative review only — structured `entries[]` with review_id, target, finding, evidence, impact, severity, recommendation, alternative_solution, confidence, traceability.
2. Never modify source artifacts; never regenerate outputs; never run schema validation; never invent missing data.
3. Always explain reasoning; provide evidence and alternative solutions; prioritize findings.
4. Support partial/incremental review via extensions.

## References

- `contracts/review-engine.md`
- `pipelines/review-engine/`
- `schemas/review-engine-payload.schema.json`
