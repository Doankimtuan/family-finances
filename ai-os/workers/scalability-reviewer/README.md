# Worker — `scalability-reviewer`

> **Pipeline:** `review-engine` · **Status:** draft · **Never modify artifacts** · **Never regenerate outputs** · **Never validate schemas**  
> **Primary output:** `review-finding`

## Mission

Review architecture scalability, deployment scalability, performance risks, and future growth.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `scalability-reviewer` |
| Pipeline | `review-engine` |
| Depends on | — |
| Skill | `scalability-reviewer` |

## Consumes

`artifacts/`, `validation/`, `reports/`, `scores/`, `knowledge/`, `specifications/`, `pipelines/`

## Produces

`reviews/`

## Rules

1. Qualitative review only — structured `entries[]` with review_id, target, finding, evidence, impact, severity, recommendation, alternative_solution, confidence, traceability.
2. Never modify source artifacts; never regenerate outputs; never run schema validation; never invent missing data.
3. Always explain reasoning; provide evidence and alternative solutions; prioritize findings.
4. Support partial/incremental review via extensions.

## References

- `contracts/review-engine.md`
- `pipelines/review-engine/`
- `schemas/review-engine-payload.schema.json`
