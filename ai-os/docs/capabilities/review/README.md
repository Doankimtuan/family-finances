# Capability — `review`

**Title:** Review  
**Pipeline:** `review-engine`  
**Board decision:** GENERALIZE

## Purpose

Qualitative multi-dimension review + governance decision

## @Run commands

- `@Run review`
- `@Run full`

## Implementation workers (packaging detail)

- `architecture-reviewer`
- `product-reviewer`
- `business-reviewer`
- `specification-reviewer`
- `documentation-reviewer`
- `maintainability-reviewer`
- `scalability-reviewer`
- `extensibility-reviewer`
- `ai-quality-reviewer`
- `review-orchestrator`
- `final-decision-board`

## Future simplification

Collapse 9 reviewers into rubric-driven review-engine; keep orchestrator+board

