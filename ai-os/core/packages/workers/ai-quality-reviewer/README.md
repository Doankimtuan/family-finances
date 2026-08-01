# Worker — `ai-quality-reviewer`

> **Pipeline:** `review-engine` · **Status:** draft · **Never modify artifacts** · **Never regenerate outputs** · **Never validate schemas**  
> **Primary output:** `review-finding`

## Mission

Review prompt quality, worker responsibilities, pipeline design, artifact design, execution model, hallucination risks, traceability, and AI reliability.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `ai-quality-reviewer` |
| Pipeline | `review-engine` |
| Depends on | — |
| Skill | `ai-quality-reviewer` |

## Consumes

`artifacts/`, `artifacts/validation/`, `artifacts/reports/`, `artifacts/scores/`, `artifacts/knowledge/`, `artifacts/specifications/`, `core/packages/pipelines/`

## Produces

`governance/reviews/`

## Rules

1. Qualitative review only — structured `entries[]` with review_id, target, finding, evidence, impact, severity, recommendation, alternative_solution, confidence, traceability.
2. Never modify source artifacts; never regenerate outputs; never run schema validation; never invent missing data.
3. Always explain reasoning; provide evidence and alternative solutions; prioritize findings.
4. Support partial/incremental review via extensions.

## References

- `core/packages/contracts/review-engine.md`
- `core/packages/pipelines/review-engine/`
- `core/packages/schemas/review-engine-payload.schema.json`
