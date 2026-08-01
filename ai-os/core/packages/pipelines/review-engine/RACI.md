# Review Engine — RACI (entry_kind level)

> **R** Responsible · **A** Accountable · **C** Consulted · **I** Informed

## Domain rows (summary)

See v0.8.0 matrix; below lists **exclusive entry_kind ownership** per worker.

| Worker | Owns entry_kinds |
|--------|------------------|
| architecture-reviewer | architecture-quality, module-boundaries, layering, patterns, coupling, cohesion, complexity, architecture-decisions |
| product-reviewer | product-vision, feature-coverage, user-journey, business-alignment, missing-product-features |
| business-reviewer | business-rules, workflow-consistency, edge-cases, permission-rules, state-transitions, domain-logic, business-completeness |
| specification-reviewer | specifications, requirements, requirement-coverage, acceptance-criteria, api-contracts, database-contracts, ui-specifications, deployment-specifications, coding-standards, testing-strategy |
| documentation-reviewer | readability, consistency, examples, cross-references, naming, formatting, documentation-quality |
| maintainability-reviewer | code-organization, module-size, separation-of-concerns, future-maintainability, technical-debt-risk |
| scalability-reviewer | architecture-scalability, deployment-scalability, performance-risks, future-growth |
| extensibility-reviewer | plugin-support, customization, future-features, module-isolation, reuse-potential |
| ai-quality-reviewer | prompt-quality, worker-responsibilities, pipeline-design, artifact-design, execution-model, hallucination-risks, traceability-review, ai-reliability |
| review-orchestrator | plan, order, merge, dedupe, overall-status, consolidated-result, partial, incremental + review-scores dimensions |
| final-decision-board | summary, overall-recommendation, critical-risks, improvement-plan, go-no-go, release-recommendation, decision |

## Resolved overlaps (v0.8.1)

- Removed `extensibility-review`, `scalability-review` from architecture-reviewer
- Moved `requirement-coverage`, `acceptance-criteria` to specification-reviewer
- documentation-reviewer does not own coding-standards / testing-strategy body

## Partition

- Findings: `governance/reviews/<worker_id>/` + `folder_mirror`
- Governance: `decisions|recommendations|improvements|governance/final-decision-board/` + `folder_mirror`
- Orchestrator dual emit: `sample-primary-payload.json` (status) + `sample-secondary-payload.json` (scores)

## Dedupe (orchestrator)

Key: `review_id` + `target` + `entry_kind` — keep highest severity.

## NO-GO (decision board)

**NO-GO** if any merged `review-finding` has `severity=critical` unresolved; else **GO** with conditions.
